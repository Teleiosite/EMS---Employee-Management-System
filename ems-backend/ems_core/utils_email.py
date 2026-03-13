import threading
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class EmailThread(threading.Thread):
    def __init__(self, subject, message, recipient_list, from_email=None, html_message=None):
        self.subject = subject
        self.message = message
        self.recipient_list = recipient_list
        self.from_email = from_email or settings.DEFAULT_FROM_EMAIL
        self.html_message = html_message
        threading.Thread.__init__(self)

    def run(self):
        try:
            send_mail(
                subject=self.subject,
                message=self.message,
                from_email=self.from_email,
                recipient_list=self.recipient_list,
                html_message=self.html_message,
                fail_silently=False
            )
            logger.info(f"Successfully sent threaded email: '{self.subject}' to {len(self.recipient_list)} recipients.")
        except Exception as e:
            logger.error(f"Failed to send threaded email '{self.subject}': {str(e)}")


def send_email_in_background(subject, message, recipient_list, html_message=None):
    """
    Utility function to instantly return an HTTP response to the user while
    dispatching an email (or bulk emails) via a secondary thread.
    """
    if not recipient_list:
        return
        
    EmailThread(
        subject=subject,
        message=message,
        recipient_list=recipient_list,
        html_message=html_message
    ).start()
