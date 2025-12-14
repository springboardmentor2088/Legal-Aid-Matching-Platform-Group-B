import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = () => {
    const { user, isAuthenticated } = useAuth();

    if (isAuthenticated) {
        // Redirect to role-based dashboard if already logged in
        if (user?.role === 'CITIZEN') return <Navigate to="/citizen/dashboard" replace />;
        if (user?.role === 'LAWYER') return <Navigate to="/lawyer/dashboard" replace />;
        if (user?.role === 'NGO') return <Navigate to="/ngo/dashboard" replace />;
        if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
