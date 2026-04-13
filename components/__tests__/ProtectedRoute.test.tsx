import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

import { AuthProvider } from '../../context/AuthContext';

// Mock the react-router-dom Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />
  };
});

describe('ProtectedRoute', () => {
    
  const renderWithRouter = (element: React.ReactNode) => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <Routes>
            <Route path="/*" element={element} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('renders children when the user has an allowed role', () => {
    // Mock user in localStorage
    Storage.prototype.getItem = vi.fn((key) => {
      if (key === 'user') return JSON.stringify({ role: 'ADMIN' });
      if (key === 'accessToken') return 'dummy-token';
      return null;
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER']}>
        <div data-testid="protected-content">Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects to /login when no token or user is present', () => {
    // Empty localStorage
    Storage.prototype.getItem = vi.fn(() => null);

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div data-testid="protected-content">Content</div>
      </ProtectedRoute>
    );

    const navigateElement = screen.getByTestId('navigate');
    expect(navigateElement).toBeInTheDocument();
    expect(navigateElement).toHaveAttribute('data-to', '/login');
  });

  it('redirects an unauthorized role to their respective dashboard', () => {
    Storage.prototype.getItem = vi.fn((key) => {
      if (key === 'user') return JSON.stringify({ role: 'APPLICANT' });
      if (key === 'accessToken') return 'dummy-token';
      return null;
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER']}>
        <div data-testid="protected-content">Content</div>
      </ProtectedRoute>
    );

    const navigateElement = screen.getByTestId('navigate');
    expect(navigateElement).toBeInTheDocument();
    // Applicants go to /applicant by default when they hit an unauthorized admin route
    expect(navigateElement).toHaveAttribute('data-to', '/applicant');
  });
});
