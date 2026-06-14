from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Dispute, DisputeAttachment
from .serializers import (
    DisputeSerializer, DisputeCreateSerializer,
    DisputeResolveSerializer, DisputeAttachmentSerializer
)


class DisputeViewSet(viewsets.ModelViewSet):
    queryset = Dispute.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'dispute_type', 'booking']
    search_fields = ['subject', 'description']
    ordering_fields = ['created_at', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DisputeCreateSerializer
        return DisputeSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Dispute.objects.all()
        
        if user.role == 'guest':
            queryset = queryset.filter(raised_by=user)
        elif user.role == 'host':
            queryset = queryset.filter(booking__establishment__host=user)
        elif user.role == 'moderator':
            queryset = queryset.filter(status__in=['open', 'under_review'])
        
        return queryset.select_related('booking', 'raised_by', 'booking__establishment')
    
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        """Ajoute un message au litige"""
        dispute = self.get_object()
        message = request.data.get('message')
        
        if not message:
            return Response(
                {'detail': 'Le message est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        dispute.add_message(request.user, message)
        serializer = self.get_serializer(dispute)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_evidence(self, request, pk=None):
        """Ajoute une preuve au litige"""
        dispute = self.get_object()
        evidence_url = request.data.get('evidence_url')
        description = request.data.get('description', '')
        
        if not evidence_url:
            return Response(
                {'detail': 'L\'URL de la preuve est requise.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        dispute.add_evidence(evidence_url, description)
        serializer = self.get_serializer(dispute)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Résout le litige (admin/moderator uniquement)"""
        if not request.user.is_staff_user:
            return Response(
                {'detail': 'Permission refusée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        dispute = self.get_object()
        serializer = DisputeResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        dispute.resolve(
            resolver=request.user,
            resolution=serializer.validated_data['resolution'],
            compensation_amount=serializer.validated_data.get('compensation_amount'),
            compensation_type=serializer.validated_data.get('compensation_type')
        )
        
        return Response(DisputeSerializer(dispute).data)
    
    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        """Escalade le litige"""
        dispute = self.get_object()
        
        if dispute.status == 'resolved':
            return Response(
                {'detail': 'Impossible d\'escalader un litige résolu.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Escalade à un superadmin
        from apps.accounts.models import User
        superadmins = User.objects.filter(role='superadmin', is_active=True).first()
        
        if not superadmins:
            return Response(
                {'detail': 'Aucun administrateur disponible pour l\'escalade.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        dispute.escalate(superadmins)
        return Response(DisputeSerializer(dispute).data)


class DisputeAttachmentViewSet(viewsets.ModelViewSet):
    queryset = DisputeAttachment.objects.all()
    serializer_class = DisputeAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['dispute']
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    def get_queryset(self):
        user = self.request.user
        queryset = DisputeAttachment.objects.all()
        
        if user.role == 'guest':
            queryset = queryset.filter(dispute__raised_by=user)
        elif user.role == 'host':
            queryset = queryset.filter(dispute__booking__establishment__host=user)
        
        return queryset.select_related('dispute', 'uploaded_by')
