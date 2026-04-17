from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import EmployeeDocument
from ems_core.utils_email import send_tenant_email

@shared_task
def check_document_expiry():
    """
    Daily task to check for documents expiring within 30 days.
    Sends an email alert to the company HR/Admin.
    """
    warning_date = timezone.now().date() + timedelta(days=30)
    expiring_docs = EmployeeDocument.objects.filter(
        expiry_date__lte=warning_date,
        is_notified=False,
        employee__is_deleted=False
    ).select_related('employee', 'tenant')

    for doc in expiring_docs:
        subject = f"Document Expiry Alert: {doc.employee.full_name}"
        message = (
            f"The {doc.doc_type} for {doc.employee.full_name} is set to expire on {doc.expiry_date}.\n\n"
            f"Document Title: {doc.title}\n"
            "Please ensure that renewal processes are initiated if necessary."
        )
        
        # Get the primary contact (ADMIN) for the tenant
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admin_user = User.objects.filter(tenant=doc.tenant, role='ADMIN', is_active=True).first()
        admin_email = admin_user.email if admin_user else None
        
        if admin_email:
            send_tenant_email(
                tenant=doc.tenant,
                subject=subject,
                message=message,
                recipient_list=[admin_email]
            )
            doc.is_notified = True
            doc.save(update_fields=['is_notified'])
