#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NoamHome.settings')
django.setup()

from apps.bookings.models import Booking

print("=== RÉSERVATIONS ===")
bookings = Booking.objects.all()
for b in bookings:
    print(f"- {b.booking_number} | status: {b.status} | guest: {b.guest.email} | establishment: {b.establishment.name}")

print(f"\nTotal réservations: {bookings.count()}")

print("\n=== PAR STATUT ===")
for status in ['pending_payment', 'paid', 'pending_host_validation', 'confirmed', 'in_progress', 'completed']:
    count = bookings.filter(status=status).count()
    if count > 0:
        print(f"{status}: {count}")
