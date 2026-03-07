from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0004_attendance_policy_and_fingerprint'),
    ]

    operations = [
        # New AttendancePolicy security fields
        migrations.AddField(
            model_name='attendancepolicy',
            name='allowed_ips',
            field=models.JSONField(blank=True, default=list, help_text='List of allowed IP addresses. Empty = allow all.'),
        ),
        migrations.AddField(
            model_name='attendancepolicy',
            name='enforce_ip',
            field=models.CharField(
                choices=[('off', 'Off'), ('flag', 'Flag (allow but warn admin)'), ('block', 'Block (reject sign-in)')],
                default='off', max_length=10,
                help_text='What to do when clock-in comes from an unlisted IP.',
            ),
        ),
        migrations.AddField(
            model_name='attendancepolicy',
            name='office_latitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='attendancepolicy',
            name='office_longitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='attendancepolicy',
            name='office_radius_meters',
            field=models.PositiveIntegerField(default=200, help_text='Allowed distance from office in metres.'),
        ),
        migrations.AddField(
            model_name='attendancepolicy',
            name='enforce_location',
            field=models.CharField(
                choices=[('off', 'Off'), ('flag', 'Flag (allow but warn admin)'), ('block', 'Block (reject sign-in)')],
                default='off', max_length=10,
                help_text='What to do when clock-in comes from outside the office radius.',
            ),
        ),
        # New AttendanceLog GPS fields
        migrations.AddField(
            model_name='attendancelog',
            name='latitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='attendancelog',
            name='longitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='attendancelog',
            name='distance_from_office',
            field=models.FloatField(blank=True, help_text='Metres from office at clock-in', null=True),
        ),
    ]
