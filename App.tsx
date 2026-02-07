import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';

// Layouts
import Layout from './components/Layout'; // Admin Layout
import EmployeeLayout from './components/EmployeeLayout'; // Employee Layout

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';

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

// Employee Pages
import EmployeeDashboard from './pages/EmployeeDashboard';
import Attendance from './pages/Attendance'; // Employee Attendance View
import EmployeeLeaves from './pages/EmployeeLeaves';
import EmployeePayroll from './pages/EmployeePayroll';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Layout />}>
            <Route index element={<Dashboard />} />
            
            <Route path="employees" element={<Employees />} />
            <Route path="employees/new" element={<AddEmployee />} />
            <Route path="employees/edit/:id" element={<AddEmployee />} />
            
            <Route path="departments" element={<Departments />} />
            <Route path="departments/new" element={<AddDepartment />} />
            <Route path="departments/edit/:id" element={<AddDepartment />} />
            
            <Route path="attendance" element={<AdminAttendance />} />
            
            <Route path="payroll" element={<Payroll />} />
            <Route path="payroll/new" element={<AddPayroll />} />
            <Route path="payroll/edit/:id" element={<AddPayroll />} />
            
            <Route path="leaves" element={<AdminLeaves />} />
            
            <Route path="announcements" element={<Announcements />} />
            <Route path="announcements/new" element={<AddAnnouncement />} />
            <Route path="announcements/edit/:id" element={<AddAnnouncement />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<EmployeeDashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leaves" element={<EmployeeLeaves />} />
            <Route path="payroll" element={<EmployeePayroll />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="profile" element={<div className="p-6">Profile Page Coming Soon</div>} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;