from django.contrib import admin
from django.utils import timezone
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from .models import Booking, BookingStatusHistory


BOOKING_STATUS_LABELS = {
    'cart': 'warning',
    'confirmed': 'success',
    'in_progress': 'info',
    'completed': 'primary',
    'cancelled_by_guest': 'danger',
    'cancelled_by_host': 'danger',
    'dispute': 'danger',
    'no_show': 'warning',
}


class BookingStatusHistoryInline(TabularInline):
    model = BookingStatusHistory
    extra = 0
    can_delete = False
    fields = ('status', 'changed_by', 'note', 'created_at')
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Booking)
class BookingAdmin(ModelAdmin):
    list_display = (
        'booking_number', 'guest', 'establishment', 'check_in_date',
        'check_out_date', 'status_badge', 'total_amount', 'created_at',
    )
    list_filter = ('status', 'check_in_date', 'created_at')
    search_fields = ('booking_number', 'guest__email', 'establishment__name')
    autocomplete_fields = ('guest', 'room_type', 'establishment', 'cancelled_by')
    list_select_related = ('guest', 'establishment', 'room_type', 'cancelled_by')
    readonly_fields = (
        'booking_number', 'total_nights', 'created_at', 'updated_at',
        'actual_check_in', 'actual_check_out',
    )
    inlines = (BookingStatusHistoryInline,)
    date_hierarchy = 'check_in_date'
    actions = ('confirm_bookings', 'start_stays', 'complete_stays')
    fieldsets = (
        ('Réservation', {
            'fields': (
                'booking_number', 'guest', 'establishment', 'room_type',
                'check_in_date', 'check_out_date', 'total_nights',
                'guest_count_adults', 'guest_count_children', 'status',
            ),
            'classes': ('tab',),
        }),
        ('Montants', {
            'fields': (
                'subtotal', 'platform_fee', 'tax_amount', 'total_amount',
                'commission_amount', 'host_payout', 'promo_code',
                'promo_discount', 'refund_amount',
            ),
            'classes': ('tab',),
        }),
        ('Notes et annulation', {
            'fields': (
                'guest_notes', 'host_notes', 'cancellation_reason',
                'cancelled_at', 'cancelled_by',
            ),
            'classes': ('tab',),
        }),
        ('Séjour et traçabilité', {
            'fields': (
                'check_in_time', 'check_out_time', 'actual_check_in',
                'actual_check_out', 'expires_at', 'qr_code',
                'price_breakdown', 'created_at', 'updated_at',
            ),
            'classes': ('tab',),
        }),
    )

    @display(description='Statut', ordering='status', label=BOOKING_STATUS_LABELS)
    def status_badge(self, obj):
        return (obj.status, obj.get_status_display())

    def save_model(self, request, obj, form, change):
        previous_status = None
        if change:
            previous_status = Booking.objects.only('status').get(pk=obj.pk).status
        super().save_model(request, obj, form, change)
        if not change:
            BookingStatusHistory.objects.create(
                booking=obj,
                status=obj.status,
                changed_by=request.user,
                note='Création depuis l’administration.',
            )
        elif previous_status != obj.status:
            BookingStatusHistory.objects.create(
                booking=obj,
                status=obj.status,
                changed_by=request.user,
                note=f'Changement depuis l’administration: {previous_status} -> {obj.status}.',
            )

    def _transition(self, request, queryset, from_statuses, to_status, note):
        changed = 0
        for booking in queryset.filter(status__in=from_statuses):
            booking.status = to_status
            if to_status == 'in_progress':
                booking.actual_check_in = timezone.now()
            elif to_status == 'completed':
                booking.actual_check_out = timezone.now()
            booking.save()
            BookingStatusHistory.objects.create(
                booking=booking, status=to_status, changed_by=request.user, note=note
            )
            changed += 1
        self.message_user(request, f'{changed} réservation(s) mise(s) à jour.')

    @admin.action(description='Confirmer les réservations au panier')
    def confirm_bookings(self, request, queryset):
        self._transition(request, queryset, ('cart',), 'confirmed', 'Confirmation administrative.')

    @admin.action(description='Démarrer les séjours confirmés')
    def start_stays(self, request, queryset):
        self._transition(request, queryset, ('confirmed',), 'in_progress', 'Check-in administratif.')

    @admin.action(description='Terminer les séjours en cours')
    def complete_stays(self, request, queryset):
        self._transition(request, queryset, ('in_progress',), 'completed', 'Check-out administratif.')


@admin.register(BookingStatusHistory)
class BookingStatusHistoryAdmin(ModelAdmin):
    list_display = ('booking', 'status_badge', 'changed_by', 'created_at')
    list_filter = ('status',)
    search_fields = ('booking__booking_number', 'changed_by__email', 'note')
    autocomplete_fields = ('booking', 'changed_by')
    readonly_fields = ('booking', 'status', 'changed_by', 'note', 'created_at')
    list_select_related = ('booking', 'changed_by')

    @display(description='Statut', ordering='status', label=BOOKING_STATUS_LABELS)
    def status_badge(self, obj):
        return (obj.status, obj.get_status_display())

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
