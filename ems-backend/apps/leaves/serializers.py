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
        request = self.context.get('request')
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        duration_days = attrs.get('duration_days')
        leave_type = attrs.get('leave_type')
        employee = attrs.get('employee')

        if request and request.method == 'POST' and getattr(request.user, 'role', None) not in {'ADMIN', 'HR_MANAGER'}:
            if employee and employee.user_id != request.user.id:
                raise serializers.ValidationError('Employees can only submit leave requests for themselves.')

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError('start_date must be before or equal to end_date.')
        if duration_days is not None and duration_days <= 0:
            raise serializers.ValidationError('duration_days must be greater than 0.')

        if start_date and end_date and duration_days is not None:
            calendar_days = (end_date - start_date).days + 1
            expected_business_days = business_days(start_date, end_date)
            max_allowed_days = max(calendar_days, expected_business_days)
            if float(duration_days) > float(max_allowed_days):
                raise serializers.ValidationError('duration_days cannot exceed days in the selected window.')

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
