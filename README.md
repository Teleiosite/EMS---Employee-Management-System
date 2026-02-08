
# 🏢 EMS - Employee Management System & AI Recruitment Platform

![React](https://img.shields.io/badge/React-19.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.3-38bdf8) ![Status](https://img.shields.io/badge/Status-Production_Ready-green)

A comprehensive, production-grade Human Resource Management System (HRMS) built with modern web technologies. This application serves as a centralized platform for managing employees, departments, payroll, and attendance, featuring a cutting-edge **AI-Powered Recruitment Module** that connects Applicants directly with HR.

---

## 📑 Table of Contents

- [Features](#-features)
  - [Admin Portal](#-admin-portal)
  - [Employee Portal](#-employee-portal)
  - [Applicant Portal & Recruitment](#-applicant-portal--recruitment)
- [Technical Stack](#-technical-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Authentication & Roles](#-authentication--roles)
- [Mock Data & Services](#-mock-data--services)
- [Roadmap](#-roadmap)

---

## 🚀 Features

The application is divided into three distinct portals protected by Role-Based Access Control (RBAC).

### 🔐 Admin Portal
The command center for HR Administrators and Managers.

*   **Dashboard Analytics**: Visual summary of total employees, daily attendance, leave requests, and pending payrolls.
*   **Employee Management**:
    *   Full CRUD (Create, Read, Update, Delete) capabilities for employee records.
    *   Detailed profiles including designation, salary, and experience.
    *   Search and filter functionality.
*   **Department Management**: Organize the company hierarchy with manageable departments.
*   **Payroll Processing**:
    *   Generate monthly payroll records.
    *   Automatic calculation of Net Salary based on Base Salary and Deductions.
    *   Process payments and generate status updates (Pending -> Paid).
*   **Attendance Monitoring**: View real-time logs of employee check-ins/outs with IP address tracking.
*   **Leave Management**: Review, Approve, or Reject employee leave requests with email notification simulation.
*   **Announcements**: Broadcast company-wide updates with priority levels (Low, Normal, High).

### 👤 Employee Portal
A self-service dashboard for staff members.

*   **Attendance Tracker**:
    *   One-click Check-In/Check-Out.
    *   Real-time clock with session duration tracking.
    *   View personal attendance history.
*   **Leave Application**:
    *   Apply for various types of leaves (Sick, Casual, etc.).
    *   Track status of submitted requests.
*   **Payslips**: View and download monthly salary slips.
*   **Personal Profile**: View and update personal contact information.
*   **Dashboard**: Quick view of remaining leave balance and recent announcements.

### 🤖 Applicant Portal & Recruitment
A next-gen hiring platform integrated directly into the EMS.

**For Admins (Recruiters):**
*   **Job Posting Management**: Create detailed job listings with requirements, skills, and responsibilities.
*   **AI Candidate Screening**:
    *   Automatically parses uploaded resumes (PDF/DOCX).
    *   **Fit Score Algorithm**: Ranks candidates (0-100%) based on skill matching and experience overlap.
*   **Candidate Pipeline**: Move candidates through stages (Applied -> Shortlisted -> Interviewing -> Hired/Rejected).

**For Applicants:**
*   **Job Board**: Browse and search for open positions.
*   **One-Click Apply**: Seamless application process with resume upload.
*   **Application Tracking**: Real-time status updates on all submitted applications.
*   **Feedback System**: Automated, friendly messages explaining the current status of an application.

---

## 🛠 Technical Stack

This project leverages the latest ecosystem tools for performance and developer experience.

*   **Frontend Framework**: [React 19](https://react.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode enabled)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Routing**: [React Router v7](https://reactrouter.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **State Management**: React Context API & Custom Hooks
*   **Notifications**: Custom Toast Context System

---

## 📂 Project Structure

```text
ems-dashboard/
├── src/
│   ├── components/         # Reusable UI components (Layouts, Sidebar, Header)
│   ├── context/            # Global state (ToastProvider)
│   ├── pages/
│   │   ├── applicant/      # Applicant-specific pages (JobBoard, Profile)
│   │   ├── recruitment/    # Admin Recruitment pages (CandidateList, AddJob)
│   │   ├── ...             # Admin & Employee pages (Dashboard, Payroll, etc.)
│   ├── services/           # Mock API services (resumeService, mockData)
│   ├── types/              # TypeScript interfaces and enums
│   ├── App.tsx             # Main routing configuration
│   └── main.tsx            # Entry point
├── public/                 # Static assets
└── package.json            # Dependencies
```

---

## 🏁 Getting Started

Follow these steps to run the project locally.

### Prerequisites
*   Node.js (v16 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/ems-dashboard.git
    cd ems-dashboard
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start Development Server**
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

---

## 🔐 Authentication & Roles

The system uses a mock authentication service. Use the following credentials to explore different roles:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@ems.com` | `admin` | **Full System Access** (HR, Recruitment, Settings) |
| **Employee** | `john.doe@ems.com` | `123` | **Restricted** (Attendance, Leaves, Personal Payroll) |
| **Applicant** | `alice.j@example.com` | `123` | **External** (Job Board, Application Status) |

> **Note**: You can also sign up as a new Applicant from the login screen.

---

## 🧩 Mock Data & Services

Since this is a frontend-focused project, backend services are simulated:

1.  **`services/mockData.ts`**: Acts as an in-memory database. All changes (adding employees, applying for jobs) persist **only for the duration of the session** (until page refresh), although some state is managed to simulate persistence during navigation.
2.  **`services/resumeService.ts`**: Simulates an AI Resume Parser. It artificially analyzes uploaded files to generate skills and experience data for demonstration purposes.

---

## 🚧 Roadmap

Future enhancements planned for the EMS:

- [ ] **Backend Integration**: Connect to Node.js/Express & PostgreSQL for persistent data.
- [ ] **Real AI Integration**: Replace mock parsing with OpenAI or CVParserPro API.
- [ ] **Email Service**: Integrate SendGrid/AWS SES for real-time email notifications.
- [ ] **Advanced Analytics**: Chart.js integration for retention rates and hiring metrics.
- [ ] **Calendar View**: Visual calendar for team leaves and holidays.
- [ ] **Dark Mode**: System-wide dark theme support.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
