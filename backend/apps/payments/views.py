import uuid
from decimal import Decimal

from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment, Payout, CommissionSetting
from .serializers import (
    CommissionSettingSerializer,
    PaymentConfirmSerializer,
    PaymentCreateSerializer,
    PaymentSerializer,
    PayoutSerializer,
)
from .services import confirm_payment


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        if user.is_staff_user:
            return Payment.objects.all()
        if user.is_host:
            return Payment.objects.filter(booking__establishment__host=user)
        return Payment.objects.filter(booking__guest=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.validated_data['booking']
        payment = serializer.save(
            status='pending',
            amount=booking.total_amount.quantize(Decimal('0.01')),
        )
        return Response(
            PaymentSerializer(payment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def refund(self, request, id=None):
        payment = self.get_object()
        amount = request.data.get('amount')
        if payment.status not in ('succeeded', 'partially_refunded'):
            return Response(
                {"detail": "Paiement non remboursable dans son état actuel."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payment.status = 'refunded' if not amount else 'partially_refunded'
        payment.refunded_at = timezone.now()
        payment.save()
        return Response(PaymentSerializer(payment).data)


class PaymentInitView(APIView):
    """
    POST /api/payments/init/
    Crée une intention de paiement (Payment en statut 'pending') et retourne
    l'URL de la page de simulation frontend.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.validated_data['booking']
        payment = serializer.save(
            status='pending',
            amount=booking.total_amount.quantize(Decimal('0.01')),
        )
        data = PaymentSerializer(payment, context={'request': request}).data
        # URL vers la page de simulation React
        data['payment_url'] = f'/paiement/{payment.id}'
        data['message'] = 'Intention de paiement créée. Redirigez vers payment_url.'
        return Response(data, status=status.HTTP_201_CREATED)


class PaymentSimulateView(APIView):
    """
    POST /api/payments/simulate/
    Simule un paiement mobile money / carte en mode développement.
    Accepte : payment_id, method, phone_or_card, success (bool, défaut True)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get('payment_id')
        method = request.data.get('method', 'wave')
        phone_or_card = request.data.get('phone_or_card', '')
        success = request.data.get('success', True)
        # success peut arriver comme string depuis le frontend
        if isinstance(success, str):
            success = success.lower() not in ('false', '0', 'no')

        if not payment_id:
            return Response({'detail': 'payment_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = Payment.objects.select_related(
            'booking', 'booking__guest', 'booking__establishment',
        )
        if not request.user.is_staff_user:
            queryset = queryset.filter(booking__guest=request.user)

        payment = queryset.filter(id=payment_id).first()
        if not payment:
            return Response({'detail': 'Paiement introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == 'succeeded':
            return Response(
                {'detail': 'Ce paiement a déjà été traité.', 'payment': PaymentSerializer(payment).data},
                status=status.HTTP_200_OK,
            )

        if not success:
            payment.status = 'failed'
            payment.failure_reason = request.data.get('failure_reason', 'Paiement refusé par le simulateur.')
            payment.save(update_fields=('status', 'failure_reason', 'updated_at'))
            return Response({
                'detail': 'Paiement échoué (simulation).',
                'payment': PaymentSerializer(payment, context={'request': request}).data,
            }, status=status.HTTP_200_OK)

        # Générer une référence simulée réaliste selon la méthode
        prefixes = {
            'wave': 'WV',
            'orange_money': 'OM',
            'momo': 'MTN',
            'moov': 'MV',
            'card': 'CB',
            'cash': 'CSH',
        }
        prefix = prefixes.get(method, 'SIM')
        provider_reference = f"{prefix}-SIM-{str(uuid.uuid4())[:8].upper()}"

        # Mettre à jour la méthode sur le booking également
        payment.booking.payment_method = method
        payment.booking.payment_status = 'paid'
        payment.booking.save(update_fields=('payment_method', 'payment_status', 'updated_at'))

        payment = confirm_payment(
            payment,
            changed_by=request.user,
            provider_reference=provider_reference,
        )
        return Response({
            'detail': 'Paiement simulé avec succès.',
            'provider_reference': provider_reference,
            'payment': PaymentSerializer(payment, context={'request': request}).data,
        }, status=status.HTTP_200_OK)


class PaymentConfirmView(APIView):
    """
    POST /api/payments/confirm/
    Confirme un paiement via référence fournisseur (webhook ou validation manuelle).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment_id = serializer.validated_data.get('payment')
        provider_reference = serializer.validated_data.get('provider_reference', '')
        success = serializer.validated_data.get('success', True)

        queryset = Payment.objects.select_related('booking', 'booking__guest', 'booking__establishment')
        if not request.user.is_staff_user:
            queryset = queryset.filter(booking__guest=request.user)
        payment = queryset.filter(id=payment_id).first()
        if not payment:
            return Response({'detail': 'Paiement introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if not success:
            payment.status = 'failed'
            payment.failure_reason = request.data.get('failure_reason', 'Paiement refusé.')
            payment.save(update_fields=('status', 'failure_reason', 'updated_at'))
            return Response(PaymentSerializer(payment, context={'request': request}).data)

        payment = confirm_payment(
            payment,
            changed_by=request.user,
            provider_reference=provider_reference,
        )
        return Response(PaymentSerializer(payment, context={'request': request}).data)


class PayoutViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff_user:
            return Payout.objects.all()
        return Payout.objects.filter(host=user)


class CommissionSettingViewSet(viewsets.ModelViewSet):
    queryset = CommissionSetting.objects.all()
    serializer_class = CommissionSettingSerializer
    permission_classes = [permissions.IsAdminUser]
