"""
Tests — apps.reviews

Couvre :
  - Modèle Review : validations (note 1-5, reviewer = guest, establishment cohérent)
  - Mise à jour note moyenne de l'établissement
  - API ReviewViewSet : liste publique, création, flag, réponse hébergeur
"""
from datetime import date, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import GuestProfile, HostProfile, User
from apps.bookings.models import Booking
from apps.establishments.models import Establishment, RoomType
from apps.reviews.models import Review, ReviewResponse


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_users():
    host = User.objects.create_user(
        email='host@reviews.ci', password='pass', role='host',
        first_name='Hôte', last_name='Rev',
    )
    guest = User.objects.create_user(
        email='guest@reviews.ci', password='pass', role='guest',
        first_name='Client', last_name='Rev',
    )
    GuestProfile.objects.get_or_create(user=guest)
    return host, guest


def make_setup():
    host, guest = make_users()
    etab = Establishment.objects.create(
        host=host, name='Hôtel Avis',
        description='Desc', establishment_type='hotel',
        address='Abidjan', city='Abidjan', status='active',
    )
    room = RoomType.objects.create(
        establishment=etab, name='Chambre',
        base_price_per_night=Decimal('20000'), physical_room_count=2,
    )
    booking = Booking.objects.create(
        guest=guest, room_type=room, establishment=etab,
        check_in_date=date.today() - timedelta(days=5),
        check_out_date=date.today() - timedelta(days=3),
        status=Booking.COMPLETED,
        total_amount=Decimal('44000'),
        subtotal=Decimal('40000'),
        base_subtotal=Decimal('40000'),
        host_payout=Decimal('36000'),
    )
    return host, guest, etab, room, booking


def make_review(guest, etab, booking, rating=4, comment='Très bien.'):
    return Review.objects.create(
        reviewer=guest,
        establishment=etab,
        booking=booking,
        rating_overall=rating,
        comment=comment,
    )


# ════════════════════════════════════════════════════════════════════════════════
# Modèle Review — validations
# ════════════════════════════════════════════════════════════════════════════════

class ReviewModelTests(TestCase):

    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking = make_setup()

    def test_note_valide_1_a_5(self):
        for note in range(1, 6):
            r = Review(
                reviewer=self.guest, establishment=self.etab,
                booking=self.booking, rating_overall=note, comment='OK',
            )
            try:
                r.full_clean()
            except ValidationError as e:
                if 'rating_overall' in e.message_dict:
                    self.fail(f'Note {note} rejetée à tort')

    def test_note_0_invalide(self):
        r = Review(
            reviewer=self.guest, establishment=self.etab,
            booking=self.booking, rating_overall=0, comment='Nul',
        )
        with self.assertRaises(ValidationError) as ctx:
            r.full_clean()
        self.assertIn('rating_overall', ctx.exception.message_dict)

    def test_note_6_invalide(self):
        r = Review(
            reviewer=self.guest, establishment=self.etab,
            booking=self.booking, rating_overall=6, comment='Parfait',
        )
        with self.assertRaises(ValidationError) as ctx:
            r.full_clean()
        self.assertIn('rating_overall', ctx.exception.message_dict)

    def test_reviewer_doit_etre_guest_de_la_reservation(self):
        autre_guest = User.objects.create_user(
            email='autre@reviews.ci', password='pass', role='guest',
        )
        r = Review(
            reviewer=autre_guest,
            establishment=self.etab,
            booking=self.booking,
            rating_overall=3,
            comment='Pas le bon auteur',
        )
        with self.assertRaises(ValidationError) as ctx:
            r.full_clean()
        self.assertIn('reviewer', ctx.exception.message_dict)

    def test_establishment_doit_correspondre_a_la_reservation(self):
        autre_etab = Establishment.objects.create(
            host=self.host, name='Autre Hôtel',
            description='Desc', establishment_type='hotel',
            address='Yamoussoukro', city='Yamoussoukro', status='active',
        )
        r = Review(
            reviewer=self.guest,
            establishment=autre_etab,
            booking=self.booking,
            rating_overall=3,
            comment='Mauvais établissement',
        )
        with self.assertRaises(ValidationError) as ctx:
            r.full_clean()
        self.assertIn('establishment', ctx.exception.message_dict)

    def test_note_sous_rating_optionnel_hors_plage(self):
        r = Review(
            reviewer=self.guest, establishment=self.etab,
            booking=self.booking, rating_overall=4,
            rating_cleanliness=0, comment='Propreté douteuse',
        )
        with self.assertRaises(ValidationError):
            r.full_clean()


# ════════════════════════════════════════════════════════════════════════════════
# Mise à jour automatique de la note de l'établissement
# ════════════════════════════════════════════════════════════════════════════════

