from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from .models import Department, EmployeeProfile
from .serializers import DepartmentSerializer, EmployeeProfileSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrHRManager]


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeProfileSerializer

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in {'ADMIN', 'HR_MANAGER'}:
            return EmployeeProfile.objects.select_related('user', 'department', 'designation').all()
        # Employees only see their own profile
        return EmployeeProfile.objects.select_related('user', 'department', 'designation').filter(user=user)

    def get_permissions(self):
        if self.action in {'create', 'destroy'}:
            return [IsAdminOrHRManager()]
        if self.action == 'me':
            return [IsAuthenticated()]
        return [IsSelfOrAdminOrHR()]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='me')
    def me(self, request):
        """Returns the current employee's own profile."""
        try:
            profile = EmployeeProfile.objects.select_related(
                'user', 'department', 'designation'
            ).get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except EmployeeProfile.DoesNotExist:
            return Response({'detail': 'Employee profile not found.'}, status=404)
