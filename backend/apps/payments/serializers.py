from rest_framework import serializers
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
