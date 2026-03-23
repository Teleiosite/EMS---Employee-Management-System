import io
import pandas as pd
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from apps.core.tenancy import resolve_tenant
from .models import Department, Designation, EmployeeProfile
from .serializers import DepartmentSerializer, DesignationSerializer, EmployeeProfileSerializer

User = get_user_model()


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

class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    permission_classes = [IsAdminOrHRManager]

    def get_queryset(self):
        user = self.request.user
        tenant = resolve_tenant(self.request)
        if not user.is_superuser and not tenant:
            return Designation.objects.none()
        return Designation.objects.filter(tenant=tenant)

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

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrHRManager], url_path='bulk-import')
    def bulk_import(self, request):
        """Bulk import employees from Excel or CSV file."""
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        tenant = resolve_tenant(request)
        if not tenant:
            return Response({'detail': 'Tenant context missing.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            filename = file.name.lower()
            if filename.endswith('.csv'):
                df = pd.read_csv(file)
            elif filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file)
            else:
                return Response({'detail': 'Unsupported file format.'}, status=status.HTTP_400_BAD_REQUEST)

            # Map columns (flexible mapping or expected names)
            expected_cols = {
                'first_name': ['First Name', 'firstname', 'first_name'],
                'last_name': ['Last Name', 'lastname', 'last_name'],
                'email': ['Email', 'email_address', 'email'],
                'department': ['Department', 'dept'],
                'designation': ['Designation', 'job_title', 'title'],
                'base_salary': ['Base Salary', 'salary', 'base_pay'],
                'employee_id': ['Employee ID', 'id', 'emp_id'],
                'joining_date': ['Joining Date', 'joined_at', 'hire_date'],
            }

            # Helper to find column
            def find_col(df, options):
                for opt in options:
                    if opt in df.columns: return opt
                    # Also check case-insensitive
                    for col in df.columns:
                        if col.lower() == opt.lower(): return col
                return None

            mapped_cols = {target: find_col(df, opts) for target, opts in expected_cols.items()}
            
            # Email is mandatory
            if not mapped_cols['email']:
                return Response({'detail': 'Email column is missing from the file.'}, status=status.HTTP_400_BAD_REQUEST)

            success_count = 0
            errors = []

            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        email = str(row[mapped_cols['email']]).strip().lower()
                        if not email or email == 'nan': continue

                        # Resolve or Create Department
                        dept_obj = None
                        if mapped_cols['department'] and pd.notna(row[mapped_cols['department']]):
                            dept_name = str(row[mapped_cols['department']]).strip()
                            dept_obj, _ = Department.objects.get_or_create(tenant=tenant, name=dept_name)

                        # Resolve or Create Designation
                        desig_obj = None
                        if mapped_cols['designation'] and pd.notna(row[mapped_cols['designation']]):
                            desig_name = str(row[mapped_cols['designation']]).strip()
                            desig_obj, _ = Designation.objects.get_or_create(tenant=tenant, title=desig_name)

                        # Create/Get User
                        first_name = str(row[mapped_cols['first_name']]).strip() if mapped_cols['first_name'] and pd.notna(row[mapped_cols['first_name']]) else "Employee"
                        last_name = str(row[mapped_cols['last_name']]).strip() if mapped_cols['last_name'] and pd.notna(row[mapped_cols['last_name']]) else ""
                        
                        user_obj, created = User.objects.get_or_create(
                            email=email,
                            defaults={
                                'first_name': first_name,
                                'last_name': last_name,
                                'tenant': tenant,
                                'role': 'EMPLOYEE',
                                'is_active': True,
                            }
                        )
                        if created:
                            user_obj.set_password('Ems12345!') # Default password
                            user_obj.save()

                        # Create/Update Profile
                        base_salary = float(row[mapped_cols['base_salary']]) if mapped_cols['base_salary'] and pd.notna(row[mapped_cols['base_salary']]) else 0.0
                        emp_id = str(row[mapped_cols['employee_id']]).strip() if mapped_cols['employee_id'] and pd.notna(row[mapped_cols['employee_id']]) else f"EMP-{user_obj.id.hex[:6].upper()}"
                        joining_date = pd.to_datetime(row[mapped_cols['joining_date']]).date() if mapped_cols['joining_date'] and pd.notna(row[mapped_cols['joining_date']]) else pd.Timestamp.now().date()

                        EmployeeProfile.objects.update_or_create(
                            user=user_obj,
                            tenant=tenant,
                            defaults={
                                'department': dept_obj,
                                'designation': desig_obj,
                                'employee_id': emp_id,
                                'base_salary': base_salary,
                                'joining_date': joining_date,
                                'status': 'ACTIVE',
                            }
                        )
                        success_count += 1
                    except Exception as e:
                        errors.append(f"Row {index + 1}: {str(e)}")

            return Response({
                'detail': f'Import completed: {success_count} succeeded, {len(errors)} failed.',
                'success_count': success_count,
                'error_count': len(errors),
                'errors': errors[:50] # Limit reported errors
            })

        except Exception as e:
            return Response({'detail': f'File parsing error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

