from django.contrib import admin
from unfold.admin import ModelAdmin, StackedInline
from unfold.decorators import display

from .models import Review, ReviewResponse


REVIEW_STATUS_LABELS = {
    'published': 'success',
    'hidden': 'warning',
    'flagged': 'danger',
}


class ReviewResponseInline(StackedInline):
    model = ReviewResponse
    extra = 0
    autocomplete_fields = ('responder',)
    fields = ('responder', 'response_text', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Review)
class ReviewAdmin(ModelAdmin):
    list_display = (
        'establishment', 'reviewer', 'rating_overall',
        'status_badge', 'created_at',
    )
    list_filter = ('is_published', 'is_flagged', 'rating_overall')
    search_fields = ('establishment__name', 'reviewer__email', 'comment')
    autocomplete_fields = ('booking', 'reviewer', 'establishment')
    list_select_related = ('booking', 'reviewer', 'establishment')
    readonly_fields = ('created_at', 'updated_at')
    inlines = (ReviewResponseInline,)
    date_hierarchy = 'created_at'
    actions = ('publish_reviews', 'hide_reviews', 'flag_reviews')
    fieldsets = (
        ('Avis', {
            'fields': (
                'booking', 'reviewer', 'establishment',
                'comment', 'photos', 'is_published', 'is_flagged',
            ),
            'classes': ('tab',),
        }),
        ('Notes', {
            'fields': (
                'rating_overall', 'rating_cleanliness',
                'rating_communication', 'rating_location', 'rating_value',
            ),
            'classes': ('tab',),
        }),
        ('Traçabilité', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('tab',),
        }),
    )

    @display(description='Statut', label=REVIEW_STATUS_LABELS)
    def status_badge(self, obj):
        if obj.is_flagged:
            return ('flagged', 'Signalé')
        if obj.is_published:
            return ('published', 'Publié')
        return ('hidden', 'Masqué')

    def _update_reviews(self, request, queryset, *, is_published, is_flagged, message):
        changed = 0
        for review in queryset.select_related('establishment'):
            review.is_published = is_published
            review.is_flagged = is_flagged
            review.save(update_fields=('is_published', 'is_flagged', 'updated_at'))
            changed += 1
        self.message_user(request, f'{changed} avis {message}.')

    @admin.action(description='Publier et approuver les avis sélectionnés')
    def publish_reviews(self, request, queryset):
        self._update_reviews(
            request, queryset,
            is_published=True, is_flagged=False,
            message='publié(s)',
        )

    @admin.action(description='Masquer les avis sélectionnés')
    def hide_reviews(self, request, queryset):
        self._update_reviews(
            request, queryset,
            is_published=False, is_flagged=False,
            message='masqué(s)',
        )

    @admin.action(description='Signaler et masquer les avis sélectionnés')
    def flag_reviews(self, request, queryset):
        self._update_reviews(
            request, queryset,
            is_published=False, is_flagged=True,
            message='signalé(s)',
        )


@admin.register(ReviewResponse)
class ReviewResponseAdmin(ModelAdmin):
    list_display = ('review', 'responder', 'created_at')
    search_fields = ('review__comment', 'response_text', 'responder__email')
    autocomplete_fields = ('review', 'responder')
    readonly_fields = ('created_at',)
    list_select_related = ('review', 'review__establishment', 'responder')
