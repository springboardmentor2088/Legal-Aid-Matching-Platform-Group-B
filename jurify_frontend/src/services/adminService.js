import { api } from './api';

export const adminService = {
    // Get all users with optional filtering
    getAllUsers: async (params) => {
        // params: { role, status, search, page, size }
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key]) searchParams.append(key, params[key]);
        });
        return api.get(`/admin/users?${searchParams.toString()}`);
    },

    // Update a user's status (APPROVE, REJECT, SUSPEND, ACTIVE)
    updateUserStatus: async (userId, status, reason = "") => {
        return api.put(`/admin/users/${userId}/status`, null, {
            params: { status, reason }
        });
    },

    // Bulk update status
    bulkUpdateStatus: async (userIds, status, reason = "") => {
        return api.post(`/admin/users/bulk-status`, {
            userIds,
            status,
            reason
        });
    },

    // Get verification documents for a user
    getUserDocuments: async (userId) => {
        return api.get(`/admin/users/${userId}/documents`);
    },

    // Get detailed user info
    getUserDetails: async (userId) => {
        return api.get(`/admin/users/${userId}`);
    },

    // Get user cases
    getUserCases: async (userId, params = { page: 0, size: 10 }) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/admin/users/${userId}/cases?${query}`);
    }
};
