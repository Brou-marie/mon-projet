from django.contrib import admin
from django.utils import timezone
from unfold.admin import ModelAdmin
from unfold.decorators import display

from .models import Notification


READ_STATUS_LABELS = {
    'read': 'success',
    'unread': 'warning',
}


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = (
        'user', 'notification_type', 'title',
        'read_status', 'read_at', 'created_at',
    )
    list_filter = ('notification_type', 'is_read')
    search_fields = ('user__email', 'title', 'message')
    autocomplete_fields = ('user',)
    list_select_related = ('user',)
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    actions = ('mark_read', 'mark_unread')
    fieldsets = (
        ('Notification', {
            'fields': ('user', 'notification_type', 'title', 'message', 'data'),
            'classes': ('tab',),
        }),
        ('Lecture', {
            'fields': ('is_read', 'read_at'),
            'classes': ('tab',),
        }),
        ('Traçabilité', {
            'fields': ('created_at',),
            'classes': ('tab',),
        }),
    )

    @display(description='Lecture', ordering='is_read', label=READ_STATUS_LABELS)
    def read_status(self, obj):
        if obj.is_read:
            return ('read', 'Lue')
        return ('unread', 'Non lue')

    @admin.action(description='Marquer les notifications comme lues')
    def mark_read(self, request, queryset):
        updated = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'{updated} notification(s) marquée(s) comme lue(s).')

    @admin.action(description='Marquer les notifications comme non lues')
    def mark_unread(self, request, queryset):
        updated = queryset.update(is_read=False, read_at=None)
        self.message_user(request, f'{updated} notification(s) marquée(s) comme non lue(s).')
