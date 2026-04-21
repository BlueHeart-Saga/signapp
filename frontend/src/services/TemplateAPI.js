// // import api from "./api"; // your axios instance with JWT auth

// // // Save template (PDF structure + fields)
// // export const saveTemplate = async (templateData) => {
// //   const res = await api.post("/templates/save", templateData);
// //   return res.data;
// // };

// // // Load template
// // export const loadTemplate = async (templateId) => {
// //   const res = await api.get(`/templates/${templateId}`);
// //   return res.data;
// // };

// // // List templates for user
// // export const getTemplates = async () => {
// //   const res = await api.get("/templates");
// //   return res.data;
// // };


// // API Integration Layer (api.js)
// const API_BASE = '/api/templates';

// export const templateAPI = {
//   // Get all templates
//   async getTemplates(params = {}) {
//     const queryParams = new URLSearchParams(params).toString();
//     const response = await fetch(`${API_BASE}/my-templates-enhanced?${queryParams}`);
//     return response.json();
//   },

//   // Generate AI template
//   async generateTemplate(data) {
//     const response = await fetch(`${API_BASE}/generate-enhanced`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data),
//     });
//     return response.json();
//   },

//   // Save template
//   async saveTemplate(templateData) {
//     const response = await fetch(API_BASE, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(templateData),
//     });
//     return response.json();
//   },

//   // Update template
//   async updateTemplate(id, updates) {
//     const response = await fetch(`${API_BASE}/${id}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(updates),
//     });
//     return response.json();
//   },

//   // Delete template
//   async deleteTemplate(id) {
//     const response = await fetch(`${API_BASE}/${id}`, {
//       method: 'DELETE',
//     });
//     return response.json();
//   },

//   // Fill document
//   async fillDocument(data) {
//     const response = await fetch(`${API_BASE}/fill-document-enhanced`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data),
//     });
//     return response.json();
//   },

//   // Create workflow
//   async createWorkflow(data) {
//     const response = await fetch(`${API_BASE}/create-workflow`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data),
//     });
//     return response.json();
//   },

//   // Capture signature
//   async captureSignature(data) {
//     const response = await fetch(`${API_BASE}/capture-signature`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data),
//     });
//     return response.json();
//   },
// };


import { API_BASE_URL, getAuthHeaders } from './api';


// templatesAPI.js
export const templatesAPI = {
  // Create template
  async createTemplate(templateData) {
    const response = await fetch(`${API_BASE_URL}/api/templates`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(templateData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create template');
    }
    
    return await response.json();
  },

  // Update template
  async updateTemplate(templateId, templateData) {
    const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(templateData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update template');
    }
    
    return await response.json();
  },

  // Get template by document
  async getTemplateByDocument(documentId) {
    const response = await fetch(`${API_BASE_URL}/api/templates/document/${documentId}`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch template');
    }
    
    return await response.json();
  },

  // Apply template to document
  // templatesAPI.js - Updated applyTemplateToDocument function
async applyTemplateToDocument(documentId, templateId) {
  // First get the template data
  const templateResponse = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
    method: 'GET',
    headers: await this.getAuthHeaders()
  });
  
  if (!templateResponse.ok) {
    const error = await templateResponse.json();
    throw new Error(error.detail || 'Failed to fetch template');
  }
  
  const templateData = await templateResponse.json();
  
  // Prepare fields with required structure
  const fields = templateData.template.fields.map(field => ({
    name: field.name || `${field.type}_${field.id}`,
    type: field.type,
    label: field.label || field.name,
    placeholder: field.placeholder || '',
    x: field.x || 0,
    y: field.y || 0,
    width: field.width || 200,
    height: field.height || 40,
    page: field.page || 0,
    required: field.required || false,
    roles: field.roles || ['signer']
  }));
  
  // Send to apply-template endpoint
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/apply-template`, {
    method: 'POST',
    headers: await this.getAuthHeaders(),
    body: JSON.stringify({ 
      template_id: templateId,
      fields: fields 
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to apply template');
  }
  
  return await response.json();
}
};
