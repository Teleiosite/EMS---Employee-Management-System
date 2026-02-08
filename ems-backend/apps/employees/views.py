from rest_framework import viewsets
from .models import Department, EmployeeProfile
from .serializers import DepartmentSerializer, EmployeeProfileSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = EmployeeProfile.objects.select_related('user', 'department', 'designation').all()
    serializer_class = EmployeeProfileSerializer
