import { DashboardStats, User, UserRole, EmployeeProfile, Announcement, AttendanceLog, Department, PayrollRecord, LeaveRequest } from '../types';

export const currentUser: User = {
  id: 'u1',
  email: 'admin@ems.com',
  firstName: 'Admin',
  lastName: 'User',
  role: UserRole.ADMIN,
  avatarUrl: 'https://picsum.photos/200'
};

// Mock Credentials for Login
export const mockCredentials = {
  admin: {
    email: 'admin@ems.com',
    password: 'admin',
    user: {
      id: 'u1',
      email: 'admin@ems.com',
      firstName: 'Mohan', // Matching screenshot name
      lastName: 'Admin',
      role: UserRole.ADMIN,
      avatarUrl: 'https://ui-avatars.com/api/?name=Mohan+Admin&background=orange&color=fff'
    }
  },
  employee: {
    email: 'john.doe@ems.com',
    password: '123',
    user: {
      id: 'u2',
      email: 'john.doe@ems.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.EMPLOYEE,
      avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff'
    }
  }
};

export const dashboardStats: DashboardStats = {
  totalEmployees: 2,
  onLeaveToday: 0,
  totalDepartments: 6,
  pendingApprovals: 0,
  presentToday: 0,
  totalAnnouncements: 1,
  approvedLeave: 0,
  pendingPayrolls: 1
};

export const departments: Department[] = [
  { id: 'd1', name: 'Finance', description: 'Financial operations and planning' },
  { id: 'd2', name: 'Marketing', description: 'Marketing, branding, and advertising' },
  { id: 'd3', name: 'HR', description: 'Human Resources and recruitment' },
  { id: 'd4', name: 'IT', description: 'Information Technology and support' },
  { id: 'd5', name: 'Developers', description: 'Software Engineering and Development' },
  { id: 'd6', name: 'Security', description: 'Network and Physical Security' },
];

export const announcements: Announcement[] = [
  {
    id: 'a1',
    title: 'New Attendance Policy',
    content: 'Please review the updated IP-restricted attendance policy effective next week.',
    date: '2025-08-25',
    priority: 'HIGH'
  },
  {
    id: 'a2',
    title: 'Holiday Calendar 2026',
    content: 'The list of public holidays for the upcoming year has been published.',
    date: '2025-08-20',
    priority: 'NORMAL'
  }
];

export const employees: (EmployeeProfile & { name: string, email: string })[] = [
  {
    id: 'e1',
    userId: 'u2',
    name: 'John Doe',
    email: 'john.doe@ems.com',
    employeeId: 'EMP001',
    department: 'Engineering',
    designation: 'Senior Developer',
    joiningDate: '2023-01-15',
    status: 'ACTIVE',
    baseSalary: 85000,
    experience: 5
  },
  {
    id: 'e2',
    userId: 'u3',
    name: 'Jane Smith',
    email: 'jane.smith@ems.com',
    employeeId: 'EMP002',
    department: 'HR',
    designation: 'HR Manager',
    joiningDate: '2023-03-01',
    status: 'ACTIVE',
    baseSalary: 72000,
    experience: 8
  }
];

export const payrolls: PayrollRecord[] = [
  {
    id: 'p1',
    employeeId: 'e1',
    name: 'John Doe',
    designation: 'Senior Developer',
    baseSalary: 85000,
    deductions: 10200,
    netSalary: 74800,
    status: 'Processing',
    month: 'August',
    year: 2025
  },
  {
    id: 'p2',
    employeeId: 'e2',
    name: 'Jane Smith',
    designation: 'HR Manager',
    baseSalary: 72000,
    deductions: 8640,
    netSalary: 63360,
    status: 'Paid',
    month: 'August',
    year: 2025
  }
];

export const recentAttendance: AttendanceLog[] = [
  {
    id: 'at1',
    employeeId: 'u2',
    employeeName: 'John Doe',
    date: '2025-08-27',
    clockInTime: '09:00:00',
    clockOutTime: '18:00:00',
    status: 'PRESENT',
    ipAddress: '203.0.113.50'
  },
  {
    id: 'at2',
    employeeId: 'u2',
    employeeName: 'John Doe',
    date: '2025-08-26',
    clockInTime: '09:15:00',
    clockOutTime: '18:10:00',
    status: 'LATE',
    ipAddress: '203.0.113.50'
  }
];

export const leaves: LeaveRequest[] = [
  {
    id: 'l1',
    employeeId: 'u2',
    employeeName: 'John Doe',
    type: 'Sick Leave',
    startDate: '2025-09-01',
    endDate: '2025-09-02',
    reason: 'Medical checkup',
    status: 'APPROVED',
    appliedOn: '2025-08-25'
  }
];