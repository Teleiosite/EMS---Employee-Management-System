import { UserRole } from '../types';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || (isLocalhost ? 'http://localhost:8000/api' : '/api');


const parseApiPayload = async (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return { raw: text };
};

const getErrorMessage = (response: Response, data: any, fallback: string): string => {
  if (data?.detail) return data.detail;
  if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length) return data.non_field_errors[0];

  const looksLikeHtml = typeof data?.raw === 'string' && data.raw.trim().startsWith('<!DOCTYPE');
  if (looksLikeHtml) {
    return `Server returned HTML (status ${response.status}) instead of JSON. Check backend/nginx logs.`;
  }

  return fallback;
};

type ApiUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_superuser?: boolean;
};

const mapUser = (user: ApiUser) => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  role: user.role,
  isSuperuser: user.is_superuser ?? false,
});

export const loginWithBackend = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseApiPayload(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(response, data, 'Failed to login.'));
  }

  if (!data?.access || !data?.refresh || !data?.user) {
    throw new Error('Login response is missing required fields.');
  }

  localStorage.setItem('accessToken', data.access);
  localStorage.setItem('refreshToken', data.refresh);
  localStorage.setItem('user', JSON.stringify(mapUser(data.user)));
  return mapUser(data.user);
};

export const registerApplicantWithBackend = async (name: string, email: string, password: string) => {
  const names = name.trim().split(' ');
  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      first_name: names[0] || 'Applicant',
      last_name: names.slice(1).join(' '),
      role: UserRole.APPLICANT,
    }),
  });

  const data = await parseApiPayload(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(response, data, 'Failed to register applicant.'));
  }

  return data;
};
