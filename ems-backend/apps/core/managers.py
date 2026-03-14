from django.db import models

class TenantManager(models.Manager):
    """
    Custom manager that provides a shortcut for filtering by tenant.
    """
    def for_tenant(self, tenant):
        if not tenant:
            return self.none()
        return self.filter(tenant=tenant)
