import React, { useEffect, useState } from "react";
import "../style/TemplatesList.css";
import { uploadDocument } from "../services/DocumentAPI";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const UserTemplatesList = () => {
  // Template states
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);
  
  // Filter states
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [popularTemplates, setPopularTemplates] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Template action states
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const token = localStorage.getItem("token");

  // Helper function to get template ID (handles both string and object _id)
  const getTemplateId = (template) => {
    if (!template) return null;
    
    // If _id is an object with $oid property (MongoDB BSON format)
    if (template._id && typeof template._id === 'object' && template._id.$oid) {
      return template._id.$oid;
    }
    
    // If _id is already a string
    if (typeof template._id === 'string') {
      return template._id;
    }
    
    // If id property exists
    if (template.id) {
      return template.id;
    }
    
    return null;
  };

  // Fetch available templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page,
        limit,
      });

      if (search) params.append("search", search);
      if (categoryId) params.append("category_id", categoryId);
      if (freeOnly) params.append("free_only", "true");

      const res = await fetch(`${API_BASE_URL}/admin/templates/user/available?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load templates");
      }

      const data = await res.json();
      
      // Ensure templates have proper IDs
      const processedTemplates = (data.templates || []).map(template => ({
        ...template,
        // Extract ID for easy access
        id: getTemplateId(template),
      }));
      
      setTemplates(processedTemplates);
      setTotalPages(data.pagination?.pages || 1);
      setTotalTemplates(data.pagination?.total || 0);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/templates/user/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      // Process categories to ensure proper IDs
      const processedCategories = (data.categories || []).map(cat => ({
        ...cat,
        id: getTemplateId(cat),
      }));
      
      setCategories(processedCategories);
    } catch (err) {
      console.error("Category fetch failed:", err);
    }
  };

  // Fetch popular templates
  const fetchPopularTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/templates/user/stats/popular?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      // Process popular templates to ensure proper IDs
      const processedTemplates = (data.popular_templates || []).map(template => ({
        ...template,
        id: getTemplateId(template),
      }));
      
      setPopularTemplates(processedTemplates);
    } catch (err) {
      console.error("Popular templates fetch failed:", err);
    }
  };

  // Get template details for preview
  const getTemplateDetails = async (templateId) => {
    try {
      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const res = await fetch(`${API_BASE_URL}/admin/templates/user/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error("Failed to load template details");
      }
      
      const template = await res.json();
      
      // Ensure the template has a proper ID
      return {
        ...template,
        id: getTemplateId(template),
      };
    } catch (err) {
      console.error("Get template details error:", err);
      throw err;
    }
  };

  // Preview template (show details modal)
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

  // Preview PDF directly
  const handlePreviewPDF = async (templateId, templateTitle) => {
    try {
      if (!templateId) {
        alert("Template ID is missing");
        return;
      }

      const res = await fetch(
  `${API_BASE_URL}/admin/templates/user/download/${templateId}`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);


      if (!res.ok) {
        throw new Error("Failed to load PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      
      // Open PDF in new tab
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        alert("Please allow pop-ups to view the PDF");
        return;
      }
      
      // Clean up after some time
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setPdfPreviewUrl(null);
      }, 10000);
    } catch (err) {
      alert("Failed to preview PDF");
    }
  };

  // Use template (upload as document)
  const handleUseTemplate = async (templateId, templateTitle) => {
    try {
      if (!templateId) {
        alert("Template ID is missing");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Step 1: Download template file
      const res = await fetch(
  `${API_BASE_URL}/admin/templates/user/download/${templateId}`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);


      if (!res.ok) {
        throw new Error("Failed to download template");
      }

      // Step 2: Convert to blob and create File object
      const blob = await res.blob();
      const file = new File([blob], `${templateTitle}.pdf`, {
        type: blob.type || "application/pdf",
      });

      // Step 3: Upload using DocumentAPI
      const response = await uploadDocument(file, (percent) => {
        setUploadProgress(percent);
      });

      // Step 4: Check response and redirect
      if (response && response.document) {
        const documentId = response.document.id || response.document._id;
        if (documentId) {
          window.location.href = `/document-builder/${documentId}`;
        } else {
          throw new Error("No document ID in response");
        }
      } else {
        throw new Error("Invalid response from upload");
      }
    } catch (err) {
      console.error("Use template error:", err);
      alert(err.message || "Failed to use template");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Download template
  const handleDownload = async (templateId, templateTitle, isFree) => {
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
  `${API_BASE_URL}/admin/templates/user/download/${templateId}`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);


      if (!res.ok) {
        throw new Error("Download failed");
      }

      // Create download link
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

      alert(`Template "${templateTitle}" downloaded successfully!`);
      fetchPopularTemplates(); // Refresh download counts
    } catch (err) {
      alert(err.message || "Failed to download template");
    }
  };

  // Search suggestions
  const fetchSearchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/templates/user/search/suggestions?query=${encodeURIComponent(query)}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Search suggestions failed:", err);
    }
  };

  // Handle search input
  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
    fetchSearchSuggestions(value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === "template") {
      setSearch(suggestion.value);
    } else if (suggestion.type === "tag") {
      setSearch(suggestion.value);
    }
    setShowSuggestions(false);
  };

  // Close preview modal
  const closePreviewModal = () => {
    setPreviewModalOpen(false);
    setSelectedTemplate(null);
  };

  // Use selected template from modal
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

  // Download selected template from modal
  const downloadSelectedTemplate = () => {
    if (selectedTemplate) {
      const templateId = getTemplateId(selectedTemplate);
      if (templateId) {
        handleDownload(
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

  // Preview PDF from modal
  const previewPDFFromModal = () => {
    if (selectedTemplate) {
      const templateId = getTemplateId(selectedTemplate);
      if (templateId) {
        handlePreviewPDF(templateId, selectedTemplate.title);
      } else {
        alert("Invalid template ID");
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchPopularTemplates();
    fetchTemplates();
  }, []);

  // Fetch templates when filters change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTemplates();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, search, categoryId, freeOnly]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  return (
    <div className="templates-container">
      {/* Header */}
      <div className="templates-header">
        <h1>Document Templates</h1>
        <p>Browse and download professional document templates</p>
      </div>

      <div className="templates-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="filter-section">
            <h3>Filter Templates</h3>
            
            <div className="filter-group">
              <label>Category</label>
              <select 
                value={categoryId} 
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.name} ({cat.template_count})
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={freeOnly}
                  onChange={(e) => {
                    setFreeOnly(e.target.checked);
                    setPage(1);
                  }}
                />
                <span>Show Free Templates Only</span>
              </label>
            </div>

            <div className="filter-group">
              <label>View Mode</label>
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  List
                </button>
              </div>
            </div>

            <button
              className="reset-btn"
              onClick={() => {
                setSearch("");
                setCategoryId("");
                setFreeOnly(false);
                setPage(1);
              }}
            >
              Reset Filters
            </button>
          </div>

          {popularTemplates.length > 0 && (
            <div className="popular-section">
              <h3>Most Popular</h3>
              <div className="popular-list">
                {popularTemplates.map((template) => (
                  <div key={template.id || template._id} className="popular-item">
                    <div className="popular-info">
                      <strong>{template.title}</strong>
                      <small>{template.category_name}</small>
                    </div>
                    <span className="download-badge">
                      {template.download_count} downloads
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Search Bar */}
          <div className="search-container">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search templates by title, description, or tags..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="search-input"
              />
              <button className="search-btn">🔍</button>
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onMouseDown={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="suggestion-type">{suggestion.type}:</span>
                      <span className="suggestion-value">{suggestion.value}</span>
                      {suggestion.count && (
                        <span className="suggestion-count">({suggestion.count})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="results-info">
              Showing {templates.length} of {totalTemplates} templates
              {search && ` for "${search}"`}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading templates...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-alert">
              <p>⚠️ {error}</p>
              <button onClick={fetchTemplates}>Try Again</button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="upload-progress-container">
              <div className="upload-progress-bar">
                <div 
                  className="upload-progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p>Uploading template... {uploadProgress}%</p>
            </div>
          )}

          {/* No Results */}
          {!loading && templates.length === 0 && !error && (
            <div className="no-results">
              <p>No templates found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategoryId("");
                  setFreeOnly(false);
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Templates Grid/List */}
          {!loading && templates.length > 0 && (
            <>
              {viewMode === "grid" && (
                <div className="templates-grid">
                  {templates.map((template) => {
                    const templateId = getTemplateId(template);
                    
                    return (
                      <div key={templateId} className="template-card">
                        <div className="card-header">
                          <span className={`tag ${template.is_free ? 'free-tag' : 'premium-tag'}`}>
                            {template.is_free ? "FREE" : "PREMIUM"}
                          </span>
                          <span className="download-count">
                            ⬇️ {template.download_count || 0}
                          </span>
                        </div>
                        
                        <div className="card-body">
                          <h3>{template.title}</h3>
                          <p className="description">{template.description || "No description"}</p>
                          
                          <div className="category">
                            📁 {template.category_name}
                          </div>
                          
                          {template.tags && template.tags.length > 0 && (
                            <div className="tags">
                              {template.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="tag-item">#{tag}</span>
                              ))}
                              {template.tags.length > 3 && (
                                <span className="tag-more">+{template.tags.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="card-footer">
                          <button
                            onClick={() => handleDownload(
                              templateId,
                              template.title,
                              template.is_free
                            )}
                            className={`download-btn ${template.is_free ? 'free-btn' : 'premium-btn'}`}
                            disabled={!templateId}
                          >
                            {template.is_free ? "Download" : "Get Premium"}
                          </button>

                          <button
                            onClick={() => handlePreview(templateId)}
                            className="secondary-btn"
                            disabled={!templateId}
                          >
                            Preview
                          </button>

                          <button
                            onClick={() => handleUseTemplate(templateId, template.title)}
                            className="primary-btn"
                            disabled={isUploading || !templateId}
                          >
                            {isUploading ? "Processing..." : "Use Template"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {viewMode === "list" && (
                <div className="templates-list">
                  <table className="templates-table">
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
                              <p className="table-description">{template.description}</p>
                            </td>
                            <td>{template.category_name}</td>
                            <td>
                              <span className={`type-badge ${template.is_free ? 'free-badge' : 'premium-badge'}`}>
                                {template.is_free ? "Free" : "Premium"}
                              </span>
                            </td>
                            <td>{template.download_count || 0}</td>
                            <td className="action-buttons">
                              <button
                                onClick={() => handleDownload(
                                  templateId,
                                  template.title,
                                  template.is_free
                                )}
                                className="table-download-btn"
                                disabled={!templateId}
                              >
                               Download
                              </button>
                              <button
                                onClick={() => handlePreview(templateId)}
                                className="table-btn"
                                disabled={!templateId}
                              >
                                Details
                              </button>
                              <button
                                onClick={() => handleUseTemplate(templateId, template.title)}
                                className="table-btn primary"
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
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="page-btn"
              >
                ← Previous
              </button>
                  
              <div className="page-numbers">
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
                      className={`page-btn ${page === pageNum ? 'active' : ''}`}
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
                className="page-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
          )}
      </div>
    </div>

      {/* Preview Modal */ }
  {
    previewModalOpen && selectedTemplate && (
      <div className="preview-modal">
        <div className="preview-overlay" onClick={closePreviewModal} />
          
        <div className="preview-content">
          <div className="preview-header">
            <h2>{selectedTemplate.title}</h2>
            <button 
              className="close-btn"
              onClick={closePreviewModal}
            >
              ×
            </button>
          </div>
            
          <div className="preview-body">
            <div className="template-info">
              <div className="info-row">
                <span className="label">Category:</span>
                <span className="value">{selectedTemplate.category_name}</span>
              </div>
              <div className="info-row">
                <span className="label">Type:</span>
                <span className={`badge ${selectedTemplate.is_free ? 'free' : 'premium'}`}>
                  {selectedTemplate.is_free ? "Free" : "Premium"}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Downloads:</span>
                <span className="value">{selectedTemplate.download_count || 0}</span>
              </div>
              {selectedTemplate.description && (
                <div className="info-row full-width">
                  <span className="label">Description:</span>
                  <p className="description">{selectedTemplate.description}</p>
                </div>
              )}
              {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                <div className="info-row full-width">
                  <span className="label">Tags:</span>
                  <div className="tags">
                    {selectedTemplate.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
              
            <div className="preview-actions">
              <button
                onClick={useSelectedTemplate}
                className="primary-btn"
                disabled={isUploading || !getTemplateId(selectedTemplate)}
              >
                {isUploading ? "Processing..." : "Use This Template"}
              </button>
                
              <button
                onClick={previewPDFFromModal}
                className="secondary-btn"
                disabled={!getTemplateId(selectedTemplate)}
              >
                View PDF
              </button>
                
              <button
                onClick={downloadSelectedTemplate}
                className={`download-btn ${selectedTemplate.is_free ? 'free-btn' : 'premium-btn'}`}
                disabled={!getTemplateId(selectedTemplate)}
              >
                {selectedTemplate.is_free ? "Download Free" : "Purchase & Download"}
              </button>
                
              <button
                className="cancel-btn"
                onClick={closePreviewModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
    </div >
  );
};

export default UserTemplatesList;