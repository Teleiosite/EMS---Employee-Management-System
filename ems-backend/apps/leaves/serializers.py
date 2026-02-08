from rest_framework import serializers

from .models import LeaveRequest, LeaveType


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = '__all__'

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        duration_days = attrs.get('duration_days')
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError('start_date must be before or equal to end_date.')
        if duration_days is not None and duration_days <= 0:
            raise serializers.ValidationError('duration_days must be greater than 0.')
        return attrs
