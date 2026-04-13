import logging
from .tasks_proxy import send_email_task_proxy

logger = logging.getLogger(__name__)

def send_email_in_background(subject, message, recipient_list, html_message=None):
    """
    Utility function to instantly return an HTTP response to the user while
    dispatching an email (or bulk emails) via Celery background workers.
    
    This replaces the older threading-based implementation with a robust 
    distributed task queue.
    """
    if not recipient_list:
        return
        
    try:
        # We use a proxy to avoid circular imports if any apps import from ems_core
        send_email_task_proxy(
            subject=subject,
            message=message,
            recipient_list=recipient_list,
            html_message=html_message
        )
        logger.info(f"Enqueued background email task: '{subject}'")
    except Exception as e:
        # Fallback to standard logging if Celery is down; 
        # normally delay() doesn't fail unless broker is unreachable.
        logger.error(f"Failed to enqueue background email task '{subject}': {str(e)}")
