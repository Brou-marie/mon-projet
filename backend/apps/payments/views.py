from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Payment, Payout, CommissionSetting
from .serializers import PaymentSerializer, PaymentCreateSerializer, PayoutSerializer, CommissionSettingSerializer


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

    def perform_create(self, serializer):
        payment = serializer.save(status='pending')
        # Here you would integrate with actual payment provider
        # For MVP: simulate payment processing
        payment.status = 'succeeded'
        payment.paid_at = timezone.now()
        payment.save()
        # Update booking status
        booking = payment.booking
        booking.status = 'confirmed'
        booking.save()
        return payment

    @action(detail=True, methods=['post'])
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


class PayoutViewSet(viewsets.ModelViewSet):
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff_user:
            return Payout.objects.all()
        return Payout.objects.filter(host=user)

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)


class CommissionSettingViewSet(viewsets.ModelViewSet):
    queryset = CommissionSetting.objects.all()
    serializer_class = CommissionSettingSerializer
    permission_classes = [permissions.IsAdminUser]
