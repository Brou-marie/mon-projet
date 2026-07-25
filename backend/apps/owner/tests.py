"""
Tests unitaires — apps.owner

Couvre le nouveau flux d'accueil client :
  - lookup-code  : recherche réservation par code
  - validate-payment : hébergeur valide le paiement sur place
  - approve / reject / check_in / check_out
  - dashboard et permissions
"""
from datetime import date, timedelta
from decimal import Decimal

from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.models import User, GuestProfile
from apps.establishments.models import Establishment, RoomType, RoomAvailability
from apps.bookings.models import Booking, BookingStatusHistory
from apps.bookings.services import booking_nights


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_users(suffix='owner'):
    host = User.objects.create_user(
        email=f'host@{suffix}.ci', password='pass', role='host',
        first_name='Hôte', last_name='Owner',
    )
    guest = User.objects.create_user(
        email=f'guest@{suffix}.ci', password='pass', role='guest',
        first_name='Client', last_name='Owner',
    )
    GuestProfile.objects.get_or_create(user=guest)
    return host, guest


def make_setup(suffix='owner', requires_manual=False):
    host, guest = make_users(suffix)
    etab = Establishment.objects.create(
        host=host, name=f'Hôtel {suffix}',
        description='Desc', establishment_type='hotel',
        address='Abidjan', city='Abidjan',
        status='active',
        requires_manual_validation=requires_manual,
    )
    room = RoomType.objects.create(
        establishment=etab, name='Chambre',
        base_price_per_night=Decimal('25000'),
        physical_room_count=3,
    )
    check_in = date.today() + timedelta(days=3)
    check_out = check_in + timedelta(days=2)
    for night in booking_nights(check_in, check_out):
        RoomAvailability.objects.get_or_create(
            room_type=room, date=night, defaults={'available_count': 2}
        )
    booking = Booking.objects.create(
        guest=guest, room_type=room, establishment=etab,
        check_in_date=check_in, check_out_date=check_out,
        status=Booking.PENDING_PAYMENT,
        total_amount=Decimal('55000'),
        subtotal=Decimal('50000'),
        base_subtotal=Decimal('50000'),
        host_payout=Decimal('45000'),
    )
    return host, guest, etab, room, booking


# ════════════════════════════════════════════════════════════════════════════════
# Dashboard
# ════════════════════════════════════════════════════════════════════════════════

