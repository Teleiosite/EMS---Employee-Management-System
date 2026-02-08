# EMS Backend (Django)

Hardened Django backend foundation for EMS with JWT auth, modular HR apps, Celery workers, and Dockerized runtime.

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
- Authentication (custom user + JWT login/refresh)
- Employee management
- Attendance and corrections
- Leave requests
- Payroll structure and run skeleton
- Recruitment (job postings + candidates)

## Production readiness highlights
- Split settings for development/production/security/logging
- Production guards for secret key, wildcard hosts, and permissive CORS
- IP whitelist middleware (toggleable)
- DRF throttling + pagination defaults
- OpenAPI schema via drf-spectacular
- Role-based API permissions (Admin/HR vs self-service)
- Celery worker baseline + async task stubs
- Nginx/Gunicorn/Systemd/Supervisor templates
- Backend CI workflow for compile + test checks

## Next steps to complete your rollout
- Add and commit real Django migrations (`makemigrations`) for every app.
- Wire object-level audit logging on create/update/delete operations.
- Add end-to-end API tests using `pytest-django` + factory fixtures and enforce CI status checks before merge.
