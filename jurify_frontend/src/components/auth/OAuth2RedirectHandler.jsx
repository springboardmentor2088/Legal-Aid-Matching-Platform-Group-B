import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';

const OAuth2RedirectHandler = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

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
                        localStorage.setItem('user', JSON.stringify(user));

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
                        navigate('/login?error=profile_fetch_failed');
                    });
            });
        } else {
            navigate('/login?error=oauth_failed');
        }
    }, [searchParams, navigate]);

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
