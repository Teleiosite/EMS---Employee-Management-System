import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    requireSuperuser?: boolean;
    redirectTo?: string;
}

/**
 * ProtectedRoute - consumes AuthContext to perform routing decisions.
 * Actual verification happens on the backend via httpOnly cookies.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles,
    requireSuperuser = false,
    redirectTo = '/login'
}) => {
    const location = useLocation();
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Superuser check (host dashboard)
    if (requireSuperuser) {
        if (!user.isSuperuser) {
            return <Navigate to="/" replace />;
        }
        return <>{children}</>;
    }

    // Role-based access check
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
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
