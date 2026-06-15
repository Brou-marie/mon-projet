import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Amenity(models.Model):
    CATEGORY_CHOICES = [
        ('wifi', 'Wi-Fi'),
        ('parking', 'Parking'),
        ('pool', 'Piscine'),
        ('ac', 'Climatisation'),
        ('breakfast', 'Petit-déjeuner'),
        ('restaurant', 'Restaurant'),
        ('gym', 'Salle de sport'),
        ('spa', 'Spa'),
        ('security', 'Sécurité'),
        ('laundry', 'Laverie'),
        ('kitchen', 'Cuisine équipée'),
        ('tv', 'Télévision'),
        ('balcony', 'Balcon'),
        ('generator', 'Générateur'),
        ('bar', 'Bar'),
        ('conference', 'Salle de conférence'),
        ('airport_shuttle', 'Navette aéroport'),
        ('pet_friendly', 'Animaux acceptés'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    icon = models.CharField(max_length=50, blank=True, help_text="Nom d'icône (ex: fa-wifi)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'amenities'
        verbose_name_plural = 'amenities'
        ordering = ['category', 'name']

    def __str__(self):
        return self.name


class Establishment(models.Model):
    TYPE_CHOICES = [
        ('hotel', 'Hôtel'),
        ('residence', 'Résidence'),
        ('villa', 'Villa'),
        ('apartment', 'Appartement'),
        ('guesthouse', 'Maison d\'hôtes'),
        ('hostel', 'Auberge'),
    ]

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('active', 'Actif'),
        ('suspended', 'Suspendu'),
        ('rejected', 'Rejeté'),
    ]

    CANCELLATION_POLICY = [
        ('flexible', 'Flexible'),
        ('moderate', 'Modérée'),
        ('strict', 'Stricte'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='establishments',
        limit_choices_to={'role': 'host'}
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField()
    establishment_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    address = models.TextField()
    city = models.CharField(max_length=100, db_index=True)
    quarter = models.CharField(max_length=100, blank=True, db_index=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    check_in_time = models.TimeField(default='14:00')
    check_out_time = models.TimeField(default='11:00')
    cancellation_policy = models.CharField(max_length=10, choices=CANCELLATION_POLICY, default='moderate')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    requires_manual_validation = models.BooleanField(
        default=True,
        help_text="Si actif, l'hébergeur doit valider une réservation après le paiement.",
    )
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    review_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'establishments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['city', 'status']),
            models.Index(fields=['establishment_type', 'status']),
            models.Index(fields=['avg_rating']),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        if self.host_id and self.host.role != 'host':
            raise ValidationError({'host': "Un établissement doit appartenir à un hébergeur."})

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base = slugify(self.name)
            self.slug = base
            counter = 1
            while Establishment.objects.filter(slug=self.slug).exists():
                self.slug = f"{base}-{counter}"
                counter += 1
        super().save(*args, **kwargs)


class EstablishmentImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    establishment = models.ForeignKey(
        Establishment, on_delete=models.CASCADE, related_name='images'
    )
    image = models.ImageField(upload_to='establishments/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    display_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'establishment_images'
        ordering = ['display_order', 'created_at']

    def __str__(self):
        return f"Image {self.display_order} - {self.establishment.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_primary:
            EstablishmentImage.objects.filter(
                establishment=self.establishment, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)


class RoomType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    establishment = models.ForeignKey(
        Establishment, on_delete=models.CASCADE, related_name='room_types'
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    capacity_adults = models.PositiveSmallIntegerField(default=2)
    capacity_children = models.PositiveSmallIntegerField(default=0)
    base_price_per_night = models.DecimalField(max_digits=12, decimal_places=2)
    physical_room_count = models.PositiveSmallIntegerField(default=1, help_text="Nombre de chambres physiques de ce type")
    size_sqm = models.PositiveSmallIntegerField(blank=True, null=True)
    bed_type = models.CharField(max_length=50, blank=True)
    amenities = models.ManyToManyField(Amenity, blank=True, related_name='room_types')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'room_types'
        ordering = ['establishment', 'name']

    def __str__(self):
        return f"{self.name} - {self.establishment.name}"

    def clean(self):
        if self.physical_room_count < 1:
            raise ValidationError({'physical_room_count': "Le nombre de chambres doit être supérieur à zéro."})
        if self.base_price_per_night <= 0:
            raise ValidationError({'base_price_per_night': "Le tarif doit être supérieur à zéro."})


class RoomTypeImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_type = models.ForeignKey(
        RoomType, on_delete=models.CASCADE, related_name='images'
    )
    image = models.ImageField(upload_to='room_types/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    display_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'room_type_images'
        ordering = ['display_order']

    def __str__(self):
        return f"Image {self.display_order} - {self.room_type}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_primary:
            RoomTypeImage.objects.filter(
                room_type=self.room_type, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)


class RoomAvailability(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_type = models.ForeignKey(
        RoomType, on_delete=models.CASCADE, related_name='availabilities'
    )
    date = models.DateField(db_index=True)
    available_count = models.PositiveSmallIntegerField(default=0)
    is_manually_blocked = models.BooleanField(default=False)
    special_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'room_availabilities'
        unique_together = [['room_type', 'date']]
        ordering = ['room_type', 'date']
        indexes = [
            models.Index(fields=['date', 'available_count']),
        ]

    def __str__(self):
        return f"{self.room_type.name} - {self.date}"

    def clean(self):
        if self.room_type_id and self.available_count > self.room_type.physical_room_count:
            raise ValidationError({
                'available_count': "La disponibilité ne peut pas dépasser le nombre de chambres physiques."
            })
        if self.special_price is not None and self.special_price <= 0:
            raise ValidationError({'special_price': "Le tarif spécial doit être supérieur à zéro."})
