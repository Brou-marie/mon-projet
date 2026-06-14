from django.contrib import admin
from django.db import transaction
from django.utils import timezone
from unfold.admin import ModelAdmin
from unfold.decorators import display

from apps.bookings.models import BookingStatusHistory
from .models import CommissionSetting, Payment, Payout, Invoice


PAYMENT_STATUS_LABELS = {
    'pending': 'warning',
    'processing': 'info',
    'succeeded': 'success',
    'failed': 'danger',
    'refunded': 'primary',
    'partially_refunded': 'primary',
}

PAYOUT_STATUS_LABELS = {
    'pending': 'warning',
    'processing': 'info',
    'paid': 'success',
    'failed': 'danger',
}


@admin.register(Payment)
class PaymentAdmin(ModelAdmin):
    list_display = (
        'booking', 'amount', 'currency', 'payment_method',
        'status_badge', 'paid_at', 'created_at',
    )
    list_filter = ('status', 'payment_method', 'currency')
    search_fields = ('booking__booking_number', 'provider_reference', 'booking__guest__email')
    autocomplete_fields = ('booking',)
    list_select_related = ('booking', 'booking__guest', 'booking__establishment')
    readonly_fields = ('created_at', 'updated_at')
    actions = ('mark_succeeded', 'mark_failed')
    fieldsets = (
        ('Paiement', {
            'fields': (
                'booking', 'amount', 'currency', 'payment_method',
                'provider_reference', 'status',
            ),
            'classes': ('tab',),
        }),
        ('Suivi', {
            'fields': ('failure_reason', 'metadata', 'paid_at', 'refunded_at'),
            'classes': ('tab',),
        }),
        ('Traçabilité', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )

    @display(description='Statut', ordering='status', label=PAYMENT_STATUS_LABELS)
    def status_badge(self, obj):
        return (obj.status, obj.get_status_display())

    @admin.action(description='Marquer les paiements comme réussis')
    def mark_succeeded(self, request, queryset):
        changed = 0
        with transaction.atomic():
            for payment in queryset.select_related('booking'):
                payment.status = 'succeeded'
                payment.paid_at = payment.paid_at or timezone.now()
                payment.save()

                booking = payment.booking
                previous_status = booking.status
                if previous_status != 'confirmed':
                    booking.status = 'confirmed'
                    booking.save(update_fields=('status', 'updated_at'))
                    BookingStatusHistory.objects.create(
                        booking=booking,
                        status='confirmed',
                        changed_by=request.user,
                        note=f'Paiement validé depuis l’administration: {previous_status} -> confirmed.',
                    )
                changed += 1
        self.message_user(request, f'{changed} paiement(s) marqué(s) comme réussi(s).')

    @admin.action(description='Marquer les paiements comme échoués')
    def mark_failed(self, request, queryset):
        updated = queryset.filter(status__in=('pending', 'processing')).update(status='failed')
        self.message_user(request, f'{updated} paiement(s) marqué(s) comme échoué(s).')


@admin.register(Payout)
class PayoutAdmin(ModelAdmin):
    list_display = (
        'host', 'amount', 'commission_deducted', 'net_amount',
        'status_badge', 'period_start', 'period_end',
    )
    list_filter = ('status', 'period_start', 'period_end')
    search_fields = ('host__email', 'transaction_reference')
    autocomplete_fields = ('host',)
    list_select_related = ('host',)
    readonly_fields = ('net_amount', 'created_at', 'updated_at')
    date_hierarchy = 'period_start'
    actions = ('mark_processing', 'mark_paid', 'mark_failed')
    fieldsets = (
        ('Versement', {
            'fields': (
                'host', 'amount', 'commission_deducted', 'net_amount',
                'status',
            ),
            'classes': ('tab',),
        }),
        ('Période et règlement', {
            'fields': ('period_start', 'period_end', 'paid_at', 'transaction_reference', 'notes'),
            'classes': ('tab',),
        }),
        ('Traçabilité', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )

    @display(description='Statut', ordering='status', label=PAYOUT_STATUS_LABELS)
    def status_badge(self, obj):
        return (obj.status, obj.get_status_display())

    @admin.action(description='Marquer les versements comme en cours')
    def mark_processing(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='processing')
        self.message_user(request, f'{updated} versement(s) marqué(s) comme en cours.')

    @admin.action(description='Marquer les versements comme payés')
    def mark_paid(self, request, queryset):
        changed = 0
        for payout in queryset:
            payout.status = 'paid'
            payout.paid_at = payout.paid_at or timezone.now()
            payout.save()
            changed += 1
        self.message_user(request, f'{changed} versement(s) marqué(s) comme payé(s).')

    @admin.action(description='Marquer les versements comme échoués')
    def mark_failed(self, request, queryset):
        updated = queryset.exclude(status='paid').update(status='failed')
        self.message_user(request, f'{updated} versement(s) marqué(s) comme échoué(s).')


@admin.register(CommissionSetting)
class CommissionSettingAdmin(ModelAdmin):
    list_display = (
        'commission_percent', 'host', 'is_active',
        'effective_from',
    )
    list_filter = ('is_active', 'effective_from')
    search_fields = ('host__email',)
    autocomplete_fields = ('host',)
    list_select_related = ('host',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Commission', {
            'fields': (
                'commission_percent', 'is_active', 'host',
            ),
            'classes': ('tab',),
        }),
        ('Validité', {
            'fields': ('effective_from', 'notes', 'created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )


@admin.register(Invoice)
class InvoiceAdmin(ModelAdmin):
    list_display = (
        'invoice_number', 'user', 'total_amount', 'currency',
        'status', 'issue_date', 'due_date',
    )
    list_filter = ('status', 'issue_date', 'due_date')
    search_fields = ('invoice_number', 'user__email')
    autocomplete_fields = ('user', 'payment')
    list_select_related = ('user', 'payment')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'issue_date'
    fieldsets = (
        ('Facture', {
            'fields': (
                'invoice_number', 'user', 'payment', 'amount',
                'tax_amount', 'total_amount', 'currency', 'status',
            ),
            'classes': ('tab',),
        }),
        ('Dates', {
            'fields': ('issue_date', 'due_date', 'paid_date'),
            'classes': ('tab',),
        }),
        ('Document', {
            'fields': ('pdf_file', 'pdf_url'),
            'classes': ('tab',),
        }),
        ('Notes', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )
