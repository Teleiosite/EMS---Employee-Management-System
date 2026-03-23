/**
 * Payroll API Service
 * Endpoints: /api/payroll/runs/, /api/payroll/payslips/, /api/payroll/tax-slabs/
 */

import api from './api';
import { PayrollRecord, Payslip } from '../types';

// Backend types (snake_case)
interface BackendPayrollRun {
    id: number;
    month: string; // Date string
    status: 'DRAFT' | 'PROCESSING' | 'COMPLETED';
}

interface BackendPayslip {
    id: number;
    payroll_run: number;
    employee: number;
    employee_name?: string;
    employee_designation?: string;
    gross_salary: string;
    total_deductions: string;
    tax_deduction: string;
    net_salary: string;
    payroll_month?: string;
    payroll_status?: string;
}

interface BackendTaxSlab {
    id: number;
    min_income: string;
    max_income: string | null;
    rate_percent: string;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Frontend interfaces
export interface TaxSlab {
    id: string;
    minIncome: number;
    maxIncome: number | null;
    ratePercent: number;
}

// Transform functions
const transformPayrollRun = (run: BackendPayrollRun): { id: string; month: string; year: number; status: string } => {
    const date = new Date(run.month);
    return {
        id: String(run.id),
        month: date.toLocaleString('default', { month: 'long' }),
        year: date.getFullYear(),
        status: run.status,
    };
};

const transformPayslip = (slip: BackendPayslip, runInfo?: { month: string; year: number }): PayrollRecord => {
    let finalMonth = runInfo?.month || 'Unknown';
    let finalYear = runInfo?.year || new Date().getFullYear();
    let finalStatus = 'Paid';

    if (slip.payroll_month) {
        const date = new Date(slip.payroll_month);
        finalMonth = date.toLocaleString('default', { month: 'long' });
        finalYear = date.getFullYear();
    }

    if (slip.payroll_status) {
        if (slip.payroll_status === 'COMPLETED') finalStatus = 'Paid';
        else if (slip.payroll_status === 'DRAFT') finalStatus = 'Pending';
        else finalStatus = 'Processing';
    }

    return {
        id: String(slip.id),
        employeeId: String(slip.employee),
        name: slip.employee_name || 'Unknown',
        designation: slip.employee_designation || 'N/A',
        baseSalary: parseFloat(slip.gross_salary),
        deductions: parseFloat(slip.total_deductions) + parseFloat(slip.tax_deduction),
        netSalary: parseFloat(slip.net_salary),
        status: finalStatus as any,
        month: finalMonth,
        year: finalYear,
    };
};

const transformTaxSlab = (slab: BackendTaxSlab): TaxSlab => ({
    id: String(slab.id),
    minIncome: parseFloat(slab.min_income),
    maxIncome: slab.max_income ? parseFloat(slab.max_income) : null,
    ratePercent: parseFloat(slab.rate_percent),
});

export const payrollApi = {
    // ==================== PAYROLL RUNS ====================

    listRuns: async (): Promise<{ id: string; month: string; year: number; status: string }[]> => {
        const response = await api.get<PaginatedResponse<BackendPayrollRun> | BackendPayrollRun[]>('/payroll/runs/');
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformPayrollRun);
    },

    getRun: async (id: string): Promise<{ id: string; month: string; year: number; status: string }> => {
        const response = await api.get<BackendPayrollRun>(`/payroll/runs/${id}/`);
        return transformPayrollRun(response);
    },

    createRun: async (data: { month: string; employee_ids?: number[] }): Promise<{ id: string; month: string; year: number; status: string }> => {
        const response = await api.post<BackendPayrollRun>('/payroll/runs/', data);
        return transformPayrollRun(response);
    },

    updateRunStatus: async (id: string, status: 'DRAFT' | 'PROCESSING' | 'COMPLETED'): Promise<{ id: string; month: string; year: number; status: string }> => {
        const response = await api.patch<BackendPayrollRun>(`/payroll/runs/${id}/`, { status });
        return transformPayrollRun(response);
    },

    // ==================== PAYSLIPS ====================

    listPayslips: async (params?: { employee?: string; payroll_run?: string }): Promise<PayrollRecord[]> => {
        let endpoint = '/payroll/payslips/';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.employee) queryParams.append('employee', params.employee);
            if (params.payroll_run) queryParams.append('payroll_run', params.payroll_run);
            if (queryParams.toString()) endpoint += `?${queryParams.toString()}`;
        }
        const response = await api.get<PaginatedResponse<BackendPayslip> | BackendPayslip[]>(endpoint);
        const results = Array.isArray(response) ? response : response.results;
        return results.map(slip => transformPayslip(slip));
    },

    getPayslip: async (id: string): Promise<PayrollRecord> => {
        const response = await api.get<BackendPayslip>(`/payroll/payslips/${id}/`);
        return transformPayslip(response);
    },

    downloadPayslip: async (id: string): Promise<Blob> => {
        return api.getBlob(`/payroll/payslips/${id}/download/`);
    },

    // ==================== TAX SLABS ====================

    listTaxSlabs: async (): Promise<TaxSlab[]> => {
        const response = await api.get<PaginatedResponse<BackendTaxSlab> | BackendTaxSlab[]>('/payroll/tax-slabs/');
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformTaxSlab);
    },

    createTaxSlab: async (data: {
        min_income: number;
        max_income?: number | null;
        rate_percent: number;
    }): Promise<TaxSlab> => {
        const response = await api.post<BackendTaxSlab>('/payroll/tax-slabs/', data);
        return transformTaxSlab(response);
    },

    updateTaxSlab: async (id: string, data: Partial<{
        min_income: number;
        max_income: number | null;
        rate_percent: number;
    }>): Promise<TaxSlab> => {
        const response = await api.patch<BackendTaxSlab>(`/payroll/tax-slabs/${id}/`, data);
        return transformTaxSlab(response);
    },

    deleteTaxSlab: async (id: string): Promise<void> => {
        await api.delete(`/payroll/tax-slabs/${id}/`);
    },

    // ==================== SALARY COMPONENTS ====================

    listSalaryComponents: async (): Promise<any[]> => {
        return await api.get<any[]>('/payroll/salary-components/');
    },

    createSalaryComponent: async (data: any): Promise<any> => {
        return await api.post<any>('/payroll/salary-components/', data);
    },

    // ==================== SALARY STRUCTURES ====================

    getSalaryStructure: async (employeeId: string): Promise<any> => {
        // Typically we'd filter by employee, but for simplicity we assume the ProfileSerializer handles it 
        // OR we just get it by the profile ID if it exists.
        // Actually, let's just use the nested field in EmployeeProfile for reading,
        // and this for updating/creating if needed.
        return await api.get<any>(`/payroll/salary-structures/?employee=${employeeId}`);
    },

    saveSalaryStructure: async (data: { employee: number; effective_date: string; components: any[] }): Promise<any> => {
        // If it exists, update; if not, create.
        // For simplicity, we'll try to find any existing structure first or just use a dedicated endpoint if we had one.
        // But the backend viewset is standard.
        return await api.post<any>('/payroll/salary-structures/', data);
    },

    updateSalaryStructure: async (id: number, data: any): Promise<any> => {
        return await api.patch<any>(`/payroll/salary-structures/${id}/`, data);
    },
};


export default payrollApi;
