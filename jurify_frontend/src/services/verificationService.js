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

    fetchCases: async () => {
        return [
            { id: "C201", title: "Property Dispute", status: "OPEN", assignedTo: "U1002", createdAt: new Date().toISOString() },
            { id: "C202", title: "Contract Review", status: "IN_PROGRESS", assignedTo: "U1002", createdAt: new Date().toISOString() },
            { id: "C203", title: "Family Law Case", status: "RESOLVED", assignedTo: null, createdAt: new Date().toISOString() },
        ];
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
                        documents: [], // We might not have docs here if we just list users
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
    toggleUserStatus: async (id) => { console.log("Toggle status mock", id); return true; }
};
