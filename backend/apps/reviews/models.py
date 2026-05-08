import uuid
from django.db import models
from django.conf import settings
from django.db.models import Avg


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        'bookings.Booking', on_delete=models.CASCADE, related_name='review'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='reviews_written'
    )
    establishment = models.ForeignKey(
        'establishments.Establishment', on_delete=models.CASCADE,
        related_name='reviews'
    )
    rating_overall = models.PositiveSmallIntegerField()
    rating_cleanliness = models.PositiveSmallIntegerField(blank=True, null=True)
    rating_communication = models.PositiveSmallIntegerField(blank=True, null=True)
    rating_location = models.PositiveSmallIntegerField(blank=True, null=True)
    rating_value = models.PositiveSmallIntegerField(blank=True, null=True)
    comment = models.TextField()
    photos = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=True)
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']

    def __str__(self):
        return f"Avis {self.rating_overall}/5 - {self.establishment.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalculate establishment average
        avg = self.establishment.reviews.filter(is_published=True).aggregate(
            avg_rating=Avg('rating_overall')
        )['avg_rating'] or 0.00
        self.establishment.avg_rating = round(avg, 2)
        self.establishment.review_count = self.establishment.reviews.filter(is_published=True).count()
        self.establishment.save()


class ReviewResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.OneToOneField(
        Review, on_delete=models.CASCADE, related_name='response'
    )
    responder = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='review_responses'
    )
    response_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'review_responses'

    def __str__(self):
        return f"Réponse à l'avis de {self.review.reviewer.email}"
