/**
 * Dashboard API Service
 * Aggregates stats from multiple endpoints since there's no dedicated stats endpoint
 */

import { DashboardStats } from '../types';
import { employeesApi, departmentsApi } from './employeesApi';
import { leavesApi } from './leavesApi';
import { attendanceApi } from './attendanceApi';
import { payrollApi } from './payrollApi';

export const dashboardApi = {
    /**
     * Get dashboard statistics by aggregating data from multiple endpoints
     * Falls back to zeros if any endpoint fails
     */
    getStats: async (): Promise<DashboardStats> => {
        const stats: DashboardStats = {
            totalEmployees: 0,
            onLeaveToday: 0,
            totalDepartments: 0,
            pendingApprovals: 0,
            presentToday: 0,
            totalAnnouncements: 0, // No backend endpoint
            approvedLeave: 0,
            pendingPayrolls: 0,
        };

        try {
            // Get employees count
            const employees = await employeesApi.list();
            stats.totalEmployees = employees.length;
        } catch (e) {
            console.warn('Failed to fetch employees for dashboard:', e);
        }

        try {
            // Get departments count
            const departments = await departmentsApi.list();
            stats.totalDepartments = departments.length;
        } catch (e) {
            console.warn('Failed to fetch departments for dashboard:', e);
        }

        try {
            // Get leave requests for today and counts
            const leaveRequests = await leavesApi.listRequests();
            const today = new Date().toISOString().split('T')[0];

            stats.onLeaveToday = leaveRequests.filter(
                lr => lr.status === 'APPROVED' &&
                    lr.startDate <= today &&
                    lr.endDate >= today
            ).length;

            stats.pendingApprovals = leaveRequests.filter(lr => lr.status === 'PENDING').length;
            stats.approvedLeave = leaveRequests.filter(lr => lr.status === 'APPROVED').length;
        } catch (e) {
            console.warn('Failed to fetch leaves for dashboard:', e);
        }

        try {
            // Get today's attendance
            const today = new Date().toISOString().split('T')[0];
            const attendance = await attendanceApi.list({ date: today });
            stats.presentToday = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
        } catch (e) {
            console.warn('Failed to fetch attendance for dashboard:', e);
        }

        try {
            // Get pending payroll runs
            const payrollRuns = await payrollApi.listRuns();
            stats.pendingPayrolls = payrollRuns.filter(pr => pr.status === 'DRAFT' || pr.status === 'PROCESSING').length;
        } catch (e) {
            console.warn('Failed to fetch payroll for dashboard:', e);
        }

        return stats;
    },
};

export default dashboardApi;
