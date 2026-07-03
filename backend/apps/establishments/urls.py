from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AmenityViewSet, EstablishmentViewSet, RoomTypeViewSet,
    EstablishmentImageUploadView, EstablishmentImageDeleteView,
    EstablishmentImageUpdateView, EstablishmentImageListView,
    RoomTypeCreateView, RoomTypeImageUploadView,
    RoomTypeImageUpdateView, RoomTypeImageDeleteView, RoomTypeImageListView,
)

router = DefaultRouter()
router.register(r'amenities', AmenityViewSet, basename='amenity')
router.register(r'room-types', RoomTypeViewSet, basename='roomtype')
router.register(r'', EstablishmentViewSet, basename='establishment')

urlpatterns = [
    path('', include(router.urls)),
    # Establishment images
    path('<slug:slug>/images/', EstablishmentImageUploadView.as_view(), name='establishment-images-upload'),
    path('<slug:slug>/images/list/', EstablishmentImageListView.as_view(), name='establishment-images-list'),
    path('images/<uuid:pk>/', EstablishmentImageUpdateView.as_view(), name='establishment-image-update'),
    path('images/<uuid:pk>/delete/', EstablishmentImageDeleteView.as_view(), name='establishment-image-delete'),
    # Room type images
    path('room-types/<uuid:pk>/images/', RoomTypeImageUploadView.as_view(), name='roomtype-images-upload'),
    path('room-types/<uuid:pk>/images/list/', RoomTypeImageListView.as_view(), name='roomtype-images-list'),
    path('room-types/images/<uuid:image_pk>/', RoomTypeImageUpdateView.as_view(), name='roomtype-image-update'),
    path('room-types/images/<uuid:image_pk>/delete/', RoomTypeImageDeleteView.as_view(), name='roomtype-image-delete'),
    # Room type creation
    path('<slug:slug>/room-types/', RoomTypeCreateView.as_view(), name='establishment-room-types-create'),
]
