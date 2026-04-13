from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HealthCheckView, AnnouncementViewSet, HostStatsView, HostTenantViewSet, HostInviteCodeViewSet, AuditLogListView

router = DefaultRouter()
router.register('announcements', AnnouncementViewSet)
router.register('host/tenants', HostTenantViewSet, basename='host-tenants')
router.register('host/invite-codes', HostInviteCodeViewSet, basename='host-invite-codes')

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('host/stats/', HostStatsView.as_view(), name='host-stats'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('', include(router.urls)),
]
