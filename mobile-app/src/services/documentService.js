import api from './api';

const documentService = {
    getDocuments: async (status = null) => {
        try {
            const params = {};
            if (status) params.status = status;
            const response = await api.get('/documents', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching documents:', error);
            throw error;
        }
    },

    getDocument: async (documentId) => {
        try {
            const response = await api.get(`/documents/${documentId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching document ${documentId}:`, error);
            throw error;
        }
    },
};

export default documentService;
