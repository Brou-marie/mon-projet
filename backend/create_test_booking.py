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

if not guest:
    print("Création d'un voyageur de test...")
    guest = User.objects.create_user(
        email='guest@test.com',
        password='password123',
        first_name='Kouassi',
        last_name='Yao',
        role='guest'
    )
    print(f"✓ Voyageur créé: {guest.email}")

if not host:
    print("Aucun hébergeur trouvé. Exécutez d'abord create_test_host.py")
    exit(1)

# Récupérer l'établissement et le type de chambre
establishment = Establishment.objects.filter(host=host).first()
room_type = RoomType.objects.filter(establishment=establishment).first()

if not establishment or not room_type:
    print("Aucun établissement ou type de chambre trouvé")
    exit(1)

# Créer une réservation pour demain
check_in = date.today() + timedelta(days=1)
check_out = check_in + timedelta(days=1)

print(f"\nCréation d'une réservation du {check_in} au {check_out}")

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
payment = Payment.objects.create(
    booking=booking,
    amount=booking.total_amount,
    payment_method='wave',
    status='succeeded',
    paid_at=django.utils.timezone.now(),
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
