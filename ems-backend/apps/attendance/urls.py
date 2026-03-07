from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    AttendanceCorrectionRequestViewSet,
    AttendanceLogViewSet,
    ClockInView,
    ClockOutView,
    AttendanceStatusView,
    AttendancePolicyView,
    SuspiciousAttendanceView,
)

router = DefaultRouter()
router.register('logs', AttendanceLogViewSet)
router.register('corrections', AttendanceCorrectionRequestViewSet)

urlpatterns = [
    path('clock-in/', ClockInView.as_view(), name='attendance-clock-in'),
    path('clock-out/', ClockOutView.as_view(), name='attendance-clock-out'),
    path('status/', AttendanceStatusView.as_view(), name='attendance-status'),
    path('policy/', AttendancePolicyView.as_view(), name='attendance-policy'),
    path('suspicious/', SuspiciousAttendanceView.as_view(), name='attendance-suspicious'),
] + router.urls
