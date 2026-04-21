// import React, { useState, useEffect } from 'react';
// import { 
//   FaFilePdf, 
//   FaFileImage, 
//   FaFileAlt, 
//   FaTrash, 
//   FaDownload,
//   FaUsers,
//   FaSearch,
//   FaTimes,
//   FaFolderOpen,
//   FaClock,
//   FaCloudUploadAlt,
//   FaExclamationTriangle
// } from 'react-icons/fa';
// import { documentsAPI } from '../services/api';
// import '../style/documents.css';

// export default function Documents() {
//   const [documents, setDocuments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [deleteConfirm, setDeleteConfirm] = useState(null);

//   // Load documents from API
//   const loadDocuments = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       const data = await documentsAPI.getDocuments();
//       console.log('Documents loaded:', data);
//       setDocuments(data);

//     } catch (err) {
//       console.error('Error loading documents:', err);
//       setError(err.message || 'Failed to load documents');
//       setDocuments([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadDocuments();
//   }, []);

//   // Delete document
//   const handleDelete = async (documentId) => {
//     try {
//       setError('');
//       await documentsAPI.deleteDocument(documentId);
//       setDocuments(documents.filter(d => d.id !== documentId));
//       setDeleteConfirm(null);
//     } catch (err) {
//       setError(err.message || 'Failed to delete document');
//       console.error('Error deleting document:', err);
//     }
//   };

//   // Download document
//   const handleDownload = async (documentId, filename) => {
//     try {
//       setError('');
//       await documentsAPI.downloadDocument(documentId, filename);
//     } catch (err) {
//       setError(err.message || 'Failed to download document');
//       console.error('Error downloading document:', err);
//     }
//   };

//   // Filter documents based on search
//   const filteredDocuments = documents.filter(document =>
//     document.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     document.source?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // Format date
//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   // Format file size
//   const formatFileSize = (bytes) => {
//     if (!bytes || bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   // Get file icon based on mime type
//   const getFileIcon = (mimeType, filename) => {
//     if (mimeType === 'application/pdf') {
//       return <FaFilePdf className="file-icon pdf" />;
//     } else if (mimeType && mimeType.includes('image')) {
//       return <FaFileImage className="file-icon image" />;
//     } else {
//       return <FaFileAlt className="file-icon default" />;
//     }
//   };

//   // Retry loading documents
//   const handleRetry = () => {
//     loadDocuments();
//   };

//   if (loading) {
//     return (
//       <div className="documents-container">
//         <div className="loading-state">
//           <div className="spinner"></div>
//           <p>Loading documents...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="documents-container">
//       {/* Header */}
//       <div className="documents-header">
//         <div className="header-content">
//           <h1 className="page-title">My Documents</h1>
//           <p className="page-subtitle">
//             Manage all your uploaded documents
//           </p>
//         </div>
//         <button 
//           className="btn btn-primary"
//           onClick={() => window.location.href = '/upload'}
//         >
//           <FaCloudUploadAlt className="btn-icon" />
//           Upload Document
//         </button>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="error-message">
//           <FaExclamationTriangle className="error-icon" />
//           <div className="error-content">
//             <p><strong>Error loading documents:</strong> {error}</p>
//             <p className="error-help">
//               Check if your backend server 
//             </p>
//           </div>
//           <div className="error-actions">
//             <button onClick={handleRetry} className="btn btn-outline btn-sm">
//               Retry
//             </button>
//             <button onClick={() => setError('')} className="close-error">
//               <FaTimes />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Search Bar - Only show if we have documents */}
//       {documents.length > 0 && (
//         <div className="search-section">
//           <div className="search-box">
//             <FaSearch className="search-icon" />
//             <input
//               type="text"
//               placeholder="Search documents by name or source..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="search-input"
//             />
//             {searchTerm && (
//               <button 
//                 className="clear-search"
//                 onClick={() => setSearchTerm('')}
//               >
//                 <FaTimes />
//               </button>
//             )}
//           </div>
//           <div className="documents-stats">
//             <span className="stat-badge">
//               {filteredDocuments.length} of {documents.length} documents
//             </span>
//           </div>
//         </div>
//       )}

//       {/* Documents Grid */}
//       {filteredDocuments.length === 0 && !error ? (
//         <div className="empty-state">
//           {searchTerm ? (
//             <>
//               <FaSearch className="empty-icon" />
//               <h3>No documents found</h3>
//               <p>No documents match your search criteria</p>
//               <button 
//                 className="btn btn-outline"
//                 onClick={() => setSearchTerm('')}
//               >
//                 Clear Search
//               </button>
//             </>
//           ) : (
//             <>
//               <FaFolderOpen className="empty-icon" />
//               <h3>No documents yet</h3>
//               <p>Upload your first document to get started</p>
//               <button 
//                 className="btn btn-primary"
//                 onClick={() => window.location.href = '/upload'}
//               >
//                 <FaCloudUploadAlt className="btn-icon" />
//                 Upload Your First Document
//               </button>
//             </>
//           )}
//         </div>
//       ) : (
//         <div className="documents-grid">
//           {filteredDocuments.map((document) => (
//             <div key={document.id} className="document-card">
//               <div className="document-card-header">
//                 <div className="document-icon">
//                   {getFileIcon(document.mime_type, document.filename)}
//                 </div>
//                 <div className="document-actions">
//                   <button 
//                     className="btn-icon"
//                     onClick={() => handleDownload(document.id, document.filename)}
//                     title="Download Document"
//                   >
//                     <FaDownload />
//                   </button>
//                   <button 
//                     className="btn-icon danger"
//                     onClick={() => setDeleteConfirm(document.id)}
//                     title="Delete Document"
//                   >
//                     <FaTrash />
//                   </button>
//                 </div>
//               </div>