class ReviewRatingUpdateTests(TestCase):

    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking = make_setup()

    def test_creation_review_met_a_jour_avg(self):
        make_review(self.guest, self.etab, self.booking, rating=4)
        self.etab.refresh_from_db()
        self.assertEqual(self.etab.avg_rating, Decimal('4.00'))
        self.assertEqual(self.etab.review_count, 1)

    def test_deux_avis_calcule_moyenne(self):
        guest2 = User.objects.create_user(
            email='g2@reviews.ci', password='pass', role='guest',
        )
        GuestProfile.objects.get_or_create(user=guest2)
        room2 = RoomType.objects.create(
            establishment=self.etab, name='Suite',
            base_price_per_night=Decimal('30000'), physical_room_count=1,
        )
        booking2 = Booking.objects.create(
            guest=guest2, room_type=room2, establishment=self.etab,
            check_in_date=date.today() - timedelta(days=10),
            check_out_date=date.today() - timedelta(days=8),
            status=Booking.COMPLETED,
            total_amount=Decimal('66000'), subtotal=Decimal('60000'),
            base_subtotal=Decimal('60000'), host_payout=Decimal('54000'),
        )
        make_review(self.guest, self.etab, self.booking, rating=4)
        make_review(guest2, self.etab, booking2, rating=2)
        self.etab.refresh_from_db()
        self.assertEqual(self.etab.avg_rating, Decimal('3.00'))
        self.assertEqual(self.etab.review_count, 2)

    def test_suppression_review_recalcule(self):
        r = make_review(self.guest, self.etab, self.booking, rating=5)
        r.delete()
        self.etab.refresh_from_db()
        self.assertEqual(self.etab.avg_rating, Decimal('0.00'))
        self.assertEqual(self.etab.review_count, 0)

    def test_review_non_publiee_exclue_de_la_moyenne(self):
        r = make_review(self.guest, self.etab, self.booking, rating=5)
        r.is_published = False
        r.save()
        self.etab.refresh_from_db()
        self.assertEqual(self.etab.avg_rating, Decimal('0.00'))


# ════════════════════════════════════════════════════════════════════════════════
# API ReviewViewSet
# ════════════════════════════════════════════════════════════════════════════════

class ReviewAPITests(APITestCase):

    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking = make_setup()
        self.admin = User.objects.create_superuser(
            email='admin@reviews.ci', password='pass',
            first_name='Admin', last_name='Rev',
        )

    def test_liste_publique_sans_auth(self):
        make_review(self.guest, self.etab, self.booking)
        resp = self.client.get('/api/reviews/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_liste_filtre_par_etablissement(self):
        make_review(self.guest, self.etab, self.booking, rating=5)
        resp = self.client.get(f'/api/reviews/?establishment={self.etab.pk}')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get('results', resp.data)
        self.assertEqual(len(results), 1)

    def test_creation_avis_par_guest(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post('/api/reviews/', {
            'booking': str(self.booking.pk),
            'establishment': str(self.etab.pk),
            'rating_overall': 5,
            'comment': 'Séjour exceptionnel !',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['rating_overall'], 5)

    def test_creation_sans_auth_refusee(self):
        resp = self.client.post('/api/reviews/', {
            'booking': str(self.booking.pk),
            'establishment': str(self.etab.pk),
            'rating_overall': 3,
            'comment': 'Bien.',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_avis_non_publie_invisible_en_liste(self):
        r = make_review(self.guest, self.etab, self.booking)
        r.is_published = False
        r.save()
        resp = self.client.get('/api/reviews/')
        results = resp.data.get('results', resp.data)
        ids = [str(item['id']) for item in results]
        self.assertNotIn(str(r.pk), ids)

    def test_flag_par_admin(self):
        r = make_review(self.guest, self.etab, self.booking)
        self.client.force_authenticate(self.admin)
        resp = self.client.post(f'/api/reviews/{r.pk}/flag/', {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        r.refresh_from_db()
        self.assertTrue(r.is_flagged)
        self.assertFalse(r.is_published)

    def test_flag_par_guest_refuse(self):
        r = make_review(self.guest, self.etab, self.booking)
        self.client.force_authenticate(self.guest)
        resp = self.client.post(f'/api/reviews/{r.pk}/flag/', {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_approve_par_admin(self):
        r = make_review(self.guest, self.etab, self.booking)
        r.is_flagged = True
        r.is_published = False
        r.save()
        self.client.force_authenticate(self.admin)
        resp = self.client.post(f'/api/reviews/{r.pk}/approve/', {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        r.refresh_from_db()
        self.assertFalse(r.is_flagged)
        self.assertTrue(r.is_published)

    def test_reponse_hebergeur(self):
        r = make_review(self.guest, self.etab, self.booking, rating=4)
        self.client.force_authenticate(self.host)
        resp = self.client.post(f'/api/reviews/{r.pk}/respond/', {
            'response_text': 'Merci pour votre avis !',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ReviewResponse.objects.filter(review=r).exists())

    def test_creation_avis_note_invalide(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post('/api/reviews/', {
            'booking': str(self.booking.pk),
            'establishment': str(self.etab.pk),
            'rating_overall': 6,
            'comment': 'Trop bien.',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
