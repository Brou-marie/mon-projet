from django.db import transaction
from django.utils import timezone
from django.conf import settings
from decimal import Decimal

from apps.bookings.models import Booking
from apps.bookings.services import record_status, restore_availability, set_booking_status
from apps.notifications.services import notify_user
from .models import Payment, Payout, CommissionSetting


@transaction.atomic
def confirm_payment(payment, changed_by=None, provider_reference=''):
    booking = payment.booking

    if payment.status != 'succeeded':
        payment.status = 'succeeded'
        payment.provider_reference = provider_reference or payment.provider_reference
        payment.paid_at = payment.paid_at or timezone.now()
        payment.save(update_fields=('status', 'provider_reference', 'paid_at', 'updated_at'))

    if booking.status != Booking.PAID:
        set_booking_status(
            booking,
            Booking.PAID,
            changed_by=changed_by,
            note='Paiement validé.',
        )

    next_status = (
        Booking.PENDING_HOST_VALIDATION
        if booking.establishment.requires_manual_validation
        else Booking.CONFIRMED
    )
    note = (
        "Paiement reçu, validation de l'hébergeur requise."
        if next_status == Booking.PENDING_HOST_VALIDATION
        else 'Réservation confirmée automatiquement après paiement.'
    )
    set_booking_status(booking, next_status, changed_by=changed_by, note=note)

    notify_user(
        booking.guest,
        'booking_confirmed' if next_status == Booking.CONFIRMED else 'system',
        'Paiement reçu',
        (
            f'Votre réservation {booking.booking_number} est confirmée.'
            if next_status == Booking.CONFIRMED
            else f'Votre réservation {booking.booking_number} attend la validation de l’hébergeur.'
        ),
        {'booking_number': booking.booking_number},
    )
    notify_user(
        booking.establishment.host,
        'booking_confirmed' if next_status == Booking.CONFIRMED else 'system',
        'Nouvelle réservation payée',
        f'La réservation {booking.booking_number} a été payée.',
        {'booking_number': booking.booking_number},
    )
    return payment


@transaction.atomic
def refund_payment(payment, changed_by=None, reason=''):
    if payment.status not in ('succeeded', 'partially_refunded', 'refunded'):
        return payment

    payment.status = 'refunded'
    payment.refunded_at = payment.refunded_at or timezone.now()
    payment.save(update_fields=('status', 'refunded_at', 'updated_at'))

    booking = payment.booking
    booking.refund_amount = payment.amount
    booking.save(update_fields=('refund_amount', 'updated_at'))
    set_booking_status(
        booking,
        Booking.REFUNDED,
        changed_by=changed_by,
        note=reason or 'Remboursement effectué.',
    )
    restore_availability(booking)
    notify_user(
        booking.guest,
        'booking_cancelled',
        'Réservation remboursée',
        f'La réservation {booking.booking_number} a été remboursée.',
        {'booking_number': booking.booking_number},
    )
    return payment


def calculate_commission_amount(payment_amount, commission_percent):
    """Calcule le montant de la commission"""
    return (payment_amount * Decimal(commission_percent)) / Decimal('100')


def get_host_commission_percent(host):
    """Récupère le pourcentage de commission pour un hébergeur"""
    try:
        setting = CommissionSetting.objects.get(host=host, is_active=True)
        return setting.commission_percent
    except CommissionSetting.DoesNotExist:
        # Utiliser la commission par défaut
        return getattr(settings, 'DEFAULT_PLATFORM_COMMISSION_PERCENT', 15)


@transaction.atomic
def process_commission(payment):
    """
    Traite automatiquement la commission sur un paiement réussi
    """
    if payment.status != 'succeeded':
        return None
    
    # Calculer la commission
    commission_percent = get_host_commission_percent(payment.booking.establishment.host)
    commission_amount = calculate_commission_amount(payment.amount, commission_percent)
    host_payout = payment.amount - commission_amount
    
    # Mettre à jour la réservation avec les montants
    payment.booking.platform_fee = commission_amount
    payment.booking.host_payout = host_payout
    payment.booking.save(update_fields=['platform_fee', 'host_payout', 'updated_at'])
    
    # Enregistrer la commission dans les métadonnées du paiement
    payment.metadata = payment.metadata or {}
    payment.metadata['commission'] = {
        'percent': float(commission_percent),
        'amount': float(commission_amount),
        'host_payout': float(host_payout),
    }
    payment.save(update_fields=['metadata', 'updated_at'])
    
    return {
        'commission_percent': commission_percent,
        'commission_amount': commission_amount,
        'host_payout': host_payout,
    }


@transaction.atomic
def create_payout_for_host(host, period_start, period_end):
    """
    Crée un versement pour un hébergeur sur une période donnée
    """
    from apps.bookings.models import Booking
    
    # Récupérer les réservations payées dans la période
    bookings = Booking.objects.filter(
        establishment__host=host,
        status='completed',
        check_out_date__gte=period_start,
        check_out_date__lte=period_end,
    ).select_related('establishment')
    
    if not bookings.exists():
        return None
    
    # Calculer les totaux
    total_amount = sum(b.total_amount for b in bookings)
    total_commission = sum(b.platform_fee for b in bookings)
    net_amount = sum(b.host_payout for b in bookings)
    
    # Créer le versement
    payout = Payout.objects.create(
        host=host,
        amount=total_amount,
        commission_deducted=total_commission,
        net_amount=net_amount,
        period_start=period_start,
        period_end=period_end,
        status='pending'
    )
    
    # Notifier l'hébergeur
    from apps.notifications.services import notify_payout_ready
    notify_payout_ready(payout)
    
    return payout


@transaction.atomic
def generate_invoice(payment):
    """
    Génère une facture pour un paiement
    """
    from .models import Invoice
    
    # Créer la facture
    invoice = Invoice.objects.create(
        payment=payment,
        user=payment.booking.guest,
        amount=payment.amount,
        tax_amount=Decimal('0'),  # À implémenter selon les règles fiscales
        total_amount=payment.amount,
        currency=payment.currency,
        status='draft',
        due_date=timezone.now().date() + timezone.timedelta(days=30)
    )
    
    # Générer le numéro de facture
    invoice.generate_invoice_number()
    
    # Marquer le paiement comme facturé
    payment.invoice_generated = True
    payment.invoice_number = invoice.invoice_number
    payment.save(update_fields=['invoice_generated', 'invoice_number', 'updated_at'])
    
    return invoice


def process_payment_with_commission(payment):
    """
    Traite un paiement complet avec commission et facturation
    """
    # Confirmer le paiement
    confirm_payment(payment)
    
    # Traiter la commission
    commission_data = process_commission(payment)
    
    # Générer la facture
    invoice = generate_invoice(payment)
    
    return {
        'payment': payment,
        'commission': commission_data,
        'invoice': invoice,
    }