//               <div className="document-card-body">
//                 <h3 className="document-name" title={document.filename}>
//                   {document.filename}
//                 </h3>

//                 <div className="document-meta">
//                   <div className="meta-item">
//                     <FaClock className="meta-icon" />
//                     <span className="meta-text">
//                       {formatDate(document.uploaded_at)}
//                     </span>
//                   </div>
//                   <div className="meta-item">
//                     <span className="file-size">
//                       {formatFileSize(document.size)}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="document-info">
//                   <div className="info-row">
//                     <span className="info-label">Source:</span>
//                     <span className={`source-badge source-${document.source?.toLowerCase() || 'local'}`}>
//                       {document.source || 'Local'}
//                     </span>
//                   </div>
//                   <div className="info-row">
//                     <span className="info-label">Status:</span>
//                     <span className={`status-badge status-${document.status?.toLowerCase() || 'active'}`}>
//                       {document.status || 'Active'}
//                     </span>
//                   </div>
//                   <div className="info-row">
//                     <span className="info-label">Recipients:</span>
//                     <span className="recipients-info">
//                       <FaUsers className="recipients-icon" />
//                       {document.signed_count || 0} of {document.recipient_count || 0} signed
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="document-card-footer">
//                 <button 
//                   className="btn btn-primary btn-sm"
//                   onClick={() => handleDownload(document.id, document.filename)}
//                 >
//                   <FaDownload className="btn-icon" />
//                   Download
//                 </button>
//                 <button 
//                   className="btn btn-outline btn-sm"
//                   onClick={() => window.location.href = `/documents/${document.id}/manage`}
//                 >
//                   <FaUsers className="btn-icon" />
//                   Manage
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       {deleteConfirm && (
//         <div className="modal-backdrop">
//           <div className="modal">
//             <div className="modal-header">
//               <h3>Delete Document</h3>
//               <button 
//                 className="close-btn"
//                 onClick={() => setDeleteConfirm(null)}
//               >
//                 <FaTimes />
//               </button>
//             </div>
//             <div className="modal-content">
//               <p>Are you sure you want to delete this document? This action cannot be undone and will also delete all related recipients and signatures.</p>
//             </div>
//             <div className="modal-footer">
//               <button 
//                 className="btn btn-secondary"
//                 onClick={() => setDeleteConfirm(null)}
//               >
//                 Cancel
//               </button>
//               <button 
//                 className="btn btn-danger"
//                 onClick={() => handleDelete(deleteConfirm)}
//               >
//                 <FaTrash className="btn-icon" />
//                 Delete Document
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaTrash,
  FaDownload,
  FaUsers,
  FaSearch,
  FaTimes,
  FaFolderOpen,
  FaClock,
  FaCloudUploadAlt,
  FaExclamationTriangle,
  FaEye,
  FaList,
  FaTh,
  FaFilter,
  FaFire
} from 'react-icons/fa';
import { FaFolder } from "react-icons/fa";
import { restoreDocument, permanentDeleteDocument } from "../services/DocumentAPI";

import { documentsAPI } from '../services/api';
import { uploadDocument } from '../services/DocumentAPI';
import '../style/documents.css';
import '../style/TemplatesList.css';
import { useAuth } from '../context/AuthContext';
import SubscriptionExpiredBlock from '../components/SubscriptionExpiredBlock';
import { CircularProgress, Box } from '@mui/material';

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

export default function DocumentsAndTemplates() {
  const { user, loading: authLoading } = useAuth();
  // ============ DOCUMENTS STATE ============
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ============ TEMPLATES STATE ============
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [templateSearch, setTemplateSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [categories, setCategories] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [popularTemplates, setPopularTemplates] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const [trashDocuments, setTrashDocuments] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "",
    danger: false,
    onConfirm: null,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ============ UI STATE ============
  const [activeTab, setActiveTab] = useState('templates'); // 'documents' or 'templates'
  const token = localStorage.getItem("token");

  const navigate = useNavigate();
  const location = useLocation();



  // Sync activeTab with URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['templates', 'documents', 'trash'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // ============ DOCUMENTS FUNCTIONS ============
  const loadDocuments = async () => {
    try {
      setDocumentsLoading(true);
      setDocumentsError('');
      const data = await documentsAPI.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Error loading documents:', err);
      setDocumentsError(err.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };


  const loadTrashDocuments = async () => {
    try {
      setTrashLoading(true);
      const res = await fetch(
        `${API_BASE}/documents/paged?status=deleted`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to load trash");

      const data = await res.json();
      setTrashDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTrashLoading(false);
    }
  };

  const getDeletedDate = (doc) => {
    const date =
      doc.deleted_at ||
      doc.deletedAt ||
      doc.updated_at ||
      doc.updatedAt ||
      doc.created_at ||
      doc.createdAt;

    if (!date) return "—";

    const parsed = new Date(date);
    return isNaN(parsed.getTime())
      ? "—"
      : parsed.toLocaleString();
  };


  useEffect(() => {
    if (activeTab === "trash") {
      loadTrashDocuments();
    }
  }, [activeTab]);


  const handleDelete = async (documentId) => {
    try {
      setDocumentsError('');
      await documentsAPI.deleteDocument(documentId);
      setDocuments(documents.filter(d => d.id !== documentId));
      setDeleteConfirm(null);
    } catch (err) {
      setDocumentsError(err.message || 'Failed to delete document');
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      setDocumentsError('');
      await documentsAPI.downloadDocument(documentId, filename);
    } catch (err) {
      setDocumentsError(err.message || 'Failed to download document');
    }
  };

  const handleViewPdf = async (templateId) => {
    if (!templateId) {
      console.error("Template ID is missing");
      alert("Template ID not available");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/admin/templates/user/download/${templateId}?format=pdf`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to load PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      setShowPdfViewer(true);
    } catch (err) {
      alert("Unable to open PDF");
    }
  };

  const handleViewDocumentPdf = async (document) => {
    try {
      if (!document?.id) {
        alert("Document ID missing");
        return;
      }

      const res = await fetch(
        `${API_BASE}/documents/${document.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to load document PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      setShowPdfViewer(true);
    } catch (err) {
      console.error(err);
      alert("Unable to open document PDF");
    }
  };



  useEffect(() => {
    if (showPdfViewer) {
      document.body.classList.add("dt-no-scroll");
    } else {
      document.body.classList.remove("dt-no-scroll");
    }
  }, [showPdfViewer]);



  const filteredDocuments = documents.filter(document =>
    document.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    document.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType, filename) => {
    if (mimeType === 'application/pdf') {
      return <FaFilePdf className="file-icon pdf" />;
    } else if (mimeType && mimeType.includes('image')) {
      return <FaFileImage className="file-icon image" />;
    } else {
      return <FaFileAlt className="file-icon default" />;
    }
  };

  // ============ TEMPLATES FUNCTIONS ============
  const getTemplateId = (template) => {
    if (!template) return null;
    if (template._id && typeof template._id === 'object' && template._id.$oid) {
      return template._id.$oid;
    }
    if (typeof template._id === 'string') return template._id;
    if (template.id) return template.id;
    return null;
  };

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError("");

      const params = new URLSearchParams({
        page,
        limit,
      });

      if (templateSearch) params.append("search", templateSearch);
      if (categoryId) params.append("category_id", categoryId);
      if (freeOnly) params.append("free_only", "true");

      const res = await fetch(`${API_BASE}/admin/templates/user/available?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load templates");

      const data = await res.json();
      const processedTemplates = (data.templates || []).map(template => ({
        ...template,
        id: getTemplateId(template),
      }));

      setTemplates(processedTemplates);
      setTotalPages(data.pagination?.pages || 1);
      setTotalTemplates(data.pagination?.total || 0);
    } catch (err) {
      setTemplatesError(err.message || "Something went wrong");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/templates/user/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const processedCategories = (data.categories || []).map(cat => ({
        ...cat,
        id: getTemplateId(cat),
      }));
      setCategories(processedCategories);
    } catch (err) {
      console.error("Category fetch failed:", err);
    }
  };

  const fetchPopularTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/templates/user/stats/popular?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const processedTemplates = (data.popular_templates || []).map(template => ({
        ...template,
        id: getTemplateId(template),
      }));
      setPopularTemplates(processedTemplates);
    } catch (err) {
      console.error("Popular templates fetch failed:", err);
    }
  };

  const getTemplateDetails = async (templateId) => {
    try {
      if (!templateId) throw new Error("Template ID is required");
      const res = await fetch(`${API_BASE}/admin/templates/user/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load template details");
      const template = await res.json();
      return {
        ...template,
        id: getTemplateId(template),
      };
    } catch (err) {
      console.error("Get template details error:", err);
      throw err;
    }
  };

  const handlePreview = async (templateId) => {
    try {
      if (!templateId) {
        alert("Template ID is missing");
        return;
      }
      const template = await getTemplateDetails(templateId);
      setSelectedTemplate(template);
      setPreviewModalOpen(true);
    } catch (err) {
      alert("Failed to load template details");
    }
  };

  const handleUseTemplate = async (templateId, templateTitle) => {
    try {
      if (!templateId) {
        alert("Template ID is missing");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Step 1: Download template
      const downloadRes = await fetch(
        `${API_BASE}/admin/templates/user/download/${templateId}?format=pdf`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!downloadRes.ok) {
        const errorText = await downloadRes.text();
        console.error("Download error response:", errorText);
        throw new Error(`Failed to download template: ${downloadRes.status}`);
      }

      const blob = await downloadRes.blob();

      // Create FormData for upload
      const formData = new FormData();
      const file = new File([blob], `${templateTitle}.pdf`, {
        type: blob.type || "application/pdf",
      });
      formData.append("file", file);

      // Step 2: Upload to documents endpoint
      const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error("Upload error response:", errorText);
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }

      const uploadResult = await uploadRes.json();
      console.log("Upload result:", uploadResult);

      // Extract document from response
      const uploadedDocument = uploadResult.document || uploadResult.data || uploadResult;

      if (!uploadedDocument) {
        throw new Error("No document data in upload response");
      }

      // Show success
      setSnackbar({
        open: true,
        message: "Template uploaded successfully!",
        severity: "success",
      });

      // Navigate to prepare-send with ID
      const docId = uploadedDocument.id || uploadedDocument._id;
      navigate(`/user/prepare-send/${docId}`, {
        state: {
          document: uploadedDocument,
          fromTemplate: true,
          templateName: templateTitle,
        },
      });

    } catch (err) {
      console.error("Use template error:", err);

      setSnackbar({
        open: true,
        message: err.message || "Failed to use template",
        severity: "error",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadTemplate = async (templateId, templateTitle, isFree) => {
    try {
      if (!templateId) {
        alert("Template ID is missing");
        return;
      }

      if (!isFree) {
        const confirmPurchase = window.confirm(
          "This is a premium template. Would you like to purchase it?"
        );
        if (!confirmPurchase) return;
      }

      const res = await fetch(
        `${API_BASE}/admin/templates/user/download/${templateId}?format=original`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = templateTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".pdf";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // alert(`Template "${templateTitle}" downloaded successfully!`);
      fetchPopularTemplates();
    } catch (err) {
      alert(err.message || "Failed to download template");
    }
  };

  const fetchSearchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/admin/templates/user/search/suggestions?query=${encodeURIComponent(query)}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Search suggestions failed:", err);
    }
  };

  const handleSearchChange = (value) => {
    setTemplateSearch(value);
    setPage(1);
    fetchSearchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === "template") {
      setTemplateSearch(suggestion.value);
    } else if (suggestion.type === "tag") {
      setTemplateSearch(suggestion.value);
    }
    setShowSuggestions(false);
  };

  const closePreviewModal = () => {
    setPreviewModalOpen(false);
    setSelectedTemplate(null);
  };

  const useSelectedTemplate = () => {
    if (selectedTemplate) {
      const templateId = getTemplateId(selectedTemplate);
      if (templateId) {
        handleUseTemplate(templateId, selectedTemplate.title);
        closePreviewModal();
      } else {
        alert("Invalid template ID");
      }
    }
  };

  const downloadSelectedTemplate = () => {
    if (selectedTemplate) {
      const templateId = getTemplateId(selectedTemplate);
      if (templateId) {
        handleDownloadTemplate(
          templateId,
          selectedTemplate.title,
          selectedTemplate.is_free
        );
        closePreviewModal();
      } else {
        alert("Invalid template ID");
      }
    }
  };

  const handleUseDocument = async (document) => {
    try {
      const token = localStorage.getItem("token");

      // Download existing document
      const res = await fetch(`${API_BASE}/documents/${document.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to download document");

      const blob = await res.blob();

      // Create File object
      const file = new File([blob], document.filename, {
        type: document.mime_type || "application/pdf",
      });

      const formData = new FormData();
      formData.append("file", file);

      // Upload again (same as template use)
      const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const result = await uploadRes.json();
      const uploadedDocument = result.document || result;

      const docId = uploadedDocument.id || uploadedDocument._id;
      navigate(`/user/prepare-send/${docId}`, {
        state: {
          document: uploadedDocument,
          fromDocument: true,
        },
      });
    } catch (err) {
      alert(err.message || "Failed to use document");
    }
  };


  // ============ EFFECTS ============
  useEffect(() => {
    loadDocuments();
    fetchCategories();
    fetchPopularTemplates();
    fetchTemplates();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTemplates();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, templateSearch, categoryId, freeOnly]);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', bgcolor: '#f8fafc' }}>
        <CircularProgress />
      </Box>
    );
  }

  // ============ RENDER ============
  return (
    <div className="documents-templates-container">
      {/* Header Section */}
      <div className="dt-header">
        <div className="dt-header-content">
          <h1 className="dt-page-title">Document Center</h1>
          <p className="dt-page-subtitle">
            Manage your documents and browse professional templates
          </p>
        </div>
        <div className="dt-header-actions">
          <button
            className="dt-btn dt-btn-primary"
            onClick={() => navigate("/user/documents")}
          >
            <FaCloudUploadAlt />
            Upload Document
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="dt-tabs">
        <button
          className={`dt-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => navigate(`${location.pathname}?tab=templates`)}
        >
          <FaFileAlt className="dt-tab-icon" />
          Templates
          <span className="dt-tab-badge">{totalTemplates}</span>
        </button>
        <button
          className={`dt-tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => navigate(`${location.pathname}?tab=documents`)}
        >
          <FaFolderOpen className="dt-tab-icon" />
          My Documents
          <span className="dt-tab-badge">{documents.length}</span>
        </button>

        <button
          className={`dt-tab ${activeTab === 'trash' ? 'active' : ''}`}
          onClick={() => navigate(`${location.pathname}?tab=trash`)}
        >
          <FaTrash className="dt-tab-icon" />
          Trash
        </button>

      </div>

      {/* Content Area */}
      <div className="dt-content">
        {activeTab === 'documents' && (
          <div className="dt-documents-section">
            {/* Documents Error Message */}
            {documentsError && (
              <div className="dt-error-message">
                <FaExclamationTriangle className="dt-error-icon" />
                <div className="dt-error-content">
                  <p><strong>Error loading documents:</strong> {documentsError}</p>
                </div>
                <div className="dt-error-actions">
                  <button onClick={loadDocuments} className="dt-btn dt-btn-outline dt-btn-sm">
                    Retry
                  </button>
                  <button onClick={() => setDocumentsError('')} className="dt-close-error">
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}

            {/* Documents Search Bar */}
            {documents.length > 0 && (
              <div className="dt-search-section">
                <div className="dt-search-box">
                  <FaSearch className="dt-search-icon" />
                  <input
                    type="text"
                    placeholder="Search documents by name or source..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="dt-search-input"
                  />
                  {searchTerm && (
                    <button
                      className="dt-clear-search"
                      onClick={() => setSearchTerm('')}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                <div className="dt-documents-stats">
                  <span className="dt-stat-badge">
                    {filteredDocuments.length} of {documents.length} documents
                  </span>
                </div>
              </div>
            )}

            {/* Documents Loading */}
            {documentsLoading ? (
              <div className="dt-loading-state">
                <div className="dt-spinner"></div>
                <p>Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 && !documentsError ? (
              <div className="dt-empty-state">
                {searchTerm ? (
                  <>
                    <FaSearch className="dt-empty-icon" />
                    <h3>No documents found</h3>
                    <p>No documents match your search criteria</p>
                    <button
                      className="dt-btn dt-btn-outline"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <FaFolderOpen className="dt-empty-icon" />
                    <h3>No documents yet</h3>
                    <p>Upload your first document to get started</p>
                    <button
                      className="dt-btn dt-btn-primary"
                      onClick={() => navigate("/user/documents")}
                    >
                      <FaCloudUploadAlt className="dt-btn-icon" />
                      Upload a Document to Get Started
                    </button>

                  </>
                )}
              </div>
            ) : (
              <div className="dt-documents-grid">
                {filteredDocuments.map((document) => (
                  <div key={document.id} className="dt-document-card">
                    <div className="dt-document-card-header">
                      <div className="dt-document-icon">
                        {getFileIcon(document.mime_type, document.filename)}
                      </div>
                      <div className="dt-document-actions">
                        <button
                          className="dt-btn-icon"
                          onClick={() => handleDownload(document.id, document.filename)}
                          title="Download Document"
                        >
                          <FaDownload />
                        </button>
                        <button
                          className="dt-btn-icon dt-danger"
                          onClick={() => setDeleteConfirm(document.id)}
                          title="Delete Document"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="dt-document-card-body">
                      <h3 className="dt-document-name" title={document.filename}>
                        {document.filename}
                      </h3>

                      <div className="dt-document-meta">
                        <div className="dt-meta-item">
                          <FaClock className="dt-meta-icon" />
                          <span className="dt-meta-text">
                            {formatDate(document.uploaded_at)}
                          </span>
                        </div>
                        <div className="dt-meta-item">
                          <span className="dt-file-size">
                            {formatFileSize(document.size)}
                          </span>
                        </div>
                      </div>

                      <div className="dt-document-info">
                        <div className="dt-info-row">
                          <span className="dt-info-label">Source:</span>
                          <span className={`dt-source-badge dt-source-${document.source?.toLowerCase() || 'local'}`}>
                            {document.source || 'Local'}
                          </span>
                        </div>
                        <div className="dt-info-row">
                          <span className="dt-info-label">Status:</span>
                          <span className={`dt-status-badge dt-status-${document.status?.toLowerCase() || 'active'}`}>
                            {document.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="dt-document-card-footer">
                      <button
                        className="dt-btn dt-btn-outline dt-btn-sm"
                        onClick={() => handleViewDocumentPdf(document)}
                      >
                        {/* <FaEye className="dt-btn-icon" /> */}
                        View PDF
                      </button>

                      {/* <button 
    className="dt-btn dt-btn-primary dt-btn-sm"
    onClick={() => handleDownload(document.id, document.filename)}
  >
    <FaDownload className="dt-btn-icon" />
    Download
  </button> */}

                      <button
                        className="dt-btn dt-btn-primary dt-btn-sm"
                        onClick={() => handleUseDocument(document)}
                      >
                        <FaCloudUploadAlt />
                        Use Document
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        )}

        {/* TEMPLATES TAB */}
        {activeTab === "templates" && (
          <div className="dt-templates-section">
            <div className="dt-templates-layout">
              {/* Templates Sidebar */}
              <div className="dt-sidebar">
                <div className="dt-filter-section">
                  <h3 className="dt-filter-title">
                    <FaFilter className="dt-filter-icon" />
                    Filter Templates
                  </h3>

                  <div className="dt-filter-group">
                    <label className="dt-filter-label">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setPage(1);
                      }}
                      className="dt-filter-select"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id || cat._id} value={cat.id || cat._id}>
                          {cat.name} ({cat.template_count})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dt-filter-group">
                    <label className="dt-checkbox-label">
                      <input
                        type="checkbox"
                        checked={freeOnly}
                        onChange={(e) => {
                          setFreeOnly(e.target.checked);
                          setPage(1);
                        }}
                        className="dt-checkbox"
                      />
                      <span>Show Free Templates Only</span>
                    </label>
                  </div>

                  <div className="dt-filter-group">
                    <label className="dt-filter-label">View Mode</label>
                    <div className="dt-view-toggle">
                      <button
                        className={`dt-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                      >
                        <FaTh /> Grid
                      </button>
                      <button
                        className={`dt-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                      >
                        <FaList /> List
                      </button>
                    </div>
                  </div>

                  <button
                    className="dt-reset-btn"
                    onClick={() => {
                      setTemplateSearch("");
                      setCategoryId("");
                      setFreeOnly(false);
                      setPage(1);
                    }}
                  >
                    Reset Filters
                  </button>
                </div>

                {popularTemplates.length > 0 && (
                  <div className="dt-popular-section">
                    <h3 className="dt-popular-title">
                      <FaFire className="dt-popular-icon" />
                      Most Popular
                    </h3>
                    <div className="dt-popular-list">
                      {popularTemplates.map((template) => (
                        <div
                          key={template.id || template._id}
                          className="dt-popular-item"
                          onClick={() => handleSearchChange(template.title)}
                        >
                          <div className="dt-popular-info">
                            <strong>{template.title}</strong>
                            <small>{template.category_name}</small>
                          </div>
                          <span className="dt-download-badge">
                            <FaDownload /> {template.download_count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Templates Main Content */}
              <div className="dt-main-content">
                {/* Search Bar */}
                <div className="dt-search-container">
                  <div className="dt-search-wrapper">
                    <FaSearch className="dt-search-icon" />
                    <input
                      type="text"
                      placeholder="Search templates by title, description, or tags..."
                      value={templateSearch}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="dt-search-input"
                    />
                    <button className="dt-search-btn" onClick={() => fetchTemplates()}>
                      <FaSearch />
                    </button>

                    {showSuggestions && suggestions.length > 0 && (
                      <div className="dt-suggestions-dropdown">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="dt-suggestion-item"
                            onMouseDown={() => handleSuggestionClick(suggestion)}
                          >
                            <span className="dt-suggestion-type">{suggestion.type}:</span>
                            <span className="dt-suggestion-value">{suggestion.value}</span>
                            {suggestion.count && (
                              <span className="dt-suggestion-count">({suggestion.count})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="dt-results-info">
                    Showing {templates.length} of {totalTemplates} templates
                    {templateSearch && ` for "${templateSearch}"`}
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="dt-upload-progress">
                    <div className="dt-upload-progress-bar">
                      <div
                        className="dt-upload-progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p>Uploading template... {uploadProgress}%</p>
                  </div>
                )}

                {/* Templates Loading */}
                {templatesLoading ? (
                  <div className="dt-loading-container">
                    <div className="dt-spinner"></div>
                    <p>Loading templates...</p>
                  </div>
                ) : templatesError ? (
                  <div className="dt-error-alert">
                    <p>⚠️ {templatesError}</p>
                    <button onClick={fetchTemplates} className="dt-btn dt-btn-outline">
                      Try Again
                    </button>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="dt-no-results">
                    <FaSearch className="dt-no-results-icon" />
                    <h3>No templates found</h3>
                    <p>Try adjusting your search or filters</p>
                    <button
                      onClick={() => {
                        setTemplateSearch("");
                        setCategoryId("");
                        setFreeOnly(false);
                      }}
                      className="dt-btn dt-btn-outline"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="dt-templates-grid">
                    {templates.map((template) => {
                      const templateId = getTemplateId(template);

                      return (
                        <div key={templateId} className="dt-template-card">
                          <div className="dt-card-header">
                            <span className={`dt-tag ${template.is_free ? 'dt-free-tag' : 'dt-premium-tag'}`}>
                              {template.is_free ? "FREE" : "PREMIUM"}
                            </span>
                            <span className="dt-download-count">
                              <FaDownload /> {template.download_count || 0}
                            </span>
                          </div>

                          <div className="dt-card-body">
                            <h3 className="dt-template-title">{template.title}</h3>
                            <p className="dt-template-description">
                              {template.description || "No description"}
                            </p>

                            <div className="dt-category">
                              <FaFolder /> {template.category_name}
                            </div>

                            {template.tags && template.tags.length > 0 && (
                              <div className="dt-tags">
                                {template.tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} className="dt-tag-item">#{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="dt-card-footer">
                            <button
                              onClick={() => handlePreview(templateId)}
                              className="dt-btn dt-btn-outline dt-btn-sm"
                              disabled={!templateId}
                            >
                              <FaEye /> Preview
                            </button>
                            {/* <button
                              onClick={() => handleDownloadTemplate(
                                templateId,
                                template.title,
                                template.is_free
                              )}
                              className={`dt-btn dt-btn-sm ${template.is_free ? 'dt-btn-outline' : 'dt-btn-premium'}`}
                              disabled={!templateId}
                            >
                              <FaDownload /> Download
                            </button> */}

                            {/* const templateId = getTemplateId(template); */}

                            {/* <button
  disabled={!templateId}
  onClick={() => handleViewPdf(templateId)}
  className="dt-btn dt-btn-outline dt-btn-sm"
>
  <FaEye /> View PDF
</button> */}


                            <button
                              onClick={() => handleUseTemplate(templateId, template.title)}
                              className="dt-btn dt-btn-primary dt-btn-sm"
                              disabled={isUploading || !templateId}
                            >
                              {isUploading ? "Processing..." : "Use Template"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="dt-templates-list">
                    <table className="dt-templates-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Type</th>
                          <th>Downloads</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templates.map((template) => {
                          const templateId = getTemplateId(template);

                          return (
                            <tr key={templateId}>
                              <td>
                                <strong>{template.title}</strong>
                                <p className="dt-table-description">{template.description}</p>
                              </td>
                              <td>{template.category_name}</td>
                              <td>
                                <span className={`dt-type-badge ${template.is_free ? 'dt-free-badge' : 'dt-premium-badge'}`}>
                                  {template.is_free ? "Free" : "Premium"}
                                </span>
                              </td>
                              <td>{template.download_count || 0}</td>
                              <td className="dt-action-buttons">
                                <button
                                  onClick={() => handlePreview(templateId)}
                                  className="dt-btn dt-btn-outline dt-btn-sm"
                                  disabled={!templateId}
                                >
                                  Details
                                </button>
                                <button
                                  onClick={() => handleUseTemplate(templateId, template.title)}
                                  className="dt-btn dt-btn-primary dt-btn-sm"
                                  disabled={isUploading || !templateId}
                                >
                                  Use
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="dt-pagination">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="dt-page-btn"
                    >
                      ← Previous
                    </button>

                    <div className="dt-page-numbers">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            className={`dt-page-btn ${page === pageNum ? 'active' : ''}`}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="dt-page-btn"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* TRASH TAB */}
        {activeTab === "trash" && (
          <div className="dt-documents-section">
            <h3 style={{ marginBottom: 12 }}>Deleted Documents</h3>

            {trashLoading ? (
              <div className="dt-loading-state">
                <div className="dt-spinner"></div>
                <p>Loading trash…</p>
              </div>
            ) : trashDocuments.length === 0 ? (
              <div className="dt-empty-state">
                <FaTrash className="dt-empty-icon" />
                <h3>Trash is empty</h3>
                <p>Deleted documents will appear here</p>
              </div>
            ) : (
              <div className="dt-documents-grid">
                {trashDocuments.map((doc) => (
                  <div key={doc.id} className="dt-document-card">
                    <div className="dt-document-card-body">
                      <h3 className="dt-document-name" title={doc.filename}>
                        {doc.filename}
                      </h3>

                      <div className="dt-document-meta">
                        <div className="dt-meta-row">
                          <span className="dt-meta-label">Deleted on</span>
                          <strong>{getDeletedDate(doc)}</strong>
                        </div>

                        <div className="dt-meta-row">
                          <span className="dt-meta-label">Status</span>
                          <span className={`dt-status-badge dt-status-${doc.status}`}>
                            {doc.status}
                          </span>
                        </div>

                        {doc.size && (
                          <div className="dt-meta-row">
                            <span className="dt-meta-label">Size</span>
                            <span>{formatFileSize(doc.size)}</span>
                          </div>
                        )}

                        {doc.source && (
                          <div className="dt-meta-row">
                            <span className="dt-meta-label">Source</span>
                            <span className={`dt-source-badge dt-source-${doc.source}`}>
                              {doc.source}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>


                    <div className="dt-document-card-footer">

                      {/* 👁 View PDF – always allowed */}
                      <button
                        className="dt-btn dt-btn-outline dt-btn-sm"
                        onClick={() => handleViewDocumentPdf(doc)}
                      >
                        <FaEye />
                        View PDF
                      </button>

                      {/* ♻️ Restore – ONLY if voided */}
                      {doc.status === "deleted" && (
                        <button
                          className="dt-btn dt-btn-outline dt-btn-sm"
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              title: "Restore document?",
                              message:
                                "This document will be restored to your documents list.",
                              confirmText: "Restore Document",
                              danger: false,
                              onConfirm: async () => {
                                await restoreDocument(doc.id);
                                loadTrashDocuments();
                                loadDocuments();
                              },
                            })
                          }
                        >
                          ♻️ Restore
                        </button>
                      )}


                      {/* 🔥 Permanent delete */}
                      <button
                        className="dt-btn dt-btn-danger dt-btn-sm"
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            title: "Permanently delete document?",
                            message: (
                              <>
                                <p>
                                  This action <strong>cannot be undone</strong>.
                                </p>
                                <p>
                                  The document, signatures, recipients, and audit trail will be
                                  permanently removed.
                                </p>
                              </>
                            ),
                            confirmText: "Delete Permanently",
                            danger: true,
                            onConfirm: async () => {
                              await permanentDeleteDocument(doc.id);
                              loadTrashDocuments();
                            },
                          })
                        }
                      >
                        Delete Forever
                      </button>

                    </div>


                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="dt-modal-backdrop">
          <div className="dt-modal">
            <div className="dt-modal-header">
              <h3>Delete Document</h3>
              <button
                className="dt-close-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="dt-modal-content">
              <p>Are you sure you want to delete this document? This action cannot be undone.</p>
            </div>
            <div className="dt-modal-footer">
              <button
                className="dt-btn dt-btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="dt-btn dt-btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                <FaTrash className="dt-btn-icon" />
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewModalOpen && selectedTemplate && (
        <div className="dt-preview-modal">
          <div className="dt-preview-overlay" onClick={closePreviewModal} />
          <div className="dt-preview-content">
            <div className="dt-preview-header">
              <h2>{selectedTemplate.title}</h2>
              <button className="dt-close-btn" onClick={closePreviewModal}>
                ×
              </button>
            </div>
            <div className="dt-preview-body">
              <div className="dt-template-info">
                <div className="dt-info-row">
                  <span className="dt-label">Category:</span>
                  <span className="dt-value">{selectedTemplate.category_name}</span>
                </div>
                <div className="dt-info-row">
                  <span className="dt-label">Type:</span>
                  <span className={`dt-badge ${selectedTemplate.is_free ? 'dt-free' : 'dt-premium'}`}>
                    {selectedTemplate.is_free ? "Free" : "Premium"}
                  </span>
                </div>
                <div className="dt-info-row">
                  <span className="dt-label">Downloads:</span>
                  <span className="dt-value">{selectedTemplate.download_count || 0}</span>
                </div>
                {selectedTemplate.description && (
                  <div className="dt-info-row dt-full-width">
                    <span className="dt-label">Description:</span>
                    <p className="dt-description">{selectedTemplate.description}</p>
                  </div>
                )}
              </div>
              <div className="dt-preview-actions">
                <button
                  onClick={useSelectedTemplate}
                  className="dt-btn dt-btn-primary"
                  disabled={isUploading || !getTemplateId(selectedTemplate)}
                >
                  {isUploading ? "Processing..." : "Use This Template"}
                </button>
                <button
                  onClick={() => handleViewPdf(getTemplateId(selectedTemplate))}
                  className="dt-btn dt-btn-outline"
                >
                  View PDF
                </button>

                <button
                  onClick={downloadSelectedTemplate}
                  className={`dt-btn ${selectedTemplate.is_free ? 'dt-btn-outline' : 'dt-btn-premium'}`}
                  disabled={!getTemplateId(selectedTemplate)}
                >
                  {selectedTemplate.is_free ? "Download Free" : "Purchase & Download"}
                </button>
                <button className="dt-btn dt-btn-secondary" onClick={closePreviewModal}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="upload-overlay">
          <div className="upload-card">
            <div className="loader-ring">
              <div className="inner-ring" />
            </div>

            <h3>Uploading template…</h3>

            <p className="filename">{templateSearch || "Template document"}</p>

            <div className="percent">{uploadProgress}%</div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            <button
              className="cancel-btn"
              onClick={() => {
                setIsUploading(false);
                setUploadProgress(0);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Snackbar for Notifications */}
      {snackbar.open && (
        <div className="snackbar" style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: snackbar.severity === 'success' ? '#4caf50' : '#f44336',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '4px',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideUp 0.3s ease'
        }}>
          {snackbar.message}
          <button
            onClick={() => setSnackbar({ ...snackbar, open: false })}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              marginLeft: '16px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}


      {showPdfViewer && (
        <div className="dt-preview-modal">
          <div
            className="dt-preview-overlay"
            onClick={() => {
              setShowPdfViewer(false);
              URL.revokeObjectURL(pdfUrl);
              setPdfUrl("");
            }}
          />

          <div className="dt-preview-content" style={{ width: "80%", height: "85%" }}>
            <div className="dt-preview-header">
              <h2>Template Preview</h2>
              <button
                className="dt-close-btn"
                onClick={() => {
                  setShowPdfViewer(false);
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl("");
                }}
              >
                ×
              </button>
            </div>

            <div className="dt-preview-body" style={{ height: "100%" }}>
              <iframe
                src={pdfUrl}
                title="PDF Preview"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            </div>
          </div>
        </div>
      )}

      {confirmDialog.open && (
        <div className="dt-modal-backdrop">
          <div className={`dt-modal ${confirmDialog.danger ? "dt-modal-danger" : ""}`}>

            <div className="dt-modal-header">
              <h3>{confirmDialog.title}</h3>
              <button
                className="dt-close-btn"
                onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              >
                <FaTimes />
              </button>
            </div>

            <div className="dt-modal-content">
              <p>{confirmDialog.message}</p>

              {confirmDialog.danger && (
                <div className="dt-danger-box">
                  <FaExclamationTriangle />
                  <span>This action cannot be undone</span>
                </div>
              )}
            </div>

            <div className="dt-modal-footer">
              <button
                className="dt-btn dt-btn-secondary"
                onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              >
                Cancel
              </button>

              <button
                className={`dt-btn ${confirmDialog.danger ? "dt-btn-danger" : "dt-btn-primary"
                  }`}
                onClick={async () => {
                  await confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, open: false });
                }}
              >
                {confirmDialog.confirmText}
              </button>
            </div>

          </div>
        </div>
      )}



    </div>
  );
}
