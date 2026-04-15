import api from './api';

export interface AuditLogEntry {
    id: number;
    user_name: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: string;
    resource_id: string;
    changes: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

export interface SurveySentiment {
    name: string;
    count: number;
}

export interface SurveyAnalytics {
    sentiment_analysis: SurveySentiment[];
    response_rate: number;
    total_responses: number;
    average_sentiment: number;
}

export interface PulseSurvey {
    id: number;
    question: string;
    is_active: boolean;
    created_at: string;
}

export const analyticsApi = {
    getAuditLogs: async (): Promise<AuditLogEntry[]> => {
        return await api.get<AuditLogEntry[]>('/core/audit-logs/');
    },

    getSurveyAnalytics: async (): Promise<SurveyAnalytics> => {
        return await api.get<SurveyAnalytics>('/surveys/analytics/');
    },

    // --- Survey Management ---
    getActiveSurvey: async (): Promise<PulseSurvey> => {
        return await api.get<PulseSurvey>('/surveys/surveys/active/');
    },

    updateSurvey: async (id: number, data: Partial<{ question: string, is_active: boolean }>): Promise<PulseSurvey> => {
        return await api.patch<PulseSurvey>(`/surveys/surveys/${id}/`, data);
    },

    // --- Participation ---
    submitResponse: async (surveyId: number, sentiment: number): Promise<any> => {
        return await api.post('/surveys/responses/', {
            survey: surveyId,
            sentiment: sentiment
        });
    }
};
