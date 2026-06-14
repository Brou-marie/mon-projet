from datetime import date, timedelta
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, generics, status, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from .models import Amenity, Establishment, EstablishmentImage, RoomType, RoomAvailability
from .serializers import (
    AmenitySerializer, EstablishmentListSerializer, EstablishmentDetailSerializer,
    EstablishmentCreateUpdateSerializer, RoomTypeDetailSerializer, RoomTypeCreateSerializer,
    RoomAvailabilitySerializer, EstablishmentImageSerializer,
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
        user = self.request.user if self.request.user.is_authenticated else None

        if self.action in ('update', 'partial_update', 'destroy'):
            if user and user.is_staff_user:
                return Establishment.objects.all()
            if user:
                return Establishment.objects.filter(host=user)
            return Establishment.objects.none()

        # Pour my_establishments, retourner tous les établissements du host
        if self.action == 'my_establishments':
            if user:
                return Establishment.objects.filter(host=user)
            return Establishment.objects.none()

        # Pour retrieve (détail), permettre au host de voir son propre établissement
        if self.action == 'retrieve' and user and user.is_authenticated:
            queryset = Establishment.objects.filter(
                Q(status='active') | Q(host=user)
            )
        else:
            queryset = Establishment.objects.filter(status='active')

        params = self.request.query_params

        city = params.get('city')
        if city:
            queryset = queryset.filter(city__iexact=city)

        check_in = params.get('check_in')
        check_out = params.get('check_out')
        guests = params.get('guests')

        if check_in and check_out:
            try:
                check_in_date = date.fromisoformat(check_in)
                check_out_date = date.fromisoformat(check_out)
                if check_in_date < check_out_date:
                    nights = [(check_in_date + timedelta(days=i)) for i in range((check_out_date - check_in_date).days)]
                    available_room_types = RoomType.objects.filter(
                        availabilities__date__in=nights,
                        availabilities__available_count__gt=0,
                        availabilities__is_manually_blocked=False,
                        is_active=True
                    ).values('establishment_id').annotate(
                        available_days=Count('availabilities__date', distinct=True)
                    ).filter(available_days=len(nights))
                    queryset = queryset.filter(id__in=available_room_types.values('establishment_id'))
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


class RoomTypeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RoomTypeDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if self.action == 'bulk_update_availability' and user.is_authenticated:
            if user.is_staff_user:
                return RoomType.objects.all()
            return RoomType.objects.filter(establishment__host=user)
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
            obj.full_clean()
            obj.save()

        return Response({"detail": "Disponibilités mises à jour."})


class EstablishmentImageUploadView(generics.CreateAPIView):
    """Upload une ou plusieurs images pour un établissement."""
    serializer_class = EstablishmentImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def create(self, request, slug=None):
        try:
            establishment = Establishment.objects.get(slug=slug, host=request.user)
        except Establishment.DoesNotExist:
            return Response({"detail": "Établissement non trouvé."}, status=status.HTTP_404_NOT_FOUND)

        images = request.FILES.getlist('images')
        if not images:
            return Response({"detail": "Aucune image fournie."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for i, img_file in enumerate(images):
            is_primary = (i == 0 and not establishment.images.filter(is_primary=True).exists())
            obj = EstablishmentImage.objects.create(
                establishment=establishment,
                image=img_file,
                caption=request.data.get('caption', ''),
                is_primary=is_primary,
                display_order=establishment.images.count(),
            )
            created.append(EstablishmentImageSerializer(obj, context={'request': request}).data)

        return Response(created, status=status.HTTP_201_CREATED)


class EstablishmentImageDeleteView(generics.DestroyAPIView):
    """Supprime une image d'un établissement."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EstablishmentImage.objects.filter(establishment__host=self.request.user)

    def get_object(self):
        return get_object_or_404(self.get_queryset(), pk=self.kwargs['pk'])


class RoomTypeCreateView(generics.CreateAPIView):
    """Crée un type de chambre pour un établissement du host connecté."""
    serializer_class = RoomTypeCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_establishment(self):
        slug = self.kwargs['slug']
        try:
            return Establishment.objects.get(slug=slug, host=self.request.user)
        except Establishment.DoesNotExist:
            return None

    def create(self, request, slug=None):
        establishment = self.get_establishment()
        if not establishment:
            return Response({"detail": "Établissement non trouvé."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(
            data=request.data,
            context={**self.get_serializer_context(), 'establishment': establishment}
        )
        serializer.is_valid(raise_exception=True)
        room_type = serializer.save()

        # Upload des images si fournies
        images = request.FILES.getlist('images')
        for i, img_file in enumerate(images):
            from .models import RoomTypeImage
            RoomTypeImage.objects.create(
                room_type=room_type,
                image=img_file,
                is_primary=(i == 0),
                display_order=i,
            )

        today = date.today()
        for offset in range(180):
            RoomAvailability.objects.get_or_create(
                room_type=room_type,
                date=today + timedelta(days=offset),
                defaults={'available_count': room_type.physical_room_count},
            )

        return Response(RoomTypeDetailSerializer(room_type, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)
