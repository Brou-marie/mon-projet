"""
Tests unitaires — apps.payments

Couvre :
  - services : confirm_payment, refund_payment,
               calculate_commission_amount, get_host_commission_percent
  - API views : PaymentInitView, PaymentSimulateView, PaymentConfirmView
  - Modèle Payment : generate_invoice_number
"""
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.models import User, GuestProfile
from apps.establishments.models import Establishment, RoomType, RoomAvailability
from apps.bookings.models import Booking, BookingStatusHistory
from apps.bookings.services import booking_nights
from apps.payments.models import Payment, CommissionSetting
from apps.payments.services import (
    calculate_commission_amount,
    confirm_payment,
    get_host_commission_percent,
    refund_payment,
)

# ── Helpers ──────────────────────────────────────────────────────────────────

def make_users():
    host = User.objects.create_user(
        email='host@payments.ci', password='pass', role='host',
        first_name='Hôte', last_name='Pay',
    )
    guest = User.objects.create_user(
        email='guest@payments.ci', password='pass', role='guest',
        first_name='Client', last_name='Pay',
    )
    GuestProfile.objects.get_or_create(user=guest)
    return host, guest


def make_setup(requires_manual=False):
    host, guest = make_users()
    etab = Establishment.objects.create(
        host=host, name='Hôtel Pay', description='Desc',
        establishment_type='hotel', address='Abidjan', city='Abidjan',
        status='active', requires_manual_validation=requires_manual,
    )
    room = RoomType.objects.create(
        establishment=etab, name='Chambre',
        base_price_per_night=Decimal('30000'), physical_room_count=3,
    )
    check_in = date.today() + timedelta(days=3)
    check_out = check_in + timedelta(days=2)
    for night in booking_nights(check_in, check_out):
        RoomAvailability.objects.get_or_create(
            room_type=room, date=night,
            defaults={'available_count': 2},
        )
    booking = Booking.objects.create(
        guest=guest, room_type=room, establishment=etab,
        check_in_date=check_in, check_out_date=check_out,
        status=Booking.PENDING_PAYMENT,
        total_amount=Decimal('66000'),
        subtotal=Decimal('60000'),
        base_subtotal=Decimal('60000'),
        platform_fee=Decimal('6000'),
        host_payout=Decimal('54000'),
    )
    payment = Payment.objects.create(
        booking=booking,
        amount=Decimal('66000'),
        payment_method='wave',
        status='pending',
    )
    return host, guest, etab, room, booking, payment


# ════════════════════════════════════════════════════════════════════════════════
# Services
# ════════════════════════════════════════════════════════════════════════════════

class CalculateCommissionTests(TestCase):
    def test_15_pourcent(self):
        result = calculate_commission_amount(Decimal('100000'), Decimal('15'))
        self.assertEqual(result, Decimal('15000'))

    def test_10_pourcent(self):
        result = calculate_commission_amount(Decimal('66000'), Decimal('10'))
        self.assertEqual(result, Decimal('6600'))

    def test_zero_pourcent(self):
        result = calculate_commission_amount(Decimal('50000'), Decimal('0'))
        self.assertEqual(result, Decimal('0'))


class GetHostCommissionPercentTests(TestCase):
    def setUp(self):
        self.host, _ = make_users()

    def test_retourne_defaut_15_sans_setting(self):
        result = get_host_commission_percent(self.host)
        self.assertEqual(result, 15)

    def test_retourne_setting_personalise(self):
        CommissionSetting.objects.create(
            host=self.host,
            commission_percent=Decimal('12'),
            is_active=True,
        )
        result = get_host_commission_percent(self.host)
        self.assertEqual(result, Decimal('12'))

    def test_ignore_setting_inactif(self):
        CommissionSetting.objects.create(
            host=self.host,
            commission_percent=Decimal('5'),
            is_active=False,
        )
        result = get_host_commission_percent(self.host)
        self.assertEqual(result, 15)


