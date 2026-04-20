from .base import *  # noqa
from datetime import timedelta
from pathlib import Path

DEBUG = True

# Use SQLite for local development only if no engine is specified in .env
if 'DATABASES' not in globals() or config('DB_ENGINE', default=None) is None:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': Path(__file__).resolve().parents[2] / 'db.sqlite3',
        }
    }

# Allow all hosts in development
ALLOWED_HOSTS = ['*']

# CORS — allow Vite dev server
CORS_ALLOW_ALL_ORIGINS = True

# SECURITY: Disable SSL redirect and set cookies to non-Secure for local HTTP development.
# In production (production.py) security.py sets these to True automatically.
SECURE_SSL_REDIRECT = False
JWT_COOKIE_SECURE = False       # Cookies work over plain HTTP on localhost
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0

# Longer token lifetime in development so sessions don't expire during testing
SIMPLE_JWT = {
    **{k: v for k, v in globals().get('SIMPLE_JWT', {}).items()},
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Extend cookie max-age to match longer dev token lifetimes
JWT_ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24        # 1 day
JWT_REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days

