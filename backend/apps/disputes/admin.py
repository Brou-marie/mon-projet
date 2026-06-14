from django.contrib import admin
from unfold.admin import ModelAdmin
from unfold.decorators import display
from .models import Dispute, DisputeAttachment


@admin.register(Dispute)
class DisputeAdmin(ModelAdmin):
    list_display = ['id', 'subject', 'dispute_type', 'status', 'priority', 'raised_by', 'created_at']
    list_filter = ['status', 'priority', 'dispute_type', 'created_at']
    search_fields = ['subject', 'description', 'raised_by__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('booking', 'raised_by', 'dispute_type', 'subject', 'description')
        }),
        ('Statut', {
            'fields': ('status', 'priority')
        }),
        ('Résolution', {
            'fields': ('resolution', 'resolved_by', 'resolved_at', 'compensation_amount', 'compensation_type')
        }),
        ('Escalade', {
            'fields': ('escalated_to', 'escalated_at')
        }),
        ('Preuves et communication', {
            'fields': ('evidence', 'messages')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(DisputeAttachment)
class DisputeAttachmentAdmin(ModelAdmin):
    list_display = ['id', 'dispute', 'uploaded_by', 'file_type', 'created_at']
    list_filter = ['file_type', 'created_at']
    search_fields = ['dispute__subject', 'uploaded_by__email']
    readonly_fields = ['created_at']
