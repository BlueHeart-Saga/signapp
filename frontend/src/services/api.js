import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ❌ No response → network / server down
    if (!error.response) {
      // Still transform network errors since they don't have response data
      const networkError = new Error("Unable to connect to server. Please try again later.");
      networkError.response = { status: 0, data: { detail: "Network error" } };
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;

    // 🔐 Unauthorized → logout (still handle this side effect)
    if (status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    // Return the original error object so components can access full error details
    return Promise.reject(error);
  }
);

// helper to set token on axios
export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

// Try to set token from localStorage on initial load
const token = localStorage.getItem("token");
if (token) {
  setAuthToken(token);
}

// ✅ Automatically include token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Recipient roles
// Recipient roles
export const RecipientRoles = {
  SIGNER: 'signer',
  APPROVER: 'approver',
  VIEWER: 'viewer',
  FORM_FILLER: 'form_filler',
  WITNESS: 'witness',
  IN_PERSON_SIGNER: 'in_person_signer'
};

export const RoleDescriptions = {
  [RecipientRoles.SIGNER]: 'Must sign the document. Can add initials, signature, or stamp.',
  [RecipientRoles.APPROVER]: 'Reads the document and clicks "Approve". Does not sign with a signature.',
  [RecipientRoles.VIEWER]: 'Can view and download the document. No action required.',
  [RecipientRoles.FORM_FILLER]: 'Enter data into text fields, upload files, complete form. No signature required.',
  [RecipientRoles.WITNESS]: 'Confirms signature of another party. Often signs after the primary signer.',
  [RecipientRoles.IN_PERSON_SIGNER]: 'Signer signs physically at a device presented by the sender.'
};

