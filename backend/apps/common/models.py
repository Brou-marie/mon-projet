"""
Modèles communs pour les fonctionnalités transverses
"""
import uuid

from django.db import models
from django.conf import settings


class AuditTrail(models.Model):
    """Journal d'audit pour suivre les modifications"""
    ACTION_CHOICES = [
        ('create', 'Création'),
        ('update', 'Modification'),
        ('delete', 'Suppression'),
        ('restore', 'Restauration'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_trails'
    )
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_trails'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} {self.model_name} {self.object_id}"


class SoftDeleteModel(models.Model):
    """Mixin pour le soft delete"""
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_objects'
    )
    
    class Meta:
        abstract = True
    
    def soft_delete(self, user=None):
        """Marquer l'objet comme supprimé"""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save()
    
    def restore(self):
        """Restaurer l'objet"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save()
