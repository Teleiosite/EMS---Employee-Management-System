from django.db import models


class SalaryComponent(models.Model):
    name = models.CharField(max_length=100, unique=True)
    component_type = models.CharField(max_length=20)
    calculation_type = models.CharField(max_length=20, default='FIXED')
    is_default = models.BooleanField(default=False)


class SalaryStructure(models.Model):
    employee = models.OneToOneField('employees.EmployeeProfile', on_delete=models.CASCADE, related_name='salary_structure')
    effective_date = models.DateField()


class SalaryStructureComponent(models.Model):
    salary_structure = models.ForeignKey(SalaryStructure, on_delete=models.CASCADE, related_name='components')
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    value = models.DecimalField(max_digits=12, decimal_places=2)


class PayrollRun(models.Model):
    month = models.DateField()
    status = models.CharField(max_length=20, default='DRAFT')
