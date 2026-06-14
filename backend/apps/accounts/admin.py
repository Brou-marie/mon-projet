from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group

from unfold.admin import ModelAdmin
from unfold.decorators import display
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import GuestProfile, HostProfile, User


ROLE_LABELS = {
    'guest': 'info',
    'host': 'primary',
    'moderator': 'warning',
    'superadmin': 'success',
}

VERIFICATION_LABELS = {
    'pending': 'warning',
    'under_review': 'info',
    'verified': 'success',
    'rejected': 'danger',
}


class NoamUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('email',)


class NoamUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = '__all__'


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = NoamUserChangeForm
    add_form = NoamUserCreationForm
    change_password_form = AdminPasswordChangeForm
    list_display = (
        'email', 'first_name', 'last_name', 'role_badge', 'is_staff',
        'is_active', 'created_at',
    )
    list_filter = (
        'role', 'is_staff', 'is_active', 'is_email_verified',
        'is_phone_verified',
    )
    search_fields = ('email', 'phone', 'first_name', 'last_name')
    ordering = ('-created_at',)
    readonly_fields = (
        'is_staff', 'is_superuser', 'created_at', 'updated_at',
        'last_login', 'date_joined',
    )
    filter_horizontal = ('groups', 'user_permissions')
    fieldsets = (
        ('Identité', {
            'fields': ('email', 'password', 'first_name', 'last_name', 'phone', 'avatar'),
            'classes': ('tab',),
        }),
        ('Rôle et accès', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser'),
            'classes': ('tab',),
        }),
        ('Vérifications', {
            'fields': ('is_email_verified', 'is_phone_verified'),
            'classes': ('tab',),
        }),
        ('Permissions', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('tab',),
        }),
        ('Traçabilité', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )
    add_fieldsets = (
        ('Créer un utilisateur', {
            'classes': ('wide',),
            'fields': (
                'email', 'first_name', 'last_name', 'phone', 'role',
                'password1', 'password2', 'is_active',
            ),
        }),
    )

    @display(description='Rôle', ordering='role', label=ROLE_LABELS)
    def role_badge(self, obj):
        return (obj.role, obj.get_role_display())


@admin.register(GuestProfile)
class GuestProfileAdmin(ModelAdmin):
    list_display = ('user', 'loyalty_points', 'created_at')
    search_fields = ('user__email', 'user__phone')
    autocomplete_fields = ('user',)
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('user',)
    fieldsets = (
        ('Voyageur', {
            'fields': ('user', 'id_document', 'preferences', 'loyalty_points'),
            'classes': ('tab',),
        }),
        ('Traçabilité', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )


@admin.register(HostProfile)
class HostProfileAdmin(ModelAdmin):
    list_display = (
        'user', 'company_name', 'verification_badge',
        'is_verified', 'commission_override_percent', 'created_at',
    )
    list_filter = ('verification_status', 'is_verified')
    search_fields = ('user__email', 'company_name', 'business_registration')
    autocomplete_fields = ('user',)
    readonly_fields = ('is_verified', 'created_at', 'updated_at')
    list_select_related = ('user',)
    actions = ('mark_under_review', 'verify_hosts', 'reject_hosts')
    fieldsets = (
        ('Hébergeur', {
            'fields': ('user', 'company_name', 'description', 'address'),
            'classes': ('tab',),
        }),
        ('Identité professionnelle', {
            'fields': ('business_registration', 'id_document'),
            'classes': ('tab',),
        }),
        ('Coordonnées bancaires', {
            'fields': (
                'bank_account_name', 'bank_account_number',
                'bank_name', 'swift_code',
            ),
            'classes': ('tab',),
        }),
        ('Vérification et commission', {
            'fields': (
                'verification_status', 'is_verified',
                'commission_override_percent',
            ),
            'classes': ('tab',),
        }),
        ('Traçabilité', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )

    @display(description='Vérification', ordering='verification_status', label=VERIFICATION_LABELS)
    def verification_badge(self, obj):
        return (obj.verification_status, obj.get_verification_status_display())

    @admin.action(description='Placer en cours de vérification')
    def mark_under_review(self, request, queryset):
        updated = queryset.update(verification_status='under_review', is_verified=False)
        self.message_user(request, f'{updated} profil(s) placé(s) en cours de vérification.')

    @admin.action(description='Vérifier les hébergeurs sélectionnés')
    def verify_hosts(self, request, queryset):
        updated = queryset.update(verification_status='verified', is_verified=True)
        self.message_user(request, f'{updated} profil(s) hébergeur(s) vérifié(s).')

    @admin.action(description='Rejeter les hébergeurs sélectionnés')
    def reject_hosts(self, request, queryset):
        updated = queryset.update(verification_status='rejected', is_verified=False)
        self.message_user(request, f'{updated} profil(s) hébergeur(s) rejeté(s).')


admin.site.unregister(Group)


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass
