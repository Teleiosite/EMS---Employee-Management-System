from celery import shared_task


@shared_task
def recompute_attendance_summary(employee_profile_id: int):
    return {'employee_profile_id': employee_profile_id, 'status': 'queued'}
