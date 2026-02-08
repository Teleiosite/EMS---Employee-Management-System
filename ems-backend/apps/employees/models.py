from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.db import models

User = get_user_model()


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_departments')
    budget = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)


class Designation(models.Model):
    title = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)


class EmployeeProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True)
    employee_id = models.CharField(max_length=20, unique=True)
    base_salary = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    joining_date = models.DateField()
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='ACTIVE')

    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()
