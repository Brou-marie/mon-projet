import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    TYPE_CHOICES = [
        ('booking_confirmed', 'Réservation confirmée'),
        ('booking_cancelled', 'Réservation annulée'),
        ('booking_reminder', 'Rappel de séjour'),
        ('new_message', 'Nouveau message'),
        ('payout_ready', 'Virement prêt'),
        ('review_received', 'Nouvel avis reçu'),
        ('host_verified', 'Compte hébergeur vérifié'),
        ('dispute_created', 'Litige créé'),
        ('dispute_resolved', 'Litige résolu'),
        ('system', 'Système'),
        ('promo', 'Promotion'),
    ]

    CHANNEL_CHOICES = [
        ('in_app', 'In-app'),
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push notification'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=25, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='in_app')
    
    # Statut de livraison
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(blank=True, null=True)
    sms_sent = models.BooleanField(default=False)
    sms_sent_at = models.DateTimeField(blank=True, null=True)
    push_sent = models.BooleanField(default=False)
    push_sent_at = models.DateTimeField(blank=True, null=True)
    
    # Erreurs de livraison
    delivery_error = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_read']),
            models.Index(fields=['notification_type']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.email}"

    def save(self, *args, **kwargs):
        if self.is_read and not self.read_at:
            self.read_at = timezone.now()
        elif not self.is_read:
            self.read_at = None
        super().save(*args, **kwargs)


class NotificationPreference(models.Model):
    """Préférences de notification de l'utilisateur"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Préférences par type de notification
    email_booking_confirmed = models.BooleanField(default=True)
    email_booking_cancelled = models.BooleanField(default=True)
    email_booking_reminder = models.BooleanField(default=True)
    email_new_message = models.BooleanField(default=True)
    email_payout_ready = models.BooleanField(default=True)
    email_review_received = models.BooleanField(default=True)
    email_dispute_created = models.BooleanField(default=True)
    
    sms_booking_confirmed = models.BooleanField(default=False)
    sms_booking_cancelled = models.BooleanField(default=False)
    sms_booking_reminder = models.BooleanField(default=True)
    sms_new_message = models.BooleanField(default=False)
    
    push_booking_confirmed = models.BooleanField(default=True)
    push_booking_cancelled = models.BooleanField(default=True)
    push_booking_reminder = models.BooleanField(default=True)
    push_new_message = models.BooleanField(default=True)
    
    # Préférences générales
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    push_enabled = models.BooleanField(default=True)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_preferences'

    def __str__(self):
        return f"Préférences de {self.user.email}"


class NotificationTemplate(models.Model):
    """Templates de notification pour personnalisation"""
    TYPE_CHOICES = [
        ('booking_confirmed', 'Réservation confirmée'),
        ('booking_cancelled', 'Réservation annulée'),
        ('booking_reminder', 'Rappel de séjour'),
        ('payout_ready', 'Virement prêt'),
        ('dispute_created', 'Litige créé'),
        ('dispute_resolved', 'Litige résolu'),
    ]

    notification_type = models.CharField(max_length=25, choices=TYPE_CHOICES, unique=True)
    subject_template = models.CharField(max_length=200)
    email_body_template = models.TextField()
    sms_template = models.CharField(max_length=160, blank=True)
    push_body_template = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_templates'

    def __str__(self):
        return f"Template: {self.get_notification_type_display()}"
