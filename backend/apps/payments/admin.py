from django.contrib import admin
from .models import Payment, Payout, CommissionSetting


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('booking', 'amount', 'payment_method', 'status', 'paid_at', 'created_at')
    list_filter = ('status', 'payment_method', 'currency')
    search_fields = ('booking__booking_number', 'provider_reference')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ('host', 'amount', 'net_amount', 'status', 'period_start', 'period_end')
    list_filter = ('status',)
    search_fields = ('host__email', 'transaction_reference')


@admin.register(CommissionSetting)
class CommissionSettingAdmin(admin.ModelAdmin):
    list_display = ('commission_percent', 'establishment_type', 'host', 'effective_from', 'is_default')
    list_filter = ('is_default', 'establishment_type')
