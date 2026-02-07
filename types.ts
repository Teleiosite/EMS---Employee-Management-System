
export enum UserRole {
  ADMIN = 'ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  employeeId: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  baseSalary: number;
  experience: number;
}

export interface AttendanceLog {
  id: string;
  employeeId: string; 
  employeeName: string; 
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'EARLY_LEAVE';
  ipAddress: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedOn: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
}

export interface Payslip {
  id: string;
  month: string;
  year: number;
  netPay: number;
  status: 'PAID' | 'UNPAID';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  baseSalary: number;
  deductions: number;
  netSalary: number;
  status: 'Paid' | 'Pending' | 'Processing';
  month: string;
  year: number;
}

export interface DashboardStats {
  totalEmployees: number;
  onLeaveToday: number;
  totalDepartments: number;
  pendingApprovals: number;
  presentToday: number;
  totalAnnouncements: number;
  approvedLeave: number;
  pendingPayrolls: number;
}