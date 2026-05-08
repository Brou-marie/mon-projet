from django.urls import path
from .views import RegisterView, MeView, GuestProfileUpdateView, HostProfileUpdateView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('profile/guest/', GuestProfileUpdateView.as_view(), name='guest-profile'),
    path('profile/host/', HostProfileUpdateView.as_view(), name='host-profile'),
]
