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

interface BackendDesignation {
    id: number;
    title: string;
    description: string | null;
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
    salary_structure: any | null;
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
    salaryStructure: emp.salary_structure || undefined,
});

// Transform backend designation to frontend format
export interface DesignationType {
    id: string;
    title: string;
    description?: string;
}

const transformDesignation = (des: BackendDesignation): DesignationType => ({
    id: String(des.id),
    title: des.title,
    description: des.description || undefined,
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

// ==================== DESIGNATIONS ====================

export const designationsApi = {
    // Get all designations
    list: async (): Promise<DesignationType[]> => {
        const response = await api.get<PaginatedResponse<BackendDesignation> | BackendDesignation[]>('/employees/designations/');
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformDesignation);
    },

    // Get single designation
    get: async (id: string): Promise<DesignationType> => {
        const response = await api.get<BackendDesignation>(`/employees/designations/${id}/`);
        return transformDesignation(response);
    },

    // Create designation
    create: async (data: { title: string; description?: string }): Promise<DesignationType> => {
        const response = await api.post<BackendDesignation>('/employees/designations/', data);
        return transformDesignation(response);
    },

    // Update designation
    update: async (id: string, data: { title?: string; description?: string }): Promise<DesignationType> => {
        const response = await api.patch<BackendDesignation>(`/employees/designations/${id}/`, data);
        return transformDesignation(response);
    },

    // Delete designation
    delete: async (id: string): Promise<void> => {
        await api.delete(`/employees/designations/${id}/`);
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
        user_id: string; // User UUID — sent as 'user_id' to match backend serializer
        department_id?: number;
        designation_id?: number;
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
        department_id: number | null;
        designation_id: number | null;
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

    // Bulk import employees
    bulkImport: async (file: File): Promise<{ detail: string; success_count: number; error_count: number; errors: string[] }> => {
        const formData = new FormData();
        formData.append('file', file);
        return await api.postFormData<{ detail: string; success_count: number; error_count: number; errors: string[] }>(
            '/employees/profiles/bulk-import/',
            formData
        );
    },

    // Get current user's employee profile
    getMe: async (): Promise<EmployeeProfile & { name: string; email: string }> => {
        const response = await api.get<BackendEmployeeProfile>('/employees/profiles/me/');
        return transformEmployee(response);
    },
};


export { ApiError };
