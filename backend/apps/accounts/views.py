from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, GuestProfile, HostProfile
from .serializers import (
    UserSerializer, UserRegistrationSerializer,
    GuestProfileSerializer, HostProfileSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data

        if user.role == 'guest' and hasattr(user, 'guest_profile'):
            data['profile'] = GuestProfileSerializer(user.guest_profile).data
        elif user.role == 'host' and hasattr(user, 'host_profile'):
            data['profile'] = HostProfileSerializer(user.host_profile).data

        return Response(data)

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class GuestProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = GuestProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.guest_profile


class HostProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = HostProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.host_profile