class OwnerDashboardTests(APITestCase):
    def setUp(self):
        self.host, self.guest, *_ = make_setup('dashboard')

    def test_host_acces_dashboard(self):
        self.client.force_authenticate(self.host)
        resp = self.client.get('/api/owner/dashboard/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('total_establishments', resp.data[0] if isinstance(resp.data, list) else resp.data)

    def test_guest_acces_refuse(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.get('/api/owner/dashboard/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_authentifie_refuse(self):
        resp = self.client.get('/api/owner/dashboard/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ════════════════════════════════════════════════════════════════════════════════
# lookup-code
# ════════════════════════════════════════════════════════════════════════════════

class LookupCodeTests(APITestCase):
    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking = make_setup('lookup')

    def test_code_valide_retourne_fiche(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            '/api/owner/bookings/lookup-code/',
            {'code': self.booking.reservation_code},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['reservation_code'], self.booking.reservation_code)
        self.assertEqual(resp.data['guest_name'], self.guest.get_full_name())
        self.assertIn('total_amount', resp.data)
        self.assertIn('payment_status', resp.data)

    def test_code_inconnu_retourne_404(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            '/api/owner/bookings/lookup-code/',
            {'code': 'XXXXXX'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_code_vide_retourne_400(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            '/api/owner/bookings/lookup-code/',
            {'code': ''},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_guest_ne_peut_pas_chercher(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            '/api/owner/bookings/lookup-code/',
            {'code': self.booking.reservation_code},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_host_ne_voit_pas_reservations_autres_etablissements(self):
        """Un autre hôte ne doit pas pouvoir accéder aux réservations de cet établissement."""
        autre_host = User.objects.create_user(
            email='autre@lookup.ci', password='pass', role='host',
        )
        self.client.force_authenticate(autre_host)
        resp = self.client.post(
            '/api/owner/bookings/lookup-code/',
            {'code': self.booking.reservation_code},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_code_minuscule_accepte(self):
        """Le code doit être insensible à la casse."""
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            '/api/owner/bookings/lookup-code/',
            {'code': self.booking.reservation_code.lower()},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


# ════════════════════════════════════════════════════════════════════════════════
# validate-payment
# ════════════════════════════════════════════════════════════════════════════════

class ValidatePaymentOwnerTests(APITestCase):
    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking = make_setup('validate')

    def _url(self):
        return f'/api/owner/bookings/{self.booking.pk}/validate-payment/'

    def test_cash_valide_et_confirme(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post(self._url(), {'payment_method': 'cash'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.payment_status, 'paid')
        self.assertEqual(self.booking.payment_method, 'cash')
        self.assertEqual(self.booking.status, Booking.CONFIRMED)

    def test_wave_valide(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post(self._url(), {'payment_method': 'wave'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.payment_method, 'wave')

    def test_preuve_enregistree(self):
        self.client.force_authenticate(self.host)
        self.client.post(
            self._url(),
            {'payment_method': 'orange_money', 'payment_proof': 'TXN-12345'},
            format='json',
        )
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.payment_proof, 'TXN-12345')

    def test_historique_statut_cree(self):
        self.client.force_authenticate(self.host)
        self.client.post(self._url(), {'payment_method': 'mtn_money'}, format='json')
        hist = BookingStatusHistory.objects.filter(
            booking=self.booking, status=Booking.CONFIRMED
        )
        self.assertTrue(hist.exists())

    def test_methode_invalide_retourne_400(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            self._url(), {'payment_method': 'bitcoin'}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_methode_absente_retourne_400(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post(self._url(), {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deja_paye_retourne_400(self):
        self.booking.payment_status = 'paid'
        self.booking.save()
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            self._url(), {'payment_method': 'cash'}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_guest_ne_peut_pas_valider(self):
        self.client.force_authenticate(self.guest)
        resp = self.client.post(
            self._url(), {'payment_method': 'cash'}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_autre_host_ne_peut_pas_valider(self):
        autre = User.objects.create_user(
            email='autre@validate.ci', password='pass', role='host',
        )
        self.client.force_authenticate(autre)
        resp = self.client.post(
            self._url(), {'payment_method': 'cash'}, format='json'
        )
        # Soit 403 (vérification d'appartenance), soit 404 (queryset filtré)
        self.assertIn(resp.status_code, [
            status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND
        ])

    def test_pending_host_validation_passe_a_confirmed(self):
        """Réservation PENDING_HOST_VALIDATION → CONFIRMED après validation paiement."""
        self.booking.status = Booking.PENDING_HOST_VALIDATION
        self.booking.save()
        self.client.force_authenticate(self.host)
        resp = self.client.post(self._url(), {'payment_method': 'wave'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.CONFIRMED)


# ════════════════════════════════════════════════════════════════════════════════
# Approve / Reject
# ════════════════════════════════════════════════════════════════════════════════

class ApproveRejectTests(APITestCase):
    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking = make_setup('approve')
        self.booking.status = Booking.PENDING_HOST_VALIDATION
        self.booking.save()

    def test_approve_confirme(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            f'/api/owner/bookings/{self.booking.pk}/approve/', {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.CONFIRMED)

    def test_approve_refuse_si_wrong_status(self):
        self.booking.status = Booking.CONFIRMED
        self.booking.save()
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            f'/api/owner/bookings/{self.booking.pk}/approve/', {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_rejette(self):
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            f'/api/owner/bookings/{self.booking.pk}/reject/',
            {'reason': 'Complet'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.REJECTED_BY_HOST)


# ════════════════════════════════════════════════════════════════════════════════
# Check-in / Check-out via owner
# ════════════════════════════════════════════════════════════════════════════════

class CheckInOutOwnerTests(APITestCase):
    def setUp(self):
        self.host, self.guest, self.etab, self.room, self.booking = make_setup('checkinout')

    def test_check_in_depuis_confirmed(self):
        self.booking.status = Booking.CONFIRMED
        self.booking.save()
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            f'/api/owner/bookings/{self.booking.pk}/check_in/', {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.IN_PROGRESS)
        self.assertIsNotNone(self.booking.actual_check_in)

    def test_check_in_refuse_si_non_confirme(self):
        self.booking.status = Booking.PENDING_PAYMENT
        self.booking.save()
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            f'/api/owner/bookings/{self.booking.pk}/check_in/', {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_out_depuis_in_progress(self):
        self.booking.status = Booking.IN_PROGRESS
        self.booking.save()
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            f'/api/owner/bookings/{self.booking.pk}/check_out/', {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.COMPLETED)

    def test_check_out_refuse_si_non_en_cours(self):
        self.booking.status = Booking.CONFIRMED
        self.booking.save()
        self.client.force_authenticate(self.host)
        resp = self.client.post(
            f'/api/owner/bookings/{self.booking.pk}/check_out/', {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
