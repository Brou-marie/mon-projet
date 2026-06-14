"""
Script de création de données de test pour NoamHome
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NoamHome.settings')
django.setup()

from apps.accounts.models import User, HostProfile, GuestProfile
from apps.establishments.models import Establishment, EstablishmentImage, RoomType, RoomTypeImage, RoomAvailability, Amenity
from apps.bookings.models import Booking
from datetime import date, timedelta
from decimal import Decimal

def create_test_data():
    print("Création des données de test...")
    
    # Créer des utilisateurs de test
    print("1. Création des utilisateurs...")
    
    # Voyageur
    guest_user = User.objects.filter(email='voyageur@test.com').first()
    if not guest_user:
        guest_user = User.objects.create_user(
            email='voyageur@test.com',
            password='test123',
            first_name='Jean',
            last_name='Dupont',
            phone='+2250707000000',
            role='guest'
        )
        GuestProfile.objects.create(user=guest_user)
        print("   - Voyageur créé: voyageur@test.com / test123")
    
    # Hébergeur
    host_user = User.objects.filter(email='hebergeur@test.com').first()
    if not host_user:
        host_user = User.objects.create_user(
            email='hebergeur@test.com',
            password='test123',
            first_name='Marie',
            last_name='Koné',
            phone='+2250707000001',
            role='host'
        )
        HostProfile.objects.create(
            user=host_user,
            company_name='Koné Hôtels',
            business_registration='CI-ABJ-2024-001',
            address='Abidjan, Cocody',
            description="Chaîne d'hôtels premium en Côte d'Ivoire",
            verification_status='verified',
            is_verified=True
        )
        print("   - Hébergeur créé: hebergeur@test.com / test123")
    
    # Créer des équipements
    print("2. Création des équipements...")
    amenities = [
        ('wifi', 'Wi-Fi', 'wifi'),
        ('parking', 'Parking', 'local_parking'),
        ('pool', 'Piscine', 'pool'),
        ('ac', 'Climatisation', 'ac_unit'),
        ('breakfast', 'Petit-déjeuner', 'free_breakfast'),
        ('restaurant', 'Restaurant', 'restaurant'),
    ]
    
    for category, name, icon in amenities:
        Amenity.objects.get_or_create(
            category=category,
            defaults={'name': name, 'icon': icon}
        )
    print("   - Équipements créés")
    
    # Créer des établissements
    print("3. Création des établissements...")
    
    establishment1 = Establishment.objects.filter(slug='hotel-abidjan-plateau').first()
    if not establishment1:
        establishment1 = Establishment.objects.create(
            host=host_user,
            name='Hôtel Abidjan Plateau',
            slug='hotel-abidjan-plateau',
            establishment_type='hotel',
            description='Hôtel de luxe situé au cœur du Plateau, proche des institutions et des affaires. Chambres modernes avec vue sur la ville.',
            address='Boulevard de la République, Plateau',
            city='Abidjan',
            quarter='Plateau',
            latitude=5.3367,
            longitude=-4.0270,
            check_in_time='14:00',
            check_out_time='11:00',
            cancellation_policy='moderate',
            status='active',
            is_featured=True
        )
        print("   - Établissement créé: Hôtel Abidjan Plateau")
    
    establishment2 = Establishment.objects.filter(slug='residence-cocody').first()
    if not establishment2:
        establishment2 = Establishment.objects.create(
            host=host_user,
            name='Résidence Cocody',
            slug='residence-cocody',
            establishment_type='residence',
            description='Appartements meublés dans un quartier résidentiel calme. Idéal pour les séjours prolongés.',
            address='Rue des Jardins, Cocody',
            city='Abidjan',
            quarter='Cocody',
            latitude=5.3475,
            longitude=-4.0133,
            check_in_time='15:00',
            check_out_time='10:00',
            cancellation_policy='flexible',
            status='active'
        )
        print("   - Établissement créé: Résidence Cocody")
    
    # Créer des types de chambres
    print("4. Création des types de chambres...")
    
    # Chambres pour Hôtel Abidjan Plateau
    room_type1 = RoomType.objects.filter(establishment=establishment1, name='Chambre Standard').first()
    if not room_type1:
        room_type1 = RoomType.objects.create(
            establishment=establishment1,
            name='Chambre Standard',
            description='Chambre confortable avec lit double, climatisation, Wi-Fi et télévision.',
            capacity_adults=2,
            capacity_children=1,
            base_price_per_night=Decimal('25000'),
            physical_room_count=10,
            size_sqm=25,
            bed_type='Lit double',
            is_active=True
        )
        # Ajouter des équipements
        wifi = Amenity.objects.get(category='wifi')
        ac = Amenity.objects.get(category='ac')
        room_type1.amenities.add(wifi, ac)
        
        # Créer les disponibilités pour 180 jours
        today = date.today()
        for offset in range(180):
            RoomAvailability.objects.get_or_create(
                room_type=room_type1,
                date=today + timedelta(days=offset),
                defaults={'available_count': room_type1.physical_room_count}
            )
        print("   - Chambre Standard créée pour Hôtel Abidjan Plateau")
    
    room_type2 = RoomType.objects.filter(establishment=establishment1, name='Suite Deluxe').first()
    if not room_type2:
        room_type2 = RoomType.objects.create(
            establishment=establishment1,
            name='Suite Deluxe',
            description='Suite spacieuse avec salon séparé, vue panoramique et minibar.',
            capacity_adults=2,
            capacity_children=2,
            base_price_per_night=Decimal('50000'),
            physical_room_count=5,
            size_sqm=45,
            bed_type='Lit king size',
            is_active=True
        )
        # Ajouter des équipements
        wifi = Amenity.objects.get(category='wifi')
        ac = Amenity.objects.get(category='ac')
        pool = Amenity.objects.get(category='pool')
        breakfast = Amenity.objects.get(category='breakfast')
        room_type2.amenities.add(wifi, ac, pool, breakfast)
        
        # Créer les disponibilités pour 180 jours
        today = date.today()
        for offset in range(180):
            RoomAvailability.objects.get_or_create(
                room_type=room_type2,
                date=today + timedelta(days=offset),
                defaults={'available_count': room_type2.physical_room_count}
            )
        print("   - Suite Deluxe créée pour Hôtel Abidjan Plateau")
    
    # Chambres pour Résidence Cocody
    room_type3 = RoomType.objects.filter(establishment=establishment2, name='Studio').first()
    if not room_type3:
        room_type3 = RoomType.objects.create(
            establishment=establishment2,
            name='Studio',
            description='Studio meublé avec kitchenette, idéal pour les séjours courts.',
            capacity_adults=2,
            capacity_children=0,
            base_price_per_night=Decimal('35000'),
            physical_room_count=8,
            size_sqm=30,
            bed_type='Lit double',
            is_active=True
        )
        wifi = Amenity.objects.get(category='wifi')
        ac = Amenity.objects.get(category='ac')
        room_type3.amenities.add(wifi, ac)
        
        # Créer les disponibilités pour 180 jours
        today = date.today()
        for offset in range(180):
            RoomAvailability.objects.get_or_create(
                room_type=room_type3,
                date=today + timedelta(days=offset),
                defaults={'available_count': room_type3.physical_room_count}
            )
        print("   - Studio créé pour Résidence Cocody")
    
    print("\n✓ Données de test créées avec succès!")
    print("\nComptes de test:")
    print("  - Admin: admin@noamhome.com / (mot de passe à définir)")
    print("  - Voyageur: voyageur@test.com / test123")
    print("  - Hébergeur: hebergeur@test.com / test123")
    print("\nÉtablissements:")
    print("  - Hôtel Abidjan Plateau (Abidjan, Plateau)")
    print("  - Résidence Cocody (Abidjan, Cocody)")

if __name__ == '__main__':
    create_test_data()