export const recipientAPI = {
  // Get all recipients for a document
  getRecipients: async (documentId) => {
    const response = await api.get(`/recipients/${documentId}`);
    return response.data;
  },

  // Add multiple recipients
  addRecipients: async (documentId, recipientsData) => {
    const response = await api.post(`/recipients/${documentId}/add`, recipientsData);
    return response.data;
  },

  // Add bulk recipients using template
  addBulkRecipients: async (documentId, templateData) => {
    const response = await api.post(`/recipients/${documentId}/add-bulk-template`, templateData);
    return response.data;
  },

  // Update recipient
  updateRecipient: async (recipientId, recipientData) => {
    const response = await api.put(`/recipients/${recipientId}`, recipientData);
    return response.data;
  },

  updateRecipientDetails: async (recipientId, details) => {
    const response = await api.put(`/recipients/${recipientId}/details`, details);
    return response.data;
  },

  // Delete recipient
  deleteRecipient: async (recipientId) => {
    const response = await api.delete(`/recipients/${recipientId}`);
    return response.data;
  },

  // Reorder recipients
  reorderRecipients: async (documentId, newOrder) => {
    const response = await api.post(`/recipients/${documentId}/reorder`, newOrder);
    return response.data;
  },

  // Send signing invites
  sendSigningInvites: async (documentId, inviteData) => {
    const response = await api.post(`/recipients/${documentId}/send-invites`, inviteData);
    return response.data;
  },

  // Send reminder
  sendReminder: async (recipientId) => {
    const response = await api.post(`/recipients/${recipientId}/send-reminder`);
    return response.data;
  },

  // Get recipient details
  getRecipient: async (recipientId) => {
    const response = await api.get(`/recipients/${recipientId}`);
    return response.data;
  },

  // Get all available roles
  getRoles: async () => {
    const response = await api.get('/recipients/roles/all');
    return response.data;
  },


  // Contact APIs
  getContacts: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/recipients/contacts/?${queryParams}`);
    return response.data;
  },

  getContact: async (contactId) => {
    const response = await api.get(`/recipients/contacts/${contactId}`);
    return response.data;
  },

  createContact: async (contactData) => {
    const response = await api.post('/recipients/contacts/', contactData);
    return response.data;
  },

  updateContact: async (contactId, contactData) => {
    const response = await api.put(`/recipients/contacts/${contactId}`, contactData);
    return response.data;
  },

  deleteContact: async (contactId) => {
    const response = await api.delete(`/recipients/contacts/${contactId}`);
    return response.data;
  },

  toggleFavorite: async (contactId, isFavorite) => {
    const response = await api.post(`/recipients/contacts/${contactId}/favorite`, { is_favorite: isFavorite });
    return response.data;
  },

  getContactGroups: async () => {
    const response = await api.get('/recipients/contacts/groups/all');
    return response.data;
  },

  searchContacts: async (query, limit = 10) => {
    const response = await api.get(`/recipients/contacts/search/suggest?q=${query}&limit=${limit}`);
    return response.data;
  },

  importContacts: async (data) => {
    const response = await api.post('/recipients/contacts/import/recipients', data);
    return response.data;
  },

  // New recipient with contact options
  addRecipientsWithContacts: async (documentId, recipients) => {
    const response = await api.post(`/recipients/${documentId}/add`, {
      recipients: recipients.map(recipient => ({
        ...recipient,
        // Convert boolean to backend format
        save_to_contacts: recipient.saveToContacts || false,
        contact_group: recipient.contactGroup,
        mark_as_favorite: recipient.markAsFavorite || false
      }))
    });
    return response.data;
  },

  saveAsContact: async (recipientId, data) => {
    const response = await api.post(`/recipients/${recipientId}/save-contact`, data);
    return response.data;
  },
};




// Signing API functions
export const signingAPI = {
  // Get document for signing
  getRecipientInfo: (recipientId) =>
    api.get(`/signing/recipient/${recipientId}`),

  getSigningStatus: (recipientId) =>
    api.get(`/signing/recipient/${recipientId}/status`),

  downloadDocument: (recipientId) =>
    api.get(`/signing/recipient/${recipientId}/document`, {
      responseType: 'blob'
    }),

  // Verify OTP
  verifyOTP: async (recipientId, otp) => {
    const response = await api.post(`/signing/${recipientId}/verify-otp`, { otp });
    return response.data;
  },
  // Resend OTP
  resendOTP: async (recipientId) => {
    const response = await api.post(`/signing/${recipientId}/resend-otp`);
    return response.data;
  },

  // Submit signature
  submitSignature: async (recipientId, signature) => {
    const response = await api.post(`/signing/${recipientId}/sign`, { signature });
    return response.data;
  }
};

// Helper function for API calls
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Documents API
export const documentsAPI = {
  getDocuments: () => apiRequest('/documents'),
  getDocument: (id) => apiRequest(`/documents/${id}`),
  deleteDocument: (id) => apiRequest(`/documents/${id}`, { method: 'DELETE' }),
  downloadDocument: async (id, filename) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/documents/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// Templates API
export const templatesAPI = {
  getTemplates: () => apiRequest('/templates'),
  getTemplate: (id) => apiRequest(`/templates/${id}`),
  createTemplate: (data) => apiRequest('/templates/save', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteTemplate: (id) => apiRequest(`/templates/${id}`, { method: 'DELETE' }),
};



// new



// AI Template Builder API
export const aiTemplatesAPI = {
  // Generate template
  generateTemplate: (data) => api.post('/api/ai/templates/generate', data),

  // Get user templates
  getUserTemplates: (params) => api.get('/api/ai/templates/user-templates', { params }),

  // Get template by ID
  getTemplate: (id) => api.get(`/api/ai/templates/templates/${id}`),

  // Get template edit mode
  getTemplateEditMode: (id) => api.get(`/api/ai/templates/templates/${id}/edit-mode`),

  // Get template preview mode
  getTemplatePreviewMode: (id) => api.get(`/api/ai/templates/templates/${id}/preview-mode`),

  // Update template
  updateTemplate: (id, data) => api.put(`/api/ai/templates/templates/${id}`, data),

  // Add field to template
  addField: (templateId, fieldData) => api.post(`/api/ai/templates/templates/${templateId}/fields`, fieldData),

  // Clone template
  cloneTemplate: (id, newName) => api.post(`/api/ai/templates/templates/${id}/clone`, { new_name: newName }),

  // Delete template
  deleteTemplate: (id) => api.delete(`/api/ai/templates/templates/${id}`),

  // Convert to document
  convertToDocument: (id, data) => api.post(`/api/ai/templates/templates/${id}/convert-to-document`, data),

  // Analyze document
  analyzeDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/ai/templates/analyze-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Normalize template
  normalizeTemplate: (id) => api.post(`/api/ai/templates/templates/${id}/normalize`),

  // Smart field suggestions
  suggestSmartFields: (content) => api.post('/api/ai/templates/smart-fields', { template_content: content }),

  // Auto position fields
  autoPositionFields: (content, fields) =>
    api.post('/api/ai/templates/auto-position-fields', {
      template_content: content,
      fields_data: JSON.stringify(fields)
    }),

  // Get template types
  getTemplateTypes: () => api.get('/api/ai/templates/template-types'),

  // Get statistics
  getStatistics: () => api.get('/api/ai/templates/statistics'),
};





export default api;

