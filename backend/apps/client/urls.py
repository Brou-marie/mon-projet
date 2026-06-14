from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientDashboardView, ClientBookingViewSet, ClientReviewViewSet

router = DefaultRouter()
router.register(r'dashboard', ClientDashboardView, basename='client-dashboard')
router.register(r'bookings', ClientBookingViewSet, basename='client-booking')
router.register(r'reviews', ClientReviewViewSet, basename='client-review')

urlpatterns = [
    path('', include(router.urls)),
]
