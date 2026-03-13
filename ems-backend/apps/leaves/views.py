from rest_framework import viewsets

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from .models import LeaveBalance, LeavePolicyWindow, LeaveRequest, LeaveType
from .serializers import LeaveBalanceSerializer, LeavePolicyWindowSerializer, LeaveRequestSerializer, LeaveTypeSerializer


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer

    def get_queryset(self):
        return LeaveType.objects.filter(tenant=getattr(self.request, 'tenant', None))

    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated
        if self.action in {'list', 'retrieve'}:
            return [IsAuthenticated()]
        return [IsAdminOrHRManager()]

    def perform_create(self, serializer):
        serializer.save(tenant=getattr(self.request, 'tenant', None))


class LeavePolicyWindowViewSet(viewsets.ModelViewSet):
    queryset = LeavePolicyWindow.objects.select_related('leave_type').all()
    serializer_class = LeavePolicyWindowSerializer
    permission_classes = [IsAdminOrHRManager]

    def get_queryset(self):
        return LeavePolicyWindow.objects.select_related('leave_type').filter(tenant=getattr(self.request, 'tenant', None))

    def perform_create(self, serializer):
        serializer.save(tenant=getattr(self.request, 'tenant', None))


class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.select_related('employee', 'leave_type').all()
    serializer_class = LeaveBalanceSerializer

    def get_queryset(self):
        return LeaveBalance.objects.select_related('employee', 'leave_type').filter(tenant=getattr(self.request, 'tenant', None))

    def get_permissions(self):
        if self.action in {'list', 'create', 'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]

    def perform_create(self, serializer):
        serializer.save(tenant=getattr(self.request, 'tenant', None))


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related('employee', 'employee__user', 'leave_type').all()
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        queryset = LeaveRequest.objects.select_related('employee', 'employee__user', 'leave_type').filter(
            tenant=getattr(self.request, 'tenant', None)
        )
        user = self.request.user
        if user.role in {'ADMIN', 'HR_MANAGER'}:
            return queryset
        return queryset.filter(employee__user=user)

    def get_permissions(self):
        if self.action in {'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]

    def perform_create(self, serializer):
        user = self.request.user
        tenant = getattr(self.request, 'tenant', None)
        employee = getattr(user, 'employee_profile', None)
        if employee:
            serializer.save(employee=employee, tenant=tenant)
        else:
            serializer.save(tenant=tenant)
