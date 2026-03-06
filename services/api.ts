/**
 * Base API utility for making authenticated requests to the backend.
 * Handles JWT token injection, automatic token refresh on 401, and response parsing.
 */

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || (isLocalhost ? 'http://localhost:8000/api' : '/api');

// Get/set tokens in localStorage
const getAuthToken = (): string | null => localStorage.getItem('accessToken');
const getRefreshToken = (): string | null => localStorage.getItem('refreshToken');

// Clear auth and redirect to login
const handleLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Try to refresh the access token — returns new access token or null
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  if (isRefreshing) {
    // Queue subsequent calls until refresh completes
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      refreshQueue.forEach((cb) => cb(null));
      refreshQueue = [];
      handleLogout();
      return null;
    }

    const data = await response.json();
    const newToken: string = data.access;
    localStorage.setItem('accessToken', newToken);
    refreshQueue.forEach((cb) => cb(newToken));
    refreshQueue = [];
    return newToken;
  } catch {
    refreshQueue.forEach((cb) => cb(null));
    refreshQueue = [];
    handleLogout();
    return null;
  } finally {
    isRefreshing = false;
  }
};

// Get headers with optional authentication
const getHeaders = (authenticated: boolean = true, isFormData: boolean = false): HeadersInit => {
  const headers: HeadersInit = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (authenticated) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API error class
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Handle API response — auto-refreshes token on 401 and retries once
const handleResponse = async <T>(response: Response, retryFn?: () => Promise<Response>): Promise<T> => {
  if (response.status === 204) {
    return {} as T;
  }

  // Token expired — try to refresh and retry once
  if (response.status === 401 && retryFn) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retried = await retryFn();
      return handleResponse<T>(retried); // No retryFn on second attempt to avoid loops
    }
    // Refresh failed — already redirected to login
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.detail || data.message || data.error || 'An error occurred';
    throw new ApiError(message, response.status, data);
  }

  return data as T;
};

// Authenticated fetch with auto-retry on token expiry
const authFetch = async (url: string, options: RequestInit): Promise<Response> => {
  const response = await fetch(url, options);
  return response;
};

// API Methods
export const api = {
  get: async <T>(endpoint: string, authenticated: boolean = true): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({ method: 'GET', headers: getHeaders(authenticated) });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  getBlob: async (endpoint: string, authenticated: boolean = true): Promise<Blob> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({ method: 'GET', headers: getHeaders(authenticated) });
    const response = await authFetch(url, opts());

    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retried = await authFetch(url, opts());
        if (!retried.ok) throw new ApiError('Download failed', retried.status);
        return retried.blob();
      }
      throw new ApiError('Session expired. Please log in again.', 401);
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data.detail || data.message || data.error || 'An error occurred downloading the file';
      throw new ApiError(message, response.status, data);
    }

    return response.blob();
  },

  post: async <T>(endpoint: string, data?: any, authenticated: boolean = true): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'POST',
      headers: getHeaders(authenticated),
      body: data ? JSON.stringify(data) : undefined,
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  put: async <T>(endpoint: string, data: any, authenticated: boolean = true): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'PUT',
      headers: getHeaders(authenticated),
      body: JSON.stringify(data),
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  patch: async <T>(endpoint: string, data: any, authenticated: boolean = true): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'PATCH',
      headers: getHeaders(authenticated),
      body: JSON.stringify(data),
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  delete: async <T>(endpoint: string, authenticated: boolean = true): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({ method: 'DELETE', headers: getHeaders(authenticated) });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  // For file uploads
  upload: async <T>(endpoint: string, formData: FormData, authenticated: boolean = true): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'POST',
      headers: getHeaders(authenticated, true),
      body: formData,
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  // POST with FormData
  postFormData: async <T>(endpoint: string, formData: FormData, authenticated: boolean = true): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'POST',
      headers: getHeaders(authenticated, true),
      body: formData,
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  // PUT with FormData
  putFormData: async <T>(endpoint: string, formData: FormData, authenticated: boolean = true): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'PUT',
      headers: getHeaders(authenticated, true),
      body: formData,
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  // PATCH with FormData
  patchFormData: async <T>(endpoint: string, formData: FormData, authenticated: boolean = true): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'PATCH',
      headers: getHeaders(authenticated, true),
      body: formData,
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },
};

export default api;
