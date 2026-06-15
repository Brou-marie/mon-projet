from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings

from apps.establishments.models import RoomAvailability
from apps.payments.models import CommissionSetting

from .models import Booking, BookingStatusHistory


def booking_nights(check_in, check_out):
    return [
        check_in + timedelta(days=offset)
        for offset in range((check_out - check_in).days)
    ]


def commission_percent_for(establishment):
    host_profile = getattr(establishment.host, 'host_profile', None)
    if host_profile and host_profile.commission_override_percent is not None:
        return Decimal(str(host_profile.commission_override_percent))

    host_setting = CommissionSetting.objects.filter(
        host=establishment.host,
        is_active=True,
        effective_from__lte=date.today(),
    ).order_by('-effective_from').first()
    if host_setting:
        return Decimal(str(host_setting.commission_percent))

    return Decimal(str(getattr(settings, 'DEFAULT_PLATFORM_COMMISSION_PERCENT', 15)))


def quote_room_type(room_type, check_in, check_out, lock=False):
    nights = booking_nights(check_in, check_out)
    queryset = RoomAvailability.objects.filter(room_type=room_type, date__in=nights)
    if lock:
        queryset = queryset.select_for_update()

    availability_by_date = {availability.date: availability for availability in queryset}
    unavailable_dates = []
    subtotal = Decimal('0.00')
    price_breakdown = {}

    for night in nights:
        availability = availability_by_date.get(night)
        if not availability or availability.is_manually_blocked or availability.available_count <= 0:
            unavailable_dates.append(night)
            continue

        nightly_price = availability.special_price or room_type.base_price_per_night
        nightly_price = Decimal(str(nightly_price))
        subtotal += nightly_price
        price_breakdown[str(night)] = str(nightly_price)

    commission_percent = commission_percent_for(room_type.establishment)
    platform_fee = (subtotal * commission_percent / Decimal('100')).quantize(Decimal('0.01'))
    tax_amount = Decimal('0.00')
    total_amount = subtotal + platform_fee + tax_amount

    return {
        'available': not unavailable_dates,
        'unavailable_dates': unavailable_dates,
        'total_nights': len(nights),
        'price_breakdown': price_breakdown,
        'subtotal': subtotal,
        'platform_fee': platform_fee,
        'tax_amount': tax_amount,
        'total_amount': total_amount,
        'commission_amount': platform_fee,
        'host_payout': subtotal - platform_fee,
    }


def decrement_availability(room_type, nights):
    from django.db.models import Q
    from .models import Booking
    
    availability_by_date = {
        availability.date: availability
        for availability in RoomAvailability.objects.select_for_update().filter(
            room_type=room_type,
            date__in=nights,
        )
    }

    # Vérifier les réservations actives pour ces dates
    active_statuses = [Booking.CONFIRMED, Booking.IN_PROGRESS]
    conflicting_bookings = Booking.objects.filter(
        room_type=room_type,
        status__in=active_statuses,
    ).filter(
        # Chevauchement de dates
        Q(check_in_date__lt=max(nights)) & Q(check_out_date__gt=min(nights))
    )
    
    if conflicting_bookings.exists():
        return False

    for night in nights:
        availability = availability_by_date.get(night)
        if not availability or availability.is_manually_blocked or availability.available_count <= 0:
            return False

    for night in nights:
        availability = availability_by_date[night]
        availability.available_count = max(0, availability.available_count - 1)
        availability.save(update_fields=('available_count', 'updated_at'))

    return True


def restore_availability(booking):
    for night in booking_nights(booking.check_in_date, booking.check_out_date):
        availability = RoomAvailability.objects.filter(
            room_type=booking.room_type,
            date=night,
        ).first()
        if availability:
            availability.available_count = min(
                availability.available_count + 1,
                booking.room_type.physical_room_count,
            )
            availability.save(update_fields=('available_count', 'updated_at'))


def record_status(booking, status_value, changed_by=None, note=''):
    BookingStatusHistory.objects.create(
        booking=booking,
        status=status_value,
        changed_by=changed_by,
        note=note,
    )


def set_booking_status(booking, status_value, changed_by=None, note=''):
    booking.status = status_value
    booking.save(update_fields=('status', 'updated_at'))
    record_status(booking, status_value, changed_by=changed_by, note=note)
    return booking
