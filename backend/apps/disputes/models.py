import uuid
from django.db import models
from django.core.exceptions import ValidationError
from apps.accounts.models import User
from apps.bookings.models import Booking


class Dispute(models.Model):
    STATUS_CHOICES = [
        ('open', 'Ouvert'),
        ('under_review', 'En cours de révision'),
        ('resolved', 'Résolu'),
        ('escalated', 'Escaladé'),
        ('closed', 'Fermé'),
    ]
    
    DISPUTE_TYPE_CHOICES = [
        ('payment', 'Paiement'),
        ('cancellation', 'Annulation'),
        ('property', 'Propriété'),
        ('service', 'Service'),
        ('other', 'Autre'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Élevé'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='disputes')
    raised_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='raised_disputes')
    dispute_type = models.CharField(max_length=20, choices=DISPUTE_TYPE_CHOICES)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Résolution
    resolution = models.TextField(blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_disputes')
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Escalade
    escalated_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='escalated_disputes')
    escalated_at = models.DateTimeField(null=True, blank=True)
    
    # Preuves
    evidence = models.JSONField(default=list, blank=True)  # URLs des fichiers/documents
    
    # Communication
    messages = models.JSONField(default=list, blank=True)  # Historique des messages
    
    # Compensation
    compensation_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    compensation_type = models.CharField(max_length=50, blank=True)  # refund, credit, discount
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'disputes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['dispute_type']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Litige {self.id} - {self.subject}"
    
    def clean(self):
        if self.booking.guest != self.raised_by and self.booking.establishment.host != self.raised_by:
            raise ValidationError("Seul le voyageur ou l'hébergeur concernés peuvent créer un litige.")
    
    def add_message(self, sender, message):
        """Ajoute un message à l'historique de communication"""
        if not self.messages:
            self.messages = []
        self.messages.append({
            'sender_id': str(sender.id),
            'sender_name': sender.get_full_name(),
            'sender_role': sender.role,
            'message': message,
            'timestamp': models.DateTimeField.now().isoformat()
        })
        self.save()
    
    def add_evidence(self, evidence_url, description=''):
        """Ajoute une preuve au litige"""
        if not self.evidence:
            self.evidence = []
        self.evidence.append({
            'url': evidence_url,
            'description': description,
            'added_at': models.DateTimeField.now().isoformat()
        })
        self.save()
    
    def resolve(self, resolver, resolution, compensation_amount=None, compensation_type=None):
        """Résout le litige"""
        self.status = 'resolved'
        self.resolution = resolution
        self.resolved_by = resolver
        self.resolved_at = models.DateTimeField.now()
        if compensation_amount:
            self.compensation_amount = compensation_amount
        if compensation_type:
            self.compensation_type = compensation_type
        self.save()
    
    def escalate(self, escalated_to):
        """Escalade le litige à un niveau supérieur"""
        self.status = 'escalated'
        self.escalated_to = escalated_to
        self.escalated_at = models.DateTimeField.now()
        self.save()


class DisputeAttachment(models.Model):
    """Documents et preuves attachés aux litiges"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='disputes/evidence/')
    description = models.CharField(max_length=200, blank=True)
    file_type = models.CharField(max_length=50)  # image, document, video
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'dispute_attachments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Pièce jointe {self.id} pour litige {self.dispute.id}"
