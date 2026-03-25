import React, { useState } from 'react';
import {
  Cookie,
  Shield,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  Download,
  Printer,
  ExternalLink,
  Search,
  ChevronDown,
  Mail,
  Database,
  Globe,
  Users,
  AlertCircle,
  Lock,
  Trash2
} from 'lucide-react';

const CookiePolicy = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated] = useState('January 15, 2025');
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false
  });

  const sections = [
    {
      id: 'introduction',
      title: 'What Are Cookies?',
      icon: <Cookie size={18} />,
      content: `Cookies are small text files that are placed on your computer, smartphone, or other device when you visit our website. They help us recognize your device and remember information about your visit, such as your preferred language and other settings.

Cookies make your browsing experience better by allowing websites to remember your actions and preferences over time. They are widely used to make websites work more efficiently and provide useful information to website owners.`,
      subSections: []
    },
    {
      id: 'types',
      title: 'Types of Cookies We Use',
      icon: <Database size={18} />,
      content: `We use several types of cookies on the SafeSign platform:`,
      subSections: [
        {
          title: 'Essential Cookies',
          content: `These are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as logging in or filling in forms. Essential cookies do not store any personally identifiable information.

Examples: Session cookies for authentication, security cookies for fraud prevention.`
        },
        {
          title: 'Analytics Cookies',
          content: `These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are most and least popular and see how visitors move around the site.

Examples: Google Analytics cookies, performance monitoring cookies.`
        },
        {
          title: 'Functional Cookies',
          content: `These enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.

Examples: Language preference cookies, chat support cookies, font size preferences.`
        },
        {
          title: 'Marketing Cookies',
          content: `These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user and thereby more valuable for publishers and third-party advertisers.

Examples: Facebook pixel, LinkedIn Insight Tag, advertising network cookies.`
        }
      ]
    },
    {
      id: 'purpose',
      title: 'Purpose of Cookies',
      icon: <Settings size={18} />,
      content: `We use cookies for the following purposes:`,
      subSections: [
        {
          title: 'Authentication',
          content: `To recognize you when you visit our website and maintain your signed-in status across different pages.`
        },
        {
          title: 'Security',
          content: `To protect your account and prevent fraudulent activity.`
        },
        {
          title: 'Preferences',
          content: `To remember your settings and preferences, such as language and region.`
        },
        {
          title: 'Analytics',
          content: `To understand how our website is used and improve its performance and user experience.`
        },
        {
          title: 'Marketing',
          content: `To deliver relevant advertising and measure the effectiveness of our marketing campaigns.`
        }
      ]
    },
    {
      id: 'specific-cookies',
      title: 'Specific Cookies We Use',
      icon: <Shield size={18} />,
      content: `Below is a detailed list of cookies used on the SafeSign platform:`,
      subSections: [
        {
          title: 'First-Party Cookies',
          content: `These cookies are set by SafeSign directly:

• session_id: Essential for maintaining user sessions
• csrf_token: Security cookie for form submissions
• user_preferences: Stores user interface preferences
• consent_status: Remembers your cookie consent choices`
        },
        {
          title: 'Third-Party Cookies',
          content: `These cookies are set by our trusted partners:

• _ga, _gid: Google Analytics for website usage analysis
• _fbp: Facebook Pixel for marketing optimization
• lang: LinkedIn language preference detection
• AWSALB: Load balancing for optimal performance`
        }
      ]
    },
    {
      id: 'duration',
      title: 'Cookie Duration',
      icon: <Clock size={18} />,
      content: `Cookies have different lifespans:`,
      subSections: [
        {
          title: 'Session Cookies',
          content: `Temporary cookies that expire when you close your browser. Used for maintaining your session state.`
        },
        {
          title: 'Persistent Cookies',
          content: `Remain on your device for a set period or until you delete them. Used for remembering preferences and analytics.`
        },
        {
          title: 'Maximum Lifespan',
          content: `Most of our cookies expire within 30 days to 2 years. You can view exact expiration times in your browser's cookie settings.`
        }
      ]
    },
    {
      id: 'control',
      title: 'Managing Cookies',
      icon: <Eye size={18} />,
      content: `You have several options to control cookies:`,
      subSections: [
        {
          title: 'Browser Settings',
          content: `Most web browsers allow you to control cookies through their settings. You can usually find these settings in the "Options" or "Preferences" menu.

You can:
• Delete existing cookies
• Block all or specific cookies
• Set preferences for different websites`
        },
        {
          title: 'Cookie Banner',
          content: `When you first visit our site, you'll see a cookie consent banner where you can choose which types of cookies to accept.`
        },
        {
          title: 'Opt-Out Tools',
          content: `For third-party advertising cookies, you can use tools like:
• Your Online Choices (youronlinechoices.eu)
• Network Advertising Initiative (optout.networkadvertising.org)
• Digital Advertising Alliance (optout.aboutads.info)`
        },
        {
          title: 'Do Not Track',
          content: `Some browsers have a "Do Not Track" feature that signals to websites you visit that you do not want to be tracked. We respect this signal.`
        }
      ]
    },
    {
      id: 'legal-basis',
      title: 'Legal Basis for Processing',
      icon: <Globe size={18} />,
      content: `Our use of cookies is based on the following legal grounds:`,
      subSections: [
        {
          title: 'Essential Cookies',
          content: `These are necessary for the performance of our contract with you (providing our services) and our legitimate interests in operating a secure website.`
        },
        {
          title: 'Non-Essential Cookies',
          content: `We rely on your consent for analytics, functional, and marketing cookies. You can withdraw your consent at any time through our cookie settings.`
        },
        {
          title: 'Compliance',
          content: `We comply with global privacy regulations including GDPR, CCPA, ePrivacy Directive, and other applicable laws.`
        }
      ]
    },
    {
      id: 'updates',
      title: 'Policy Updates',
      icon: <FileText size={18} />,
      content: `We may update this Cookie Policy from time to time. We will notify you of any material changes by:

• Updating the "Last Updated" date at the top of this policy
• Posting a notice on our website
• Sending an email notification to registered users (for significant changes)

We encourage you to review this policy periodically to stay informed about our use of cookies.`
    },
    {
      id: 'contact',
      title: 'Contact Information',
      icon: <Mail size={18} />,
      content: `If you have questions about our use of cookies or this Cookie Policy, please contact us:

SafeSign Privacy Team
Email: privacy@safesign.com
Address: 123 Security Lane, San Francisco, CA 94107, USA
Phone: +1 (800) 123-4567

Data Protection Officer:
Email: dpo@safesign.com`
    }
  ];

  const cookieCategories = [
    {
      id: 'essential',
      name: 'Essential Cookies',
      description: 'Required for the website to function properly. Cannot be disabled.',
      required: true,
      enabled: true
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website.',
      required: false,
      enabled: cookiePreferences.analytics
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      description: 'Enable enhanced features and personalization.',
      required: false,
      enabled: cookiePreferences.functional
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements.',
      required: false,
      enabled: cookiePreferences.marketing
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleCookieToggle = (cookieId) => {
    if (cookieId === 'essential') return; // Can't disable essential cookies
    
    setCookiePreferences(prev => ({
      ...prev,
      [cookieId]: !prev[cookieId]
    }));
  };

  const savePreferences = () => {
    // In a real implementation, this would save to localStorage/backend
    alert('Cookie preferences saved! Your settings will be applied on your next visit.');
  };

  const acceptAll = () => {
    setCookiePreferences({
      essential: true,
      analytics: true,
      functional: true,
      marketing: true
    });
    alert('All cookies accepted!');
  };

  const rejectAll = () => {
    setCookiePreferences({
      essential: true,
      analytics: false,
      functional: false,
      marketing: false
    });
    alert('All non-essential cookies rejected!');
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
              <Cookie size={20} />
              <span>Cookie Policy</span>
            </div>
            <h1 className="safe-hero-title">Cookie Policy</h1>
            <p className="safe-hero-subtitle">
              Learn how we use cookies and similar technologies on the SafeSign platform
            </p>
            
            <div className="safe-hero-meta">
              <div className="safe-meta-item">
                <Calendar size={16} />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className="safe-meta-item">
                <FileText size={16} />
                <span>Version: 2.1</span>
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
                placeholder="Search cookie policy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="safe-search-input"
              />
            </div>
            
            <div className="safe-quick-links">
              <a href="#types" className="safe-quick-link">
                <Database size={14} />
                Types
              </a>
              <a href="#control" className="safe-quick-link">
                <Settings size={14} />
                Control
              </a>
              <a href="#specific-cookies" className="safe-quick-link">
                <Shield size={14} />
                Details
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
            {/* Cookie Preference Manager */}
            <div className="safe-cookie-manager">
              <div className="safe-cookie-header">
                <Settings size={24} />
                <h2 className="safe-cookie-title">Cookie Preferences</h2>
              </div>
              <p className="safe-cookie-description">
                Manage your cookie settings. Essential cookies cannot be disabled as they are required for the website to function.
              </p>
              
              <div className="safe-cookie-categories">
                {cookieCategories.map((category) => (
                  <div key={category.id} className="safe-cookie-category">
                    <div className="safe-category-header">
                      <div className="safe-category-info">
                        <h3 className="safe-category-name">{category.name}</h3>
                        <p className="safe-category-desc">{category.description}</p>
                      </div>
                      <label className="safe-cookie-toggle">
                        <input
                          type="checkbox"
                          checked={cookiePreferences[category.id]}
                          onChange={() => handleCookieToggle(category.id)}
                          disabled={category.required}
                          className="safe-toggle-input"
                        />
                        <span className={`safe-toggle-slider ${category.required ? 'safe-toggle-disabled' : ''}`}>
                          {category.required && <Lock size={12} />}
                        </span>
                      </label>
                    </div>
                    {category.required && (
                      <div className="safe-required-badge">
                        <Lock size={12} />
                        <span>Required</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="safe-cookie-actions">
                <button 
                  className="safe-action-btn safe-btn-secondary"
                  onClick={savePreferences}
                >
                  <CheckCircle size={18} />
                  Save Preferences
                </button>
                <button 
                  className="safe-action-btn safe-btn-primary"
                  onClick={acceptAll}
                >
                  <CheckCircle size={18} />
                  Accept All
                </button>
                <button 
                  className="safe-action-btn safe-btn-secondary"
                  onClick={rejectAll}
                >
                  <XCircle size={18} />
                  Reject All Non-Essential
                </button>
              </div>
            </div>

            {/* Quick Reference */}
            <div className="safe-quick-reference">
              <div className="safe-reference-header">
                <AlertCircle size={24} />
                <h2 className="safe-reference-title">Quick Reference</h2>
              </div>
              <div className="safe-reference-grid">
                <div className="safe-reference-item">
                  <div className="safe-reference-icon">
                    <Cookie size={20} />
                  </div>
                  <div className="safe-reference-text">
                    <h4>What Are Cookies?</h4>
                    <p>Small text files stored on your device to enhance browsing</p>
                  </div>
                </div>
                <div className="safe-reference-item">
                  <div className="safe-reference-icon">
                    <Shield size={20} />
                  </div>
                  <div className="safe-reference-text">
                    <h4>Your Control</h4>
                    <p>Manage cookie preferences anytime through settings</p>
                  </div>
                </div>
                <div className="safe-reference-item">
                  <div className="safe-reference-icon">
                    <Globe size={20} />
                  </div>
                  <div className="safe-reference-text">
                    <h4>Compliance</h4>
                    <p>GDPR, CCPA, ePrivacy Directive compliant</p>
                  </div>
                </div>
                <div className="safe-reference-item">
                  <div className="safe-reference-icon">
                    <Eye size={20} />
                  </div>
                  <div className="safe-reference-text">
                    <h4>Transparency</h4>
                    <p>Detailed information about every cookie we use</p>
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

            {/* Browser Guidance */}
            <div className="safe-browser-guidance">
              <div className="safe-guidance-header">
                <Settings size={24} />
                <h2 className="safe-guidance-title">How to Manage Cookies in Your Browser</h2>
              </div>
              <div className="safe-guidance-grid">
                <div className="safe-guidance-item">
                  <h3>Google Chrome</h3>
                  <p>Settings → Privacy and Security → Cookies and other site data</p>
                </div>
                <div className="safe-guidance-item">
                  <h3>Mozilla Firefox</h3>
                  <p>Options → Privacy & Security → Cookies and Site Data</p>
                </div>
                <div className="safe-guidance-item">
                  <h3>Safari</h3>
                  <p>Preferences → Privacy → Cookies and website data</p>
                </div>
                <div className="safe-guidance-item">
                  <h3>Microsoft Edge</h3>
                  <p>Settings → Cookies and site permissions → Cookies and data stored</p>
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
                <a href="/privacy" className="safe-policy-link">
                  <FileText size={18} />
                  <div>
                    <h4>Privacy Policy</h4>
                    <p>How we collect, use, and protect your data</p>
                  </div>
                  <ExternalLink size={14} />
                </a>
                <a href="/terms" className="safe-policy-link">
                  <FileText size={18} />
                  <div>
                    <h4>Terms of Service</h4>
                    <p>Legal terms governing use of SafeSign</p>
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

        /* Cookie Manager */
        .safe-cookie-manager {
          background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
          border: 1px solid #ddd6fe;
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .safe-cookie-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
          color: #0d9488;
        }

        .safe-cookie-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-cookie-description {
          font-size: 0.9375rem;
          color: #6b7280;
          margin: 0 0 1.5rem;
          line-height: 1.6;
        }

        .safe-cookie-categories {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .safe-cookie-category {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.25rem;
          position: relative;
        }

        .safe-category-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .safe-category-info {
          flex: 1;
        }

        .safe-category-name {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-category-desc {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .safe-cookie-toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }

        .safe-toggle-input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .safe-toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #d1d5db;
          transition: .4s;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .safe-toggle-slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        .safe-toggle-input:checked + .safe-toggle-slider {
          background-color: #0d9488;
        }

        .safe-toggle-input:checked + .safe-toggle-slider:before {
          transform: translateX(20px);
        }

        .safe-toggle-disabled {
          background-color: #9ca3af !important;
          cursor: not-allowed;
        }

        .safe-toggle-disabled:before {
          background-color: #e5e7eb;
        }

        .safe-required-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background: #f3f4f6;
          color: #6b7280;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 0.75rem;
        }

        .safe-cookie-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        /* Quick Reference */
        .safe-quick-reference {
          background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
          border: 1px solid #d1fae5;
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .safe-reference-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          color: #0d9488;
        }

        .safe-reference-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-reference-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-reference-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-reference-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .safe-reference-icon {
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

        .safe-reference-text h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-reference-text p {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
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
          border-left: 3px solid #ddd6fe;
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

        /* Browser Guidance */
        .safe-browser-guidance {
          background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
          border: 1px solid #fde68a;
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .safe-guidance-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          color: #d97706;
        }

        .safe-guidance-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-guidance-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-guidance-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-guidance-item {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 0.75rem;
        }

        .safe-guidance-item h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-guidance-item p {
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
          background: #0d9488;
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
          
          .safe-cookie-actions {
            flex-direction: column;
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

export default CookiePolicy;