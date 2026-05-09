import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Manager personnalisé : utilise l'email comme identifiant unique."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'superadmin')

        if not extra_fields.get('is_staff'):
            raise ValueError("Un superuser doit avoir is_staff=True.")
        if not extra_fields.get('is_superuser'):
            raise ValueError("Un superuser doit avoir is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = [
        ('guest', 'Voyageur'),
        ('host', 'Hébergeur'),
        ('moderator', 'Modérateur'),
        ('superadmin', 'Super Administrateur'),
    ]

    username = None
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='guest')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_host(self):
        return self.role == 'host'

    @property
    def is_guest(self):
        return self.role == 'guest'

    @property
    def is_staff_user(self):
        return self.role in ('moderator', 'superadmin')


class GuestProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='guest_profile'
    )
    id_document = models.FileField(upload_to='documents/guest/', blank=True, null=True)
    preferences = models.JSONField(default=dict, blank=True)
    loyalty_points = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guest_profiles'

    def __str__(self):
        return f"Profil Voyageur: {self.user.email}"


class HostProfile(models.Model):
    VERIFICATION_STATUS = [
        ('pending', 'En attente'),
        ('under_review', 'En cours de vérification'),
        ('verified', 'Vérifié'),
        ('rejected', 'Rejeté'),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='host_profile'
    )
    company_name = models.CharField(max_length=200, blank=True)
    business_registration = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    description = models.TextField(blank=True)
    bank_account_name = models.CharField(max_length=200, blank=True)
    bank_account_number = models.CharField(max_length=100, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    swift_code = models.CharField(max_length=20, blank=True)
    verification_status = models.CharField(
        max_length=20, choices=VERIFICATION_STATUS, default='pending'
    )
    is_verified = models.BooleanField(default=False)
    id_document = models.FileField(upload_to='documents/host/', blank=True, null=True)
    commission_override_percent = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'host_profiles'

    def __str__(self):
        return f"Profil Hébergeur: {self.user.email}"
