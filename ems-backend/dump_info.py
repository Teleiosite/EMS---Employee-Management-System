import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ems_core.settings.development")
django.setup()

from django.contrib.auth import get_user_model
try:
    from apps.recruitment.models import JobPosting
except ImportError:
    JobPosting = None

User = get_user_model()
print("=== USERS ===")
for u in User.objects.filter(is_active=True):
    tenant = u.tenant.name if hasattr(u, 'tenant') and u.tenant else "None"
    # we don't have cleartext passwords in DB, so we can't show passwords. 
    # Usually the test password is 'testpassword123' or 'admin123' or 'password123'
    print(f"Email: {u.email} | Role: {getattr(u, 'role', 'Unknown')} | Tenant: {tenant}")

print("\n=== JOBS ===")
if JobPosting:
    for j in JobPosting.objects.all():
        tenant = j.tenant.name if hasattr(j, 'tenant') and j.tenant else "None"
        print(f"ID: {j.id} | Title: {j.role_name} | Tenant: {tenant}")
else:
    print("JobPosting model not found.")
