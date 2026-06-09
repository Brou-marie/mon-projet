from django.urls import path

from .views import (
    AdminBookingListView,
    AdminEstablishmentDetailView,
    AdminEstablishmentListView,
    AdminHostProfileDetailView,
    AdminHostProfileListView,
    AdminOverviewView,
    AdminPaymentListView,
    AdminUserDetailView,
    AdminUserListView,
)

urlpatterns = [
    path('overview/', AdminOverviewView.as_view(), name='admin-overview'),
    path('users/', AdminUserListView.as_view(), name='admin-users'),
    path('users/<uuid:id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('hosts/', AdminHostProfileListView.as_view(), name='admin-hosts'),
    path('hosts/<uuid:id>/', AdminHostProfileDetailView.as_view(), name='admin-host-detail'),
    path('establishments/', AdminEstablishmentListView.as_view(), name='admin-establishments'),
    path(
        'establishments/<uuid:id>/',
        AdminEstablishmentDetailView.as_view(),
        name='admin-establishment-detail',
    ),
    path('bookings/', AdminBookingListView.as_view(), name='admin-bookings'),
    path('payments/', AdminPaymentListView.as_view(), name='admin-payments'),
]
