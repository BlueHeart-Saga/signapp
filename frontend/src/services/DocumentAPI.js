// src/services/DocumentAPI.js
import api from "./api";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const token = localStorage.getItem("token");

// ✅ Upload local file
export const uploadDocument = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (!progressEvent.total) return;
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      if (onProgress) onProgress(Math.round(percent * 0.7)); // 70% for upload, 30% for processing
    }
  });

  // ⭐ CRITICAL FIX
  return res.data;
};


export const addFileToDocument = async (documentId, file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(
    `/documents/${documentId}/add-file`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return;
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percent * 0.8); // 80% for upload
      }
    }
  );

  return res.data;
};



// ✅ Upload from Google Drive - CORRECTED
export const uploadFromGoogleDrive = async (fileMeta, accessToken) => {
  const res = await api.post("/google-drive/upload-file", {
    file_id: fileMeta.id,
    filename: fileMeta.name,
    mime_type: fileMeta.mimeType,
    access_token: accessToken,
  });
  return res.data;
};

// ✅ Select Google Drive file (metadata only) - NEW
export const selectGoogleDriveFile = async (fileMeta, accessToken) => {
  const res = await api.post("/google-drive/select-file", {
    file_id: fileMeta.id,
    filename: fileMeta.name,
    mime_type: fileMeta.mimeType,
    access_token: accessToken,
  });
  return res.data;
};

// ✅ Upload from Dropbox - CORRECTED
export const uploadFromDropbox = async (fileMeta) => {
  const res = await api.post("/dropbox/upload-file", {
    file_id: fileMeta.id,
    filename: fileMeta.name,
    link: fileMeta.link,
    bytes: fileMeta.bytes,
  });
  return res.data;
};

// ✅ Select Dropbox file (metadata only) - NEW
export const selectDropboxFile = async (fileMeta) => {
  const res = await api.post("/dropbox/select-file", {
    file_id: fileMeta.id,
    filename: fileMeta.name,
    link: fileMeta.link,
    bytes: fileMeta.bytes,
  });
  return res.data;
};

// ✅ Upload from OneDrive - CORRECTED
export const uploadFromOneDrive = async (fileMeta, accessToken) => {
  const res = await api.post("/onedrive/upload-file", {
    file_id: fileMeta.id,
    filename: fileMeta.name,
    download_url: fileMeta.downloadUrl,
    size: fileMeta.size,
    access_token: accessToken,
  });
  return res.data;
};

// ✅ Select OneDrive file (metadata only) - NEW
export const selectOneDriveFile = async (fileMeta) => {
  const res = await api.post("/onedrive/select-file", {
    file_id: fileMeta.id,
    filename: fileMeta.name,
    download_url: fileMeta.downloadUrl,
    size: fileMeta.size,
  });
  return res.data;
};

// ✅ Upload from Box - CORRECTED
export const uploadFromBox = async (fileMeta, accessToken) => {
  const res = await api.post("/box/upload-file", {
    file_id: fileMeta.id,
    access_token: accessToken,
  });
  return res.data;
};

// ✅ Select Box file (metadata only) - NEW
export const selectBoxFile = async (fileMeta, accessToken) => {
  const res = await api.post("/box/select-file", {
    file_id: fileMeta.id,
    filename: fileMeta.name,
    access_token: accessToken,
  });
  return res.data;
};

// ✅ Get Box folder files via backend
export const getBoxFiles = async (folderId, accessToken) => {
  const res = await api.get(`/box/folder/${folderId}?access_token=${accessToken}`);
  return res.data;
};

// ✅ Token exchange for all providers
export const exchangeBoxToken = async (code) => {
  const res = await api.post("/box/token", { code });
  return res.data;
};

// ✅ Get Box folder info via backend
export const getBoxFolderInfo = async (folderId, accessToken) => {
  const res = await api.get(`/box/folder-info/${folderId}?access_token=${accessToken}`);
  return res.data;
};

export const exchangeGoogleToken = async (code) => {
  const res = await api.post("/google-drive/token", { code });
  return res.data;
};

export const exchangeDropboxToken = async (code) => {
  const res = await api.post("/dropbox/token", { code });
  return res.data;
};

export const exchangeOneDriveToken = async (code) => {
  const res = await api.post("/onedrive/token", { code });
  return res.data;
};

export const renameDocument = (documentId, filename) =>
  api.put(`/documents/${documentId}/rename`, { filename });

// ✅ Get user's documents
export const getDocuments = async () => {
  const res = await api.get("/documents");
  return res.data;
};

