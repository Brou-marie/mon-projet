from rest_framework import serializers
from .models import Amenity, Establishment, EstablishmentImage, RoomType, RoomTypeImage, RoomAvailability


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ('id', 'name', 'category', 'icon')


class EstablishmentImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = EstablishmentImage
        fields = ('id', 'image', 'caption', 'is_primary', 'display_order')


class RoomTypeImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = RoomTypeImage
        fields = ('id', 'image', 'caption', 'is_primary', 'display_order')


class RoomAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomAvailability
        fields = ('id', 'date', 'available_count', 'is_manually_blocked', 'special_price')


class RoomTypeListSerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = RoomType
        fields = ('id', 'name', 'description', 'capacity_adults', 'capacity_children',
                  'base_price_per_night', 'size_sqm', 'bed_type', 'amenities', 'primary_image',
                  'physical_room_count')

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            return RoomTypeImageSerializer(img).data
        return None


class RoomTypeDetailSerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True, read_only=True)
    images = RoomTypeImageSerializer(many=True, read_only=True)

    class Meta:
        model = RoomType
        fields = '__all__'
        read_only_fields = ('establishment', 'created_at', 'updated_at')


class EstablishmentListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    lowest_price = serializers.SerializerMethodField()
    city_quarter = serializers.SerializerMethodField()

    class Meta:
        model = Establishment
        fields = ('id', 'name', 'slug', 'establishment_type', 'city_quarter',
                  'avg_rating', 'review_count', 'primary_image', 'lowest_price',
                  'cancellation_policy', 'is_featured')

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            return EstablishmentImageSerializer(img).data
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

    class Meta:
        model = Establishment
        exclude = ('host',)
        read_only_fields = ('avg_rating', 'review_count', 'status', 'slug', 'created_at', 'updated_at')


class EstablishmentCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Establishment
        fields = '__all__'
        read_only_fields = ('host', 'avg_rating', 'review_count', 'slug', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['host'] = self.context['request'].user
        return super().create(validated_data)
