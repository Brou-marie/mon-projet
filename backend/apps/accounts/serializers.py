from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, GuestProfile, HostProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'role',
                  'avatar', 'is_email_verified', 'is_phone_verified', 'created_at')
        read_only_fields = ('id', 'role', 'is_email_verified', 'is_phone_verified', 'created_at')


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            role=validated_data['role'],
        )
        user.set_password(validated_data['password'])
        user.save()

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
