from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from .models import Notification, NotificationPreference, NotificationTemplate


def notify_user(user, notification_type, title, message, data=None, channel='in_app'):
    """
    Envoie une notification à un utilisateur via différents canaux
    """
    if not user:
        return None

    notification = Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        data=data or {},
        channel=channel
    )

    # Récupérer les préférences de l'utilisateur
    preferences, _ = NotificationPreference.objects.get_or_create(user=user)
    
    # Envoyer selon les préférences
    if channel == 'email' and preferences.email_enabled:
        send_email_notification(notification, preferences)
    elif channel == 'sms' and preferences.sms_enabled:
        send_sms_notification(notification, preferences)
    elif channel == 'push' and preferences.push_enabled:
        send_push_notification(notification, preferences)
    
    return notification


def send_email_notification(notification, preferences):
    """Envoie une notification par email"""
    try:
        # Vérifier si l'utilisateur a activé ce type de notification
        type_field = f'email_{notification.notification_type}'
        if not getattr(preferences, type_field, True):
            return False
        
        # Récupérer le template
        template = NotificationTemplate.objects.filter(
            notification_type=notification.notification_type,
            is_active=True
        ).first()
        
        if template:
            subject = template.subject_template.format(**notification.data)
            body = template.email_body_template.format(**notification.data)
        else:
            subject = notification.title
            body = notification.message
        
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [notification.user.email],
            html_message=body,
            fail_silently=False
        )
        
        notification.email_sent = True
        notification.email_sent_at = timezone.now()
        notification.save()
        
        return True
    except Exception as e:
        notification.delivery_error = str(e)
        notification.retry_count += 1
        notification.save()
        return False


def send_sms_notification(notification, preferences):
    """Envoie une notification par SMS (intégration avec Twilio/AfricasTalking)"""
    try:
        # Vérifier si l'utilisateur a activé ce type de notification
        type_field = f'sms_{notification.notification_type}'
        if not getattr(preferences, type_field, False):
            return False
        
        # Vérifier si l'utilisateur a un numéro de téléphone
        if not notification.user.phone:
            return False
        
        # Intégration avec Twilio ou AfricasTalking
        # Pour l'instant, simulation
        # TODO: Intégrer Twilio ou AfricasTalking
        
        notification.sms_sent = True
        notification.sms_sent_at = timezone.now()
        notification.save()
        
        return True
    except Exception as e:
        notification.delivery_error = str(e)
        notification.retry_count += 1
        notification.save()
        return False


def send_push_notification(notification, preferences):
    """Envoie une notification push (intégration avec Firebase)"""
    try:
        # Vérifier si l'utilisateur a activé ce type de notification
        type_field = f'push_{notification.notification_type}'
        if not getattr(preferences, type_field, True):
            return False
        
        # Intégration avec Firebase Cloud Messaging
        # Pour l'instant, simulation
        # TODO: Intégrer Firebase Cloud Messaging
        
        notification.push_sent = True
        notification.push_sent_at = timezone.now()
        notification.save()
        
        return True
    except Exception as e:
        notification.delivery_error = str(e)
        notification.retry_count += 1
        notification.save()
        return False


def notify_booking_confirmed(booking):
    """Notification de confirmation de réservation"""
    notify_user(
        user=booking.guest,
        notification_type='booking_confirmed',
        title='Réservation confirmée',
        message=f'Votre réservation {booking.booking_number} a été confirmée.',
        data={
            'booking_number': booking.booking_number,
            'establishment_name': booking.establishment.name,
            'check_in_date': booking.check_in_date.isoformat(),
            'check_out_date': booking.check_out_date.isoformat(),
            'total_amount': str(booking.total_amount),
        },
        channel='email'
    )


def notify_booking_cancelled(booking, reason=''):
    """Notification d'annulation de réservation"""
    notify_user(
        user=booking.guest,
        notification_type='booking_cancelled',
        title='Réservation annulée',
        message=f'Votre réservation {booking.booking_number} a été annulée.',
        data={
            'booking_number': booking.booking_number,
            'reason': reason,
        },
        channel='email'
    )


def notify_payout_ready(payout):
    """Notification de virement prêt"""
    notify_user(
        user=payout.host,
        notification_type='payout_ready',
        title='Virement prêt',
        message=f'Votre virement de {payout.net_amount} XOF est prêt.',
        data={
            'amount': str(payout.net_amount),
            'period_start': payout.period_start.isoformat(),
            'period_end': payout.period_end.isoformat(),
        },
        channel='email'
    )


def notify_dispute_created(dispute):
    """Notification de création de litige"""
    # Notifier l'admin
    from apps.accounts.models import User
    admins = User.objects.filter(role__in=['moderator', 'superadmin'], is_active=True)
    
    for admin in admins:
        notify_user(
            user=admin,
            notification_type='dispute_created',
            title='Nouveau litige créé',
            message=f'Un nouveau litige a été créé pour la réservation {dispute.booking.booking_number}.',
            data={
                'dispute_id': str(dispute.id),
                'booking_number': dispute.booking.booking_number,
                'dispute_type': dispute.dispute_type,
            },
            channel='email'
        )


def notify_dispute_resolved(dispute):
    """Notification de résolution de litige"""
    notify_user(
        user=dispute.raised_by,
        notification_type='dispute_resolved',
        title='Litige résolu',
        message=f'Votre litige a été résolu: {dispute.resolution}',
        data={
            'dispute_id': str(dispute.id),
            'resolution': dispute.resolution,
        },
        channel='email'
    )
