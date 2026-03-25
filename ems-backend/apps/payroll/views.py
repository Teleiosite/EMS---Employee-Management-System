from decimal import Decimal

from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from apps.core.tenancy import resolve_tenant
from .models import PayrollRun, Payslip, TaxSlab, SalaryComponent, SalaryStructure, PayslipComponent
from .serializers import (

    PayrollRunSerializer, PayslipSerializer, TaxSlabSerializer,
    SalaryComponentSerializer, SalaryStructureSerializer
)

from .pdf_generator import generate_payslip_pdf


def _generate_payslips_for_run(payroll_run: PayrollRun, tenant=None, employee_ids=None) -> None:
    """Auto-generate a Payslip for the given employees (or all active if no IDs provided)."""
    from apps.employees.models import EmployeeProfile
    from .models import SalaryStructure, SalaryStructureComponent

    qs = EmployeeProfile.objects.filter(status='ACTIVE', tenant=tenant).select_related('user', 'designation', 'salary_structure')
    if employee_ids:
        qs = qs.filter(id__in=employee_ids)

    payslips = []
    for employee in qs:
        # Skip if a payslip already exists for this employee/run pair
        if Payslip.objects.filter(payroll_run=payroll_run, employee=employee).exists():
            continue

        base_salary = Decimal(str(employee.base_salary))
        total_earnings = Decimal('0.00')
        total_deductions = Decimal('0.00')
        
        # Check for SalaryStructure
        structure = None
        components = []
        try:
            structure = employee.salary_structure
            components = structure.components.select_related('component').all()
            
            for struct_comp in components:
                val = Decimal(str(struct_comp.value))
                # Use direct fields if available, otherwise fallback to linked component
                comp_type = struct_comp.component_type or (struct_comp.component.component_type if struct_comp.component else 'EARNING')
                
                if comp_type == 'EARNING':
                    total_earnings += val
                else:
                    total_deductions += val
        except Exception: # Broad catch to ensure payslip generation continues
            # If no structure is defined or other error, we assume zero additional earnings or deductions
            # beyond the base salary.
            pass

        gross = base_salary + total_earnings

        net = gross - total_deductions
        
        # Note: In a real system, tax might be a separate component. 
        # Here we bundle it into deductions unless explicitly split in the structure.
        
        ps = Payslip(
            tenant=tenant,
            payroll_run=payroll_run,
            employee=employee,
            gross_salary=gross,
            total_deductions=total_deductions,
            tax_deduction=Decimal('0.00'),
            net_salary=net,
        )
        # Store components to create after saving ps
        ps._pending_components = []
        if structure:
            for struct_comp in components:
                comp_name = struct_comp.name or (struct_comp.component.name if struct_comp.component else 'Custom Component')
                comp_type = struct_comp.component_type or (struct_comp.component.component_type if struct_comp.component else 'EARNING')
                ps._pending_components.append({
                    'name': comp_name,
                    'component_type': comp_type,
                    'value': struct_comp.value
                })
        
        payslips.append(ps)

    if payslips:
        # We need to save them one by one or get the IDs after bulk_create to link components
        # Since we need to link PayslipComponents, we'll create Payslips and then their children
        for ps in payslips:
            components_to_create = ps._pending_components # Temporary storage
            ps.save()
            for comp_data in components_to_create:
                PayslipComponent.objects.create(payslip=ps, **comp_data)




class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.all()
    serializer_class = PayrollRunSerializer
    permission_classes = [IsAdminOrHRManager]

    def get_queryset(self):
        user = self.request.user
        tenant = resolve_tenant(self.request)
        if not user.is_superuser and not tenant:
            return PayrollRun.objects.none()
        return PayrollRun.objects.filter(tenant=tenant).order_by('-month')

    def perform_create(self, serializer):
        """Create the PayrollRun and auto-generate payslips for selected (or all active) employees."""
        # Extract employee_ids from request data — not a model field, so pop it before saving
        employee_ids = self.request.data.get('employee_ids', None)
        tenant = resolve_tenant(self.request)
        payroll_run = serializer.save(tenant=tenant)
        _generate_payslips_for_run(payroll_run, tenant=tenant, employee_ids=employee_ids)


class TaxSlabViewSet(viewsets.ModelViewSet):
    queryset = TaxSlab.objects.all()
    serializer_class = TaxSlabSerializer
    permission_classes = [IsAdminOrHRManager]

    def get_queryset(self):
        user = self.request.user
        tenant = resolve_tenant(self.request)
        if not user.is_superuser and not tenant:
            return TaxSlab.objects.none()
        return TaxSlab.objects.filter(tenant=tenant).order_by('min_income')

    def perform_create(self, serializer):
        serializer.save(tenant=resolve_tenant(self.request))


class PayslipViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payslip.objects.select_related('employee', 'employee__user', 'payroll_run').all()
    serializer_class = PayslipSerializer

    def get_queryset(self):
        user = self.request.user
        tenant = resolve_tenant(self.request)
        if not user.is_superuser and not tenant:
            return Payslip.objects.none()

        queryset = super().get_queryset().filter(tenant=tenant)
        if user.role in {'ADMIN', 'HR_MANAGER'}:
            return queryset
        return queryset.filter(employee__user=user)

    def get_permissions(self):
        return [IsSelfOrAdminOrHR()]

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        payslip = self.get_object()
        pdf_bytes = generate_payslip_pdf(payslip)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="payslip_{payslip.id}.pdf"'
        return response


class SalaryComponentViewSet(viewsets.ModelViewSet):
    queryset = SalaryComponent.objects.all()
    serializer_class = SalaryComponentSerializer
    permission_classes = [IsAdminOrHRManager]

    def get_queryset(self):
        tenant = resolve_tenant(self.request)
        return SalaryComponent.objects.filter(tenant=tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=resolve_tenant(self.request))


class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer
    permission_classes = [IsAdminOrHRManager]

    def get_queryset(self):
        tenant = resolve_tenant(self.request)
        return SalaryStructure.objects.filter(tenant=tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=resolve_tenant(self.request))

