from rest_framework.routers import DefaultRouter
from .views import CandidateViewSet, JobPostingViewSet

router = DefaultRouter()
router.register('jobs', JobPostingViewSet)
router.register('candidates', CandidateViewSet)

urlpatterns = router.urls
