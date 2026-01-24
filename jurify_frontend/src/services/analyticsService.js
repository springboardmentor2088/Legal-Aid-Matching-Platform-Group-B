import { api } from './api';

export const analyticsService = {
    // Get top lawyers leaderboard
    getTopLawyers: async (limit = 10) => {
        return api.get(`/analytics/leaderboard/lawyers?limit=${limit}`);
    },

    // Get top NGOs leaderboard
    getTopNGOs: async (limit = 10) => {
        return api.get(`/analytics/leaderboard/ngos?limit=${limit}`);
    },

    // Get Lawyer Insights
    getLawyerInsights: async () => {
        return api.get('/analytics/lawyer/insights');
    },

    // Get Citizen Insights
    getCitizenInsights: async () => {
        return api.get('/analytics/citizen/insights');
    },

    // Get Admin Insights
    getAdminInsights: async () => {
        return api.get('/admin/insights');
    }
};
