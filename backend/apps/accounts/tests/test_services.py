"""
Tests unitaires — apps.accounts.services (programme de fidélité)

Couvre :
  - LoyaltyTier.get_tier
  - calculate_points_for_booking
  - add_loyalty_points / redeem_loyalty_points
  - get_loyalty_discount
  - get_user_loyalty_info
  - process_booking_completion
"""
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User, GuestProfile, LoyaltyPointsHistory
from apps.accounts.services import (
    LoyaltyTier,
    add_loyalty_points,
    calculate_points_for_booking,
    get_loyalty_discount,
    get_user_loyalty_info,
    process_booking_completion,
    redeem_loyalty_points,
)
from apps.establishments.models import Establishment, RoomType
from apps.bookings.models import Booking


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_guest(email='guest@fidelite.ci', points=0):
    user = User.objects.create_user(
        email=email, password='pass', role='guest',
        first_name='Client', last_name='Fidèle',
    )
    profile, _ = GuestProfile.objects.get_or_create(user=user)
    if points:
        profile.loyalty_points = points
        profile.save()
    return user


def make_host(email='host@fidelite.ci'):
    return User.objects.create_user(
        email=email, password='pass', role='host',
    )


def make_completed_booking(guest, nights=2, base_amount=60000):
    host = make_host(f'host_{guest.email}')
    etab = Establishment.objects.create(
        host=host, name='Hôtel Fidélité',
        description='Desc', establishment_type='hotel',
        address='Abidjan', city='Abidjan', status='active',
    )
    room = RoomType.objects.create(
        establishment=etab, name='Chambre',
        base_price_per_night=Decimal(str(base_amount // nights)),
        physical_room_count=2,
    )
    check_in = date.today() - timedelta(days=nights + 1)
    check_out = check_in + timedelta(days=nights)
    return Booking.objects.create(
        guest=guest, room_type=room, establishment=etab,
        check_in_date=check_in, check_out_date=check_out,
        status=Booking.COMPLETED,
        total_amount=Decimal(str(base_amount)),
        subtotal=Decimal(str(base_amount)),
        base_subtotal=Decimal(str(base_amount)),
        host_payout=Decimal(str(base_amount)),
    )


# ════════════════════════════════════════════════════════════════════════════════
# LoyaltyTier
# ════════════════════════════════════════════════════════════════════════════════

class LoyaltyTierTests(TestCase):
    def test_0_points_bronze(self):
        self.assertEqual(LoyaltyTier.get_tier(0), LoyaltyTier.BRONZE)

    def test_999_points_bronze(self):
        self.assertEqual(LoyaltyTier.get_tier(999), LoyaltyTier.BRONZE)

    def test_1000_points_silver(self):
        self.assertEqual(LoyaltyTier.get_tier(1000), LoyaltyTier.SILVER)

    def test_4999_points_silver(self):
        self.assertEqual(LoyaltyTier.get_tier(4999), LoyaltyTier.SILVER)

    def test_5000_points_gold(self):
        self.assertEqual(LoyaltyTier.get_tier(5000), LoyaltyTier.GOLD)

    def test_14999_points_gold(self):
        self.assertEqual(LoyaltyTier.get_tier(14999), LoyaltyTier.GOLD)

    def test_15000_points_platinum(self):
        self.assertEqual(LoyaltyTier.get_tier(15000), LoyaltyTier.PLATINUM)

    def test_100000_points_platinum(self):
        self.assertEqual(LoyaltyTier.get_tier(100000), LoyaltyTier.PLATINUM)


# ════════════════════════════════════════════════════════════════════════════════
# calculate_points_for_booking
# ════════════════════════════════════════════════════════════════════════════════

class CalculatePointsTests(TestCase):
    def setUp(self):
        self.guest = make_guest()

    def test_1_point_par_100_xof(self):
        booking = make_completed_booking(self.guest, nights=2, base_amount=10000)
        points = calculate_points_for_booking(booking)
        self.assertEqual(points, 100)  # 10000 / 100 = 100

    def test_bonus_7_nuits_10_pourcent(self):
        booking = make_completed_booking(self.guest, nights=7, base_amount=70000)
        points = calculate_points_for_booking(booking)
        base = 70000 // 100  # 700
        expected = base + int(base * 0.1)  # 770
        self.assertEqual(points, expected)

    def test_bonus_haute_valeur_100000_xof(self):
        booking = make_completed_booking(self.guest, nights=2, base_amount=100000)
        points = calculate_points_for_booking(booking)
        base = 100000 // 100  # 1000
        expected = base + int(base * 0.15)  # 1150
        self.assertEqual(points, expected)

    def test_points_positifs_pour_petite_reservation(self):
        booking = make_completed_booking(self.guest, nights=1, base_amount=5000)
        points = calculate_points_for_booking(booking)
        self.assertGreater(points, 0)


# ════════════════════════════════════════════════════════════════════════════════
# add_loyalty_points
# ════════════════════════════════════════════════════════════════════════════════

class AddLoyaltyPointsTests(TestCase):
    def setUp(self):
        self.guest = make_guest()

    def test_ajoute_points(self):
        result = add_loyalty_points(self.guest, 500, reason='Test')
        self.assertEqual(result['points_added'], 500)
        self.assertEqual(result['total_points'], 500)

    def test_cree_historique(self):
        add_loyalty_points(self.guest, 100, reason='Réservation test')
        hist = LoyaltyPointsHistory.objects.filter(user=self.guest, transaction_type='earned')
        self.assertTrue(hist.exists())
        self.assertEqual(hist.first().points, 100)

    def test_accumulatif(self):
        add_loyalty_points(self.guest, 300)
        add_loyalty_points(self.guest, 700)
        profile = self.guest.guest_profile
        profile.refresh_from_db()
        self.assertEqual(profile.loyalty_points, 1000)

    def test_host_ne_gagne_pas_de_points(self):
        host = make_host()
        result = add_loyalty_points(host, 500)
        self.assertIsNone(result)

    def test_tier_bronze_initialement(self):
        result = add_loyalty_points(self.guest, 50)
        self.assertEqual(result['current_tier'], LoyaltyTier.BRONZE)

    def test_tier_silver_a_1000_points(self):
        result = add_loyalty_points(self.guest, 1000)
        self.assertEqual(result['current_tier'], LoyaltyTier.SILVER)

    def test_balance_after_correct_dans_historique(self):
        add_loyalty_points(self.guest, 200)
        add_loyalty_points(self.guest, 300)
        last = LoyaltyPointsHistory.objects.filter(user=self.guest).order_by('-created_at').first()
        self.assertEqual(last.balance_after, 500)


# ════════════════════════════════════════════════════════════════════════════════
# redeem_loyalty_points
# ════════════════════════════════════════════════════════════════════════════════

class RedeemLoyaltyPointsTests(TestCase):
    def setUp(self):
        self.guest = make_guest(points=2000)

    def test_echange_reussi(self):
        result = redeem_loyalty_points(self.guest, 500)
        self.assertTrue(result['success'])
        self.assertEqual(result['points_redeemed'], 500)
        self.assertEqual(result['remaining_points'], 1500)

    def test_echec_si_points_insuffisants(self):
        result = redeem_loyalty_points(self.guest, 5000)
        self.assertFalse(result['success'])
        self.assertEqual(result['available_points'], 2000)

    def test_cree_historique_redeemed(self):
        redeem_loyalty_points(self.guest, 100)
        hist = LoyaltyPointsHistory.objects.filter(user=self.guest, transaction_type='redeemed')
        self.assertTrue(hist.exists())
        self.assertEqual(hist.first().points, -100)

    def test_host_ne_peut_pas_echanger(self):
        host = make_host('host2@fid.ci')
        result = redeem_loyalty_points(host, 100)
        self.assertIsNone(result)


# ════════════════════════════════════════════════════════════════════════════════
# get_loyalty_discount
# ════════════════════════════════════════════════════════════════════════════════

class GetLoyaltyDiscountTests(TestCase):
    def test_bronze_0_pourcent(self):
        guest = make_guest(points=0)
        discount = get_loyalty_discount(guest, Decimal('100000'))
        self.assertEqual(discount, Decimal('0'))

    def test_silver_5_pourcent(self):
        guest = make_guest(points=1000)
        discount = get_loyalty_discount(guest, Decimal('100000'))
        self.assertEqual(discount, Decimal('5000'))

    def test_gold_10_pourcent(self):
        guest = make_guest(points=5000)
        discount = get_loyalty_discount(guest, Decimal('100000'))
        self.assertEqual(discount, Decimal('10000'))

    def test_platinum_15_pourcent(self):
        guest = make_guest(points=15000)
        discount = get_loyalty_discount(guest, Decimal('100000'))
        self.assertEqual(discount, Decimal('15000'))

    def test_host_retourne_0(self):
        host = make_host('host3@fid.ci')
        discount = get_loyalty_discount(host, Decimal('100000'))
        self.assertEqual(discount, 0)

    def test_discount_proportionnel_au_montant(self):
        guest = make_guest(points=5000)  # Gold = 10%
        discount = get_loyalty_discount(guest, Decimal('50000'))
        self.assertEqual(discount, Decimal('5000'))


# ════════════════════════════════════════════════════════════════════════════════
# get_user_loyalty_info
# ════════════════════════════════════════════════════════════════════════════════

class GetUserLoyaltyInfoTests(TestCase):
    def test_infos_bronze(self):
        guest = make_guest(points=500)
        info = get_user_loyalty_info(guest)
        self.assertEqual(info['current_tier'], LoyaltyTier.BRONZE)
        self.assertEqual(info['total_points'], 500)
        self.assertEqual(info['discount_percent'], 0)
        self.assertEqual(info['next_tier'], LoyaltyTier.SILVER)
        self.assertEqual(info['points_to_next_tier'], 500)

    def test_infos_platinum_pas_de_next_tier(self):
        guest = make_guest(points=20000)
        info = get_user_loyalty_info(guest)
        self.assertEqual(info['current_tier'], LoyaltyTier.PLATINUM)
        self.assertIsNone(info['next_tier'])
        self.assertEqual(info['points_to_next_tier'], 0)

    def test_tier_progress_correct(self):
        guest = make_guest(points=5000)
        info = get_user_loyalty_info(guest)
        self.assertTrue(info['tier_progress']['bronze'])
        self.assertTrue(info['tier_progress']['silver'])
        self.assertTrue(info['tier_progress']['gold'])
        self.assertFalse(info['tier_progress']['platinum'])

    def test_host_retourne_none(self):
        host = make_host('host4@fid.ci')
        result = get_user_loyalty_info(host)
        self.assertIsNone(result)


# ════════════════════════════════════════════════════════════════════════════════
# process_booking_completion
# ════════════════════════════════════════════════════════════════════════════════

class ProcessBookingCompletionTests(TestCase):
    def test_ajoute_points_apres_completion(self):
        guest = make_guest('guest_completion@fid.ci')
        booking = make_completed_booking(guest, nights=2, base_amount=20000)
        result = process_booking_completion(booking)
        self.assertIsNotNone(result)
        self.assertGreater(result['points_added'], 0)
        profile = guest.guest_profile
        profile.refresh_from_db()
        self.assertGreater(profile.loyalty_points, 0)

    def test_booking_number_dans_historique(self):
        guest = make_guest('guest_hist@fid.ci')
        booking = make_completed_booking(guest, nights=2, base_amount=20000)
        process_booking_completion(booking)
        hist = LoyaltyPointsHistory.objects.filter(user=guest).first()
        self.assertEqual(hist.booking_number, booking.booking_number)
