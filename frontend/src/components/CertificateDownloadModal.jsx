import React, { useState } from 'react';
import { X, Download, FileText, CheckCircle, Shield, Clock, User } from 'lucide-react';
import api from '../services/api';
// import './CertificateDownloadModal.css';

const CertificateDownloadModal = ({ 
  open, 
  onClose, 
  documentId, 
  documentName,
  envelopeId 
}) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [password, setPassword] = useState('');
  const [watermark, setWatermark] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const certificateOptions = [
    { id: 'pdf', label: 'PDF Certificate', icon: '📄', desc: 'Standard PDF format' },
    { id: 'detailed', label: 'Detailed Report', icon: '📊', desc: 'Includes all signatures & timestamps' },
    { id: 'executive', label: 'Executive Summary', icon: '👔', desc: 'Brief overview for management' },
    { id: 'legal', label: 'Legal Copy', icon: '⚖️', desc: 'Court-admissible version' }
  ];

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      const params = new URLSearchParams({
        format: selectedFormat,
        include_details: includeDetails,
        watermark: watermark
      });

      if (passwordProtect && password) {
        params.append('password', password);
      }

      const response = await api.get(
        `/documents/${documentId}/download/certificate?${params.toString()}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${documentName || 'document'}_${new Date().toISOString().split('T')[0]}.${selectedFormat === 'pdf' ? 'pdf' : 'zip'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Log the download
      await api.post(`/documents/${documentId}/certificate-downloaded`, {
        format: selectedFormat,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="certificate-modal-overlay">
      <div className="certificate-modal-container">
        {/* Header */}
        <div className="certificate-modal-header">
          <div className="certificate-modal-title-section">
            <div className="certificate-modal-icon">
              <FileText size={20} />
            </div>
            <div>
              <h2>Download Certificate</h2>
              <p className="certificate-modal-subtitle">
                Generate certificate of completion for {documentName}
              </p>
            </div>
          </div>
          <button className="certificate-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="certificate-modal-content">
          {/* Left Column - Options */}
          <div className="certificate-options-column">
            <div className="certificate-option-group">
              <h3>Certificate Format</h3>
              <div className="certificate-format-grid">
                {certificateOptions.map(option => (
                  <div 
                    key={option.id}
                    className={`certificate-format-card ${selectedFormat === option.id ? 'selected' : ''}`}
                    onClick={() => setSelectedFormat(option.id)}
                  >
                    <div className="certificate-format-icon">
                      {option.icon}
                    </div>
                    <div className="certificate-format-info">
                      <div className="certificate-format-name">
                        {option.label}
                      </div>
                      <div className="certificate-format-desc">
                        {option.desc}
                      </div>
                    </div>
                    <div className="certificate-format-check">
                      {selectedFormat === option.id && (
                        <CheckCircle size={16} color="#10b981" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="certificate-option-group">
              <h3>Security Options</h3>
              <div className="certificate-security-options">
                <div className="certificate-security-option">
                  <input 
                    type="checkbox" 
                    id="watermark" 
                    checked={watermark}
                    onChange={(e) => setWatermark(e.target.checked)}
                  />
                  <label htmlFor="watermark">
                    <Shield size={14} />
                    Add official watermark
                  </label>
                </div>
                <div className="certificate-security-option">
                  <input 
                    type="checkbox" 
                    id="password-protect"
                    checked={passwordProtect}
                    onChange={(e) => setPasswordProtect(e.target.checked)}
                  />
                  <label htmlFor="password-protect">
                    <Shield size={14} />
                    Password protect PDF
                  </label>
                </div>
                {passwordProtect && (
                  <div className="certificate-password-input">
                    <input 
                      type="password" 
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <small>Minimum 6 characters</small>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Preview & Details */}
          <div className="certificate-preview-column">
            <div className="certificate-preview-header">
              <h3>Preview</h3>
              <div className="certificate-document-info">
                <div className="certificate-doc-detail">
                  <span>Document:</span>
                  <strong>{documentName}</strong>
                </div>
                {envelopeId && (
                  <div className="certificate-doc-detail">
                    <span>Envelope ID:</span>
                    <code>{envelopeId}</code>
                  </div>
                )}
                <div className="certificate-doc-detail">
                  <span>Generated:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="certificate-preview-content">
              <div className="certificate-preview-card">
                <div className="certificate-preview-header">
                  <div className="certificate-preview-title">
                    <h4>CERTIFICATE OF COMPLETION</h4>
                    <div className="certificate-badge">
                      <CheckCircle size={12} />
                      <span>VERIFIED</span>
                    </div>
                  </div>
                  <div className="certificate-verification-code">
                    #CERT-{Math.random().toString(36).substr(2, 8).toUpperCase()}
                  </div>
                </div>

                <div className="certificate-preview-body">
                  <p className="certificate-statement">
                    This certifies that the electronic document
                    <strong> "{documentName}"</strong> has been
                    successfully signed and completed by all parties.
                  </p>

                  <div className="certificate-details-grid">
                    <div className="certificate-detail">
                      <span>Status</span>
                      <strong>Fully Executed</strong>
                    </div>
                    <div className="certificate-detail">
                      <span>Date Completed</span>
                      <strong>{new Date().toLocaleDateString()}</strong>
                    </div>
                    <div className="certificate-detail">
                      <span>Signature Count</span>
                      <strong>5 signatures</strong>
                    </div>
                    <div className="certificate-detail">
                      <span>Legal Validity</span>
                      <strong>ESIGN Compliant</strong>
                    </div>
                  </div>

                  {includeDetails && (
                    <div className="certificate-signatories">
                      <h5>Signatories</h5>
                      <div className="signatory-list">
                        {['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'].map((name, idx) => (
                          <div key={idx} className="signatory-item">
                            <User size={12} />
                            <span>{name}</span>
                            <small>{new Date().toLocaleDateString()}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="certificate-footer">
                    <div className="certificate-disclaimer">
                      This document was electronically signed and is legally binding
                      under the Electronic Signatures in Global and National Commerce Act (ESIGN).
                    </div>
                    {watermark && (
                      <div className="certificate-watermark">
                        OFFICIAL COPY - DO NOT REPRODUCE
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="certificate-features">
                <div className="certificate-feature">
                  <CheckCircle size={14} />
                  <span>Digitally signed and timestamped</span>
                </div>
                <div className="certificate-feature">
                  <Shield size={14} />
                  <span>Tamper-evident seal included</span>
                </div>
                <div className="certificate-feature">
                  <Clock size={14} />
                  <span>Audit trail embedded</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="certificate-modal-footer">
          <button className="certificate-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <div className="certificate-footer-right">
            <div className="certificate-file-info">
              <span>Format: {selectedFormat.toUpperCase()}</span>
              <span>Size: ~500KB</span>
            </div>
            <button 
              className="certificate-download-btn"
              onClick={handleDownload}
              disabled={downloading || (passwordProtect && password.length < 6)}
            >
              {downloading ? (
                <>
                  <div className="certificate-spinner"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Download Certificate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDownloadModal;
