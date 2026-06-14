from rest_framework import serializers
from django.utils import timezone
from apps.bookings.models import Booking
from .models import Payment, Payout, CommissionSetting


class PaymentSerializer(serializers.ModelSerializer):
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)

    class Meta:
        model = Payment
        fields = ('id', 'booking', 'booking_number', 'amount', 'currency', 'payment_method',
                  'provider_reference', 'status', 'failure_reason', 'metadata',
                  'paid_at', 'refunded_at', 'created_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('booking', 'payment_method')

    def validate_booking(self, booking):
        request = self.context['request']
        if booking.guest != request.user and not request.user.is_staff_user:
            raise serializers.ValidationError("Cette réservation ne vous appartient pas.")
        if booking.status != Booking.PENDING_PAYMENT:
            raise serializers.ValidationError("Seule une réservation en attente de paiement peut être payée.")
        if booking.expires_at and booking.expires_at < timezone.now():
            raise serializers.ValidationError("Cette réservation a expiré. Veuillez relancer la réservation.")
        if booking.total_amount <= 0:
            raise serializers.ValidationError("Le montant de la réservation est invalide.")
        if booking.payments.exclude(status='failed').exists():
            raise serializers.ValidationError("Un paiement existe déjà pour cette réservation.")
        return booking


class PaymentConfirmSerializer(serializers.Serializer):
    payment = serializers.UUIDField()
    provider_reference = serializers.CharField(required=False, allow_blank=True)
    success = serializers.BooleanField(default=True)


class PayoutSerializer(serializers.ModelSerializer):
    host_name = serializers.CharField(source='host.get_full_name', read_only=True)

    class Meta:
        model = Payout
        fields = ('id', 'host', 'host_name', 'amount', 'commission_deducted',
                  'net_amount', 'status', 'period_start', 'period_end',
                  'paid_at', 'transaction_reference', 'created_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class CommissionSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionSetting
        fields = '__all__'
