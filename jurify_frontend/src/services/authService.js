import { api } from './api';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.accessToken) {
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('user', JSON.stringify({
                id: response.userId,
                email: response.email,
                role: response.role,
                firstName: response.firstName,
                lastName: response.lastName,
                isEmailVerified: response.isEmailVerified,
                phone: response.phone,
                gender: response.gender,
                dob: response.dob,
                addressLine1: response.addressLine1,
                addressLine2: response.addressLine2,
                city: response.city,
                state: response.state,
                country: response.country,
                pincode: response.pincode
            }));
        }
        return response;
    },

    getProfile: async () => {
        return api.get('/users/me');
    },

    updateProfile: async (profileData) => {
        return api.put('/users/profile', profileData);
    },

    register: async (userData) => {
        let role;
        let data = userData;

        if (userData instanceof FormData) {
            role = userData.get('role');
            // We don't necessarily need to remove role from FormData, 
            // but if we did, we'd need to create a new FormData.
            // Sending it is fine.
        } else {
            // Standard JSON object
            role = userData.role;
            const { role: r, ...rest } = userData;
            data = rest;
        }

        return api.post(`/register/${role.toLowerCase()}`, data,
            (userData instanceof FormData) ? { headers: { 'Content-Type': undefined } } : {}
        );
        // Note: setting 'Content-Type': undefined lets the browser set the Content-Type to multipart/form-data
        // with the correct boundary needed for the backend to parse it.

    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    updateDirectoryStatus: async (isActive) => {
        return api.patch('/users/directory-status', { isActive });
    },

    forgotPassword: async (email) => {
        return api.post('/auth/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return api.post('/auth/reset-password', { token, newPassword });
    }
};
