import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPlus, FaTrash, FaEye, FaToggleOn, FaToggleOff,
  FaEdit, FaSave, FaTimes, FaCalendarAlt, FaTags,
  FaPalette, FaSort, FaChartLine, FaImage
} from "react-icons/fa";
import "../style/AdminBanner.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

export default function AdminBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [stats, setStats] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [filter, setFilter] = useState("all"); // all, active, inactive

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    link: "",
    button_text: "Learn More",
    order: 1,
    is_active: true,
    background_color: "#667eea",
    text_color: "#ffffff",
    button_color: "#fbbf24",
    button_text_color: "#1f2937",
    features: "",
    tags: "",
    start_date: "",
    end_date: ""
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const token = localStorage.getItem("token");

  /* ================= Load Banners ================= */
  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/banners/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanners(res.data.banners || res.data);
    } catch (err) {
      console.error("Failed to load banners:", err);
      alert("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/banners/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  useEffect(() => {
    loadBanners();
    loadStats();
  }, []);

  /* ================= Filter Banners ================= */
  const filteredBanners = banners.filter(banner => {
    if (filter === "active") return banner.is_active;
    if (filter === "inactive") return !banner.is_active;
    return true;
  }).sort((a, b) => a.order - b.order);

  /* ================= Handle File Upload ================= */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview URL
      const preview = URL.createObjectURL(selectedFile);
      setFilePreview(preview);
    }
  };

  /* ================= Upload Banner ================= */
  const uploadBanner = async () => {
    if (!formData.title || !file) {
      alert("Title and image are required");
      return;
    }

    const formDataToSend = new FormData();
    
    // Append all form fields
    Object.keys(formData).forEach(key => {
      if (formData[key] !== "" && formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    formDataToSend.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/banners`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message || "Banner uploaded successfully");
      resetForm();
      loadBanners();
      loadStats();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.detail || "Banner upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= Update Banner ================= */
  const updateBanner = async (id) => {
    const formDataToSend = new FormData();
    
    // Append only changed fields
    Object.keys(formData).forEach(key => {
      if (formData[key] !== "" && formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const res = await axios.put(`${API_BASE_URL}/banners/${id}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message || "Banner updated successfully");
      setEditingId(null);
      loadBanners();
    } catch (err) {
      console.error("Update error:", err);
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  /* ================= Update Banner Image ================= */
  const updateBannerImage = async (id, newFile) => {
    if (!newFile) return;

    const formDataToSend = new FormData();
    formDataToSend.append("file", newFile);

    try {
      const res = await axios.put(`${API_BASE_URL}/banners/${id}/image`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message || "Image updated successfully");
      loadBanners();
    } catch (err) {
      console.error("Image update error:", err);
      alert(err.response?.data?.detail || "Failed to update image");
    }
  };

  /* ================= Toggle Active ================= */
  const toggleBanner = async (id, currentStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/banners/${id}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadBanners();
    } catch (err) {
      alert("Failed to update banner status");
    }
  };

  /* ================= Delete Banner ================= */
  const deleteBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner? This action cannot be undone.")) return;

    try {
      await axios.delete(`${API_BASE_URL}/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Banner deleted successfully");
      loadBanners();
      loadStats();
    } catch (err) {
      alert("Failed to delete banner");
    }
  };

  /* ================= Reset Form ================= */
  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      link: "",
      button_text: "Learn More",
      order: banners.length + 1,
      is_active: true,
      background_color: "#667eea",
      text_color: "#ffffff",
      button_color: "#fbbf24",
      button_text_color: "#1f2937",
      features: "",
      tags: "",
      start_date: "",
      end_date: ""
    });
    setFile(null);
    setFilePreview(null);
    setShowAdvanced(false);
  };

  /* ================= Start Editing ================= */
  const startEdit = (banner) => {
    setEditingId(banner.id);
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      link: banner.link || "",
      button_text: banner.button_text || "Learn More",
      order: banner.order || 1,
      is_active: banner.is_active,
      background_color: banner.background_color || "#667eea",
      text_color: banner.text_color || "#ffffff",
      button_color: banner.button_color || "#fbbf24",
      button_text_color: banner.button_text_color || "#1f2937",
      features: banner.features?.join(", ") || "",
      tags: banner.tags?.join(", ") || "",
      start_date: banner.start_date || "",
      end_date: banner.end_date || ""
    });
    setFilePreview(banner.image_url || `${API_BASE_URL}/banners/file/${banner.id}`);
  };

  /* ================= Cancel Edit ================= */
  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  /* ================= Get Banner Stats ================= */
  const getBannerStats = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/banners/${id}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.stats;
    } catch (err) {
      console.error("Failed to load banner stats:", err);
      return null;
    }
  };

  /* ================= Format Date ================= */
  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /* ================= Handle Input Change ================= */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="admin-banner-container">
      {/* Header */}
      <div className="admin-header">
        <h2>Banner Management</h2>
        <p>Manage and customize promotional banners for your application</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{banners.length}</div>
            <div className="stat-label">Total Banners</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{banners.filter(b => b.is_active).length}</div>
            <div className="stat-label">Active Banners</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {stats.total_clicks || 0}
            </div>
            <div className="stat-label">Total Clicks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {stats.avg_ctr ? `${stats.avg_ctr}%` : "0%"}
            </div>
            <div className="stat-label">Avg. CTR</div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="admin-content-grid">
        {/* Left Column: Add/Edit Banner */}
        <div className="admin-form-section">
          <div className="admin-card">
            <div className="card-header">
              <h3>
                {editingId ? <><FaEdit /> Edit Banner</> : <><FaPlus /> Add New Banner</>}
              </h3>
              {editingId && (
                <button className="btn-secondary" onClick={cancelEdit}>
                  <FaTimes /> Cancel
                </button>
              )}
            </div>

            <div className="form-grid">
              {/* Basic Information */}
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter banner title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Subtitle</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="Optional subtitle"
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description for the banner"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Link URL</label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="Where banner should link to"
                />
              </div>

              <div className="form-group">
                <label>Button Text</label>
                <input
                  type="text"
                  name="button_text"
                  value={formData.button_text}
                  onChange={handleInputChange}
                  placeholder="Learn More"
                />
              </div>

              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>

              {/* Image Upload */}
              <div className="form-group full-width">
                <label>Banner Image *</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="banner-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="banner-upload" className="upload-label">
                    <FaImage /> {file ? "Change Image" : "Choose Image"}
                  </label>
                  
                  {(filePreview || file) && (
                    <div className="image-preview">
                      <img
                        src={filePreview || (file && URL.createObjectURL(file))}
                        alt="Preview"
                      />
                      <div className="preview-overlay">
                        <span>{file?.name || "Current Banner"}</span>
                      </div>
                    </div>
                  )}
                  
                  <p className="upload-hint">
                    Recommended: 1200×500px, max 5MB (PNG, JPG, WEBP)
                  </p>
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <div className="form-group full-width">
                <button
                  type="button"
                  className="advanced-toggle"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
                </button>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <>
                  {/* Color Settings */}
                  <div className="form-group">
                    <label><FaPalette /> Background Color</label>
                    <div className="color-input">
                      <input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          background_color: e.target.value
                        }))}
                      />
                      <input
                        type="text"
                        value={formData.background_color}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          background_color: e.target.value
                        }))}
                        placeholder="#667eea"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label><FaPalette /> Text Color</label>
                    <div className="color-input">
                      <input
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          text_color: e.target.value
                        }))}
                      />
                      <input
                        type="text"
                        value={formData.text_color}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          text_color: e.target.value
                        }))}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label><FaPalette /> Button Color</label>
                    <div className="color-input">
                      <input
                        type="color"
                        value={formData.button_color}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          button_color: e.target.value
                        }))}
                      />
                      <input
                        type="text"
                        value={formData.button_color}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          button_color: e.target.value
                        }))}
                        placeholder="#fbbf24"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="form-group">
                    <label><FaCalendarAlt /> Start Date</label>
                    <input
                      type="datetime-local"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label><FaCalendarAlt /> End Date</label>
                    <input
                      type="datetime-local"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Lists */}
                  <div className="form-group">
                    <label><FaTags /> Features</label>
                    <input
                      type="text"
                      name="features"
                      value={formData.features}
                      onChange={handleInputChange}
                      placeholder="Comma-separated features"
                    />
                  </div>

                  <div className="form-group">
                    <label><FaTags /> Tags</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="Comma-separated tags"
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <div className="toggle-switch">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            is_active: e.target.checked
                          }))}
                        />
                        <span className="slider"></span>
                      </label>
                      <span className="toggle-label">
                        {formData.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="form-group full-width">
                <button
                  className={editingId ? "btn-warning" : "btn-primary"}
                  onClick={editingId ? () => updateBanner(editingId) : uploadBanner}
                  disabled={loading || !formData.title || !file}
                >
                  {loading ? (
                    "Processing..."
                  ) : editingId ? (
                    <>
                      <FaSave /> Update Banner
                    </>
                  ) : (
                    <>
                      <FaPlus /> Add Banner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Banner List */}
        <div className="banner-list-section">
          <div className="admin-card">
            <div className="card-header">
              <h3>All Banners ({filteredBanners.length})</h3>
              <div className="filter-controls">
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All Banners</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading banners...</p>
              </div>
            ) : filteredBanners.length === 0 ? (
              <div className="empty-state">
                <p>No banners found</p>
              </div>
            ) : (
              <div className="banners-table">
                <table>
                  <thead>
                    <tr>
                      <th>Preview</th>
                      <th>Details</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBanners.map((banner) => (
                      <tr key={banner.id} className={!banner.is_active ? "inactive" : ""}>
                        <td className="preview-cell">
                          <img
                            src={`${API_BASE_URL}/banners/file/${banner.id}`}
                            alt={banner.title}
                            className="banner-thumbnail"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/150x60?text=No+Image";
                            }}
                          />
                        </td>
                        <td className="details-cell">
                          <strong>{banner.title}</strong>
                          {banner.subtitle && <div className="banner-subtitle">{banner.subtitle}</div>}
                          {banner.description && (
                            <div className="banner-description">{banner.description}</div>
                          )}
                          {banner.link && (
                            <div className="banner-link">
                              <a href={banner.link} target="_blank" rel="noreferrer">
                                {banner.link}
                              </a>
                            </div>
                          )}
                          {banner.tags?.length > 0 && (
                            <div className="banner-tags">
                              {banner.tags.map((tag, idx) => (
                                <span key={idx} className="tag">{tag}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="order-cell">
                          <div className="order-badge">{banner.order}</div>
                        </td>
                        <td className="status-cell">
                          <div className={`status-badge ${banner.is_active ? "active" : "inactive"}`}>
                            {banner.is_active ? "Active" : "Inactive"}
                          </div>
                          {(banner.start_date || banner.end_date) && (
                            <div className="date-info">
                              {banner.start_date && (
                                <div>From: {formatDate(banner.start_date)}</div>
                              )}
                              {banner.end_date && (
                                <div>To: {formatDate(banner.end_date)}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-view"
                              onClick={() => {
                                setPreviewUrl(`${API_BASE_URL}/banners/file/${banner.id}`);
                              }}
                              title="View Full Size"
                            >
                              <FaEye />
                            </button>
                            
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => startEdit(banner)}
                              title="Edit Banner"
                            >
                              <FaEdit />
                            </button>
                            
                            <button
                              className="btn-icon btn-toggle"
                              onClick={() => toggleBanner(banner.id, banner.is_active)}
                              title={banner.is_active ? "Deactivate" : "Activate"}
                            >
                              {banner.is_active ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                            
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => deleteBanner(banner.id)}
                              title="Delete Banner"
                            >
                              <FaTrash />
                            </button>
                          </div>
                          
                          {banner.clicks !== undefined && (
                            <div className="banner-stats">
                              <span className="stat-item">
                               <FaEye /> {banner.impressions || 0}
                              </span>
                              <span className="stat-item">
                                 {banner.clicks || 0}
                              </span>
                              {banner.impressions > 0 && (
                                <span className="stat-item">
                                   {((banner.clicks / banner.impressions) * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Banner Preview</h3>
              <button className="close-btn" onClick={() => setPreviewUrl(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <img src={previewUrl} alt="Banner Preview" className="full-preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}