from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Tenant(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Announcement(TimeStampedModel):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('NORMAL', 'Normal'),
        ('HIGH', 'High'),
    ]

    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
    title = models.CharField(max_length=255)
    content = models.TextField()
    date = models.DateField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='NORMAL')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='announcements',
    )

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return self.title
