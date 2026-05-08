from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, PayoutViewSet, CommissionSettingViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'payouts', PayoutViewSet, basename='payout')
router.register(r'commissions', CommissionSettingViewSet, basename='commission')

urlpatterns = [
    path('', include(router.urls)),
]
