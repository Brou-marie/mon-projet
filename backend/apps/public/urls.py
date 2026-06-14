from django.urls import path
from .views import (
    FeaturedListingsView, PopularLocationsView, ListingsListView,
    ListingDetailView, ListingReviewsView, check_availability
)

urlpatterns = [
    path('hebergements/vedettes/', FeaturedListingsView.as_view(), name='featured-listings'),
    path('hebergements/disponibilite/', check_availability, name='check-availability'),
    path('destinations/populaires/', PopularLocationsView.as_view(), name='popular-locations'),
    path('hebergements/', ListingsListView.as_view(), name='listings-list'),
    path('hebergements/<slug:slug>/', ListingDetailView.as_view(), name='listing-detail'),
    path('hebergements/<slug:slug>/avis/', ListingReviewsView.as_view(), name='listing-reviews'),
]
