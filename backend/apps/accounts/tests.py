from datetime import date, timedelta
from decimal import Decimal
from io import StringIO

from django.contrib import admin
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase
from django.urls import Resolver404, resolve, reverse
from rest_framework.test import APITestCase
from unfold.admin import ModelAdmin

from apps.bookings.models import Booking, BookingStatusHistory
from apps.establishments.models import (
    Amenity,
    Establishment,
    EstablishmentImage,
    RoomAvailability,
    RoomType,
    RoomTypeImage,
)
from apps.notifications.models import Notification
from apps.payments.models import CommissionSetting, Payment, Payout
from apps.reviews.models import Review, ReviewResponse

from .models import GuestProfile, HostProfile, User


class AdminUnfoldTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='Admin123!',
            first_name='Admin',
            last_name='NoamHome',
        )
        cls.host = User.objects.create_user(
            email='host@example.com',
            password='Host123!',
            role='host',
        )
        cls.guest = User.objects.create_user(
            email='guest@example.com',
            password='Guest123!',
            role='guest',
        )
        cls.establishment = Establishment.objects.create(
            host=cls.host,
            name='Résidence Test',
            description='Description',
            establishment_type='residence',
            address='Abidjan',
            city='Abidjan',
        )
        cls.room_type = RoomType.objects.create(
            establishment=cls.establishment,
            name='Studio',
            base_price_per_night=Decimal('25000'),
            physical_room_count=3,
        )
        cls.booking = Booking.objects.create(
            guest=cls.guest,
            room_type=cls.room_type,
            establishment=cls.establishment,
            check_in_date=date.today() + timedelta(days=2),
            check_out_date=date.today() + timedelta(days=4),
        )

    def setUp(self):
        self.client.force_login(self.admin_user)

    def test_all_business_models_use_unfold_admin(self):
        models = (
            User, GuestProfile, HostProfile, Group, Amenity, Establishment,
            EstablishmentImage, RoomType, RoomTypeImage, RoomAvailability,
            Booking, BookingStatusHistory, Payment, Payout, CommissionSetting,
            Review, ReviewResponse, Notification,
        )
        for model in models:
            with self.subTest(model=model.__name__):
                self.assertIsInstance(admin.site._registry[model], ModelAdmin)

    def test_dashboard_and_all_changelists_render(self):
        self.assertContains(self.client.get(reverse('admin:index')), 'Établissements à valider')
        models = (
            User, GuestProfile, HostProfile, Group, Amenity, Establishment,
            EstablishmentImage, RoomType, RoomTypeImage, RoomAvailability,
            Booking, BookingStatusHistory, Payment, Payout, CommissionSetting,
            Review, ReviewResponse, Notification,
        )
        for model in models:
            url = reverse(f'admin:{model._meta.app_label}_{model._meta.model_name}_changelist')
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 200)

    def test_key_add_forms_render(self):
        models = (User, HostProfile, Amenity, Establishment, RoomType, Booking, Payment, Notification)
        for model in models:
            url = reverse(f'admin:{model._meta.app_label}_{model._meta.model_name}_add')
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 200)

    def test_amenity_admin_crud(self):
        add_url = reverse('admin:establishments_amenity_add')
        response = self.client.post(add_url, {'name': 'Wi-Fi premium', 'category': 'wifi', 'icon': 'wifi'})
        self.assertEqual(response.status_code, 302)

        amenity = Amenity.objects.get(name='Wi-Fi premium')
        change_url = reverse('admin:establishments_amenity_change', args=(amenity.pk,))
        response = self.client.post(
            change_url,
            {'name': 'Wi-Fi très haut débit', 'category': 'wifi', 'icon': 'wifi'},
        )
        self.assertEqual(response.status_code, 302)
        amenity.refresh_from_db()
        self.assertEqual(amenity.name, 'Wi-Fi très haut débit')

        delete_url = reverse('admin:establishments_amenity_delete', args=(amenity.pk,))
        response = self.client.post(delete_url, {'post': 'yes'})
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Amenity.objects.filter(pk=amenity.pk).exists())

    def test_user_admin_creation_uses_email_and_role(self):
        response = self.client.post(
            reverse('admin:accounts_user_add'),
            {
                'email': 'created-in-admin@example.com',
                'first_name': 'Créé',
                'last_name': 'Admin',
                'phone': '',
                'role': 'moderator',
                'password1': 'StrongAdminPassword123!',
                'password2': 'StrongAdminPassword123!',
                'is_active': 'on',
            },
        )
        self.assertEqual(response.status_code, 302)
        created = User.objects.get(email='created-in-admin@example.com')
        self.assertTrue(created.is_staff)
        self.assertFalse(created.is_superuser)

    def test_payment_admin_success_updates_booking_history(self):
        payment = Payment.objects.create(
            booking=self.booking,
            amount=Decimal('1000.00'),
            payment_method='wave',
        )

        response = self.client.post(
            reverse('admin:payments_payment_changelist'),
            {
                'action': 'mark_succeeded',
                '_selected_action': [str(payment.pk)],
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        payment.refresh_from_db()
        self.booking.refresh_from_db()
        self.assertEqual(payment.status, 'succeeded')
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertTrue(
            BookingStatusHistory.objects.filter(
                booking=self.booking,
                status='confirmed',
                changed_by=self.admin_user,
            ).exists()
        )

    def test_review_admin_actions_recalculate_establishment_rating(self):
        review = Review.objects.create(
            booking=self.booking,
            reviewer=self.guest,
            establishment=self.establishment,
            rating_overall=5,
            comment='Excellent séjour.',
        )
        self.establishment.refresh_from_db()
        self.assertEqual(self.establishment.avg_rating, Decimal('5.00'))
        self.assertEqual(self.establishment.review_count, 1)

        response = self.client.post(
            reverse('admin:reviews_review_changelist'),
            {
                'action': 'hide_reviews',
                '_selected_action': [str(review.pk)],
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        review.refresh_from_db()
        self.establishment.refresh_from_db()
        self.assertFalse(review.is_published)
        self.assertEqual(self.establishment.avg_rating, Decimal('0.00'))
        self.assertEqual(self.establishment.review_count, 0)

        self.client.post(
            reverse('admin:reviews_review_changelist'),
            {
                'action': 'publish_reviews',
                '_selected_action': [str(review.pk)],
            },
            follow=True,
        )
        self.establishment.refresh_from_db()
        self.assertEqual(self.establishment.avg_rating, Decimal('5.00'))
        self.assertEqual(self.establishment.review_count, 1)

    def test_alternative_admin_api_is_removed(self):
        with self.assertRaises(Resolver404):
            resolve('/api/admin-panel/overview/')


class BusinessLogicAlignmentTests(TestCase):
    def setUp(self):
        self.host = User.objects.create_user(email='host@example.com', role='host')
        self.guest = User.objects.create_user(email='guest@example.com', role='guest')
        self.establishment = Establishment.objects.create(
            host=self.host,
            name='Hôtel Test',
            description='Description',
            establishment_type='hotel',
            address='Abidjan',
            city='Abidjan',
        )
        self.room_type = RoomType.objects.create(
            establishment=self.establishment,
            name='Chambre',
            base_price_per_night=Decimal('30000'),
            physical_room_count=2,
        )

    def test_roles_control_admin_access_flags(self):
        moderator = User.objects.create_user(email='moderator@example.com', role='moderator')
        self.assertTrue(moderator.is_staff)
        self.assertFalse(moderator.is_superuser)

        moderator.role = 'guest'
        moderator.save()
        self.assertFalse(moderator.is_staff)
        self.assertFalse(moderator.is_superuser)

    def test_host_verification_status_controls_boolean(self):
        profile = HostProfile.objects.create(user=self.host, verification_status='verified')
        self.assertTrue(profile.is_verified)
        profile.verification_status = 'rejected'
        profile.save()
        self.assertFalse(profile.is_verified)

    def test_availability_cannot_exceed_physical_rooms(self):
        availability = RoomAvailability(
            room_type=self.room_type,
            date=date.today(),
            available_count=3,
        )
        with self.assertRaises(ValidationError):
            availability.full_clean()

    def test_booking_relations_and_dates_are_validated(self):
        booking = Booking(
            guest=self.host,
            room_type=self.room_type,
            establishment=self.establishment,
            check_in_date=date.today() + timedelta(days=2),
            check_out_date=date.today() + timedelta(days=1),
        )
        with self.assertRaises(ValidationError):
            booking.full_clean()

    def test_notification_read_timestamp_is_synchronized(self):
        notification = Notification.objects.create(
            user=self.guest,
            notification_type='system',
            title='Test',
            message='Test',
            is_read=True,
        )
        self.assertIsNotNone(notification.read_at)
        notification.is_read = False
        notification.save()
        self.assertIsNone(notification.read_at)


class ApiAlignmentTests(APITestCase):
    def setUp(self):
        self.host = User.objects.create_user(email='host-api@example.com', role='host')
        self.guest = User.objects.create_user(email='guest-api@example.com', role='guest')
        self.establishment = Establishment.objects.create(
            host=self.host,
            name='Hôtel API',
            description='Description',
            establishment_type='hotel',
            address='Abidjan',
            city='Abidjan',
            status='active',
        )
        self.room_type = RoomType.objects.create(
            establishment=self.establishment,
            name='Chambre API',
            base_price_per_night=Decimal('30000'),
            physical_room_count=2,
        )
        self.booking = Booking.objects.create(
            guest=self.guest,
            room_type=self.room_type,
            establishment=self.establishment,
            check_in_date=date.today() + timedelta(days=2),
            check_out_date=date.today() + timedelta(days=4),
            subtotal=Decimal('60000'),
            total_amount=Decimal('69000'),
            host_payout=Decimal('51000'),
        )

    def test_public_and_canonical_establishment_endpoints(self):
        self.assertEqual(self.client.get('/api/public/hebergements/').status_code, 200)
        self.assertEqual(self.client.get('/api/establishments/').status_code, 200)

    def test_client_dashboard_and_booking_fields(self):
        self.client.force_authenticate(self.guest)
        self.assertEqual(self.client.get('/api/client/dashboard/').status_code, 200)
        response = self.client.get('/api/client/reservations/')
        self.assertEqual(response.status_code, 200)
        booking = response.data['results'][0]
        self.assertIn('check_in', booking)
        self.assertIn('total_price', booking)

    def test_hotel_endpoints_are_host_only_and_aligned(self):
        self.client.force_authenticate(self.host)
        self.assertEqual(self.client.get('/api/hotel/dashboard/').status_code, 200)
        self.assertEqual(self.client.get('/api/hotel/etablissements/').status_code, 200)
        self.assertEqual(self.client.get('/api/hotel/chambres/').status_code, 200)
        self.assertEqual(self.client.get('/api/hotel/reservations/').status_code, 200)

        self.client.force_authenticate(self.guest)
        self.assertEqual(self.client.get('/api/hotel/dashboard/').status_code, 403)

    def test_payment_creation_uses_booking_amount_and_confirms_booking(self):
        self.client.force_authenticate(self.guest)
        response = self.client.post(
            '/api/payments/payments/',
            {'booking': str(self.booking.pk), 'payment_method': 'wave'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        payment = Payment.objects.get(booking=self.booking)
        self.assertEqual(payment.amount, self.booking.total_amount)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')


class InitialDataCommandTests(TestCase):
    def test_create_initial_data_command_is_idempotent(self):
        output = StringIO()
        call_command('create_initial_data', stdout=output)
        call_command('create_initial_data', stdout=output)
        self.assertTrue(User.objects.filter(email='admin@noamhome.ci', is_superuser=True).exists())
        self.assertGreater(Establishment.objects.count(), 0)
        self.assertGreater(RoomType.objects.count(), 0)
        self.assertGreater(RoomAvailability.objects.count(), 0)
