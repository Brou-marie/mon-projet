from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AmenityViewSet, EstablishmentViewSet, RoomTypeViewSet,
    EstablishmentImageUploadView, EstablishmentImageDeleteView,
    RoomTypeCreateView,
)

router = DefaultRouter()
router.register(r'amenities', AmenityViewSet, basename='amenity')
router.register(r'room-types', RoomTypeViewSet, basename='roomtype')
router.register(r'', EstablishmentViewSet, basename='establishment')

urlpatterns = [
    path('', include(router.urls)),
    path('<slug:slug>/images/', EstablishmentImageUploadView.as_view(), name='establishment-images-upload'),
    path('images/<uuid:pk>/', EstablishmentImageDeleteView.as_view(), name='establishment-image-delete'),
    path('<slug:slug>/room-types/', RoomTypeCreateView.as_view(), name='establishment-room-types-create'),
]
