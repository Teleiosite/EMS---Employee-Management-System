from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.employees.models import EmployeeProfile
from .models import LeaveBalance, LeavePolicyWindow, LeaveRequest, LeaveType


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'
        read_only_fields = ('tenant',)


class LeavePolicyWindowSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeavePolicyWindow
        fields = '__all__'
        read_only_fields = ('tenant',)


class LeaveBalanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)

    class Meta:
        model = LeaveBalance
        fields = '__all__'
        read_only_fields = ('tenant',)


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ('tenant',)

    def validate(self, attrs):
        attrs = super().validate(attrs)

        employee = attrs.get('employee') or getattr(self.instance, 'employee', None)
        if not employee and self.context.get('request'):
            request_user = self.context['request'].user
            employee = getattr(request_user, 'employee_profile', None)

        leave_type = attrs.get('leave_type') or getattr(self.instance, 'leave_type', None)
        start_date = attrs.get('start_date') or getattr(self.instance, 'start_date', None)
        end_date = attrs.get('end_date') or getattr(self.instance, 'end_date', None)

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({'end_date': 'End date cannot be before start date.'})

        if employee and leave_type and start_date and end_date:
            year = start_date.year
            duration_days = (end_date - start_date).days + 1
            attrs['duration_days'] = duration_days

            request = self.context.get('request')
            tenant = getattr(request, 'tenant', None) if request else None
            balance = LeaveBalance.objects.filter(
                tenant=tenant,
                employee=employee,
                leave_type=leave_type,
                year=year,
            ).first()
            if not balance:
                raise serializers.ValidationError(
                    {'leave_type': f'No leave balance configured for {leave_type.name} ({year}).'}
                )

            pending_or_approved = LeaveRequest.objects.filter(
                tenant=tenant,
                employee=employee,
                leave_type=leave_type,
                status__in=['PENDING', 'APPROVED'],
                start_date__year=year,
            )
            if self.instance:
                pending_or_approved = pending_or_approved.exclude(pk=self.instance.pk)

            already_applied_days = sum(float(req.duration_days) for req in pending_or_approved)
            remaining = float(balance.available_days) - float(balance.used_days) - already_applied_days

            if duration_days > remaining:
                raise serializers.ValidationError(
                    {'duration_days': f'Insufficient leave balance. Requested {duration_days} days, remaining {remaining:.1f} days.'}
                )

        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        previous_status = instance.status
        instance = super().update(instance, validated_data)

        if previous_status != 'APPROVED' and instance.status == 'APPROVED' and instance.leave_type:
            balance = LeaveBalance.objects.select_for_update().filter(
                tenant=instance.tenant,
                employee=instance.employee,
                leave_type=instance.leave_type,
                year=instance.start_date.year,
            ).first()
            if balance and Decimal(str(balance.available_days)) >= Decimal(str(instance.duration_days)):
                balance.available_days = Decimal(str(balance.available_days)) - Decimal(str(instance.duration_days))
                balance.used_days = Decimal(str(balance.used_days)) + Decimal(str(instance.duration_days))
                balance.save(update_fields=['available_days', 'used_days'])

        return instance
