from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Creates or updates the default admin user and ensures they have a tenant'

    def handle(self, *args, **options):
        User = get_user_model()
        # Import here to avoid circular imports at module load
        from apps.core.models import Tenant

        # ── 1. Ensure a default platform tenant exists ──────────────────
        tenant, tenant_created = Tenant.objects.get_or_create(
            slug='default',
            defaults={
                'name': 'Default Company',
                'is_active': True,
            }
        )
        if tenant_created:
            self.stdout.write(self.style.SUCCESS(f'Created default tenant: {tenant.name}'))
        else:
            self.stdout.write(f'Default tenant already exists: {tenant.name}')

        # ── 2. Create or update the admin user ──────────────────────────
        email = 'admin@ems.com'
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': 'System',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'role': 'ADMIN',
                'email_verified': True,
                'tenant': tenant,
            }
        )

        if created:
            user.set_password('admin123456')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created admin user {email}'))
        else:
            # Always ensure the admin has tenant + correct perms
            changed = False
            if not user.tenant_id:
                user.tenant = tenant
                changed = True
            if not user.is_superuser:
                user.is_superuser = True
                changed = True
            if not user.is_staff:
                user.is_staff = True
                changed = True
            if user.role != 'ADMIN':
                user.role = 'ADMIN'
                changed = True
            if not user.is_active:
                user.is_active = True
                changed = True
            if changed:
                user.save()
            self.stdout.write(self.style.SUCCESS(
                f'Updated admin user {email} → tenant={tenant.name}, is_superuser=True'
            ))

        # ── 3. Fix any orphaned data created with null tenant ────────────
        from apps.employees.models import Department, Designation, EmployeeProfile

        # Delete null-tenant depts that conflict with existing tenant-owned ones by name
        # list() forces evaluation before the update query runs (avoids deferred subquery conflict)
        existing_dept_names = list(Department.objects.filter(tenant=tenant).values_list('name', flat=True))
        Department.objects.filter(tenant__isnull=True, name__in=existing_dept_names).delete()
        fixed_depts = Department.objects.filter(tenant__isnull=True).update(tenant=tenant)

        existing_desig_titles = list(Designation.objects.filter(tenant=tenant).values_list('title', flat=True))
        Designation.objects.filter(tenant__isnull=True, title__in=existing_desig_titles).delete()
        fixed_desig = Designation.objects.filter(tenant__isnull=True).update(tenant=tenant)

        fixed_emp = EmployeeProfile.objects.filter(tenant__isnull=True).update(tenant=tenant)
        if fixed_depts or fixed_desig or fixed_emp:
            self.stdout.write(self.style.WARNING(
                f'Repaired orphaned records → '
                f'Departments: {fixed_depts}, Designations: {fixed_desig}, Employees: {fixed_emp}'
            ))

        # ── 4. Fix orphaned recruitment data ────────────────────────────
        try:
            from apps.recruitment.models import JobPosting, Candidate
            fixed_jobs = JobPosting.objects.filter(tenant__isnull=True).update(tenant=tenant)
            fixed_cands = Candidate.objects.filter(tenant__isnull=True).update(tenant=tenant)
            if fixed_jobs or fixed_cands:
                self.stdout.write(self.style.WARNING(
                    f'Repaired orphaned recruitment records → '
                    f'Jobs: {fixed_jobs}, Candidates: {fixed_cands}'
                ))
        except Exception:
            pass

        self.stdout.write(self.style.SUCCESS('✅ setup_admin complete'))


