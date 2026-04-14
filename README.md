<div align="center">

<img src="https://img.icons8.com/fluency/96/building.png" alt="EMS Logo" width="80"/>

# HireWix — Employee Management System (EMS)

**A production-ready, multi-tenant SaaS HR platform built for fast-growing companies.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-yourems.duckdns.org-orange?style=for-the-badge)](https://yourems.duckdns.org)
[![Backend](https://img.shields.io/badge/Backend-Django_4.2-green?style=for-the-badge&logo=django)](https://djangoproject.com)
[![Frontend](https://img.shields.io/badge/Frontend-React_19_+_TypeScript-blue?style=for-the-badge&logo=react)](https://reactjs.org)
[![Database](https://img.shields.io/badge/Database-Supabase_Postgres-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Storage](https://img.shields.io/badge/Storage-Oracle_Object_Storage-red?style=for-the-badge&logo=oracle)](https://cloud.oracle.com)
[![AI](https://img.shields.io/badge/AI-Google_Gemini-blueviolet?style=for-the-badge&logo=google)](https://ai.google.dev)

</div>

---

## 🌟 Overview

HireWix is a full-stack, **multi-tenant** Employee Management System that allows any company to **register a workspace**, add employees, manage payroll, track attendance, handle recruitment pipelines, and make company-wide announcements — all from a single, clean interface.

Built with a **Hybrid Cloud Architecture**, HireWix leverages the best-of-breed services for maximum stability and scale:
- 🏦 **Database**: Supabase PostgreSQL (Production-grade, high concurrency).
- 📦 **Storage**: Oracle Object Storage (Unlimited scale for heavy files & backups).
- 🤖 **Intelligence**: Google Gemini (Semantic resume parsing).

---

## 🆕 What's New — Tier 1 Enterprise Release

This release transforms HireWix into a market-leading SaaS with several advanced modules and **Interactive Admin Dashboards**:

### 📊 Business Intelligence & Transparency (NEW)
- **Interactive Org Chart**: Visualize your company's reporting lines with a dynamic, zoomable tree (built with `react-flow`).
- **Audit Log Dashboard**: A searchable security ledger for admins to track every data mutation, complete with JSON diffs and IP metadata.
- **Workforce Sentiment Insights**: Real-time analytics on employee happiness trends and survey engagement via visual charts (built with `recharts`).

### 💼 SaaS Monetization & Billing
- **Automated Billing**: Integrated **Paystack & Paystack Inline** for secure, automated subscription management.
- **Subscription Tiers**: Support for `Starter`, `Business`, and `Enterprise` tiers with automatic seat-limit enforcement (e.g., 25/100/Unlimited employees).
- **Real-time Status**: Dynamic usage tracking that prevents adding employees beyond your current plan limit.

### 🕵️‍♂️ Enterprise Foundation
- **Activity Tracking**: Every data mutation (`CREATE`, `UPDATE`, `DELETE`) is automatically logged via `AuditLogMiddleware`.
- **Org Hierarchy**: Recursive reporting lines (`reports_to`) fully supported in both Backend and Frontend forms.

### 📄 Document Management & Expiry Alerts
- **Secure Storage**: Dedicated module for storing Passports, Visas, and Contracts in **Oracle Object Storage**.
- **Automated Alerts**: A daily Celery task scans for documents expiring within 30 days and sends automated email alerts to HR admins.

---

## 🏗️ Architecture

### Hybrid Cloud Data Flow

```mermaid
graph TD
    User((User)) --> FE[React Frontend]
    FE --> Django[Django API - Oracle VM]
    Django --> Supabase[(Supabase Postgres)]
    Django --> OCI[Oracle Object Storage]
    Django --> Redis[(Redis)]
    Redis --> Celery[Celery Worker]
    Celery --> Gemini[Google Gemini AI]
    Celery --> EMAIL[Brevo SMTP]
    Celery --> OCI_BACKUP[Automated Backups]
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS.
- **Backend**: Django 4.2, DRF, Celery, Redis.
- **Cloud Infrastructure**:
  - **Compute**: Oracle Cloud Infrastructure (Always Free VM).
  - **Database**: Supabase (PostgreSQL).
  - **Storage**: Oracle Object Storage (S3-Compatible).
  - **Payments**: Paystack / Flutterwave.
  - **AI**: Google Gemini Flash.

---

## 🚀 Getting Started

```bash
# Frontend
npm install --legacy-peer-deps
npm run dev

# Backend
cd ems-backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 🔐 Environment Configuration
Copy the `.env.example` to `.env` and fill in your:
- `DB_HOST` (Supabase connection)
- `AWS_S3_ACCESS_KEY_ID` (Oracle OCI keys)
- `PAYSTACK_SECRET_KEY` (Billing)

---

## 🔐 Security & Data Privacy

HireWix is designed with an "Enterprise-First" security mindset, ensuring that sensitive HR data remains isolated, auditable, and private.

### 🛡️ Multi-Tenant Isolation
The platform uses **Strict Partitioning** to ensure that data from different companies never mixes.
- **ORM Enforcement**: Every database query is automatically scoped to the current user's `Tenant` via a custom `TenantManager`.
- **Middleware Guard**: A tenant-resolution middleware ensures that users can only access resources associated with their authenticated Workspace.
- **Cross-Tenant Safety**: Even with a valid ID, a user from "Company A" cannot view or modify a record belonging to "Company B".

### 🔎 System-Wide Audit Trail
Accountability is built into the core of the platform through automated mutation tracking.
- **Automatic Logging**: Every data-modifying action (`CREATE`, `UPDATE`, `DELETE`) is captured by the `AuditLogMiddleware`.
- **Metadata Capture**: Logs include the User, Tenant, Resource, Action Type, IP Address, User-Agent, and a JSON payload of the changes.
- **Security Dashboard**: Admins have access to a searchable ledger of all system activity to identify suspicious behavior or track data history.

### 🤫 Privacy-First Analytics
Workforce sentiment data (Pulse Surveys) is handled with **Anonymized Aggregation**.
- **Trend Visualization**: Admins see happiness trends, engagement rates, and mood distributions.
- **Identity Shielding**: The Analytics Dashboard does not display individual employee names alongside their mood ratings, protecting employee privacy while providing actionable insights to leadership.

### 🛂 Access Control & Integrity
- **RBAC (Role-Based Access Control)**: Granular permissions restrict sensitive modules (Payroll, Audit Logs, AI Settings) to authorized `ADMIN` or `HR_MANAGER` roles.
- **ID Collision Protection**: Bulk import logic includes integrity checks to prevent duplicate `EmployeeIDs` within a single tenant, ensuring data consistency.
- **Sensitive Field Filtering**: Audit logs automatically strip sensitive data like passwords or authentication tokens before storage.

---

## 🔮 Roadmap

Read our **[Future Roadmap & Vision Document](./FUTURE_ROADMAP.md)** for the next 20+ planned features including VR Onboarding and Blockchain Credentialing.

---

<div align="center">
  Built with ❤️ · Powered by Supabase, Oracle, and Google Gemini AI
</div>
