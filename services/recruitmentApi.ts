/**
 * Recruitment API Service
 * Endpoints: /api/recruitment/jobs/, /api/recruitment/candidates/
 */

import { api } from './api';
import { JobRequirement, Candidate } from '../types';

// Backend types (snake_case) matching Django models
interface BackendJobPosting {
    id: number;
    title: string;
    department: string;
    location: string;
    employment_type: string;
    description: string;
    responsibilities: string[];
    required_skills: string[];
    minimum_experience: number;
    education_level: string;
    salary_range: string;
    status: 'OPEN' | 'CLOSED' | 'DRAFT';
    is_active: boolean;
    created_at: string;
}

interface BackendCandidate {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    job: number | null;
    job_title?: string;
    resume: string | null;
    parsed_resume_data: any;
    ai_fit_score: string | number | null;
    ai_analysis: any;
    status: string;
    applied_at: string;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Transform job posting to frontend format
const transformJobPosting = (job: BackendJobPosting): JobRequirement => ({
    id: String(job.id),
    role_name: job.title,
    department: job.department,
    location: job.location,
    employment_type: job.employment_type,
    required_skills: job.required_skills || [],
    minimum_years_experience: job.minimum_experience,
    education_level: job.education_level,
    responsibilities: job.responsibilities || [],
    description: job.description,
    status: job.status,
    salary_range: job.salary_range,
    created_at: job.created_at,
});

// Transform candidate to frontend format
const transformCandidate = (candidate: BackendCandidate): Candidate => ({
    id: String(candidate.id),
    full_name: candidate.full_name,
    email: candidate.email,
    phone: candidate.phone,
    skills: candidate.parsed_resume_data?.skills || [],
    years_of_experience: candidate.parsed_resume_data?.experience_years || 0,
    resume_file_name: candidate.resume ? candidate.resume.split('/').pop() || 'resume.pdf' : '',
    parsed_resume: candidate.parsed_resume_data || {},
    applied_role_id: candidate.job ? String(candidate.job) : '',
    applied_role_name: candidate.job_title || 'Not Specified',
    fit_score: candidate.ai_fit_score ? parseFloat(String(candidate.ai_fit_score)) : 0,
    status: candidate.status as any,
    created_at: candidate.applied_at,
    ai_analysis: candidate.ai_analysis,
});

export const recruitmentApi = {
    // ==================== JOB POSTINGS ====================

    listJobs: async (status?: string): Promise<JobRequirement[]> => {
        let endpoint = '/recruitment/jobs/';
        if (status) {
            endpoint += `?status=${status}`;
        }
        const response = await api.get<PaginatedResponse<BackendJobPosting> | BackendJobPosting[]>(endpoint);
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformJobPosting);
    },

    getJob: async (id: string): Promise<JobRequirement> => {
        const response = await api.get<BackendJobPosting>(`/recruitment/jobs/${id}/`);
        return transformJobPosting(response);
    },

    createJob: async (data: Partial<JobRequirement>): Promise<JobRequirement> => {
        // Map frontend fields to backend
        const payload = {
            title: data.role_name,
            department: data.department,
            location: data.location,
            employment_type: data.employment_type,
            description: data.description,
            responsibilities: data.responsibilities,
            required_skills: data.required_skills,
            minimum_experience: data.minimum_years_experience,
            education_level: data.education_level,
            salary_range: data.salary_range,
            status: data.status,
        };
        const response = await api.post<BackendJobPosting>('/recruitment/jobs/', payload);
        return transformJobPosting(response);
    },

    updateJob: async (id: string, data: Partial<JobRequirement>): Promise<JobRequirement> => {
        const payload: any = {};
        if (data.role_name) payload.title = data.role_name;
        if (data.department) payload.department = data.department;
        if (data.location) payload.location = data.location;
        if (data.employment_type) payload.employment_type = data.employment_type;
        if (data.description) payload.description = data.description;
        if (data.responsibilities) payload.responsibilities = data.responsibilities;
        if (data.required_skills) payload.required_skills = data.required_skills;
        if (data.minimum_years_experience !== undefined) payload.minimum_experience = data.minimum_years_experience;
        if (data.education_level) payload.education_level = data.education_level;
        if (data.salary_range) payload.salary_range = data.salary_range;
        if (data.status) payload.status = data.status;

        const response = await api.patch<BackendJobPosting>(`/recruitment/jobs/${id}/`, payload);
        return transformJobPosting(response);
    },

    deleteJob: async (id: string): Promise<void> => {
        await api.delete(`/recruitment/jobs/${id}/`);
    },

    // ==================== CANDIDATES ====================

    listCandidates: async (jobId?: string): Promise<Candidate[]> => {
        let endpoint = '/recruitment/candidates/';
        if (jobId) {
            endpoint += `?job=${jobId}`;
        }
        const response = await api.get<PaginatedResponse<BackendCandidate> | BackendCandidate[]>(endpoint);
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformCandidate);
    },

    getCandidate: async (id: string): Promise<Candidate> => {
        const response = await api.get<BackendCandidate>(`/recruitment/candidates/${id}/`);
        return transformCandidate(response);
    },

    updateCandidateStatus: async (id: string, status: string, notes?: string): Promise<Candidate> => {
        const response = await api.patch<BackendCandidate>(`/recruitment/candidates/${id}/update_status/`, {
            status,
            notes
        });
        return transformCandidate(response);
    },

    parseResume: async (id: string): Promise<Candidate> => {
        const response = await api.post<BackendCandidate>(`/recruitment/candidates/${id}/parse_resume/`, {});
        return transformCandidate(response);
    },

    // Admin manual add (rare, usually via apply)
    createCandidate: async (data: any): Promise<Candidate> => {
        const response = await api.post<BackendCandidate>('/recruitment/candidates/', data);
        return transformCandidate(response);
    },

    deleteCandidate: async (id: string): Promise<void> => {
        await api.delete(`/recruitment/candidates/${id}/`);
    },

    // ==================== PUBLIC ENDPOINTS ====================

    getPublicJobs: async (tenantSlug: string): Promise<JobRequirement[]> => {
        const response = await api.get<PaginatedResponse<BackendJobPosting> | BackendJobPosting[]>(`/recruitment/public/jobs/?tenant=${tenantSlug}`, false);
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformJobPosting);
    },

    submitPublicApplication: async (data: FormData): Promise<{ message: string; id: number }> => {
        return await api.postFormData<{ message: string; id: number }>('/recruitment/public/apply/', data, false);
    },

    // ==================== AI SETTINGS ====================
    getAISettings: async (): Promise<any> => {
        const response = await api.get('/recruitment/ai-settings/');
        return response;
    },

    updateAISettings: async (data: any): Promise<any> => {
        const response = await api.patch('/recruitment/ai-settings/', data);
        return response;
    },
};

export default recruitmentApi;
