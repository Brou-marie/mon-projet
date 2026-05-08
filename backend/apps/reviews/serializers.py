from rest_framework import serializers
from .models import Review, ReviewResponse


class ReviewResponseSerializer(serializers.ModelSerializer):
    responder_name = serializers.CharField(source='responder.get_full_name', read_only=True)

    class Meta:
        model = ReviewResponse
        fields = ('id', 'responder_name', 'response_text', 'created_at')


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    reviewer_avatar = serializers.ImageField(source='reviewer.avatar', read_only=True)
    response = ReviewResponseSerializer(read_only=True)
    can_review = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ('id', 'reviewer_name', 'reviewer_avatar', 'rating_overall',
                  'rating_cleanliness', 'rating_communication', 'rating_location',
                  'rating_value', 'comment', 'photos', 'response', 'is_published',
                  'created_at', 'can_review')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_can_review(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user == obj.reviewer
        return False


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('booking', 'rating_overall', 'rating_cleanliness',
                  'rating_communication', 'rating_location', 'rating_value',
                  'comment', 'photos')

    def validate(self, data):
        booking = data['booking']
        user = self.context['request'].user
        if booking.guest != user:
            raise serializers.ValidationError({"booking": "Vous ne pouvez pas aviser sur cette réservation."})
        if booking.status != 'completed':
            raise serializers.ValidationError({"booking": "Vous ne pouvez aviser qu'après un séjour terminé."})
        if hasattr(booking, 'review'):
            raise serializers.ValidationError({"booking": "Vous avez déjà laissé un avis pour cette réservation."})
        return data

    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        validated_data['establishment'] = validated_data['booking'].establishment
        return super().create(validated_data)


class ReviewResponseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewResponse
        fields = ('review', 'response_text')

    def validate(self, data):
        review = data['review']
        user = self.context['request'].user
        if review.establishment.host != user and not user.is_staff_user:
            raise serializers.ValidationError({"review": "Vous ne pouvez pas répondre à cet avis."})
        if hasattr(review, 'response'):
            raise serializers.ValidationError({"review": "Une réponse existe déjà."})
        return data

    def create(self, validated_data):
        validated_data['responder'] = self.context['request'].user
        return super().create(validated_data)
