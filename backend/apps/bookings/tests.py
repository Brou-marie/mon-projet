"""
Tests unitaires — apps.bookings

Couvre :
  - services : booking_nights, quote_room_type, decrement_availability,
               restore_availability, set_booking_status
  - modèles  : Booking (génération booking_number, reservation_code,
               total_nights, validations)
  - vues API : création réservation, annulation, check-in/check-out,
               validate_payment, lookup-code
"""
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.models import User, GuestProfile
from apps.establishments.models import Establishment, RoomType, RoomAvailability
from apps.bookings.models import Booking, BookingStatusHistory
from apps.bookings.services import (
    booking_nights,
    decrement_availability,
    quote_room_type,
    restore_availability,
    set_booking_status,
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_users():
    host = User.objects.create_user(
        email='host@bookings.ci', password='pass', role='host',
        first_name='Hôte', last_name='Test',
    )
    guest = User.objects.create_user(
        email='guest@bookings.ci', password='pass', role='guest',
        first_name='Client', last_name='Test',
    )
    GuestProfile.objects.get_or_create(user=guest)
    return host, guest


def make_establishment(host, requires_manual=False):
    return Establishment.objects.create(
        host=host,
        name='Hôtel Test',
        description='Desc',
        establishment_type='hotel',
        address='Abidjan',
        city='Abidjan',
        status='active',
        requires_manual_validation=requires_manual,
    )


def make_room_type(establishment, price='30000', rooms=3):
    return RoomType.objects.create(
        establishment=establishment,
        name='Chambre Standard',
        base_price_per_night=Decimal(price),
        physical_room_count=rooms,
        capacity_adults=2,
        capacity_children=1,
    )


def make_availability(room_type, check_in, check_out, count=2, price=None):
    """Crée les disponibilités pour chaque nuit du séjour."""
    nights = booking_nights(check_in, check_out)
    for night in nights:
        RoomAvailability.objects.get_or_create(
            room_type=room_type,
            date=night,
            defaults={'available_count': count, 'special_price': price},
        )
    return nights


def make_booking(guest, room_type, establishment, days_from_now=2, nights=2,
                 status=Booking.PENDING_PAYMENT, total='66000'):
    check_in = date.today() + timedelta(days=days_from_now)
    check_out = check_in + timedelta(days=nights)
    return Booking.objects.create(
        guest=guest,
        room_type=room_type,
        establishment=establishment,
        check_in_date=check_in,
        check_out_date=check_out,
        status=status,
        total_amount=Decimal(total),
        subtotal=Decimal(total),
        base_subtotal=Decimal(total),
        host_payout=Decimal(total),
    )


# ════════════════════════════════════════════════════════════════════════════════
# Services
# ════════════════════════════════════════════════════════════════════════════════

class BookingNightsTests(TestCase):
    def test_deux_nuits(self):
        d = date(2025, 8, 1)
        nights = booking_nights(d, d + timedelta(days=2))
        self.assertEqual(len(nights), 2)
        self.assertEqual(nights[0], d)
        self.assertEqual(nights[1], d + timedelta(days=1))

    def test_une_nuit(self):
        d = date(2025, 8, 10)
        self.assertEqual(len(booking_nights(d, d + timedelta(days=1))), 1)

    def test_meme_jour_retourne_vide(self):
        d = date(2025, 8, 10)
        self.assertEqual(booking_nights(d, d), [])


class QuoteRoomTypeTests(TestCase):
    def setUp(self):
        self.host, self.guest = make_users()
        self.etab = make_establishment(self.host)
        self.room = make_room_type(self.etab, price='25000')
        self.check_in = date.today() + timedelta(days=3)
        self.check_out = self.check_in + timedelta(days=3)
        make_availability(self.room, self.check_in, self.check_out, count=2)

    def test_available_true_quand_dispo(self):
        q = quote_room_type(self.room, self.check_in, self.check_out)
        self.assertTrue(q['available'])
        self.assertEqual(len(q['unavailable_dates']), 0)

    def test_calcul_base_subtotal(self):
        q = quote_room_type(self.room, self.check_in, self.check_out)
        # 3 nuits × 25000 = 75000
        self.assertEqual(q['base_subtotal'], Decimal('75000.00'))

    def test_platform_fee_10_pourcent(self):
        q = quote_room_type(self.room, self.check_in, self.check_out)
        expected_fee = (q['subtotal'] * Decimal('10') / Decimal('100')).quantize(Decimal('0.01'))
        self.assertEqual(q['platform_fee'], expected_fee)

    def test_total_amount_subtotal_plus_fee(self):
        q = quote_room_type(self.room, self.check_in, self.check_out)
        self.assertEqual(q['total_amount'], q['subtotal'] + q['platform_fee'])

    def test_unavailable_si_count_zero(self):
        RoomAvailability.objects.filter(room_type=self.room).update(available_count=0)
        q = quote_room_type(self.room, self.check_in, self.check_out)
        self.assertFalse(q['available'])
        self.assertEqual(len(q['unavailable_dates']), 3)

    def test_prix_special_utilise_si_present(self):
        RoomAvailability.objects.filter(room_type=self.room).update(special_price=Decimal('20000'))
        q = quote_room_type(self.room, self.check_in, self.check_out)
        self.assertEqual(q['base_subtotal'], Decimal('60000.00'))

    def test_host_payout_egal_subtotal_moins_fee(self):
        q = quote_room_type(self.room, self.check_in, self.check_out)
        self.assertEqual(q['host_payout'], q['subtotal'] - q['platform_fee'])

    def test_loyalty_discount_bronze_zero(self):
        """Un guest Bronze n'a pas de réduction."""
        q = quote_room_type(self.room, self.check_in, self.check_out, user=self.guest)
        self.assertEqual(q['loyalty_discount'], Decimal('0.00'))


class DecrementAvailabilityTests(TestCase):
    def setUp(self):
        self.host, self.guest = make_users()
        self.etab = make_establishment(self.host)
        self.room = make_room_type(self.etab, rooms=2)
        self.check_in = date.today() + timedelta(days=5)
        self.check_out = self.check_in + timedelta(days=2)
        self.nights = make_availability(self.room, self.check_in, self.check_out, count=2)

    def test_decrement_reussi(self):
        result = decrement_availability(self.room, self.nights)
        self.assertTrue(result)
        avail = RoomAvailability.objects.get(room_type=self.room, date=self.nights[0])
        self.assertEqual(avail.available_count, 1)

    def test_echec_si_count_zero(self):
        RoomAvailability.objects.filter(room_type=self.room).update(available_count=0)
        result = decrement_availability(self.room, self.nights)
        self.assertFalse(result)

    def test_echec_si_manuellement_bloque(self):
        RoomAvailability.objects.filter(room_type=self.room).update(is_manually_blocked=True)
        result = decrement_availability(self.room, self.nights)
        self.assertFalse(result)


class RestoreAvailabilityTests(TestCase):
    def setUp(self):
        self.host, self.guest = make_users()
        self.etab = make_establishment(self.host)
        self.room = make_room_type(self.etab, rooms=3)
        self.check_in = date.today() + timedelta(days=7)
        self.check_out = self.check_in + timedelta(days=2)
        make_availability(self.room, self.check_in, self.check_out, count=1)
        self.booking = make_booking(
            self.guest, self.room, self.etab,
            days_from_now=7, nights=2,
        )

    def test_restaure_disponibilite(self):
        restore_availability(self.booking)
        for night in booking_nights(self.check_in, self.check_out):
            avail = RoomAvailability.objects.get(room_type=self.room, date=night)
            self.assertEqual(avail.available_count, 2)

    def test_ne_depasse_pas_physical_room_count(self):
        """La restauration ne dépasse jamais physical_room_count."""
        RoomAvailability.objects.filter(room_type=self.room).update(available_count=3)
        restore_availability(self.booking)
        for night in booking_nights(self.check_in, self.check_out):
            avail = RoomAvailability.objects.get(room_type=self.room, date=night)
            self.assertLessEqual(avail.available_count, self.room.physical_room_count)


class SetBookingStatusTests(TestCase):
    def setUp(self):
        self.host, self.guest = make_users()
        self.etab = make_establishment(self.host)
        self.room = make_room_type(self.etab)
        self.booking = make_booking(self.guest, self.room, self.etab)

    def test_change_le_statut(self):
        set_booking_status(self.booking, Booking.CONFIRMED, note='Auto')
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.CONFIRMED)

    def test_cree_historique(self):
        set_booking_status(self.booking, Booking.CONFIRMED, changed_by=self.host, note='Test')
        hist = BookingStatusHistory.objects.filter(booking=self.booking, status=Booking.CONFIRMED)
        self.assertTrue(hist.exists())
        self.assertEqual(hist.first().note, 'Test')


