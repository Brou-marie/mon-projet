import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator


class Booking(models.Model):
    PENDING_PAYMENT = 'pending_payment'
    PAID = 'paid'
    PENDING_HOST_VALIDATION = 'pending_host_validation'
    CONFIRMED = 'confirmed'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    CANCELLED_REFUNDED = 'cancelled_refunded'
    REFUNDED = 'refunded'
    REJECTED_BY_HOST = 'rejected_by_host'
    DISPUTE = 'dispute'
    NO_SHOW = 'no_show'

    STATUS_CHOICES = [
        (PENDING_PAYMENT, 'En attente de paiement'),
        (PAID, 'Payée'),
        (PENDING_HOST_VALIDATION, "En attente de validation par l'hébergeur"),
        (CONFIRMED, 'Confirmée'),
        (IN_PROGRESS, 'En cours'),
        (COMPLETED, 'Terminée'),
        (CANCELLED, 'Annulée'),
        (CANCELLED_REFUNDED, 'Annulée et remboursée'),
        (REFUNDED, 'Remboursée'),
        (REJECTED_BY_HOST, "Refusée par l'hébergeur"),
        (DISPUTE, 'Litige'),
        (NO_SHOW, 'Non présenté'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_number = models.CharField(max_length=20, unique=True, db_index=True)
    guest = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='bookings'
    )
    room_type = models.ForeignKey(
        'establishments.RoomType', on_delete=models.PROTECT,
        related_name='bookings'
    )
    establishment = models.ForeignKey(
        'establishments.Establishment', on_delete=models.PROTECT,
        related_name='bookings'
    )
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    guest_count_adults = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    guest_count_children = models.PositiveSmallIntegerField(default=0)

    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=PENDING_PAYMENT)
    total_nights = models.PositiveSmallIntegerField(default=0)
    price_breakdown = models.JSONField(default=dict, blank=True)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    platform_fee = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    host_payout = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    guest_notes = models.TextField(blank=True)
    host_notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='cancelled_bookings', blank=True, null=True
    )
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    check_in_time = models.TimeField(blank=True, null=True)
    check_out_time = models.TimeField(blank=True, null=True)
    actual_check_in = models.DateTimeField(blank=True, null=True)
    actual_check_out = models.DateTimeField(blank=True, null=True)

    qr_code = models.CharField(max_length=100, blank=True, db_index=True)
    promo_code = models.CharField(max_length=50, blank=True)
    promo_discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['guest', 'status']),
            models.Index(fields=['establishment', 'check_in_date']),
            models.Index(fields=['booking_number']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"Réservation {self.booking_number} - {self.guest.email}"

    def clean(self):
        errors = {}
        if self.check_in_date and self.check_out_date and self.check_in_date >= self.check_out_date:
            errors['check_out_date'] = "La date de départ doit être après la date d’arrivée."
        if (
            self.room_type_id
            and self.establishment_id
            and self.room_type.establishment_id != self.establishment_id
        ):
            errors['room_type'] = "Le type de chambre doit appartenir à l’établissement sélectionné."
        if self.guest_id and self.guest.role != 'guest':
            errors['guest'] = "La réservation doit appartenir à un voyageur."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if not self.booking_number:
            import random
            while not self.booking_number:
                candidate = f"NOAM{random.randint(10000000, 99999999)}"
                if not Booking.objects.filter(booking_number=candidate).exists():
                    self.booking_number = candidate
        if self.check_in_date and self.check_out_date:
            self.total_nights = max(0, (self.check_out_date - self.check_in_date).days)
        super().save(*args, **kwargs)


class BookingStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='status_history'
    )
    status = models.CharField(max_length=30, choices=Booking.STATUS_CHOICES)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        blank=True, null=True
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'booking_status_history'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking.booking_number} -> {self.status}"
