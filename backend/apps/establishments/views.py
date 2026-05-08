from datetime import date, timedelta
from django.db.models import Min, Q, F
from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from .models import Amenity, Establishment, RoomType, RoomAvailability
from .serializers import (
    AmenitySerializer, EstablishmentListSerializer, EstablishmentDetailSerializer,
    EstablishmentCreateUpdateSerializer, RoomTypeDetailSerializer,
    RoomAvailabilitySerializer
)


class AmenityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [permissions.AllowAny]


class EstablishmentViewSet(viewsets.ModelViewSet):
    queryset = Establishment.objects.filter(status='active')
    serializer_class = EstablishmentDetailSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ['establishment_type', 'city', 'cancellation_policy']
    ordering_fields = ['avg_rating', 'created_at', 'name']
    search_fields = ['name', 'description', 'city', 'quarter']
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return EstablishmentListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return EstablishmentCreateUpdateSerializer
        return EstablishmentDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'my_establishments']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Establishment.objects.filter(status='active')
        params = self.request.query_params

        # Filter by city
        city = params.get('city')
        if city:
            queryset = queryset.filter(city__iexact=city)

        # Filter by date range availability (requires check_in and check_out)
        check_in = params.get('check_in')
        check_out = params.get('check_out')
        guests = params.get('guests')

        if check_in and check_out:
            try:
                check_in_date = date.fromisoformat(check_in)
                check_out_date = date.fromisoformat(check_out)
                if check_in_date < check_out_date:
                    # Find establishments with at least one room type available for ALL nights in range
                    nights = [(check_in_date + timedelta(days=i)) for i in range((check_out_date - check_in_date).days)]
                    available_room_types = RoomType.objects.filter(
                        availabilities__date__in=nights,
                        availabilities__available_count__gt=0,
                        is_active=True
                    ).values('establishment').distinct()
                    queryset = queryset.filter(id__in=available_room_types)
            except ValueError:
                pass

        if guests:
            try:
                queryset = queryset.filter(
                    room_types__capacity_adults__gte=int(guests)
                ).distinct()
            except ValueError:
                pass

        return queryset.distinct()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_establishments(self, request):
        establishments = Establishment.objects.filter(host=request.user)
        serializer = EstablishmentListSerializer(establishments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def availability(self, request, slug=None):
        establishment = self.get_object()
        room_type_id = request.query_params.get('room_type')
        month = request.query_params.get('month')  # YYYY-MM
        year = request.query_params.get('year')

        availabilities = RoomAvailability.objects.filter(room_type__establishment=establishment)
        if room_type_id:
            availabilities = availabilities.filter(room_type_id=room_type_id)
        if month:
            availabilities = availabilities.filter(date__startswith=month)
        elif year:
            availabilities = availabilities.filter(date__year=year)
        else:
            # Default: next 90 days
            today = date.today()
            availabilities = availabilities.filter(date__range=[today, today + timedelta(days=90)])

        serializer = RoomAvailabilitySerializer(availabilities, many=True)
        return Response(serializer.data)


class RoomTypeViewSet(viewsets.ModelViewSet):
    serializer_class = RoomTypeDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return RoomType.objects.filter(establishment__status='active')

    @action(detail=True, methods=['get'])
    def calendar(self, request, pk=None):
        room_type = self.get_object()
        start = request.query_params.get('start')
        end = request.query_params.get('end')

        if start and end:
            availabilities = RoomAvailability.objects.filter(
                room_type=room_type, date__range=[start, end]
            )
        else:
            today = date.today()
            availabilities = RoomAvailability.objects.filter(
                room_type=room_type, date__range=[today, today + timedelta(days=90)]
            )

        serializer = RoomAvailabilitySerializer(availabilities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def bulk_update_availability(self, request, pk=None):
        room_type = self.get_object()
        if room_type.establishment.host != request.user and not request.user.is_staff_user:
            return Response({"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        dates = data.get('dates', [])
        available_count = data.get('available_count')
        is_blocked = data.get('is_manually_blocked')
        special_price = data.get('special_price')

        for d in dates:
            obj, _ = RoomAvailability.objects.get_or_create(
                room_type=room_type, date=d,
                defaults={
                    'available_count': available_count if available_count is not None else room_type.physical_room_count,
                    'is_manually_blocked': is_blocked if is_blocked is not None else False,
                    'special_price': special_price
                }
            )
            if available_count is not None:
                obj.available_count = available_count
            if is_blocked is not None:
                obj.is_manually_blocked = is_blocked
            if special_price is not None:
                obj.special_price = special_price
            obj.save()

        return Response({"detail": "Disponibilités mises à jour."})
