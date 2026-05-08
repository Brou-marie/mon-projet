import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ('booking_confirmed', 'Réservation confirmée'),
        ('booking_cancelled', 'Réservation annulée'),
        ('booking_reminder', 'Rappel de séjour'),
        ('new_message', 'Nouveau message'),
        ('payout_ready', 'Virement prêt'),
        ('review_received', 'Nouvel avis reçu'),
        ('host_verified', 'Compte hébergeur vérifié'),
        ('system', 'Système'),
        ('promo', 'Promotion'),
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
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.email}"
