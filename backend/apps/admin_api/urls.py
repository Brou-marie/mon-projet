from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminDashboardView, AdminUserViewSet,
    AdminEstablishmentViewSet, AdminReviewViewSet,
    AdminPaymentViewSet, AdminTransactionViewSet,
    AdminDisputeViewSet
)

router = DefaultRouter()
router.register(r'dashboard', AdminDashboardView, basename='admin-dashboard')
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'establishments', AdminEstablishmentViewSet, basename='admin-establishment')
router.register(r'reviews', AdminReviewViewSet, basename='admin-review')
router.register(r'payments', AdminPaymentViewSet, basename='admin-payment')
router.register(r'transactions', AdminTransactionViewSet, basename='admin-transaction')
router.register(r'disputes', AdminDisputeViewSet, basename='admin-dispute')

urlpatterns = [
    path('', include(router.urls)),
]
