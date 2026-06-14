from datetime import timedelta
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Booking
from .serializers import (
    BookingListSerializer, BookingDetailSerializer, BookingCreateSerializer,
    BookingPriceEstimateSerializer,
)
from .services import record_status, restore_availability, set_booking_status
from apps.notifications.services import notify_user


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'booking_number'

    def get_queryset(self):
        user = self.request.user
        if user.is_staff_user:
            return Booking.objects.all()
        if user.is_host:
            return Booking.objects.filter(establishment__host=user)
        return Booking.objects.filter(guest=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return BookingListSerializer
        if self.action == 'create':
            return BookingCreateSerializer
        return BookingDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        # Le paiement doit être initié rapidement pour conserver le verrou de disponibilité.
        booking.expires_at = timezone.now() + timedelta(minutes=15)
        booking.save()
        # Return full detail
        return Response(
            BookingDetailSerializer(booking, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'], url_path='price-estimate', permission_classes=[permissions.AllowAny])
    def price_estimate(self, request):
        payload = {
            'room_type_id': request.query_params.get('room_type_id') or request.query_params.get('room'),
            'check_in_date': request.query_params.get('check_in_date') or request.query_params.get('check_in'),
            'check_out_date': request.query_params.get('check_out_date') or request.query_params.get('check_out'),
            'guest_count_adults': request.query_params.get('guest_count_adults') or request.query_params.get('adults') or 1,
            'guest_count_children': request.query_params.get('guest_count_children') or request.query_params.get('children') or 0,
        }
        serializer = BookingPriceEstimateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.to_representation(serializer.validated_data))

    @action(detail=False, methods=['get'], url_path='user')
    def user_bookings(self, request):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BookingListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = BookingListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, booking_number=None):
        booking = self.get_object()
        user = request.user

        cancellable_statuses = (
            Booking.PENDING_PAYMENT,
            Booking.PENDING_HOST_VALIDATION,
            Booking.CONFIRMED,
        )
        if booking.status not in cancellable_statuses:
            return Response(
                {"detail": "Cette réservation ne peut pas être annulée dans son état actuel."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.guest == user:
            refund = Decimal('0.00') if booking.status == Booking.PENDING_PAYMENT else self._calculate_refund(booking)
            new_status = Booking.CANCELLED_REFUNDED if refund > 0 else Booking.CANCELLED
            notification_title = 'Réservation annulée'
        elif booking.establishment.host == user:
            new_status = Booking.CANCELLED_REFUNDED
            refund = booking.total_amount
            notification_title = "Réservation annulée par l'hébergeur"
        else:
            return Response({"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            booking.status = new_status
            booking.cancellation_reason = request.data.get('reason', '')
            booking.cancelled_at = timezone.now()
            booking.cancelled_by = user
            booking.refund_amount = refund
            booking.save()

            restore_availability(booking)

            record_status(
                booking, new_status, changed_by=user,
                note=f"Annulation. Remboursement: {refund} FCFA."
            )
            payment = booking.payments.order_by('-created_at').first()
            if payment and refund > 0:
                payment.status = 'refunded' if refund >= booking.total_amount else 'partially_refunded'
                payment.refunded_at = timezone.now()
                payment.save(update_fields=('status', 'refunded_at', 'updated_at'))

        notify_user(
            booking.guest,
            'booking_cancelled',
            notification_title,
            f'La réservation {booking.booking_number} a été annulée.',
            {'booking_number': booking.booking_number},
        )

        return Response(BookingDetailSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def check_in(self, request, booking_number=None):
        booking = self.get_object()
        if booking.status != Booking.CONFIRMED:
            return Response({"detail": "La réservation doit être confirmée pour le check-in."},
                            status=status.HTTP_400_BAD_REQUEST)
        booking.actual_check_in = timezone.now()
        booking.save(update_fields=('actual_check_in', 'updated_at'))
        set_booking_status(booking, Booking.IN_PROGRESS, changed_by=request.user, note='Check-in effectué.')
        return Response(BookingDetailSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def check_out(self, request, booking_number=None):
        booking = self.get_object()
        if booking.status != Booking.IN_PROGRESS:
            return Response({"detail": "La réservation doit être en cours pour le check-out."},
                            status=status.HTTP_400_BAD_REQUEST)
        booking.actual_check_out = timezone.now()
        booking.save(update_fields=('actual_check_out', 'updated_at'))
        set_booking_status(booking, Booking.COMPLETED, changed_by=request.user, note='Check-out effectué.')
        notify_user(
            booking.guest,
            'review_received',
            'Avis demandé',
            f'Votre séjour {booking.booking_number} est terminé. Vous pouvez laisser un avis.',
            {'booking_number': booking.booking_number},
        )
        return Response(BookingDetailSerializer(booking, context={'request': request}).data)

    def _calculate_refund(self, booking):
        policy = booking.establishment.cancellation_policy
        days_before = (booking.check_in_date - timezone.now().date()).days

        if policy == 'flexible':
            if days_before >= 1:
                return booking.total_amount
            return Decimal('0.00')
        elif policy == 'moderate':
            if days_before >= 5:
                return booking.total_amount
            elif days_before >= 1:
                return booking.total_amount * Decimal('0.50')
            return Decimal('0.00')
        else:  # strict
            if days_before >= 14:
                return booking.total_amount
            elif days_before >= 7:
                return booking.total_amount * Decimal('0.50')
            return Decimal('0.00')

