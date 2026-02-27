import { api } from './api';
import { Announcement } from '../types';

interface AnnouncementBackend {
    id: number;
    title: string;
    content: string;
    date: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH';
    created_by: number | null;
    created_by_name: string | null;
    created_at: string;
    updated_at: string;
}

const transformAnnouncement = (a: AnnouncementBackend): Announcement => ({
    id: String(a.id),
    title: a.title,
    content: a.content,
    date: a.date,
    priority: a.priority,
});

export const announcementsApi = {
    list: async (): Promise<Announcement[]> => {
        const data = await api.get<AnnouncementBackend[] | { results: AnnouncementBackend[] }>(
            '/core/announcements/'
        );
        const results = Array.isArray(data) ? data : data.results || [];
        return results.map(transformAnnouncement);
    },

    get: async (id: string): Promise<Announcement> => {
        const data = await api.get<AnnouncementBackend>(`/core/announcements/${id}/`);
        return transformAnnouncement(data);
    },

    create: async (payload: {
        title: string;
        content: string;
        date: string;
        priority: string;
    }): Promise<Announcement> => {
        const data = await api.post<AnnouncementBackend>('/core/announcements/', payload);
        return transformAnnouncement(data);
    },

    update: async (
        id: string,
        payload: { title: string; content: string; date: string; priority: string }
    ): Promise<Announcement> => {
        const data = await api.put<AnnouncementBackend>(`/core/announcements/${id}/`, payload);
        return transformAnnouncement(data);
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/core/announcements/${id}/`);
    },
};
