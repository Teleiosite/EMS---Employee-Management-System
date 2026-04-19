from django.db import models


class SalaryComponent(models.Model):
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE, null=True, blank=True, related_name='salary_components')
    COMPONENT_TYPES = (
        ('EARNING', 'Earning'),
        ('DEDUCTION', 'Deduction'),
    )

    CALCULATION_TYPES = (
        ('FIXED', 'Fixed'),
        ('PERCENTAGE', 'Percentage of base salary'),
    )

    name = models.CharField(max_length=100)
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    calculation_type = models.CharField(max_length=20, choices=CALCULATION_TYPES, default='FIXED')
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ('tenant', 'name')


class TaxSlab(models.Model):
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE, null=True, blank=True, related_name='tax_slabs')
    min_income = models.DecimalField(max_digits=12, decimal_places=2)
    max_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    rate_percent = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        ordering = ['min_income']


class SalaryStructure(models.Model):
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE, null=True, blank=True, related_name='salary_structures')
    employee = models.OneToOneField('employees.EmployeeProfile', on_delete=models.CASCADE, related_name='salary_structure')
    effective_date = models.DateField()
    def __str__(self):
        return f"Salary Structure - {self.employee.full_name}"

    @property
    def total_earnings(self):
        return sum(c.value for c in self.components.filter(component_type='EARNING'))

    @property
    def total_deductions(self):
        return sum(c.value for c in self.components.filter(component_type='DEDUCTION'))

class SalaryStructureComponent(models.Model):
    salary_structure = models.ForeignKey(SalaryStructure, on_delete=models.CASCADE, related_name='components')
    component = models.ForeignKey(SalaryComponent, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100, null=True, blank=True)
    component_type = models.CharField(max_length=20, choices=SalaryComponent.COMPONENT_TYPES, null=True, blank=True)
    value = models.DecimalField(max_digits=12, decimal_places=2)


class PayrollRun(models.Model):
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE, null=True, blank=True, related_name='payroll_runs')
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
    )

    month = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')


class Payslip(models.Model):
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE, null=True, blank=True, related_name='payslips')
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='payslips')
    employee = models.ForeignKey('employees.EmployeeProfile', on_delete=models.CASCADE, related_name='payslips')
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    tax_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ('payroll_run', 'employee')


class PayslipComponent(models.Model):
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='breakdown')
    name = models.CharField(max_length=100)
    component_type = models.CharField(max_length=20) # EARNING or DEDUCTION
    value = models.DecimalField(max_digits=12, decimal_places=2)

