from django.contrib import admin
from .models import Review, ReviewResponse


class ReviewResponseInline(admin.StackedInline):
    model = ReviewResponse
    extra = 0


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('establishment', 'reviewer', 'rating_overall', 'is_published', 'is_flagged', 'created_at')
    list_filter = ('is_published', 'is_flagged', 'rating_overall')
    search_fields = ('establishment__name', 'reviewer__email', 'comment')
    inlines = [ReviewResponseInline]
    date_hierarchy = 'created_at'


@admin.register(ReviewResponse)
class ReviewResponseAdmin(admin.ModelAdmin):
    list_display = ('review', 'responder', 'created_at')
    search_fields = ('review__comment', 'response_text')
