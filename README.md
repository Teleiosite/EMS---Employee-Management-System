# 🏢 EMS — Employee Management System (Frontend + Django Backend)

![React](https://img.shields.io/badge/React-19.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Django](https://img.shields.io/badge/Django-4.2-green)
![DRF](https://img.shields.io/badge/DRF-3.14-red)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

A full-stack HRMS platform with:
- A modern **React + TypeScript frontend** for Admin, Employee, and Applicant experiences.
- A modular **Django + DRF backend** (`ems-backend/`) with JWT auth, role-based permissions, and production-oriented configuration.

---

## 📌 Table of Contents

- [1) Product Overview](#1-product-overview)
- [2) Core Features](#2-core-features)
- [3) Architecture Overview](#3-architecture-overview)
- [4) Tech Stack](#4-tech-stack)
- [5) Repository Structure](#5-repository-structure)
- [6) Local Development Setup](#6-local-development-setup)
- [7) Environment Variables](#7-environment-variables)
- [8) Test & Quality Commands](#8-test--quality-commands)
- [9) Deployment Notes](#9-deployment-notes)
- [10) Recommended Next Steps (Vibe Coding Roadmap)](#10-recommended-next-steps-vibe-coding-roadmap)

---

## 1) Product Overview

EMS is designed as a practical HR system covering:
- **People Operations**: employees, departments, attendance, leave, payroll.
- **Recruitment Operations**: jobs, candidates, and resume handling.
- **Role-Based Workflows**:
  - **Admin / HR Manager**: management and approval actions.
  - **Employee**: self-service profile, attendance, leave, payroll visibility.
  - **Applicant**: job browsing and application lifecycle.

---

## 2) Core Features

### Admin & HR
- Employee and department management
- Attendance monitoring and review
- Leave approval workflows
- Payroll run management (scaffolded backend APIs)
- Recruitment pipeline management

### Employees
- Attendance tracking
- Leave request submission and status
- Personal profile visibility

### Applicants
- Job browsing
- Application submission and tracking

---

## 3) Architecture Overview

### Frontend
- React 19 SPA with route-based role separation
- Mock/service layer for domain data handling in UI flows

### Backend (`ems-backend/`)
- Django project split into apps:
  - `authentication`, `employees`, `attendance`, `leaves`, `payroll`, `recruitment`, `core`
- DRF API endpoints with JWT authentication
- Role-based permission layer for Admin/HR and self-service boundaries
- Docker + Celery + Redis + PostgreSQL ready runtime templates

---

## 4) Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Backend
- Django 4.2
- Django REST Framework
- SimpleJWT
- Celery + Redis
- PostgreSQL
- drf-spectacular (OpenAPI docs)

### DevOps / Ops
- Docker / docker-compose
- Gunicorn + Nginx templates
- GitHub Actions backend CI workflow

---

## 5) Repository Structure

```text
EMS---Employee-Management-System/
├── App.tsx
├── pages/
├── components/
├── services/
├── context/
├── types.ts
├── package.json
├── ems-backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── ems_core/
│   ├── apps/
│   ├── config/
│   ├── scripts/
│   └── tests/
└── .github/workflows/backend-ci.yml
```

---

## 6) Local Development Setup

### A) Frontend

1. Install dependencies
```bash
npm install
```

2. Start frontend
```bash
npm run dev
```

3. Open app
- `http://localhost:5173`

### B) Backend

1. Enter backend folder
```bash
cd ems-backend
```

2. Create env file
```bash
cp .env.example .env
```

3. Start backend stack
```bash
docker compose up --build
```

4. Run migrations
```bash
docker compose exec web python manage.py makemigrations
docker compose exec web python manage.py migrate
```

5. Optional: API docs
- `http://localhost:8000/api/docs/`

---

## 7) Environment Variables

Backend variables live in `ems-backend/.env` (template in `.env.example`).

Key groups:
- **Security**: `SECRET_KEY`, `ALLOWED_HOSTS`, CORS/CSRF settings
- **Database**: `DB_*`
- **Celery**: broker/result backend
- **API Behavior**: throttle limits, page size
- **IP Control**: whitelist toggle and values

---

## 8) Test & Quality Commands

### Frontend
```bash
npm run build
```

### Backend
```bash
cd ems-backend
PYTHONPATH=. python -m compileall .
PYTHONPATH=. pytest -q
```

---

## 9) Deployment Notes

For production rollout, use:
- `ems-backend/Dockerfile`
- `ems-backend/docker-compose.yml`
- `ems-backend/config/nginx.conf`
- `ems-backend/config/gunicorn.conf.py`
- `ems-backend/config/systemd/*.service`

Recommended environment strategy:
1. Keep `.env` secret in deployment platform vault.
2. Use separate values for staging and production.
3. Enforce branch protection + required CI checks.

---

## 10) Recommended Next Steps (Vibe Coding Roadmap)

Use this sequence to keep momentum and avoid rework.

### Step 1 — Finalize Data Layer (High Priority)
- Generate and commit real Django migrations for all apps.
- Validate constraints and indexes.
- Add seed scripts for realistic staging test data.

### Step 2 — Lock Security & Auth Flows
- Add MFA/TOTP flows (if required by your policy).
- Add login attempt throttling + lockout logic.
- Add password reset + email verification flow.

### Step 3 — Complete Business Logic
- Payroll calculation rules (allowances/deductions/tax slabs).
- Leave balances and policy windows.
- Attendance corrections approval lifecycle.

### Step 4 — Add Serious Tests
- API tests for each role (Admin/HR/Employee/Applicant).
- Object-level permission tests.
- End-to-end smoke tests for critical journeys.

### Step 5 — Observability & Reliability
- Add structured logging standards.
- Add error monitoring (e.g., Sentry) and health dashboards.
- Add backup/restore drill for DB.

### Step 6 — Release Workflow (Production)
1. Feature branch -> PR
2. CI green -> code review
3. Merge -> deploy to staging
4. Staging QA signoff
5. Production deploy + post-deploy smoke checks

### Step 7 — Vibe Coding Rhythm (Weekly)
- **Mon**: Pick 1 domain and define acceptance criteria.
- **Tue-Wed**: Implement APIs + UI integration.
- **Thu**: Test hardening + edge cases.
- **Fri**: Demo, retro, and backlog grooming.

---

## 🤝 Contribution Guidance

- Keep PRs focused by domain (auth, attendance, leaves, etc.)
- Add or update tests with each behavior change
- Update docs when API contracts change

---

## 📄 License

MIT (or your preferred project license).
