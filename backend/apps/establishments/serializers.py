from rest_framework import serializers
from .models import Amenity, Establishment, EstablishmentImage, RoomType, RoomTypeImage, RoomAvailability


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ('id', 'name', 'category', 'icon')


class EstablishmentImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = EstablishmentImage
        fields = ('id', 'image', 'image_url', 'caption', 'is_primary', 'display_order')

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return obj.image.url
        return None


class RoomTypeImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = RoomTypeImage
        fields = ('id', 'image', 'image_url', 'caption', 'is_primary', 'display_order')

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return obj.image.url
        return None


class RoomAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomAvailability
        fields = ('id', 'date', 'available_count', 'is_manually_blocked', 'special_price')


class RoomTypeListSerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = RoomType
        fields = (
            'id', 'name', 'description', 'capacity_adults', 'capacity_children',
            'base_price_per_night', 'size_sqm', 'bed_type', 'amenities',
            'primary_image', 'physical_room_count', 'is_active',
        )

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            return RoomTypeImageSerializer(img, context=self.context).data
        return None


class RoomTypeDetailSerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True, read_only=True)
    images = RoomTypeImageSerializer(many=True, read_only=True)

    class Meta:
        model = RoomType
        fields = '__all__'
        read_only_fields = ('establishment', 'created_at', 'updated_at')


class RoomTypeCreateSerializer(serializers.ModelSerializer):
    amenity_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False, default=list
    )

    class Meta:
        model = RoomType
        fields = (
            'id', 'name', 'description', 'capacity_adults', 'capacity_children',
            'base_price_per_night', 'physical_room_count', 'size_sqm', 'bed_type',
            'amenity_ids', 'is_active',
        )

    def create(self, validated_data):
        amenity_ids = validated_data.pop('amenity_ids', [])
        establishment = self.context['establishment']
        room_type = RoomType.objects.create(establishment=establishment, **validated_data)
        if amenity_ids:
            room_type.amenities.set(amenity_ids)
        return room_type


class EstablishmentListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    lowest_price = serializers.SerializerMethodField()
    city_quarter = serializers.SerializerMethodField()

    class Meta:
        model = Establishment
        fields = (
            'id', 'name', 'slug', 'establishment_type', 'city_quarter', 'status',
            'avg_rating', 'review_count', 'primary_image', 'lowest_price',
            'cancellation_policy', 'requires_manual_validation', 'is_featured',
        )

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            return EstablishmentImageSerializer(img, context=self.context).data
        return None

    def get_lowest_price(self, obj):
        prices = [rt.base_price_per_night for rt in obj.room_types.filter(is_active=True)]
        return min(prices) if prices else None

    def get_city_quarter(self, obj):
        return f"{obj.city}{f', {obj.quarter}' if obj.quarter else ''}"


class EstablishmentDetailSerializer(serializers.ModelSerializer):
    images = EstablishmentImageSerializer(many=True, read_only=True)
    room_types = RoomTypeListSerializer(many=True, read_only=True)
    host_name = serializers.CharField(source='host.get_full_name', read_only=True)
    lowest_price = serializers.SerializerMethodField()

    class Meta:
        model = Establishment
        exclude = ('host',)
        read_only_fields = ('avg_rating', 'review_count', 'status', 'slug', 'created_at', 'updated_at')

    def get_lowest_price(self, obj):
        prices = [rt.base_price_per_night for rt in obj.room_types.filter(is_active=True)]
        return min(prices) if prices else None


class EstablishmentCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Establishment
        exclude = ('host',)
        read_only_fields = ('avg_rating', 'review_count', 'slug', 'status', 'created_at', 'updated_at')

    def create(self, validated_data):
        user = self.context['request'].user
        if user.role != 'host':
            raise serializers.ValidationError("Seuls les hébergeurs peuvent créer un établissement.")
        validated_data['host'] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and instance.host != request.user and not request.user.is_staff_user:
            raise serializers.ValidationError("Permission refusée.")
        return super().update(instance, validated_data)
