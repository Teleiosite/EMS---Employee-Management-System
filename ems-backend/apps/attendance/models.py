from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AttendanceLog(models.Model):
    employee = models.ForeignKey('employees.EmployeeProfile', on_delete=models.CASCADE, related_name='attendance_logs')
    date = models.DateField()
    clock_in_timestamp = models.DateTimeField(blank=True, null=True)
    clock_out_timestamp = models.DateTimeField(blank=True, null=True)
    clock_in_ip = models.GenericIPAddressField(blank=True, null=True)
    clock_out_ip = models.GenericIPAddressField(blank=True, null=True)
    status = models.CharField(max_length=20, default='PRESENT')

    class Meta:
        unique_together = ('employee', 'date')


class AttendanceCorrectionRequest(models.Model):
    attendance_log = models.ForeignKey(AttendanceLog, on_delete=models.CASCADE, related_name='corrections')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE)
    reason = models.TextField()
    status = models.CharField(max_length=20, default='PENDING')
