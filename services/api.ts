/**
 * Base API utility for making authenticated requests to the backend.
 * Handles JWT token injection, error handling, and response parsing.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Get the auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
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

// Handle API response
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return {} as T; // No content
  }
  
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const message = data.detail || data.message || data.error || 'An error occurred';
    throw new ApiError(message, response.status, data);
  }
  
  return data as T;
};

// API Methods
export const api = {
  get: async <T>(endpoint: string, authenticated: boolean = true): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(authenticated),
    });
    return handleResponse<T>(response);
  },
  
  post: async <T>(endpoint: string, data?: any, authenticated: boolean = true): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(authenticated),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },
  
  put: async <T>(endpoint: string, data: any, authenticated: boolean = true): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(authenticated),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },
  
  patch: async <T>(endpoint: string, data: any, authenticated: boolean = true): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(authenticated),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },
  
  delete: async <T>(endpoint: string, authenticated: boolean = true): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(authenticated),
    });
    return handleResponse<T>(response);
  },
  
  // For file uploads
  upload: async <T>(endpoint: string, formData: FormData, authenticated: boolean = true): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(authenticated, true),
      body: formData,
    });
    return handleResponse<T>(response);
  },
};

export default api;
