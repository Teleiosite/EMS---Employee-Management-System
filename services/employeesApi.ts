/**
 * Employees & Departments API Service
 */

import api from './api';
import { Department, EmployeeProfile } from '../types';

export { ApiError } from './api';

interface BackendDepartment {
  id: number;
  name: string;
  description: string | null;
  manager: string | null;
  budget: string | null;
}

interface BackendDesignation {
  id: number;
  title: string;
  description: string;
}

interface BackendEmployeeProfile {
  id: number;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  user_id?: string;
  department: BackendDepartment | null | number;
  designation: BackendDesignation | null | number;
  employee_id: string;
  base_salary: string;
  joining_date: string;
  phone_number: string;
  address: string;
  status: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const transformDepartment = (dept: BackendDepartment): Department => ({
  id: String(dept.id),
  name: dept.name,
  description: dept.description || undefined,
});

const transformEmployee = (emp: BackendEmployeeProfile): EmployeeProfile & { name: string; email: string } => ({
  id: String(emp.id),
  userId: emp.user?.id || emp.user_id || '',
  employeeId: emp.employee_id,
  department: typeof emp.department === 'object' && emp.department ? emp.department.name : 'Unassigned',
  designation: typeof emp.designation === 'object' && emp.designation ? emp.designation.title : 'Not Set',
  joiningDate: emp.joining_date,
  status: (emp.status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED',
  baseSalary: parseFloat(emp.base_salary),
  experience: 0,
  name: emp.user ? `${emp.user.first_name} ${emp.user.last_name}`.trim() : 'Unknown',
  email: emp.user?.email || '',
});

export const departmentsApi = {
  list: async (): Promise<Department[]> => {
    const response = await api.get<PaginatedResponse<BackendDepartment> | BackendDepartment[]>('/employees/departments/');
    const results = Array.isArray(response) ? response : response.results;
    return results.map(transformDepartment);
  },
  get: async (id: string): Promise<Department> => transformDepartment(await api.get<BackendDepartment>(`/employees/departments/${id}/`)),
  create: async (data: { name: string; description?: string }): Promise<Department> => transformDepartment(await api.post<BackendDepartment>('/employees/departments/', data)),
  update: async (id: string, data: { name?: string; description?: string }): Promise<Department> => transformDepartment(await api.patch<BackendDepartment>(`/employees/departments/${id}/`, data)),
  delete: async (id: string): Promise<void> => {
    await api.delete(`/employees/departments/${id}/`);
  },
};

export const designationsApi = {
  list: async (): Promise<BackendDesignation[]> => {
    const response = await api.get<PaginatedResponse<BackendDesignation> | BackendDesignation[]>('/employees/designations/');
    return Array.isArray(response) ? response : response.results;
  },
};

export const employeesApi = {
  list: async (): Promise<(EmployeeProfile & { name: string; email: string })[]> => {
    const response = await api.get<PaginatedResponse<BackendEmployeeProfile> | BackendEmployeeProfile[]>('/employees/profiles/');
    const results = Array.isArray(response) ? response : response.results;
    return results.map(transformEmployee);
  },
  get: async (id: string): Promise<EmployeeProfile & { name: string; email: string }> => transformEmployee(await api.get<BackendEmployeeProfile>(`/employees/profiles/${id}/`)),
  create: async (data: {
    user_id: string;
    department?: number | null;
    designation?: number | null;
    employee_id: string;
    base_salary: number;
    joining_date: string;
    phone_number?: string;
    address?: string;
    status?: string;
  }): Promise<EmployeeProfile & { name: string; email: string }> => transformEmployee(await api.post<BackendEmployeeProfile>('/employees/profiles/', data)),
  update: async (id: string, data: Partial<{
    department: number | null;
    designation: number | null;
    base_salary: number;
    phone_number: string;
    address: string;
    status: string;
  }>): Promise<EmployeeProfile & { name: string; email: string }> => transformEmployee(await api.patch<BackendEmployeeProfile>(`/employees/profiles/${id}/`, data)),
  delete: async (id: string): Promise<void> => {
    await api.delete(`/employees/profiles/${id}/`);
  },
};

export default employeesApi;
