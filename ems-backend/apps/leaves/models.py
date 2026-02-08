from django.db import models


class LeaveType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    max_days_per_year = models.IntegerField()


class LeaveRequest(models.Model):
    employee = models.ForeignKey('employees.EmployeeProfile', on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.SET_NULL, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    duration_days = models.DecimalField(max_digits=4, decimal_places=1)
    reason = models.TextField()
    status = models.CharField(max_length=20, default='PENDING')
