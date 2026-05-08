from django.contrib import admin
from .models import Amenity, Establishment, EstablishmentImage, RoomType, RoomTypeImage, RoomAvailability


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'created_at')
    list_filter = ('category',)
    search_fields = ('name',)


class EstablishmentImageInline(admin.TabularInline):
    model = EstablishmentImage
    extra = 1


@admin.register(Establishment)
class EstablishmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'establishment_type', 'host', 'status', 'avg_rating', 'created_at')
    list_filter = ('status', 'establishment_type', 'city', 'cancellation_policy')
    search_fields = ('name', 'address', 'city', 'host__email')
    inlines = [EstablishmentImageInline]
    date_hierarchy = 'created_at'


class RoomTypeImageInline(admin.TabularInline):
    model = RoomTypeImage
    extra = 1


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'establishment', 'base_price_per_night', 'physical_room_count', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'establishment__name')
    inlines = [RoomTypeImageInline]


@admin.register(RoomAvailability)
class RoomAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('room_type', 'date', 'available_count', 'is_manually_blocked', 'special_price')
    list_filter = ('is_manually_blocked',)
    search_fields = ('room_type__name',)
    date_hierarchy = 'date'
