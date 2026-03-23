from rest_framework.routers import DefaultRouter
from .views import PayrollRunViewSet, PayslipViewSet, TaxSlabViewSet, SalaryComponentViewSet, SalaryStructureViewSet


router = DefaultRouter()
router.register('runs', PayrollRunViewSet)
router.register('tax-slabs', TaxSlabViewSet)
router.register('payslips', PayslipViewSet)
router.register('salary-components', SalaryComponentViewSet)
router.register('salary-structures', SalaryStructureViewSet)


urlpatterns = router.urls
