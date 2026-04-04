import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPlus, FaTrash, FaEye, FaToggleOn, FaToggleOff,
  FaEdit, FaSave, FaTimes, FaCalendarAlt, FaTags,
  FaPalette, FaSort, FaChartLine, FaImage, FaChevronDown, FaChevronUp, FaExternalLinkAlt, FaCheckCircle, FaExclamationCircle
} from "react-icons/fa";
import { MdOutlineDashboard, MdSmartButton, MdOutlineLink } from "react-icons/md";
import "../style/AdminBanner.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

export default function AdminBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [stats, setStats] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [filter, setFilter] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    link: "",
    button_text: "Learn More",
    order: 1,
    is_active: true,
    background_color: "#0d9488",
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

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/banners/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanners(res.data.banners || res.data);
    } catch (err) {
      console.error("Failed to load banners:", err);
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

  const filteredBanners = banners.filter(banner => {
    if (filter === "active") return banner.is_active;
    if (filter === "inactive") return !banner.is_active;
    return true;
  }).sort((a, b) => a.order - b.order);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const preview = URL.createObjectURL(selectedFile);
      setFilePreview(preview);
    }
  };

  const uploadBanner = async () => {
    if (!formData.title || !file) {
      alert("Title and image are required");
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== "" && formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });
    formDataToSend.append("file", file);

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/banners`, formDataToSend, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      resetForm();
      loadBanners();
      loadStats();
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const updateBanner = async (id) => {
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== "" && formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/banners/${id}`, formDataToSend, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setEditingId(null);
      loadBanners();
    } catch (err) {
      alert(err.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleBanner = async (id, currentStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/banners/${id}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadBanners();
      loadStats();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadBanners();
      loadStats();
    } catch (err) {
      alert("Failed to delete banner");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      link: "",
      button_text: "Learn More",
      order: banners.length + 1,
      is_active: true,
      background_color: "#0d9488",
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
    setEditingId(null);
  };

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
      background_color: banner.background_color || "#0d9488",
      text_color: banner.text_color || "#ffffff",
      button_color: banner.button_color || "#fbbf24",
      button_text_color: banner.button_text_color || "#1f2937",
      features: banner.features?.join(", ") || "",
      tags: banner.tags?.join(", ") || "",
      start_date: banner.start_date || "",
      end_date: banner.end_date || ""
    });
    setFilePreview(banner.image_url || `${API_BASE_URL}/banners/file/${banner.id}`);
    setShowAdvanced(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="abm-container">
      {/* Dynamic Header */}
      <div className="abm-header">
        <h2 className="abm-header-title">Marketing Banners</h2>
        <p className="abm-header-subtitle">Design and deploy high-conversion promotional assets for your platform</p>
      </div>

      {/* Modern Stats Grid */}
      <div className="abm-stats-grid">
        <div className="abm-stat-card">
          <div className="abm-stat-icon-wrapper">
            <FaImage />
          </div>
          <div className="abm-stat-content">
            <div className="abm-stat-value">{banners.length}</div>
            <div className="abm-stat-label">Total Assets</div>
          </div>
        </div>
        <div className="abm-stat-card">
          <div className="abm-stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#10b981' }}>
            <FaCheckCircle />
          </div>
          <div className="abm-stat-content">
            <div className="abm-stat-value">{banners.filter(b => b.is_active).length}</div>
            <div className="abm-stat-label">Live Banners</div>
          </div>
        </div>
        <div className="abm-stat-card">
          <div className="abm-stat-icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <FaChartLine />
          </div>
          <div className="abm-stat-content">
            <div className="abm-stat-value">{stats?.total_clicks || 0}</div>
            <div className="abm-stat-label">Engagements</div>
          </div>
        </div>
        <div className="abm-stat-card">
          <div className="abm-stat-icon-wrapper" style={{ background: '#fefce8', color: '#eab308' }}>
            <MdSmartButton />
          </div>
          <div className="abm-stat-content">
            <div className="abm-stat-value">{stats?.avg_ctr ? `${stats.avg_ctr}%` : "0%"}</div>
            <div className="abm-stat-label">Avg. CTR</div>
          </div>
        </div>
      </div>

      <div className="abm-content-grid">
        {/* Editor Side */}
        <div className="abm-form-section">
          <div className="abm-card">
            <div className="abm-card-header">
              <h3 className="abm-card-title">
                {editingId ? <><FaEdit /> Refresh Content</> : <><FaPlus /> Build New Banner</>}
              </h3>
              {editingId && (
                <button className="abm-cancel-btn" onClick={resetForm}>
                  Reset
                </button>
              )}
            </div>

            <div className="abm-form-body">
              <div className="abm-form-grid">
                <div className="abm-form-group">
                  <label className="abm-form-label"><MdOutlineDashboard /> Headline *</label>
                  <input
                    type="text"
                    name="title"
                    className="abm-form-input"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter short, punchy headline"
                    required
                  />
                </div>

                <div className="abm-form-group">
                  <label className="abm-form-label"><MdOutlineDashboard /> Tagline</label>
                  <input
                    type="text"
                    name="subtitle"
                    className="abm-form-input"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    placeholder="Brief supporting text"
                  />
                </div>

                <div className="abm-form-group">
                  <label className="abm-form-label"><MdOutlineLink /> Destination Link</label>
                  <input
                    type="text"
                    name="link"
                    className="abm-form-input"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="https://example.com/promo"
                  />
                </div>

                {/* File Upload Area */}
                <div className="abm-form-group">
                  <label className="abm-form-label"><FaImage /> Visual Asset *</label>
                  <div className="abm-upload-area" onClick={() => document.getElementById('banner-input').click()}>
                    <input
                      type="file"
                      id="banner-input"
                      hidden
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <FaCloudUploadAlt className="abm-upload-icon" />
                    <div>
                      <span className="abm-upload-label">{file ? "Change Selection" : "Drag or Click to Upload"}</span>
                    </div>
                    <p className="abm-upload-hint">SVG, PNG or WEBP (Max 2MB)</p>
                  </div>

                  {filePreview && (
                    <div className="abm-image-preview">
                      <img src={filePreview} alt="Preview" />
                      <div className="abm-preview-overlay">Live Preview</div>
                    </div>
                  )}
                </div>

                {/* Advanced Configuration */}
                <div className="abm-adv-header" onClick={() => setShowAdvanced(!showAdvanced)}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#475569' }}>
                    <FaPalette style={{ marginRight: '8px' }} /> Visual Configuration
                  </span>
                  {showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {showAdvanced && (
                  <div className="abm-adv-content">
                    <div className="abm-colors-grid">
                      <div className="abm-form-group">
                        <label className="abm-form-label">Background</label>
                        <div className="abm-color-input-wrapper">
                          <input
                            type="color"
                            value={formData.background_color}
                            onChange={(e) => setFormData(p => ({ ...p, background_color: e.target.value }))}
                          />
                          <input type="text" className="abm-color-hex" value={formData.background_color} readOnly />
                        </div>
                      </div>
                      <div className="abm-form-group">
                        <label className="abm-form-label">Button</label>
                        <div className="abm-color-input-wrapper">
                          <input
                            type="color"
                            value={formData.button_color}
                            onChange={(e) => setFormData(p => ({ ...p, button_color: e.target.value }))}
                          />
                          <input type="text" className="abm-color-hex" value={formData.button_color} readOnly />
                        </div>
                      </div>
                    </div>

                    <div className="abm-form-group">
                      <label className="abm-form-label"><FaSort /> Priority Order</label>
                      <input
                        type="number"
                        name="order"
                        className="abm-form-input"
                        value={formData.order}
                        onChange={handleInputChange}
                        min="1"
                      />
                    </div>

                    <div className="abm-form-group">
                      <label className="abm-form-label">Visibility</label>
                      <div className="abm-toggle-input" onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}>
                        <div className={`abm-ios-track ${formData.is_active ? 'active' : ''}`}>
                          <div className="abm-ios-handle"></div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{formData.is_active ? "Public" : "Draft"}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  className="abm-submit-btn"
                  onClick={editingId ? () => updateBanner(editingId) : uploadBanner}
                  disabled={loading || !formData.title || (!file && !editingId)}
                >
                  {loading ? <div className="abm-loader"></div> : editingId ? "Save Changes" : "Deploy Banner"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Side */}
        <div className="abm-list-section">
          <div className="abm-card">
            <div className="abm-table-controls">
              <h3>Live Assets ({filteredBanners.length})</h3>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="abm-form-select">
                <option value="all">Every State</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div className="abm-table-container">
              <table className="abm-table">
                <thead>
                  <tr>
                    <th>Asset Preview</th>
                    <th>Engagement Details</th>
                    <th>Priority</th>
                    <th>Visibility</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBanners.map((banner) => (
                    <tr key={banner.id}>
                      <td>
                        <img
                          src={`${API_BASE_URL}/banners/file/${banner.id}`}
                          alt="Banner"
                          style={{ width: '140px', borderRadius: '8px', border: '1px solid #f1f5f9', cursor: 'pointer' }}
                          onClick={() => setPreviewUrl(`${API_BASE_URL}/banners/file/${banner.id}`)}
                        />
                      </td>
                      <td>
                        <div className="abm-banner-info">
                          <span className="abm-banner-title">{banner.title}</span>
                          <span className="abm-banner-desc">{banner.subtitle || "No tagline provided"}</span>
                          {banner.link && (
                            <a href={banner.link} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#0d9488', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FaExternalLinkAlt size={10} /> View Destination
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="abm-order-badge">{banner.order}</div>
                      </td>
                      <td>
                        <div className={`abm-status-badge ${banner.is_active ? "active" : "inactive"}`}>
                          {banner.is_active ? <FaCheckCircle /> : <FaExclamationCircle />}
                          {banner.is_active ? "Live" : "Inactive"}
                        </div>
                      </td>
                      <td>
                        <div className="abm-actions">
                          <button className="abm-btn-icon" onClick={() => startEdit(banner)} title="Edit Configuration">
                            <FaEdit />
                          </button>
                          <button className={`abm-btn-icon ${banner.is_active ? 'active' : ''}`} onClick={() => toggleBanner(banner.id, banner.is_active)} title={banner.is_active ? "Deactivate" : "Activate"}>
                            {banner.is_active ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                          </button>
                          <button className="abm-btn-icon delete" onClick={() => deleteBanner(banner.id)} title="Purge Asset">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Preview Modal */}
      {previewUrl && (
        <div className="abm-modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="abm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="abm-modal-header">
              <h3>High-Fidelity Preview</h3>
              <button className="abm-btn-icon" onClick={() => setPreviewUrl(null)}>
                <FaTimes />
              </button>
            </div>
            <img src={previewUrl} alt="Full Size" className="abm-full-preview" />
          </div>
        </div>
      )}
    </div>
  );
}

// Missing icon fix
function FaCloudUploadAlt(props) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4zM393.4 288H320v112c0 8.8-7.2 16-16 16h-48c-8.8 0-16-7.2-16-16V288h-73.4c-14.2 0-21.3-17.2-11.3-27.3l105.4-105.4c6.2-6.2 16.4-6.2 22.6 0l105.4 105.4c10.1 10.1 2.9 27.3-11.3 27.3z"></path>
    </svg>
  );
}
