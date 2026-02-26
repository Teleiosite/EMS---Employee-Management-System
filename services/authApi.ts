import { UserRole } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

type ApiUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
};

const mapUser = (user: ApiUser) => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  role: user.role,
});

export const loginWithBackend = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.non_field_errors?.[0] || 'Failed to login.');
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

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || JSON.stringify(data));
  }

  return data;
};


export const registerStaffWithBackend = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole.EMPLOYEE | UserRole.HR_MANAGER;
}) => {
  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || JSON.stringify(payload));
  }

  return payload;
};
