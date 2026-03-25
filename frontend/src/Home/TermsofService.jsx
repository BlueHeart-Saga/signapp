import React, { useState } from 'react';
import {
  Scale,
  AlertCircle,
  FileText,
  Clock,
  DollarSign,
  Shield,
  Users,
  Zap,
  Globe,
  ChevronDown,
  Download,
  Printer,
  ExternalLink,
  Search,
  CheckCircle,
  XCircle,
  Book,
  Mail,
  Calendar,
  Gavel,
  Landmark,
  Briefcase,
  Key,
  Lock
} from 'lucide-react';

const TermsOfService = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated] = useState('January 15, 2025');

  const sections = [
    {
      id: 'agreement',
      title: 'Agreement to Terms',
      icon: <Book size={18} />,
      content: `By accessing or using SafeSign's electronic signature platform and related services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not access our Services.

These Terms constitute a legally binding agreement between you ("User") and SafeSign Inc. ("Company"). If you are using our Services on behalf of an organization, you represent that you have authority to bind that organization to these Terms.`,
      subSections: []
    },
    {
      id: 'eligibility',
      title: 'Eligibility & Registration',
      icon: <Key size={18} />,
      content: `To use our Services, you must:`,
      subSections: [
        {
          title: 'Age Requirement',
          content: `Be at least 18 years old or the age of majority in your jurisdiction, whichever is higher.`
        },
        {
          title: 'Account Creation',
          content: `Provide accurate, current, and complete information during registration and maintain the accuracy of such information.`
        },
        {
          title: 'Account Security',
          content: `Maintain the security of your account credentials and promptly notify us of any unauthorized access or security breach.`
        },
        {
          title: 'Prohibited Users',
          content: `You may not use our Services if you are prohibited from receiving services under applicable laws.`
        }
      ]
    },
    {
      id: 'services',
      title: 'Services Description',
      icon: <Zap size={18} />,
      content: `SafeSign provides electronic signature and document management services that enable users to:`,
      subSections: [
        {
          title: 'Core Features',
          content: `- Create, send, and sign documents electronically
- Manage document workflows and approvals
- Store and organize signed documents
- Generate audit trails and certificates`
        },
        {
          title: 'Additional Services',
          content: `- API access for integration with third-party systems
- Team collaboration and user management
- Advanced security features
- Compliance reporting and analytics`
        },
        {
          title: 'Service Limitations',
          content: `- Maximum document size: 100MB per file
- Supported formats: PDF, DOC, DOCX, PPT, XLS, and image files
- Storage limits based on subscription tier
- Geographic availability subject to local laws`
        }
      ]
    },
    {
      id: 'subscriptions',
      title: 'Subscriptions & Payments',
      icon: <DollarSign size={18} />,
      content: `Our Services are offered under various subscription plans:`,
      subSections: [
        {
          title: 'Free Plan',
          content: `Includes basic features with limited usage. No payment required.`
        },
        {
          title: 'Paid Plans',
          content: `Available on monthly or annual billing cycles. Fees are non-refundable except as required by law.`
        },
        {
          title: 'Payment Terms',
          content: `Payments are due in advance. We use third-party payment processors and do not store complete payment card information.`
        },
        {
          title: 'Price Changes',
          content: `We may change subscription fees with 30 days notice. Current subscribers will be notified before changes take effect.`
        },
        {
          title: 'Taxes',
          content: `All fees are exclusive of taxes, which are your responsibility unless we are required to collect them.`
        }
      ]
    },
    {
      id: 'user-content',
      title: 'User Content & Responsibilities',
      icon: <Users size={18} />,
      content: `You retain all rights to content you upload to our Services:`,
      subSections: [
        {
          title: 'Your Content',
          content: `You are solely responsible for content you upload, including its legality, reliability, and appropriateness.`
        },
        {
          title: 'License Grant',
          content: `You grant us a worldwide, non-exclusive license to process, store, and transmit your content solely to provide the Services.`
        },
        {
          title: 'Prohibited Content',
          content: `You may not upload content that is illegal, infringing, malicious, or violates third-party rights.`
        },
        {
          title: 'Content Review',
          content: `We may remove content that violates these Terms, but we have no obligation to monitor or review user content.`
        }
      ]
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      icon: <Briefcase size={18} />,
      content: `All intellectual property rights are protected as follows:`,
      subSections: [
        {
          title: 'Our Property',
          content: `SafeSign trademarks, logos, software, and platform are owned by us and protected by intellectual property laws.`
        },
        {
          title: 'Your Property',
          content: `Your documents and content remain your property. We claim no ownership rights over your content.`
        },
        {
          title: 'License to Use',
          content: `We grant you a limited, non-exclusive, non-transferable license to use our Services as permitted by these Terms.`
        },
        {
          title: 'Restrictions',
          content: `You may not copy, modify, reverse engineer, or create derivative works from our Services without explicit permission.`
        }
      ]
    },
    {
      id: 'termination',
      title: 'Term & Termination',
      icon: <XCircle size={18} />,
      content: `These Terms remain in effect while you use our Services:`,
      subSections: [
        {
          title: 'Termination by You',
          content: `You may terminate your account at any time through your account settings or by contacting support.`
        },
        {
          title: 'Termination by Us',
          content: `We may suspend or terminate your access to Services for violations of these Terms or applicable laws.`
        },
        {
          title: 'Effect of Termination',
          content: `Upon termination, your right to use Services ceases immediately. We may delete your data according to our data retention policy.`
        },
        {
          title: 'Survival',
          content: `Provisions that should survive termination will remain in effect, including intellectual property, warranties, and limitations of liability.`
        }
      ]
    },
    {
      id: 'warranties',
      title: 'Warranties & Disclaimers',
      icon: <AlertCircle size={18} />,
      content: `Our Services are provided "as is" and "as available":`,
      subSections: [
        {
          title: 'No Warranty',
          content: `We disclaim all warranties, express or implied, including merchantability, fitness for purpose, and non-infringement.`
        },
        {
          title: 'Availability',
          content: `We do not guarantee uninterrupted, timely, secure, or error-free operation of our Services.`
        },
        {
          title: 'Content Accuracy',
          content: `We are not responsible for verifying the accuracy, completeness, or legality of content processed through our Services.`
        },
        {
          title: 'Legal Compliance',
          content: `You are responsible for ensuring your use of our Services complies with applicable laws in your jurisdiction.`
        }
      ]
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      icon: <Shield size={18} />,
      content: `To the maximum extent permitted by law:`,
      subSections: [
        {
          title: 'Exclusion',
          content: `We are not liable for any indirect, incidental, special, consequential, or punitive damages.`
        },
        {
          title: 'Cap on Liability',
          content: `Our total liability for any claims under these Terms shall not exceed the amount you paid us in the 12 months preceding the claim.`
        },
        {
          title: 'Essential Basis',
          content: `These limitations are fundamental elements of the basis of the bargain between you and SafeSign.`
        },
        {
          title: 'Exceptions',
          content: `Some jurisdictions do not allow limitations of liability, so these limitations may not apply to you.`
        }
      ]
    },
    {
      id: 'indemnification',
      title: 'Indemnification',
      icon: <Landmark size={18} />,
      content: `You agree to indemnify, defend, and hold harmless SafeSign and its affiliates from any claims, damages, or expenses arising from:`,
      subSections: [
        {
          title: 'Your Content',
          content: `Claims related to content you upload or process through our Services.`
        },
        {
          title: 'Your Conduct',
          content: `Your violation of these Terms or applicable laws.`
        },
        {
          title: 'Third-Party Claims',
          content: `Claims by third parties related to your use of our Services.`
        },
        {
          title: 'Our Rights',
          content: `We reserve the right to assume exclusive defense and control of any matter subject to indemnification.`
        }
      ]
    },
    {
      id: 'governing-law',
      title: 'Governing Law & Disputes',
      icon: <Gavel size={18} />,
      content: `These Terms are governed by and construed in accordance with:`,
      subSections: [
        {
          title: 'Governing Law',
          content: `The laws of the State of California, without regard to its conflict of laws principles.`
        },
        {
          title: 'Jurisdiction',
          content: `Any disputes shall be resolved in the state or federal courts located in San Francisco County, California.`
        },
        {
          title: 'Arbitration',
          content: `For individual consumers, disputes may be resolved through binding arbitration, with the option for small claims court.`
        },
        {
          title: 'Class Action Waiver',
          content: `You waive any right to participate in class actions or class arbitrations.`
        }
      ]
    },
    {
      id: 'modifications',
      title: 'Modifications to Terms',
      icon: <FileText size={18} />,
      content: `We may modify these Terms at any time:`,
      subSections: [
        {
          title: 'Notification',
          content: `We will notify you of material changes by email or through our Services at least 30 days before they take effect.`
        },
        {
          title: 'Acceptance',
          content: `Continued use of our Services after changes constitutes acceptance of the modified Terms.`
        },
        {
          title: 'Review',
          content: `We encourage you to periodically review these Terms for updates.`
        },
        {
          title: 'Archives',
          content: `Previous versions of these Terms are available upon request.`
        }
      ]
    },
    {
      id: 'miscellaneous',
      title: 'Miscellaneous Provisions',
      icon: <AlertCircle size={18} />,
      content: `Additional legal provisions:`,
      subSections: [
        {
          title: 'Entire Agreement',
          content: `These Terms constitute the entire agreement between you and SafeSign regarding our Services.`
        },
        {
          title: 'Severability',
          content: `If any provision is found unenforceable, the remaining provisions remain in full effect.`
        },
        {
          title: 'Waiver',
          content: `Our failure to enforce any right or provision shall not constitute a waiver of such right or provision.`
        },
        {
          title: 'Assignment',
          content: `You may not assign these Terms without our prior written consent. We may assign these Terms without restriction.`
        },
        {
          title: 'Force Majeure',
          content: `We are not liable for delays or failures caused by events beyond our reasonable control.`
        }
      ]
    },
    {
      id: 'contact',
      title: 'Contact Information',
      icon: <Mail size={18} />,
      content: `For questions about these Terms, please contact us:

SafeSign Legal Department
Email: legal@safesign.com
Address: 123 Security Lane, San Francisco, CA 94107, USA
Phone: +1 (800) 123-4567

For legal notices, please use the above address or email legal@safesign.com.`
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

  const legalHighlights = [
    {
      icon: <Scale size={20} />,
      title: 'Binding Agreement',
      description: 'Legally enforceable terms for all users'
    },
    {
      icon: <Lock size={20} />,
      title: 'User Responsibilities',
      description: 'Clear guidelines for content and conduct'
    },
    {
      icon: <DollarSign size={20} />,
      title: 'Payment Terms',
      description: 'Transparent subscription and billing'
    },
    {
      icon: <Briefcase size={20} />,
      title: 'IP Protection',
      description: 'Your content stays yours'
    }
  ];

  return (
    <div className="safe-policy-page">
      {/* Hero Section */}
      <section className="safe-policy-hero">
        <div className="safe-policy-container">
          <div className="safe-hero-content">
            <div className="safe-hero-badge">
              <Scale size={20} />
              <span>Legal Terms</span>
            </div>
            <h1 className="safe-hero-title">Terms of Service</h1>
            <p className="safe-hero-subtitle">
              Legal agreement governing your use of SafeSign services and platform
            </p>
            
            <div className="safe-hero-meta">
              <div className="safe-meta-item">
                <Calendar size={16} />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className="safe-meta-item">
                <FileText size={16} />
                <span>Version: 4.1</span>
              </div>
              <div className="safe-meta-item">
                <Clock size={16} />
                <span>Effective: January 15, 2025</span>
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
                placeholder="Search terms of service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="safe-search-input"
              />
            </div>
            
            <div className="safe-quick-links">
              <a href="#agreement" className="safe-quick-link">
                <Book size={14} />
                Agreement
              </a>
              <a href="#subscriptions" className="safe-quick-link">
                <DollarSign size={14} />
                Payments
              </a>
              <a href="#liability" className="safe-quick-link">
                <Shield size={14} />
                Liability
              </a>
              <a href="#contact" className="safe-quick-link">
                <Mail size={14} />
                Contact
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="safe-policy-main">
        <div className="safe-policy-container">
          <div className="safe-policy-content">
            {/* Legal Highlights */}
            <div className="safe-summary-box">
              <div className="safe-summary-header">
                <Scale size={24} />
                <h2 className="safe-summary-title">Key Legal Points</h2>
              </div>
              <div className="safe-summary-grid">
                {legalHighlights.map((highlight, index) => (
                  <div key={index} className="safe-summary-item">
                    <div className="safe-summary-icon" style={{ background: '#f0fdfa' }}>
                      {highlight.icon}
                    </div>
                    <div className="safe-summary-text">
                      <h4>{highlight.title}</h4>
                      <p>{highlight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Notice */}
            <div className="safe-notice-box">
              <div className="safe-notice-content">
                <AlertCircle size={24} />
                <div>
                  <h3 className="safe-notice-title">Important Notice</h3>
                  <p className="safe-notice-text">
                    These Terms constitute a legally binding agreement. By using SafeSign services, you agree to be bound by these Terms. Please read them carefully.
                  </p>
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
                  <div 
                    className="safe-section-header"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="safe-section-title-wrapper">
                      <span className="safe-section-icon">{section.icon}</span>
                      <h2 className="safe-section-title">
                        <span className="safe-section-number">{index + 1}.</span>
                        {section.title}
                      </h2>
                    </div>
                    <button 
                      className="safe-expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(section.id);
                      }}
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

            {/* Acceptance Section */}
            <div className="safe-acceptance-section">
              <div className="safe-acceptance-content">
                <div className="safe-acceptance-header">
                  <CheckCircle size={32} />
                  <h2 className="safe-acceptance-title">Acceptance of Terms</h2>
                </div>
                <div className="safe-acceptance-grid">
                  <div className="safe-acceptance-item">
                    <div className="safe-acceptance-icon">
                      <CheckCircle size={24} className="safe-icon-accept" />
                    </div>
                    <div className="safe-acceptance-text">
                      <h3>By Registration</h3>
                      <p>Creating an account constitutes acceptance of these Terms</p>
                    </div>
                  </div>
                  <div className="safe-acceptance-item">
                    <div className="safe-acceptance-icon">
                      <CheckCircle size={24} className="safe-icon-accept" />
                    </div>
                    <div className="safe-acceptance-text">
                      <h3>By Use</h3>
                      <p>Accessing or using our Services indicates agreement to these Terms</p>
                    </div>
                  </div>
                  <div className="safe-acceptance-item">
                    <div className="safe-acceptance-icon">
                      <XCircle size={24} className="safe-icon-reject" />
                    </div>
                    <div className="safe-acceptance-text">
                      <h3>If You Disagree</h3>
                      <p>Do not register for or use our Services</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="safe-policy-actions">
              <button className="safe-action-btn safe-btn-primary">
                <Download size={18} />
                Download PDF
              </button>
              <button className="safe-action-btn safe-btn-secondary">
                <Printer size={18} />
                Print Terms
              </button>
              <a href="/contact" className="safe-action-btn safe-btn-secondary">
                <Mail size={18} />
                Contact Legal Team
              </a>
            </div>

            {/* Related Policies */}
            <div className="safe-related-policies">
              <h3 className="safe-related-title">Related Legal Documents</h3>
              <div className="safe-policies-grid">
                <a href="/privacy" className="safe-policy-link">
                  <FileText size={18} />
                  <div>
                    <h4>Privacy Policy</h4>
                    <p>How we collect, use, and protect your data</p>
                  </div>
                  <ExternalLink size={14} />
                </a>
                <a href="/cookies" className="safe-policy-link">
                  <FileText size={18} />
                  <div>
                    <h4>Cookie Policy</h4>
                    <p>Our use of cookies and tracking technologies</p>
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
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
          gap: 0.75rem;
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
          background: #0d9488;
          color: white;
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
          margin-bottom: 2rem;
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

        /* Notice Box */
        .safe-notice-box {
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .safe-notice-content {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          color: #92400e;
        }

        .safe-notice-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }

        .safe-notice-text {
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0;
        }

        /* Policy Sections */
        .safe-sections-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .safe-policy-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .safe-policy-section:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .safe-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: #f9fafb;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .safe-section-header:hover {
          background: #f3f4f6;
        }

        .safe-section-title-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .safe-section-icon {
          color: #0d9488;
          display: flex;
          align-items: center;
        }

        .safe-section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .safe-section-number {
          color: #0d9488;
          font-weight: 700;
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
          white-space: nowrap;
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
          padding: 0 1.5rem;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .safe-content-expanded {
          max-height: 5000px;
          padding: 1.5rem;
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

        /* Acceptance Section */
        .safe-acceptance-section {
          background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
          border: 1px solid #d1fae5;
          border-radius: 1rem;
          padding: 2rem;
          margin: 3rem 0;
        }

        .safe-acceptance-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          color: #0d9488;
        }

        .safe-acceptance-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-acceptance-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-acceptance-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-acceptance-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 0.75rem;
        }

        .safe-acceptance-icon {
          flex-shrink: 0;
        }

        .safe-icon-accept {
          color: #10b981;
        }

        .safe-icon-reject {
          color: #ef4444;
        }

        .safe-acceptance-text h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-acceptance-text p {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
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
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
        }

        .safe-btn-secondary {
          background: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
        }

        .safe-btn-secondary:hover {
          background: #e5e7eb;
          color: #0d9488;
          border-color: #0d9488;
          transform: translateY(-2px);
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
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
          
          .safe-section-title-wrapper {
            width: 100%;
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
          
          .safe-hero-meta {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TermsOfService;