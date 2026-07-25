from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CommissionSettingViewSet,
    PaymentConfirmView,
    PaymentInitView,
    PaymentSimulateView,
    PaymentViewSet,
    PayoutViewSet,
)

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'payouts', PayoutViewSet, basename='payout')
router.register(r'commissions', CommissionSettingViewSet, basename='commission')

urlpatterns = [
    path('init/', PaymentInitView.as_view(), name='payment-init'),
    path('simulate/', PaymentSimulateView.as_view(), name='payment-simulate'),
    path('confirm/', PaymentConfirmView.as_view(), name='payment-confirm'),
    path('', include(router.urls)),
]
