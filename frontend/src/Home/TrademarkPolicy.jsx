import React, { useState } from 'react';
import { 
  Shield, FileText, ChevronDown, 
  Mail, Search, Globe, Tag,
  CheckCircle, XCircle, AlertCircle,
  ExternalLink, Download, Printer,
  BookOpen, Scale, Users, Lock,
  Star, Award, Copyright,
  FileWarning, ShieldCheck, FileSearch,
  MessageSquare, Eye, Copy, Link,
  Hash, AtSign, Key, Network,
  TrendingUp, Zap, ShieldAlert
} from 'lucide-react';
import { setPageTitle } from "../utils/pageTitle";
import { useEffect } from "react";
import { Badge } from "lucide-react";

const TrademarkPolicy = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated] = useState('January 15, 2025');

  const trademarks = [
    {
      type: 'Word Marks',
      icon: <FileText size={20} />,
      color: '#0d9488',
      examples: ['SafeSign', 'SafeSign Pro', 'SafeSign Business'],
      description: 'Registered names and product identifiers'
    },
    {
      type: 'Logo Marks',
      icon: <Badge size={20} />,
      color: '#3b82f6',
      examples: ['SafeSign Logo', 'Icon variations', 'Brand symbols'],
      description: 'Visual brand identifiers'
    },
    {
      type: 'Taglines & Slogans',
      icon: <Hash size={20} />,
      color: '#8b5cf6',
      examples: ['Sign with Confidence', 'Secure eSignatures', 'Digital Trust'],
      description: 'Marketing phrases and taglines'
    },
    {
      type: 'Design Elements',
      icon: <Star size={20} />,
      color: '#10b981',
      examples: ['Color schemes', 'Typography', 'Visual patterns'],
      description: 'Distinctive brand design features'
    }
  ];

  const permittedUses = [
    {
      scenario: 'Service Reference',
      icon: <CheckCircle size={18} />,
      color: '#10b981',
      description: 'Accurately describing SafeSign services you use',
      examples: ['"We use SafeSign for document signing"', '"Powered by SafeSign"'],
      requirements: ['Truthful representation', 'Clear attribution']
    },
    {
      scenario: 'Media & Press',
      icon: <FileText size={18} />,
      color: '#3b82f6',
      description: 'Journalistic or media coverage referencing SafeSign',
      examples: ['News articles', 'Blog posts', 'Reviews'],
      requirements: ['Factual context', 'No endorsement implication']
    },
    {
      scenario: 'Integration Partners',
      icon: <Link size={18} />,
      color: '#0d9488',
      description: 'Partners showcasing integration with SafeSign',
      examples: ['Integration documentation', 'Partner marketing'],
      requirements: ['Written permission', 'Brand guidelines']
    }
  ];

  const prohibitedUses = [
    {
      type: 'False Association',
      icon: <XCircle size={18} />,
      color: '#ef4444',
      examples: ['Implying endorsement', 'Fake partnerships', 'Unauthorized sponsorship'],
      risk: 'Legal action and account termination'
    },
    {
      type: 'Brand Modification',
      icon: <AlertCircle size={18} />,
      color: '#f59e0b',
      examples: ['Altering logos', 'Changing colors', 'Distorting design'],
      risk: 'Cease and desist notice'
    },
    {
      type: 'Domain Squatting',
      icon: <Globe size={18} />,
      color: '#8b5cf6',
      examples: ['Similar domain names', 'Typosquatting', 'Parked domains'],
      risk: 'Domain seizure and legal action'
    },
    {
      type: 'Misleading Marketing',
      icon: <FileWarning size={18} />,
      color: '#dc2626',
      examples: ['Misleading ads', 'SEO manipulation', 'False claims'],
      risk: 'Legal penalties and damages'
    }
  ];

  const sections = [
    {
      id: 'introduction',
      title: 'Trademark Policy Overview',
      content: `This Trademark Policy governs the use of SafeSign trademarks, logos, service marks, and branding elements ("Trademarks") owned by DevOpsTrio. By using or referencing SafeSign Trademarks, you agree to comply with this policy.`,
      subSections: [
        {
          title: 'Purpose',
          content: `Protect SafeSign brand identity and prevent consumer confusion while allowing legitimate references to our services.`
        },
        {
          title: 'Scope',
          content: `Applies globally to all uses of SafeSign Trademarks in any medium, digital or physical.`
        }
      ],
      icon: <BookOpen size={20} />
    },
    {
      id: 'trademarks',
      title: 'SafeSign Trademarks',
      content: `SafeSign Trademarks include all brand identifiers that distinguish our products and services in the marketplace. These marks are valuable business assets protected by law.`,
      icon: <Tag size={20} />
    },
    {
      id: 'permitted-use',
      title: 'Permitted Use',
      content: `You may use SafeSign Trademarks under specific conditions that do not mislead consumers or dilute our brand value.`,
      subSections: [
        {
          title: 'General Guidelines',
          content: `- Always use trademarks as adjectives, not nouns or verbs
- Include proper trademark symbols (™ or ®) on first reference
- Maintain proper capitalization (SafeSign, not Safesign or safeSign)
- Do not combine our marks with your own branding`
        },
        {
          title: 'Attribution',
          content: `When referencing SafeSign, include appropriate attribution such as "SafeSign is a trademark of DevOpsTrio."`
        }
      ],
      icon: <CheckCircle size={20} />
    },
    {
      id: 'prohibited-use',
      title: 'Prohibited Use',
      content: `Certain uses of SafeSign Trademarks are strictly prohibited to protect brand integrity and prevent consumer confusion.`,
      subSections: [
        {
          title: 'Strict Prohibitions',
          content: `- Never use SafeSign marks as part of your company name
- Do not register domain names containing SafeSign
- Avoid creating composite marks with SafeSign
- Never imply endorsement or partnership without authorization`
        }
      ],
      icon: <XCircle size={20} />
    },
    {
      id: 'online-use',
      title: 'Online & Digital Use',
      content: `Special considerations apply to digital platforms, websites, social media, and online marketing.`,
      subSections: [
        {
          title: 'Domain Names',
          content: `Do not register or use domain names containing "SafeSign" or confusingly similar variations.`
        },
        {
          title: 'Social Media',
          content: `Do not use SafeSign marks in usernames, handles, or profile names without permission.`
        },
        {
          title: 'Advertising',
          content: `Do not use SafeSign Trademarks in paid advertisements, SEO keywords, or online marketing in a misleading manner.`
        }
      ],
      icon: <Globe size={20} />
    },
    {
      id: 'reporting',
      title: 'Reporting Misuse',
      content: `We rely on community reports to identify and address trademark misuse. All reports are taken seriously and investigated promptly.`,
      subSections: [
        {
          title: 'How to Report',
          content: `Submit detailed reports to trademark@safesign.devopstrio.co.uk with supporting evidence and context.`
        },
        {
          title: 'Required Information',
          content: `- Description of alleged misuse
- URLs or screenshots
- Your contact information
- Any supporting documentation`
        }
      ],
      icon: <ShieldAlert size={20} />
    },
    {
      id: 'enforcement',
      title: 'Enforcement Actions',
      content: `SafeSign takes trademark protection seriously and will take appropriate action against violations.`,
      subSections: [
        {
          title: 'Response Actions',
          content: `- Formal cease and desist notices
- Platform takedown requests (DMCA, etc.)
- Account suspension or termination
- Legal proceedings when necessary`
        },
        {
          title: 'Good Faith Users',
          content: `We work cooperatively with users who make good-faith errors, providing guidance and reasonable time for compliance.`
        }
      ],
      icon: <Scale size={20} />
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="safe-policy-page">
      {/* Hero Section */}
      <section className="safe-policy-hero safe-hero-trademark">
        <div className="safe-policy-container">
          <div className="safe-hero-content">
            <div className="safe-hero-badge">
              <ShieldCheck size={20} />
              <span>Brand Protection Policy</span>
            </div>
            <h1 className="safe-hero-title">Trademark Policy</h1>
            <p className="safe-hero-subtitle">
              Guidelines for proper use of SafeSign trademarks, logos, and branding to protect our brand identity and prevent consumer confusion
            </p>
            
            <div className="safe-hero-meta">
              <div className="safe-meta-item">
                <FileText size={16} />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className="safe-meta-item">
                <Copyright size={16} />
                <span>Registered Trademarks</span>
              </div>
              <div className="safe-meta-item">
                <Shield size={16} />
                <span>Version: 2.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trademarks Overview */}
      <section className="safe-trademarks-overview">
        <div className="safe-policy-container">
          <div className="safe-section-header">
            <h2 className="safe-section-title">
              <Tag size={24} />
              SafeSign Trademarks
            </h2>
            <p className="safe-section-subtitle">
              Protected brand identifiers owned exclusively by DevOpsTrio
            </p>
          </div>

          <div className="safe-trademarks-grid">
            {trademarks.map((tm, index) => (
              <div key={index} className="safe-trademark-card">
                <div className="safe-trademark-header">
                  <div 
                    className="safe-trademark-icon"
                    style={{ backgroundColor: tm.color + '15', color: tm.color }}
                  >
                    {tm.icon}
                  </div>
                  <h3 className="safe-trademark-type">{tm.type}</h3>
                  <p className="safe-trademark-description">{tm.description}</p>
                </div>
                <div className="safe-trademark-examples">
                  <h4>Examples:</h4>
                  <div className="safe-examples-list">
                    {tm.examples.map((example, i) => (
                      <div key={i} className="safe-example-item">
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Permitted vs Prohibited */}
      <section className="safe-usage-guidelines">
        <div className="safe-policy-container">
          <div className="safe-guidelines-grid">
            {/* Permitted Uses */}
            <div className="safe-guidelines-column">
              <div className="safe-column-header safe-column-permitted">
                <CheckCircle size={24} />
                <h3>Permitted Uses</h3>
                <p>Allowed trademark uses with proper attribution</p>
              </div>
              <div className="safe-uses-list">
                {permittedUses.map((use, index) => (
                  <div key={index} className="safe-use-card">
                    <div className="safe-use-header">
                      <div className="safe-use-icon" style={{ color: use.color }}>
                        {use.icon}
                      </div>
                      <h4>{use.scenario}</h4>
                    </div>
                    <p className="safe-use-description">{use.description}</p>
                    <div className="safe-use-examples">
                      {use.examples.map((example, i) => (
                        <div key={i} className="safe-use-example">
                          <span>{example}</span>
                        </div>
                      ))}
                    </div>
                    <div className="safe-use-requirements">
                      <h5>Requirements:</h5>
                      <ul>
                        {use.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prohibited Uses */}
            <div className="safe-guidelines-column">
              <div className="safe-column-header safe-column-prohibited">
                <XCircle size={24} />
                <h3>Prohibited Uses</h3>
                <p>Strictly forbidden trademark uses</p>
              </div>
              <div className="safe-uses-list">
                {prohibitedUses.map((prohibit, index) => (
                  <div key={index} className="safe-use-card">
                    <div className="safe-use-header">
                      <div className="safe-use-icon" style={{ color: prohibit.color }}>
                        {prohibit.icon}
                      </div>
                      <h4>{prohibit.type}</h4>
                    </div>
                    <div className="safe-prohibited-examples">
                      {prohibit.examples.map((example, i) => (
                        <div key={i} className="safe-prohibited-example">
                          <XCircle size={14} />
                          <span>{example}</span>
                        </div>
                      ))}
                    </div>
                    <div className="safe-prohibited-risk">
                      <AlertCircle size={14} />
                      <span>Risk: {prohibit.risk}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Navigation */}
      <section className="safe-policy-navigation">
        <div className="safe-policy-container">
          <div className="safe-navigation-card">
            <div className="safe-search-section">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search trademark policy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="safe-search-input"
              />
            </div>
            
            <div className="safe-quick-links">
              {sections.map(section => (
                <a 
                  key={section.id} 
                  href={`#${section.id}`} 
                  className="safe-quick-link"
                >
                  {section.icon}
                  <span>{section.title.split(' ')[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="safe-policy-main">
        <div className="safe-policy-container">
          <div className="safe-policy-content">
            {/* Policy Sections */}
            <div className="safe-sections-container">
              {sections.map((section, index) => (
                <div 
                  key={section.id} 
                  id={section.id}
                  className="safe-policy-section-card"
                >
                  <div className="safe-section-card-header">
                    <div className="safe-section-card-header-content">
                      <div className="safe-section-icon">
                        {section.icon}
                      </div>
                      <div>
                        <h2 className="safe-section-title">
                          {section.title}
                        </h2>
                        <div className="safe-section-badge">
                          <span className="safe-section-number">Section {index + 1}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="safe-expand-btn"
                      onClick={() => toggleSection(section.id)}
                    >
                      {expandedSections[section.id] ? 'Collapse' : 'Expand'}
                      <ChevronDown className={`safe-expand-arrow ${expandedSections[section.id] ? 'safe-arrow-expanded' : ''}`} />
                    </button>
                  </div>
                  
                  <div className={`safe-section-card-content ${expandedSections[section.id] ? 'safe-content-expanded' : ''}`}>
                    <div className="safe-section-card-body">
                      <p className="safe-section-intro">{section.content}</p>
                      
                      {section.subSections && section.subSections.length > 0 && (
                        <div className="safe-sub-sections-grid">
                          {section.subSections.map((subSection, subIndex) => (
                            <div key={subIndex} className="safe-sub-section-card">
                              <h3 className="safe-sub-section-title">{subSection.title}</h3>
                              <div className="safe-sub-section-content">
                                {subSection.content.split('\n').map((line, i) => (
                                  <p key={i} className="safe-sub-section-text">{line}</p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Brand Guidelines Card */}
            <div className="safe-brand-guidelines-card">
              <div className="safe-brand-guidelines-header">
                <FileText size={24} />
                <div>
                  <h3>Complete Brand Guidelines</h3>
                  <p>Detailed specifications for proper trademark usage</p>
                </div>
              </div>
              <div className="safe-brand-guidelines-content">
                <div className="safe-guidelines-downloads">
                  <a href="/brand-guidelines.pdf" className="safe-download-item">
                    <Download size={20} />
                    <div>
                      <h4>Brand Guidelines PDF</h4>
                      <p>Complete visual identity manual</p>
                    </div>
                  </a>
                  <a href="/logo-assets.zip" className="safe-download-item">
                    <Download size={20} />
                    <div>
                      <h4>Logo Assets Package</h4>
                      <p>Official logos in all formats</p>
                    </div>
                  </a>
                  <a href="/color-palette" className="safe-download-item">
                    <Download size={20} />
                    <div>
                      <h4>Color Palette</h4>
                      <p>Official brand colors and usage</p>
                    </div>
                  </a>
                </div>
                <div className="safe-guidelines-contact">
                  <h4>Request Permission:</h4>
                  <div className="safe-contact-methods">
                    <a href="mailto:trademark@safesign.devopstrio.co.uk" className="safe-contact-method">
                      <Mail size={18} />
                      <span>trademark@safesign.devopstrio.co.uk</span>
                    </a>
                    <a href="mailto:legal@safesign.devopstrio.co.uk" className="safe-contact-method">
                      <Mail size={18} />
                      <span>legal@safesign.devopstrio.co.uk</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Third-Party Notice */}
            <div className="safe-third-party-notice">
              <div className="safe-notice-header">
                <AlertCircle size={24} />
                <h3>Third-Party Trademarks</h3>
              </div>
              <div className="safe-notice-content">
                <p>
                  Any third-party trademarks, service marks, logos, and brand names referenced on SafeSign platforms are the property of their respective owners. Reference to third-party trademarks does not constitute endorsement, sponsorship, or recommendation by SafeSign.
                </p>
                <div className="safe-notice-examples">
                  <h4>Examples:</h4>
                  <ul>
                    <li>Partner company logos used in integration documentation</li>
                    <li>Technology trademarks (e.g., AWS, Google Cloud)</li>
                    <li>Industry standard certifications and marks</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Related Policies */}
            <div className="safe-related-policies-card">
              <div className="safe-related-policies-header">
                <h3>Related Legal Documents</h3>
                <p>Complete legal and compliance framework</p>
              </div>
              
              <div className="safe-policies-grid">
                <a href="/terms" className="safe-policy-card">
                  <div className="safe-policy-card-header">
                    <FileText size={24} />
                    <div>
                      <h4>Terms of Service</h4>
                      <p>Updated: January 15, 2025</p>
                    </div>
                  </div>
                  <p className="safe-policy-card-description">
                    Complete terms governing use of SafeSign services.
                  </p>
                  <div className="safe-policy-card-footer">
                    <ExternalLink size={16} />
                    <span>Read Terms</span>
                  </div>
                </a>
                
                <a href="/privacy" className="safe-policy-card">
                  <div className="safe-policy-card-header">
                    <FileText size={24} />
                    <div>
                      <h4>Privacy Policy</h4>
                      <p>Updated: January 15, 2025</p>
                    </div>
                  </div>
                  <p className="safe-policy-card-description">
                    How we collect, use, and protect your personal information.
                  </p>
                  <div className="safe-policy-card-footer">
                    <ExternalLink size={16} />
                    <span>Read Policy</span>
                  </div>
                </a>
                
                <a href="/abuse" className="safe-policy-card">
                  <div className="safe-policy-card-header">
                    <FileText size={24} />
                    <div>
                      <h4>Abuse Policy</h4>
                      <p>Updated: January 15, 2025</p>
                    </div>
                  </div>
                  <p className="safe-policy-card-description">
                    Platform misuse prevention and enforcement framework.
                  </p>
                  <div className="safe-policy-card-footer">
                    <ExternalLink size={16} />
                    <span>Read Policy</span>
                  </div>
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Hero Section - Trademark Theme */
        .safe-hero-trademark {
          background: #0d9488;
        }

        .safe-policy-hero {
          padding: 5rem 0 4rem;
          text-align: center;
          color: white;
        }

        .safe-hero-content {
          max-width: 800px;
          margin: 0 auto;
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
          font-size: 3.5rem;
          font-weight: 800;
          margin: 0 0 1rem;
          line-height: 1.1;
        }

        .safe-hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 auto 2rem;
          max-width: 700px;
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

        /* Trademarks Overview */
        .safe-trademarks-overview {
          padding: 4rem 0;
          background: #f8fafc;
        }

        .safe-section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .safe-section-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 2.25rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .safe-section-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto;
        }

        .safe-trademarks-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-trademarks-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-trademark-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .safe-trademark-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
          border-color: #0d9488;
        }

        .safe-trademark-header {
          margin-bottom: 1.5rem;
        }

        .safe-trademark-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .safe-trademark-type {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-trademark-description {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .safe-trademark-examples h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin: 0 0 0.75rem;
        }

        .safe-examples-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-example-item {
          padding: 0.5rem 0.75rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #475569;
        }

        /* Usage Guidelines */
        .safe-usage-guidelines {
          padding: 4rem 0;
          background: white;
        }

        .safe-guidelines-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .safe-guidelines-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-guidelines-column {
          display: flex;
          flex-direction: column;
        }

        .safe-column-header {
          padding: 1.5rem;
          border-radius: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .safe-column-permitted {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
        }

        .safe-column-prohibited {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #991b1b;
        }

        .safe-column-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }

        .safe-column-header p {
          font-size: 0.875rem;
          margin: 0;
          opacity: 0.9;
        }

        .safe-uses-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }

        .safe-use-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .safe-use-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .safe-use-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .safe-use-header h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-use-description {
          font-size: 0.875rem;
          color: #475569;
          margin: 0 0 1rem;
          line-height: 1.5;
        }

        .safe-use-examples {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .safe-use-example {
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          color: #475569;
          font-style: italic;
        }

        .safe-use-requirements h5 {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          margin: 0 0 0.5rem;
        }

        .safe-use-requirements ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .safe-use-requirements li {
          font-size: 0.75rem;
          color: #475569;
          padding-left: 1rem;
          position: relative;
        }

        .safe-use-requirements li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }

        .safe-prohibited-examples {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .safe-prohibited-example {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #475569;
        }

        .safe-prohibited-example svg {
          color: #ef4444;
          flex-shrink: 0;
        }

        .safe-prohibited-risk {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .safe-prohibited-risk svg {
          flex-shrink: 0;
        }

        /* Navigation */
        .safe-policy-navigation {
          padding: 1.5rem 0;
          background: white;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .safe-navigation-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .safe-search-section {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .safe-search-section svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }

        .safe-search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          font-size: 0.875rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          background: white;
          outline: none;
          transition: all 0.2s;
        }

        .safe-search-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
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
          padding: 0.625rem 1rem;
          background: white;
          color: #475569;
          text-decoration: none;
          border-radius: 0.75rem;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .safe-quick-link:hover {
          border-color: #0d9488;
          color: #0d9488;
          background: rgba(139, 92, 246, 0.05);
        }

        /* Main Content */
        .safe-policy-main {
          padding: 3rem 0 5rem;
          background: #f8fafc;
        }

        /* Policy Sections */
        .safe-policy-section-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          margin-bottom: 1.5rem;
          overflow: hidden;
          transition: all 0.3s;
        }

        .safe-policy-section-card:hover {
          border-color: #0d9488;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }

        .safe-section-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
        }

        .safe-section-card-header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .safe-section-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d9488;
        }

        .safe-section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-section-badge {
          display: inline-flex;
        }

        .safe-section-number {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          background: #e2e8f0;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
        }

        .safe-expand-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-expand-btn:hover {
          border-color: #0d9488;
          color: #0d9488;
          background: rgba(139, 92, 246, 0.05);
        }

        .safe-expand-arrow {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .safe-arrow-expanded {
          transform: rotate(180deg);
        }

        .safe-section-card-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .safe-content-expanded {
          max-height: 5000px;
        }

        .safe-section-card-body {
          padding: 2rem;
        }

        .safe-section-intro {
          font-size: 1rem;
          color: #475569;
          line-height: 1.7;
          margin: 0 0 2rem;
        }

        .safe-sub-sections-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-sub-sections-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-sub-section-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .safe-sub-section-card:hover {
          border-color: #0d9488;
          background: rgba(139, 92, 246, 0.02);
        }

        .safe-sub-section-title {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.75rem;
        }

        .safe-sub-section-content {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.6;
        }

        .safe-sub-section-text {
          margin: 0 0 0.5rem;
        }

        .safe-sub-section-text:last-child {
          margin-bottom: 0;
        }

        /* Brand Guidelines Card */
        .safe-brand-guidelines-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2.5rem;
          margin: 3rem 0;
        }

        .safe-brand-guidelines-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .safe-brand-guidelines-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-brand-guidelines-header p {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .safe-brand-guidelines-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }

        @media (max-width: 768px) {
          .safe-brand-guidelines-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .safe-guidelines-downloads {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .safe-download-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }

        .safe-download-item:hover {
          border-color: #0d9488;
          background: rgba(139, 92, 246, 0.05);
        }

        .safe-download-item h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.125rem;
        }

        .safe-download-item p {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        .safe-guidelines-contact {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 0.75rem;
          padding: 1.5rem;
        }

        .safe-guidelines-contact h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem;
        }

        .safe-contact-methods {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .safe-contact-method {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #475569;
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.2s;
        }

        .safe-contact-method:hover {
          color: #0d9488;
        }

        /* Third-Party Notice */
        .safe-third-party-notice {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #fcd34d;
          border-radius: 1.5rem;
          padding: 2.5rem;
          margin-bottom: 3rem;
        }

        .safe-notice-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .safe-notice-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #92400e;
          margin: 0;
        }

        .safe-notice-content p {
          font-size: 0.9375rem;
          color: #92400e;
          line-height: 1.6;
          margin: 0 0 1.5rem;
        }

        .safe-notice-examples h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #92400e;
          margin: 0 0 0.75rem;
        }

        .safe-notice-examples ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-notice-examples li {
          font-size: 0.875rem;
          color: #92400e;
          padding-left: 1rem;
          position: relative;
        }

        .safe-notice-examples li:before {
          content: '•';
          position: absolute;
          left: 0;
          color: #92400e;
          font-weight: bold;
        }

        /* Related Policies */
        .safe-related-policies-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 2.5rem;
        }

        .safe-related-policies-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .safe-related-policies-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-related-policies-header p {
          font-size: 1rem;
          color: #64748b;
          margin: 0;
        }

        .safe-policies-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
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

        .safe-policy-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s;
          display: block;
        }

        .safe-policy-card:hover {
          border-color: #0d9488;
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
        }

        .safe-policy-card-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .safe-policy-card-header svg {
          color: #0d9488;
          margin-top: 0.25rem;
        }

        .safe-policy-card-header h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-policy-card-header p {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        .safe-policy-card-description {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.6;
          margin: 0 0 1.5rem;
        }

        .safe-policy-card-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0d9488;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .safe-policy-container {
            padding: 0 1rem;
          }
          
          .safe-hero-title {
            font-size: 2.5rem;
          }
          
          .safe-section-title {
            font-size: 1.75rem;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .safe-section-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .safe-expand-btn {
            align-self: flex-start;
          }
          
          .safe-brand-guidelines-card,
          .safe-third-party-notice,
          .safe-related-policies-card {
            padding: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .safe-hero-title {
            font-size: 2rem;
          }
          
          .safe-hero-meta {
            flex-direction: column;
            gap: 1rem;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default TrademarkPolicy;