from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60, # 1 minute
)
def send_email_task(self, subject, message, recipient_list, from_email=None, html_message=None):
    """
    Background task to send emails with retry logic.
    """
    from_email = from_email or settings.DEFAULT_FROM_EMAIL
    
    try:
        logger.info(f"Starting email dispatch: {subject} to {recipient_list}")
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False
        )
        return f"Successfully sent email to {len(recipient_list)} recipients"
    except Exception as exc:
        logger.error(f"Error sending email: {exc}. Retrying...")
        # Retry with exponential backoff if possible, or simple retry
        raise self.retry(exc=exc)
