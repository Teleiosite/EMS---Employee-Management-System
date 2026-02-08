from rest_framework.routers import DefaultRouter
from .views import AttendanceLogViewSet

router = DefaultRouter()
router.register('logs', AttendanceLogViewSet)

urlpatterns = router.urls
