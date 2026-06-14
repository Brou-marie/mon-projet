from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from .models import (
    Amenity,
    Establishment,
    EstablishmentImage,
    RoomAvailability,
    RoomType,
    RoomTypeImage,
)


ESTABLISHMENT_STATUS_LABELS = {
    'pending': 'warning',
    'active': 'success',
    'suspended': 'danger',
    'rejected': 'danger',
}


@admin.register(Amenity)
class AmenityAdmin(ModelAdmin):
    list_display = ('name', 'category', 'icon', 'created_at')
    list_filter = ('category',)
    search_fields = ('name', 'icon')
    readonly_fields = ('created_at',)


class EstablishmentImageInline(TabularInline):
    model = EstablishmentImage
    extra = 0
    fields = ('image', 'caption', 'is_primary', 'display_order')


class RoomTypeInline(TabularInline):
    model = RoomType
    extra = 0
    fields = (
        'name', 'base_price_per_night', 'physical_room_count',
        'capacity_adults', 'is_active',
    )
    show_change_link = True


@admin.register(Establishment)
class EstablishmentAdmin(ModelAdmin):
    list_display = (
        'name', 'city', 'establishment_type', 'host', 'status_badge',
        'is_featured', 'avg_rating', 'created_at',
    )
    list_filter = (
        'status', 'establishment_type', 'is_featured', 'city',
        'cancellation_policy', 'requires_manual_validation',
    )
    search_fields = ('name', 'address', 'city', 'quarter', 'host__email')
    autocomplete_fields = ('host',)
    readonly_fields = ('slug', 'avg_rating', 'review_count', 'created_at', 'updated_at')
    list_select_related = ('host',)
    inlines = (EstablishmentImageInline, RoomTypeInline)
    date_hierarchy = 'created_at'
    actions = (
        'approve_establishments', 'reject_establishments',
        'suspend_establishments', 'feature_establishments',
        'unfeature_establishments',
    )
    fieldsets = (
        ('Présentation', {
            'fields': (
                'host', 'name', 'slug', 'description', 'establishment_type',
                'status', 'is_featured', 'requires_manual_validation',
            ),
            'classes': ('tab',),
        }),
        ('Localisation', {
            'fields': ('address', 'city', 'quarter', 'latitude', 'longitude'),
            'classes': ('tab',),
        }),
        ('Séjour', {
            'fields': ('check_in_time', 'check_out_time', 'cancellation_policy'),
            'classes': ('tab',),
        }),
        ('Qualité et traçabilité', {
            'fields': ('avg_rating', 'review_count', 'created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )

    @display(description='Statut', ordering='status', label=ESTABLISHMENT_STATUS_LABELS)
    def status_badge(self, obj):
        return (obj.status, obj.get_status_display())

    @admin.action(description='Approuver les établissements sélectionnés')
    def approve_establishments(self, request, queryset):
        updated = queryset.update(status='active')
        self.message_user(request, f'{updated} établissement(s) approuvé(s).')

    @admin.action(description='Rejeter les établissements sélectionnés')
    def reject_establishments(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} établissement(s) rejeté(s).')

    @admin.action(description='Suspendre les établissements sélectionnés')
    def suspend_establishments(self, request, queryset):
        updated = queryset.update(status='suspended')
        self.message_user(request, f'{updated} établissement(s) suspendu(s).')

    @admin.action(description='Mettre les établissements en vedette')
    def feature_establishments(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} établissement(s) mis en vedette.')

    @admin.action(description='Retirer les établissements de la mise en vedette')
    def unfeature_establishments(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f'{updated} établissement(s) retiré(s) de la mise en vedette.')


@admin.register(EstablishmentImage)
class EstablishmentImageAdmin(ModelAdmin):
    list_display = ('establishment', 'caption', 'is_primary', 'display_order', 'created_at')
    list_filter = ('is_primary',)
    search_fields = ('establishment__name', 'caption')
    autocomplete_fields = ('establishment',)
    readonly_fields = ('created_at',)
    list_select_related = ('establishment',)


class RoomTypeImageInline(TabularInline):
    model = RoomTypeImage
    extra = 0
    fields = ('image', 'caption', 'is_primary', 'display_order')


@admin.register(RoomType)
class RoomTypeAdmin(ModelAdmin):
    list_display = (
        'name', 'establishment', 'base_price_per_night',
        'physical_room_count', 'capacity_adults', 'is_active',
    )
    list_filter = ('is_active', 'establishment__establishment_type')
    search_fields = ('name', 'establishment__name', 'establishment__city')
    autocomplete_fields = ('establishment',)
    filter_horizontal = ('amenities',)
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('establishment',)
    inlines = (RoomTypeImageInline,)
    fieldsets = (
        ('Chambre', {
            'fields': (
                'establishment', 'name', 'description', 'is_active',
                'physical_room_count',
            ),
            'classes': ('tab',),
        }),
        ('Capacité et tarif', {
            'fields': (
                'capacity_adults', 'capacity_children',
                'base_price_per_night', 'size_sqm', 'bed_type',
            ),
            'classes': ('tab',),
        }),
        ('Équipements', {
            'fields': ('amenities',),
            'classes': ('tab',),
        }),
        ('Traçabilité', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )


@admin.register(RoomTypeImage)
class RoomTypeImageAdmin(ModelAdmin):
    list_display = ('room_type', 'caption', 'is_primary', 'display_order', 'created_at')
    list_filter = ('is_primary',)
    search_fields = ('room_type__name', 'room_type__establishment__name', 'caption')
    autocomplete_fields = ('room_type',)
    readonly_fields = ('created_at',)
    list_select_related = ('room_type', 'room_type__establishment')


@admin.register(RoomAvailability)
class RoomAvailabilityAdmin(ModelAdmin):
    list_display = (
        'room_type', 'date', 'available_count',
        'is_manually_blocked', 'special_price',
    )
    list_editable = ('available_count', 'is_manually_blocked', 'special_price')
    list_filter = ('is_manually_blocked', 'date')
    search_fields = ('room_type__name', 'room_type__establishment__name')
    autocomplete_fields = ('room_type',)
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('room_type', 'room_type__establishment')
    date_hierarchy = 'date'
    fieldsets = (
        ('Disponibilité', {
            'fields': (
                'room_type', 'date', 'available_count',
                'is_manually_blocked', 'special_price',
            ),
            'classes': ('tab',),
        }),
        ('Traçabilité', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )
