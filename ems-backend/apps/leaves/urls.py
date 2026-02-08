from rest_framework.routers import DefaultRouter
from .views import LeaveBalanceViewSet, LeavePolicyWindowViewSet, LeaveRequestViewSet, LeaveTypeViewSet

router = DefaultRouter()
router.register('types', LeaveTypeViewSet)
router.register('policy-windows', LeavePolicyWindowViewSet)
router.register('balances', LeaveBalanceViewSet)
router.register('requests', LeaveRequestViewSet)

urlpatterns = router.urls
