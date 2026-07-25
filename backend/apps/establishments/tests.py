"""
Tests — apps.establishments

Couvre :
  - Modèle Establishment : slug auto, validation host=host role
  - Modèle RoomType : validations price/capacity
  - Modèle RoomAvailability : validation available_count <= physical_room_count
  - API publique : liste, détail par slug, filtre ville
  - API owner : CRUD établissements, CRUD chambres, disponibilités bulk
"""
from datetime import date, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import GuestProfile, User
from apps.establishments.models import (
    Amenity, Establishment, RoomAvailability, RoomType,
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_host(email='host@etab.ci'):
    return User.objects.create_user(
        email=email, password='pass', role='host',
        first_name='Hôte', last_name='Etab',
    )


def make_guest(email='guest@etab.ci'):
    u = User.objects.create_user(
        email=email, password='pass', role='guest',
    )
    GuestProfile.objects.get_or_create(user=u)
    return u


def make_etab(host, name='Hôtel Test', status='active'):
    return Establishment.objects.create(
        host=host, name=name,
        description='Belle description', establishment_type='hotel',
        address='Plateau, Abidjan', city='Abidjan',
        status=status,
    )


def make_room(etab, name='Standard', price='25000', rooms=3):
    return RoomType.objects.create(
        establishment=etab, name=name,
        base_price_per_night=Decimal(price),
        physical_room_count=int(rooms),
        capacity_adults=2, capacity_children=1,
    )


def make_avail(room, offset=3, nights=5, count=2, price=None):
    d = date.today() + timedelta(days=offset)
    for i in range(nights):
        RoomAvailability.objects.get_or_create(
            room_type=room,
            date=d + timedelta(days=i),
            defaults={'available_count': count, 'special_price': price},
        )


# ════════════════════════════════════════════════════════════════════════════════
# Modèle Establishment
# ════════════════════════════════════════════════════════════════════════════════

class EstablishmentModelTests(TestCase):

    def setUp(self):
        self.host = make_host()

    def test_slug_genere_automatiquement(self):
        e = make_etab(self.host, name='Mon Bel Hôtel')
        self.assertEqual(e.slug, 'mon-bel-hotel')

    def test_slug_unique_avec_suffixe(self):
        e1 = make_etab(self.host, name='Hôtel Duplon')
        e2 = make_etab(self.host, name='Hôtel Duplon')
        self.assertNotEqual(e1.slug, e2.slug)
        self.assertTrue(e2.slug.startswith('hotel-duplon'))

    def test_host_doit_avoir_role_host(self):
        guest = make_guest()
        e = Establishment(
            host=guest,
            name='Hôtel Invalide',
            description='Desc',
            establishment_type='hotel',
            address='Abidjan',
            city='Abidjan',
        )
        with self.assertRaises(ValidationError) as ctx:
            e.full_clean()
        self.assertIn('host', ctx.exception.message_dict)

    def test_str_contient_nom(self):
        e = make_etab(self.host)
        self.assertIn('Hôtel Test', str(e))


# ════════════════════════════════════════════════════════════════════════════════
# Modèle RoomType
# ════════════════════════════════════════════════════════════════════════════════

class RoomTypeModelTests(TestCase):

    def setUp(self):
        self.host = make_host()
        self.etab = make_etab(self.host)

    def test_prix_negatif_invalide(self):
        r = RoomType(
            establishment=self.etab, name='Chambre',
            base_price_per_night=Decimal('-1000'),
            physical_room_count=1,
        )
        with self.assertRaises(ValidationError) as ctx:
            r.full_clean()
        self.assertIn('base_price_per_night', ctx.exception.message_dict)

    def test_prix_zero_invalide(self):
        r = RoomType(
            establishment=self.etab, name='Chambre',
            base_price_per_night=Decimal('0'),
            physical_room_count=1,
        )
        with self.assertRaises(ValidationError) as ctx:
            r.full_clean()
        self.assertIn('base_price_per_night', ctx.exception.message_dict)

    def test_physical_room_count_zero_invalide(self):
        r = RoomType(
            establishment=self.etab, name='Chambre',
            base_price_per_night=Decimal('10000'),
            physical_room_count=0,
        )
        with self.assertRaises(ValidationError) as ctx:
            r.full_clean()
        self.assertIn('physical_room_count', ctx.exception.message_dict)

    def test_str_contient_nom_et_etablissement(self):
        r = make_room(self.etab)
        self.assertIn('Standard', str(r))
        self.assertIn('Hôtel Test', str(r))


# ════════════════════════════════════════════════════════════════════════════════
# Modèle RoomAvailability
# ════════════════════════════════════════════════════════════════════════════════

class RoomAvailabilityModelTests(TestCase):

    def setUp(self):
        self.host = make_host()
        self.etab = make_etab(self.host)
        self.room = make_room(self.etab, rooms=2)

    def test_available_count_depasse_physical_rooms(self):
        a = RoomAvailability(
            room_type=self.room,
            date=date.today() + timedelta(days=1),
            available_count=5,  # > physical_room_count=2
        )
        with self.assertRaises(ValidationError) as ctx:
            a.full_clean()
        self.assertIn('available_count', ctx.exception.message_dict)

    def test_available_count_egal_physical_rooms_valide(self):
        a = RoomAvailability(
            room_type=self.room,
            date=date.today() + timedelta(days=1),
            available_count=2,
        )
        try:
            a.full_clean()
        except ValidationError as e:
            if 'available_count' in e.message_dict:
                self.fail('Disponibilité égale au max rejetée à tort')

    def test_prix_special_negatif_invalide(self):
        a = RoomAvailability(
            room_type=self.room,
            date=date.today() + timedelta(days=2),
            available_count=1,
            special_price=Decimal('-500'),
        )
        with self.assertRaises(ValidationError) as ctx:
            a.full_clean()
        self.assertIn('special_price', ctx.exception.message_dict)


# ════════════════════════════════════════════════════════════════════════════════
# API Publique — Établissements
# ════════════════════════════════════════════════════════════════════════════════

class EstablishmentPublicAPITests(APITestCase):

    def setUp(self):
        self.host = make_host()
        self.etab = make_etab(self.host, name='Hôtel Public')
        self.room = make_room(self.etab)
        make_avail(self.room)

    def test_liste_publique_accessible_sans_auth(self):
        resp = self.client.get('/api/establishments/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_liste_via_public_endpoint(self):
        resp = self.client.get('/api/public/hebergements/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_detail_par_slug(self):
        resp = self.client.get(f'/api/establishments/{self.etab.slug}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'Hôtel Public')

    def test_etab_inactif_absent_de_la_liste(self):
        etab_inactif = make_etab(self.host, name='Hôtel Fermé', status='suspended')
        resp = self.client.get('/api/establishments/')
        slugs = [e['slug'] for e in resp.data.get('results', resp.data)]
        self.assertNotIn(etab_inactif.slug, slugs)

    def test_filtre_par_ville(self):
        host2 = make_host('host2@etab.ci')
        etab_bouake = make_etab(host2, name='Hôtel Bouaké')
        etab_bouake.city = 'Bouaké'
        etab_bouake.save()
        resp = self.client.get('/api/establishments/?city=Abidjan')
        noms = [e['name'] for e in resp.data.get('results', resp.data)]
        self.assertIn('Hôtel Public', noms)
        self.assertNotIn('Hôtel Bouaké', noms)

    def test_detail_slug_inexistant_404(self):
        resp = self.client.get('/api/establishments/slug-qui-nexiste-pas/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


# ════════════════════════════════════════════════════════════════════════════════
# API Owner — CRUD Établissements
# ════════════════════════════════════════════════════════════════════════════════

class OwnerEstablishmentAPITests(APITestCase):

    def setUp(self):
        self.host  = make_host()
        self.host2 = make_host('host2@owner.ci')
        self.guest = make_guest()

    def test_host_peut_lister_ses_etablissements(self):
        make_etab(self.host)
        self.client.force_authenticate(self.host)
        resp = self.client.get('/api/owner/establishments/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data.get('results', resp.data)), 1)

    def test_host_ne_voit_pas_etabs_autres_hosts(self):
        make_etab(self.host2, name='Hôtel Rival')
        self.client.force_authenticate(self.host)
        resp = self.client.get('/api/owner/establishments/')
        noms = [e['name'] for e in resp.data.get('results', resp.data)]
        self.assertNotIn('Hôtel Rival', noms)

    def test_creation_etablissement(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post('/api/owner/establishments/', {
            'name': 'Nouveau Hôtel',
            'description': 'Bel endroit',
            'establishment_type': 'hotel',
            'address': '123 Rue de la Paix',
            'city': 'Abidjan',
            'cancellation_policy': 'flexible',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['name'], 'Nouveau Hôtel')
        self.assertTrue(
            Establishment.objects.filter(name='Nouveau Hôtel', host=self.host).exists()
        )

    def test_guest_ne_peut_pas_creer(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post('/api/owner/establishments/', {
            'name': 'Hack',
            'description': 'Desc',
            'establishment_type': 'hotel',
            'address': 'Addr',
            'city': 'Abidjan',
        }, format='json')
        # Guest ne peut pas créer un établissement
        self.assertIn(resp.status_code, [
            status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST,
        ])

    def test_non_authentifie_refuse(self):
        resp = self.client.get('/api/owner/establishments/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ════════════════════════════════════════════════════════════════════════════════
# API Owner — CRUD Chambres
# ════════════════════════════════════════════════════════════════════════════════

class OwnerRoomTypeAPITests(APITestCase):

    def setUp(self):
        self.host  = make_host()
        self.guest = make_guest()
        self.etab  = make_etab(self.host)
        self.room  = make_room(self.etab)

    def test_host_liste_ses_chambres(self):
        self.client.force_authenticate(self.host)
        resp = self.client.get('/api/owner/rooms/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        noms = [r['name'] for r in resp.data.get('results', resp.data)]
        self.assertIn('Standard', noms)

    def test_creation_chambre(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post('/api/owner/rooms/', {
            'establishment': str(self.etab.pk),
            'name': 'Suite Deluxe',
            'base_price_per_night': '75000',
            'physical_room_count': 1,
            'capacity_adults': 2,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            RoomType.objects.filter(name='Suite Deluxe', establishment=self.etab).exists()
        )

    def test_guest_ne_peut_pas_creer_chambre(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post('/api/owner/rooms/', {
            'establishment': str(self.etab.pk),
            'name': 'Hack Room',
            'base_price_per_night': '1000',
            'physical_room_count': 1,
        }, format='json')
        self.assertIn(resp.status_code, [
            status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST,
        ])


# ════════════════════════════════════════════════════════════════════════════════
# API Owner — Disponibilités bulk
# ════════════════════════════════════════════════════════════════════════════════

class OwnerAvailabilityAPITests(APITestCase):

    def setUp(self):
        self.host  = make_host()
        self.guest = make_guest()
        self.etab  = make_etab(self.host)
        self.room  = make_room(self.etab)

    def test_bulk_update_cree_disponibilites(self):
        start = (date.today() + timedelta(days=10)).isoformat()
        end   = (date.today() + timedelta(days=14)).isoformat()
        self.client.force_authenticate(self.host)
        resp = self.client.post('/api/owner/availability/bulk_update/', {
            'room_type_id': str(self.room.pk),
            'start_date': start,
            'end_date': end,
            'available_count': 2,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        count = RoomAvailability.objects.filter(
            room_type=self.room,
            date__gte=start,
            date__lte=end,
        ).count()
        self.assertEqual(count, 5)  # 10, 11, 12, 13, 14 → 5 jours

    def test_guest_ne_peut_pas_modifier_disponibilites(self):
        start = (date.today() + timedelta(days=5)).isoformat()
        end   = (date.today() + timedelta(days=7)).isoformat()
        self.client.force_authenticate(self.guest)
        resp = self.client.post('/api/owner/availability/bulk_update/', {
            'room_type_id': str(self.room.pk),
            'start_date': start,
            'end_date': end,
            'available_count': 1,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_room_type_appartenant_a_autre_host_refuse(self):
        host2 = make_host('host2@avail.ci')
        etab2 = make_etab(host2, name='Hôtel Rival')
        room2 = make_room(etab2, name='Chambre Rivale')
        start = (date.today() + timedelta(days=5)).isoformat()
        end   = (date.today() + timedelta(days=7)).isoformat()
        self.client.force_authenticate(self.host)
        resp = self.client.post('/api/owner/availability/bulk_update/', {
            'room_type_id': str(room2.pk),
            'start_date': start,
            'end_date': end,
            'available_count': 1,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


# ════════════════════════════════════════════════════════════════════════════════
# Amenity
# ════════════════════════════════════════════════════════════════════════════════

class AmenityAPITests(APITestCase):

    def test_liste_amenites_publique(self):
        Amenity.objects.create(name='Wi-Fi', category='wifi', icon='wifi')
        resp = self.client.get('/api/establishments/amenities/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        noms = [a['name'] for a in resp.data.get('results', resp.data)]
        self.assertIn('Wi-Fi', noms)
