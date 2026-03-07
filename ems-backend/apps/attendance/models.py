from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

ENFORCE_CHOICES = (
    ('off', 'Off'),
    ('flag', 'Flag (allow but warn admin)'),
    ('block', 'Block (reject sign-in)'),
)


class AttendancePolicy(models.Model):
    """Admin-configurable attendance rules. Only one record should be active at a time."""
    # ── Time windows ──────────────────────────────────────────────────────────
    check_in_start = models.TimeField(help_text='Earliest allowed clock-in (e.g. 07:00)')
    check_in_end = models.TimeField(help_text='On-time clock-in deadline (e.g. 09:00)')
    late_grace_minutes = models.PositiveIntegerField(default=15)
    absent_if_no_checkin_by = models.TimeField(help_text='No clock-in by this time = ABSENT')
    half_day_if_checkout_before = models.TimeField(help_text='Checkout before this = HALF_DAY')
    check_out_start = models.TimeField(help_text='Earliest allowed clock-out')
    check_out_end = models.TimeField(help_text='Expected end of work day')

    # ── IP security ───────────────────────────────────────────────────────────
    allowed_ips = models.JSONField(
        default=list, blank=True,
        help_text='List of allowed IP addresses. Empty = allow all.',
    )
    enforce_ip = models.CharField(
        max_length=10, choices=ENFORCE_CHOICES, default='off',
        help_text='What to do when clock-in comes from an unlisted IP.',
    )

    # ── GPS / location security ───────────────────────────────────────────────
    office_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    office_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    office_radius_meters = models.PositiveIntegerField(
        default=200,
        help_text='Allowed distance from office in metres.',
    )
    enforce_location = models.CharField(
        max_length=10, choices=ENFORCE_CHOICES, default='off',
        help_text='What to do when clock-in comes from outside the office radius.',
    )

    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Attendance Policy'
        verbose_name_plural = 'Attendance Policies'
        ordering = ['-updated_at']

    def save(self, *args, **kwargs):
        if self.is_active:
            AttendancePolicy.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_active(cls):
        return cls.objects.filter(is_active=True).first()


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

    # GPS at clock-in
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    distance_from_office = models.FloatField(null=True, blank=True, help_text='Metres from office at clock-in')

    # Anti-proxy / remote detection
    device_fingerprint = models.CharField(max_length=128, blank=True, null=True)
    is_suspicious = models.BooleanField(default=False, db_index=True)
    suspicious_reason = models.TextField(blank=True)

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
