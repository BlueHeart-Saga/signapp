// services/RecipientAPI.js
import api from './api';

export const addRecipients = async (documentId, recipients) => {
  const response = await api.post(`/recipients/${documentId}/add`, recipients);
  return response.data;
};

export const getRecipients = async (documentId) => {
  const response = await api.get(`/recipients/${documentId}`);
  return response.data;
};

export const updateRecipient = async (recipientId, updates) => {
  const response = await api.put(`/recipients/${recipientId}`, updates);
  return response.data;
};

export const updateRecipientDetails = async (recipientId, details) => {
    const response = await api.put(`/recipients/${recipientId}/details`, details);
    return response.data;
  };

export const deleteRecipient = async (recipientId) => {
  const response = await api.delete(`/recipients/${recipientId}`);
  return response.data;
};

export const getPendingRecipients = async (documentId) => {
  const response = await api.get(`/recipients/${documentId}/pending`);
  return response.data;
};

export const getSignedRecipients = async (documentId) => {
  const response = await api.get(`/recipients/${documentId}/signed`);
  return response.data;
};

export const reorderRecipients = async (documentId, order) => {
  const response = await api.post(
    `/recipients/${documentId}/reorder`,
    order
  );
  return response.data;
};



export const recipientAPI = {
  getDashboard: () => api.get("/auth/recipient/dashboard"),
  getMyDocuments: () => api.get("/auth/me/documents"),
  getDocumentHistory: (id) => api.get(`/auth/documents/${id}/history`),
  getDownloadInfo: (id) => api.get(`/auth/documents/${id}/download`),
};
