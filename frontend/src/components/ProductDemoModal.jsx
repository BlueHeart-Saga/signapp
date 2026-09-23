import React, { useState } from "react";
import { 
  X, Play, CheckCircle, Shield, FileText, Wand2, 
  Send, Users, Lock, ArrowRight, Sparkles, Award
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProductDemoModal = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState("signing");
  const navigate = useNavigate();

  if (!open) return null;

  const handleStartTrial = () => {
    onClose();
    navigate("/login");
  };

  return (
    <div className="safe-demo-overlay" onClick={onClose}>
      <div className="safe-demo-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="safe-demo-header">
          <div className="safe-demo-title-group">
            <span className="safe-demo-badge">
              <Sparkles size={14} /> Interactive Product Tour
            </span>
            <h2>See Esigniva in Action</h2>
            <p>Explore our enterprise e-signature platform before signing up.</p>
          </div>
          <button className="safe-demo-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="safe-demo-tabs">
          <button
            className={`safe-demo-tab ${activeTab === "signing" ? "active" : ""}`}
            onClick={() => setActiveTab("signing")}
          >
            <FileText size={16} />
            <span>1. E-Signature Workflow</span>
          </button>

          <button
            className={`safe-demo-tab ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            <Wand2 size={16} />
            <span>2. AI Template Builder</span>
          </button>

          <button
            className={`safe-demo-tab ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <Shield size={16} />
            <span>3. Audit & Security</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="safe-demo-body">
          {activeTab === "signing" && (
            <div className="safe-demo-step-grid">
              <div className="safe-demo-step-info">
                <h3>Seamless Document Signing</h3>
                <p>
                  Upload PDFs or Word docs, place signature fields with drag-and-drop precision, and dispatch envelopes to multiple recipients in seconds.
                </p>

                <ul className="safe-demo-feature-list">
                  <li><CheckCircle size={16} color="#0f766e" /> Multi-recipient signing order management</li>
                  <li><CheckCircle size={16} color="#0f766e" /> Real-time status tracking & automated reminders</li>
                  <li><CheckCircle size={16} color="#0f766e" /> Mobile & desktop responsive signing experience</li>
                </ul>

                <div className="safe-demo-cta-row">
                  <button className="safe-demo-btn-primary" onClick={handleStartTrial}>
                    Try Signing Now <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="safe-demo-visual-card">
                <div className="safe-visual-header">
                  <div className="safe-window-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span>Document Signing Interface</span>
                </div>
                <div className="safe-visual-content">
                  <div className="safe-doc-preview-mock">
                    <div className="mock-doc-title">Executive Non-Disclosure Agreement.pdf</div>
                    <div className="mock-doc-line long"></div>
                    <div className="mock-doc-line medium"></div>
                    <div className="mock-doc-line short"></div>
                    
                    <div className="mock-signature-field">
                      <div className="field-tag">Sign Here</div>
                      <div className="field-signature">John Doe (Verified)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="safe-demo-step-grid">
              <div className="safe-demo-step-info">
                <h3>AI-Powered Contract Generation</h3>
                <p>
                  Describe your document requirement in natural language. Our AI instantly drafts legally structured agreements with pre-placed fields.
                </p>

                <ul className="safe-demo-feature-list">
                  <li><CheckCircle size={16} color="#0f766e" /> Instant legal clause suggestions & formatting</li>
                  <li><CheckCircle size={16} color="#0f766e" /> Auto-extracts form fields & recipient inputs</li>
                  <li><CheckCircle size={16} color="#0f766e" /> Pre-built template library for sales, HR & legal</li>
                </ul>

                <div className="safe-demo-cta-row">
                  <button className="safe-demo-btn-primary" onClick={handleStartTrial}>
                    Generate AI Template <Sparkles size={16} />
                  </button>
                </div>
              </div>

              <div className="safe-demo-visual-card">
                <div className="safe-visual-header">
                  <div className="safe-window-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span>AI Prompt Builder</span>
                </div>
                <div className="safe-visual-content">
                  <div className="mock-prompt-box">
                    <div className="prompt-label">AI Prompt</div>
                    <p className="prompt-text">"Draft a 1-year Software Development Services Contract with monthly invoicing and NDA clauses..."</p>
                    <div className="prompt-status">✨ Generating 4 pages & 6 signature fields...</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="safe-demo-step-grid">
              <div className="safe-demo-step-info">
                <h3>Court-Admissible Security & Audit Trail</h3>
                <p>
                  Every signature is backed by a cryptographic audit trail, IP logging, timestamping, and ESIGN / eIDAS compliance certificates.
                </p>

                <ul className="safe-demo-feature-list">
                  <li><CheckCircle size={16} color="#0f766e" /> 256-bit AES encryption at rest & in transit</li>
                  <li><CheckCircle size={16} color="#0f766e" /> Complete tamper-evident audit certificate</li>
                  <li><CheckCircle size={16} color="#0f766e" /> Bank-grade security & SOC2 Type II compliance</li>
                </ul>

                <div className="safe-demo-cta-row">
                  <button className="safe-demo-btn-primary" onClick={handleStartTrial}>
                    Get Started Free <Award size={16} />
                  </button>
                </div>
              </div>

              <div className="safe-demo-visual-card">
                <div className="safe-visual-header">
                  <div className="safe-window-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span>Audit Certificate Preview</span>
                </div>
                <div className="safe-visual-content">
                  <div className="mock-audit-card">
                    <div className="audit-header">
                      <Shield color="#0f766e" size={24} />
                      <div>
                        <strong>Certificate of Completion</strong>
                        <span>Document ID: DOC-9840284</span>
                      </div>
                    </div>
                    <div className="audit-row">
                      <span>Signer:</span>
                      <strong>alex@company.com (IP: 192.168.1.10)</strong>
                    </div>
                    <div className="audit-row">
                      <span>Timestamp:</span>
                      <strong>2026-09-18 14:30:00 UTC</strong>
                    </div>
                    <div className="audit-stamp">VERIFIED LEGAL SIGNATURE</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="safe-demo-footer">
          <p>Ready to automate your document workflows?</p>
          <div className="safe-demo-footer-buttons">
            <button className="safe-demo-btn-secondary" onClick={onClose}>
              Close Preview
            </button>
            <button className="safe-demo-btn-primary" onClick={handleStartTrial}>
              Start Free Trial Now
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .safe-demo-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.25s ease-out;
        }

        .safe-demo-modal {
          background: #ffffff;
          width: 100%;
          max-width: 900px;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }

        .safe-demo-header {
          padding: 28px 32px 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f1f5f9;
        }

        .safe-demo-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ccfbf1;
          color: #0f766e;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 10px;
        }

        .safe-demo-title-group h2 {
          margin: 0 0 6px 0;
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
        }

        .safe-demo-title-group p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .safe-demo-close-btn {
          background: #f1f5f9;
          border: none;
          color: #64748b;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-demo-close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .safe-demo-tabs {
          display: flex;
          background: #f8fafc;
          padding: 8px 32px;
          gap: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .safe-demo-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-demo-tab.active {
          background: #ffffff;
          color: #0f766e;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .safe-demo-body {
          padding: 32px;
          overflow-y: auto;
          flex: 1;
        }

        .safe-demo-step-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: center;
        }

        .safe-demo-step-info h3 {
          margin: 0 0 12px 0;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }

        .safe-demo-step-info p {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .safe-demo-feature-list {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .safe-demo-feature-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .safe-demo-visual-card {
          background: #0f172a;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
          border: 1px solid #334155;
        }

        .safe-visual-header {
          background: #1e293b;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #94a3b8;
        }

        .safe-window-dots {
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot.red { background: #ef4444; }
        .dot.yellow { background: #f59e0b; }
        .dot.green { background: #10b981; }

        .safe-visual-content {
          padding: 24px;
        }

        .safe-doc-preview-mock {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          color: #0f172a;
        }

        .mock-doc-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f766e;
          margin-bottom: 14px;
        }

        .mock-doc-line {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .mock-doc-line.long { width: 100%; }
        .mock-doc-line.medium { width: 75%; }
        .mock-doc-line.short { width: 50%; }

        .mock-signature-field {
          margin-top: 20px;
          border: 2px dashed #0f766e;
          background: #f0fdf4;
          padding: 12px;
          border-radius: 8px;
        }

        .field-tag {
          font-size: 10px;
          font-weight: 800;
          color: #0f766e;
          text-transform: uppercase;
        }

        .field-signature {
          font-family: 'Dancing Script', cursive, sans-serif;
          font-size: 16px;
          color: #047857;
          font-weight: 700;
          margin-top: 4px;
        }

        .mock-prompt-box {
          background: #1e293b;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #334155;
        }

        .prompt-label {
          font-size: 11px;
          font-weight: 700;
          color: #0ea5e9;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .prompt-text {
          color: #f8fafc;
          font-size: 13px;
          font-style: italic;
          margin: 0 0 12px 0;
        }

        .prompt-status {
          font-size: 12px;
          color: #10b981;
          font-weight: 600;
        }

        .mock-audit-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 16px;
          color: #0f172a;
        }

        .audit-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }

        .audit-header div {
          display: flex;
          flex-direction: column;
        }

        .audit-header strong {
          font-size: 13px;
          color: #0f172a;
        }

        .audit-header span {
          font-size: 11px;
          color: #64748b;
        }

        .audit-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 6px;
        }

        .audit-stamp {
          margin-top: 14px;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 6px;
          text-align: center;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          border-radius: 6px;
        }

        .safe-demo-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0f766e;
          color: #ffffff;
          border: none;
          padding: 12px 22px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-demo-btn-primary:hover {
          background: #0d6d66;
        }

        .safe-demo-btn-secondary {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .safe-demo-footer {
          padding: 20px 32px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .safe-demo-footer p {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }

        .safe-demo-footer-buttons {
          display: flex;
          gap: 12px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 768px) {
          .safe-demo-step-grid {
            grid-template-columns: 1fr;
          }
          .safe-demo-footer {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDemoModal;
