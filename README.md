<div align="center">

# 🏢 EMS — Employee Management System

**A production-ready, full-stack HR platform built for modern organizations.**

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-129.151.189.48-success)](http://129.151.189.48)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?logo=react)](/)
[![Backend](https://img.shields.io/badge/Backend-Django%20%2B%20DRF-0C4B33?logo=django)](./ems-backend)
[![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-orange)](#authentication--security)
[![Deployed on](https://img.shields.io/badge/Deployed%20on-Oracle%20Cloud-red?logo=oracle)](http://129.151.189.48)

</div>

---

## 🌐 Live Demo

> **http://129.151.189.48** — hosted on Oracle Cloud Free Tier (Johannesburg region)

| Portal | Email | Password |
|--------|-------|----------|
| 🛡️ **Admin / HR** | `admin@ems.com` | `admin123` |
| 👤 **Employee** | `john.doe@ems.com` | `123` |
| 🎯 **Applicant** | Register from the app | — |

---

## 📋 Overview

EMS is a full-stack Human Resources Management System covering the complete employee lifecycle — from recruitment and onboarding to attendance, leave management, and payroll — with three dedicated role-based portals for **Admin/HR**, **Employee**, and **Applicant** users.

The system is composed of:
- A **React + TypeScript** single-page application (frontend root)
- A **Django + Django REST Framework** API server (`ems-backend/`)

---

## ✨ Features

### 🛡️ Admin / HR Portal
- Interactive dashboard with real-time stats (headcount, open leaves, payroll totals)
- Full employee lifecycle management (add, edit, deactivate)
- Department management
- Attendance monitoring and correction review
- Leave policy configuration, balance management, and approval workflows
- Payroll runs, salary structures, tax slab configuration, and payslip generation
- Job postings and recruitment candidate pipeline management
- Announcement publishing with instant notification delivery

### 👤 Employee Self-Service Portal
- Personal dashboard with attendance summary and announcements
- Clock in / clock out with real-time status
- Leave request submission and balance tracking
- Payslip history with **PDF download** (generated via ReportLab)
- Profile management

### 🎯 Applicant / Career Portal
- Job board with open position listings
- Application submission and status tracking
- Applicant profile management

---

## ⚠️ Known Issues

| Issue | Status | Description |
|-------|--------|-------------|
| **Intermittent Login Failure** | Under Investigation | Users may encounter a `Failed to fetch` error (with HTML parsing errors in the console) when attempting to log in again after previously logging out. This affects all portals (Admin, Employee, Applicant) and is currently being diagnosed on the Oracle Cloud environment. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Oracle Cloud VM                   │
│  ┌────────────┐      ┌──────────────────────────┐  │
│  │   Nginx    │─────▶│   React (Static Files)   │  │
│  │  :80       │      └──────────────────────────┘  │
│  │            │      ┌──────────────────────────┐  │
│  │  /api/*    │─────▶│  Gunicorn + Django DRF   │  │
│  │  /admin/*  │      │  :8000 (localhost only)  │  │
│  └────────────┘      └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5, Vite, Tailwind CSS, React Router |
| Backend | Django 4.2, DRF, SimpleJWT, drf-spectacular, WhiteNoise |
| Database | SQLite (dev/current) · PostgreSQL (production upgrade path) |
| Server | Gunicorn (WSGI) + Nginx (reverse proxy & static files) |
| Hosting | Oracle Cloud Free Tier — VM.Standard.E2.1.Micro (1 GB RAM) |
| Async | Celery + Redis (scaffolded, tasks run eagerly in current config) |

---

## 📁 Repository Structure

```
EMS---Employee-Management-System/
├── App.tsx                    # Root application component
├── components/                # Shared UI components
├── context/                   # React context providers
├── pages/                     # Route-level page components
│   ├── admin/                 # Admin portal pages
│   ├── applicant/             # Applicant portal pages
│   └── *.tsx                  # Employee & shared pages
├── services/                  # API service layer
├── types.ts                   # Shared TypeScript types
├── deploy.sh                  # Oracle Cloud deploy script
├── DEPLOY_ORACLE.md           # Deployment guide
└── ems-backend/               # Django API server
    ├── apps/
    │   ├── authentication/    # JWT auth, MFA, RBAC
    │   ├── employees/         # Employee & department models
    │   ├── attendance/        # Clock-in/out, corrections
    │   ├── leaves/            # Leave types, requests, balances
    │   ├── payroll/           # Salary, payslips (PDF)
    │   ├── recruitment/       # Jobs, candidates
    │   └── core/              # Shared utilities, permissions
    ├── ems_core/              # Django project settings
    ├── config/                # Nginx, Gunicorn, systemd configs
    ├── scripts/               # Setup admin, seed data
    ├── requirements.txt
    └── Dockerfile
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+, npm 9+
- Python 3.10+

### Frontend

```bash
npm install
npm run dev
# → http://localhost:5173
```

### Backend

```bash
cd ems-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Configure your environment variables
python manage.py migrate
python manage.py setup_admin    # Creates admin@ems.com / admin123
python manage.py runserver
# → http://localhost:8000
```

### Seed Demo Data

```bash
cd ems-backend
source venv/bin/activate
python manage.py shell -c "from scripts.seed_data import run; run()"
```

### API Documentation

| URL | Description |
|-----|-------------|
| `http://localhost:8000/api/docs/` | Swagger UI |
| `http://localhost:8000/api/schema/` | OpenAPI JSON |

---

## ⚙️ Environment Variables

Copy `ems-backend/.env.example` to `ems-backend/.env` and fill in the values:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key (50+ characters) |
| `DEBUG` | `False` in production |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames/IPs |
| `DB_ENGINE` | Database engine (SQLite or PostgreSQL) |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Database credentials |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) allowed to call the API |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF protection |
| `CELERY_BROKER_URL` | Redis URL for async tasks |

---

## 🔐 Authentication & Security

- **JWT** access (30 min) + refresh (7 days) tokens via `djangorestframework-simplejwt`
- **RBAC** — role-based permission classes on every API endpoint (`ADMIN`, `EMPLOYEE`, `APPLICANT`)
- Object-level permissions for self-service boundaries
- Login attempt auditing and failed-login lockout
- **MFA/TOTP** setup and verification endpoints
- IP whitelist middleware (configurable)
- Production settings enforce `SECRET_KEY`, no wildcard `ALLOWED_HOSTS`, `DEBUG=False`

---

## 🧪 Testing

```bash
# Backend
cd ems-backend
pytest -q

# Frontend (build validation)
npm run build
```

CI runs automatically on every push via **GitHub Actions** (`.github/workflows/backend-ci.yml`).

---

## ☁️ Oracle Cloud Deployment

See **[DEPLOY_ORACLE.md](./DEPLOY_ORACLE.md)** for the full step-by-step guide.

**Quick deploy on a fresh Oracle Ubuntu VM:**

```bash
git clone https://github.com/Teleiosite/EMS---Employee-Management-System.git /opt/ems
bash /opt/ems/deploy.sh
```

**Update the live app (from OCI Cloud Shell):**

```bash
# Cloud Shell is not your VM; first SSH into the VM.
ssh -i ~/ems.key ubuntu@<YOUR_VM_PUBLIC_IP>

# Then run deploy on the VM
cd /opt/ems
git pull --ff-only origin main
bash deploy.sh --quick
sudo systemctl status ems-gunicorn --no-pager
sudo systemctl status nginx --no-pager
```


## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  Built with ❤️ · Deployed on Oracle Cloud Free Tier
</div>