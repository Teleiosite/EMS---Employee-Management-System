from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PulseSurveyViewSet, SurveyResponseViewSet, SurveyAnalyticsView

router = DefaultRouter()
router.register(r'surveys', PulseSurveyViewSet)
router.register(r'responses', SurveyResponseViewSet)

urlpatterns = [
    path('analytics/', SurveyAnalyticsView.as_view(), name='survey-analytics'),
    path('', include(router.urls)),
]