export const getDocumentsPaged = async (page = 1, pageSize = 10, status = null) => {
  const params = new URLSearchParams({
    page,
    page_size: pageSize
  });

  if (status) params.append("status", status);

  const res = await api.get(`/documents/paged?${params.toString()}`);
  return res.data;
};

// ✅ Get specific document
export const getDocument = async (docId) => {
  const res = await api.get(`/documents/${docId}`);
  return res.data;
};

// ✅ Get document processing status
export const getDocumentStatus = async (docId) => {
  const res = await api.get(`/documents/${docId}/status`);
  return res.data;
};


export async function getFileThumbnails(documentId, fileId) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${process.env.REACT_APP_API_BASE_URL}/documents/${documentId}/files/${fileId}/thumbnails`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to load thumbnails");
  return res.json();
}


// ✅ Download document
// export const downloadDocument = async (docId, filename) => {
//   const res = await api.get(`/documents/${docId}/download`, {
//     responseType: "blob",
//   });

//   // Handle external URLs
//   if (res.data && typeof res.data === 'object' && res.data.url) {
//     // For external files, open in new tab
//     window.open(res.data.url, '_blank');
//     return;
//   }

//   // For local files, download normally
//   const url = window.URL.createObjectURL(new Blob([res.data]));
//   const link = document.createElement("a");
//   link.href = url;
//   link.setAttribute("download", filename);
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
//   window.URL.revokeObjectURL(url);
// };

export const downloadDocument = async (id, filename, type = "signed") => {
  const token = localStorage.getItem("token");

  let url;
  let mimeType = "application/pdf";
  let downloadFilename = filename;

  if (type === "package") {
    url = `/documents/${id}/download/package?token=${encodeURIComponent(token)}`;
    mimeType = "application/zip";
    downloadFilename = filename.replace(/\.[^/.]+$/, "") + "_package.zip";
  } else if (type === "signed" || type === true) {
    url = `/documents/${id}/signed-download?token=${encodeURIComponent(token)}`;
    downloadFilename = filename.replace(/\.[^/.]+$/, "") + "_signed.pdf";
  } else {
    // type === "original" or type === false
    url = `/documents/${id}/view?token=${encodeURIComponent(token)}`;
    downloadFilename = filename;
  }

  const response = await api.get(url, { responseType: "blob" });

  const blob = new Blob([response.data], { type: mimeType });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = downloadFilename;
  link.click();

  // Clean up
  setTimeout(() => {
    window.URL.revokeObjectURL(link.href);
  }, 100);
};




// ✅ Delete document
// export const deleteDocument = async (docId) => {
//   const res = await api.delete(`/documents/${docId}`);
//   return res.data;
// };

export const viewDocumentUrl = (id) => {
  const token = localStorage.getItem("token");
  return `${process.env.REACT_APP_API_BASE_URL}/documents/${id}/view?show_fields=true&include_signatures=true&preview_type=all`;
};


export const signedPreviewUrl = (id) => {
  const token = localStorage.getItem("token");
  return `${process.env.REACT_APP_API_BASE_URL}/documents/${id}/signed-preview?token=${token}`;
};




export const voidDocument = async (id) => {
  return api.post(`/documents/${id}/void`);
};

export const restoreDocument = async (id) => {
  return api.post(`/documents/${id}/restore`);
};

export const softDeleteDocument = async (id) => {
  return api.delete(`/documents/${id}`);
};

// Add this below
export const permanentDeleteDocument = async (id) => {
  return api.delete(`/documents/${id}/permanent`);
};


export const getTimeline = async (id) => {
  const res = await api.get(`/documents/${id}/timeline`);
  return res.data;
};

// Helper for authenticated blob downloads
const authenticatedDownload = async (url, defaultFilename) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });

    // Try to get filename from Content-Disposition header
    let filename = defaultFilename;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

// ✅ Export & Reports
export const exportRecipientsCsv = async (docId) => {
  return authenticatedDownload(`/documents/${docId}/summary/recipients-csv`, `recipients_${docId}.csv`);
};

export const exportTimelineCsv = async (docId) => {
  return authenticatedDownload(`/documents/${docId}/summary/timeline-csv`, `timeline_${docId}.csv`);
};

export const exportFieldsCsv = async (docId) => {
  return authenticatedDownload(`/documents/${docId}/summary/fields-csv`, `fields_${docId}.csv`);
};

export const generateHtmlReport = async (docId) => {
  return authenticatedDownload(`/documents/${docId}/summary/html`, `report_${docId}.html`);
};


export async function fetchPdfBlob(url) {
  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("PDF fetch error:", text);
    throw new Error("Failed to fetch PDF: " + text);
  }

  return await res.blob();
}



export const getDocumentStats = async () => {
  const response = await api.get('/documents/stats');
  return response.data;
};

export const getActiveSigners = async () => {
  const response = await api.get('/documents/recipients/active');
  return response.data;
};

export const getExpiringDocuments = async () => {
  const response = await api.get('/documents/expiring');
  return response.data;
};

export const getDocumentsByStatus = async (status) => {
  const documents = await getDocuments();
  return documents.filter(doc => doc.status === status);
};


export const getRecentActivities = async (limit = 20) => {
  try {
    // First try to get from audit logs
    const response = await api.get('/documents/audit-logs/recent', { params: { limit } });
    return response.data;
  } catch (error) {
    // Fallback: generate activities from documents
    const documents = await getDocuments();
    const activities = documents.slice(0, limit).map(doc => ({
      id: doc.id,
      document_name: doc.filename,
      type: `document_${doc.status}`,
      timestamp: doc.uploaded_at,
      status: doc.status,
      document_id: doc.id
    }));
    return activities;
  }
};


// ✅ Unified upload handler - CORRECTED
export const uploadFromCloud = async (provider, fileMeta, additionalData = {}) => {
  const { downloadFile = true, accessToken } = additionalData;

  switch (provider) {
    case "google":
      return downloadFile
        ? uploadFromGoogleDrive(fileMeta, accessToken)
        : selectGoogleDriveFile(fileMeta, accessToken);

    case "dropbox":
      return downloadFile
        ? uploadFromDropbox(fileMeta)
        : selectDropboxFile(fileMeta);

    case "onedrive":
      return downloadFile
        ? uploadFromOneDrive(fileMeta, accessToken)
        : selectOneDriveFile(fileMeta);

    case "box":
      return downloadFile
        ? uploadFromBox(fileMeta, accessToken)
        : selectBoxFile(fileMeta, accessToken);

    default:
      throw new Error("Unknown cloud provider");
  }
};

// ✅ Cloud provider token exchange - NEW
export const exchangeCloudToken = async (provider, code) => {
  switch (provider) {
    case "google":
      return exchangeGoogleToken(code);
    case "dropbox":
      return exchangeDropboxToken(code);
    case "onedrive":
      return exchangeOneDriveToken(code);
    case "box":
      return exchangeBoxToken(code);
    default:
      throw new Error("Unknown cloud provider");
  }
};




export const searchDocuments = async (query, limit = 8) => {
  try {
    // Use api.get directly - it already has the base URL and auth headers
    const response = await api.get(`/documents/search?q=${encodeURIComponent(query)}&limit=${limit}`);

    // api.get already returns the response data, not the raw response
    return response.data;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};




// Get recipient analytics
export const getRecipientAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/recipients/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch recipient analytics');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
};

// Get field analytics
export const getFieldAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/fields/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch field analytics');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
};

// Get contact analytics
export const getContactAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/contacts/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch contact analytics');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
};

// Get complete analytics data
export const getCompleteAnalytics = async () => {
  try {
    const response = await api.get('/documents/analytics/complete');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    // Return empty data structure on error
    return {
      documents: { total: 0, draft: 0, sent: 0, in_progress: 0, completed: 0, declined: 0, expired: 0, voided: 0, deleted: 0 },
      recipients: { total: 0, invited: 0, viewed: 0, in_progress: 0, completed: 0, declined: 0, expired: 0, avg_signing_time: 0, completion_rate: 0, by_role: {} },
      fields: { total_fields: 0, completed_fields: 0, completion_percentage: 0, signatures: { total: 0, completed: 0, percentage: 0 }, initials: { total: 0, completed: 0, percentage: 0 }, form_fields: { total: 0, completed: 0, percentage: 0 }, checkboxes: { total: 0, completed: 0, percentage: 0 }, by_type: {} },
      activities: { total_activities: 0, last_30_days: 0, counts: { viewed: 0, downloaded: 0, signed: 0, completed: 0, declined: 0, voided: 0, uploaded: 0, sent: 0 }, daily_timeline: [] },
      subscription: { has_active: false, status: 'inactive', plan_name: 'No Active Plan', days_remaining: 0 },
      contacts: { total_contacts: 0, frequent_recipients: 0, unique_contacts: 0, recent_contacts: 0 },
      trends: []
    };
  }
};