import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { logoutFromBackend } from '../services/authApi';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    requireSuperuser?: boolean;
    redirectTo?: string;
}

/**
 * ProtectedRoute — checks authentication by reading the user metadata object
 * from localStorage.  The actual JWT lives in an httpOnly cookie; this component
 * only uses the non-sensitive user metadata (role, name) for UI routing decisions.
 *
 * SECURITY NOTE: The cookie cannot be read by JavaScript (httpOnly), so we have
 * no way to verify the token here.  Any forged localStorage user object will be
 * rejected by the backend on the first authenticated API call (401), which then
 * triggers `handleLogout()` in api.ts \u2014 clearing localStorage and redirecting here.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles,
    requireSuperuser = false,
    redirectTo = '/login'
}) => {
    const location = useLocation();

    // Only the non-sensitive user metadata object is stored in localStorage.
    // Tokens are never stored here.
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    let user: any;
    try {
        user = JSON.parse(storedUser);
    } catch {
        // Corrupted localStorage entry \u2014 clear and redirect
        localStorage.removeItem('user');
        return <Navigate to={redirectTo} replace />;
    }

    // Superuser check (host dashboard)
    if (requireSuperuser) {
        if (!user.isSuperuser) {
            return <Navigate to="/" replace />;
        }
        return <>{children}</>;
    }

    // Role-based access check
    if (!allowedRoles.includes(user.role)) {
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
 * useAuth \u2014 hook to access current user state and auth helpers anywhere in the app.
 */
export const useAuth = () => {
    const storedUser = localStorage.getItem('user');

    const isAuthenticated = !!storedUser;
    let user: any = null;
    try {
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
        localStorage.removeItem('user');
    }

    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.HR_MANAGER;
    const isEmployee = user?.role === UserRole.EMPLOYEE;
    const isApplicant = user?.role === UserRole.APPLICANT;

    const logout = async () => {
        await logoutFromBackend(); // clears httpOnly cookies on the backend
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
