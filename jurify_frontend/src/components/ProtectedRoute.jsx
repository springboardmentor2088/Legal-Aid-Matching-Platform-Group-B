import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Option 1: Redirect to home (unauthorized)
        return <Navigate to="/" replace />;
        // Option 2: Show unauthorized page
        // return <div>Unauthorized</div>;
    }

    return <Outlet />;
};

export default ProtectedRoute;
