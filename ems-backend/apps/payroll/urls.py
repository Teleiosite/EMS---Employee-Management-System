from rest_framework.routers import DefaultRouter
from .views import PayrollRunViewSet, PayslipViewSet, TaxSlabViewSet

router = DefaultRouter()
router.register('runs', PayrollRunViewSet)
router.register('tax-slabs', TaxSlabViewSet)
router.register('payslips', PayslipViewSet)

urlpatterns = router.urls
