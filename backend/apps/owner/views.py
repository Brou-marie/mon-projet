from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Avg, Sum
from django.utils import timezone
from datetime import date, timedelta
from apps.establishments.models import Establishment, RoomType, RoomAvailability
from apps.bookings.models import Booking
from .serializers import (
    OwnerDashboardSerializer, OwnerEstablishmentSerializer,
    OwnerRoomTypeSerializer, OwnerBookingSerializer,
    OwnerAvailabilitySerializer
)


class OwnerDashboardView(viewsets.ViewSet):
    """GET /owner/dashboard - Dashboard propriétaire"""
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        if request.user.role != 'host':
            return Response(
                {'detail': 'Accès réservé aux hébergeurs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        establishments = Establishment.objects.filter(host=request.user)
        room_types = RoomType.objects.filter(establishment__host=request.user)
        bookings = Booking.objects.filter(establishment__host=request.user)
        
        # Statistiques
        total_establishments = establishments.count()
        total_rooms = room_types.aggregate(total=Sum('physical_room_count'))['total'] or 0
        active_bookings = bookings.filter(status__in=[Booking.CONFIRMED, Booking.IN_PROGRESS]).count()
        pending_bookings = bookings.filter(status=Booking.PENDING_HOST_VALIDATION).count()
        completed_bookings = bookings.filter(status=Booking.COMPLETED).count()
        
        # Revenus
        total_revenue = bookings.filter(status=Booking.COMPLETED).aggregate(
            total=Sum('host_payout')
        )['total'] or 0
        
        current_month = timezone.now().replace(day=1)
        current_month_revenue = bookings.filter(
            status=Booking.COMPLETED,
            created_at__gte=current_month
        ).aggregate(total=Sum('host_payout'))['total'] or 0
        
        # Notes
        avg_rating = establishments.aggregate(avg=Avg('avg_rating'))['avg'] or 0
        total_reviews = sum(est.review_count for est in establishments)
        
        data = {
            'total_establishments': total_establishments,
            'total_rooms': total_rooms,
            'active_bookings': active_bookings,
            'pending_bookings': pending_bookings,
            'completed_bookings': completed_bookings,
            'total_revenue': total_revenue,
            'current_month_revenue': current_month_revenue,
            'average_rating': round(avg_rating, 2),
            'total_reviews': total_reviews,
        }
        
        serializer = OwnerDashboardSerializer(data)
        return Response(serializer.data)


class OwnerEstablishmentViewSet(viewsets.ModelViewSet):
    """CRUD pour les établissements du propriétaire"""
    serializer_class = OwnerEstablishmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'host':
            return Establishment.objects.none()
        return Establishment.objects.filter(host=self.request.user).select_related('host')
    
    def perform_create(self, serializer):
        serializer.save(host=self.request.user)


class OwnerRoomTypeViewSet(viewsets.ModelViewSet):
    """CRUD pour les chambres du propriétaire"""
    serializer_class = OwnerRoomTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'host':
            return RoomType.objects.none()
        return RoomType.objects.filter(establishment__host=self.request.user).select_related('establishment')
    
    def perform_create(self, serializer):
        # L'établissement doit appartenir au propriétaire
        establishment_id = self.request.data.get('establishment')
        establishment = Establishment.objects.get(id=establishment_id, host=self.request.user)
        serializer.save(establishment=establishment)


class OwnerAvailabilityViewSet(viewsets.ModelViewSet):
    """CRUD pour les disponibilités du propriétaire"""
    serializer_class = OwnerAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    
    def get_queryset(self):
        if self.request.user.role != 'host':
            return RoomAvailability.objects.none()
        return RoomAvailability.objects.filter(
            room_type__establishment__host=self.request.user
        ).select_related('room_type', 'room_type__establishment')
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Mise à jour en masse des disponibilités"""
        if request.user.role != 'host':
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        room_type_id = request.data.get('room_type_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        available_count = request.data.get('available_count')
        special_price = request.data.get('special_price')
        is_manually_blocked = request.data.get('is_manually_blocked', False)
        
        try:
            room_type = RoomType.objects.get(
                id=room_type_id,
                establishment__host=request.user
            )
        except RoomType.DoesNotExist:
            return Response(
                {'detail': 'Type de chambre introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Créer ou mettre à jour les disponibilités
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
        
        current_date = start
        updated_count = 0
        
        while current_date <= end:
            availability, created = RoomAvailability.objects.update_or_create(
                room_type=room_type,
                date=current_date,
                defaults={
                    'available_count': available_count,
                    'special_price': special_price,
                    'is_manually_blocked': is_manually_blocked
                }
            )
            updated_count += 1
            current_date += timedelta(days=1)
        
        return Response({
            'detail': f'{updated_count} disponibilités mises à jour'
        })


class OwnerBookingViewSet(viewsets.ReadOnlyModelViewSet):
    """Liste des réservations du propriétaire"""
    serializer_class = OwnerBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    
    def get_queryset(self):
        if self.request.user.role != 'host':
            return Booking.objects.none()
        return Booking.objects.filter(
            establishment__host=self.request.user
        ).select_related('guest', 'establishment', 'room_type')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approuver une réservation"""
        booking = self.get_object()
        
        if booking.status != Booking.PENDING_HOST_VALIDATION:
            return Response(
                {'detail': 'Cette réservation ne peut pas être approuvée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = Booking.CONFIRMED
        booking.save()
        
        return Response({'detail': 'Réservation approuvée'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rejeter une réservation"""
        booking = self.get_object()
        reason = request.data.get('reason', '')
        
        if booking.status != Booking.PENDING_HOST_VALIDATION:
            return Response(
                {'detail': 'Cette réservation ne peut pas être rejetée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = Booking.REJECTED_BY_HOST
        booking.cancellation_reason = reason
        booking.cancelled_by = request.user
        booking.cancelled_at = timezone.now()
        booking.save()
        
        return Response({'detail': 'Réservation rejetée'})
    
    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Effectuer le check-in d'une réservation"""
        booking = self.get_object()
        
        if booking.status != Booking.CONFIRMED:
            return Response(
                {'detail': 'Le check-in ne peut être effectué que sur une réservation confirmée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = Booking.IN_PROGRESS
        booking.actual_check_in = timezone.now()
        booking.save()
        
        return Response({'detail': 'Check-in effectué'})
    
    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        """Effectuer le check-out d'une réservation"""
        booking = self.get_object()
        
        if booking.status != Booking.IN_PROGRESS:
            return Response(
                {'detail': 'Le check-out ne peut être effectué que sur une réservation en cours'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = Booking.COMPLETED
        booking.actual_check_out = timezone.now()
        booking.save()
        
        return Response({'detail': 'Check-out effectué'})
