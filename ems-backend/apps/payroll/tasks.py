from celery import shared_task
from decimal import Decimal
import logging
from .models import PayrollRun, Payslip, PayslipComponent

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=2)
def generate_payslips_task(self, payroll_run_id, tenant_id=None, employee_ids=None):
    """
    Background task to auto-generate Payslips for a given PayrollRun.
    """
    try:
        from apps.employees.models import EmployeeProfile
        from .models import SalaryStructure, PayrollRun
        
        payroll_run = PayrollRun.objects.get(id=payroll_run_id)
        
        logger.info(f"Starting background payroll generation for run {payroll_run_id}")
        
        qs = EmployeeProfile.objects.filter(
            status='ACTIVE'
        ).select_related('user', 'designation', 'salary_structure')
        
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        
        if employee_ids:
            qs = qs.filter(id__in=employee_ids)

        count = 0
        for employee in qs:
            # Skip if a payslip already exists for this employee/run pair
            if Payslip.objects.filter(payroll_run=payroll_run, employee=employee).exists():
                continue

            base_salary = Decimal(str(employee.base_salary))
            total_earnings = Decimal('0.00')
            total_deductions = Decimal('0.00')
            
            structure = employee.salary_structure
            pending_components = []
            
            if structure:
                components = structure.components.select_related('component').all()
                for struct_comp in components:
                    val = Decimal(str(struct_comp.value))
                    comp_name = struct_comp.name or (struct_comp.component.name if struct_comp.component else 'Custom Component')
                    comp_type = struct_comp.component_type or (struct_comp.component.component_type if struct_comp.component else 'EARNING')
                    
                    if comp_type == 'EARNING':
                        total_earnings += val
                    else:
                        total_deductions += val
                    
                    pending_components.append({
                        'name': comp_name,
                        'component_type': comp_type,
                        'value': struct_comp.value
                    })

            gross = base_salary + total_earnings
            net = gross - total_deductions
            
            ps = Payslip.objects.create(
                tenant_id=tenant_id,
                payroll_run=payroll_run,
                employee=employee,
                gross_salary=gross,
                total_deductions=total_deductions,
                tax_deduction=Decimal('0.00'),
                net_salary=net,
            )
            
            for comp_data in pending_components:
                PayslipComponent.objects.create(payslip=ps, **comp_data)
            
            count += 1

        # Finalize the run
        payroll_run.status = 'PROCESSING'
        payroll_run.save(update_fields=['status'])
        
        logger.info(f"Completed background payroll generation: {count} payslips created.")
        return f"Created {count} payslips for run {payroll_run_id}"

    except Exception as exc:
        logger.error(f"Payroll generation failed: {exc}")
        # In a real SaaS, we'd mark the PayrollRun status as FAILED here
        if hasattr(self, 'retry'):
            raise self.retry(exc=exc)
        raise
