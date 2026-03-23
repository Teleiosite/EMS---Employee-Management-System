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
    leave_type_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveBalance
        fields = '__all__'
        read_only_fields = ('tenant',)

    def get_leave_type_name(self, obj):
        return obj.leave_type.name if obj.leave_type else 'General'



class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    leave_type_name = serializers.SerializerMethodField()
    
    # Allow passing name directly for "Open" leave types
    leave_type_name_input = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ('tenant', 'duration_days')
        extra_kwargs = {
            'leave_type': {'required': False},
            'employee': {'required': False},
            'duration_days': {'required': False}
        }

    def get_leave_type_name(self, obj):
        return obj.leave_type.name if obj.leave_type else 'General'


    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get('request')
        tenant = resolve_tenant(request) if request else None

        employee = attrs.get('employee') or getattr(self.instance, 'employee', None)
        if not employee and request:
            employee = getattr(request.user, 'employee_profile', None)
            attrs['employee'] = employee

        # Resolve leave_type from name input if provided
        leave_name = attrs.pop('leave_type_name_input', None)
        leave_type = attrs.get('leave_type')

        if leave_name and tenant:
            leave_type, _ = LeaveType.objects.get_or_create(
                tenant=tenant,
                name=leave_name,
                defaults={'max_days_per_year': 30} # Default 30 days for new types
            )
            attrs['leave_type'] = leave_type
        
        if not leave_type:
            leave_type = getattr(self.instance, 'leave_type', None)

        start_date = attrs.get('start_date') or getattr(self.instance, 'start_date', None)
        end_date = attrs.get('end_date') or getattr(self.instance, 'end_date', None)

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({'end_date': 'End date cannot be before start date.'})

        if employee and leave_type and start_date and end_date:
            year = start_date.year
            duration_days = (end_date - start_date).days + 1
            attrs['duration_days'] = duration_days

            # Auto-initialize balance if missing
            balance, created = LeaveBalance.objects.get_or_create(
                tenant=tenant,
                employee=employee,
                leave_type=leave_type,
                year=year,
                defaults={
                    'available_days': Decimal(str(leave_type.max_days_per_year)),
                    'used_days': Decimal('0.0')
                }
            )

            # NOTE: We are NOT blocking the request if balance is insufficient
            # per user request for "Open" leave management.
            # We just track it.
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

            # Just add a warning field or info if we wanted, but for now we just allow it.
            # if duration_days > remaining:
            #     pass 

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

        # Dispatch background email on approval or rejection
        if previous_status == 'PENDING' and instance.status in ['APPROVED', 'REJECTED']:
            from ems_core.utils_email import send_email_in_background
            
            user = instance.employee.user
            subject = f"Leave Request {instance.status.title()}"
            
            leave_name = instance.leave_type.name if instance.leave_type else 'General'
            message = f"Hello {user.first_name},\n\nYour recent leave request has been marked as **{instance.status}**.\n\n"
            message += f"Details:\n"
            message += f"Leave Type: {leave_name}\n"
            message += f"Duration: {instance.start_date} to {instance.end_date} ({instance.duration_days} days)\n"
            
            if instance.hr_notes:
                message += f"\nHR Notes:\n{instance.hr_notes}\n"
                
            message += "\nLog in to the EMS Dashboard for full details regarding your leave balance.\n\nBest,\nHR Management"
            
            send_email_in_background(
                subject=subject,
                message=message,
                recipient_list=[user.email]
            )

        return instance
