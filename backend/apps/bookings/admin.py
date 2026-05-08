from django.contrib import admin
from .models import Booking, BookingStatusHistory


class BookingStatusHistoryInline(admin.TabularInline):
    model = BookingStatusHistory
    extra = 0
    readonly_fields = ('created_at',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('booking_number', 'guest', 'establishment', 'check_in_date',
                    'check_out_date', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'check_in_date', 'created_at')
    search_fields = ('booking_number', 'guest__email', 'establishment__name')
    readonly_fields = ('booking_number', 'total_nights', 'created_at', 'updated_at')
    inlines = [BookingStatusHistoryInline]
    date_hierarchy = 'check_in_date'


@admin.register(BookingStatusHistory)
class BookingStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('booking', 'status', 'changed_by', 'created_at')
    list_filter = ('status',)
    search_fields = ('booking__booking_number',)
