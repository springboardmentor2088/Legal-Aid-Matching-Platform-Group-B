import { api } from './api';

export const caseService = {
    getMyCases: async () => {
        return api.get('/cases');
    },

    getCaseStats: async () => {
        return api.get('/cases/stats');
    },

    submitCase: async (caseData) => {
        const formData = new FormData();

        const requestData = { ...caseData };
        // Remove documents from request JSON
        delete requestData.documents;

        // Append the request part as a JSON Blob
        const jsonBlob = new Blob([JSON.stringify(requestData)], {
            type: 'application/json'
        });
        formData.append('request', jsonBlob);

        // Append documents
        if (caseData.documents && caseData.documents.length > 0) {
            caseData.documents.forEach((file) => {
                formData.append('documents', file);
            });
        }

        return api.post('/cases', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Alias for submitCase to match implementation plan naming if needed, 
    // or just keep submitCase. The plan mentioned createCase, let's expose both or just use submitCase.
    createCase: async (caseData) => {
        return caseService.submitCase(caseData);
    },

    getMatches: async (caseId) => {
        return api.get(`/matches/case/${caseId}`);
    },

    getCaseById: async (id) => {
        return api.get(`/cases/${id}`);
    },

    // Resolution methods
    submitResolution: async (caseId, document, notes) => {
        const formData = new FormData();
        formData.append('document', document);
        if (notes) {
            formData.append('notes', notes);
        }
        return api.post(`/cases/${caseId}/submit-resolution`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    acknowledgeResolution: async (caseId, feedbackData) => {
        return api.post(`/cases/${caseId}/acknowledge-resolution`, feedbackData);
    },

    getResolution: async (caseId) => {
        return api.get(`/cases/${caseId}/resolution`);
    },

    // Reporting methods
    reportCase: async (caseId, reason) => {
        return api.post('/reports', { caseId, reason });
    },

    getPendingReports: async () => {
        return api.get('/reports/pending');
    },

    dismissReport: async (reportId) => {
        return api.post(`/reports/${reportId}/dismiss`);
    },

    resolveReportAndRemoveCase: async (reportId, removalReason) => {
        return api.post(`/reports/${reportId}/resolve`, { removalReason });
    },

    getReportHistory: async () => {
        return api.get('/reports/history');
    },

    requestConsultation: async (caseId, providerId, providerType) => {
        return api.post(`/consultation/request/${caseId}/${providerId}`, null, {
            params: { providerType: providerType.toUpperCase() }
        });
    },

    getRequestedProviders: async (caseId) => {
        return api.get(`/cases/${caseId}/requested-providers`);
    },

    getMyConsultations: async () => {
        return api.get('/consultation/my-consultations');
    }
};
