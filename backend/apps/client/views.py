from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import date, timedelta
from apps.bookings.models import Booking
from apps.reviews.models import Review
from apps.accounts.models import GuestProfile
from .serializers import (
    ClientDashboardSerializer, ClientBookingSerializer,
    ClientReviewSerializer
)


class ClientDashboardView(viewsets.ViewSet):
    """GET /client/dashboard - Dashboard client"""
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        if request.user.role != 'guest':
            return Response(
                {'detail': 'Accès réservé aux voyageurs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        bookings = Booking.objects.filter(guest=request.user)
        
        # Statistiques
        total_reservations = bookings.count()
        confirmed_reservations = bookings.filter(status=Booking.CONFIRMED).count()
        active_reservations = bookings.filter(status__in=[Booking.CONFIRMED, Booking.IN_PROGRESS]).count()
        completed_reservations = bookings.filter(status=Booking.COMPLETED).count()
        cancelled_reservations = bookings.filter(
            status__in=[Booking.CANCELLED, Booking.CANCELLED_REFUNDED, Booking.REJECTED_BY_HOST]
        ).count()
        
        # Dépenses
        total_spent = bookings.filter(status=Booking.COMPLETED).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Points de fidélité
        guest_profile, _ = GuestProfile.objects.get_or_create(user=request.user)
        loyalty_points = guest_profile.loyalty_points
        
        data = {
            'user': request.user,
            'total_reservations': total_reservations,
            'confirmed_reservations': confirmed_reservations,
            'active_reservations': active_reservations,
            'completed_reservations': completed_reservations,
            'cancelled_reservations': cancelled_reservations,
            'total_spent': total_spent,
            'loyalty_points': loyalty_points,
        }
        
        serializer = ClientDashboardSerializer(data)
        return Response(serializer.data)


class ClientBookingViewSet(viewsets.ModelViewSet):
    """CRUD pour les réservations du client"""
    serializer_class = ClientBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    
    def get_queryset(self):
        if self.request.user.role != 'guest':
            return Booking.objects.none()
        return Booking.objects.filter(
            guest=self.request.user
        ).select_related('establishment', 'room_type')
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annuler une réservation"""
        booking = self.get_object()
        reason = request.data.get('reason', '')
        
        if booking.status not in [Booking.PENDING_PAYMENT, Booking.PENDING_HOST_VALIDATION, Booking.CONFIRMED]:
            return Response(
                {'detail': 'Cette réservation ne peut pas être annulée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = Booking.CANCELLED
        booking.cancellation_reason = reason
        booking.cancelled_by = request.user
        booking.cancelled_at = timezone.now()
        booking.save(update_fields=('status', 'cancellation_reason', 'cancelled_by', 'cancelled_at', 'updated_at'))
        return Response({'detail': 'Réservation annulée avec succès'})


class ClientReviewViewSet(viewsets.ModelViewSet):
    """CRUD pour les avis du client"""
    serializer_class = ClientReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    
    def get_queryset(self):
        if self.request.user.role != 'guest':
            return Review.objects.none()
        return Review.objects.filter(
            reviewer=self.request.user
        ).select_related('establishment', 'booking')
    
    def perform_create(self, serializer):
        serializer.save(
            reviewer=self.request.user,
            establishment=serializer.validated_data['booking'].establishment,
        )
