import { api } from './api';

export const userService = {
    updateLocation: (locationData) => {
        // locationData should match LocationUpdateDTO
        // { latitude, longitude, addressLine1, addressLine2, city, state, pincode, country }
        return api.put('/users/profile/location', locationData);
    },
    getProfile: () => {
        return api.get('/users/profile');
    },

    // Update user preferences (notifications, theme, etc.)
    updatePreferences: async (preferences) => {
        return api.put('/users/profile/preferences', preferences);
    },

    // Change password
    changePassword: async (currentPassword, newPassword) => {
        return api.post('/users/change-password', {
            currentPassword,
            newPassword
        });
    }
};
