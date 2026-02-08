/**
 * Recruitment API Service
 * Endpoints: /api/recruitment/jobs/, /api/recruitment/candidates/
 */

import api from './api';
import { JobRequirement, Candidate, ParsedResume } from '../types';

// Backend types (snake_case)
interface BackendJobPosting {
    id: number;
    title: string;
    department: string;
    location: string;
    description: string;
    is_active: boolean;
}

interface BackendCandidate {
    id: number;
    full_name: string;
    email: string;
    job: number | null;
    job_title?: string;
    resume: string | null;
    skills: string[];
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
    required_skills: [], // Backend doesn't have this field, would need to parse from description
    minimum_years_experience: 0, // Backend doesn't have this field
    education_level: undefined,
    responsibilities: job.description.split('\n').filter(line => line.trim()),
    status: job.is_active ? 'OPEN' : 'CLOSED',
});

// Transform candidate to frontend format
const transformCandidate = (candidate: BackendCandidate): Candidate => ({
    id: String(candidate.id),
    full_name: candidate.full_name,
    email: candidate.email,
    phone: '', // Backend doesn't have phone
    skills: candidate.skills || [],
    years_of_experience: 0, // Backend doesn't have this
    resume_file_name: candidate.resume || '',
    parsed_resume: {
        name: candidate.full_name,
        email: candidate.email,
        phone: '',
        skills: candidate.skills || [],
        education: [],
        experience: [],
    } as ParsedResume,
    applied_role_id: candidate.job ? String(candidate.job) : '',
    applied_role_name: candidate.job_title || 'Not Specified',
    fit_score: 0, // Calculate on frontend or add backend field
    status: 'APPLIED', // Backend doesn't have status field
    created_at: new Date().toISOString(),
});

export const recruitmentApi = {
    // ==================== JOB POSTINGS ====================

    listJobs: async (activeOnly: boolean = false): Promise<JobRequirement[]> => {
        let endpoint = '/recruitment/jobs/';
        if (activeOnly) {
            endpoint += '?is_active=true';
        }
        const response = await api.get<PaginatedResponse<BackendJobPosting> | BackendJobPosting[]>(endpoint);
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformJobPosting);
    },

    // Get jobs without auth (for public job board)
    listPublicJobs: async (): Promise<JobRequirement[]> => {
        const response = await api.get<PaginatedResponse<BackendJobPosting> | BackendJobPosting[]>('/recruitment/jobs/?is_active=true', false);
        const results = Array.isArray(response) ? response : response.results;
        return results.map(transformJobPosting);
    },

    getJob: async (id: string): Promise<JobRequirement> => {
        const response = await api.get<BackendJobPosting>(`/recruitment/jobs/${id}/`);
        return transformJobPosting(response);
    },

    createJob: async (data: {
        title: string;
        department: string;
        location: string;
        description: string;
        is_active?: boolean;
    }): Promise<JobRequirement> => {
        const response = await api.post<BackendJobPosting>('/recruitment/jobs/', {
            ...data,
            is_active: data.is_active ?? true,
        });
        return transformJobPosting(response);
    },

    updateJob: async (id: string, data: Partial<{
        title: string;
        department: string;
        location: string;
        description: string;
        is_active: boolean;
    }>): Promise<JobRequirement> => {
        const response = await api.patch<BackendJobPosting>(`/recruitment/jobs/${id}/`, data);
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

    createCandidate: async (data: {
        full_name: string;
        email: string;
        job?: number;
        skills?: string[];
    }): Promise<Candidate> => {
        const response = await api.post<BackendCandidate>('/recruitment/candidates/', data);
        return transformCandidate(response);
    },

    updateCandidate: async (id: string, data: Partial<{
        full_name: string;
        email: string;
        job: number | null;
        skills: string[];
    }>): Promise<Candidate> => {
        const response = await api.patch<BackendCandidate>(`/recruitment/candidates/${id}/`, data);
        return transformCandidate(response);
    },

    deleteCandidate: async (id: string): Promise<void> => {
        await api.delete(`/recruitment/candidates/${id}/`);
    },

    // Upload resume
    uploadResume: async (candidateId: string, file: File): Promise<Candidate> => {
        const formData = new FormData();
        formData.append('resume', file);
        const response = await api.upload<BackendCandidate>(`/recruitment/candidates/${candidateId}/`, formData);
        return transformCandidate(response);
    },
};

export default recruitmentApi;
