from .base import *  # noqa
from pathlib import Path

DEBUG = True

# Use SQLite for local development (no PostgreSQL required)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': Path(__file__).resolve().parents[2] / 'db.sqlite3',
    }
}

# Allow all hosts in development
ALLOWED_HOSTS = ['*']

# CORS settings for development
CORS_ALLOW_ALL_ORIGINS = True
