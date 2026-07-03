from django.apps import AppConfig


class EstablishmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.establishments'
    verbose_name = 'Établissements'

    def ready(self):
        """Import signals when the app is ready."""
        import apps.establishments.models
