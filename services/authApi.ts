/**
 * Authentication API service
 * ---------------------------
 * SECURITY: Tokens are stored in httpOnly cookies set by the backend.
 * The frontend never touches access/refresh tokens directly.
 * Only non-sensitive user metadata (role, name, email) is kept in localStorage.
 */

import { UserRole } from '../types';

const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (isLocalhost ? 'http://localhost:8000/api' : '/api');

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

/**
 * Login — credentials stored as httpOnly cookies by the backend.
 * Only user metadata is returned and persisted in localStorage.
 */
export const loginWithBackend = async (
  email: string,
  password: string,
  mfaCode?: string
) => {
  const body: Record<string, string> = { email, password };
  if (mfaCode) body['mfa_code'] = mfaCode;

  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive httpOnly cookies
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.non_field_errors?.[0] || 'Failed to login.');
  }

  // SECURITY: Never store access/refresh tokens in localStorage.
  // Only store non-sensitive user metadata used for UI rendering.
  const user = mapUser(data.user);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

/**
 * Logout — calls the backend to clear httpOnly cookies, then clears local state.
 */
export const logoutFromBackend = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore network errors — we still clear local state
  } finally {
    localStorage.removeItem('user');
  }
};

/**
 * Register a new applicant account.
 */
export const registerApplicantWithBackend = async (
  name: string,
  email: string,
  password: string
) => {
  const names = name.trim().split(' ');
  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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
