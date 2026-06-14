from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OwnerDashboardView, OwnerEstablishmentViewSet,
    OwnerRoomTypeViewSet, OwnerAvailabilityViewSet,
    OwnerBookingViewSet
)

router = DefaultRouter()
router.register(r'dashboard', OwnerDashboardView, basename='owner-dashboard')
router.register(r'establishments', OwnerEstablishmentViewSet, basename='owner-establishment')
router.register(r'rooms', OwnerRoomTypeViewSet, basename='owner-room')
router.register(r'availability', OwnerAvailabilityViewSet, basename='owner-availability')
router.register(r'bookings', OwnerBookingViewSet, basename='owner-booking')

urlpatterns = [
    path('', include(router.urls)),
]
