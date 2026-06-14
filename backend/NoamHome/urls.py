"""NoamHome URL configuration."""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/establishments/', include('apps.establishments.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    # APIs modulaires par type d'utilisateur
    path('api/client/', include('apps.client.urls')),
    path('api/owner/', include('apps.owner.urls')),
    path('api/admin/', include('apps.admin_api.urls')),
    path('api/public/', include('apps.public.urls')),
    path('api/disputes/', include('apps.disputes.urls')),
]

admin.site.site_header = 'Administration NoamHome'
admin.site.site_title = 'NoamHome Admin'
admin.site.index_title = 'Pilotage de la plateforme'

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
