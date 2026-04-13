from django.db import models
from apps.core.models import Tenant, TimeStampedModel

class SubscriptionTier(models.TextChoices):
    FREE = 'FREE', 'Trial / Free'
    STARTER = 'STARTER', 'Starter'
    BUSINESS = 'BUSINESS', 'Business'
    ENTERPRISE = 'ENTERPRISE', 'Enterprise'

class Subscription(TimeStampedModel):
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='subscription')
    tier = models.CharField(max_length=20, choices=SubscriptionTier.choices, default=SubscriptionTier.FREE)
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    paystack_subscription_code = models.CharField(max_length=100, blank=True, null=True)
    paystack_customer_code = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.tenant.name} - {self.tier}"

class Transaction(TimeStampedModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='NGN')
    reference = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return f"{self.tenant.name} - {self.reference} ({self.status})"
