import { api } from './api';

export const verificationService = {

    // Real endpoint for submitting verification
    submitRequest: (requestData) => {
        return api.post('/verification/submit', requestData);
    },

    // Real endpoint for pending requests
    getPendingRequests: () => {
        return api.get('/verification/pending');
    },

    // Real endpoint for approving
    approveRequest: (id) => {
        return api.post(`/verification/${id}/approve`, {});
    },

    // Real endpoint for rejecting
    rejectRequest: (id, reason) => {
        return api.post(`/verification/${id}/reject`, { reason });
    },

    // --- Mocks for missing backend endpoints ---
    fetchStats: async () => {
        return api.get('/admin/stats');
    },

    fetchUsers: async ({ page = 1, perPage = 10, search = "" } = {}) => {
        // user page is 1-indexed, backend is 0-indexed
        const response = await api.get(`/admin/users?page=${page - 1}&size=${perPage}&search=${search}`);
        return {
            total: response.totalElements,
            items: response.content
        };
    },

    fetchCases: async ({ page = 1, perPage = 10 } = {}) => {
        try {
            const response = await api.get(`/admin/cases?page=${page - 1}&size=${perPage}`);
            return response.content; // Return array directly for compatibility with existing polling or wrapped object
        } catch (e) {
            console.error("Fetch cases failed", e);
            return [];
        }
    },

    fetchAuditLogs: async ({ page = 1, perPage = 20, startDate, endDate, action, role } = {}) => {
        let url = `/admin/audit-logs?page=${page - 1}&size=${perPage}`;
        if (startDate) url += `&from=${encodeURIComponent(startDate)}`;
        if (endDate) url += `&to=${encodeURIComponent(endDate)}`;
        if (action) url += `&action=${encodeURIComponent(action)}`;
        if (role) url += `&role=${encodeURIComponent(role)}`;

        const response = await api.get(url);
        return {
            total: response.totalElements,
            items: response.content
        };
    },

    fetchAuditActions: async () => {
        try {
            const response = await api.get('/admin/audit-logs/actions');
            return response || [];
        } catch (e) {
            console.error("Failed to fetch audit actions", e);
            return [];
        }
    },

    fetchActivities: async () => {
        // Backend activity log not implemented yet, returning empty or could be recent users
        return [];
    },

    // Fetches all users and filters for unverified lawyers/NGOs
    getUnverifiedUsers: async () => {
        try {
            // Fetch a large page to get most candidates
            const response = await api.get('/admin/users?page=0&size=100');
            const users = response.content || [];

            return users
                .filter(u => !u.isVerified && (u.role === 'LAWYER' || u.role === 'NGO'))
                .map(u => {
                    let name = 'Unknown';

                    // Priority 1: Backend provided name (if available)
                    if (u.name) {
                        name = u.name;
                    }
                    // Priority 2: Role-specific details
                    else if (u.role === 'LAWYER' && u.lawyer) {
                        const f = u.lawyer.firstName || u.firstName || '';
                        const l = u.lawyer.lastName || u.lastName || '';
                        name = `${f} ${l}`.trim();
                    } else if (u.role === 'NGO' && u.ngo) {
                        name = u.ngo.organizationName || u.ngo.ngoName || u.firstName || 'NGO Organization';
                    } else if (u.firstName || u.lastName) {
                        const f = u.firstName || '';
                        const l = u.lastName || '';
                        name = `${f} ${l}`.trim();
                    }

                    // Priority 3: Email Fallback
                    if (!name || name === 'Unknown') {
                        name = u.email || 'Unknown User';
                    }

                    return {
                        id: u.id, // User ID
                        userId: u.id,
                        name: name,
                        type: u.role,
                        status: 'PENDING',
                        submittedAt: u.createdAt || new Date().toISOString(),
                        isVerified: false,
                        documents: u.documentUrl ? [{
                            name: u.documentType || "Document",
                            size: 0,
                            url: u.documentUrl,
                            originalRequestId: null
                        }] : [],
                        rejectionReason: null,
                        isUserEntity: true // Flag to know this is a direct User object, not a VerificationRequest
                    };
                });
        } catch (error) {
            console.error("Failed to fetch unverified users", error);
            return [];
        }
    },

    // Action to verify a user directly
    verifyUser: (userId) => {
        return api.post(`/admin/users/${userId}/verify`, {});
    },

    // UI Helper aliases to match the Dashboard component calls
    approveVerification: (id) => api.post(`/verification/${id}/approve`, {}),
    rejectVerification: (id, reason) => api.post(`/verification/${id}/reject`, { reason }),

    // Toggle user status (suspend/activate)
    toggleUserStatus: async (userId, currentStatus) => {
        const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        return api.put(`/admin/users/${userId}/status`, null, {
            params: { status: newStatus }
        });
    },

    // Update user status with specific status
    updateUserStatus: async (userId, status, reason = '') => {
        return api.put(`/admin/users/${userId}/status`, null, {
            params: { status, reason }
        });
    },

    // Bulk update user statuses
    bulkUpdateStatus: async (userIds, status, reason = '') => {
        return api.post('/admin/users/bulk-status', {
            userIds,
            status,
            reason
        });
    }
};
