from celery import shared_task


@shared_task
def generate_monthly_payroll(payroll_run_id: int):
    return {'payroll_run_id': payroll_run_id, 'status': 'queued'}
