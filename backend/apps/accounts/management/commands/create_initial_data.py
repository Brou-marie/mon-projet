from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from datetime import date, timedelta

from apps.establishments.models import Establishment, RoomType, Amenity, RoomAvailability
from apps.accounts.models import GuestProfile, HostProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Crée des données initiales pour la base de données'

    def create_availability(self, room_type, days=180):
        today = date.today()
        created_count = 0
        for offset in range(days):
            _, created = RoomAvailability.objects.get_or_create(
                room_type=room_type,
                date=today + timedelta(days=offset),
                defaults={'available_count': room_type.physical_room_count},
            )
            if created:
                created_count += 1
        return created_count

    def handle(self, *args, **options):
        self.stdout.write('Création des données initiales...')
        
        # Créer les équipements (amenities)
        amenities_data = [
            ('wifi', 'Wi-Fi', 'wifi'),
            ('parking', 'Parking', 'parking'),
            ('pool', 'Piscine', 'pool'),
            ('ac', 'Climatisation', 'ac'),
            ('breakfast', 'Petit-déjeuner', 'breakfast'),
            ('restaurant', 'Restaurant', 'restaurant'),
            ('gym', 'Salle de sport', 'gym'),
            ('spa', 'Spa', 'spa'),
            ('security', 'Sécurité', 'security'),
            ('laundry', 'Laverie', 'laundry'),
            ('kitchen', 'Cuisine équipée', 'kitchen'),
            ('tv', 'Télévision', 'tv'),
            ('balcony', 'Balcon', 'balcony'),
            ('generator', 'Générateur', 'generator'),
            ('bar', 'Bar', 'bar'),
        ]
        
        for category, name, icon in amenities_data:
            Amenity.objects.get_or_create(
                name=name,
                defaults={'category': category, 'icon': icon}
            )
        
        self.stdout.write(self.style.SUCCESS('✓ Équipements créés'))
        
        # Créer des utilisateurs hôtes avec leurs établissements
        hosts_data = [
            {
                'email': 'hotel.abidjan@noamhome.ci',
                'password': 'Hotel123!',
                'first_name': 'Jean',
                'last_name': 'Kouassi',
                'phone': '+2250745678901',
                'hotel_name': 'Hôtel Abidjan Palace',
                'hotel_address': 'Boulevard de la République, Plateau',
                'hotel_city': 'Abidjan',
                'hotel_type': 'hotel',
                'hotel_description': 'Hôtel de luxe situé au cœur du Plateau avec vue sur la lagune. Chambres modernes, piscine, restaurant gastronomique et spa.',
                'room_types': [
                    {'name': 'Chambre Standard', 'capacity': 2, 'price': 45000, 'count': 10},
                    {'name': 'Chambre Deluxe', 'capacity': 2, 'price': 65000, 'count': 8},
                    {'name': 'Suite Présidentielle', 'capacity': 4, 'price': 150000, 'count': 3},
                ]
            },
            {
                'email': 'hotel.bouake@noamhome.ci',
                'password': 'Hotel123!',
                'first_name': 'Awa',
                'last_name': 'Koné',
                'phone': '+2250756789012',
                'hotel_name': 'Résidence Bouaké',
                'hotel_address': 'Quartier Affoué',
                'hotel_city': 'Bouaké',
                'hotel_type': 'residence',
                'hotel_description': 'Résidence moderne et confortable idéale pour les séjours d\'affaires et touristiques.',
                'room_types': [
                    {'name': 'Studio', 'capacity': 1, 'price': 25000, 'count': 15},
                    {'name': 'Appartement 2 pièces', 'capacity': 2, 'price': 35000, 'count': 10},
                ]
            },
            {
                'email': 'hotel.yamoussoukro@noamhome.ci',
                'password': 'Hotel123!',
                'first_name': 'Kouamé',
                'last_name': 'Yao',
                'phone': '+2250767890123',
                'hotel_name': 'Villa Basilique',
                'hotel_address': 'Près de la Basilique Notre-Dame de la Paix',
                'hotel_city': 'Yamoussoukro',
                'hotel_type': 'villa',
                'hotel_description': 'Villa de luxe avec piscine privée, jardin et vue sur la basilique. Parfait pour les familles et groupes.',
                'room_types': [
                    {'name': 'Chambre Double', 'capacity': 2, 'price': 55000, 'count': 5},
                    {'name': 'Suite Familiale', 'capacity': 6, 'price': 120000, 'count': 2},
                ]
            },
            {
                'email': 'hotel.sanpedro@noamhome.ci',
                'password': 'Hotel123!',
                'first_name': 'François',
                'last_name': 'Touré',
                'phone': '+2250778901234',
                'hotel_name': 'Beach Resort San-Pédro',
                'hotel_address': 'Bord de mer',
                'hotel_city': 'San-Pédro',
                'hotel_type': 'hotel',
                'hotel_description': 'Resort en bord de mer avec accès direct à la plage, piscine, restaurant de fruits de mer et activités nautiques.',
                'room_types': [
                    {'name': 'Chambre Vue Mer', 'capacity': 2, 'price': 75000, 'count': 12},
                    {'name': 'Bungalow', 'capacity': 4, 'price': 100000, 'count': 6},
                ]
            },
        ]
        
        for host_data in hosts_data:
            # Créer l'utilisateur hôte
            user, created = User.objects.get_or_create(
                email=host_data['email'],
                defaults={
                    'first_name': host_data['first_name'],
                    'last_name': host_data['last_name'],
                    'phone': host_data['phone'],
                    'role': 'host',
                    'is_active': True,
                }
            )
            
            if created:
                user.set_password(host_data['password'])
                user.save()
                self.stdout.write(f'✓ Utilisateur hôte créé: {host_data["email"]}')
            else:
                self.stdout.write(f'✓ Utilisateur hôte existe déjà: {host_data["email"]}')
            
            # Créer le profil hôte
            host_profile, _ = HostProfile.objects.get_or_create(
                user=user,
                defaults={
                    'verification_status': 'verified',
                }
            )
            if host_profile.verification_status != 'verified':
                host_profile.verification_status = 'verified'
                host_profile.save(update_fields=('verification_status', 'is_verified', 'updated_at'))
            
            # Créer l'établissement
            establishment, created_est = Establishment.objects.get_or_create(
                name=host_data['hotel_name'],
                host=user,
                defaults={
                    'slug': slugify(host_data['hotel_name']),
                    'description': host_data['hotel_description'],
                    'establishment_type': host_data['hotel_type'],
                    'address': host_data['hotel_address'],
                    'city': host_data['hotel_city'],
                    'status': 'active',
                    'avg_rating': 4.5,
                    'review_count': 15,
                }
            )
            
            if created_est:
                self.stdout.write(f'✓ Établissement créé: {host_data["hotel_name"]}')
            else:
                self.stdout.write(f'✓ Établissement existe déjà: {host_data["hotel_name"]}')
            
            # Créer les types de chambres
            for room_data in host_data['room_types']:
                room_type, created_room = RoomType.objects.get_or_create(
                    establishment=establishment,
                    name=room_data['name'],
                    defaults={
                        'capacity_adults': room_data['capacity'],
                        'base_price_per_night': room_data['price'],
                        'physical_room_count': room_data['count'],
                    }
                )
                
                if created_room:
                    self.stdout.write(f'  ✓ Type de chambre créé: {room_data["name"]}')
                availability_count = self.create_availability(room_type)
                if availability_count:
                    self.stdout.write(f'    ✓ {availability_count} disponibilités ajoutées')
        
        # Créer un utilisateur admin
        admin_user, created = User.objects.get_or_create(
            email='admin@noamhome.ci',
            defaults={
                'first_name': 'Admin',
                'last_name': 'NoamHome',
                'role': 'superadmin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        
        if created:
            admin_user.set_password('Admin123!')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('✓ Admin créé: admin@noamhome.ci'))
        else:
            self.stdout.write('✓ Admin existe déjà: admin@noamhome.ci')
        
        # Créer un utilisateur voyageur de test
        guest_user, created = User.objects.get_or_create(
            email='voyageur@noamhome.ci',
            defaults={
                'first_name': 'Marie',
                'last_name': 'Diallo',
                'phone': '+2250789012345',
                'role': 'guest',
                'is_active': True,
            }
        )
        
        if created:
            guest_user.set_password('Guest123!')
            guest_user.save()
            self.stdout.write(self.style.SUCCESS('✓ Voyageur créé: voyageur@noamhome.ci'))
        else:
            self.stdout.write('✓ Voyageur existe déjà: voyageur@noamhome.ci')

        GuestProfile.objects.get_or_create(user=guest_user)

        self.stdout.write(self.style.SUCCESS('✓ Données initiales créées avec succès!'))
