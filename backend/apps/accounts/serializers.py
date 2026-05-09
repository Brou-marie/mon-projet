from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, GuestProfile, HostProfile


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'avatar', 'is_email_verified',
            'is_phone_verified', 'created_at',
        )
        read_only_fields = (
            'id', 'role', 'is_email_verified', 'is_phone_verified', 'created_at',
        )

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=True)

    class Meta:
        model = User
        fields = (
            'email', 'first_name', 'last_name', 'phone',
            'password', 'password_confirm', 'role',
        )

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte avec cet email existe déjà.")
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError(
                {"password_confirm": "Les mots de passe ne correspondent pas."}
            )
        return attrs

    def create(self, validated_data):
        # create_user gère correctement le hachage du mot de passe
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            role=validated_data['role'],
        )

        if user.role == 'guest':
            GuestProfile.objects.create(user=user)
        elif user.role == 'host':
            HostProfile.objects.create(user=user)

        return user


class GuestProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestProfile
        fields = '__all__'
        read_only_fields = ('user', 'loyalty_points', 'created_at')


class HostProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostProfile
        fields = '__all__'
        read_only_fields = ('user', 'verification_status', 'is_verified', 'created_at')


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Étend le serializer JWT par défaut pour inclure les données
    utilisateur directement dans la réponse de login.
    """

    def validate(self, attrs):
        data = super().validate(attrs)

        # Ajouter les infos utilisateur à la réponse
        user_data = UserSerializer(self.user).data
        if self.user.role == 'guest' and hasattr(self.user, 'guest_profile'):
            user_data['profile'] = GuestProfileSerializer(self.user.guest_profile).data
        elif self.user.role == 'host' and hasattr(self.user, 'host_profile'):
            user_data['profile'] = HostProfileSerializer(self.user.host_profile).data

        data['user'] = user_data
        return data
