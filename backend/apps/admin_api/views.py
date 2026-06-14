from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import date, timedelta
from apps.accounts.models import User, HostProfile
from apps.establishments.models import Establishment
from apps.bookings.models import Booking
from apps.payments.models import Payment, Payout
from apps.reviews.models import Review
from apps.disputes.models import Dispute
from .serializers import (
    AdminDashboardSerializer, AdminUserSerializer,
    AdminEstablishmentSerializer, AdminReviewSerializer,
    AdminPaymentSerializer, AdminDisputeSerializer
)


class AdminDashboardView(viewsets.ViewSet):
    """GET /admin/dashboard - Dashboard admin"""
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        if not request.user.is_staff_user:
            return Response(
                {'detail': 'Accès réservé aux administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Statistiques utilisateurs
        total_users = User.objects.count()
        total_guests = User.objects.filter(role='guest').count()
        total_hosts = User.objects.filter(role='host').count()
        
        # Statistiques établissements
        total_establishments = Establishment.objects.count()
        active_establishments = Establishment.objects.filter(status='active').count()
        pending_establishments = Establishment.objects.filter(
            requires_manual_validation=True,
            status='pending'
        ).count()
        
        # Statistiques réservations
        total_bookings = Booking.objects.count()
        active_bookings = Booking.objects.filter(
            status__in=[Booking.CONFIRMED, Booking.IN_PROGRESS]
        ).count()
        completed_bookings = Booking.objects.filter(status=Booking.COMPLETED).count()
        
        # Revenus
        total_revenue = Payment.objects.filter(status='succeeded').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        current_month = timezone.now().replace(day=1)
        current_month_revenue = Payment.objects.filter(
            status='succeeded',
            paid_at__gte=current_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Litiges et avis
        pending_disputes = Dispute.objects.filter(status='open').count()
        flagged_reviews = Review.objects.filter(is_flagged=True).count()
        pending_host_verifications = HostProfile.objects.filter(
            verification_status='pending'
        ).count()
        
        data = {
            'total_users': total_users,
            'total_guests': total_guests,
            'total_hosts': total_hosts,
            'total_establishments': total_establishments,
            'active_establishments': active_establishments,
            'pending_establishments': pending_establishments,
            'total_bookings': total_bookings,
            'active_bookings': active_bookings,
            'completed_bookings': completed_bookings,
            'total_revenue': total_revenue,
            'current_month_revenue': current_month_revenue,
            'pending_disputes': pending_disputes,
            'flagged_reviews': flagged_reviews,
            'pending_host_verifications': pending_host_verifications,
        }
        
        serializer = AdminDashboardSerializer(data)
        return Response(serializer.data)


class AdminUserViewSet(viewsets.ModelViewSet):
    """CRUD pour la gestion des utilisateurs par l'admin"""
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    
    def get_queryset(self):
        if not self.request.user.is_staff_user:
            return User.objects.none()
        return User.objects.all().select_related('host_profile', 'guest_profile')
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspendre un utilisateur"""
        user = self.get_object()
        user.is_active = False
        user.save()
        
        return Response({'detail': 'Utilisateur suspendu'})
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Réactiver un utilisateur"""
        user = self.get_object()
        user.is_active = True
        user.save()
        
        return Response({'detail': 'Utilisateur réactivé'})


class AdminEstablishmentViewSet(viewsets.ModelViewSet):
    """CRUD pour la gestion des établissements par l'admin"""
    serializer_class = AdminEstablishmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    
    def get_queryset(self):
        if not self.request.user.is_staff_user:
            return Establishment.objects.none()
        return Establishment.objects.select_related('host')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approuver un établissement"""
        establishment = self.get_object()
        establishment.status = 'active'
        establishment.requires_manual_validation = False
        establishment.save()
        
        return Response({'detail': 'Établissement approuvé'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rejeter un établissement"""
        reason = request.data.get('reason', '')
        establishment = self.get_object()
        establishment.status = 'rejected'
        establishment.requires_manual_validation = False
        establishment.save()
        
        return Response({'detail': 'Établissement rejeté'})


class AdminReviewViewSet(viewsets.ModelViewSet):
    """CRUD pour la modération des avis"""
    serializer_class = AdminReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    
    def get_queryset(self):
        if not self.request.user.is_staff_user:
            return Review.objects.none()
        return Review.objects.select_related('reviewer', 'establishment')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approuver un avis"""
        review = self.get_object()
        review.is_published = True
        review.is_flagged = False
        review.save()
        
        return Response({'detail': 'Avis approuvé'})
    
    @action(detail=True, methods=['post'])
    def hide(self, request, pk=None):
        """Masquer un avis"""
        review = self.get_object()
        review.is_published = False
        review.save()
        
        return Response({'detail': 'Avis masqué'})


class AdminPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Liste des paiements pour supervision"""
    serializer_class = AdminPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    
    def get_queryset(self):
        if not self.request.user.is_staff_user:
            return Payment.objects.none()
        return Payment.objects.select_related('booking', 'booking__guest', 'booking__establishment')


class AdminTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Liste des transactions pour supervision"""
    serializer_class = AdminPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    
    def get_queryset(self):
        if not self.request.user.is_staff_user:
            return Payout.objects.none()
        return Payout.objects.all()


class AdminDisputeViewSet(viewsets.ModelViewSet):
    """CRUD pour la gestion des litiges par l'admin"""
    serializer_class = AdminDisputeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    
    def get_queryset(self):
        if not self.request.user.is_staff_user:
            return Dispute.objects.none()
        return Dispute.objects.select_related('raised_by', 'booking')
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Résoudre un litige"""
        from apps.disputes.serializers import DisputeResolveSerializer
        
        dispute = self.get_object()
        serializer = DisputeResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        dispute.resolve(
            resolver=request.user,
            resolution=serializer.validated_data['resolution'],
            compensation_amount=serializer.validated_data.get('compensation_amount'),
            compensation_type=serializer.validated_data.get('compensation_type')
        )
        
        return Response({'detail': 'Litige résolu'})
