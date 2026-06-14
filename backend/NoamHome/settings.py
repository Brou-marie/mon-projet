"""Django settings for afristay project."""
import os
from pathlib import Path
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'unfold',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'apps.accounts',
    'apps.establishments',
    'apps.bookings',
    'apps.payments',
    'apps.reviews',
    'apps.notifications',
    'apps.disputes',
    'apps.public',
    'apps.owner',
    'apps.admin_api',
    'apps.client',
    'apps.common',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.accounts.middleware.SecurityHeadersMiddleware',
    'apps.accounts.middleware.CookieSecurityMiddleware',
    'apps.accounts.middleware.CSRFExemptPathsMiddleware',
]

ROOT_URLCONF = 'NoamHome.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'NoamHome.wsgi.application'

DATABASES = {
    'default': dj_database_url.parse(
        os.getenv('DATABASE_URL', 'sqlite:///db.sqlite3')
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Abidjan'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
        'rest_framework.filters.SearchFilter',
    ],
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_OBTAIN_SERIALIZER': 'apps.accounts.serializers.CustomTokenObtainPairSerializer',
}

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176').split(',')
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True

CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

DEFAULT_PLATFORM_COMMISSION_PERCENT = 15

UNFOLD = {
    'SITE_TITLE': 'Administration NoamHome',
    'SITE_HEADER': 'NoamHome',
    'SITE_SUBHEADER': 'Administration de la plateforme',
    'SITE_SYMBOL': 'home_work',
    'SITE_URL': '/',
    'SHOW_HISTORY': True,
    'SHOW_VIEW_ON_SITE': False,
    'SHOW_BACK_BUTTON': True,
    'DASHBOARD_CALLBACK': 'NoamHome.admin.dashboard_callback',
    'COMMAND': {
        'search_models': True,
        'show_history': True,
    },
    'COLORS': {
        'primary': {
            '50': 'oklch(97.9% .021 166.113)',
            '100': 'oklch(95% .052 163.051)',
            '200': 'oklch(90.5% .093 164.15)',
            '300': 'oklch(84.5% .143 164.978)',
            '400': 'oklch(76.5% .177 163.223)',
            '500': 'oklch(69.6% .17 162.48)',
            '600': 'oklch(59.6% .145 163.225)',
            '700': 'oklch(50.8% .118 165.612)',
            '800': 'oklch(43.2% .095 166.913)',
            '900': 'oklch(37.8% .077 168.94)',
            '950': 'oklch(26.2% .051 172.552)',
        },
    },
    'SIDEBAR': {
        'show_search': True,
        'command_search': True,
        'show_all_applications': False,
        'navigation': [
            {
                'title': _('Pilotage'),
                'separator': True,
                'items': [
                    {
                        'title': _('Tableau de bord'),
                        'icon': 'dashboard',
                        'link': reverse_lazy('admin:index'),
                    },
                    {
                        'title': _('Utilisateurs'),
                        'icon': 'group',
                        'link': reverse_lazy('admin:accounts_user_changelist'),
                    },
                    {
                        'title': _('Profils hébergeurs'),
                        'icon': 'verified_user',
                        'link': reverse_lazy('admin:accounts_hostprofile_changelist'),
                        'badge': 'NoamHome.admin.pending_hosts_badge',
                    },
                ],
            },
            {
                'title': _('Hébergements'),
                'separator': True,
                'collapsible': True,
                'items': [
                    {
                        'title': _('Établissements'),
                        'icon': 'apartment',
                        'link': reverse_lazy('admin:establishments_establishment_changelist'),
                        'badge': 'NoamHome.admin.pending_establishments_badge',
                    },
                    {
                        'title': _('Types de chambres'),
                        'icon': 'bed',
                        'link': reverse_lazy('admin:establishments_roomtype_changelist'),
                    },
                    {
                        'title': _('Disponibilités'),
                        'icon': 'calendar_month',
                        'link': reverse_lazy('admin:establishments_roomavailability_changelist'),
                    },
                    {
                        'title': _('Équipements'),
                        'icon': 'room_service',
                        'link': reverse_lazy('admin:establishments_amenity_changelist'),
                    },
                ],
            },
            {
                'title': _('Opérations'),
                'separator': True,
                'collapsible': True,
                'items': [
                    {
                        'title': _('Réservations'),
                        'icon': 'event_available',
                        'link': reverse_lazy('admin:bookings_booking_changelist'),
                    },
                    {
                        'title': _('Paiements'),
                        'icon': 'payments',
                        'link': reverse_lazy('admin:payments_payment_changelist'),
                        'badge': 'NoamHome.admin.pending_payments_badge',
                    },
                    {
                        'title': _('Versements'),
                        'icon': 'account_balance_wallet',
                        'link': reverse_lazy('admin:payments_payout_changelist'),
                    },
                    {
                        'title': _('Commissions'),
                        'icon': 'percent',
                        'link': reverse_lazy('admin:payments_commissionsetting_changelist'),
                    },
                ],
            },
            {
                'title': _('Qualité et communication'),
                'separator': True,
                'collapsible': True,
                'items': [
                    {
                        'title': _('Avis'),
                        'icon': 'reviews',
                        'link': reverse_lazy('admin:reviews_review_changelist'),
                        'badge': 'NoamHome.admin.flagged_reviews_badge',
                    },
                    {
                        'title': _('Notifications'),
                        'icon': 'notifications',
                        'link': reverse_lazy('admin:notifications_notification_changelist'),
                    },
                    {
                        'title': _('Groupes et permissions'),
                        'icon': 'admin_panel_settings',
                        'link': reverse_lazy('admin:auth_group_changelist'),
                        'permission': lambda request: request.user.is_superuser,
                    },
                ],
            },
        ],
    },
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
