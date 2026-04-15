import io
import logging
import secrets
import pandas as pd

logger = logging.getLogger(__name__)

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
        return Department.objects.filter(tenant=tenant, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])

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
        return Designation.objects.filter(tenant=tenant, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])

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

        base_queryset = EmployeeProfile.objects.select_related(
            'user', 'department', 'designation', 'salary_structure'
        ).prefetch_related(
            'salary_structure__components'
        ).filter(tenant=tenant, is_deleted=False)

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
        tenant = resolve_tenant(self.request)
        if tenant.current_employee_count >= tenant.employee_limit:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(f"Employee limit reached for your current plan ({tenant.subscription_tier}). Please upgrade to add more.")
            
        profile = serializer.save(tenant=tenant)
        if profile.user and not profile.user.tenant_id:
            profile.user.tenant = profile.tenant
            profile.user.save(update_fields=['tenant'])

    def perform_destroy(self, instance):
        # Instead of destroying the data permanently, we soft-delete it safely
        # shielding historical leave, payroll, and profile records from CASCADE constraints.
        instance.is_deleted = True
        instance.status = 'INACTIVE'
        instance.save(update_fields=['is_deleted', 'status'])
        
        user = instance.user
        if user:
            user.is_active = False
            user.is_deleted = True
            user.save(update_fields=['is_active', 'is_deleted'])

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
                    # Check limit per row
                    if tenant.current_employee_count >= tenant.employee_limit:
                        errors.append(f"Row {index + 1}: Employee limit reached. Upgrade your plan to import more.")
                        continue

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
                        # If existing user was deactivated (suspended), reactivate them
                        if not created and (not user_obj.is_active or getattr(user_obj, 'is_deleted', False)):
                            user_obj.is_active = True
                            user_obj.is_deleted = False
                            user_obj.save(update_fields=['is_active', 'is_deleted'])

                        if created:
                            # SECURITY: generate a unique random password per employee.
                            temp_password = secrets.token_urlsafe(12)
                            user_obj.set_password(temp_password)
                            user_obj.save()
                            
                            # Notify the employee of their account (Background Task)
                            try:
                                from apps.core.tasks import send_email_task
                                send_email_task.delay(
                                    subject='Welcome to HireWix - Your Account is Ready',
                                    message=(
                                        f"Hello {first_name},\n\n"
                                        f"Welcome to the team! An HR account has been created for you on the HireWix platform.\n\n"
                                        f"Login Email: {email}\n"
                                        f"Temporary Password: {temp_password}\n\n"
                                        f"Please log in at your earliest convenience and update your password in the settings.\n\n"
                                        f"Best Regards,\n"
                                        f"HR Administration"
                                    ),
                                    recipient_list=[email],
                                )
                            except Exception as e:
                                logger.error(f"Failed to enqueue welcome email: {e}")

                        # Prepare profile field values
                        base_salary = float(row[mapped_cols['base_salary']]) if mapped_cols['base_salary'] and pd.notna(row[mapped_cols['base_salary']]) else 0.0
                        emp_id = str(row[mapped_cols['employee_id']]).strip() if mapped_cols['employee_id'] and pd.notna(row[mapped_cols['employee_id']]) else f"EMP-{user_obj.id.hex[:6].upper()}"
                        joining_date = pd.to_datetime(row[mapped_cols['joining_date']]).date() if mapped_cols['joining_date'] and pd.notna(row[mapped_cols['joining_date']]) else pd.Timestamp.now().date()

                        # Look up existing profile for this user (including soft-deleted)
                        existing_profile = EmployeeProfile.objects.filter(user=user_obj, tenant=tenant).first()

                        if existing_profile:
                            # The employee already has a profile (active or suspended).
                            # Only block if they are CHANGING to an emp_id owned by a DIFFERENT active employee.
                            if existing_profile.employee_id != emp_id:
                                id_conflict = EmployeeProfile.objects.filter(
                                    tenant=tenant, employee_id=emp_id, is_deleted=False
                                ).exclude(pk=existing_profile.pk).first()
                                if id_conflict:
                                    errors.append(f"Row {index + 1}: Employee ID '{emp_id}' is already in use by {id_conflict.full_name}.")
                                    continue

                            # Update the existing profile directly (works for both active and suspended)
                            existing_profile.department = dept_obj
                            existing_profile.designation = desig_obj
                            existing_profile.employee_id = emp_id
                            existing_profile.base_salary = base_salary
                            existing_profile.joining_date = joining_date
                            existing_profile.status = 'ACTIVE'
                            existing_profile.is_deleted = False
                            existing_profile.save()
                        else:
                            # Brand new employee — check for ID collision before creating
                            id_conflict = EmployeeProfile.objects.filter(
                                tenant=tenant, employee_id=emp_id, is_deleted=False
                            ).first()
                            if id_conflict:
                                errors.append(f"Row {index + 1}: Employee ID '{emp_id}' is already assigned to {id_conflict.full_name}.")
                                continue

                            EmployeeProfile.objects.create(
                                user=user_obj,
                                tenant=tenant,
                                department=dept_obj,
                                designation=desig_obj,
                                employee_id=emp_id,
                                base_salary=base_salary,
                                joining_date=joining_date,
                                status='ACTIVE',
                                is_deleted=False,
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

