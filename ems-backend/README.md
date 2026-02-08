# EMS Backend (Django)

Production-leaning backend scaffold for EMS with JWT auth, modular apps, Celery tasks, and Dockerized local runtime.

## Quick start

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Start stack:
   ```bash
   docker compose up --build
   ```
3. Run migrations:
   ```bash
   docker compose exec web python manage.py makemigrations
   docker compose exec web python manage.py migrate
   ```

## Included domains
- Authentication (custom user + JWT)
- Employee management
- Attendance and corrections
- Leave requests
- Payroll structure and run skeleton
- Recruitment (job postings + candidates)

## Production checklist highlights
- Split settings for development/production/security/logging
- IP whitelist middleware (toggleable)
- OpenAPI schema via drf-spectacular
- Celery worker baseline
- Nginx/Gunicorn/Systemd/Supervisor templates
