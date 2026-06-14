from django.db.models import Sum

from apps.accounts.models import HostProfile, User
from apps.bookings.models import Booking
from apps.establishments.models import Establishment
from apps.payments.models import Payment
from apps.reviews.models import Review


def pending_hosts_badge(request):
    return HostProfile.objects.filter(
        verification_status__in=('pending', 'under_review')
    ).count()


def pending_establishments_badge(request):
    return Establishment.objects.filter(status='pending').count()


def pending_payments_badge(request):
    return Payment.objects.filter(status__in=('pending', 'processing')).count()


def flagged_reviews_badge(request):
    return Review.objects.filter(is_flagged=True).count()


def dashboard_callback(request, context):
    paid_payments = Payment.objects.filter(status='succeeded')
    context.update(
        {
            'dashboard_stats': [
                {
                    'label': 'Utilisateurs',
                    'value': User.objects.count(),
                    'icon': 'group',
                    'url_name': 'admin:accounts_user_changelist',
                },
                {
                    'label': 'Établissements actifs',
                    'value': Establishment.objects.filter(status='active').count(),
                    'icon': 'apartment',
                    'url_name': 'admin:establishments_establishment_changelist',
                },
                {
                    'label': 'Réservations à confirmer',
                    'value': Booking.objects.filter(status='cart').count(),
                    'icon': 'event_available',
                    'url_name': 'admin:bookings_booking_changelist',
                },
                {
                    'label': 'Revenus encaissés',
                    'value': paid_payments.aggregate(total=Sum('amount'))['total'] or 0,
                    'suffix': ' FCFA',
                    'icon': 'payments',
                    'url_name': 'admin:payments_payment_changelist',
                },
            ],
            'dashboard_queues': [
                {
                    'label': 'Hébergeurs à vérifier',
                    'value': pending_hosts_badge(request),
                    'icon': 'verified_user',
                    'url_name': 'admin:accounts_hostprofile_changelist',
                },
                {
                    'label': 'Établissements à valider',
                    'value': pending_establishments_badge(request),
                    'icon': 'apartment',
                    'url_name': 'admin:establishments_establishment_changelist',
                },
                {
                    'label': 'Paiements à suivre',
                    'value': pending_payments_badge(request),
                    'icon': 'payments',
                    'url_name': 'admin:payments_payment_changelist',
                },
                {
                    'label': 'Avis signalés',
                    'value': flagged_reviews_badge(request),
                    'icon': 'reviews',
                    'url_name': 'admin:reviews_review_changelist',
                },
            ],
            'pending_hosts': HostProfile.objects.select_related('user').filter(
                verification_status__in=('pending', 'under_review')
            )[:5],
            'pending_establishments': Establishment.objects.select_related('host').filter(
                status='pending'
            )[:5],
            'recent_bookings': Booking.objects.select_related(
                'guest', 'establishment'
            )[:5],
            'flagged_reviews': Review.objects.select_related(
                'reviewer', 'establishment'
            ).filter(is_flagged=True)[:5],
        }
    )
    return context
