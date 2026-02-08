/**
 * Leaves API Service
 * Endpoints: /api/leaves/types/, /api/leaves/requests/, /api/leaves/balances/, /api/leaves/policy-windows/
 */

import api from './api';
import { LeaveRequest } from '../types';

// Backend types (snake_case)
interface BackendLeaveType {
    id: number;
    name: string;
    max_days_per_year: number;
}

interface BackendLeaveBalance {
    id: number;
    employee: number;
    leave_type: number;
    leave_type_name?: string;
    year: number;
    available_days: string;
    used_days: string;
}

interface BackendLeaveRequest {
    id: number;
    employee: number;
    employee_name?: string;
    leave_type: number | null;
    leave_type_name?: string;
    start_date: string;
    end_date: string;
    duration_days: string;
    reason: string;
    status: string;
    created_at?: string;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Interfaces for frontend
export interface LeaveType {
    id: string;
    name: string;
    maxDaysPerYear: number;
}

export interface LeaveBalance {
    id: string;
    employeeId: string;
    leaveTypeId: string;
    leaveTypeName: string;
    year: number;
    availableDays: number;
    usedDays: number;
}

// Transform functions
const transformLeaveType = (lt: BackendLeaveType): LeaveType => ({
    id: String(lt.id),
    name: lt.name,
    maxDaysPerYear: lt.max_days_per_year,
});

const transformLeaveBalance = (lb: BackendLeaveBalance): LeaveBalance => ({
    id: String(lb.id),
    employeeId: String(lb.employee),
    leaveTypeId: String(lb.leave_type),
    leaveTypeName: lb.leave_type_name || 'Unknown',
    year: lb.year,
    availableDays: parseFloat(lb.available_days),
    usedDays: parseFloat(lb.used_days),
});

const transformLeaveRequest = (lr: BackendLeaveRequest): LeaveRequest => ({
    id: String(lr.id),
    employeeId: String(lr.employee),
    employeeName: lr.employee_name || 'Unknown',
    type: lr.leave_type_name || 'General',
    startDate: lr.start_date,
    endDate: lr.end_date,
    reason: lr.reason,
    status: lr.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    appliedOn: lr.created_at || lr.start_date,
});

export const leavesApi = {
    // ==================== LEAVE TYPES ====================

    listTypes: async (): Promise<LeaveType[]> => {
        const response = await api.get<PaginatedResponse<BackendLeaveType> | BackendLeaveType[]>('/leaves/types/');
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformLeaveType);
    },

    // ==================== LEAVE BALANCES ====================

    listBalances: async (employeeId?: string): Promise<LeaveBalance[]> => {
        let endpoint = '/leaves/balances/';
        if (employeeId) {
            endpoint += `?employee=${employeeId}`;
        }
        const response = await api.get<PaginatedResponse<BackendLeaveBalance> | BackendLeaveBalance[]>(endpoint);
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformLeaveBalance);
    },

    // ==================== LEAVE REQUESTS ====================

    // List all leave requests (admin sees all, employee sees own)
    listRequests: async (params?: { status?: string; employee?: string }): Promise<LeaveRequest[]> => {
        let endpoint = '/leaves/requests/';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status', params.status);
            if (params.employee) queryParams.append('employee', params.employee);
            if (queryParams.toString()) endpoint += `?${queryParams.toString()}`;
        }
        const response = await api.get<PaginatedResponse<BackendLeaveRequest> | BackendLeaveRequest[]>(endpoint);
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformLeaveRequest);
    },

    // Get single leave request
    getRequest: async (id: string): Promise<LeaveRequest> => {
        const response = await api.get<BackendLeaveRequest>(`/leaves/requests/${id}/`);
        return transformLeaveRequest(response);
    },

    // Create leave request
    createRequest: async (data: {
        employee: number;
        leave_type: number;
        start_date: string;
        end_date: string;
        duration_days: number;
        reason: string;
    }): Promise<LeaveRequest> => {
        const response = await api.post<BackendLeaveRequest>('/leaves/requests/', data);
        return transformLeaveRequest(response);
    },

    // Update leave request status (admin approve/reject)
    updateRequest: async (id: string, data: {
        status: 'APPROVED' | 'REJECTED';
    }): Promise<LeaveRequest> => {
        const response = await api.patch<BackendLeaveRequest>(`/leaves/requests/${id}/`, data);
        return transformLeaveRequest(response);
    },

    // Delete leave request (only if pending)
    deleteRequest: async (id: string): Promise<void> => {
        await api.delete(`/leaves/requests/${id}/`);
    },
};

export default leavesApi;
