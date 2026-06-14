import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En cours'),
        ('succeeded', 'Réussi'),
        ('failed', 'Échoué'),
        ('refunded', 'Remboursé'),
        ('partially_refunded', 'Partiellement remboursé'),
    ]

    METHOD_CHOICES = [
        ('wave', 'Wave'),
        ('orange_money', 'Orange Money'),
        ('momo', 'MTN Mobile Money'),
        ('card', 'Carte bancaire'),
        ('cash', 'Espèces'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        'bookings.Booking', on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='XOF')
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    provider_reference = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='pending')
    failure_reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Remboursement
    refunded_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refunded_at = models.DateTimeField(null=True, blank=True)
    refund_reference = models.CharField(max_length=200, blank=True)
    
    # Facturation
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    invoice_generated = models.BooleanField(default=False)
    invoice_url = models.URLField(blank=True)
    
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['booking', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_method']),
        ]

    def __str__(self):
        return f"Payment {self.id} - {self.amount} {self.currency}"

    def generate_invoice_number(self):
        """Génère un numéro de facture unique"""
        if not self.invoice_number:
            timestamp = timezone.now().strftime('%Y%m%d')
            random_num = str(uuid.uuid4())[:8].upper()
            self.invoice_number = f"INV-{timestamp}-{random_num}"
            self.save()
        return self.invoice_number


class Payout(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En cours'),
        ('paid', 'Payé'),
        ('failed', 'Échoué'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='payouts'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_deducted = models.DecimalField(max_digits=10, decimal_places=2)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='XOF')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Période de paiement
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Détails de virement
    paid_at = models.DateTimeField(null=True, blank=True)
    transaction_reference = models.CharField(max_length=200, blank=True)
    failure_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payouts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['host', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['period_start', 'period_end']),
        ]

    def __str__(self):
        return f"Payout {self.id} - {self.net_amount} {self.currency} to {self.host.email}"


class CommissionSetting(models.Model):
    """Configuration des commissions par hébergeur"""
    host = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='commission_settings'
    )
    commission_percent = models.DecimalField(max_digits=5, decimal_places=2, default=15)
    is_active = models.BooleanField(default=True)
    effective_from = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'commission_settings'

    def __str__(self):
        return f"Commission {self.commission_percent}% for {self.host.email}"


class Invoice(models.Model):
    """Modèle de facture"""
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('sent', 'Envoyée'),
        ('paid', 'Payée'),
        ('overdue', 'En retard'),
        ('cancelled', 'Annulée'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='invoices')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='invoices'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='XOF')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Dates
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    # Fichier PDF
    pdf_file = models.FileField(upload_to='invoices/pdf/', blank=True, null=True)
    pdf_url = models.URLField(blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.total_amount} {self.currency}"

    def generate_invoice_number(self):
        """Génère un numéro de facture unique"""
        if not self.invoice_number:
            timestamp = timezone.now().strftime('%Y%m%d')
            random_num = str(uuid.uuid4())[:8].upper()
            self.invoice_number = f"INV-{timestamp}-{random_num}"
            self.save()
        return self.invoice_number
