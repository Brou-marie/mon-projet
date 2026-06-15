#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NoamHome.settings')
django.setup()

from apps.accounts.models import User
from apps.establishments.models import Establishment, RoomType, RoomAvailability
from datetime import date, timedelta

# Créer un utilisateur hébergeur
host, created = User.objects.get_or_create(
    email='host@test.com',
    defaults={
        'first_name': 'Jean',
        'last_name': 'Kouassi',
        'role': 'host',
        'is_active': True,
    }
)
if created:
    host.set_password('password123')
    host.save()
    print(f"✓ Hébergeur créé: {host.email}")
else:
    print(f"✓ Hébergeur existe déjà: {host.email}")

# Créer un établissement
establishment, created = Establishment.objects.get_or_create(
    slug='hotel-test-abidjan',
    defaults={
        'host': host,
        'name': 'Hôtel Test Abidjan',
        'description': 'Un bel hôtel situé au cœur d\'Abidjan avec toutes les commodités nécessaires pour un séjour agréable.',
        'establishment_type': 'hotel',
        'address': 'Rue du Commerce, Plateau',
        'city': 'Abidjan',
        'quarter': 'Plateau',
        'status': 'active',
        'cancellation_policy': 'moderate',
    }
)
if created:
    print(f"✓ Établissement créé: {establishment.name}")
else:
    print(f"✓ Établissement existe déjà: {establishment.name}")

# Créer un type de chambre
room_type, created = RoomType.objects.get_or_create(
    establishment=establishment,
    name='Chambre Standard',
    defaults={
        'description': 'Chambre confortable avec vue sur la ville',
        'capacity_adults': 2,
        'capacity_children': 1,
        'base_price_per_night': 25000,
        'physical_room_count': 5,
        'is_active': True,
    }
)
if created:
    print(f"✓ Type de chambre créé: {room_type.name}")
else:
    print(f"✓ Type de chambre existe déjà: {room_type.name}")

# Créer des disponibilités pour les 30 prochains jours
today = date.today()
for i in range(30):
    avail_date = today + timedelta(days=i)
    RoomAvailability.objects.get_or_create(
        room_type=room_type,
        date=avail_date,
        defaults={
            'available_count': 5,
            'is_manually_blocked': False,
        }
    )

print(f"✓ Disponibilités créées pour 30 jours")

print(f"\n=== RÉSUMÉ ===")
print(f"Hébergeur: {host.email} (mot de passe: password123)")
print(f"Établissement: {establishment.name} - {establishment.city}")
print(f"Type de chambre: {room_type.name} - {room_type.base_price_per_night} XOF/nuit")
print(f"Statut: {establishment.status}")
