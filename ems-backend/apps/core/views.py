from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated, BasePermission, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Announcement, Tenant, InviteCode, AuditLog, ContactMessage
from .tenancy import resolve_tenant
from .permissions import IsAdminOrHRManager, HasEnterpriseTier
from .serializers import (
    AnnouncementSerializer, TenantSerializer, AuditLogSerializer, 
    ContactMessageSerializer
)
from .utils import increment_feature_usage
from rest_framework import generics, throttling
from ems_core.utils_email import send_email_in_background

User = get_user_model()


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({'status': 'ok'})


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        tenant = resolve_tenant(self.request)
        if not user.is_superuser and not tenant:
            return Announcement.objects.none()
        return Announcement.objects.filter(tenant=tenant)

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAdminOrHRManager()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, tenant=resolve_tenant(self.request))


class IsSuperUser(BasePermission):
    """Allows access only to superusers."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class HostStatsView(APIView):
    """Platform owner super-admin dashboard statistics."""
    permission_classes = [IsSuperUser]

    def get(self, request):
        tenants = Tenant.objects.annotate(user_count=Count('users')).order_by('-created_at')
        total_users = User.objects.count()
        active_tenants = tenants.filter(is_active=True).count()

        tenant_data = []
        for t in tenants:
            from apps.recruitment.models import AISettings
            ai_settings = AISettings.get_settings(t)

            tenant_data.append({
                'id': t.id,
                'name': t.name,
                'slug': t.slug,
                'is_active': t.is_active,
                'subscription_tier': t.subscription_tier,
                'created_at': t.created_at,
                'user_count': t.user_count,
                'ai_usage_count': ai_settings.resume_parse_count,
            })

        return Response({
            'total_tenants': tenants.count(),
            'active_tenants': active_tenants,
            'total_users': total_users,
            'recent_signups': tenant_data,
        })


class HostTenantViewSet(mixins.ListModelMixin,
                        mixins.RetrieveModelMixin,
                        mixins.UpdateModelMixin,
                        viewsets.GenericViewSet):
    """ViewSet for SuperUsers to manage tenants."""
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsSuperUser]
    lookup_field = 'id'


class HostInviteCodeViewSet(viewsets.GenericViewSet):
    """Manage one-time invite codes for company registration."""
    permission_classes = [IsSuperUser]

    def list(self, request):
        codes = InviteCode.objects.select_related('used_by', 'created_by').all()
        data = [
            {
                'id': c.id,
                'code': c.code,
                'label': c.label,
                'is_used': c.is_used,
                'used_by': c.used_by.name if c.used_by else None,
                'used_at': c.used_at,
                'created_at': c.created_at,
            }
            for c in codes
        ]
        return Response(data)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        label = request.data.get('label', '')
        invite = InviteCode.generate(created_by=request.user, label=label)
        return Response({
            'id': invite.id,
            'code': invite.code,
            'label': invite.label,
            'created_at': invite.created_at,
        }, status=201)

    @action(detail=True, methods=['delete'], url_path='revoke')
    def revoke(self, request, pk=None):
        try:
            invite = InviteCode.objects.get(pk=pk, is_used=False)
            invite.delete()
            return Response({'detail': 'Invite code revoked.'})
        except InviteCode.DoesNotExist:
            return Response({'detail': 'Code not found or already used.'}, status=404)


class AuditLogListView(APIView):
    """Admin-only view to see mutation history for the current tenant."""
    permission_classes = [IsAdminOrHRManager, HasEnterpriseTier]
    feature_key = 'audit_logs'

    def get(self, request):
        tenant = resolve_tenant(request)
        if not tenant:
            return Response({'detail': 'Tenant context required.'}, status=400)
            
        increment_feature_usage(self.request, self.feature_key)
            
        logs = AuditLog.objects.filter(tenant=tenant).select_related('user').order_by('-created_at')[:500] 
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


class ContactMessageThrottle(throttling.AnonRateThrottle):
    rate = '5/hour'


class ContactMessageCreateView(generics.CreateAPIView):
    """Public view to accept contact form submissions."""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ContactMessageThrottle]

    def perform_create(self, serializer):
        msg = serializer.save()
        
        # Send email notification to admin
        subject = f"New Contact Form Submission: {msg.name}"
        body = (
            f"You have a new message from the HireWix Landing Page:\n\n"
            f"Name: {msg.name}\n"
            f"Email: {msg.email}\n"
            f"Phone: {msg.phone or 'N/A'}\n"
            f"Company: {msg.company or 'N/A'}\n\n"
            f"Message:\n{msg.message}\n\n"
            f"This message has been saved to the database."
        )
        # In a real scenario, we might want to send this to a specific admin list.
        # For now, we'll send it to the DEFAULT_FROM_EMAIL which acts as the system admin.
        from django.conf import settings
        send_email_in_background(
            subject=subject,
            message=body,
            recipient_list=[settings.DEFAULT_FROM_EMAIL]
        )
