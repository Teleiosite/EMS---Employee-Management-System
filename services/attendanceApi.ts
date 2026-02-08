/**
 * Attendance API Service
 * Endpoints: /api/attendance/logs/, /api/attendance/corrections/
 */

import api from './api';
import { AttendanceLog } from '../types';

// Backend types (snake_case)
interface BackendAttendanceLog {
    id: number;
    employee: number;
    employee_name?: string;
    date: string;
    clock_in_timestamp: string | null;
    clock_out_timestamp: string | null;
    clock_in_ip: string | null;
    clock_out_ip: string | null;
    status: string;
}

interface BackendCorrectionRequest {
    id: number;
    attendance_log: number;
    requested_by: string;
    reviewer: string | null;
    reason: string;
    requested_clock_in: string | null;
    requested_clock_out: string | null;
    status: string;
    review_notes: string;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Transform backend attendance to frontend format
const transformAttendanceLog = (log: BackendAttendanceLog): AttendanceLog => ({
    id: String(log.id),
    employeeId: String(log.employee),
    employeeName: log.employee_name || 'Unknown',
    date: log.date,
    clockInTime: log.clock_in_timestamp ? new Date(log.clock_in_timestamp).toLocaleTimeString('en-US', { hour12: false }) : undefined,
    clockOutTime: log.clock_out_timestamp ? new Date(log.clock_out_timestamp).toLocaleTimeString('en-US', { hour12: false }) : undefined,
    status: log.status as 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'EARLY_LEAVE',
    ipAddress: log.clock_in_ip || log.clock_out_ip || 'N/A',
});

export const attendanceApi = {
    // Get all attendance logs
    list: async (params?: { employee?: string; date?: string; status?: string }): Promise<AttendanceLog[]> => {
        let endpoint = '/attendance/logs/';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.employee) queryParams.append('employee', params.employee);
            if (params.date) queryParams.append('date', params.date);
            if (params.status) queryParams.append('status', params.status);
            if (queryParams.toString()) endpoint += `?${queryParams.toString()}`;
        }
        const response = await api.get<PaginatedResponse<BackendAttendanceLog> | BackendAttendanceLog[]>(endpoint);
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformAttendanceLog);
    },

    // Get single attendance log
    get: async (id: string): Promise<AttendanceLog> => {
        const response = await api.get<BackendAttendanceLog>(`/attendance/logs/${id}/`);
        return transformAttendanceLog(response);
    },

    // Clock in - create attendance log
    clockIn: async (employeeId: string): Promise<AttendanceLog> => {
        const response = await api.post<BackendAttendanceLog>('/attendance/logs/', {
            employee: parseInt(employeeId),
            date: new Date().toISOString().split('T')[0],
            clock_in_timestamp: new Date().toISOString(),
            status: 'PRESENT',
        });
        return transformAttendanceLog(response);
    },

    // Clock out - update attendance log
    clockOut: async (logId: string): Promise<AttendanceLog> => {
        const response = await api.patch<BackendAttendanceLog>(`/attendance/logs/${logId}/`, {
            clock_out_timestamp: new Date().toISOString(),
        });
        return transformAttendanceLog(response);
    },

    // Update attendance log (admin)
    update: async (id: string, data: Partial<{
        status: string;
        clock_in_timestamp: string;
        clock_out_timestamp: string;
    }>): Promise<AttendanceLog> => {
        const response = await api.patch<BackendAttendanceLog>(`/attendance/logs/${id}/`, data);
        return transformAttendanceLog(response);
    },

    // Get correction requests
    listCorrections: async (): Promise<BackendCorrectionRequest[]> => {
        const response = await api.get<PaginatedResponse<BackendCorrectionRequest> | BackendCorrectionRequest[]>('/attendance/corrections/');
        return Array.isArray(response) ? response : response.results;
    },

    // Submit correction request
    submitCorrection: async (data: {
        attendance_log: number;
        reason: string;
        requested_clock_in?: string;
        requested_clock_out?: string;
    }): Promise<BackendCorrectionRequest> => {
        return api.post<BackendCorrectionRequest>('/attendance/corrections/', data);
    },

    // Approve/reject correction (admin)
    reviewCorrection: async (id: string, data: {
        status: 'APPROVED' | 'REJECTED';
        review_notes?: string;
    }): Promise<BackendCorrectionRequest> => {
        return api.patch<BackendCorrectionRequest>(`/attendance/corrections/${id}/`, data);
    },
};

export default attendanceApi;
