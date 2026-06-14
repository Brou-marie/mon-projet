from datetime import date
from django.db import transaction
from rest_framework import serializers
from .models import Booking, BookingStatusHistory
from .services import booking_nights, decrement_availability, quote_room_type, record_status
from apps.establishments.models import RoomType


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
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Vous devez être connecté pour réserver.")
        if request.user.role != 'guest':
            raise serializers.ValidationError("Seul un voyageur peut effectuer une réservation.")

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

        if room_type.establishment.status != 'active':
            raise serializers.ValidationError({"room_type_id": "Cet hébergement n'est pas disponible à la réservation."})

        adults = data.get('guest_count_adults', 1)
        children = data.get('guest_count_children', 0)
        if adults > room_type.capacity_adults:
            raise serializers.ValidationError({"guest_count_adults": "Ce type de chambre ne peut pas accueillir autant d'adultes."})
        if children > room_type.capacity_children:
            raise serializers.ValidationError({"guest_count_children": "Ce type de chambre ne peut pas accueillir autant d'enfants."})

        data['room_type'] = room_type
        data['establishment'] = room_type.establishment

        quote = quote_room_type(room_type, check_in, check_out)
        if not quote['available']:
            unavailable = ', '.join(d.strftime('%d/%m/%Y') for d in quote['unavailable_dates'])
            raise serializers.ValidationError(
                {"dates": f"Le type de chambre n'est pas disponible pour ces dates: {unavailable}."}
            )

        return data

    @transaction.atomic
    def create(self, validated_data):
        room_type = validated_data.pop('room_type')
        establishment = validated_data.pop('establishment')
        validated_data.pop('room_type_id', None)
        check_in = validated_data['check_in_date']
        check_out = validated_data['check_out_date']
        nights = booking_nights(check_in, check_out)
        quote = quote_room_type(room_type, check_in, check_out, lock=True)
        if not quote['available'] or not decrement_availability(room_type, nights):
            raise serializers.ValidationError({"dates": "Le type de chambre n'est plus disponible pour ces dates."})

        booking = Booking.objects.create(
            guest=self.context['request'].user,
            room_type=room_type,
            establishment=establishment,
            status=Booking.PENDING_PAYMENT,
            subtotal=quote['subtotal'],
            platform_fee=quote['platform_fee'],
            tax_amount=quote['tax_amount'],
            total_amount=quote['total_amount'],
            commission_amount=quote['commission_amount'],
            host_payout=quote['host_payout'],
            price_breakdown=quote['price_breakdown'],
            **validated_data
        )

        record_status(booking, Booking.PENDING_PAYMENT, note='Réservation initiée, en attente de paiement.')

        return booking


class BookingPriceEstimateSerializer(serializers.Serializer):
    room_type_id = serializers.UUIDField()
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    guest_count_adults = serializers.IntegerField(min_value=1, default=1)
    guest_count_children = serializers.IntegerField(min_value=0, default=0)

    def validate(self, data):
        check_in = data['check_in_date']
        check_out = data['check_out_date']
        if check_in >= check_out:
            raise serializers.ValidationError({"dates": "La date de départ doit être après la date d'arrivée."})
        if check_in < date.today():
            raise serializers.ValidationError({"check_in_date": "La date d'arrivée ne peut pas être dans le passé."})

        try:
            room_type = RoomType.objects.select_related('establishment', 'establishment__host').get(
                id=data['room_type_id'],
                is_active=True,
            )
        except RoomType.DoesNotExist:
            raise serializers.ValidationError({"room_type_id": "Type de chambre invalide."})

        if room_type.establishment.status != 'active':
            raise serializers.ValidationError({"room_type_id": "Cet hébergement n'est pas réservable."})
        if data.get('guest_count_adults', 1) > room_type.capacity_adults:
            raise serializers.ValidationError({"guest_count_adults": "Capacité adultes insuffisante."})
        if data.get('guest_count_children', 0) > room_type.capacity_children:
            raise serializers.ValidationError({"guest_count_children": "Capacité enfants insuffisante."})

        data['room_type'] = room_type
        return data

    def to_representation(self, instance):
        room_type = instance['room_type']
        quote = quote_room_type(room_type, instance['check_in_date'], instance['check_out_date'])
        return {
            'room_type_id': str(room_type.id),
            'room_type_name': room_type.name,
            'establishment_name': room_type.establishment.name,
            'available': quote['available'],
            'unavailable_dates': [day.isoformat() for day in quote['unavailable_dates']],
            'total_nights': quote['total_nights'],
            'price_breakdown': quote['price_breakdown'],
            'subtotal': quote['subtotal'],
            'platform_fee': quote['platform_fee'],
            'tax_amount': quote['tax_amount'],
            'total_amount': quote['total_amount'],
            'currency': 'XOF',
        }
