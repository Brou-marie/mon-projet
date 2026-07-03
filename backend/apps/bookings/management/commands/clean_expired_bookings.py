from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.bookings.models import Booking
from apps.bookings.services import restore_availability, record_status


class Command(BaseCommand):
    help = 'Nettoie les réservations expirées (non payées après 15 minutes)'

    def handle(self, *args, **options):
        expired_bookings = Booking.objects.filter(
            status=Booking.PENDING_PAYMENT,
            expires_at__lt=timezone.now()
        )

        count = expired_bookings.count()
        if count == 0:
            self.stdout.write('Aucune réservation expirée à nettoyer.')
            return

        for booking in expired_bookings:
            # Restaurer la disponibilité
            restore_availability(booking)
            
            # Mettre à jour le statut
            booking.status = Booking.CANCELLED
            booking.cancellation_reason = 'Réservation expirée (paiement non reçu)'
            booking.cancelled_at = timezone.now()
            booking.save(update_fields=('status', 'cancellation_reason', 'cancelled_at', 'updated_at'))
            
            # Enregistrer dans l'historique
            record_status(booking, Booking.CANCELLED, note='Réservation expirée automatiquement')

        self.stdout.write(
            self.style.SUCCESS(f'{count} réservation(s) expirée(s) nettoyée(s).')
        )
