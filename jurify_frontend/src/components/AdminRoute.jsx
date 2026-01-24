import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
    const { user, isAuthenticated } = useAuth();

    // If not logged in, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If user role is not ADMIN, redirect to unauthorized
    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/unauthorized" replace />;
    }

    // User is authenticated and has ADMIN role
    return <Outlet />;
};

export default AdminRoute;
