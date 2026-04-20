from datetime import timedelta
from pathlib import Path
import oracledb
import sys

# Oracle Cloud compatibility: Make the app think oracledb is the old cx_Oracle driver
oracledb.version = "8.3.0"
sys.modules["cx_Oracle"] = oracledb

# Oracle 23ai returns JSON fields as native Python objects (list/dict) instead of
# strings. Patch Django's JSONField.from_db_value to handle either case.
from django.db.models.fields.json import JSONField as _JSONField
_original_from_db = _JSONField.from_db_value
def _patched_from_db(self, value, expression, connection):
    if isinstance(value, (list, dict)):
        return value  # Already parsed natively by Oracle driver
    return _original_from_db(self, value, expression, connection)
_JSONField.from_db_value = _patched_from_db

from decouple import config

BASE_DIR = Path(__file__).resolve().parents[2]
SECRET_KEY = config('SECRET_KEY', default='unsafe-dev-key')
DEBUG = config('DEBUG', cast=bool, default=False)

if not DEBUG and SECRET_KEY == 'unsafe-dev-key':
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured('SECRET_KEY must be set to a secure value in production.')

ALLOWED_HOSTS = [h.strip() for h in config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',') if h.strip()]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',  # Required for BLACKLIST_AFTER_ROTATION
    'django_filters',
    'drf_spectacular',
    'django_celery_beat',
    'django_celery_results',
    'apps.authentication',
    'apps.employees',
    'apps.attendance',
    'apps.leaves',
    'apps.payroll',
    'apps.recruitment',
    'apps.billing',
    'apps.surveys',
    'apps.core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'ems_core.middleware.TenantContextMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'ems_core.middleware.IPWhitelistMiddleware',
    'ems_core.middleware_audit.AuditLogMiddleware',
]

ROOT_URLCONF = 'ems_core.urls'
WSGI_APPLICATION = 'ems_core.wsgi.application'
ASGI_APPLICATION = 'ems_core.asgi.application'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

DB_ENGINE_VAL = config('DB_ENGINE', default='postgresql')

if DB_ENGINE_VAL == 'oracle':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.oracle',
            'NAME': config('DB_HOST'),  # For Autonomous DB, the full connection string goes here
            'USER': config('DB_USER'),
            'PASSWORD': config('DB_PASSWORD'),
            'HOST': '',
            'PORT': '',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql' if DB_ENGINE_VAL == 'postgresql' else 'django.db.backends.sqlite3',
            'NAME': config('DB_NAME', default=BASE_DIR / 'db.sqlite3' if DB_ENGINE_VAL == 'sqlite' else 'postgres'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default=''),
            'PORT': config('DB_PORT', default='5432'),
        }
    }

AUTH_USER_MODEL = 'authentication.CustomUser'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.authentication.cookie_auth.CookieJWTAuthentication',  # httpOnly cookie auth
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': config('PAGE_SIZE', cast=int, default=25),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'user': config('THROTTLE_USER', default='300/hour'),
        'anon': config('THROTTLE_ANON', default='50/hour'),
        'auth': '10/minute',     # Limit login attempts
        'invite': '20/day',      # Limit invite generation
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# --- JWT Cookie Configuration ---
JWT_COOKIE_NAME = 'access_token'
JWT_REFRESH_COOKIE_NAME = 'refresh_token'
JWT_COOKIE_SAMESITE = 'Lax'   # 'Strict' is safest but breaks cross-port dev
JWT_COOKIE_HTTPONLY = True
JWT_ACCESS_COOKIE_MAX_AGE = 60 * 30           # 30 minutes (matches ACCESS_TOKEN_LIFETIME)
JWT_REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 # 7 days (matches REFRESH_TOKEN_LIFETIME)
# JWT_COOKIE_SECURE is set in security.py (True in production, False in dev)

SPECTACULAR_SETTINGS = {
    'TITLE': 'HireWix API',
    'DESCRIPTION': 'HireWix API',
    'VERSION': '1.0.0',
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Use Oracle Object Storage (S3-compatible) for Media if configured
USE_S3 = config('USE_S3', cast=bool, default=False)

if USE_S3:
    INSTALLED_APPS += ['storages']
    AWS_ACCESS_KEY_ID = config('AWS_S3_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = config('AWS_S3_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = config('AWS_S3_BUCKET_NAME')
    AWS_S3_ENDPOINT_URL = config('AWS_S3_ENDPOINT_URL')  # Oracle OCI S3-compatible endpoint
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME')
    AWS_DEFAULT_ACL = None
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    # Oracle Object Storage URL format: https://<namespace>.objectstorage.<region>.oraclecloud.com/n/<namespace>/b/<bucket>/o/
    OCI_NAMESPACE = config('OCI_NAMESPACE', default='')
    MEDIA_URL = f'https://{OCI_NAMESPACE}.objectstorage.{AWS_S3_REGION_NAME}.oraclecloud.com/n/{OCI_NAMESPACE}/b/{AWS_STORAGE_BUCKET_NAME}/o/'
else:
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://redis:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://redis:6379/1')
CELERY_TASK_ALWAYS_EAGER = config('CELERY_TASK_ALWAYS_EAGER', cast=bool, default=False)

CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', cast=bool, default=False)
CORS_ALLOWED_ORIGINS = [o.strip() for o in config('CORS_ALLOWED_ORIGINS', default='http://localhost:5173,http://localhost:3000').split(',') if o.strip()]
CORS_ALLOW_CREDENTIALS = True   # Required so browser sends httpOnly cookies on cross-origin requests
CSRF_TRUSTED_ORIGINS = [o.strip() for o in config('CSRF_TRUSTED_ORIGINS', default='http://localhost:5173,http://localhost:3000').split(',') if o.strip()]

IP_WHITELIST_ENABLED = config('IP_WHITELIST_ENABLED', cast=bool, default=False)
IP_WHITELIST = [ip.strip() for ip in config('IP_WHITELIST', default='127.0.0.1,::1').split(',') if ip.strip()]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 465
EMAIL_USE_SSL = True
EMAIL_USE_TLS = False
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)
