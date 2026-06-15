#!/usr/bin/env python
import os
import django
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NoamHome.settings')
django.setup()

from apps.accounts.models import User
from apps.establishments.models import Establishment, RoomType
from apps.bookings.models import Booking
from apps.bookings.services import booking_nights, decrement_availability, quote_room_type
from apps.payments.models import Payment
from apps.payments.services import confirm_payment

# Récupérer les utilisateurs
guest = User.objects.filter(role='guest').first()
host = User.objects.filter(email='host@test.com').first()

if not guest or not host:
    print("Utilisaires introuvables")
    exit(1)

# Récupérer l'établissement et le type de chambre
establishment = Establishment.objects.filter(host=host).first()
room_type = RoomType.objects.filter(establishment=establishment).first()

if not establishment or not room_type:
    print("Établissement ou type de chambre introuvable")
    exit(1)

# Créer une réservation pour après-demain
check_in = date.today() + timedelta(days=2)
check_out = check_in + timedelta(days=1)

print(f"\nCréation d'une réservation du {check_in} au {check_out}")
print(f"Établissement: {establishment.name}")
print(f"requires_manual_validation: {establishment.requires_manual_validation}")

# Créer la réservation
booking = Booking.objects.create(
    guest=guest,
    room_type=room_type,
    establishment=establishment,
    check_in_date=check_in,
    check_out_date=check_out,
    guest_count_adults=1,
    guest_count_children=0,
    status=Booking.PENDING_PAYMENT,
    subtotal=room_type.base_price_per_night,
    platform_fee=Decimal('0'),
    tax_amount=Decimal('0'),
    total_amount=room_type.base_price_per_night,
    commission_amount=Decimal('0'),
    host_payout=room_type.base_price_per_night,
)

print(f"✓ Réservation créée: {booking.booking_number}")
print(f"  Statut initial: {booking.status}")

# Créer et confirmer le paiement
import uuid
payment = Payment.objects.create(
    booking=booking,
    amount=booking.total_amount,
    payment_method='wave',
    status='succeeded',
    paid_at=django.utils.timezone.now(),
    invoice_number=f"INV-{django.utils.timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
)

print(f"✓ Paiement créé et confirmé")

# Confirmer le paiement (cela mettra à jour le statut de la réservation)
confirm_payment(payment)

# Rafraîchir la réservation
booking.refresh_from_db()

print(f"✓ Réservation mise à jour")
print(f"  Statut final: {booking.status}")
print(f"\n=== RÉSUMÉ ===")
print(f"Réservation: {booking.booking_number}")
print(f"Statut: {booking.status}")
print(f"Client: {guest.email}")
print(f"Hébergeur: {host.email}")
print(f"Établissement: {establishment.name}")
print(f"Dates: {check_in} - {check_out}")
print(f"Montant: {booking.total_amount} XOF")
