from rest_framework import generics, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import User, GuestProfile, HostProfile
from .serializers import (
    UserSerializer, UserRegistrationSerializer,
    GuestProfileSerializer, HostProfileSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        # Retourner les données utilisateur après inscription
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    """
    Blackliste le refresh token pour invalider la session côté serveur.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {"detail": "Le refresh token est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            # Token déjà expiré ou invalide — on considère ça comme un logout réussi
            pass
        return Response({"detail": "Déconnexion réussie."}, status=status.HTTP_200_OK)


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

    def patch(self, request):
        return self.put(request)


class GuestProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = GuestProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.role != 'guest':
            raise PermissionDenied("Ce profil est reserve aux voyageurs.")
        profile, _ = GuestProfile.objects.get_or_create(user=self.request.user)
        return profile


class HostProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = HostProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.role != 'host':
            raise PermissionDenied("Ce profil est reserve aux hebergeurs.")
        profile, _ = HostProfile.objects.get_or_create(user=self.request.user)
        return profile