class ConfirmPaymentTests(TestCase):
    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking, self.payment = make_setup(
            requires_manual=False
        )

    def test_paiement_passe_a_succeeded(self):
        confirm_payment(self.payment, changed_by=self.guest)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'succeeded')

    def test_paid_at_renseigne(self):
        confirm_payment(self.payment, changed_by=self.guest)
        self.payment.refresh_from_db()
        self.assertIsNotNone(self.payment.paid_at)

    def test_booking_passe_a_confirmed_sans_validation_manuelle(self):
        confirm_payment(self.payment, changed_by=self.guest)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.CONFIRMED)

    def test_provider_reference_sauvegardee(self):
        confirm_payment(self.payment, provider_reference='WV-SIM-ABCD1234')
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.provider_reference, 'WV-SIM-ABCD1234')

    def test_idempotent_si_deja_succeeded(self):
        self.payment.status = 'succeeded'
        self.payment.save()
        confirm_payment(self.payment, changed_by=self.guest)
        # Ne doit pas planter et booking doit être confirmé
        self.booking.refresh_from_db()
        self.assertIn(self.booking.status, [Booking.CONFIRMED, Booking.PAID])

    def test_historique_cree(self):
        confirm_payment(self.payment, changed_by=self.guest)
        hist = BookingStatusHistory.objects.filter(
            booking=self.booking, status=Booking.CONFIRMED
        )
        self.assertTrue(hist.exists())


class ConfirmPaymentManualValidationTests(TestCase):
    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking, self.payment = make_setup(
            requires_manual=True
        )

    def test_booking_passe_a_pending_host_validation(self):
        confirm_payment(self.payment, changed_by=self.guest)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.PENDING_HOST_VALIDATION)


class RefundPaymentTests(TestCase):
    def setUp(self):
        _, _, _, _, self.booking, self.payment = make_setup()
        self.payment.status = 'succeeded'
        self.payment.save()
        self.booking.status = Booking.CONFIRMED
        self.booking.save()

    def test_remboursement_passe_a_refunded(self):
        refund_payment(self.payment)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'refunded')

    def test_refunded_at_renseigne(self):
        refund_payment(self.payment)
        self.payment.refresh_from_db()
        self.assertIsNotNone(self.payment.refunded_at)

    def test_booking_passe_a_refunded(self):
        refund_payment(self.payment)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.REFUNDED)

    def test_ne_rembourse_pas_si_pending(self):
        self.payment.status = 'pending'
        self.payment.save()
        refund_payment(self.payment)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'pending')


# ════════════════════════════════════════════════════════════════════════════════
# Modèle Payment
# ════════════════════════════════════════════════════════════════════════════════

class PaymentModelTests(TestCase):
    def setUp(self):
        _, _, _, _, self.booking, self.payment = make_setup()

    def test_str_contient_montant(self):
        self.assertIn('66000', str(self.payment))

    def test_generate_invoice_number(self):
        num = self.payment.generate_invoice_number()
        self.assertTrue(num.startswith('INV-'))
        self.assertEqual(self.payment.invoice_number, num)

    def test_generate_invoice_number_idempotent(self):
        num1 = self.payment.generate_invoice_number()
        num2 = self.payment.generate_invoice_number()
        self.assertEqual(num1, num2)


# ════════════════════════════════════════════════════════════════════════════════
# API Views
# ════════════════════════════════════════════════════════════════════════════════

