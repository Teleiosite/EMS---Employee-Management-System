from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, EmployeeProfileViewSet

router = DefaultRouter()
router.register('departments', DepartmentViewSet)
router.register('profiles', EmployeeProfileViewSet)

urlpatterns = router.urls
