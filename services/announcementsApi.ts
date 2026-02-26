import { Announcement } from '../types';

const STORAGE_KEY = 'ems.announcements';

const read = (): Announcement[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const write = (items: Announcement[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const announcementsApi = {
  list: async (): Promise<Announcement[]> => read(),
  get: async (id: string): Promise<Announcement | null> => read().find((a) => a.id === id) || null,
  create: async (data: Omit<Announcement, 'id'>): Promise<Announcement> => {
    const items = read();
    const created: Announcement = { id: `a${Date.now()}`, ...data };
    write([created, ...items]);
    return created;
  },
  update: async (id: string, data: Partial<Omit<Announcement, 'id'>>): Promise<Announcement> => {
    const items = read();
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Announcement not found');
    items[idx] = { ...items[idx], ...data };
    write(items);
    return items[idx];
  },
  delete: async (id: string): Promise<void> => {
    write(read().filter((a) => a.id !== id));
  },
};

export default announcementsApi;