class PaymentInitAPITests(APITestCase):
    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking, _ = make_setup()
        # Créer un booking frais sans payment pour les tests d'init
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=2)
        for night in booking_nights(check_in, check_out):
            RoomAvailability.objects.get_or_create(
                room_type=self.room, date=night,
                defaults={'available_count': 2},
            )
        self.booking_fresh = Booking.objects.create(
            guest=self.guest, room_type=self.room, establishment=self.etab,
            check_in_date=check_in, check_out_date=check_out,
            status=Booking.PENDING_PAYMENT,
            total_amount=Decimal('66000'),
            subtotal=Decimal('60000'),
            base_subtotal=Decimal('60000'),
            platform_fee=Decimal('6000'),
            host_payout=Decimal('54000'),
        )

    def test_init_cree_payment_pending(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            '/api/payments/init/',
            {'booking': str(self.booking_fresh.pk), 'payment_method': 'wave'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['status'], 'pending')
        self.assertIn('payment_url', resp.data)
        self.assertIn('/paiement/', resp.data['payment_url'])

    def test_init_interdit_si_non_authentifie(self):
        resp = self.client.post(
            '/api/payments/init/',
            {'booking': str(self.booking_fresh.pk), 'payment_method': 'wave'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_init_refuse_si_pas_son_booking(self):
        autre_guest = User.objects.create_user(
            email='autre@pay.ci', password='pass', role='guest',
        )
        GuestProfile.objects.get_or_create(user=autre_guest)
        self.client.force_authenticate(autre_guest)
        resp = self.client.post(
            '/api/payments/init/',
            {'booking': str(self.booking_fresh.pk), 'payment_method': 'wave'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class PaymentSimulateAPITests(APITestCase):
    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking, self.payment = make_setup()

    def test_simulate_succes(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            '/api/payments/simulate/',
            {'payment_id': str(self.payment.pk), 'method': 'wave', 'success': True},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['payment']['status'], 'succeeded')
        self.assertIn('WV-SIM-', resp.data['provider_reference'])

    def test_simulate_echec(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            '/api/payments/simulate/',
            {
                'payment_id': str(self.payment.pk),
                'method': 'wave',
                'success': False,
                'failure_reason': 'Solde insuffisant',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['payment']['status'], 'failed')

    def test_simulate_sans_payment_id(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            '/api/payments/simulate/', {'method': 'wave'}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_simulate_payment_introuvable(self):
        import uuid
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            '/api/payments/simulate/',
            {'payment_id': str(uuid.uuid4()), 'method': 'wave'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_simulate_idempotent_si_deja_succeeded(self):
        self.payment.status = 'succeeded'
        self.payment.save()
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            '/api/payments/simulate/',
            {'payment_id': str(self.payment.pk), 'method': 'wave'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('déjà été traité', resp.data['detail'])

    def test_prefixes_par_methode(self):
        """Chaque méthode de paiement génère le bon préfixe de référence."""
        prefixes = {
            'wave': 'WV',
            'orange_money': 'OM',
            'momo': 'MTN',
            'moov': 'MV',
            'card': 'CB',
        }
        for idx, (method, prefix) in enumerate(prefixes.items()):
            host = User.objects.create_user(
                email=f'host_pfx_{idx}@payments.ci', password='pass', role='host',
            )
            guest = User.objects.create_user(
                email=f'guest_pfx_{idx}@payments.ci', password='pass', role='guest',
            )
            GuestProfile.objects.get_or_create(user=guest)
            etab = Establishment.objects.create(
                host=host, name=f'Hôtel pfx {idx}',
                description='Desc', establishment_type='hotel',
                address='Abidjan', city='Abidjan', status='active',
            )
            room = RoomType.objects.create(
                establishment=etab, name='Chambre',
                base_price_per_night=Decimal('25000'), physical_room_count=2,
            )
            check_in = date.today() + timedelta(days=3 + idx)
            check_out = check_in + timedelta(days=2)
            for night in booking_nights(check_in, check_out):
                RoomAvailability.objects.get_or_create(
                    room_type=room, date=night, defaults={'available_count': 2}
                )
            booking = Booking.objects.create(
                guest=guest, room_type=room, establishment=etab,
                check_in_date=check_in, check_out_date=check_out,
                status=Booking.PENDING_PAYMENT,
                total_amount=Decimal('55000'), subtotal=Decimal('50000'),
                base_subtotal=Decimal('50000'), host_payout=Decimal('45000'),
            )
            payment = Payment.objects.create(
                booking=booking, amount=Decimal('55000'),
                payment_method=method, status='pending',
            )

            self.client.force_authenticate(guest)
            resp = self.client.post(
                '/api/payments/simulate/',
                {'payment_id': str(payment.pk), 'method': method, 'success': True},
                format='json',
            )
            self.assertEqual(resp.status_code, status.HTTP_200_OK,
                             f"Méthode {method}: status {resp.status_code}")
            ref = resp.data.get('provider_reference', '')
            self.assertTrue(
                ref.startswith(prefix),
                f"Préfixe attendu '{prefix}' pour méthode '{method}', obtenu '{ref}'",
            )


class PaymentConfirmAPITests(APITestCase):
    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking, self.payment = make_setup()

    def test_confirm_succes(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            '/api/payments/confirm/',
            {
                'payment': str(self.payment.pk),
                'provider_reference': 'REF-001',
                'success': True,
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'succeeded')

    def test_confirm_echec(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            '/api/payments/confirm/',
            {
                'payment': str(self.payment.pk),
                'success': False,
                'failure_reason': 'Refusé',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'failed')

    def test_confirm_payment_inconnu(self):
        import uuid
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            '/api/payments/confirm/',
            {'payment': str(uuid.uuid4()), 'success': True},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
