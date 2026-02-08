from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class AttendanceLog(models.Model):
    STATUS_CHOICES = (
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('HALF_DAY', 'Half Day'),
        ('LATE', 'Late'),
    )

    employee = models.ForeignKey('employees.EmployeeProfile', on_delete=models.CASCADE, related_name='attendance_logs')
    date = models.DateField(db_index=True)
    clock_in_timestamp = models.DateTimeField(blank=True, null=True)
    clock_out_timestamp = models.DateTimeField(blank=True, null=True)
    clock_in_ip = models.GenericIPAddressField(blank=True, null=True)
    clock_out_ip = models.GenericIPAddressField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT', db_index=True)

    class Meta:
        unique_together = ('employee', 'date')
        indexes = [models.Index(fields=['employee', 'date'])]


class AttendanceCorrectionRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    attendance_log = models.ForeignKey(AttendanceLog, on_delete=models.CASCADE, related_name='corrections')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE)
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_attendance_corrections')
    reason = models.TextField()
    requested_clock_in = models.DateTimeField(blank=True, null=True)
    requested_clock_out = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    review_notes = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=['status', 'id'])]
