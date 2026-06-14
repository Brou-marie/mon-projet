from rest_framework import serializers
from apps.accounts.models import User, HostProfile
from apps.establishments.models import Establishment
from apps.bookings.models import Booking
from apps.payments.models import Payment, Payout
from apps.reviews.models import Review
from apps.disputes.models import Dispute
from apps.accounts.serializers import UserSerializer, HostProfileSerializer
from apps.establishments.serializers import EstablishmentListSerializer


class AdminDashboardSerializer(serializers.Serializer):
    """Serializer pour le dashboard admin"""
    total_users = serializers.IntegerField()
    total_guests = serializers.IntegerField()
    total_hosts = serializers.IntegerField()
    total_establishments = serializers.IntegerField()
    active_establishments = serializers.IntegerField()
    pending_establishments = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    active_bookings = serializers.IntegerField()
    completed_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    current_month_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_disputes = serializers.IntegerField()
    flagged_reviews = serializers.IntegerField()
    pending_host_verifications = serializers.IntegerField()


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer pour la gestion des utilisateurs par l'admin"""
    full_name = serializers.SerializerMethodField()
    profile_data = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
                  'role', 'is_active', 'is_staff', 'is_email_verified', 'is_phone_verified',
                  'profile_data', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_profile_data(self, obj):
        if obj.role == 'host' and hasattr(obj, 'host_profile'):
            return HostProfileSerializer(obj.host_profile).data
        elif obj.role == 'guest' and hasattr(obj, 'guest_profile'):
            return {'loyalty_points': obj.guest_profile.loyalty_points}
        return None

    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminEstablishmentSerializer(serializers.ModelSerializer):
    """Serializer pour la gestion des établissements par l'admin"""
    host_name = serializers.CharField(source='host.get_full_name', read_only=True)
    host_email = serializers.CharField(source='host.email', read_only=True)
    room_count = serializers.SerializerMethodField()
    booking_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Establishment
        fields = ['id', 'name', 'slug', 'city', 'establishment_type', 'status',
                  'host_name', 'host_email', 'avg_rating', 'review_count',
                  'room_count', 'booking_count', 'requires_manual_validation',
                  'created_at']
    
    def get_room_count(self, obj):
        return obj.room_types.count()
    
    def get_booking_count(self, obj):
        return obj.bookings.count()


class AdminReviewSerializer(serializers.ModelSerializer):
    """Serializer pour la modération des avis"""
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    establishment_name = serializers.CharField(source='establishment.name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'reviewer', 'reviewer_name', 'establishment', 'establishment_name',
                  'rating_overall', 'comment', 'is_published', 'is_flagged',
                  'created_at']


class AdminPaymentSerializer(serializers.ModelSerializer):
    """Serializer pour la supervision des paiements"""
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)
    guest_email = serializers.CharField(source='booking.guest.email', read_only=True)
    establishment_name = serializers.CharField(source='booking.establishment.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'booking_number', 'guest_email', 'establishment_name',
                  'amount', 'currency', 'payment_method', 'status',
                  'paid_at', 'created_at']


class AdminDisputeSerializer(serializers.ModelSerializer):
    """Serializer pour la gestion des litiges"""
    raised_by_name = serializers.CharField(source='raised_by.get_full_name', read_only=True)
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)
    
    class Meta:
        model = Dispute
        fields = ['id', 'booking_number', 'raised_by_name', 'dispute_type', 'subject',
                  'description', 'status', 'priority', 'resolution', 'created_at']
