def send_email_task_proxy(*args, **kwargs):
    """
    Circular-import safe proxy to call the email task.
    Imports are deferred until call time.
    """
    from apps.core.tasks import send_email_task
    return send_email_task.delay(*args, **kwargs)
