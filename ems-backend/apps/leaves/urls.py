from rest_framework.routers import DefaultRouter
from .views import LeaveRequestViewSet, LeaveTypeViewSet

router = DefaultRouter()
router.register('types', LeaveTypeViewSet)
router.register('requests', LeaveRequestViewSet)

urlpatterns = router.urls
