from rest_framework import viewsets

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from .models import LeaveBalance, LeavePolicyWindow, LeaveRequest, LeaveType
from .serializers import LeaveBalanceSerializer, LeavePolicyWindowSerializer, LeaveRequestSerializer, LeaveTypeSerializer


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminOrHRManager]


class LeavePolicyWindowViewSet(viewsets.ModelViewSet):
    queryset = LeavePolicyWindow.objects.select_related('leave_type').all()
    serializer_class = LeavePolicyWindowSerializer
    permission_classes = [IsAdminOrHRManager]


class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.select_related('employee', 'leave_type').all()
    serializer_class = LeaveBalanceSerializer

    def get_permissions(self):
        if self.action in {'list', 'create', 'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related('employee', 'leave_type').all()
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role in {'ADMIN', 'HR_MANAGER'}:
            return queryset
        return queryset.filter(employee__user=user)

    def get_permissions(self):
        if self.action in {'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]
