import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Eye,
  Database,
  Users,
  Globe,
  FileText,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Mail,
  Calendar,
  Download,
  Printer,
  ExternalLink,
  Search
} from 'lucide-react';

const PrivacyPolicy = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated] = useState('January 15, 2025');

  const sections = [
    {
      id: 'introduction',
      title: 'Introduction & Scope',
      content: `SafeSign ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our electronic signature platform, website, and related services (collectively, the "Services").

This policy applies to information we collect:
- Through our website and mobile applications
- In email, text, and other electronic messages between you and SafeSign
- When you interact with our advertising and applications on third-party websites
- From our business partners and service providers`,
      subSections: []
    },
    {
      id: 'data-collection',
      title: 'Information We Collect',
      content: `We collect several types of information from and about users of our Services:`,
      subSections: [
        {
          title: 'Personal Information',
          content: `When you create an account or use our Services, we may collect:
- Name, email address, phone number, and contact details
- Company name, job title, and professional information
- Payment and billing information
- Government-issued identification (when required for verification)`
        },
        {
          title: 'Document Information',
          content: `We process documents and information you upload to our platform:
- Document content and metadata
- Signature data and timestamps
- Recipient information
- Audit trails and activity logs`
        },
        {
          title: 'Usage Information',
          content: `We automatically collect information about your interaction with our Services:
- IP addresses, browser type, and device information
- Pages visited, features used, and time spent
- Cookies and similar tracking technologies
- Error reports and performance data`
        },
        {
          title: 'Communication Data',
          content: `We collect information from your communications with us:
- Customer support inquiries and feedback
- Survey responses and research participation
- Marketing communications preferences`
        }
      ]
    },
    {
      id: 'data-usage',
      title: 'How We Use Your Information',
      content: `We use the information we collect for various business purposes:`,
      subSections: [
        {
          title: 'Service Delivery',
          content: `- Provide, maintain, and improve our Services
- Process transactions and send related information
- Authenticate users and secure accounts
- Enable document signing and management`
        },
        {
          title: 'Communication',
          content: `- Send service-related announcements
- Respond to customer support requests
- Send marketing communications (with consent)
- Conduct surveys and gather feedback`
        },
        {
          title: 'Legal & Security',
          content: `- Comply with legal obligations and regulations
- Protect against fraudulent or illegal activity
- Enforce our terms and conditions
- Maintain security of our Services`
        },
        {
          title: 'Analytics & Improvement',
          content: `- Analyze usage patterns and trends
- Develop new features and services
- Measure effectiveness of our Services
- Conduct research and development`
        }
      ]
    },
    {
      id: 'data-sharing',
      title: 'Information Sharing & Disclosure',
      content: `We may share your information in the following circumstances:`,
      subSections: [
        {
          title: 'Service Providers',
          content: `We share information with third-party vendors who provide services on our behalf, such as:
- Payment processing and billing services
- Cloud hosting and infrastructure providers
- Customer support and communication tools
- Analytics and monitoring services`
        },
        {
          title: 'Legal Requirements',
          content: `We may disclose information if required by law, such as:
- In response to subpoenas or court orders
- To comply with government investigations
- To enforce our legal rights and agreements
- To protect the safety of our users and the public`
        },
        {
          title: 'Business Transfers',
          content: `In connection with a merger, acquisition, or sale of assets, user information may be transferred as a business asset.`
        },
        {
          title: 'With Your Consent',
          content: `We share information with third parties when you give us explicit consent to do so.`
        }
      ]
    },
    {
      id: 'data-security',
      title: 'Data Security & Protection',
      content: `We implement appropriate technical and organizational measures to protect your information:`,
      subSections: [
        {
          title: 'Security Measures',
          content: `- 256-bit AES encryption for data at rest and in transit
- SOC 2 Type II compliance and regular security audits
- Multi-factor authentication for all accounts
- Secure data centers with physical security controls`
        },
        {
          title: 'Access Controls',
          content: `- Role-based access controls and permissions
- Regular security training for employees
- Background checks for personnel with data access
- Strict data access logging and monitoring`
        },
        {
          title: 'Incident Response',
          content: `- 24/7 security monitoring and threat detection
- Incident response plan and procedures
- Regular security assessments and penetration testing
- Breach notification procedures as required by law`
        }
      ]
    },
    {
      id: 'data-rights',
      title: 'Your Data Protection Rights',
      content: `Depending on your location, you may have certain rights regarding your personal information:`,
      subSections: [
        {
          title: 'Access & Correction',
          content: `You have the right to access and correct your personal information. You can update most information through your account settings or by contacting us.`
        },
        {
          title: 'Deletion',
          content: `You may request deletion of your personal information, subject to legal retention requirements and legitimate business needs.`
        },
        {
          title: 'Data Portability',
          content: `You can request a copy of your data in a structured, commonly used, and machine-readable format.`
        },
        {
          title: 'Objection & Restriction',
          content: `You may object to certain processing activities or request restriction of processing in specific circumstances.`
        },
        {
          title: 'Opt-Out',
          content: `You can opt out of marketing communications at any time by using the unsubscribe link in our emails or contacting us directly.`
        }
      ]
    },
    {
      id: 'international',
      title: 'International Data Transfers',
      content: `We operate globally and may transfer your information to countries other than your own. We ensure adequate protection through:`,
      subSections: [
        {
          title: 'Standard Contractual Clauses',
          content: `We use EU Standard Contractual Clauses for transfers from the European Economic Area to other countries.`
        },
        {
          title: 'Privacy Shield',
          content: `For transfers to the United States, we rely on adequacy decisions and appropriate safeguards.`
        },
        {
          title: 'Data Protection',
          content: `All international transfers follow applicable data protection laws and include appropriate security measures.`
        }
      ]
    },
    {
      id: 'retention',
      title: 'Data Retention',
      content: `We retain your information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law.`,
      subSections: [
        {
          title: 'Account Data',
          content: `We retain account information while your account is active and for a reasonable period thereafter for legal, tax, and accounting purposes.`
        },
        {
          title: 'Document Data',
          content: `Signed documents and related data are retained according to your subscription plan and applicable legal requirements for document retention.`
        },
        {
          title: 'Usage Data',
          content: `We retain usage data for analytics and service improvement for up to 36 months, after which it is anonymized or deleted.`
        },
        {
          title: 'Legal Holds',
          content: `Information may be retained longer when required by law, legal process, or regulatory requirements.`
        }
      ]
    },
    {
      id: 'children',
      title: "Children's Privacy",
      content: `Our Services are not directed to children under the age of 16. We do not knowingly collect personal information from children under 16. If we learn we have collected personal information from a child under 16, we will delete that information promptly.`
    },
    {
      id: 'updates',
      title: 'Policy Updates',
      content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by:
- Posting the new Privacy Policy on this page
- Sending an email notification to registered users
- Updating the "Last Updated" date at the top of this policy

We encourage you to review this Privacy Policy periodically for any changes.`
    },
    {
      id: 'contact',
      title: 'Contact Information',
      content: `If you have questions about this Privacy Policy or our privacy practices, please contact us:

SafeSign Privacy Team
Email: privacy@safesign.com
Address: 123 Security Lane, San Francisco, CA 94107, USA
Phone: +1 (800) 123-4567

Data Protection Officer:
Email: dpo@safesign.com`
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.subSections?.some(sub =>
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="safe-policy-page">
      {/* Hero Section */}
      <section className="safe-policy-hero">
        <div className="safe-policy-container">
          <div className="safe-hero-content">
            <div className="safe-hero-badge">
              <Shield size={20} />
              <span>Privacy Center</span>
            </div>
            <h1 className="safe-hero-title">Privacy Policy</h1>
            <p className="safe-hero-subtitle">
              How we collect, use, and protect your information when you use SafeSign services
            </p>
            
            <div className="safe-hero-meta">
              <div className="safe-meta-item">
                <Calendar size={16} />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className="safe-meta-item">
                <FileText size={16} />
                <span>Version: 3.2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Navigation */}
      <section className="safe-policy-navigation">
        <div className="safe-policy-container">
          <div className="safe-navigation-content">
            <div className="safe-search-section">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search privacy policy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="safe-search-input"
              />
            </div>
            
            <div className="safe-quick-links">
              <a href="#introduction" className="safe-quick-link">
                <Eye size={14} />
                Introduction
              </a>
              <a href="#data-collection" className="safe-quick-link">
                <Database size={14} />
                Data Collection
              </a>
              <a href="#data-rights" className="safe-quick-link">
                <Users size={14} />
                Your Rights
              </a>
              <a href="#contact" className="safe-quick-link">
                <Mail size={14} />
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="safe-policy-main">
        <div className="safe-policy-container">
          <div className="safe-policy-content">
            {/* Summary Box */}
            <div className="safe-summary-box">
              <div className="safe-summary-header">
                <Shield size={24} />
                <h2 className="safe-summary-title">Policy Summary</h2>
              </div>
              <div className="safe-summary-grid">
                <div className="safe-summary-item">
                  <div className="safe-summary-icon">
                    <Lock size={20} />
                  </div>
                  <div className="safe-summary-text">
                    <h4>Data Security</h4>
                    <p>256-bit encryption & SOC 2 compliance</p>
                  </div>
                </div>
                <div className="safe-summary-item">
                  <div className="safe-summary-icon">
                    <Globe size={20} />
                  </div>
                  <div className="safe-summary-text">
                    <h4>Global Standards</h4>
                    <p>GDPR, CCPA, and ePrivacy compliant</p>
                  </div>
                </div>
                <div className="safe-summary-item">
                  <div className="safe-summary-icon">
                    <CheckCircle size={20} />
                  </div>
                  <div className="safe-summary-text">
                    <h4>Transparency</h4>
                    <p>Clear data practices and controls</p>
                  </div>
                </div>
                <div className="safe-summary-item">
                  <div className="safe-summary-icon">
                    <AlertCircle size={20} />
                  </div>
                  <div className="safe-summary-text">
                    <h4>Your Control</h4>
                    <p>Manage preferences anytime</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Sections */}
            <div className="safe-sections-container">
              {filteredSections.map((section, index) => (
                <section 
                  key={section.id} 
                  id={section.id}
                  className="safe-policy-section"
                >
                  <div className="safe-section-header">
                    <h2 className="safe-section-title">
                      <span className="safe-section-number">{index + 1}.</span>
                      {section.title}
                    </h2>
                    <button 
                      className="safe-expand-btn"
                      onClick={() => toggleSection(section.id)}
                    >
                      {expandedSections[section.id] ? 'Collapse' : 'Expand'}
                      <ChevronDown className={`safe-expand-arrow ${expandedSections[section.id] ? 'safe-arrow-expanded' : ''}`} />
                    </button>
                  </div>
                  
                  <div className={`safe-section-content ${expandedSections[section.id] ? 'safe-content-expanded' : ''}`}>
                    <p className="safe-section-text">{section.content}</p>
                    
                    {section.subSections && section.subSections.length > 0 && (
                      <div className="safe-sub-sections">
                        {section.subSections.map((subSection, subIndex) => (
                          <div key={subIndex} className="safe-sub-section">
                            <h3 className="safe-sub-section-title">{subSection.title}</h3>
                            <p className="safe-sub-section-text">{subSection.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>

            {/* Actions */}
            <div className="safe-policy-actions">
              <button className="safe-action-btn safe-btn-primary">
                <Download size={18} />
                Download PDF
              </button>
              <button className="safe-action-btn safe-btn-secondary">
                <Printer size={18} />
                Print Policy
              </button>
              <a href="/contact" className="safe-action-btn safe-btn-secondary">
                <Mail size={18} />
                Contact Privacy Team
              </a>
            </div>

            {/* Related Policies */}
            <div className="safe-related-policies">
              <h3 className="safe-related-title">Related Policies</h3>
              <div className="safe-policies-grid">
                <a href="/terms" className="safe-policy-link">
                  <FileText size={18} />
                  <div>
                    <h4>Terms of Service</h4>
                    <p>Legal terms governing use of SafeSign</p>
                  </div>
                  <ExternalLink size={14} />
                </a>
                <a href="/cookies" className="safe-policy-link">
                  <FileText size={18} />
                  <div>
                    <h4>Cookie Policy</h4>
                    <p>How we use cookies and similar technologies</p>
                  </div>
                  <ExternalLink size={14} />
                </a>
                <a href="/dpa" className="safe-policy-link">
                  <FileText size={18} />
                  <div>
                    <h4>Data Processing Addendum</h4>
                    <p>Additional terms for business customers</p>
                  </div>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        /* Base Styles */
        .safe-policy-page {
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
        }

        .safe-policy-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Hero Section */
        .safe-policy-hero {
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
          padding: 4rem 0;
          position: relative;
        }

        .safe-hero-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .safe-hero-badge {
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

        .safe-hero-title {
          font-size: 3rem;
          font-weight: 700;
          color: white;
          margin: 0 0 1rem;
          line-height: 1.2;
        }

        .safe-hero-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 auto 2rem;
          max-width: 600px;
          line-height: 1.6;
        }

        .safe-hero-meta {
          display: flex;
          gap: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .safe-meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
        }

        /* Navigation */
        .safe-policy-navigation {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .safe-navigation-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .safe-search-section {
          flex: 1;
          min-width: 250px;
          position: relative;
        }

        .safe-search-section svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .safe-search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          background: white;
          outline: none;
          transition: all 0.2s;
        }

        .safe-search-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .safe-quick-links {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .safe-quick-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          color: #4b5563;
          text-decoration: none;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .safe-quick-link:hover {
          background: #e5e7eb;
          color: #0d9488;
        }

        /* Main Content */
        .safe-policy-main {
          padding: 3rem 0;
        }

        /* Summary Box */
        .safe-summary-box {
          background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
          border: 1px solid #d1fae5;
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 3rem;
        }

        .safe-summary-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          color: #0d9488;
        }

        .safe-summary-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-summary-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-summary-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .safe-summary-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d9488;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .safe-summary-text h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-summary-text p {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        /* Policy Sections */
        .safe-sections-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .safe-policy-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
        }

        .safe-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
        }

        .safe-section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .safe-section-number {
          color: #0d9488;
          font-weight: 800;
        }

        .safe-expand-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: white;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-expand-btn:hover {
          border-color: #0d9488;
          color: #0d9488;
        }

        .safe-expand-arrow {
          transition: transform 0.2s;
        }

        .safe-arrow-expanded {
          transform: rotate(180deg);
        }

        .safe-section-content {
          padding: 1.5rem;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .safe-content-expanded {
          max-height: 5000px;
        }

        .safe-section-text {
          font-size: 0.9375rem;
          color: #4b5563;
          line-height: 1.7;
          margin: 0 0 1.5rem;
        }

        .safe-sub-sections {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .safe-sub-section {
          padding-left: 1.5rem;
          border-left: 3px solid #d1fae5;
        }

        .safe-sub-section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.75rem;
        }

        .safe-sub-section-text {
          font-size: 0.875rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0;
        }

        /* Actions */
        .safe-policy-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .safe-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .safe-btn-primary {
          background: #0d9488;
          color: white;
        }

        .safe-btn-primary:hover {
          background: #0f766e;
          transform: translateY(-2px);
        }

        .safe-btn-secondary {
          background: #f3f4f6;
          color: #4b5563;
        }

        .safe-btn-secondary:hover {
          background: #e5e7eb;
          color: #0d9488;
        }

        /* Related Policies */
        .safe-related-policies {
          background: #f9fafb;
          border-radius: 1rem;
          padding: 2rem;
        }

        .safe-related-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1.5rem;
        }

        .safe-policies-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        @media (max-width: 1024px) {
          .safe-policies-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .safe-policies-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-policy-link {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          color: #4b5563;
          text-decoration: none;
          transition: all 0.2s;
        }

        .safe-policy-link:hover {
          border-color: #0d9488;
          color: #0d9488;
          transform: translateY(-2px);
        }

        .safe-policy-link svg:first-child {
          color: #0d9488;
          margin-top: 0.25rem;
        }

        .safe-policy-link div {
          flex: 1;
        }

        .safe-policy-link h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
        }

        .safe-policy-link p {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .safe-policy-link svg:last-child {
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .safe-hero-title {
            font-size: 2.25rem;
          }
          
          .safe-navigation-content {
            flex-direction: column;
            align-items: stretch;
          }
          
          .safe-quick-links {
            justify-content: center;
          }
          
          .safe-section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .safe-expand-btn {
            align-self: flex-start;
          }
        }

        @media (max-width: 640px) {
          .safe-policy-container {
            padding: 0 1rem;
          }
          
          .safe-hero-title {
            font-size: 1.875rem;
          }
          
          .safe-policy-actions {
            flex-direction: column;
          }
          
          .safe-action-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default PrivacyPolicy;