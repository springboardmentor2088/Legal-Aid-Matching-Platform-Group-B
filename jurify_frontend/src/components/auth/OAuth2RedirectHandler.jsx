import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useToast } from '../common/ToastContext';

const OAuth2RedirectHandler = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken && refreshToken) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Fetch user details to sync context
            import('../../services/api').then(({ api }) => {
                api.get('/users/me')
                    .then(user => {
                        // Map userId to id for frontend consistency
                        if (user.userId && !user.id) {
                            user.id = user.userId;
                        }
                        localStorage.setItem('user', JSON.stringify(user));

                        showToast({ message: "Login successful!", type: "success" });

                        // Redirect based on role
                        const role = user.role ? user.role.toUpperCase() : '';
                        let redirectPath = '/';

                        if (role === 'CITIZEN') redirectPath = '/citizen/dashboard';
                        else if (role === 'LAWYER') redirectPath = '/lawyer/dashboard';
                        else if (role === 'NGO') redirectPath = '/ngo/dashboard';
                        else if (role === 'ADMIN') redirectPath = '/admin/dashboard';

                        window.location.href = redirectPath;
                    })
                    .catch(e => {
                        console.error("Failed to fetch user profile", e);
                        showToast({ message: "Failed to fetch user profile", type: "error" });
                        navigate('/login?error=profile_fetch_failed');
                    });
            });
        } else {
            showToast({ message: "Google login failed", type: "error" });
            navigate('/login?error=oauth_failed');
        }
    }, [searchParams, navigate, showToast]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Logging you in...</p>
            </div>
        </div>
    );
};

export default OAuth2RedirectHandler;
