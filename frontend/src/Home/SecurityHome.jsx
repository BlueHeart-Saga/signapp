import React from "react";
import {
  Shield,
  Lock,
  Eye,
  FileCheck,
  Globe,
  CheckCircle,
  Zap,
  Users,
  Clock,
  AlertTriangle,
  Download,
  ArrowRight,
  BarChart,
  Server,
  Fingerprint,
  Key,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import IntegrationsScroll from "./IntegrationsScroll";

const SecurityHome = () => {
  const navigate = useNavigate();
  const securityFeatures = [
    {
      icon: <Lock size={24} />,
      title: "End-to-End Encryption",
      description: "256-bit AES encryption for data at rest and TLS 1.3 for data in transit",
      color: "#0d9488"
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "SOC 2 Type II Certified",
      description: "Audited annually for security, availability, and confidentiality",
      color: "#3b82f6"
    },
    {
      icon: <Globe size={24} />,
      title: "Global Compliance",
      description: "GDPR, CCPA, HIPAA, eIDAS, ESIGN, and UETA compliant",
      color: "#8b5cf6"
    },
    {
      icon: <Fingerprint size={24} />,
      title: "Multi-Factor Authentication",
      description: "Required for all user accounts and administrative access",
      color: "#ef4444"
    }
  ];

  const complianceStandards = [
    "GDPR",
    "CCPA",
    "HIPAA",
    "SOC 2 Type II",
    "ISO 27001",
    "eIDAS",
    "ESIGN",
    "UETA",
    "PCI DSS",
    "FedRAMP"
  ];

  return (
    <div className="security-home">
      {/* Hero Section */}
      <section className="security-hero">
        <div className="security-container">
          <div className="security-hero-wrapper">
            <div className="security-hero-left">
              <div className="security-hero-content">
                <div className="security-hero-badge">
                  <Shield size={20} />
                  <span>Enterprise Security</span>
                </div>
                
                <h1 className="security-hero-title">
                  Protect every document with{" "}
                  <span className="security-highlight">enterprise-grade</span> security
                </h1>
                
                <p className="security-hero-subtitle">
                  Your documents and signatures are protected with military-grade encryption,
                  secure infrastructure, and globally recognized compliance standards.
                </p>
                
                <div className="security-hero-actions">
                  <button onClick={() => navigate("/login")} className="security-btn security-btn-primary">
                    Request a Demo
                    <ArrowRight size={18} />
                  </button>
                  <button onClick={() => navigate("/login")} className="security-btn security-btn-secondary">
                    Start Free Trial
                  </button>
                </div>
                
                <div className="security-hero-stats">
                  <div className="security-stat">
                    <div className="security-stat-number">99.9%</div>
                    <div className="security-stat-label">Uptime SLA</div>
                  </div>
                  <div className="security-stat-divider"></div>
                  <div className="security-stat">
                    <div className="security-stat-number">256-bit</div>
                    <div className="security-stat-label">AES Encryption</div>
                  </div>
                  <div className="security-stat-divider"></div>
                  <div className="security-stat">
                    <div className="security-stat-number">24/7</div>
                    <div className="security-stat-label">Security Monitoring</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="security-hero-right">
              <div className="security-hero-visual">
                <img
                  src="/images/security-hero.png"
                  alt="Security Dashboard showing encryption and compliance features"
                  className="security-hero-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="security-trusted">
        <div className="security-container">
          <IntegrationsScroll />
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="security-features">
        <div className="security-container">
          <div className="security-features-header">
            <h2 className="security-features-title">Enterprise Security Features</h2>
            <p className="security-features-subtitle">
              Comprehensive security measures designed for business-critical documents
            </p>
          </div>
          
          <div className="security-features-grid">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="security-feature-card">
                <div 
                  className="security-feature-icon"
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="security-feature-title">{feature.title}</h3>
                <p className="security-feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Standards */}
      <section className="security-compliance">
        <div className="security-container">
          <div className="security-compliance-header">
            <FileCheck size={32} />
            <h2 className="security-compliance-title">Global Compliance Standards</h2>
            <p className="security-compliance-subtitle">
              Meet regulatory requirements across industries and jurisdictions
            </p>
          </div>
          
          <div className="security-compliance-grid">
            {complianceStandards.map((standard, index) => (
              <div key={index} className="security-compliance-badge">
                <CheckCircle size={16} className="security-compliance-check" />
                <span>{standard}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="security-detailed">
        <div className="security-container">
          {/* Encryption */}
          <div className="security-detailed-feature">
            <div className="security-detailed-content">
              <div className="security-detailed-badge">
                <Lock size={20} />
                <span>Data Protection</span>
              </div>
              <h2 className="security-detailed-title">Advanced Data Encryption</h2>
              <p className="security-detailed-description">
                All documents and signatures are encrypted both in transit and at rest.
                Bank-level 256-bit AES encryption ensures only authorized users can access 
                document data, preventing tampering and unauthorized viewing.
              </p>
              
              <div className="security-detailed-points">
                <div className="security-point">
                  <Key size={18} />
                  <div>
                    <h4>256-bit AES Encryption</h4>
                    <p>Military-grade encryption for all stored data</p>
                  </div>
                </div>
                <div className="security-point">
                  <Server size={18} />
                  <div>
                    <h4>Secure Infrastructure</h4>
                    <p>Enterprise-grade data centers with 24/7 monitoring</p>
                  </div>
                </div>
                <div className="security-point">
                  <Eye size={18} />
                  <div>
                    <h4>Zero-Knowledge Architecture</h4>
                    <p>We never have access to your unencrypted documents</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="security-detailed-visual">
              <div className="security-encryption-visual">
                <div className="security-encryption-layer">
                  <div className="security-encryption-icon">
                    <Lock size={24} />
                  </div>
                  <span>256-bit AES</span>
                </div>
                <div className="security-encryption-arrow">→</div>
                <div className="security-encryption-layer">
                  <div className="security-encryption-icon">
                    <Shield size={24} />
                  </div>
                  <span>TLS 1.3</span>
                </div>
                <div className="security-encryption-arrow">→</div>
                <div className="security-encryption-layer">
                  <div className="security-encryption-icon">
                    <CheckCircle size={24} />
                  </div>
                  <span>Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="security-detailed-feature security-detailed-reverse">
            <div className="security-detailed-visual">
              <div className="security-compliance-visual">
                <div className="security-compliance-badges">
                  <div className="security-compliance-large">GDPR</div>
                  <div className="security-compliance-large">HIPAA</div>
                  <div className="security-compliance-large">SOC 2</div>
                  <div className="security-compliance-large">ISO 27001</div>
                </div>
              </div>
            </div>
            
            <div className="security-detailed-content">
              <div className="security-detailed-badge">
                <Globe size={20} />
                <span>Legal Compliance</span>
              </div>
              <h2 className="security-detailed-title">Legally Binding & Compliant</h2>
              <p className="security-detailed-description">
                Fully compliant with global e-signature laws including ESIGN, eIDAS,
                and UETA. Your documents hold full legal validity across jurisdictions
                and meet strict regulatory requirements.
              </p>
              
              <div className="security-detailed-points">
                <div className="security-point">
                  <FileCheck size={18} />
                  <div>
                    <h4>Global Legal Validity</h4>
                    <p>Accepted in 180+ countries worldwide</p>
                  </div>
                </div>
                <div className="security-point">
                  <Users size={18} />
                  <div>
                    <h4>Industry-Specific Compliance</h4>
                    <p>Healthcare, Finance, Legal, and Government</p>
                  </div>
                </div>
                <div className="security-point">
                  <AlertTriangle size={18} />
                  <div>
                    <h4>Regulatory Updates</h4>
                    <p>Automatic updates for changing regulations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="security-detailed-feature">
            <div className="security-detailed-content">
              <div className="security-detailed-badge">
                <BarChart size={20} />
                <span>Transparency</span>
              </div>
              <h2 className="security-detailed-title">Complete Audit Trail</h2>
              <p className="security-detailed-description">
                Track every action taken on a document with detailed timestamps,
                IP tracking, and identity verification logs. Ensure accountability
                and transparency for every signature event.
              </p>
              
              <div className="security-detailed-points">
                <div className="security-point">
                  <Clock size={18} />
                  <div>
                    <h4>Timestamp Verification</h4>
                    <p>Cryptographically signed timestamps for every action</p>
                  </div>
                </div>
                <div className="security-point">
                  <Zap size={18} />
                  <div>
                    <h4>Real-Time Monitoring</h4>
                    <p>Instant alerts for suspicious activities</p>
                  </div>
                </div>
                <div className="security-point">
                  <Download size={18} />
                  <div>
                    <h4>Exportable Logs</h4>
                    <p>Download complete audit trails for legal purposes</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="security-detailed-visual">
              <div className="security-audit-visual">
                <div className="security-audit-timeline">
                  <div className="security-audit-event">
                    <div className="security-audit-dot"></div>
                    <div className="security-audit-content">
                      <span>Document Created</span>
                      <small>10:30 AM • User: John Doe</small>
                    </div>
                  </div>
                  <div className="security-audit-event">
                    <div className="security-audit-dot"></div>
                    <div className="security-audit-content">
                      <span>Sent for Signature</span>
                      <small>10:35 AM • IP: 192.168.1.1</small>
                    </div>
                  </div>
                  <div className="security-audit-event">
                    <div className="security-audit-dot"></div>
                    <div className="security-audit-content">
                      <span>Viewed by Recipient</span>
                      <small>2:15 PM • Device: iPhone 14</small>
                    </div>
                  </div>
                  <div className="security-audit-event">
                    <div className="security-audit-dot"></div>
                    <div className="security-audit-content">
                      <span>Signed Document</span>
                      <small>2:20 PM • Biometric verified</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="security-cta">
        <div className="security-container">
          <div className="security-cta-content">
            <Shield size={48} className="security-cta-icon" />
            <h2 className="security-cta-title">Ready to secure your documents?</h2>
            <p className="security-cta-subtitle">
              Join thousands of organizations that trust SafeSign for their most sensitive signing needs
            </p>
            <div className="security-cta-actions">
              <button onClick={() => navigate("/login")} className="security-btn security-btn-primary security-btn-large">
                Start Free Trial
                <ArrowRight size={20} />
              </button>
              <button onClick={() => navigate("/login")} className="security-btn security-btn-secondary security-btn-large">
                Schedule a Security Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* Base Styles */
        .security-home {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
        }

        .security-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Hero Section - Fixed Layout */
        .security-hero {
          padding: 6rem 0;
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
          position: relative;
          overflow: hidden;
        }

        .security-hero::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 45%;
          height: 100%;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
        }

        /* Hero Wrapper - Flexbox layout */
        .security-hero-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4rem;
          position: relative;
          z-index: 2;
        }

        .security-hero-left {
          flex: 1;
          max-width: 600px;
        }

        .security-hero-right {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .security-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          backdrop-filter: blur(8px);
        }

        .security-hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          color: white;
          margin: 0 0 1.5rem;
          line-height: 1.2;
        }

        .security-highlight {
          color: #a7f3d0;
          position: relative;
        }

        .security-hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 2.5rem;
          line-height: 1.6;
          max-width: 500px;
        }

        .security-hero-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .security-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.75rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          text-decoration: none;
        }

        .security-btn-primary {
          background: white;
          color: #0d9488;
        }

        .security-btn-primary:hover {
          background: #f0fdfa;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
        }

        .security-btn-secondary {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .security-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .security-hero-stats {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .security-stat {
          text-align: center;
        }

        .security-stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.25rem;
        }

        .security-stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .security-stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
        }

        /* Hero Visual - Image on Right */
        .security-hero-visual {
          position: relative;
          width: 100%;
          max-width: 600px;
          display: flex;
          justify-content: center;
        }

        .security-hero-img {
          width: 100%;
          height: auto;
          border-radius: 1.25rem;
          box-shadow:
            0 30px 60px rgba(0, 0, 0, 0.25),
            0 10px 30px rgba(0, 0, 0, 0.15);
          
          padding: 1rem;
          object-fit: cover;
        }

        /* Add subtle floating effect */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .security-hero-visual::before {
          content: "";
          position: absolute;
          inset: -20px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 1.75rem;
          backdrop-filter: blur(16px);
          z-index: -1;
          animation: float 6s ease-in-out infinite;
        }

        /* Trusted Section */
        .security-trusted {
          padding: 4rem 0;
          background: #f9fafb;
        }

        .security-trusted-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .security-trusted-title {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem;
        }

        .security-trusted-subtitle {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0 auto;
          max-width: 600px;
        }

        /* Security Features */
        .security-features {
          padding: 5rem 0;
          background: white;
        }

        .security-features-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .security-features-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem;
        }

        .security-features-subtitle {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0 auto;
          max-width: 600px;
        }

        .security-features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .security-features-grid {
            grid-template-columns: 1fr;
          }
        }

        .security-feature-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 2rem;
          transition: all 0.2s;
        }

        .security-feature-card:hover {
          border-color: #0d9488;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.05);
        }

        .security-feature-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .security-feature-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.75rem;
        }

        .security-feature-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.6;
        }

        /* Compliance Section */
        .security-compliance {
          padding: 4rem 0;
          background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
        }

        .security-compliance-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .security-compliance-title {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin: 1rem 0;
        }

        .security-compliance-subtitle {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0 auto;
          max-width: 600px;
        }

        .security-compliance-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
        }

        @media (max-width: 1024px) {
          .security-compliance-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 640px) {
          .security-compliance-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .security-compliance-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          border: 1px solid #d1fae5;
          border-radius: 0.75rem;
          padding: 1rem;
          font-weight: 500;
          color: #111827;
        }

        .security-compliance-check {
          color: #10b981;
          flex-shrink: 0;
        }

        /* Detailed Features */
        .security-detailed {
          padding: 5rem 0;
          background: white;
        }

        .security-detailed-feature {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          margin-bottom: 6rem;
        }

        .security-detailed-reverse {
          direction: rtl;
        }

        .security-detailed-reverse > * {
          direction: ltr;
        }

        @media (max-width: 1024px) {
          .security-detailed-feature {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
        }

        .security-detailed-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #f0fdfa;
          color: #0d9488;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .security-detailed-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1.5rem;
        }

        .security-detailed-description {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0 0 2.5rem;
          line-height: 1.6;
        }

        .security-detailed-points {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .security-point {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .security-point svg {
          color: #0d9488;
          margin-top: 0.125rem;
          flex-shrink: 0;
        }

        .security-point h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .security-point p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .security-detailed-visual {
          display: flex;
          justify-content: center;
        }

        /* Encryption Visual */
        .security-encryption-visual {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: #f9fafb;
          padding: 2rem;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
        }

        .security-encryption-layer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          min-width: 100px;
        }

        .security-encryption-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 1rem;
          background: white;
          border: 2px solid #0d9488;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d9488;
        }

        .security-encryption-arrow {
          color: #9ca3af;
          font-size: 1.5rem;
          font-weight: 300;
        }

        /* Compliance Visual */
        .security-compliance-visual {
          background: #f9fafb;
          padding: 2rem;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
        }

        .security-compliance-badges {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .security-compliance-large {
          background: white;
          border: 2px solid #d1fae5;
          border-radius: 0.75rem;
          padding: 1.5rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #0d9488;
          text-align: center;
        }

        /* Audit Visual */
        .security-audit-visual {
          background: #f9fafb;
          padding: 2rem;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          width: 100%;
          max-width: 400px;
        }

        .security-audit-timeline {
          position: relative;
        }

        .security-audit-timeline::before {
          content: '';
          position: absolute;
          left: 0.5rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #d1fae5;
        }

        .security-audit-event {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          position: relative;
        }

        .security-audit-dot {
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: #0d9488;
          border: 3px solid white;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .security-audit-content {
          flex: 1;
          padding-top: 0.125rem;
        }

        .security-audit-content span {
          display: block;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .security-audit-content small {
          color: #6b7280;
          font-size: 0.75rem;
        }

        /* CTA Section */
        .security-cta {
          padding: 6rem 0;
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
          text-align: center;
        }

        .security-cta-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .security-cta-icon {
          color: white;
          margin-bottom: 2rem;
        }

        .security-cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin: 0 0 1rem;
        }

        .security-cta-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 2.5rem;
          line-height: 1.6;
        }

        .security-cta-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .security-btn-large {
          padding: 1rem 2rem;
          font-size: 1rem;
        }

        /* Responsive Styles */
        @media (max-width: 1024px) {
          .security-hero-wrapper {
            flex-direction: column;
            gap: 3rem;
            text-align: center;
          }
          
          .security-hero-left {
            max-width: 100%;
          }
          
          .security-hero-subtitle {
            margin-left: auto;
            margin-right: auto;
          }
          
          .security-hero-actions {
            justify-content: center;
          }
          
          .security-hero-visual {
            max-width: 400px;
          }
        }

        @media (max-width: 768px) {
          .security-hero-title {
            font-size: 2.5rem;
          }
          
          .security-hero-subtitle {
            font-size: 1.125rem;
          }
          
          .security-hero-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .security-btn {
            width: 100%;
            max-width: 300px;
            justify-content: center;
          }
          
          .security-hero-stats {
            flex-direction: column;
            gap: 1rem;
          }
          
          .security-stat-divider {
            width: 100px;
            height: 1px;
          }
          
          .security-detailed-title {
            font-size: 2rem;
          }
          
          .security-cta-actions {
            flex-direction: column;
            align-items: center;
          }
        }

        @media (max-width: 640px) {
          .security-container {
            padding: 0 1rem;
          }
          
          .security-hero {
            padding: 4rem 0;
          }
          
          .security-hero-title {
            font-size: 2rem;
          }
          
          .security-features-title,
          .security-compliance-title,
          .security-cta-title {
            font-size: 1.75rem;
          }
          
          .security-detailed-title {
            font-size: 1.75rem;
          }
          
          .security-encryption-visual {
            flex-direction: column;
          }
          
          .security-encryption-arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
};

export default SecurityHome;