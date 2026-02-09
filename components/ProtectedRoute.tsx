import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    redirectTo?: string;
}

/**
 * ProtectedRoute component that checks if user is authenticated
 * and has the required role to access the route.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles,
    redirectTo = '/login'
}) => {
    const location = useLocation();

    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    // Check if user is authenticated
    if (!storedUser || !accessToken) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    const user = JSON.parse(storedUser);

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
        // Redirect based on role
        const roleRedirects: Record<UserRole, string> = {
            [UserRole.ADMIN]: '/admin',
            [UserRole.HR_MANAGER]: '/admin',
            [UserRole.EMPLOYEE]: '/employee',
            [UserRole.APPLICANT]: '/applicant',
        };

        const fallbackRoute = roleRedirects[user.role as UserRole] || '/';
        return <Navigate to={fallbackRoute} replace />;
    }

    return <>{children}</>;
};

/**
 * Hook to check if user is authenticated and get user data
 */
export const useAuth = () => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    const isAuthenticated = !!(storedUser && accessToken);
    const user = storedUser ? JSON.parse(storedUser) : null;

    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.HR_MANAGER;
    const isEmployee = user?.role === UserRole.EMPLOYEE;
    const isApplicant = user?.role === UserRole.APPLICANT;

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
    };

    return {
        isAuthenticated,
        user,
        isAdmin,
        isEmployee,
        isApplicant,
        logout,
    };
};

/**
 * Get the appropriate dashboard route for a user's role
 */
export const getDashboardRoute = (role: UserRole): string => {
    switch (role) {
        case UserRole.ADMIN:
        case UserRole.HR_MANAGER:
            return '/admin';
        case UserRole.EMPLOYEE:
            return '/employee';
        case UserRole.APPLICANT:
            return '/applicant';
        default:
            return '/';
    }
};

export default ProtectedRoute;
