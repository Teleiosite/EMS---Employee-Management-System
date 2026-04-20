from rest_framework import serializers
from .models import Announcement, Tenant, AuditLog, ContactMessage


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'slug', 'is_active', 'subscription_tier', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ('created_by', 'tenant')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return None

    def create(self, validated_data):
        announcement = super().create(validated_data)
        
        # Dispatch background emails to all active employees
        from django.contrib.auth import get_user_model
        from ems_core.utils_email import send_email_in_background
        
        User = get_user_model()
        # Only email active users whose role is precisely 'EMPLOYEE'
        employee_emails = list(User.objects.filter(is_active=True, role='EMPLOYEE').values_list('email', flat=True))
        
        if employee_emails:
            subject = f"New Company Announcement: {announcement.title}"
            message = f"Hello Team,\n\nA new {announcement.priority.lower()}-priority announcement has been posted:\n\n{announcement.content}\n\nLog in to the EMS Dashboard to view more details.\n\nBest,\nHR Management"
            
            send_email_in_background(
                subject=subject,
                message=message,
                recipient_list=employee_emails
            )
            
        return announcement


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = '__all__'

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        return "System / Unknown"


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ('created_at',)
