/**
 * Base API utility for making authenticated requests to the backend.
 *
 * SECURITY (httpOnly cookie auth):
 *  - JWT tokens live in httpOnly cookies set by the backend \u2014 JavaScript can never read them.
 *  - All requests include `credentials: 'include'` so the browser automatically sends cookies.
 *  - On 401, we POST to /auth/refresh/ (cookie sent automatically) to get a new access cookie.
 *  - We no longer inject an Authorization header, so XSS cannot steal and replay tokens.
 */

const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (isLocalhost ? 'http://localhost:8000/api' : '/api');

// ---------------------------------------------------------------------------
// Session logout helper \u2014 clear user metadata and redirect to login
// ---------------------------------------------------------------------------
const handleLogout = async () => {
  try {
    // Ask the backend to clear the httpOnly cookies
    await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore \u2014 still clear local state
  }
  localStorage.removeItem('user');
  window.location.href = '/#/login';
};

// ---------------------------------------------------------------------------
// Token refresh \u2014 POST to /auth/refresh/ with cookies (no body needed)
// ---------------------------------------------------------------------------
let isRefreshing = false;
let refreshQueue: Array<(success: boolean) => void> = [];

const refreshAccessToken = async (): Promise<boolean> => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      credentials: 'include', // refresh cookie is sent automatically
    });

    const success = response.ok;
    refreshQueue.forEach((cb) => cb(success));
    refreshQueue = [];

    if (!success) {
      await handleLogout();
    }
    return success;
  } catch {
    refreshQueue.forEach((cb) => cb(false));
    refreshQueue = [];
    await handleLogout();
    return false;
  } finally {
    isRefreshing = false;
  }
};

// ---------------------------------------------------------------------------
// Generic API error class
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Response handler \u2014 retries once after a token refresh on 401
// ---------------------------------------------------------------------------
const handleResponse = async <T>(
  response: Response,
  retryFn?: () => Promise<Response>
): Promise<T> => {
  if (response.status === 204) return {} as T;

  // Access token expired \u2014 try refresh then retry once
  if (response.status === 401 && retryFn) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retried = await retryFn();
      return handleResponse<T>(retried); // no retryFn \u2014 avoids infinite loop
    }
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const extractMessage = (d: any): string => {
      if (!d || typeof d !== 'object') return 'An error occurred';
      if (d.detail) return d.detail;
      if (d.message) return d.message;
      if (d.error) return d.error;
      const parts: string[] = [];
      for (const [key, val] of Object.entries(d)) {
        const msgs = Array.isArray(val) ? val.join(' ') : String(val);
        parts.push(key === 'non_field_errors' ? msgs : `${key}: ${msgs}`);
      }
      return parts.length ? parts.join(' | ') : 'An error occurred';
    };
    throw new ApiError(extractMessage(data), response.status, data);
  }

  return data as T;
};

// ---------------------------------------------------------------------------
// Base fetch wrapper \u2014 always includes credentials (cookies)
// ---------------------------------------------------------------------------
const buildHeaders = (isFormData = false): HeadersInit => {
  const headers: HeadersInit = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

const authFetch = (url: string, options: RequestInit): Promise<Response> =>
  fetch(url, { ...options, credentials: 'include' });

// ---------------------------------------------------------------------------
// Public API object
// ---------------------------------------------------------------------------
export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({ method: 'GET', headers: buildHeaders() });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  getBlob: async (endpoint: string): Promise<Blob> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({ method: 'GET', headers: buildHeaders() });
    const response = await authFetch(url, opts());

    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const retried = await authFetch(url, opts());
        if (!retried.ok) throw new ApiError('Download failed', retried.status);
        return retried.blob();
      }
      throw new ApiError('Session expired. Please log in again.', 401);
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiError(
        data.detail || data.message || data.error || 'An error occurred downloading the file',
        response.status,
        data
      );
    }
    return response.blob();
  },

  post: async <T>(endpoint: string, data?: any): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'POST',
      headers: buildHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  put: async <T>(endpoint: string, data: any): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  patch: async <T>(endpoint: string, data: any): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({ method: 'DELETE', headers: buildHeaders() });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'POST',
      headers: buildHeaders(true),
      body: formData,
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  postFormData: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'POST',
      headers: buildHeaders(true),
      body: formData,
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  putFormData: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'PUT',
      headers: buildHeaders(true),
      body: formData,
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },

  patchFormData: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const opts = (): RequestInit => ({
      method: 'PATCH',
      headers: buildHeaders(true),
      body: formData,
    });
    const response = await authFetch(url, opts());
    return handleResponse<T>(response, () => authFetch(url, opts()));
  },
};

export default api;
