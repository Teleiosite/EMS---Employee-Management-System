from rest_framework import viewsets

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from .models import LeaveRequest, LeaveType
from .serializers import LeaveRequestSerializer, LeaveTypeSerializer


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminOrHRManager]


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related('employee', 'leave_type').all()
    serializer_class = LeaveRequestSerializer

    def get_permissions(self):
        if self.action in {'list', 'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]
