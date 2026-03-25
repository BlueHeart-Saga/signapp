import React from 'react';
import {
  Shield,
  AlertTriangle,
  Flag,
  Clock,
  CheckCircle,
  Lock,
  Eye,
  Users,
  ArrowRight,
  Mail,
  FileText,
  Globe
} from 'lucide-react';

const AbuseHeroCard = () => {
  return (
    <div className="abuse-hero-card">
      <div className="abuse-hero-content">
        {/* Badge */}
        <div className="abuse-hero-badge">
          <Shield size={18} />
          <span>Secure Reporting Center</span>
        </div>

        {/* Main Title */}
        <h1 className="abuse-hero-title">
          Report Spam & Protect
          <span className="abuse-hero-highlight">
            Our Community
          </span>
        </h1>

        {/* Subtitle */}
        <p className="abuse-hero-subtitle">
          Help us maintain a secure platform by reporting suspicious activities. 
          Your vigilance makes SafeSign safer for millions of users worldwide.
        </p>

        {/* Trust Metrics */}
        <div className="abuse-trust-metrics">
          <div className="abuse-metric">
            <div className="abuse-metric-value">24-48h</div>
            <div className="abuse-metric-label">Avg. Response Time</div>
          </div>
          <div className="abuse-metric-divider"></div>
          <div className="abuse-metric">
            <div className="abuse-metric-value">99.9%</div>
            <div className="abuse-metric-label">Report Accuracy</div>
          </div>
          <div className="abuse-metric-divider"></div>
          <div className="abuse-metric">
            <div className="abuse-metric-value">10K+</div>
            <div className="abuse-metric-label">Threats Blocked</div>
          </div>
        </div>

        {/* Action Section */}
        <div className="abuse-action-section">
          <div className="abuse-action-description">
            <h3 className="abuse-action-title">
              <AlertTriangle size={20} />
              Why Report Matters
            </h3>
            <ul className="abuse-benefits-list">
              <li>
                <CheckCircle size={16} />
                Helps prevent phishing attacks
              </li>
              <li>
                <Lock size={16} />
                Protects user data and privacy
              </li>
              <li>
                <Users size={16} />
                Creates safer community for all
              </li>
              <li>
                <Globe size={16} />
                Contributes to global security
              </li>
            </ul>
          </div>

          {/* <div className="abuse-cta-section">
            <button className="abuse-primary-cta">
              <Flag size={20} />
              Report Suspicious Email
              <ArrowRight size={18} />
            </button>
            <button className="abuse-secondary-cta">
              <Eye size={20} />
              View Security Guide
            </button>
            <div className="abuse-trust-note">
              <Lock size={14} />
              <span>All reports are confidential and encrypted</span>
            </div>
          </div> */}
        </div>

        {/* Quick Tips */}
        {/* <div className="abuse-quick-tips">
          <div className="abuse-tip-header">
            <AlertTriangle size={18} color="#0d9488" />
            <h4>Quick Identification Tips</h4>
          </div>
          <div className="abuse-tips-grid">
            <div className="abuse-tip-card">
              <div className="abuse-tip-icon">
                <Mail size={16} />
              </div>
              <p>Check sender email for misspellings</p>
            </div>
            <div className="abuse-tip-card">
              <div className="abuse-tip-icon">
                <FileText size={16} />
              </div>
              <p>Verify document names you recognize</p>
            </div>
            <div className="abuse-tip-card">
              <div className="abuse-tip-icon">
                <Globe size={16} />
              </div>
              <p>Hover over links before clicking</p>
            </div>
          </div>
        </div> */}
      </div>

      {/* Right Side - Professional Image Section */}
      <div className="abuse-hero-visual">
        <div className="security-hero-right">
              
        <div className="abuse-visual-overlay">
            <div className="security-hero-visual">
                <img
                  src="/images/security-hero.png"
                  alt="Security Dashboard showing encryption and compliance features"
                  className="security-hero-img"
                />
              </div>
            </div>
          {/* This would be replaced with an actual image */}
          {/* <div className="abuse-image-placeholder">
            <img 
    src="/images/professional-image.png" 
    alt="Security and Protection" 
    className="abuse-visual-image"
  />
            <div className="abuse-image-content">
              <div className="abuse-image-badge">
                <Shield size={24} />
                <span>Security First</span>
              </div>
              <h3 className="abuse-image-title">
                Protecting Digital Signatures Worldwide
              </h3>
              <div className="abuse-image-stats">
                <div className="abuse-image-stat">
                  <div className="abuse-image-stat-value">500M+</div>
                  <div className="abuse-image-stat-label">Documents Secured</div>
                </div>
                <div className="abuse-image-stat">
                  <div className="abuse-image-stat-value">150+</div>
                  <div className="abuse-image-stat-label">Countries</div>
                </div>
              </div>
            </div> 
          </div>*/}
          
          {/* Floating Security Cards */}
          {/* <div className="abuse-floating-card abuse-card-1">
            <Shield size={20} />
            <span>Enterprise-grade Security</span>
          </div>
          <div className="abuse-floating-card abuse-card-2">
            <Lock size={20} />
            <span>End-to-end Encryption</span>
          </div>
          <div className="abuse-floating-card abuse-card-3">
            <CheckCircle size={20} />
            <span>SOC 2 Type II Compliant</span>
          </div> */}
        </div>
      </div>

      <style jsx>{`
        .abuse-hero-card {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          margin: 2rem 0;
          box-shadow: 0 20px 60px rgba(13, 148, 136, 0.3);
        }

        /* Content Layout */
        .abuse-hero-content {
          padding: 3.5rem;
          position: relative;
          z-index: 2;
          color: white;
        }

        @media (min-width: 1024px) {
          .abuse-hero-card {
            display: grid;
            grid-template-columns: 1fr 1fr;
            min-height: 600px;
          }
          
          .abuse-hero-visual {
            position: relative;
            overflow: hidden;
          }
        }

        /* Badge */
        .abuse-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Title */
        .abuse-hero-title {
          font-size: 3.25rem;
          font-weight: 800;
          color: white;
          margin: 0 0 1.5rem;
          line-height: 1.2;
        }

        .abuse-hero-highlight {
          display: block;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 700;
        }

        /* Subtitle */
        .abuse-hero-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.7;
          max-width: 600px;
          margin: 0 0 2.5rem;
        }

        /* Trust Metrics */
        .abuse-trust-metrics {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2.5rem;
          padding: 1.5rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .abuse-metric {
          text-align: center;
        }

        .abuse-metric-value {
          font-size: 2rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.25rem;
          line-height: 1;
        }

        .abuse-metric-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .abuse-metric-divider {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
        }

        /* Action Section */
        .abuse-action-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2.5rem;
        }

        @media (max-width: 768px) {
          .abuse-action-section {
            grid-template-columns: 1fr;
          }
        }

        .abuse-action-description {
          padding-right: 1rem;
        }

        .abuse-action-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          margin: 0 0 1rem;
        }

        .abuse-benefits-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .abuse-benefits-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9375rem;
        }

        .abuse-benefits-list li svg {
          color: #5eead4;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        /* CTA Section */
        .abuse-cta-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .abuse-primary-cta,
        .abuse-secondary-cta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.125rem 1.75rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          justify-content: center;
        }

        .abuse-primary-cta {
          background: white;
          color: #0d9488;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        }

        .abuse-primary-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
          background: #f8fafc;
        }

        .abuse-secondary-cta {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }

        .abuse-secondary-cta:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .abuse-trust-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 0.5rem;
        }

        /* Quick Tips */
        .abuse-quick-tips {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .abuse-tip-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .abuse-tip-header h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .abuse-tips-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .abuse-tips-grid {
            grid-template-columns: 1fr;
          }
        }

        .abuse-tip-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.25rem;
          transition: all 0.3s ease;
        }

        .abuse-tip-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .abuse-tip-icon {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
          color: #5eead4;
        }

        .abuse-tip-card p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.5;
        }

        /* Right Side - Visual Section */
        .abuse-hero-visual {
          position: relative;
        }

        .abuse-visual-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(15, 118, 110, 0.9), rgba(13, 148, 136, 0.8)),
                      url('/api/placeholder/800/600') center/cover no-repeat;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        /* Replace the URL above with your actual image path */
        .abuse-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .abuse-image-content {
          text-align: center;
          color: white;
          max-width: 400px;
        }

        .abuse-image-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.15);
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
        }

        .abuse-image-title {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin: 0 0 2rem;
          line-height: 1.3;
        }

        .abuse-image-stats {
          display: flex;
          justify-content: center;
          gap: 3rem;
        }

        .abuse-image-stat {
          text-align: center;
        }

        .abuse-image-stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.25rem;
          line-height: 1;
        }

        .abuse-image-stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
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

        /* Floating Security Cards */
        .abuse-floating-card {
          position: absolute;
          background: white;
          color: #0d9488;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          font-size: 0.875rem;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          animation: float 6s ease-in-out infinite;
          z-index: 2;
        }

        .abuse-floating-card svg {
          color: #0d9488;
        }

        .abuse-card-1 {
          top: 20%;
          right: 10%;
          animation-delay: 0s;
        }

        .abuse-card-2 {
          bottom: 30%;
          left: 10%;
          animation-delay: 2s;
        }

        .abuse-card-3 {
          top: 50%;
          right: 15%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-10px) translateX(5px); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .abuse-hero-card {
            display: block;
          }
          
          .abuse-hero-visual {
            display: none;
          }
          
          .abuse-hero-content {
            padding: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .abuse-hero-title {
            font-size: 2.5rem;
          }
          
          .abuse-trust-metrics {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }
          
          .abuse-metric-divider {
            display: none;
          }
          
          .abuse-action-section {
            grid-template-columns: 1fr;
          }
          
          .abuse-primary-cta,
          .abuse-secondary-cta {
            padding: 1rem 1.5rem;
          }
        }

        @media (max-width: 640px) {
          .abuse-hero-title {
            font-size: 2rem;
          }
          
          .abuse-hero-content {
            padding: 1.75rem;
          }
          
          .abuse-tips-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AbuseHeroCard;