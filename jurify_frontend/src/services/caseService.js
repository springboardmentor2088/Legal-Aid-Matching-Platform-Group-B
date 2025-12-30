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
    }
};
