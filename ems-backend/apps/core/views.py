from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Announcement, Tenant
from .permissions import IsAdminOrHRManager
from .serializers import AnnouncementSerializer

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
        tenant = getattr(self.request, 'tenant', None)
        return Announcement.objects.filter(tenant=tenant)

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAdminOrHRManager()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, tenant=getattr(self.request, 'tenant', None))


class HostStatsView(APIView):
    """Platform owner super-admin dashboard statistics."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        tenants = Tenant.objects.annotate(user_count=Count('customuser')).order_by('-created_at')
        total_users = User.objects.count()
        active_tenants = tenants.filter(is_active=True).count()

        tenant_data = [
            {
                'id': t.id,
                'name': t.name,
                'slug': t.slug,
                'is_active': t.is_active,
                'created_at': t.created_at,
                'user_count': t.user_count,
            }
            for t in tenants
        ]

        return Response({
            'total_tenants': tenants.count(),
            'active_tenants': active_tenants,
            'total_users': total_users,
            'recent_signups': tenant_data,
        })
