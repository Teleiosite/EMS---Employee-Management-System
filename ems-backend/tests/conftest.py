import os
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ems_core.settings.development')
os.environ.setdefault('DB_ENGINE', 'django.db.backends.sqlite3')
os.environ.setdefault('DB_NAME', str(Path(__file__).resolve().parent / 'test_db.sqlite3'))
