import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * AdminOnly component - Conditionally renders children only for ADMIN users
 * @param {React.ReactNode} children - Components to render only for admins
 * @param {React.ReactNode} fallback - Optional fallback to render for non-admins (default: null)
 */
const AdminOnly = ({ children, fallback = null }) => {
    const { user } = useAuth();

    // Only render children if user exists and has ADMIN role
    if (user && user.role === 'ADMIN') {
        return <>{children}</>;
    }

    // Render fallback for non-admin users (default: null)
    return <>{fallback}</>;
};

export default AdminOnly;
