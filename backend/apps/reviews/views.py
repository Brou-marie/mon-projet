from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Review, ReviewResponse
from .serializers import (
    ReviewSerializer, ReviewCreateSerializer,
    ReviewResponseSerializer, ReviewResponseCreateSerializer
)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    lookup_field = 'id'

    def get_queryset(self):
        queryset = Review.objects.filter(is_published=True)
        establishment_id = self.request.query_params.get('establishment')
        if establishment_id:
            queryset = queryset.filter(establishment_id=establishment_id)
        return queryset.select_related('reviewer', 'response')

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'flag']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def respond(self, request, id=None):
        review = self.get_object()
        serializer = ReviewResponseCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ReviewSerializer(review, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def flag(self, request, id=None):
        review = self.get_object()
        review.is_flagged = True
        review.is_published = False
        review.save()
        return Response(ReviewSerializer(review, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, id=None):
        review = self.get_object()
        review.is_flagged = False
        review.is_published = True
        review.save()
        return Response(ReviewSerializer(review, context={'request': request}).data)
