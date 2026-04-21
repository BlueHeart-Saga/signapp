const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'API request failed');
  }
  
  return response.json();
};

export const documentAPI = {
  getDocument: (documentId) => 
    apiRequest(`/documents/${documentId}`),
  
  getRecipients: (documentId) => 
    apiRequest(`/recipients/${documentId}`),
  
  getFields: (documentId) => 
    apiRequest(`/documents/${documentId}/fields`),
  
  saveFields: (documentId, fields) =>
    apiRequest(`/documents/${documentId}/fields`, {
      method: 'POST',
      body: JSON.stringify(fields),
    }),
  
  sendInvites: (documentId, data) => 
    apiRequest(`/recipients/${documentId}/send-invites`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getBuilderPdfUrl: (documentId) =>
    `${API_BASE_URL}/documents/${documentId}/builder-pdf?token=${localStorage.getItem('token')}`,

  getOwnerPreviewUrl: (documentId) =>
    `${API_BASE_URL}/documents/${documentId}/owner-preview?token=${localStorage.getItem('token')}`,
  
  renameDocument: (documentId, filename) =>
    apiRequest(`/documents/${documentId}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ filename }),
    }),
  
  addRecipient: (documentId, recipientData) =>
    apiRequest(`/recipients/${documentId}/add`, {
      method: 'POST',
      body: JSON.stringify({ recipients: [recipientData] }),
    }),
};
