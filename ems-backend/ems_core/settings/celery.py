from celery import Celery
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ems_core.settings.development')
app = Celery('ems_core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
