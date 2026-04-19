import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserRole } from './types';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import Layout from './components/Layout'; // Admin Layout
import EmployeeLayout from './components/EmployeeLayout'; // Employee Layout
import ApplicantLayout from './components/ApplicantLayout'; // Applicant Layout

import Landing from './pages/Landing';
import Login from './pages/Login';
import CompanyRegister from './pages/CompanyRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import PublicCareers from './pages/PublicCareers';
import PlatformCareers from './pages/PlatformCareers';
import PlatformPricing from './pages/PlatformPricing';

// Host (Super Admin) Pages
import HostDashboard from './pages/host/HostDashboard';

// Admin Pages
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import AddEmployee from './pages/AddEmployee';
import Departments from './pages/Departments';
import AddDepartment from './pages/AddDepartment';
import AdminAttendance from './pages/AdminAttendance';
import Payroll from './pages/Payroll';
import AddPayroll from './pages/AddPayroll';
import AdminLeaves from './pages/AdminLeaves';
import Announcements from './pages/Announcements';
import AddAnnouncement from './pages/AddAnnouncement';
import Billing from './pages/Billing';
import OrganizationChart from './pages/OrganizationChart';
import SurveyDashboard from './pages/SurveyDashboard';
import AuditLogViewer from './pages/AuditLogViewer';

// Recruitment Pages (Admin Only)
import CandidateList from './pages/recruitment/CandidateList';
import CandidateDetail from './pages/recruitment/CandidateDetail';
import JobList from './pages/recruitment/JobList';
import AddJob from './pages/recruitment/AddJob';
import AISettings from './pages/recruitment/AISettings';

// Applicant Pages
import ApplicantDashboard from './pages/applicant/ApplicantDashboard';
import JobBoard from './pages/applicant/JobBoard';
import ApplicantProfile from './pages/applicant/ApplicantProfile';

// Employee Pages
import EmployeeDashboard from './pages/EmployeeDashboard';
import Attendance from './pages/Attendance'; // Employee Attendance View
import EmployeeLeaves from './pages/EmployeeLeaves';
import EmployeePayroll from './pages/EmployeePayroll';
import EmployeeProfile from './pages/EmployeeProfile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* ============================================ */}
              {/* PUBLIC ROUTES - No authentication required */}
              {/* ============================================ */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<CompanyRegister />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/careers" element={<PlatformCareers />} />
              <Route path="/pricing" element={<PlatformPricing />} />
              <Route path="/careers/:tenantSlug" element={<PublicCareers />} />
              <Route path="/jobs/:jobId/:tenantSlug" element={<PublicCareers />} />

              {/* ============================================ */}
              {/* HOST ROUTE - Super Admin only               */}
              {/* ============================================ */}
              <Route 
                path="/host" 
                element={
                  <ProtectedRoute requireSuperuser={true} allowedRoles={[]}>
                    <HostDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* ============================================ */}
              {/* APPLICANT ROUTES - Only APPLICANT role */}
              {/* ============================================ */}
              <Route
                path="/applicant"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.APPLICANT]}>
                    <ApplicantLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ApplicantDashboard />} />
                <Route path="jobs" element={<JobBoard />} />
                <Route path="profile" element={<ApplicantProfile />} />
              </Route>

              {/* ============================================ */}
              {/* ADMIN ROUTES - ADMIN and HR_MANAGER only */}
              {/* Full access to all features including recruitment */}
              {/* ============================================ */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.HR_MANAGER]}>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />

                {/* Employee Management */}
                <Route path="employees" element={<Employees />} />
                <Route path="employees/new" element={<AddEmployee />} />
                <Route path="employees/edit/:id" element={<AddEmployee />} />

                {/* Department Management */}
                <Route path="departments" element={<Departments />} />
                <Route path="departments/new" element={<AddDepartment />} />
                <Route path="departments/edit/:id" element={<AddDepartment />} />

                {/* Attendance Management */}
                <Route path="attendance" element={<AdminAttendance />} />

                {/* Payroll Management */}
                <Route path="payroll" element={<Payroll />} />
                <Route path="payroll/new" element={<AddPayroll />} />
                <Route path="payroll/edit/:id" element={<AddPayroll />} />

                {/* Leave Management */}
                <Route path="leaves" element={<AdminLeaves />} />

                {/* RECRUITMENT - Admin/HR Only (Employees cannot access) */}
                <Route path="recruitment">
                  <Route path="jobs" element={<JobList />} />
                  <Route path="jobs/new" element={<AddJob />} />
                  <Route path="jobs/edit/:id" element={<AddJob />} />
                  <Route path="candidates" element={<CandidateList />} />
                  <Route path="candidates/:id" element={<CandidateDetail />} />
                  <Route path="ai-settings" element={<AISettings />} />
                </Route>

                {/* Announcements */}
                <Route path="announcements" element={<Announcements />} />
                <Route path="announcements/new" element={<AddAnnouncement />} />
                <Route path="announcements/edit/:id" element={<AddAnnouncement />} />

                {/* Billing & Subscription */}
                <Route path="billing" element={<Billing />} />

                {/* Analytics & Transparency */}
                <Route path="analytics">
                  <Route path="org-chart" element={<OrganizationChart />} />
                  <Route path="surveys" element={<SurveyDashboard />} />
                  <Route path="audit-logs" element={<AuditLogViewer />} />
                </Route>
              </Route>

              {/* ============================================ */}
              {/* EMPLOYEE ROUTES - EMPLOYEE role only */}
              {/* NO access to recruitment features */}
              {/* ============================================ */}
              <Route
                path="/employee"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}>
                    <EmployeeLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<EmployeeDashboard />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="leaves" element={<EmployeeLeaves />} />
                <Route path="payroll" element={<EmployeePayroll />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="profile" element={<EmployeeProfile />} />
              </Route>

              {/* ============================================ */}
              {/* CATCH ALL - Redirect to landing */}
              {/* ============================================ */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ToastProvider>
  );
};

export default App;
