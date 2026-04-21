// services/EmailAPI.js
import api from './api';

export const sendDocumentForSignature = async (documentId, emailData) => {
  const response = await api.post(`/email/send-document`, {
    document_id: documentId,
    ...emailData
  });
  return response.data;
};

export const sendReminder = async (recipientId) => {
  const response = await api.post(`/email/send-reminder/${recipientId}`);
  return response.data;
};

export const getEmailLogs = async (documentId) => {
  const response = await api.get(`/email/email-logs/${documentId}`);
  return response.data;
};

export const sendBulkDocuments = async (bulkData) => {
  const response = await api.post('/email/send-bulk', bulkData);
  return response.data;
};
