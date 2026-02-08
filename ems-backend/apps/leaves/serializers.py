from django.db import transaction
from rest_framework import serializers

from .models import LeaveBalance, LeavePolicyWindow, LeaveRequest, LeaveType
from .utils import business_days


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'


class LeavePolicyWindowSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeavePolicyWindow
        fields = '__all__'


class LeaveBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveBalance
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = '__all__'

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        duration_days = attrs.get('duration_days')
        leave_type = attrs.get('leave_type')

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError('start_date must be before or equal to end_date.')
        if duration_days is not None and duration_days <= 0:
            raise serializers.ValidationError('duration_days must be greater than 0.')

        if start_date and end_date and duration_days is not None:
            expected_duration = business_days(start_date, end_date)
            if float(duration_days) > float(expected_duration):
                raise serializers.ValidationError('duration_days cannot exceed business days in the selected window.')

        employee = attrs.get('employee')
        if leave_type and employee and start_date and end_date:
            has_policy = LeavePolicyWindow.objects.filter(
                leave_type=leave_type,
                start_date__lte=start_date,
                end_date__gte=end_date,
            ).exists()
            if not has_policy:
                raise serializers.ValidationError('No active leave policy window for this request.')

            balance = LeaveBalance.objects.filter(
                employee=employee,
                leave_type=leave_type,
                year=start_date.year,
            ).first()
            if not balance or balance.available_days < duration_days:
                raise serializers.ValidationError('Insufficient leave balance for this leave type.')

        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        previous_status = instance.status
        instance = super().update(instance, validated_data)

        if previous_status != 'APPROVED' and instance.status == 'APPROVED':
            balance = LeaveBalance.objects.select_for_update().filter(
                employee=instance.employee,
                leave_type=instance.leave_type,
                year=instance.start_date.year,
            ).first()
            if not balance or balance.available_days < instance.duration_days:
                raise serializers.ValidationError('Insufficient leave balance for approval.')
            balance.available_days -= instance.duration_days
            balance.used_days += instance.duration_days
            balance.save(update_fields=['available_days', 'used_days'])

        return instance
