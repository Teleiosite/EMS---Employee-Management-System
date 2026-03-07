from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0003_attendancecorrectionrequest_requested_clock_in_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='AttendancePolicy',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('check_in_start', models.TimeField(help_text='Earliest allowed clock-in (e.g. 07:00)')),
                ('check_in_end', models.TimeField(help_text='On-time clock-in deadline (e.g. 09:00)')),
                ('late_grace_minutes', models.PositiveIntegerField(default=15, help_text='Minutes after check_in_end before marked LATE')),
                ('absent_if_no_checkin_by', models.TimeField(help_text='Time after which no clock-in = ABSENT (e.g. 11:00)')),
                ('half_day_if_checkout_before', models.TimeField(help_text='Clock-out before this = HALF_DAY (e.g. 13:00)')),
                ('check_out_start', models.TimeField(help_text='Earliest allowed clock-out (e.g. 16:00)')),
                ('check_out_end', models.TimeField(help_text='Expected end of work day (e.g. 18:00)')),
                ('is_active', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'verbose_name': 'Attendance Policy', 'verbose_name_plural': 'Attendance Policies', 'ordering': ['-updated_at']},
        ),
        migrations.AddField(
            model_name='attendancelog',
            name='device_fingerprint',
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
        migrations.AddField(
            model_name='attendancelog',
            name='is_suspicious',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name='attendancelog',
            name='suspicious_reason',
            field=models.TextField(blank=True),
        ),
    ]
