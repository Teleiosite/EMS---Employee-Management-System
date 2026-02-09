/**
 * Applicant API Service
 * Handles all applicant-specific API calls (applications, profile, jobs)
 */

import { api, ApiError } from './api';

// Types
export interface PublicJob {
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
    status: 'OPEN' | 'CLOSED' | 'DRAFT';
    created_at: string;
}

export interface Application {
    id: number;
    job: number;
    job_title: string;
    job_department: string;
    status: 'APPLIED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'INTERVIEWING' | 'HIRED' | 'REJECTED';
    status_message: string;
    applied_at: string;
    interview_scheduled_at: string | null;
    interview_location: string;
}

export interface ApplicantProfile {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    headline: string;
    bio: string;
    years_of_experience: number;
    current_resume: string | null;
    resume_parsed_data: {
        skills?: string[];
        education?: Array<{ degree: string; school: string; year?: string }>;
        experience?: Array<{ title: string; company: string; duration?: string }>;
    };
    resume_uploaded_at: string | null;
    skills: string[];
    education: Array<{ degree: string; school: string; year?: string }>;
    experience: Array<{ title: string; company: string; duration?: string; description?: string }>;
    profile_completed: boolean;
    profile_completeness: number;
    created_at: string;
    updated_at: string;
}

const API_BASE = '/recruitment';

export const applicantApi = {
    // ============================================
    // PUBLIC JOB LISTINGS
    // ============================================

    /**
     * Get all open job listings (public, no auth required)
     */
    getPublicJobs: async (): Promise<PublicJob[]> => {
        return api.get<PublicJob[]>(`${API_BASE}/public/jobs/`);
    },

    /**
     * Get single job details
     */
    getJobDetails: async (jobId: number): Promise<PublicJob> => {
        return api.get<PublicJob>(`${API_BASE}/public/jobs/${jobId}/`);
    },

    // ============================================
    // APPLICANT APPLICATIONS
    // ============================================

    /**
     * Get all applications for the current applicant
     */
    getMyApplications: async (): Promise<Application[]> => {
        return api.get<Application[]>(`${API_BASE}/applicant/applications/`);
    },

    /**
     * Get single application details
     */
    getApplicationDetails: async (applicationId: number): Promise<Application> => {
        return api.get<Application>(`${API_BASE}/applicant/applications/${applicationId}/`);
    },

    /**
     * Apply for a job
     */
    applyForJob: async (jobId: number, resumeFile?: File): Promise<Application> => {
        const formData = new FormData();
        formData.append('job', jobId.toString());
        if (resumeFile) {
            formData.append('resume', resumeFile);
        }

        return api.postFormData<Application>(`${API_BASE}/applicant/apply/`, formData);
    },

    // ============================================
    // APPLICANT PROFILE
    // ============================================

    /**
     * Get current applicant's profile
     */
    getProfile: async (): Promise<ApplicantProfile> => {
        return api.get<ApplicantProfile>(`${API_BASE}/applicant/profile/`);
    },

    /**
     * Update applicant profile
     */
    updateProfile: async (data: Partial<ApplicantProfile>): Promise<ApplicantProfile> => {
        return api.patch<ApplicantProfile>(`${API_BASE}/applicant/profile/`, data);
    },

    /**
     * Upload resume
     */
    uploadResume: async (file: File): Promise<ApplicantProfile> => {
        const formData = new FormData();
        formData.append('current_resume', file);
        return api.putFormData<ApplicantProfile>(`${API_BASE}/applicant/resume/`, formData);
    },

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    /**
     * Get status badge color based on application status
     */
    getStatusColor: (status: Application['status']): string => {
        const colors: Record<Application['status'], string> = {
            'APPLIED': 'bg-blue-100 text-blue-700',
            'UNDER_REVIEW': 'bg-yellow-100 text-yellow-700',
            'SHORTLISTED': 'bg-purple-100 text-purple-700',
            'INTERVIEWING': 'bg-indigo-100 text-indigo-700',
            'HIRED': 'bg-green-100 text-green-700',
            'REJECTED': 'bg-red-50 text-red-600',
        };
        return colors[status] || 'bg-gray-100 text-gray-600';
    },

    /**
     * Get human-readable status label
     */
    getStatusLabel: (status: Application['status']): string => {
        const labels: Record<Application['status'], string> = {
            'APPLIED': 'Submitted',
            'UNDER_REVIEW': 'Under Review',
            'SHORTLISTED': 'Shortlisted',
            'INTERVIEWING': 'Interview Scheduled',
            'HIRED': 'Hired',
            'REJECTED': 'Not Selected',
        };
        return labels[status] || status;
    },
};

export default applicantApi;
