from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Booking, BookingStatusHistory
from .serializers import (
    BookingListSerializer, BookingDetailSerializer, BookingCreateSerializer,
    BookingStatusHistorySerializer
)
from apps.establishments.models import RoomAvailability


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
        # Set expiry for cart (15 minutes)
        booking.expires_at = timezone.now() + timedelta(minutes=15)
        booking.save()
        # Return full detail
        return Response(
            BookingDetailSerializer(booking, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, booking_number=None):
        booking = self.get_object()
        user = request.user

        if booking.status not in ('cart', 'confirmed'):
            return Response({"detail": "Cette réservation ne peut pas être annulée dans son état actuel."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Determine who is cancelling
        if booking.guest == user:
            new_status = 'cancelled_by_guest'
            # Calculate refund based on cancellation policy
            refund = self._calculate_refund(booking)
        elif booking.establishment.host == user:
            new_status = 'cancelled_by_host'
            refund = booking.total_amount  # Host cancellation = full refund
        else:
            return Response({"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            booking.status = new_status
            booking.cancellation_reason = request.data.get('reason', '')
            booking.cancelled_at = timezone.now()
            booking.cancelled_by = user
            booking.refund_amount = refund
            booking.save()

            # Restore availability
            self._restore_availability(booking)

            BookingStatusHistory.objects.create(
                booking=booking, status=new_status, changed_by=user,
                note=f"Annulation. Remboursement: {refund} FCFA."
            )

        return Response(BookingDetailSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def check_in(self, request, booking_number=None):
        booking = self.get_object()
        if booking.status != 'confirmed':
            return Response({"detail": "La réservation doit être confirmée pour le check-in."},
                            status=status.HTTP_400_BAD_REQUEST)
        booking.status = 'in_progress'
        booking.actual_check_in = timezone.now()
        booking.save()
        BookingStatusHistory.objects.create(
            booking=booking, status='in_progress', changed_by=request.user,
            note='Check-in effectué.'
        )
        return Response(BookingDetailSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def check_out(self, request, booking_number=None):
        booking = self.get_object()
        if booking.status != 'in_progress':
            return Response({"detail": "La réservation doit être en cours pour le check-out."},
                            status=status.HTTP_400_BAD_REQUEST)
        booking.status = 'completed'
        booking.actual_check_out = timezone.now()
        booking.save()
        BookingStatusHistory.objects.create(
            booking=booking, status='completed', changed_by=request.user,
            note='Check-out effectué.'
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

    def _restore_availability(self, booking):
        from datetime import date as dt_date
        nights = [(booking.check_in_date + timedelta(days=i))
                  for i in range((booking.check_out_date - booking.check_in_date).days)]
        for night in nights:
            avail = RoomAvailability.objects.filter(room_type=booking.room_type, date=night).first()
            if avail:
                avail.available_count = min(
                    avail.available_count + 1,
                    booking.room_type.physical_room_count
                )
                avail.save()
