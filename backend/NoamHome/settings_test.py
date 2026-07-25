"""
Settings minimaux pour les tests — DB SQLite en mémoire, pas de cache Redis,
email en mémoire. Import tout depuis settings.py et override ce qui ralentit.

ATTENTION : Ce fichier est UNIQUEMENT pour `python manage.py test`.
             Il ne doit JAMAIS être utilisé pour `runserver`.
"""
import sys

# Bloquer l'utilisation hors contexte de tests
_is_testing = (
    'test' in sys.argv
    or 'pytest' in sys.modules
    or any('pytest' in arg for arg in sys.argv)
)
if not _is_testing:
    raise RuntimeError(
        "\n\n"
        "❌  NoamHome.settings_test ne peut pas être utilisé avec 'runserver'.\n"
        "    Ce fichier est réservé aux tests unitaires.\n\n"
        "    Pour lancer le serveur :\n"
        "      python manage.py runserver\n\n"
        "    Si cette erreur apparaît dans 'runserver', supprime la variable :\n"
        "      Remove-Item Env:DJANGO_SETTINGS_MODULE  (PowerShell)\n"
        "      unset DJANGO_SETTINGS_MODULE             (bash/cmd)\n"
    )

from NoamHome.settings import *  # noqa: F401, F403

# Base de données SQLite en mémoire partagée (plus rapide que fichier)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'TEST': {
            'NAME': ':memory:',
        },
    }
}

# Désactiver whitenoise en test (cause le warning staticfiles)
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
STATIC_ROOT = None

# Email en mémoire
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Pas de Redis en test
CELERY_TASK_ALWAYS_EAGER = True
CELERY_BROKER_URL = 'memory://'

# Throttling désactivé en test
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    'DEFAULT_THROTTLE_CLASSES': [],
    'DEFAULT_THROTTLE_RATES': {},
}

# Hasher de mot de passe ultra-rapide
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Désactiver le logging en test
LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'handlers': {},
    'root': {'handlers': []},
}
