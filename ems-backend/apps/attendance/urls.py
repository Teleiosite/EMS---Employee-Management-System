from rest_framework.routers import DefaultRouter
from .views import AttendanceCorrectionRequestViewSet, AttendanceLogViewSet

router = DefaultRouter()
router.register('logs', AttendanceLogViewSet)
router.register('corrections', AttendanceCorrectionRequestViewSet)

urlpatterns = router.urls