# ════════════════════════════════════════════════════════════════════════════════
# Modèles
# ════════════════════════════════════════════════════════════════════════════════

class BookingModelTests(TestCase):
    def setUp(self):
        self.host, self.guest = make_users()
        self.etab = make_establishment(self.host)
        self.room = make_room_type(self.etab)

    def test_booking_number_genere_automatiquement(self):
        b = make_booking(self.guest, self.room, self.etab)
        self.assertTrue(b.booking_number.startswith('NOAM'))
        self.assertEqual(len(b.booking_number), 12)

    def test_reservation_code_genere_6_chars(self):
        b = make_booking(self.guest, self.room, self.etab)
        self.assertEqual(len(b.reservation_code), 6)
        self.assertTrue(b.reservation_code.isalnum())

    def test_total_nights_calcule(self):
        b = make_booking(self.guest, self.room, self.etab, nights=4)
        self.assertEqual(b.total_nights, 4)

    def test_clean_date_depart_avant_arrivee(self):
        b = Booking(
            guest=self.guest,
            room_type=self.room,
            establishment=self.etab,
            check_in_date=date.today() + timedelta(days=5),
            check_out_date=date.today() + timedelta(days=3),
        )
        with self.assertRaises(ValidationError) as ctx:
            b.full_clean()
        self.assertIn('check_out_date', ctx.exception.message_dict)

    def test_clean_guest_doit_etre_voyageur(self):
        b = Booking(
            guest=self.host,  # host ne peut pas réserver
            room_type=self.room,
            establishment=self.etab,
            check_in_date=date.today() + timedelta(days=2),
            check_out_date=date.today() + timedelta(days=4),
        )
        with self.assertRaises(ValidationError) as ctx:
            b.full_clean()
        self.assertIn('guest', ctx.exception.message_dict)

    def test_booking_numbers_uniques(self):
        b1 = make_booking(self.guest, self.room, self.etab)
        b2 = make_booking(self.guest, self.room, self.etab, days_from_now=10)
        self.assertNotEqual(b1.booking_number, b2.booking_number)
        self.assertNotEqual(b1.reservation_code, b2.reservation_code)

    def test_str_contient_booking_number(self):
        b = make_booking(self.guest, self.room, self.etab)
        self.assertIn(b.booking_number, str(b))


