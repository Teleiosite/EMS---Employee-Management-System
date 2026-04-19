from celery import shared_task
from decimal import Decimal
import logging
from django.db import transaction
from .models import PayrollRun, Payslip, PayslipComponent

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=2)
def generate_payslips_task(self, payroll_run_id, tenant_id=None, employee_ids=None):
    """
    Background task to auto-generate Payslips for a given PayrollRun.
    Uses bulk operations and batch fetching for high scalability.
    """
    try:
        from apps.employees.models import EmployeeProfile
        from .models import SalaryStructure, PayrollRun

        # Fetch the run once
        payroll_run = PayrollRun.objects.get(id=payroll_run_id)

        # SECURITY: tenant_id is mandatory — never process employees cross-tenant
        if not tenant_id:
            logger.error(f"generate_payslips_task called without tenant_id for run {payroll_run_id}. Aborting.")
            payroll_run.status = 'FAILED'
            payroll_run.save(update_fields=['status'])
            return 'Aborted: tenant_id is required'

        logger.info(f"Starting optimized background payroll generation for run {payroll_run_id}")

        with transaction.atomic():
            # 1. Fetch existing employee IDs for this run to avoid duplicates
            existing_employee_ids = set(
                Payslip.objects.filter(payroll_run=payroll_run).values_list('employee_id', flat=True)
            )

            # 2. Optimized Queryset with prefetching
            # select_related for 1-to-1 structure, prefetch_related for many-to-one components
            qs = EmployeeProfile.objects.filter(
                status='ACTIVE',
                tenant_id=tenant_id,
            ).select_related('user', 'designation', 'salary_structure').prefetch_related(
                'salary_structure__components__component'
            )

            if employee_ids:
                qs = qs.filter(id__in=employee_ids)

            payslips_to_create = []
            components_data_map = {} # employee_id -> list of component dicts

            for employee in qs:
                # Deduplication check via local set
                if employee.id in existing_employee_ids:
                    continue

                base_salary = Decimal(str(employee.base_salary))
                total_earnings = Decimal('0.00')
                total_deductions = Decimal('0.00')
                
                # Check for SalaryStructure (OneToOne)
                structure = None
                try:
                    # Accessing via select_related is now cached
                    structure = employee.salary_structure
                except Exception:
                    structure = None
                    
                pending_components = []
                
                if structure:
                    # Accessing prefetched components
                    components = structure.components.all()
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
                
                ps = Payslip(
                    tenant_id=tenant_id,
                    payroll_run=payroll_run,
                    employee=employee,
                    gross_salary=gross,
                    total_deductions=total_deductions,
                    tax_deduction=Decimal('0.00'),
                    net_salary=net,
                )
                payslips_to_create.append(ps)
                components_data_map[employee.id] = pending_components

            # 3. Bulk create Payslips
            # Note: We don't use ignore_conflicts=True to ensure we get IDs back where supported
            if payslips_to_create:
                created_payslips = Payslip.objects.bulk_create(payslips_to_create)
                
                # 4. Bulk create Components
                all_payslip_components = []
                for ps in created_payslips:
                    # Map back to the stashed component data using the employee_id
                    comp_list = components_data_map.get(ps.employee_id, [])
                    for comp_data in comp_list:
                        all_payslip_components.append(
                            PayslipComponent(payslip=ps, **comp_data)
                        )
                
                if all_payslip_components:
                    PayslipComponent.objects.bulk_create(all_payslip_components)

            # Finalize the run
            payroll_run.status = 'COMPLETED'
            payroll_run.save(update_fields=['status'])
            
            count = len(payslips_to_create)
            logger.info(f"Completed optimized payroll generation: {count} payslips created.")
            return f"Bulk Created {count} payslips for run {payroll_run_id}"

    except Exception as exc:
        logger.error(f"Optimized Payroll generation failed for run {payroll_run_id}: {exc}")
        try:
            from .models import PayrollRun as PR
            PR.objects.filter(id=payroll_run_id).update(status='FAILED')
        except Exception:
            pass
        if hasattr(self, 'retry'):
            raise self.retry(exc=exc)
        raise
