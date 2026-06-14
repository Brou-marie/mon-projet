"""
Services pour la gestion du programme de fidélité
"""
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import GuestProfile, User


class LoyaltyTier:
    """Définition des niveaux de fidélité"""
    BRONZE = 'bronze'
    SILVER = 'silver'
    GOLD = 'gold'
    PLATINUM = 'platinum'
    
    TIERS = {
        BRONZE: {'points_required': 0, 'discount_percent': 0, 'benefits': ['Accès aux offres spéciales']},
        SILVER: {'points_required': 1000, 'discount_percent': 5, 'benefits': ['5% de réduction', 'Support prioritaire']},
        GOLD: {'points_required': 5000, 'discount_percent': 10, 'benefits': ['10% de réduction', 'Check-in prioritaire', 'Petit-déjeuner gratuit']},
        PLATINUM: {'points_required': 15000, 'discount_percent': 15, 'benefits': ['15% de réduction', 'Suite upgrade', 'Conciergerie 24/7', 'Annulation gratuite']},
    }
    
    @classmethod
    def get_tier(cls, points):
        """Détermine le niveau de fidélité basé sur les points"""
        if points >= cls.TIERS[cls.PLATINUM]['points_required']:
            return cls.PLATINUM
        elif points >= cls.TIERS[cls.GOLD]['points_required']:
            return cls.GOLD
        elif points >= cls.TIERS[cls.SILVER]['points_required']:
            return cls.SILVER
        else:
            return cls.BRONZE


def calculate_points_for_booking(booking):
    """Calcule les points de fidélité pour une réservation"""
    # 1 point par 100 XOF dépensés
    points = int(booking.total_amount / 100)
    
    # Bonus pour les réservations longues (plus de 7 nuits)
    nights = (booking.check_out_date - booking.check_in_date).days
    if nights >= 7:
        points += int(points * 0.1)  # 10% de bonus
    
    # Bonus pour les réservations de haute valeur (plus de 100000 XOF)
    if booking.total_amount >= 100000:
        points += int(points * 0.15)  # 15% de bonus
    
    return points


@transaction.atomic
def add_loyalty_points(user, points, reason='', booking=None):
    """
    Ajoute des points de fidélité à un utilisateur
    """
    if user.role != 'guest':
        return None
    
    profile, _ = GuestProfile.objects.get_or_create(user=user)
    
    # Ajouter les points
    profile.loyalty_points += points
    profile.save(update_fields=['loyalty_points', 'updated_at'])
    
    # Enregistrer l'historique des points (optionnel - à implémenter avec un modèle séparé)
    
    # Vérifier si l'utilisateur a changé de niveau
    current_tier = LoyaltyTier.get_tier(profile.loyalty_points)
    
    return {
        'points_added': points,
        'total_points': profile.loyalty_points,
        'current_tier': current_tier,
        'tier_benefits': LoyaltyTier.TIERS[current_tier]['benefits'],
        'discount_percent': LoyaltyTier.TIERS[current_tier]['discount_percent'],
    }


@transaction.atomic
def redeem_loyalty_points(user, points, reason=''):
    """
    Échange des points de fidélité contre des avantages
    """
    if user.role != 'guest':
        return None
    
    profile = GuestProfile.objects.get(user=user)
    
    if profile.loyalty_points < points:
        return {
            'success': False,
            'message': 'Points insuffisants',
            'available_points': profile.loyalty_points,
            'requested_points': points,
        }
    
    # Déduire les points
    profile.loyalty_points -= points
    profile.save(update_fields=['loyalty_points', 'updated_at'])
    
    # Vérifier le nouveau niveau
    current_tier = LoyaltyTier.get_tier(profile.loyalty_points)
    
    return {
        'success': True,
        'points_redeemed': points,
        'remaining_points': profile.loyalty_points,
        'current_tier': current_tier,
    }


def get_loyalty_discount(user, total_amount):
    """
    Calcule la réduction de fidélité applicable
    """
    if user.role != 'guest':
        return 0
    
    try:
        profile = user.guest_profile
    except GuestProfile.DoesNotExist:
        return 0
    
    tier = LoyaltyTier.get_tier(profile.loyalty_points)
    discount_percent = LoyaltyTier.TIERS[tier]['discount_percent']
    
    return (total_amount * Decimal(discount_percent)) / Decimal('100')


def get_user_loyalty_info(user):
    """
    Récupère les informations complètes de fidélité d'un utilisateur
    """
    if user.role != 'guest':
        return None
    
    try:
        profile = user.guest_profile
    except GuestProfile.DoesNotExist:
        profile = GuestProfile.objects.create(user=user)
    
    current_tier = LoyaltyTier.get_tier(profile.loyalty_points)
    tier_info = LoyaltyTier.TIERS[current_tier]
    
    # Calculer les points nécessaires pour le niveau suivant
    tiers_ordered = ['bronze', 'silver', 'gold', 'platinum']
    current_index = tiers_ordered.index(current_tier)
    
    if current_index < len(tiers_ordered) - 1:
        next_tier = tiers_ordered[current_index + 1]
        points_to_next = LoyaltyTier.TIERS[next_tier]['points_required'] - profile.loyalty_points
    else:
        next_tier = None
        points_to_next = 0
    
    return {
        'total_points': profile.loyalty_points,
        'current_tier': current_tier,
        'tier_benefits': tier_info['benefits'],
        'discount_percent': tier_info['discount_percent'],
        'next_tier': next_tier,
        'points_to_next_tier': points_to_next,
        'tier_progress': {
            'bronze': profile.loyalty_points >= LoyaltyTier.TIERS['bronze']['points_required'],
            'silver': profile.loyalty_points >= LoyaltyTier.TIERS['silver']['points_required'],
            'gold': profile.loyalty_points >= LoyaltyTier.TIERS['gold']['points_required'],
            'platinum': profile.loyalty_points >= LoyaltyTier.TIERS['platinum']['points_required'],
        }
    }


def process_booking_completion(booking):
    """
    Traite l'achèvement d'une réservation pour ajouter les points de fidélité
    """
    if booking.guest.role != 'guest':
        return None
    
    points = calculate_points_for_booking(booking)
    result = add_loyalty_points(
        booking.guest,
        points,
        reason=f'Réservation {booking.booking_number} complétée',
        booking=booking
    )
    
    # Notifier l'utilisateur
    from apps.notifications.services import notify_user
    notify_user(
        booking.guest,
        'system',
        'Points de fidélité gagnés',
        f'Vous avez gagné {points} points pour votre réservation {booking.booking_number}!',
        {
            'points_earned': points,
            'total_points': result['total_points'],
            'current_tier': result['current_tier'],
        }
    )
    
    return result
