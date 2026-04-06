import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPlus, FaTrash, FaToggleOn, FaToggleOff,
  FaEdit, FaTimes, FaPalette, FaSort,
  FaChartLine, FaImage, FaChevronDown, FaChevronUp,
  FaExternalLinkAlt, FaCheckCircle, FaExclamationCircle, FaEye
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
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    link: "",
    button_text: "Learn More",
    order: 1,
    is_active: true,
    background_color: "#0f766e",
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

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const uploadBanner = async () => {
    if (!formData.title || !file) {
      showToast("Title and image are required", "error");
      return;
    }
    const fd = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== "" && formData[key] !== null) fd.append(key, formData[key]);
    });
    fd.append("file", file);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/banners/`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      showToast("Banner deployed successfully!");
      resetForm();
      loadBanners();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.detail || "Upload failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateBanner = async (id) => {
    const fd = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== "" && formData[key] !== null) fd.append(key, formData[key]);
    });
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/banners/${id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      showToast("Banner updated successfully!");
      setEditingId(null);
      loadBanners();
    } catch (err) {
      showToast(err.response?.data?.detail || "Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleBanner = async (id) => {
    try {
      await axios.post(`${API_BASE_URL}/banners/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadBanners();
      loadStats();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm("Delete this banner permanently?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Banner deleted");
      loadBanners();
      loadStats();
    } catch (err) {
      showToast("Failed to delete banner", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "", subtitle: "", description: "", link: "",
      button_text: "Learn More", order: banners.length + 1, is_active: true,
      background_color: "#0f766e", text_color: "#ffffff",
      button_color: "#fbbf24", button_text_color: "#1f2937",
      features: "", tags: "", start_date: "", end_date: ""
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
      background_color: banner.background_color || "#0f766e",
      text_color: banner.text_color || "#ffffff",
      button_color: banner.button_color || "#fbbf24",
      button_text_color: banner.button_text_color || "#1f2937",
      features: banner.features?.join(", ") || "",
      tags: banner.tags?.join(", ") || "",
      start_date: banner.start_date || "",
      end_date: banner.end_date || ""
    });
    setFilePreview(`${API_BASE_URL}/banners/file/${banner.id}`);
    setShowAdvanced(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="abm-container">

      {/* Toast Notification */}
      {toast && (
        <div className={`abm-toast ${toast.type}`}>
          {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="abm-header">
        <div className="abm-header-left">
          <h1 className="abm-header-title">Banner Management</h1>
          <p className="abm-header-subtitle">Create and manage promotional banners across your platform</p>
        </div>
        <div className="abm-header-right">
          <button className="abm-btn-primary" onClick={resetForm}>
            <FaPlus /> New Banner
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="abm-stats-grid">
        <div className="abm-stat-card">
          <div className="abm-stat-icon" style={{ background: '#f0fdfa', color: '#0f766e' }}>
            <FaImage />
          </div>
          <div>
            <div className="abm-stat-value">{banners.length}</div>
            <div className="abm-stat-label">Total Banners</div>
          </div>
        </div>
        <div className="abm-stat-card">
          <div className="abm-stat-icon" style={{ background: '#f0fdf4', color: '#10b981' }}>
            <FaCheckCircle />
          </div>
          <div>
            <div className="abm-stat-value">{banners.filter(b => b.is_active).length}</div>
            <div className="abm-stat-label">Live Now</div>
          </div>
        </div>
        <div className="abm-stat-card">
          <div className="abm-stat-icon" style={{ background: '#fff7ed', color: '#f97316' }}>
            <FaChartLine />
          </div>
          <div>
            <div className="abm-stat-value">{stats?.total_clicks || 0}</div>
            <div className="abm-stat-label">Total Clicks</div>
          </div>
        </div>
        <div className="abm-stat-card">
          <div className="abm-stat-icon" style={{ background: '#fefce8', color: '#eab308' }}>
            <MdSmartButton />
          </div>
          <div>
            <div className="abm-stat-value">{stats?.overall_ctr != null ? `${stats.overall_ctr}%` : "0%"}</div>
            <div className="abm-stat-label">Avg. CTR</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="abm-content-grid">

        {/* LEFT: Form Panel */}
        <div className="abm-form-panel">
          <div className="abm-card">
            <div className="abm-card-header">
              <div className="abm-card-title">
                {editingId ? <><FaEdit /> Edit Banner</> : <><FaPlus /> Create Banner</>}
              </div>
              {editingId && (
                <button className="abm-btn-ghost" onClick={resetForm}>
                  <FaTimes /> Cancel
                </button>
              )}
            </div>

            <div className="abm-form-body">
              {/* Headline */}
              <div className="abm-field">
                <label className="abm-label"><MdOutlineDashboard /> Headline *</label>
                <input
                  type="text" name="title"
                  className="abm-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Short, punchy headline"
                />
              </div>

              {/* Tagline */}
              <div className="abm-field">
                <label className="abm-label"><MdOutlineDashboard /> Tagline</label>
                <input
                  type="text" name="subtitle"
                  className="abm-input"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="Supporting subtext"
                />
              </div>

              {/* Link */}
              <div className="abm-field">
                <label className="abm-label"><MdOutlineLink /> Destination URL</label>
                <input
                  type="text" name="link"
                  className="abm-input"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>

              {/* Upload */}
              <div className="abm-field">
                <label className="abm-label"><FaImage /> Banner Image {!editingId && "*"}</label>
                <div
                  className={`abm-dropzone ${filePreview ? 'has-preview' : ''}`}
                  onClick={() => document.getElementById('abm-file-input').click()}
                >
                  <input
                    type="file" id="abm-file-input" hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {filePreview ? (
                    <div className="abm-drop-preview">
                      <img src={filePreview} alt="Preview" />
                      <div className="abm-drop-overlay">
                        <FaImage size={20} />
                        <span>Click to change image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="abm-drop-placeholder">
                      <FaCloudUploadAlt className="abm-drop-icon" />
                      <span className="abm-drop-label">Click or drag to upload</span>
                      <span className="abm-drop-hint">PNG, JPG, WEBP — Max 5MB</span>
                    </div>
                  )}
                </div>
                {file && <p className="abm-file-name">✓ {file.name}</p>}
              </div>

              {/* Advanced Toggle */}
              <button
                className="abm-advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                type="button"
              >
                <span><FaPalette /> Visual Settings</span>
                {showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showAdvanced && (
                <div className="abm-advanced-panel">
                  <div className="abm-colors-row">
                    <div className="abm-field">
                      <label className="abm-label">Background Color</label>
                      <div className="abm-color-row">
                        <input type="color" value={formData.background_color}
                          onChange={e => setFormData(p => ({ ...p, background_color: e.target.value }))} />
                        <span className="abm-color-hex">{formData.background_color}</span>
                      </div>
                    </div>
                    <div className="abm-field">
                      <label className="abm-label">Button Color</label>
                      <div className="abm-color-row">
                        <input type="color" value={formData.button_color}
                          onChange={e => setFormData(p => ({ ...p, button_color: e.target.value }))} />
                        <span className="abm-color-hex">{formData.button_color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="abm-field">
                    <label className="abm-label"><FaSort /> Display Order</label>
                    <input type="number" name="order" className="abm-input"
                      value={formData.order} onChange={handleInputChange} min="1" />
                  </div>

                  <div className="abm-field">
                    <label className="abm-label">Visibility</label>
                    <div className="abm-toggle-row"
                      onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}>
                      <div className={`abm-toggle-track ${formData.is_active ? 'on' : ''}`}>
                        <div className="abm-toggle-thumb" />
                      </div>
                      <span className="abm-toggle-label">
                        {formData.is_active ? "Public — visible to users" : "Draft — hidden from users"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                className="abm-btn-submit"
                onClick={editingId ? () => updateBanner(editingId) : uploadBanner}
                disabled={loading || !formData.title || (!file && !editingId)}
              >
                {loading
                  ? <span className="abm-spinner" />
                  : editingId
                    ? <><FaEdit /> Save Changes</>
                    : <><FaPlus /> Deploy Banner</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Banners List */}
        <div className="abm-list-panel">
          <div className="abm-card">
            <div className="abm-card-header">
              <div className="abm-card-title">
                <FaImage /> Banners
                <span className="abm-count-badge">{filteredBanners.length}</span>
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="abm-select"
              >
                <option value="all">All Banners</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {loading && banners.length === 0 ? (
              <div className="abm-loading">
                <span className="abm-spinner-dark" />
                <span>Loading banners...</span>
              </div>
            ) : filteredBanners.length === 0 ? (
              <div className="abm-empty">
                <FaImage size={40} />
                <p>No banners found</p>
                <span>Create your first banner using the form</span>
              </div>
            ) : (
              <div className="abm-banner-list">
                {filteredBanners.map((banner) => (
                  <div key={banner.id} className="abm-banner-row">
                    {/* Thumbnail */}
                    <div className="abm-thumb-wrap">
                      <img
                        src={`${API_BASE_URL}/banners/file/${banner.id}`}
                        alt={banner.title}
                        className="abm-thumb"
                        onClick={() => setPreviewUrl(`${API_BASE_URL}/banners/file/${banner.id}`)}
                      />
                      <button
                        className="abm-thumb-preview"
                        onClick={() => setPreviewUrl(`${API_BASE_URL}/banners/file/${banner.id}`)}
                        title="Preview"
                      >
                        <FaEye />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="abm-banner-meta">
                      <div className="abm-banner-name">{banner.title}</div>
                      {banner.subtitle && (
                        <div className="abm-banner-sub">{banner.subtitle}</div>
                      )}
                      {banner.link && (
                        <a
                          href={banner.link} target="_blank" rel="noreferrer"
                          className="abm-banner-link"
                        >
                          <FaExternalLinkAlt size={10} /> {banner.link}
                        </a>
                      )}
                      <div className="abm-banner-footer">
                        <div className={`abm-badge ${banner.is_active ? "live" : "draft"}`}>
                          {banner.is_active ? <><FaCheckCircle /> Live</> : <><FaExclamationCircle /> Draft</>}
                        </div>
                        <div className="abm-order-pill">#{banner.order}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="abm-row-actions">
                      <button
                        className="abm-icon-btn"
                        onClick={() => startEdit(banner)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className={`abm-icon-btn toggle ${banner.is_active ? 'on' : ''}`}
                        onClick={() => toggleBanner(banner.id)}
                        title={banner.is_active ? "Deactivate" : "Activate"}
                      >
                        {banner.is_active ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                      </button>
                      <button
                        className="abm-icon-btn danger"
                        onClick={() => deleteBanner(banner.id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="abm-modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="abm-modal" onClick={e => e.stopPropagation()}>
            <div className="abm-modal-header">
              <span>Banner Preview</span>
              <button className="abm-icon-btn" onClick={() => setPreviewUrl(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="abm-modal-body">
              <img src={previewUrl} alt="Preview" className="abm-modal-img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline SVG upload icon
function FaCloudUploadAlt(props) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
      viewBox="0 0 640 512" height="1em" width="1em"
      xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4zM393.4 288H320v112c0 8.8-7.2 16-16 16h-48c-8.8 0-16-7.2-16-16V288h-73.4c-14.2 0-21.3-17.2-11.3-27.3l105.4-105.4c6.2-6.2 16.4-6.2 22.6 0l105.4 105.4c10.1 10.1 2.9 27.3-11.3 27.3z" />
    </svg>
  );
}
