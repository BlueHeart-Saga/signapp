import api from './api';

const recipientService = {
    getRecipientInfo: async (recipientId) => {
        const response = await api.get(`/signing/recipient/${recipientId}`);
        return response.data;
    },

    verifyOTP: async (recipientId, otp) => {
        const response = await api.post(`/signing/recipient/${recipientId}/verify-otp`, { otp });
        return response.data;
    },

    submitField: async (recipientId, fieldId, value) => {
        const response = await api.post(`/signing/recipient/${recipientId}/fields/${fieldId}/complete`, { value });
        return response.data;
    },

    acceptTerms: async (recipientId) => {
        const response = await api.post(`/signing/recipient/${recipientId}/accept-terms`, { accepted: true });
        return response.data;
    },

    listRecipients: async (documentId) => {
        const response = await api.get(`/recipients/${documentId}`);
        return response.data;
    },

    getDocumentFields: async (documentId, recipientId) => {
        const response = await api.get(`/documents/${documentId}/fields`, {
            params: { recipient_id: recipientId }
        });
        return response.data;
    }
};

export default recipientService;
