from rest_framework import viewsets

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from .models import Department, Designation, EmployeeProfile
from .serializers import DepartmentSerializer, DesignationSerializer, EmployeeProfileSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrHRManager]


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    permission_classes = [IsAdminOrHRManager]


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = EmployeeProfile.objects.select_related('user', 'department', 'designation').all()
    serializer_class = EmployeeProfileSerializer

    def get_permissions(self):
        if self.action in {'list', 'create', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]
