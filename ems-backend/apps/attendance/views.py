from rest_framework import viewsets

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from .models import AttendanceLog
from .serializers import AttendanceLogSerializer


class AttendanceLogViewSet(viewsets.ModelViewSet):
    queryset = AttendanceLog.objects.select_related('employee').all()
    serializer_class = AttendanceLogSerializer

    def get_permissions(self):
        if self.action in {'list', 'create', 'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]
