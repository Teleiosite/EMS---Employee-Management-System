import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../types';
import { logoutFromBackend } from '../services/authApi';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isSuperuser: boolean;
  tenantName?: string;
  subscriptionTier?: string;
  employeeLimit?: number;
  employeeCount?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  isApplicant: boolean;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize user from localStorage on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await logoutFromBackend();
    } catch (err) {
      console.error('Backend logout failed:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      // Force redirect to landing
      window.location.href = '#/';
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === UserRole.ADMIN || user?.role === UserRole.HR_MANAGER,
    isEmployee: user?.role === UserRole.EMPLOYEE,
    isApplicant: user?.role === UserRole.APPLICANT,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
