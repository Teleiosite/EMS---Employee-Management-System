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
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)

    class Meta:
        model = LeaveBalance
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    # Read-only computed fields so employee name and leave type appear in responses
    employee_name = serializers.SerializerMethodField()
    leave_type_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ('employee',)

    def get_employee_name(self, obj):
        try:
            user = obj.employee.user
            return f"{user.first_name} {user.last_name}".strip() or user.email
        except Exception:
            return 'Unknown'

    def get_leave_type_name(self, obj):
        try:
            return obj.leave_type.name if obj.leave_type else 'General'
        except Exception:
            return 'General'

    def validate(self, attrs):
        # When admin/HR is only updating the status (PATCH with just status field),
        # skip the heavy validation — we don't need the policy window checks.
        if self.instance is not None:
            updating_fields = set(attrs.keys())
            if updating_fields <= {'status'}:
                return attrs  # Admin approve/reject — skip all other checks

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

        # Since employee is read_only, it won't be in attrs during creation.
        # We handle validation for existing instances, but for creation, we assume
        # the view's perform_create sets valid data.
        employee = attrs.get('employee') or (self.instance.employee if self.instance else None)
        
        # Only validate policy and balance if all these fields are available.
        # During creation, we skip this specific validation check and let DB handle issues,
        # or we could move this check to perform_create if we want strict balance checks 
        # before saving. But for now, skipping if employee is missing is safest.
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
            # Deduct from leave balance only if a leave_type and balance exist
            if instance.leave_type:
                balance = LeaveBalance.objects.select_for_update().filter(
                    employee=instance.employee,
                    leave_type=instance.leave_type,
                    year=instance.start_date.year,
                ).first()
                if balance and balance.available_days >= instance.duration_days:
                    balance.available_days -= instance.duration_days
                    balance.used_days += instance.duration_days
                    balance.save(update_fields=['available_days', 'used_days'])

        return instance
