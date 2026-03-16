from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from apps.core.tenancy import resolve_tenant
from .models import Department, EmployeeProfile
from .serializers import DepartmentSerializer, EmployeeProfileSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrHRManager]

    def get_queryset(self):
        user = self.request.user
        tenant = resolve_tenant(self.request)
        # Strict Isolation: Non-superusers with None tenant see nothing
        if not user.is_superuser and not tenant:
            return Department.objects.none()
        return Department.objects.filter(tenant=tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=resolve_tenant(self.request))


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = EmployeeProfile.objects.all()
    serializer_class = EmployeeProfileSerializer

    def get_queryset(self):
        user = self.request.user
        tenant = resolve_tenant(self.request)
        
        # Strict Isolation: Non-superusers with None tenant see nothing
        if not user.is_superuser and not tenant:
            return EmployeeProfile.objects.none()

        base_queryset = EmployeeProfile.objects.select_related('user', 'department', 'designation').filter(tenant=tenant)

        if getattr(user, 'role', None) in {'ADMIN', 'HR_MANAGER'}:
            return base_queryset
        return base_queryset.filter(user=user)

    def get_permissions(self):
        if self.action in {'create', 'destroy'}:
            return [IsAdminOrHRManager()]
        if self.action == 'me':
            return [IsAuthenticated()]
        return [IsSelfOrAdminOrHR()]

    def perform_create(self, serializer):
        profile = serializer.save(tenant=resolve_tenant(self.request))
        if profile.user and not profile.user.tenant_id:
            profile.user.tenant = profile.tenant
            profile.user.save(update_fields=['tenant'])

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='me')
    def me(self, request):
        """Returns the current employee's own profile."""
        try:
            profile = EmployeeProfile.objects.select_related(
                'user', 'department', 'designation'
            ).get(user=request.user, tenant=resolve_tenant(request))
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except EmployeeProfile.DoesNotExist:
            return Response({'detail': 'Employee profile not found.'}, status=404)
