# EMS - Features & Capabilities Deep Dive

Welcome to the **Employee Management System (EMS)** feature showcase! This document highlights the comprehensive suite of tools we've engineered to streamline HR operations, simplify recruitment, and empower employees.

---

## 🤖 1. Advanced ATS with AI Resume Parsing
Our recruitment module doesn't just store applications; it intelligently analyzes them.

* **Google Gemini AI Integration**: Uploaded resume PDFs are instantly processed by Google's Gemini 2.5 Flash model.
* **Auto-Data Extraction**: The system automatically pulls out the candidate's skills, experience, and education to build a structured profile.
* **Smart Match Scoring**: The AI compares the parsed resume against the specific job description and generates a **Fit Score** (0-100%), helping HR instantly spot the strongest candidates.
* **Dynamic AI Settings Interface**: A dedicated admin panel allows HR managers to securely update their Gemini API key and adjust the AI parsing instructions without touching a single line of backend code.

## 📋 2. Interactive Kanban Pipeline for Recruitment
Managing the candidate lifecycle is visually engaging and effortless.

* **Drag-and-Drop Pipeline**: Candidates are tracked across customizable columns (`APPLIED`, `SHORTLISTED`, `INTERVIEWING`, `HIRED`, `REJECTED`).
* **Instant Status Updates**: HR can move a candidate forward through the pipeline smoothly, triggering real-time database updates.
* **Rich Candidate Cards**: Each applicant card displays their AI match score (with a clear visual ring), their applied role, and quick-action buttons for immediate review or contact.

## 👥 3. Empowered Employee Portal
A dedicated, self-serve dashboard gives employees total visibility into their professional status.

* **Real-time Attendance Tracking**: Employees can securely check in and check out, keeping an automated log of their daily hours.
* **Seamless Leave Management**: 
  * Employees can apply for different types of leave (e.g., Casual, Medical, Annual).
  * The backend actively tracks their allotted `LeaveBalance` (auto-initializing if new) and logically calculates standard business days (excluding weekends).
* **Transparent Payslips**: Employees have on-demand access to their monthly payslips, displaying exact payroll statuses and cycle dates.
* **Profile Management**: A localized area for employees to update their contact details and view their assigned department and designation.

## 🏢 4. Comprehensive Admin & HR Dashboard
Administrators hold the keys to a bird's-eye view of the entire organization.

* **Global Analytics Overview**: The main dashboard provides immediate metrics on total workforce size, pending applications, active leave requests, and total monthly payroll distributions.
* **Department Oversight**: Full CRUD (Create, Read, Update, Delete) capabilities for managing company departments, tracking distinct budgets, and assigning managers.
* **Payroll Execution**: An integrated center for processing payroll, allowing HR to define base salaries, run monthly payroll cycles, and generate uniform payslips for the workforce.
* **Corporate Announcements**: A rich-text bulletin board system for broadcasting critical updates, securely visible within the Employee portal immediately after posting.

## 🔒 5. Robust Security & Role-Based Access Control
The EMS is built on a foundation of strict data privacy and permission validation.

* **Scoped API Endpoints**: Django REST Framework strictly enforces whether an incoming request belongs to an `Admin`, `HR_Manager`, `Employee`, or `Applicant`.
* **Data Isolation**: Employees can only view their specific payslips and leave balances. Trying to override system-calculated fields (like leave duration or employee IDs) from the frontend is actively prevented by the backend serializers.

## 📧 6. Comprehensive Automated Email Notifications
We've integrated a robust, non-blocking background email dispatcher to keep everyone in the loop without slowing down the application.

* **Real-time Announcements**: HR can instantly blast company-wide updates straight to every active employee's inbox.
* **Internal Job Board Alerts**: When a new role is opened internally, all staff are notified via email to encourage internal mobility.
* **Applicant Pipeline Updates**: Job seekers receive tailored welcome emails upon registration and are automatically notified as their application status changes.
* **Leave Request Tracking**: Employees receive instant email confirmations when their leave applications are approved or rejected by management.

---
*Built with ❤️ utilizing the power of Django, React, Vite, and cutting-edge GenAI APIs.*
