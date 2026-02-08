from django.db import models


class SalaryComponent(models.Model):
    COMPONENT_TYPES = (
        ('EARNING', 'Earning'),
        ('DEDUCTION', 'Deduction'),
    )

    CALCULATION_TYPES = (
        ('FIXED', 'Fixed'),
        ('PERCENTAGE', 'Percentage of base salary'),
    )

    name = models.CharField(max_length=100, unique=True)
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    calculation_type = models.CharField(max_length=20, choices=CALCULATION_TYPES, default='FIXED')
    is_default = models.BooleanField(default=False)


class TaxSlab(models.Model):
    min_income = models.DecimalField(max_digits=12, decimal_places=2)
    max_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    rate_percent = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        ordering = ['min_income']


class SalaryStructure(models.Model):
    employee = models.OneToOneField('employees.EmployeeProfile', on_delete=models.CASCADE, related_name='salary_structure')
    effective_date = models.DateField()


class SalaryStructureComponent(models.Model):
    salary_structure = models.ForeignKey(SalaryStructure, on_delete=models.CASCADE, related_name='components')
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    value = models.DecimalField(max_digits=12, decimal_places=2)


class PayrollRun(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
    )

    month = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')


class Payslip(models.Model):
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='payslips')
    employee = models.ForeignKey('employees.EmployeeProfile', on_delete=models.CASCADE, related_name='payslips')
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    tax_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ('payroll_run', 'employee')
