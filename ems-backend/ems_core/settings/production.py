from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa
from .logging import *  # noqa
from .security import *  # noqa

DEBUG = False

if SECRET_KEY == 'unsafe-dev-key':
    raise ImproperlyConfigured('SECRET_KEY must be set in production.')

if '*' in ALLOWED_HOSTS:
    raise ImproperlyConfigured('ALLOWED_HOSTS cannot contain wildcard in production.')

if CORS_ALLOW_ALL_ORIGINS:
    raise ImproperlyConfigured('CORS_ALLOW_ALL_ORIGINS must be False in production.')

# Email Configuration (Gmail App Passwords)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'seye4kunmi@gmail.com'
EMAIL_HOST_PASSWORD = 'dewc zulv wpkg eyjn'
DEFAULT_FROM_EMAIL = 'EMS Dashboard <seye4kunmi@gmail.com>'
