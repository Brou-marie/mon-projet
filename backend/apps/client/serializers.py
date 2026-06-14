from rest_framework import serializers
from apps.bookings.models import Booking
from apps.reviews.models import Review
from apps.accounts.serializers import UserSerializer
from apps.bookings.serializers import BookingDetailSerializer


class ClientDashboardSerializer(serializers.Serializer):
    """Serializer pour le dashboard client"""
    total_reservations = serializers.IntegerField()
    confirmed_reservations = serializers.IntegerField()
    active_reservations = serializers.IntegerField()
    completed_reservations = serializers.IntegerField()
    cancelled_reservations = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2)
    loyalty_points = serializers.IntegerField()
    upcoming_checkin = serializers.SerializerMethodField()
    
    def get_upcoming_checkin(self, obj):
        from datetime import date, timedelta
        upcoming = Booking.objects.filter(
            guest=obj['user'],
            status__in=['confirmed', 'checked_in'],
            check_in_date__gte=date.today(),
            check_in_date__lte=date.today() + timedelta(days=7)
        ).first()
        
        if upcoming:
            return {
                'booking_number': upcoming.booking_number,
                'establishment_name': upcoming.establishment.name,
                'check_in_date': upcoming.check_in_date.isoformat(),
                'check_out_date': upcoming.check_out_date.isoformat(),
            }
        return None


class ClientBookingSerializer(serializers.ModelSerializer):
    """Serializer pour les réservations du client"""
    establishment_name = serializers.CharField(source='establishment.name', read_only=True)
    establishment_slug = serializers.CharField(source='establishment.slug', read_only=True)
    city = serializers.CharField(source='establishment.city', read_only=True)
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'booking_number', 'establishment_name', 'establishment_slug',
            'city', 'room_type_name', 'check_in_date', 'check_out_date',
            'guest_count_adults', 'guest_count_children', 'total_amount',
            'status', 'primary_image', 'created_at'
        ]
    
    def get_primary_image(self, obj):
        img = obj.establishment.images.filter(is_primary=True).first() or obj.establishment.images.first()
        if img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.image.url)
        return None


class ClientReviewSerializer(serializers.ModelSerializer):
    """Serializer pour les avis du client"""
    establishment_name = serializers.CharField(source='establishment.name', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'booking', 'establishment', 'establishment_name',
            'rating_overall', 'rating_cleanliness', 'rating_location',
            'rating_value', 'rating_communication', 'comment',
            'is_visible', 'created_at'
        ]
        read_only_fields = ['establishment', 'is_visible', 'created_at']
    
    def validate_booking(self, booking):
        user = self.context['request'].user
        if booking.guest != user:
            raise serializers.ValidationError("Cette réservation ne vous appartient pas.")
        if booking.status != 'completed':
            raise serializers.ValidationError("Le séjour doit être terminé avant de publier un avis.")
        if hasattr(booking, 'review'):
            raise serializers.ValidationError("Un avis existe déjà pour cette réservation.")
        return booking
