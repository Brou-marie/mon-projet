from rest_framework import serializers
from apps.establishments.models import Establishment, RoomType, RoomAvailability
from apps.bookings.models import Booking
from apps.accounts.serializers import UserSerializer


class OwnerDashboardSerializer(serializers.Serializer):
    total_establishments  = serializers.IntegerField()
    total_rooms           = serializers.IntegerField()
    active_bookings       = serializers.IntegerField()
    pending_bookings      = serializers.IntegerField()
    completed_bookings    = serializers.IntegerField()
    total_revenue         = serializers.DecimalField(max_digits=12, decimal_places=2)
    current_month_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_rating        = serializers.DecimalField(max_digits=3, decimal_places=2)
    total_reviews         = serializers.IntegerField()


class OwnerEstablishmentSerializer(serializers.ModelSerializer):
    """Lecture et création/modification d'un établissement par l'hébergeur."""
    room_count    = serializers.SerializerMethodField()
    booking_count = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()

    class Meta:
        model  = Establishment
        fields = [
            'id', 'name', 'slug', 'description', 'establishment_type',
            'address', 'city', 'quarter', 'latitude', 'longitude',
            'check_in_time', 'check_out_time', 'cancellation_policy',
            'status', 'requires_manual_validation', 'is_featured',
            'avg_rating', 'review_count', 'room_count', 'booking_count',
            'total_revenue', 'created_at',
        ]
        read_only_fields = [
            'id', 'slug', 'status', 'is_featured',
            'avg_rating', 'review_count', 'created_at',
        ]

    def get_room_count(self, obj):
        return obj.room_types.count()

    def get_booking_count(self, obj):
        return obj.bookings.count()

    def get_total_revenue(self, obj):
        from django.db.models import Sum
        return obj.bookings.filter(status=Booking.COMPLETED).aggregate(
            total=Sum('host_payout')
        )['total'] or 0


class OwnerRoomTypeSerializer(serializers.ModelSerializer):
    """CRUD chambres pour l'hébergeur."""
    establishment_name = serializers.CharField(source='establishment.name', read_only=True)
    booking_count      = serializers.SerializerMethodField()

    class Meta:
        model  = RoomType
        fields = [
            'id', 'name', 'description', 'establishment', 'establishment_name',
            'capacity_adults', 'capacity_children', 'base_price_per_night',
            'physical_room_count', 'size_sqm', 'bed_type', 'is_active',
            'booking_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_booking_count(self, obj):
        return obj.bookings.count()

    def validate_establishment(self, value):
        request = self.context.get('request')
        if request and value.host != request.user:
            raise serializers.ValidationError("Cet établissement ne vous appartient pas.")
        return value


class OwnerBookingSerializer(serializers.ModelSerializer):
    """Réservations vues par l'hébergeur."""
    guest_name         = serializers.CharField(source='guest.get_full_name', read_only=True)
    guest_email        = serializers.CharField(source='guest.email',         read_only=True)
    guest_phone        = serializers.CharField(source='guest.phone',         read_only=True)
    establishment_name = serializers.CharField(source='establishment.name',  read_only=True)
    room_type_name     = serializers.CharField(source='room_type.name',      read_only=True)

    class Meta:
        model  = Booking
        fields = [
            'id', 'booking_number', 'guest_name', 'guest_email', 'guest_phone',
            'establishment_name', 'room_type_name',
            'check_in_date', 'check_out_date', 'total_nights',
            'guest_count_adults', 'guest_count_children',
            'total_amount', 'host_payout', 'status', 'guest_notes', 'created_at',
        ]


class OwnerAvailabilitySerializer(serializers.ModelSerializer):
    """Disponibilités d'une chambre."""
    room_type_name     = serializers.CharField(source='room_type.name', read_only=True)
    establishment_name = serializers.CharField(source='room_type.establishment.name', read_only=True)

    class Meta:
        model  = RoomAvailability
        fields = [
            'id', 'room_type', 'room_type_name', 'establishment_name',
            'date', 'available_count', 'is_manually_blocked', 'special_price',
        ]
