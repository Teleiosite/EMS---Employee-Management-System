/**
 * Attendance API Service
 * Endpoints: /api/attendance/clock-in/, /api/attendance/clock-out/,
 *            /api/attendance/status/, /api/attendance/policy/,
 *            /api/attendance/suspicious/, /api/attendance/logs/
 */

import api from './api';

// ─── Backend shapes ─────────────────────────────────────────────────────────

export interface AttendancePolicy {
    id: number;
    check_in_start: string;       // "HH:MM:SS"
    check_in_end: string;
    late_grace_minutes: number;
    absent_if_no_checkin_by: string;
    half_day_if_checkout_before: string;
    check_out_start: string;
    check_out_end: string;
    is_active: boolean;
}

export interface AttendanceLog {
    id: number;
    employee: number;
    employee_name?: string;
    employee_code?: string;
    date: string;
    clock_in_timestamp: string | null;
    clock_out_timestamp: string | null;
    clock_in_ip: string | null;
    clock_out_ip: string | null;
    device_fingerprint: string | null;
    is_suspicious: boolean;
    suspicious_reason: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
}

export interface AttendanceStatus {
    today: string;
    window_open: boolean;
    window_message: string;
    log: {
        id: number;
        status: string;
        clock_in: string | null;
        clock_out: string | null;
    } | null;
    policy: AttendancePolicy | null;
}

interface Paginated<T> {
    count: number;
    results: T[];
}

// ─── Device fingerprint ──────────────────────────────────────────────────────

function buildFingerprint(): string {
    const raw = [
        navigator.userAgent,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language,
        navigator.hardwareConcurrency ?? 0,
    ].join('|');

    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) + hash + raw.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const attendanceApi = {
    getStatus: (): Promise<AttendanceStatus> =>
        api.get<AttendanceStatus>('/attendance/status/'),

    clockIn: (): Promise<{ detail: string; status: string; clock_in: string; is_suspicious: boolean }> =>
        api.post('/attendance/clock-in/', { device_fingerprint: buildFingerprint() }),

    clockOut: (): Promise<{ detail: string; status: string; clock_out: string; working_minutes: number }> =>
        api.post('/attendance/clock-out/', { device_fingerprint: buildFingerprint() }),

    listLogs: (params?: { date?: string }): Promise<AttendanceLog[]> => {
        let endpoint = '/attendance/logs/';
        if (params?.date) endpoint += `?date=${params.date}`;
        return api.get<Paginated<AttendanceLog> | AttendanceLog[]>(endpoint).then((res) =>
            Array.isArray(res) ? res : res.results
        );
    },

    listSuspicious: (): Promise<AttendanceLog[]> =>
        api.get<Paginated<AttendanceLog> | AttendanceLog[]>('/attendance/suspicious/').then((res) =>
            Array.isArray(res) ? res : res.results
        ),

    getPolicy: (): Promise<AttendancePolicy> =>
        api.get<AttendancePolicy>('/attendance/policy/'),

    updatePolicy: (data: Partial<AttendancePolicy>): Promise<AttendancePolicy> =>
        api.patch<AttendancePolicy>('/attendance/policy/', data),
};

export default attendanceApi;
