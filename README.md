# Employee Management System (EMS) with AI Recruitment

A production-grade, full-stack capable Human Resource Management System built with React 19, TypeScript, and Tailwind CSS. This system features role-based access control (Admin, Employee, & Applicant), comprehensive HR workflows, and an integrated AI-powered Recruitment platform.

## 🚀 Implemented Features

### 🔐 Authentication & Security
- **Role-Based Access Control (RBAC)**: Distinct layouts and permissions for Admins, Employees, and Applicants.
- **Mock Authentication**: Secure-flow simulation with credential validation.
- **Unified Login**: Single entry point with automatic role routing.

### 🏢 Admin Dashboard
The command center for HR managers and Administrators.

1.  **Dashboard Overview**: Real-time stats on attendance, leave status, and department metrics.
2.  **Employee Management**:
    *   CRUD operations for employee records.
    *   Search and filter capabilities.
    *   Department and designation assignment.
3.  **Department Management**:
    *   Manage organizational structure.
    *   Track department headcounts.
4.  **Payroll System**:
    *   Generate monthly payroll records.
    *   Calculate base salary, deductions, and net pay.
    *   Process payments and issue status updates.
5.  **Attendance & Leave**:
    *   Monitor daily logs and location IPs.
    *   Approve/Reject leave requests.

### 🤖 AI Recruitment Module
A specialized module connecting Applicants with HR.

**For Admins/HR:**
1.  **Candidate Screening**:
    *   View AI-ranked candidates based on "Fit Score".
    *   Filter by Job Role and Status.
2.  **Resume Parsing**:
    *   Auto-extract details from PDF/DOCX uploads.
    *   Compare skills against Job Requirements.
3.  **Hiring Workflow**:
    *   Shortlist, Interview, or Reject candidates.
    *   Status updates reflect immediately on the Applicant's dashboard.

**For Applicants (New):**
1.  **Job Board**:
    *   Browse open positions.
    *   One-click apply using Resume Upload.
2.  **Application Dashboard**:
    *   Track status (Submitted → Under Review → Interviewing → Hired).
    *   Receive friendly, automated feedback messages.
3.  **Profile Management**:
    *   Manage personal details and bio.

### 👤 Employee Portal
Self-service portal for staff members.

1.  **Personal Dashboard**: Summary of attendance, leave balance, and announcements.
2.  **Attendance Tracker**: Clock In/Out with IP validation.
3.  **Leave Application**: Apply for leave and track approval status.
4.  **My Payslips**: View and download monthly salary slips.

---

## 🛠️ Technical Stack

*   **Framework**: React 19
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Routing**: React Router v7
*   **Icons**: Lucide React
*   **State Management**: React Context & Hooks (In-Memory Mock)
*   **Notifications**: Custom Toast Context System

---

## 💻 Setup Instructions

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```

### 🔑 Demo Login Credentials

| Role | Email | Password | Features |
|------|-------|----------|----------|
| **Admin** | `admin@ems.com` | `admin` | Full Access, HR Ops, Recruitment |
| **Employee** | `john.doe@ems.com` | `123` | Attendance, Leaves, Payslips |
| **Applicant** | `alice.j@example.com` | `123` | Job Board, App Tracking, Profile |

---

## 🚧 Roadmap

1.  **Backend Integration**: Connect to Node.js/Express & PostgreSQL.
2.  **Real AI Integration**: Replace mock parsing with OpenAI/CVParserPro API.
3.  **Email Service**: Integrate SendGrid for real-time notifications.
4.  **Analytics**: Advanced charting for retention and hiring metrics.
