from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AmenityViewSet, EstablishmentViewSet, RoomTypeViewSet

router = DefaultRouter()
router.register(r'amenities', AmenityViewSet, basename='amenity')
router.register(r'', EstablishmentViewSet, basename='establishment')
router.register(r'room-types', RoomTypeViewSet, basename='roomtype')

urlpatterns = [
    path('', include(router.urls)),
]
