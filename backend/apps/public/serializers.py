from rest_framework import serializers
from apps.establishments.models import Establishment, RoomType, Amenity
from apps.establishments.serializers import EstablishmentListSerializer, RoomTypeListSerializer, AmenitySerializer


class FeaturedListingSerializer(serializers.ModelSerializer):
    """Serializer pour les hébergements en vedette"""
    primary_image = serializers.SerializerMethodField()
    lowest_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Establishment
        fields = ['id', 'name', 'slug', 'city', 'establishment_type', 'avg_rating', 
                  'review_count', 'primary_image', 'lowest_price', 'is_featured']
    
    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.image.url)
        return None
    
    def get_lowest_price(self, obj):
        prices = [rt.base_price_per_night for rt in obj.room_types.filter(is_active=True)]
        return min(prices) if prices else None


class PopularLocationSerializer(serializers.Serializer):
    """Serializer pour les locations populaires"""
    city = serializers.CharField()
    count = serializers.IntegerField()
    avg_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class ListingDetailSerializer(serializers.ModelSerializer):
    """Serializer pour les détails d'un hébergement"""
    images = serializers.SerializerMethodField()
    room_types = RoomTypeListSerializer(many=True, read_only=True)
    amenities = serializers.SerializerMethodField()
    host_name = serializers.CharField(source='host.get_full_name', read_only=True)
    host_avatar = serializers.ImageField(source='host.avatar', read_only=True)
    
    class Meta:
        model = Establishment
        fields = ['id', 'name', 'slug', 'city', 'quarter', 'establishment_type',
                  'description', 'address', 'latitude', 'longitude', 'avg_rating',
                  'review_count', 'check_in_time', 'check_out_time', 'cancellation_policy',
                  'status', 'requires_manual_validation',
                  'images', 'room_types', 'amenities', 'host_name', 'host_avatar']
    
    def get_images(self, obj):
        request = self.context.get('request')
        images = []
        for img in obj.images.all():
            image_url = img.image.url
            if request:
                image_url = request.build_absolute_uri(image_url)
            images.append({
                'id': str(img.id),
                'url': image_url,
                'caption': img.caption,
                'is_primary': img.is_primary
            })
        return images

    def get_amenities(self, obj):
        amenities = Amenity.objects.filter(room_types__establishment=obj).distinct()
        return AmenitySerializer(amenities, many=True).data


class ListingAvailabilitySerializer(serializers.Serializer):
    """Serializer pour vérifier la disponibilité"""
    room_type_id = serializers.UUIDField()
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    
    def validate(self, data):
        from datetime import date
        check_in = data['check_in_date']
        check_out = data['check_out_date']
        
        if check_in >= check_out:
            raise serializers.ValidationError("La date de départ doit être après la date d'arrivée.")
        if check_in < date.today():
            raise serializers.ValidationError("La date d'arrivée ne peut pas être dans le passé.")
        
        return data
