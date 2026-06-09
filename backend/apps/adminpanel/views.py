from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import HostProfile, User
from apps.bookings.models import Booking
from apps.establishments.models import Establishment
from apps.payments.models import Payment
from .permissions import IsNoamHomeAdmin
from .serializers import (
    AdminBookingSerializer,
    AdminEstablishmentSerializer,
    AdminHostProfileSerializer,
    AdminPaymentSerializer,
    AdminUserSerializer,
)


class AdminOverviewView(APIView):
    permission_classes = [IsNoamHomeAdmin]

    def get(self, request):
        start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        paid_payments = Payment.objects.filter(status='succeeded')
        confirmed_bookings = Booking.objects.filter(
            status__in=['confirmed', 'in_progress', 'completed']
        )

        role_counts = {
            item['role']: item['total']
            for item in User.objects.values('role').annotate(total=Count('id'))
        }

        recent_bookings = Booking.objects.select_related(
            'guest', 'establishment', 'room_type'
        ).order_by('-created_at')[:6]
        pending_establishments = Establishment.objects.select_related('host').filter(
            status='pending'
        ).order_by('-created_at')[:6]
        pending_hosts = HostProfile.objects.select_related('user').filter(
            verification_status__in=['pending', 'under_review']
        ).order_by('-created_at')[:6]

        data = {
            'project': 'NoamHome',
            'generated_at': timezone.now(),
            'stats': {
                'users_total': User.objects.count(),
                'guests_total': role_counts.get('guest', 0),
                'hosts_total': role_counts.get('host', 0),
                'admins_total': role_counts.get('moderator', 0) + role_counts.get('superadmin', 0),
                'hosts_pending': HostProfile.objects.filter(
                    verification_status__in=['pending', 'under_review']
                ).count(),
                'establishments_total': Establishment.objects.count(),
                'establishments_active': Establishment.objects.filter(status='active').count(),
                'establishments_pending': Establishment.objects.filter(status='pending').count(),
                'bookings_total': Booking.objects.count(),
                'bookings_confirmed': confirmed_bookings.count(),
                'payments_succeeded': paid_payments.count(),
                'payments_pending': Payment.objects.filter(status__in=['pending', 'processing']).count(),
                'revenue_total': paid_payments.aggregate(total=Sum('amount'))['total'] or 0,
                'revenue_month': paid_payments.filter(
                    paid_at__gte=start_of_month
                ).aggregate(total=Sum('amount'))['total'] or 0,
                'commission_total': confirmed_bookings.aggregate(
                    total=Sum('commission_amount')
                )['total'] or 0,
            },
            'recent_bookings': AdminBookingSerializer(recent_bookings, many=True).data,
            'pending_establishments': AdminEstablishmentSerializer(pending_establishments, many=True).data,
            'pending_hosts': AdminHostProfileSerializer(pending_hosts, many=True).data,
        }
        return Response(data)


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsNoamHomeAdmin]

    def get_queryset(self):
        queryset = User.objects.all().order_by('-created_at')
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        is_active = self.request.query_params.get('is_active')

        if role:
            queryset = queryset.filter(role=role)
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone__icontains=search)
            )
        return queryset


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsNoamHomeAdmin]
    lookup_field = 'id'


class AdminHostProfileListView(generics.ListAPIView):
    serializer_class = AdminHostProfileSerializer
    permission_classes = [IsNoamHomeAdmin]

    def get_queryset(self):
        queryset = HostProfile.objects.select_related('user').order_by('-created_at')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if status:
            queryset = queryset.filter(verification_status=status)
        if search:
            queryset = queryset.filter(
                Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(company_name__icontains=search)
            )
        return queryset


class AdminHostProfileDetailView(generics.RetrieveUpdateAPIView):
    queryset = HostProfile.objects.select_related('user').all()
    serializer_class = AdminHostProfileSerializer
    permission_classes = [IsNoamHomeAdmin]
    lookup_field = 'id'


class AdminEstablishmentListView(generics.ListAPIView):
    serializer_class = AdminEstablishmentSerializer
    permission_classes = [IsNoamHomeAdmin]

    def get_queryset(self):
        queryset = Establishment.objects.select_related('host').prefetch_related(
            'room_types'
        ).order_by('-created_at')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if status:
            queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(city__icontains=search)
                | Q(quarter__icontains=search)
                | Q(host__email__icontains=search)
            )
        return queryset


class AdminEstablishmentDetailView(generics.RetrieveUpdateAPIView):
    queryset = Establishment.objects.select_related('host').prefetch_related('room_types').all()
    serializer_class = AdminEstablishmentSerializer
    permission_classes = [IsNoamHomeAdmin]
    lookup_field = 'id'


class AdminBookingListView(generics.ListAPIView):
    serializer_class = AdminBookingSerializer
    permission_classes = [IsNoamHomeAdmin]

    def get_queryset(self):
        queryset = Booking.objects.select_related(
            'guest', 'establishment', 'room_type'
        ).order_by('-created_at')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if status:
            queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(
                Q(booking_number__icontains=search)
                | Q(guest__email__icontains=search)
                | Q(establishment__name__icontains=search)
            )
        return queryset


class AdminPaymentListView(generics.ListAPIView):
    serializer_class = AdminPaymentSerializer
    permission_classes = [IsNoamHomeAdmin]

    def get_queryset(self):
        queryset = Payment.objects.select_related(
            'booking', 'booking__guest', 'booking__establishment'
        ).order_by('-created_at')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if status:
            queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(
                Q(booking__booking_number__icontains=search)
                | Q(booking__guest__email__icontains=search)
                | Q(provider_reference__icontains=search)
            )
        return queryset
