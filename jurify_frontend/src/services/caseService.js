import { api } from './api';

export const caseService = {
    getMyCases: async () => {
        return api.get('/cases');
    },

    getCaseStats: async () => {
        return api.get('/cases/stats');
    }
};
