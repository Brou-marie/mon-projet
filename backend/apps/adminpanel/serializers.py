from rest_framework import serializers

from apps.accounts.models import HostProfile, User
from apps.bookings.models import Booking
from apps.establishments.models import Establishment
from apps.payments.models import Payment


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_label = serializers.CharField(source='get_role_display', read_only=True)
    host_verification_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
            'role', 'role_label', 'is_active', 'is_staff', 'is_email_verified',
            'is_phone_verified', 'host_verification_status', 'created_at',
        )
        read_only_fields = ('id', 'full_name', 'role_label', 'created_at')

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email.split('@')[0]

    def get_host_verification_status(self, obj):
        if obj.role == 'host' and hasattr(obj, 'host_profile'):
            return obj.host_profile.verification_status
        return None


class AdminHostProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    phone = serializers.CharField(source='user.phone', read_only=True)

    class Meta:
        model = HostProfile
        fields = (
            'id', 'user_id', 'user_email', 'user_name', 'phone', 'company_name',
            'business_registration', 'address', 'description',
            'verification_status', 'is_verified', 'commission_override_percent',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'user_id', 'user_email', 'user_name', 'phone',
            'created_at', 'updated_at',
        )

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email.split('@')[0]

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        if instance.verification_status == 'verified':
            instance.is_verified = True
            instance.save(update_fields=['is_verified', 'updated_at'])
        elif instance.verification_status == 'rejected':
            instance.is_verified = False
            instance.save(update_fields=['is_verified', 'updated_at'])
        return instance


class AdminEstablishmentSerializer(serializers.ModelSerializer):
    host_id = serializers.UUIDField(source='host.id', read_only=True)
    host_email = serializers.EmailField(source='host.email', read_only=True)
    host_name = serializers.SerializerMethodField()
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    type_label = serializers.CharField(source='get_establishment_type_display', read_only=True)
    lowest_price = serializers.SerializerMethodField()
    room_types_count = serializers.IntegerField(source='room_types.count', read_only=True)

    class Meta:
        model = Establishment
        fields = (
            'id', 'name', 'slug', 'establishment_type', 'type_label', 'city',
            'quarter', 'status', 'status_label', 'is_featured', 'avg_rating',
            'review_count', 'host_id', 'host_email', 'host_name',
            'lowest_price', 'room_types_count', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'slug', 'establishment_type', 'type_label', 'city', 'quarter',
            'avg_rating', 'review_count', 'host_id', 'host_email', 'host_name',
            'lowest_price', 'room_types_count', 'created_at', 'updated_at',
        )

    def get_host_name(self, obj):
        return obj.host.get_full_name() or obj.host.email.split('@')[0]

    def get_lowest_price(self, obj):
        prices = [
            room.base_price_per_night
            for room in obj.room_types.filter(is_active=True)
        ]
        return min(prices) if prices else None


class AdminBookingSerializer(serializers.ModelSerializer):
    guest_email = serializers.EmailField(source='guest.email', read_only=True)
    guest_name = serializers.SerializerMethodField()
    establishment_name = serializers.CharField(source='establishment.name', read_only=True)
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            'id', 'booking_number', 'guest_email', 'guest_name',
            'establishment_name', 'room_type_name', 'check_in_date',
            'check_out_date', 'total_nights', 'status', 'status_label',
            'total_amount', 'commission_amount', 'host_payout',
            'payment_status', 'created_at',
        )
        read_only_fields = fields

    def get_guest_name(self, obj):
        return obj.guest.get_full_name() or obj.guest.email.split('@')[0]

    def get_payment_status(self, obj):
        if hasattr(obj, 'payment'):
            return obj.payment.status
        return None


class AdminPaymentSerializer(serializers.ModelSerializer):
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)
    guest_email = serializers.EmailField(source='booking.guest.email', read_only=True)
    establishment_name = serializers.CharField(source='booking.establishment.name', read_only=True)
    method_label = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'booking_number', 'guest_email', 'establishment_name',
            'amount', 'currency', 'payment_method', 'method_label',
            'status', 'status_label', 'provider_reference',
            'paid_at', 'created_at',
        )
        read_only_fields = fields
