from rest_framework import viewsets

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from .models import AttendanceCorrectionRequest, AttendanceLog
from .serializers import AttendanceCorrectionRequestSerializer, AttendanceLogSerializer


class AttendanceLogViewSet(viewsets.ModelViewSet):
    queryset = AttendanceLog.objects.select_related('employee', 'employee__user').all()
    serializer_class = AttendanceLogSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role in {'ADMIN', 'HR_MANAGER'}:
            return queryset
        return queryset.filter(employee__user=user)

    def get_permissions(self):
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]


class AttendanceCorrectionRequestViewSet(viewsets.ModelViewSet):
    queryset = AttendanceCorrectionRequest.objects.select_related('attendance_log', 'requested_by', 'reviewer').all()
    serializer_class = AttendanceCorrectionRequestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role in {'ADMIN', 'HR_MANAGER'}:
            return queryset
        return queryset.filter(requested_by=user)

    def get_permissions(self):
        if self.action in {'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]
