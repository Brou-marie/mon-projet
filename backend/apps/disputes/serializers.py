from rest_framework import serializers
from .models import Dispute, DisputeAttachment
from apps.accounts.serializers import UserSerializer


class DisputeAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = DisputeAttachment
        fields = ['id', 'file', 'description', 'file_type', 'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'file_type', 'created_at']


class DisputeSerializer(serializers.ModelSerializer):
    raised_by_name = serializers.CharField(source='raised_by.get_full_name', read_only=True)
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)
    establishment_name = serializers.CharField(source='booking.establishment.name', read_only=True)
    attachments = DisputeAttachmentSerializer(many=True, read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)
    escalated_to_name = serializers.CharField(source='escalated_to.get_full_name', read_only=True)
    
    class Meta:
        model = Dispute
        fields = [
            'id', 'booking', 'booking_number', 'establishment_name',
            'raised_by', 'raised_by_name', 'dispute_type', 'subject',
            'description', 'status', 'priority', 'resolution',
            'resolved_by', 'resolved_by_name', 'resolved_at',
            'escalated_to', 'escalated_to_name', 'escalated_at',
            'evidence', 'messages', 'compensation_amount',
            'compensation_type', 'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'raised_by', 'resolved_by', 'resolved_at',
            'escalated_to', 'escalated_at', 'created_at', 'updated_at'
        ]
    
    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Vous devez être connecté.")
        
        if self.instance:
            # Pour la mise à jour
            dispute = self.instance
            if dispute.status == 'resolved':
                raise serializers.ValidationError("Ce litige est déjà résolu.")
        else:
            # Pour la création
            booking = attrs.get('booking')
            if booking and booking.guest != request.user and booking.establishment.host != request.user:
                raise serializers.ValidationError("Vous ne pouvez créer un litige que pour vos propres réservations.")
        
        return attrs


class DisputeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = [
            'booking', 'dispute_type', 'subject', 'description', 'priority'
        ]
    
    def create(self, validated_data):
        request = self.context['request']
        validated_data['raised_by'] = request.user
        return super().create(validated_data)


class DisputeResolveSerializer(serializers.Serializer):
    resolution = serializers.CharField(required=True)
    compensation_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    compensation_type = serializers.CharField(max_length=50, required=False, allow_blank=True)
