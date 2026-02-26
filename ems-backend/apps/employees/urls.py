from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, DesignationViewSet, EmployeeProfileViewSet

router = DefaultRouter()
router.register('departments', DepartmentViewSet)
router.register('designations', DesignationViewSet)
router.register('profiles', EmployeeProfileViewSet)

urlpatterns = router.urls
