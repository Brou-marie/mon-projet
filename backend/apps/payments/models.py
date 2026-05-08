import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings


class Payment(models.Model):
    METHOD_CHOICES = [
        ('wave', 'Wave'),
        ('orange_money', 'Orange Money'),
        ('mtn_money', 'MTN Mobile Money'),
        ('moov_money', 'Moov Money'),
        ('card', 'Carte Bancaire'),
        ('bank_transfer', 'Virement Bancaire'),
    ]

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En cours'),
        ('succeeded', 'Réussi'),
        ('failed', 'Échoué'),
        ('refunded', 'Remboursé'),
        ('partially_refunded', 'Partiellement remboursé'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        'bookings.Booking', on_delete=models.PROTECT, related_name='payment'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='XOF')
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    provider_reference = models.CharField(max_length=200, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    failure_reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    refunded_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Paiement {self.id} - {self.booking.booking_number}"


class Payout(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En cours'),
        ('paid', 'Payé'),
        ('failed', 'Échoué'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='payouts', limit_choices_to={'role': 'host'}
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_deducted = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    period_start = models.DateField()
    period_end = models.DateField()
    paid_at = models.DateTimeField(blank=True, null=True)
    transaction_reference = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payouts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Virement {self.id} - {self.host.email}"


class CommissionSetting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    establishment_type = models.CharField(
        max_length=20, choices=[
            ('hotel', 'Hôtel'), ('residence', 'Résidence'),
            ('villa', 'Villa'), ('apartment', 'Appartement'),
            ('guesthouse', 'Maison d\'hôtes'), ('hostel', 'Auberge'),
        ],
        blank=True, null=True
    )
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='commission_settings', blank=True, null=True,
        limit_choices_to={'role': 'host'}
    )
    commission_percent = models.DecimalField(max_digits=5, decimal_places=2)
    effective_from = models.DateField()
    effective_to = models.DateField(blank=True, null=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'commission_settings'
        ordering = ['-effective_from']

    def __str__(self):
        return f"Commission {self.commission_percent}%"
