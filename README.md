# EMS — Employee Management System

[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-61DAFB)](#frontend)
[![Backend](https://img.shields.io/badge/backend-Django%20%2B%20DRF-0C4B33)](#backend)
[![Auth](https://img.shields.io/badge/auth-JWT%20%2B%20MFA-orange)](#authentication--security)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF)](#ci--quality-gates)

A production-oriented, full-stack HR platform with dedicated role experiences for **Admin/HR**, **Employee**, and **Applicant** users.

---

## Table of Contents

- [1. Product Overview](#1-product-overview)
- [2. Capabilities by Domain](#2-capabilities-by-domain)
- [3. System Architecture](#3-system-architecture)
- [4. Tech Stack](#4-tech-stack)
- [5. Repository Layout](#5-repository-layout)
- [6. Quick Start](#6-quick-start)
- [7. Detailed Local Setup](#7-detailed-local-setup)
- [8. Environment Variables](#8-environment-variables)
- [9. Authentication & Security](#9-authentication--security)
- [10. Backend API Modules](#10-backend-api-modules)
- [11. Testing Strategy](#11-testing-strategy)
- [12. CI & Quality Gates](#12-ci--quality-gates)
- [13. Operations & Deployment](#13-operations--deployment)
- [14. Data & Seeding](#14-data--seeding)
- [15. Roadmap & Delivery Rhythm](#15-roadmap--delivery-rhythm)
- [16. Contribution Guidelines](#16-contribution-guidelines)
- [17. License](#17-license)

---

## 1. Product Overview

EMS is designed to cover core HR and recruitment workflows in one system:

- **People Operations**: departments, employee profiles, attendance, leave, payroll.
- **Recruitment**: job postings, candidate applications, resume processing.
- **Role-sensitive UX**:
  - **Admin/HR Manager**: approvals, governance, and management actions.
  - **Employee**: self-service attendance, leave requests, payroll visibility.
  - **Applicant**: job browsing, profile and application journey.

The repository contains both:
- A **React + TypeScript frontend** (root)
- A **Django + DRF backend** (`ems-backend/`)

---

## 2. Capabilities by Domain

### Admin / HR
- Employee and department lifecycle management.
- Attendance monitoring and correction review lifecycle.
- Leave policy, leave balance, and request approval workflows.
- Payroll runs, salary structures/components, tax slab configuration, payslips.
- Recruitment management for jobs and candidate pipeline.

### Employee
- View and track personal attendance records.
- Submit leave requests against policy windows.
- Access personal payslip/payroll records.

### Applicant
- Register/login and browse open job opportunities.
- Track application progress.

---

## 3. System Architecture

### Frontend
- React SPA with role-based routes and layouts.
- Service layer supports backend integration and controlled fallback behavior.
- Built via Vite for fast local development and optimized production builds.

### Backend
- Django project with modular apps:
  - `authentication`
  - `employees`
  - `attendance`
  - `leaves`
  - `payroll`
  - `recruitment`
  - `core`
- DRF APIs with JWT auth (SimpleJWT).
- Role and object-level permission controls.
- Migration-driven schema management.

### Runtime & Platform Components
- Docker / docker-compose assets.
- Gunicorn + Nginx templates.
- Celery + Redis scaffolding for async/background work.

---

## 4. Tech Stack

### Frontend
- React 19
- TypeScript 5
- Vite
- Tailwind CSS
- React Router

### Backend
- Django 4.2
- Django REST Framework
- django-filter
- SimpleJWT
- drf-spectacular (OpenAPI docs)
- PostgreSQL (primary production target)
- SQLite (fast CI/test fallback profile)

### Ops / Reliability
- Docker & Compose
- Celery + Redis
- python-json-logger / structlog (available)
- sentry-sdk (available)
- GitHub Actions

---

## 5. Repository Layout

```text
EMS---Employee-Management-System/
├── App.tsx
├── components/
├── context/
├── pages/
├── services/
├── types.ts
├── package.json
├── README.md
├── .github/
│   └── workflows/
│       └── backend-ci.yml
└── ems-backend/
    ├── manage.py
    ├── requirements.txt
    ├── apps/
    ├── ems_core/
    ├── scripts/
    ├── tests/
    ├── docker-compose.yml
    └── Dockerfile
```

---

## 6. Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Python 3.10+
- (Optional) Docker Desktop

### Fastest local start

```bash
# 1) frontend
npm install
npm run dev

# 2) backend (new terminal)
cd ems-backend
pip install -r requirements.txt
cp .env.example .env  # if available
python manage.py migrate
python manage.py runserver
```

Frontend default: `http://localhost:5173`  
Backend default: `http://localhost:8000`

---

## 7. Detailed Local Setup

### A. Frontend

```bash
npm install
npm run dev
```

Production build check:

```bash
npm run build
```

### B. Backend (native Python)

```bash
cd ems-backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### C. Backend (Docker)

```bash
cd ems-backend
docker compose up --build
```

Then apply migrations (inside container):

```bash
docker compose exec web python manage.py migrate
```

### D. API Docs

- OpenAPI schema: `http://localhost:8000/api/schema/`
- Swagger UI: `http://localhost:8000/api/docs/`

---

## 8. Environment Variables

Backend config is env-driven. Typical variable groups:

### Core
- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`

### Database
- `DB_ENGINE`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DB_CONN_MAX_AGE`

### API / DRF
- `PAGE_SIZE`
- `THROTTLE_USER`
- `THROTTLE_ANON`

### CORS / CSRF
- `CORS_ALLOW_ALL_ORIGINS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`

### Celery / Redis
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`

### Network Guardrails
- `IP_WHITELIST_ENABLED`
- `IP_WHITELIST`

---

## 9. Authentication & Security

Current backend security implementation includes:

- JWT login/refresh flows.
- Role-aware registration constraints.
- Login attempt auditing.
- Failed login lockout window.
- MFA/TOTP setup + verification endpoints.
- Password reset request/confirm token flows.
- Email verification token flows.
- Object-level permissions for self-service boundaries.

> Note: verify policy requirements before enforcing MFA as mandatory for all roles.

---

## 10. Backend API Modules

### `authentication`
User model, JWT login/refresh, MFA, password reset, email verification, login attempt logs.

### `employees`
Department and employee profile models/API.

### `attendance`
Attendance logs plus correction request lifecycle.

### `leaves`
Leave types, policy windows, balances, and requests.

### `payroll`
Salary components/structures, payroll runs, tax slabs, payslips.

### `recruitment`
Job postings and candidate entities.

---

## 11. Testing Strategy

### Backend checks

```bash
cd ems-backend
PYTHONPATH=. python -m compileall .
PYTHONPATH=. pytest -q
```

### Frontend checks

```bash
npm run build
```

### Notes
- CI is configured to run backend tests with SQLite defaults for reliability.
- Domain-level tests include integration utilities and API flow coverage.

---

## 12. CI & Quality Gates

Backend CI workflow (`.github/workflows/backend-ci.yml`) runs:

1. Dependency install
2. Python compile validation
3. Pytest suite

Recommended branch policy:
- Require CI success before merge.
- Require at least one code review approval.
- Squash merge for linear history (optional but recommended).

---

## 13. Operations & Deployment

Deployment assets available under `ems-backend/`:

- `Dockerfile`
- `docker-compose.yml`
- `config/nginx.conf`
- `config/gunicorn.conf.py`
- `config/systemd/*.service`

Recommended promotion flow:
1. Feature branch -> PR
2. CI green + review
3. Merge to main
4. Deploy to staging
5. QA signoff
6. Production deploy
7. Post-deploy smoke checks

---

## 14. Data & Seeding

The backend includes a seed utility for realistic staging baselines (admin/HR/employee records, leave/policy structures, attendance, salary/tax and payslip entities).

Run from Django shell:

```bash
cd ems-backend
python manage.py shell -c "from scripts.seed_data import run; run()"
```

Use seeded data only in local/staging, never in production.

---

## 15. Roadmap & Delivery Rhythm

### Priority sequence
1. Finalize data layer and migration hygiene.
2. Harden security and auth flows.
3. Complete business logic depth.
4. Expand role-based API and permission tests.
5. Improve observability/reliability (monitoring + backup drills).
6. Enforce production-grade release workflow.

### Weekly rhythm
- **Mon**: pick one domain and define acceptance criteria.
- **Tue-Wed**: implement API + UI integration.
- **Thu**: edge cases + hardening tests.
- **Fri**: demo, retro, backlog refinement.

---

## 16. Contribution Guidelines

- Keep changes domain-focused and small when possible.
- Update tests with behavior changes.
- Update docs when routes/contracts/config change.
- Favor explicit migrations over implicit schema drift.

---

## 17. License

MIT (or your preferred organization license policy).
