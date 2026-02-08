from rest_framework.routers import DefaultRouter
from .views import PayrollRunViewSet

router = DefaultRouter()
router.register('runs', PayrollRunViewSet)

urlpatterns = router.urls
