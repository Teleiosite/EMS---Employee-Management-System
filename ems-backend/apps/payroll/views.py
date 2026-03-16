from decimal import Decimal

from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from apps.core.tenancy import resolve_tenant
from .models import PayrollRun, Payslip, TaxSlab
from .serializers import PayrollRunSerializer, PayslipSerializer, TaxSlabSerializer
from .pdf_generator import generate_payslip_pdf


def _generate_payslips_for_run(payroll_run: PayrollRun, tenant=None, employee_ids=None) -> None:
    """Auto-generate a Payslip for the given employees (or all active if no IDs provided)."""
    from apps.employees.models import EmployeeProfile
    qs = EmployeeProfile.objects.filter(status='ACTIVE', tenant=tenant).select_related('user', 'designation')
    if employee_ids:
        qs = qs.filter(id__in=employee_ids)

    payslips = []
    for employee in qs:
        # Skip if a payslip already exists for this employee/run pair
        if Payslip.objects.filter(payroll_run=payroll_run, employee=employee).exists():
            continue
        gross = Decimal(str(employee.base_salary))
        deduction = round(gross * Decimal('0.10'), 2)
        tax = round(gross * Decimal('0.05'), 2)
        net = gross - deduction - tax
        payslips.append(Payslip(
            tenant=tenant,
            payroll_run=payroll_run,
            employee=employee,
            gross_salary=gross,
            total_deductions=deduction,
            tax_deduction=tax,
            net_salary=net,
        ))
    if payslips:
        Payslip.objects.bulk_create(payslips)


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
