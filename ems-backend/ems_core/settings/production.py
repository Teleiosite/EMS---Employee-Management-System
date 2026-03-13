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
