from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DisputeViewSet, DisputeAttachmentViewSet

router = DefaultRouter()
router.register(r'disputes', DisputeViewSet, basename='dispute')
router.register(r'attachments', DisputeAttachmentViewSet, basename='dispute-attachment')

urlpatterns = [
    path('', include(router.urls)),
]
