import React, { useEffect, useState } from "react";
import { Upload, Save, Image, Type, MessageSquare } from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

export default function DynamicLogo() {
  const [platformName, setPlatformName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch branding config
  const fetchBranding = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branding/config`);
      const data = await response.json();
      setPlatformName(data.platform_name || "");
      setTagline(data.tagline || "");
      if (data.logo_url !== null) setLogoUrl(`${API_BASE_URL}/branding/logo/file`);
    } catch (err) {
      console.error("Failed loading branding config", err);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  // Upload Logo
  const handleLogoUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please choose a logo file");

    const formData = new FormData();
    formData.append("file", selectedFile);
    const token = localStorage.getItem("token");

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/branding/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      alert("Logo updated successfully");
      fetchBranding();
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to upload logo");
    } finally {
      setLoading(false);
    }
  };

  // Update name + tagline
  const handleBrandingUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("platform_name", platformName);
    formData.append("tagline", tagline);
    const token = localStorage.getItem("token");

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/branding/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      alert("Branding updated successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to update branding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            Platform Branding & Logo Management
          </h1>
          <p style={styles.subtitle}>Customize your platform's appearance and identity</p>
        </div>

        {/* Current Preview Section */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <Image style={styles.icon} />
            Current Branding Preview
          </h2>
          
          <div style={styles.previewBox}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Platform Logo" 
                style={styles.logoImage}
              />
            ) : (
              <div style={styles.logoPlaceholder}>
                <Image style={styles.placeholderIcon} />
              </div>
            )}
            
            <h3 style={styles.previewTitle}>
              {platformName || "SafeSign"}
            </h3>
            <p style={styles.previewTagline}>
              {tagline || "Secure Digital Document Signing"}
            </p>
          </div>
        </div>

        {/* Grid Layout for Forms */}
        <div style={styles.grid}>
          {/* Upload Logo Section */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <Upload style={styles.icon} />
              Upload New Logo
            </h2>
            
            <div style={styles.formContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Choose Logo File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={styles.fileInput}
                />
                {selectedFile && (
                  <p style={styles.selectedFile}>
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              
              <button
                onClick={handleLogoUpload}
                disabled={loading || !selectedFile}
                style={{
                  ...styles.button,
                  ...(loading || !selectedFile ? styles.buttonDisabled : {})
                }}
              >
                <Upload style={styles.buttonIcon} />
                {loading ? "Uploading..." : "Upload Logo"}
              </button>
            </div>
          </div>

          {/* Update Name & Tagline Section */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <Type style={styles.icon} />
              Platform Name & Tagline
            </h2>
            
            <div style={styles.formContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Platform Name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="Enter platform name"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Tagline
                </label>
                <textarea
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Enter tagline"
                  rows="3"
                  style={styles.textarea}
                />
              </div>
              
              <button
                onClick={handleBrandingUpdate}
                disabled={loading}
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonDisabled : {})
                }}
              >
                <Save style={styles.buttonIcon} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div style={styles.infoCard}>
          <div style={styles.infoContent}>
            <MessageSquare style={styles.infoIcon} />
            <div>
              <h3 style={styles.infoTitle}>Branding Guidelines</h3>
              <p style={styles.infoText}>
                For best results, use a logo with transparent background (PNG format) with dimensions of at least 400x200 pixels. 
                Your platform name and tagline will be displayed across your application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #eff6ff, #ffffff)',
    padding: '32px 16px',
  },
  maxWidth: {
    maxWidth: '1280px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    padding: '32px',
    marginBottom: '24px',
    border: '1px solid #dbeafe',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    width: '24px',
    height: '24px',
    color: '#2563eb',
  },
  previewBox: {
    background: 'linear-gradient(to bottom right, #eff6ff, #dbeafe)',
    borderRadius: '12px',
    padding: '64px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '280px',
    border: '2px solid #bfdbfe',
  },
  logoImage: {
    maxWidth: '200px',
    maxHeight: '120px',
    objectFit: 'contain',
    marginBottom: '24px',
    filter: 'drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04))',
  },
  logoPlaceholder: {
    width: '128px',
    height: '128px',
    backgroundColor: 'white',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  placeholderIcon: {
    width: '64px',
    height: '64px',
    color: '#d1d5db',
  },
  previewTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '8px',
  },
  previewTagline: {
    fontSize: '18px',
    color: '#4b5563',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px',
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    color: '#111827',
    outline: 'none',
    transition: 'all 0.2s',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    color: '#111827',
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'none',
    fontFamily: 'inherit',
  },
  fileInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#4b5563',
    cursor: 'pointer',
  },
  selectedFile: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#059669',
  },
  button: {
    width: '100%',
    backgroundColor: '#2563eb',
    color: 'white',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s',
  },
  buttonIcon: {
    width: '20px',
    height: '20px',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  infoCard: {
    marginTop: '24px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '24px',
  },
  infoContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  infoIcon: {
    width: '20px',
    height: '20px',
    color: '#2563eb',
    flexShrink: 0,
    marginTop: '2px',
  },
  infoTitle: {
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: '4px',
    fontSize: '16px',
  },
  infoText: {
    fontSize: '14px',
    color: '#1e40af',
    lineHeight: '1.5',
  },
};

// Add media query support
const mediaQuery = window.matchMedia('(min-width: 1024px)');
if (mediaQuery.matches) {
  styles.grid.gridTemplateColumns = '1fr 1fr';
  styles.title.fontSize = '42px';
}