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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = self.perform_create(serializer)
        return Response(
            PaymentSerializer(payment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @transaction.atomic
    def perform_create(self, serializer):
        booking = serializer.validated_data['booking']
        payment = serializer.save(status='pending', amount=booking.total_amount)

        # Endpoint historique du frontend: paiement simulé en une étape.
        return confirm_payment(payment, changed_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def refund(self, request, id=None):
        payment = self.get_object()
        amount = request.data.get('amount')
        if payment.status not in ('succeeded', 'partially_refunded'):
            return Response({"detail": "Paiement non remboursable dans son état actuel."},
                            status=status.HTTP_400_BAD_REQUEST)
        payment.status = 'refunded' if not amount else 'partially_refunded'
        payment.refunded_at = timezone.now()
        payment.save()
        return Response(PaymentSerializer(payment).data)


class PaymentInitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.validated_data['booking']
        payment = serializer.save(status='pending', amount=booking.total_amount)
        data = PaymentSerializer(payment, context={'request': request}).data
        data['payment_url'] = f'/paiement/simule/{payment.id}'
        data['message'] = 'Intention de paiement créée.'
        return Response(data, status=status.HTTP_201_CREATED)


class PaymentConfirmView(APIView):
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
