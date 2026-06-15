#!/usr/bin/env python
import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NoamHome.settings')
django.setup()

from apps.bookings.models import Booking
from apps.payments.models import Payment
from apps.payments.services import confirm_payment

# Récupérer les réservations en pending_payment
pending_bookings = Booking.objects.filter(status='pending_payment')

print(f"Réservations en pending_payment: {pending_bookings.count()}")

# Pour chaque réservation, créer un paiement et le confirmer
for booking in pending_bookings:
    # Créer un paiement s'il n'existe pas
    payment, created = Payment.objects.get_or_create(
        booking=booking,
        defaults={
            'amount': booking.total_amount,
            'payment_method': 'wave',
            'status': 'succeeded',
            'paid_at': timezone.now(),
        }
    )
    
    if created or payment.status != 'succeeded':
        payment.status = 'succeeded'
        payment.paid_at = timezone.now()
        payment.save()
    
    # Confirmer le paiement (cela mettra à jour le statut de la réservation)
    confirm_payment(payment)
    print(f"✓ {booking.booking_number} mise à jour")

print("\nTerminé")
