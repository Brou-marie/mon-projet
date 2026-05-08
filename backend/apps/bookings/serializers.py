from datetime import date, timedelta
from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import Booking, BookingStatusHistory
from apps.establishments.models import RoomType, RoomAvailability
from apps.payments.models import CommissionSetting
from django.conf import settings


class BookingStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)

    class Meta:
        model = BookingStatusHistory
        fields = ('id', 'status', 'changed_by_name', 'note', 'created_at')
        read_only_fields = ('id', 'created_at')


class BookingListSerializer(serializers.ModelSerializer):
    establishment_name = serializers.CharField(source='establishment.name', read_only=True)
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ('id', 'booking_number', 'establishment_name', 'room_type_name',
                  'check_in_date', 'check_out_date', 'total_nights', 'status',
                  'total_amount', 'primary_image', 'created_at')
        read_only_fields = ('id', 'booking_number', 'total_amount', 'created_at')

    def get_primary_image(self, obj):
        img = obj.establishment.images.filter(is_primary=True).first() or obj.establishment.images.first()
        if img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.image.url)
        return None


class BookingDetailSerializer(serializers.ModelSerializer):
    status_history = BookingStatusHistorySerializer(many=True, read_only=True)
    establishment_name = serializers.CharField(source='establishment.name', read_only=True)
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    guest_name = serializers.CharField(source='guest.get_full_name', read_only=True)
    guest_phone = serializers.CharField(source='guest.phone', read_only=True)
    guest_email = serializers.CharField(source='guest.email', read_only=True)

    class Meta:
        model = Booking
        exclude = ('qr_code',)
        read_only_fields = ('booking_number', 'total_nights', 'subtotal', 'platform_fee',
                            'tax_amount', 'total_amount', 'commission_amount', 'host_payout',
                            'created_at', 'updated_at', 'cancelled_at', 'refund_amount')


class BookingCreateSerializer(serializers.ModelSerializer):
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    room_type_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Booking
        fields = ('room_type_id', 'check_in_date', 'check_out_date',
                  'guest_count_adults', 'guest_count_children', 'guest_notes')

    def validate(self, data):
        check_in = data['check_in_date']
        check_out = data['check_out_date']

        if check_in >= check_out:
            raise serializers.ValidationError({"dates": "La date de départ doit être après la date d'arrivée."})

        if check_in < date.today():
            raise serializers.ValidationError({"check_in_date": "La date d'arrivée ne peut pas être dans le passé."})

        room_type_id = data['room_type_id']
        try:
            room_type = RoomType.objects.select_related('establishment').get(id=room_type_id, is_active=True)
        except RoomType.DoesNotExist:
            raise serializers.ValidationError({"room_type_id": "Type de chambre invalide."})

        data['room_type'] = room_type
        data['establishment'] = room_type.establishment

        # Check availability for each night
        nights = [(check_in + timedelta(days=i)) for i in range((check_out - check_in).days)]
        for night in nights:
            availability = RoomAvailability.objects.filter(
                room_type=room_type, date=night
            ).first()
            if not availability:
                # If no record, check if physical count is available (default assumption)
                # But to be safe, require explicit availability records
                raise serializers.ValidationError(
                    {"dates": f"Aucune disponibilité enregistrée pour le {night}."}
                )
            if availability.is_manually_blocked or availability.available_count <= 0:
                raise serializers.ValidationError(
                    {"dates": f"Le type de chambre n'est pas disponible pour le {night}."}
                )

        return data

    @transaction.atomic
    def create(self, validated_data):
        room_type = validated_data.pop('room_type')
        establishment = validated_data.pop('establishment')
        check_in = validated_data['check_in_date']
        check_out = validated_data['check_out_date']
        nights = [(check_in + timedelta(days=i)) for i in range((check_out - check_in).days)]

        # Calculate pricing
        subtotal = Decimal('0.00')
        price_breakdown = {}
        for night in nights:
            avail = RoomAvailability.objects.filter(room_type=room_type, date=night).first()
            nightly_price = avail.special_price if avail and avail.special_price else room_type.base_price_per_night
            subtotal += Decimal(str(nightly_price))
            price_breakdown[str(night)] = str(nightly_price)

        # Platform fee: 10% of subtotal (configurable)
        platform_fee_percent = Decimal(str(getattr(settings, 'DEFAULT_PLATFORM_COMMISSION_PERCENT', 15)))

        # Check host commission override
        host_profile = establishment.host.host_profile if hasattr(establishment.host, 'host_profile') else None
        if host_profile and host_profile.commission_override_percent is not None:
            platform_fee_percent = host_profile.commission_override_percent

        commission_override = CommissionSetting.objects.filter(
            establishment_type=establishment.establishment_type,
            effective_from__lte=date.today()
        ).order_by('-effective_from').first()
        if commission_override:
            platform_fee_percent = commission_override.commission_percent

        platform_fee = (subtotal * platform_fee_percent / Decimal('100')).quantize(Decimal('0.01'))
        tax_amount = Decimal('0.00')  # configurable per city
        total_amount = subtotal + platform_fee + tax_amount
        commission_amount = platform_fee
        host_payout = subtotal - commission_amount

        booking = Booking.objects.create(
            guest=self.context['request'].user,
            room_type=room_type,
            establishment=establishment,
            subtotal=subtotal,
            platform_fee=platform_fee,
            tax_amount=tax_amount,
            total_amount=total_amount,
            commission_amount=commission_amount,
            host_payout=host_payout,
            price_breakdown=price_breakdown,
            **validated_data
        )

        # Temporarily block availability for 15 minutes
        for night in nights:
            avail = RoomAvailability.objects.get(room_type=room_type, date=night)
            avail.available_count = max(0, avail.available_count - 1)
            avail.save()

        # Log status history
        BookingStatusHistory.objects.create(
            booking=booking,
            status='cart',
            note='Réservation initiée, en attente de paiement.'
        )

        return booking
