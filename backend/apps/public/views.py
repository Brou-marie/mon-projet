from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes as perm_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.establishments.models import Establishment, RoomType, Amenity
from apps.reviews.models import Review
from .serializers import (
    FeaturedListingSerializer, PopularLocationSerializer,
    ListingDetailSerializer, ListingAvailabilitySerializer
)
from apps.bookings.services import quote_room_type


class FeaturedListingsView(generics.ListAPIView):
    """GET /listings/featured - Hébergements en vedette"""
    serializer_class = FeaturedListingSerializer
    permission_classes = []  # Public access
    
    def get_queryset(self):
        return Establishment.objects.filter(
            is_featured=True,
            status='active'
        ).select_related('host').prefetch_related('images', 'room_types')


class PopularLocationsView(generics.ListAPIView):
    """GET /locations/popular - Locations populaires"""
    serializer_class = PopularLocationSerializer
    permission_classes = []
    
    def get_queryset(self):
        from django.db.models import Avg
        return Establishment.objects.filter(
            status='active'
        ).values('city').annotate(
            count=Count('id'),
            avg_price=Avg('room_types__base_price_per_night')
        ).order_by('-count')[:10]


class ListingsListView(generics.ListAPIView):
    """GET /listings - Liste des hébergements avec filtres"""
    serializer_class = FeaturedListingSerializer
    permission_classes = []
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['city', 'establishment_type', 'status']
    search_fields = ['name', 'description', 'city', 'quarter']
    ordering_fields = ['created_at', 'avg_rating', 'review_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Establishment.objects.filter(status='active')
        
        # Filtres personnalisés
        city = self.request.query_params.get('city')
        price_min = self.request.query_params.get('price_min')
        price_max = self.request.query_params.get('price_max')
        date_start = self.request.query_params.get('date_start')
        date_end = self.request.query_params.get('date_end')
        listing_type = self.request.query_params.get('type')
        
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        if price_min:
            queryset = queryset.filter(
                room_types__base_price_per_night__gte=price_min
            ).distinct()
        
        if price_max:
            queryset = queryset.filter(
                room_types__base_price_per_night__lte=price_max
            ).distinct()
        
        if listing_type:
            queryset = queryset.filter(establishment_type=listing_type)
        
        return queryset.select_related('host').prefetch_related('images', 'room_types')


class ListingDetailView(generics.RetrieveAPIView):
    """GET /listings/{id} - Détails d'un hébergement"""
    serializer_class = ListingDetailSerializer
    lookup_field = 'slug'
    permission_classes = []
    queryset = Establishment.objects.filter(status='active').select_related(
        'host'
    ).prefetch_related('images', 'room_types', 'room_types__amenities')


class ListingReviewsView(generics.ListAPIView):
    """GET /listings/{id}/reviews - Avis d'un hébergement"""
    from apps.reviews.serializers import ReviewSerializer
    
    serializer_class = ReviewSerializer
    permission_classes = []
    
    def get_queryset(self):
        slug = self.kwargs['slug']
        establishment = Establishment.objects.get(slug=slug)
        return Review.objects.filter(
            establishment=establishment,
            is_published=True
        ).select_related('reviewer', 'booking')


@api_view(['POST'])
@perm_classes([AllowAny])
def check_availability(request):
    """POST /hebergements/disponibilite/ - Vérifier la disponibilité (accès public)"""
    serializer = ListingAvailabilitySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    room_type_id = serializer.validated_data['room_type_id']
    check_in = serializer.validated_data['check_in_date']
    check_out = serializer.validated_data['check_out_date']
    
    try:
        room_type = RoomType.objects.get(id=room_type_id, is_active=True)
    except RoomType.DoesNotExist:
        return Response(
            {'detail': 'Type de chambre introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    quote = quote_room_type(room_type, check_in, check_out)
    
    return Response({
        'available': quote['available'],
        'total_nights': quote['total_nights'],
        'price_breakdown': quote['price_breakdown'],
        'subtotal': quote['subtotal'],
        'platform_fee': quote['platform_fee'],
        'tax_amount': quote['tax_amount'],
        'total_amount': quote['total_amount'],
        'unavailable_dates': [d.isoformat() for d in quote['unavailable_dates']],
    })
