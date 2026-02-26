from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HealthCheckView, AnnouncementViewSet

router = DefaultRouter()
router.register('announcements', AnnouncementViewSet)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('', include(router.urls)),
]
