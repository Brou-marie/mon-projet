from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.bookings.models import Booking
from apps.notifications.services import notify_user


class Command(BaseCommand):
    help = 'Envoie des notifications aux clients avant la limite de check-in (18h)'

    def handle(self, *args, **options):
        now = timezone.now()
        today = now.date()
        
        # Réservations confirmées pour aujourd'hui sans check-in
        bookings_to_notify = Booking.objects.filter(
            status=Booking.CONFIRMED,
            check_in_date=today,
            actual_check_in__isnull=True
        )
        
        notified_count = 0
        
        for booking in bookings_to_notify:
            # Vérifier si on est 1 heure avant 18h
            current_hour = now.hour
            if current_hour == 17:  # 17h = 1 heure avant 18h
                notify_user(
                    booking.guest,
                    'late_checkin_warning',
                    'Attention : Arrivée tardive imminente',
                    f'Votre check-in est prévu aujourd\'hui. Arrivez avant 18h pour éviter des frais supplémentaires de 10%. Code de réservation : {booking.reservation_code}',
                    {
                        'booking_number': booking.booking_number,
                        'reservation_code': booking.reservation_code,
                        'check_in_date': booking.check_in_date.isoformat(),
                    }
                )
                notified_count += 1
        
        if notified_count == 0:
            self.stdout.write('Aucune notification à envoyer.')
        else:
            self.stdout.write(
                self.style.SUCCESS(f'{notified_count} notification(s) envoyée(s).')
            )