# ════════════════════════════════════════════════════════════════════════════════
# API Views
# ════════════════════════════════════════════════════════════════════════════════

class BookingAPITests(APITestCase):
    def setUp(self):
        self.host, self.guest = make_users()
        self.etab = make_establishment(self.host)
        self.room = make_room_type(self.etab)
        self.check_in = date.today() + timedelta(days=3)
        self.check_out = self.check_in + timedelta(days=2)
        make_availability(self.room, self.check_in, self.check_out, count=3)

    def test_creation_reservation_guest(self):
        self.client.force_authenticate(self.guest)
        payload = {
            'room_type_id': str(self.room.pk),
            'check_in_date': str(self.check_in),
            'check_out_date': str(self.check_out),
            'guest_count_adults': 1,
            'guest_count_children': 0,
        }
        resp = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['status'], Booking.PENDING_PAYMENT)
        self.assertIn('reservation_code', resp.data)
        self.assertEqual(len(resp.data['reservation_code']), 6)

    def test_creation_interdit_pour_host(self):
        self.client.force_authenticate(self.host)
        payload = {
            'room_type_id': str(self.room.pk),
            'check_in_date': str(self.check_in),
            'check_out_date': str(self.check_out),
            'guest_count_adults': 1,
        }
        resp = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_creation_interdit_si_non_authentifie(self):
        payload = {
            'room_type_id': str(self.room.pk),
            'check_in_date': str(self.check_in),
            'check_out_date': str(self.check_out),
        }
        resp = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_erreur_dates_invalides(self):
        self.client.force_authenticate(self.guest)
        payload = {
            'room_type_id': str(self.room.pk),
            'check_in_date': str(self.check_out),   # inversé
            'check_out_date': str(self.check_in),
        }
        resp = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_annulation_par_guest(self):
        self.client.force_authenticate(self.guest)
        booking = make_booking(
            self.guest, self.room, self.etab,
            days_from_now=3, nights=2,
            status=Booking.CONFIRMED,
        )
        resp = self.client.post(
            f'/api/bookings/{booking.booking_number}/cancel/',
            {'reason': 'Changement de plans'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertIn(booking.status, [Booking.CANCELLED, Booking.CANCELLED_REFUNDED])

    def test_annulation_interdit_si_completed(self):
        self.client.force_authenticate(self.guest)
        booking = make_booking(
            self.guest, self.room, self.etab,
            status=Booking.COMPLETED,
        )
        resp = self.client.post(
            f'/api/bookings/{booking.booking_number}/cancel/', {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_guest_ne_voit_que_ses_reservations(self):
        guest2 = User.objects.create_user(
            email='autre@test.ci', password='pass', role='guest',
        )
        GuestProfile.objects.get_or_create(user=guest2)
        b1 = make_booking(self.guest, self.room, self.etab)
        make_booking(guest2, self.room, self.etab, days_from_now=15)

        self.client.force_authenticate(self.guest)
        resp = self.client.get('/api/bookings/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get('results', resp.data)
        # Tous les booking_numbers retournés doivent appartenir à self.guest
        booking_numbers = [b['booking_number'] for b in results]
        self.assertIn(b1.booking_number, booking_numbers)
        # La réservation de guest2 ne doit pas apparaître
        guest2_bookings = Booking.objects.filter(guest=guest2)
        for bk in guest2_bookings:
            self.assertNotIn(bk.booking_number, booking_numbers)

    def test_check_in_confirme_reservations(self):
        self.client.force_authenticate(self.guest)
        booking = make_booking(
            self.guest, self.room, self.etab,
            days_from_now=1, nights=2,
            status=Booking.CONFIRMED,
        )
        resp = self.client.post(
            f'/api/bookings/{booking.booking_number}/check_in/', {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.IN_PROGRESS)
        self.assertIsNotNone(booking.actual_check_in)

    def test_check_in_refuse_si_non_confirme(self):
        self.client.force_authenticate(self.guest)
        booking = make_booking(
            self.guest, self.room, self.etab,
            status=Booking.PENDING_PAYMENT,
        )
        resp = self.client.post(
            f'/api/bookings/{booking.booking_number}/check_in/', {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_out_complete_la_reservation(self):
        self.client.force_authenticate(self.guest)
        booking = make_booking(
            self.guest, self.room, self.etab,
            status=Booking.IN_PROGRESS,
        )
        resp = self.client.post(
            f'/api/bookings/{booking.booking_number}/check_out/', {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.COMPLETED)


class ValidatePaymentAPITests(APITestCase):
    """Tests de l'endpoint validate_payment (ancienne route /api/bookings/)."""

    def setUp(self):
        self.host, self.guest = make_users()
        self.etab = make_establishment(self.host)
        self.room = make_room_type(self.etab)

    def test_host_peut_valider_paiement(self):
        self.client.force_authenticate(self.host)
        booking = make_booking(
            self.guest, self.room, self.etab,
            status=Booking.PENDING_PAYMENT,
        )
        resp = self.client.post(
            f'/api/bookings/{booking.booking_number}/validate_payment/',
            {'payment_method': 'wave'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.payment_status, 'paid')
        self.assertEqual(booking.payment_method, 'wave')
        self.assertEqual(booking.status, Booking.CONFIRMED)

    def test_guest_ne_peut_pas_valider(self):
        self.client.force_authenticate(self.guest)
        booking = make_booking(self.guest, self.room, self.etab)
        resp = self.client.post(
            f'/api/bookings/{booking.booking_number}/validate_payment/',
            {'payment_method': 'cash'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_erreur_si_methode_invalide(self):
        self.client.force_authenticate(self.host)
        booking = make_booking(self.guest, self.room, self.etab)
        resp = self.client.post(
            f'/api/bookings/{booking.booking_number}/validate_payment/',
            {'payment_method': 'bitcoin'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_erreur_si_deja_paye(self):
        self.client.force_authenticate(self.host)
        booking = make_booking(
            self.guest, self.room, self.etab,
            status=Booking.CONFIRMED,
        )
        booking.payment_status = 'paid'
        booking.save()
        resp = self.client.post(
            f'/api/bookings/{booking.booking_number}/validate_payment/',
            {'payment_method': 'cash'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
