from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, GuestProfile, HostProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'phone', 'first_name', 'last_name', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'is_email_verified', 'is_phone_verified')
    search_fields = ('email', 'phone', 'first_name', 'last_name')
    ordering = ('-created_at',)
    fieldsets = BaseUserAdmin.fieldsets + (
        ('NoamHome', {'fields': ('role', 'phone', 'avatar', 'is_email_verified', 'is_phone_verified')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('NoamHome', {'fields': ('role', 'phone')}),
    )


@admin.register(GuestProfile)
class GuestProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    search_fields = ('user__email', 'user__phone')


@admin.register(HostProfile)
class HostProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'company_name', 'verification_status', 'is_verified', 'created_at')
    list_filter = ('verification_status', 'is_verified')
    search_fields = ('user__email', 'company_name')
