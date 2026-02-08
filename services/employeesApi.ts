/**
 * Employees & Departments API Service
 * Endpoints: /api/employees/departments/, /api/employees/profiles/
 */

import api, { ApiError } from './api';
import { Department, EmployeeProfile } from '../types';

// Types matching backend response (snake_case)
interface BackendDepartment {
    id: number;
    name: string;
    description: string | null;
    manager: string | null;
    budget: string | null;
}

interface BackendEmployeeProfile {
    id: number;
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
    };
    department: BackendDepartment | null;
    designation: { id: number; title: string; description: string } | null;
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

// Transform backend department to frontend format
const transformDepartment = (dept: BackendDepartment): Department => ({
    id: String(dept.id),
    name: dept.name,
    description: dept.description || undefined,
});

// Transform backend employee to frontend format
const transformEmployee = (emp: BackendEmployeeProfile): EmployeeProfile & { name: string; email: string } => ({
    id: String(emp.id),
    userId: emp.user.id,
    employeeId: emp.employee_id,
    department: emp.department?.name || 'Unassigned',
    designation: emp.designation?.title || 'Not Set',
    joiningDate: emp.joining_date,
    status: emp.status as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED',
    baseSalary: parseFloat(emp.base_salary),
    experience: 0, // Calculate from joining date if needed
    name: `${emp.user.first_name} ${emp.user.last_name}`.trim(),
    email: emp.user.email,
});

// ==================== DEPARTMENTS ====================

export const departmentsApi = {
    // Get all departments
    list: async (): Promise<Department[]> => {
        const response = await api.get<PaginatedResponse<BackendDepartment> | BackendDepartment[]>('/employees/departments/');
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformDepartment);
    },

    // Get single department
    get: async (id: string): Promise<Department> => {
        const response = await api.get<BackendDepartment>(`/employees/departments/${id}/`);
        return transformDepartment(response);
    },

    // Create department
    create: async (data: { name: string; description?: string }): Promise<Department> => {
        const response = await api.post<BackendDepartment>('/employees/departments/', data);
        return transformDepartment(response);
    },

    // Update department
    update: async (id: string, data: { name?: string; description?: string }): Promise<Department> => {
        const response = await api.patch<BackendDepartment>(`/employees/departments/${id}/`, data);
        return transformDepartment(response);
    },

    // Delete department
    delete: async (id: string): Promise<void> => {
        await api.delete(`/employees/departments/${id}/`);
    },
};

// ==================== EMPLOYEES ====================

export const employeesApi = {
    // Get all employees
    list: async (): Promise<(EmployeeProfile & { name: string; email: string })[]> => {
        const response = await api.get<PaginatedResponse<BackendEmployeeProfile> | BackendEmployeeProfile[]>('/employees/profiles/');
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformEmployee);
    },

    // Get single employee
    get: async (id: string): Promise<EmployeeProfile & { name: string; email: string }> => {
        const response = await api.get<BackendEmployeeProfile>(`/employees/profiles/${id}/`);
        return transformEmployee(response);
    },

    // Create employee profile (requires user to exist first)
    create: async (data: {
        user: string; // User UUID
        department?: number;
        designation?: number;
        employee_id: string;
        base_salary: number;
        joining_date: string;
        phone_number?: string;
        address?: string;
        status?: string;
    }): Promise<EmployeeProfile & { name: string; email: string }> => {
        const response = await api.post<BackendEmployeeProfile>('/employees/profiles/', data);
        return transformEmployee(response);
    },

    // Update employee
    update: async (id: string, data: Partial<{
        department: number | null;
        designation: number | null;
        base_salary: number;
        phone_number: string;
        address: string;
        status: string;
    }>): Promise<EmployeeProfile & { name: string; email: string }> => {
        const response = await api.patch<BackendEmployeeProfile>(`/employees/profiles/${id}/`, data);
        return transformEmployee(response);
    },

    // Delete employee
    delete: async (id: string): Promise<void> => {
        await api.delete(`/employees/profiles/${id}/`);
    },
};

export { ApiError };
