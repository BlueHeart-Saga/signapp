import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaSearch,
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaFolderOpen,
  FaPlus,
  FaChevronDown,
  FaFire,
  FaTags,
  FaEye,
  FaDownload,
  FaClock,
  FaSpinner
} from 'react-icons/fa';
import '../style/TemplateBrowser.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const TemplateBrowser = ({ isOpen, onClose, onTemplateSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popularTemplates, setPopularTemplates] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const token = localStorage.getItem("token");

  // Helper function to get consistent template ID
  const getTemplateId = (template) => {
    if (!template) return null;

    // Handle MongoDB ObjectId format
    if (template._id && typeof template._id === 'object' && template._id.$oid) {
      return template._id.$oid;
    }

    // Handle string ID
    if (typeof template._id === 'string') return template._id;

    // Handle direct ID field
    if (template.id) return template.id;

    // Handle templateId field
    if (template.templateId) return template.templateId;

    return null;
  };

  // Helper function to normalize template data
  const normalizeTemplate = (template) => {
    const templateId = getTemplateId(template);

    return {
      // Core template data
      id: templateId,
      templateId: templateId,
      name: template.title || template.name || 'Unnamed Template',
      title: template.title || template.name || 'Unnamed Template',
      description: template.description || 'No description available',
      category: template.category_name || template.category || 'Uncategorized',
      category_name: template.category_name || template.category || 'Uncategorized',
      fileType: template.file_type || template.fileType || 'pdf',
      fileSize: template.file_size || template.fileSize || 'Unknown',
      lastModified: template.updated_at || template.created_at || template.lastModified || new Date().toISOString(),
      is_free: template.is_free || false,
      download_count: template.download_count || 0,
      tags: template.tags || [],

      // Original API data for reference
      _raw: template
    };
  };

  // Load all templates from API
  const loadTemplates = async () => {
    if (!isOpen || !token) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/templates/user/available?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load templates: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Normalize and process templates
      const processedTemplates = (data.templates || []).map(normalizeTemplate);

      setTemplates(processedTemplates);
      setFilteredTemplates(processedTemplates);

      // Load additional data in parallel
      await Promise.all([
        loadCategories(),
        loadPopularTemplates()
      ]);

    } catch (err) {
      console.error('Error loading templates:', err);
      setError(err.message || 'Failed to load templates. Please check your connection and try again.');

      // Load fallback data
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const handleViewTemplatePdf = async (template) => {
    const templateId = template?.id || template?.templateId;

    if (!templateId) {
      alert("Template ID not found");
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

      if (!res.ok) throw new Error("Failed to load template PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      setShowPdfViewer(true);
    } catch (err) {
      console.error(err);
      alert("Unable to open PDF");
    }
  };


  // Load template categories
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/templates/user/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const categoryList = ['all', ...(data.categories || []).map(cat => ({
          id: getTemplateId(cat),
          name: cat.name || 'Uncategorized'
        }))];
        setCategories(categoryList);
      }
    } catch (err) {
      console.warn('Error loading categories:', err);
    }
  };

  // Load popular templates
  const loadPopularTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/templates/user/stats/popular?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const popular = (data.popular_templates || []).map(normalizeTemplate);
        setPopularTemplates(popular);
      }
    } catch (err) {
      console.warn('Error loading popular templates:', err);
    }
  };

  // Load fallback data when API fails
  const loadFallbackData = () => {
    const fallbackData = [
      {
        id: 'fallback1',
        templateId: 'fallback1',
        name: 'Employment Contract',
        title: 'Employment Contract',
        description: 'Standard employment agreement template for new hires',
        category: 'Legal',
        category_name: 'Legal',
        fileType: 'pdf',
        fileSize: '45 KB',
        lastModified: '2024-01-15',
        is_free: true,
        download_count: 150,
        tags: ['legal', 'hr', 'employment']
      },
      {
        id: 'fallback2',
        templateId: 'fallback2',
        name: 'NDA Agreement',
        title: 'NDA Agreement',
        description: 'Non-disclosure agreement for confidential information',
        category: 'Legal',
        category_name: 'Legal',
        fileType: 'pdf',
        fileSize: '32 KB',
        lastModified: '2024-01-10',
        is_free: false,
        download_count: 89,
        tags: ['legal', 'nda', 'confidential']
      }
    ];

    const processedFallback = fallbackData.map(normalizeTemplate);
    setTemplates(processedFallback);
    setFilteredTemplates(processedFallback);
    setCategories(['all', 'Legal', 'Business', 'Finance']);
  };

  // Handle template search
  const handleSearch = (term) => {
    setSearchTerm(term);

    if (!term.trim()) {
      applyCategoryFilter(selectedCategory);
      return;
    }

    const searchLower = term.toLowerCase();
    const filtered = templates.filter(template => {
      const matchesName = template.name.toLowerCase().includes(searchLower);
      const matchesTitle = template.title?.toLowerCase().includes(searchLower) || false;
      const matchesDesc = template.description.toLowerCase().includes(searchLower);
      const matchesCategory = template.category.toLowerCase().includes(searchLower);
      const matchesTags = template.tags?.some(tag =>
        tag.toLowerCase().includes(searchLower)
      ) || false;

      return matchesName || matchesTitle || matchesDesc || matchesCategory || matchesTags;
    });

    setFilteredTemplates(filtered);
  };

  // Apply category filter
  const applyCategoryFilter = (category) => {
    if (category === 'all') {
      setFilteredTemplates(templates);
    } else {
      const filtered = templates.filter(template =>
        template.category === category || template.category_name === category
      );
      setFilteredTemplates(filtered);
    }
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    applyCategoryFilter(category);
  };

  // Open template preview
  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setPreviewModalOpen(true);
  };

  // Handle template selection with proper data passing
  const handleTemplateSelect = async (template) => {
    if (!template || !template.id) {
      console.error('Invalid template data:', template);
      setError('Invalid template data. Please try again.');
      return;
    }

    setIsSelecting(true);

    try {
      // Create a clean template object to pass
      const selectedTemplateData = {
        // Required fields
        id: template.id,
        templateId: template.templateId || template.id,
        name: template.name,
        title: template.title || template.name,
        description: template.description,
        category: template.category,
        category_name: template.category_name || template.category,
        is_free: template.is_free,
        download_count: template.download_count || 0,

        // Additional useful fields
        fileType: template.fileType,
        fileSize: template.fileSize,
        lastModified: template.lastModified,
        tags: template.tags || [],

        // Include raw data if available
        rawData: template._raw || template
      };

      console.log('Passing template data to parent:', selectedTemplateData);

      // Pass to parent component
      onTemplateSelect(selectedTemplateData);

      // Close modal after successful selection
      setTimeout(() => {
        onClose();
      }, 100);

    } catch (err) {
      console.error('Error selecting template:', err);
      setError('Failed to select template. Please try again.');
    } finally {
      setIsSelecting(false);
    }
  };

  // Get appropriate file icon
  const getFileIcon = (fileType) => {
    const type = (fileType || 'pdf').toLowerCase();

    switch (type) {
      case 'pdf':
        return <FaFilePdf className="tempbrowser-file-icon tempbrowser-icon-pdf" />;
      case 'docx':
      case 'doc':
        return <FaFileWord className="tempbrowser-file-icon tempbrowser-icon-word" />;
      default:
        return <FaFileAlt className="tempbrowser-file-icon tempbrowser-icon-default" />;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Format file size nicely
  const formatFileSize = (size) => {
    if (!size || size === 'Unknown') return 'Unknown';
    return size;
  };

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    } else {
      // Reset state when closing
      setSearchTerm('');
      setSelectedCategory('all');
      setSelectedTemplate(null);
      setPreviewModalOpen(false);
      setIsSelecting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="tempbrowser-backdrop">
      <div className="tempbrowser-modal">
        {/* Modal Header */}
        <div className="tempbrowser-header">
          <div className="tempbrowser-header-content">
            <h2 className="tempbrowser-title">Browse Templates</h2>
            <p className="tempbrowser-subtitle">
              {loading ? 'Loading templates...' : `Choose from ${templates.length} professional templates`}
            </p>
          </div>
          <button
            className="tempbrowser-close-btn"
            onClick={onClose}
            disabled={isSelecting}
          >
            {isSelecting ? <FaSpinner className="tempbrowser-spinner" /> : <FaTimes />}
          </button>
        </div>

        <div className="tempbrowser-body">
          {/* Error Message */}
          {error && (
            <div className="tempbrowser-error-banner">
              <div className="tempbrowser-error-content">
                <span className="tempbrowser-error-text">{error}</span>
                <button
                  onClick={loadTemplates}
                  className="tempbrowser-retry-btn"
                  disabled={loading}
                >
                  {loading ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="tempbrowser-content">
            {/* Left Sidebar */}
            <div className="tempbrowser-sidebar">
              {/* Search Box */}
              <div className="tempbrowser-search-section">
                <div className="tempbrowser-search-box">
                  <FaSearch className="tempbrowser-search-icon" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="tempbrowser-search-input"
                    disabled={loading || isSelecting}
                  />
                </div>
              </div>

              {/* Categories Section */}
              <div className="tempbrowser-categories-section">
                <h3 className="tempbrowser-section-title">
                  <FaFolderOpen className="tempbrowser-section-icon" />
                  Categories
                </h3>
                <div className="tempbrowser-category-list">
                  {categories.map(category => {
                    const categoryName = typeof category === 'string' ? category : category.name;
                    const categoryId = typeof category === 'string' ? category : category.id;

                    return (
                      <button
                        key={categoryId || categoryName}
                        className={`tempbrowser-category-btn ${selectedCategory === categoryName ? 'tempbrowser-category-active' : ''}`}
                        onClick={() => handleCategoryChange(categoryName)}
                        disabled={loading || isSelecting}
                      >
                        {categoryName === 'all' ? 'All Categories' : categoryName}
                        <span className="tempbrowser-category-count">
                          {categoryName === 'all'
                            ? templates.length
                            : templates.filter(t => t.category === categoryName || t.category_name === categoryName).length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Popular Templates */}
              {popularTemplates.length > 0 && (
                <div className="tempbrowser-popular-section">
                  <h3 className="tempbrowser-section-title">
                    <FaFire className="tempbrowser-section-icon" />
                    Most Popular
                  </h3>
                  <div className="tempbrowser-popular-list">
                    {popularTemplates.map(template => (
                      <div
                        key={template.id}
                        className="tempbrowser-popular-item"
                        onClick={() => !isSelecting && handlePreview(template)}
                        style={{ cursor: isSelecting ? 'not-allowed' : 'pointer' }}
                      >
                        <div className="tempbrowser-popular-info">
                          <strong>{template.name}</strong>
                          <small>{template.category_name || template.category}</small>
                        </div>
                        <span className="tempbrowser-download-count">
                          <FaDownload /> {template.download_count || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Toggle */}
              <div className="tempbrowser-view-toggle-section">
                <h3 className="tempbrowser-section-title">View Mode</h3>
                <div className="tempbrowser-view-toggle">
                  <button
                    className={`tempbrowser-view-btn ${viewMode === 'grid' ? 'tempbrowser-view-active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    disabled={isSelecting}
                  >
                    Grid
                  </button>
                  <button
                    className={`tempbrowser-view-btn ${viewMode === 'list' ? 'tempbrowser-view-active' : ''}`}
                    onClick={() => setViewMode('list')}
                    disabled={isSelecting}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="tempbrowser-main">
              {/* Loading State */}
              {loading ? (
                <div className="tempbrowser-loading-state">
                  <div className="tempbrowser-loading-spinner"></div>
                  <span>Loading templates...</span>
                </div>
              ) : (
                <>
                  {/* Results Header */}
                  <div className="tempbrowser-results-header">
                    <div className="tempbrowser-results-info">
                      <h3>Templates</h3>
                      <span className="tempbrowser-results-count">
                        {filteredTemplates.length} of {templates.length} templates
                        {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                      </span>
                    </div>

                    <div className="tempbrowser-category-select-wrapper">
                      <select
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="tempbrowser-category-select"
                        disabled={isSelecting}
                      >
                        {categories.map(category => {
                          const categoryName = typeof category === 'string' ? category : category.name;
                          return (
                            <option
                              key={categoryName}
                              value={categoryName}
                            >
                              {categoryName === 'all' ? 'All Categories' : categoryName}
                            </option>
                          );
                        })}
                      </select>
                      <FaChevronDown className="tempbrowser-select-arrow" />
                    </div>
                  </div>

                  {/* Empty State */}
                  {filteredTemplates.length === 0 ? (
                    <div className="tempbrowser-empty-state">
                      <FaFolderOpen className="tempbrowser-empty-icon" />
                      <h4>No templates found</h4>
                      <p>Try adjusting your search or filter criteria</p>
                      <button
                        className="tempbrowser-clear-filters-btn"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('all');
                        }}
                        disabled={isSelecting}
                      >
                        Clear All Filters
                      </button>
                    </div>
                  ) : viewMode === 'grid' ? (
                    /* Grid View */
                    <div className="tempbrowser-grid">
                      {filteredTemplates.map(template => (
                        <div
                          key={template.id}
                          className="tempbrowser-template-card"
                        >
                          {/* Card Header with Badges */}
                          <div className="tempbrowser-card-header">
                            <span className={`tempbrowser-template-badge ${template.is_free ? 'tempbrowser-badge-free' : 'tempbrowser-badge-premium'}`}>
                              {template.is_free ? 'FREE' : 'PREMIUM'}
                            </span>
                            <span className="tempbrowser-download-badge">
                              <FaDownload /> {template.download_count || 0}
                            </span>
                          </div>

                          {/* Thumbnail Area */}
                          <div className="tempbrowser-card-thumbnail">
                            {getFileIcon(template.fileType)}
                            <div className="tempbrowser-thumbnail-overlay">
                              <button
                                className="tempbrowser-preview-btn"
                                onClick={() => !isSelecting && handlePreview(template)}
                                disabled={isSelecting}
                              >
                                <FaEye /> Preview
                              </button>
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="tempbrowser-card-content">
                            <h4 className="tempbrowser-template-title">{template.name}</h4>
                            <p className="tempbrowser-template-description">{template.description}</p>

                            <div className="tempbrowser-template-meta">
                              <span className="tempbrowser-category-tag">
                                {template.category}
                              </span>
                              <span className="tempbrowser-file-info">
                                {formatFileSize(template.fileSize)} • {(template.fileType || 'pdf').toUpperCase()}
                              </span>
                            </div>

                            {/* Tags */}
                            {template.tags && template.tags.length > 0 && (
                              <div className="tempbrowser-template-tags">
                                <FaTags className="tempbrowser-tags-icon" />
                                {template.tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} className="tempbrowser-tag-item">#{tag}</span>
                                ))}
                                {template.tags.length > 3 && (
                                  <span className="tempbrowser-tag-more">+{template.tags.length - 3} more</span>
                                )}
                              </div>
                            )}

                            {/* Last Modified */}
                            <div className="tempbrowser-last-modified">
                              <FaClock className="tempbrowser-clock-icon" />
                              Updated: {formatDate(template.lastModified)}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="tempbrowser-card-actions">
                            <button
                              className="tempbrowser-btn tempbrowser-btn-outline"
                              onClick={() => handleViewTemplatePdf(template)}
                              disabled={isSelecting}
                            >
                              <FaEye /> View PDF
                            </button>

                            <button
                              className="tempbrowser-btn tempbrowser-btn-primary"
                              onClick={() => !isSelecting && handleTemplateSelect(template)}
                              disabled={isSelecting}
                            >
                              {isSelecting ? (
                                <>
                                  <FaSpinner className="tempbrowser-spinner" /> Selecting...
                                </>
                              ) : (
                                <>
                                  <FaPlus /> Use Template
                                </>
                              )}
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    /* List View */
                    <div className="tempbrowser-list">
                      <table className="tempbrowser-table">
                        <thead>
                          <tr>
                            <th>Template</th>
                            <th>Category</th>
                            <th>Type</th>
                            <th>Downloads</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTemplates.map(template => (
                            <tr key={template.id}>
                              <td className="tempbrowser-template-info-cell">
                                <div className="tempbrowser-template-info">
                                  <div className="tempbrowser-template-icon">
                                    {getFileIcon(template.fileType)}
                                  </div>
                                  <div>
                                    <strong>{template.name}</strong>
                                    <p className="tempbrowser-table-description">{template.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td>{template.category}</td>
                              <td>
                                <span className={`tempbrowser-type-badge ${template.is_free ? 'tempbrowser-type-free' : 'tempbrowser-type-premium'}`}>
                                  {template.is_free ? 'Free' : 'Premium'}
                                </span>
                              </td>
                              <td>{template.download_count || 0}</td>
                              <td className="tempbrowser-actions-cell">
                                <button
                                  className="tempbrowser-btn tempbrowser-btn-sm tempbrowser-btn-outline"
                                  onClick={() => handleViewTemplatePdf(template)}
                                  disabled={isSelecting}
                                >
                                  View PDF
                                </button>

                                <button
                                  className="tempbrowser-btn tempbrowser-btn-sm tempbrowser-btn-primary"
                                  onClick={() => !isSelecting && handleTemplateSelect(template)}
                                  disabled={isSelecting}
                                >
                                  {isSelecting ? '...' : 'Use'}
                                </button>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="tempbrowser-footer">
          <button
            onClick={onClose}
            className="tempbrowser-btn tempbrowser-btn-secondary"
            disabled={isSelecting}
          >
            {isSelecting ? 'Please wait...' : 'Cancel'}
          </button>
          <div className="tempbrowser-footer-info">
            <span className="tempbrowser-selected-count">
              {selectedCategory === 'all'
                ? `${templates.length} total templates`
                : `${filteredTemplates.length} templates in "${selectedCategory}"`}
            </span>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModalOpen && selectedTemplate && (
        <div className="tempbrowser-preview-overlay">
          <div className="tempbrowser-preview-modal">
            <div className="tempbrowser-preview-header">
              <h3>{selectedTemplate.name}</h3>
              <button
                className="tempbrowser-close-btn"
                onClick={() => !isSelecting && setPreviewModalOpen(false)}
                disabled={isSelecting}
              >
                {isSelecting ? <FaSpinner className="tempbrowser-spinner" /> : <FaTimes />}
              </button>
            </div>

            <div className="tempbrowser-preview-content">
              <div className="tempbrowser-preview-info">
                <div className="tempbrowser-preview-row">
                  <span className="tempbrowser-preview-label">Category:</span>
                  <span className="tempbrowser-preview-value">{selectedTemplate.category}</span>
                </div>
                <div className="tempbrowser-preview-row">
                  <span className="tempbrowser-preview-label">Type:</span>
                  <span className={`tempbrowser-preview-badge ${selectedTemplate.is_free ? 'tempbrowser-badge-free' : 'tempbrowser-badge-premium'}`}>
                    {selectedTemplate.is_free ? 'Free Template' : 'Premium Template'}
                  </span>
                </div>
                <div className="tempbrowser-preview-row">
                  <span className="tempbrowser-preview-label">File Size:</span>
                  <span className="tempbrowser-preview-value">{formatFileSize(selectedTemplate.fileSize)}</span>
                </div>
                <div className="tempbrowser-preview-row">
                  <span className="tempbrowser-preview-label">Downloads:</span>
                  <span className="tempbrowser-preview-value">{selectedTemplate.download_count || 0}</span>
                </div>
                <div className="tempbrowser-preview-row tempbrowser-preview-row-full">
                  <span className="tempbrowser-preview-label">Description:</span>
                  <p className="tempbrowser-preview-description">{selectedTemplate.description}</p>
                </div>
                {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                  <div className="tempbrowser-preview-row tempbrowser-preview-row-full">
                    <span className="tempbrowser-preview-label">Tags:</span>
                    <div className="tempbrowser-preview-tags">
                      {selectedTemplate.tags.map((tag, index) => (
                        <span key={index} className="tempbrowser-tag-item">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="tempbrowser-preview-actions">
              <button
                className="tempbrowser-btn tempbrowser-btn-secondary"
                onClick={() => !isSelecting && setPreviewModalOpen(false)}
                disabled={isSelecting}
              >
                Close
              </button>
              <button
                className="tempbrowser-btn tempbrowser-btn-primary"
                onClick={() => !isSelecting && handleTemplateSelect(selectedTemplate)}
                disabled={isSelecting}
              >
                {isSelecting ? (
                  <>
                    <FaSpinner className="tempbrowser-spinner" /> Selecting...
                  </>
                ) : (
                  <>
                    <FaPlus /> Use This Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {showPdfViewer && (
        <div className="tempbrowser-preview-overlay">
          <div className="tempbrowser-preview-modal" style={{ width: "80%", height: "85%" }}>
            <div className="tempbrowser-preview-header">
              <h3>Template PDF Preview</h3>
              <button
                className="tempbrowser-close-btn"
                onClick={() => {
                  setShowPdfViewer(false);
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl("");
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="tempbrowser-preview-content" style={{ height: "100%" }}>
              <iframe
                src={pdfUrl}
                title="Template PDF"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TemplateBrowser;