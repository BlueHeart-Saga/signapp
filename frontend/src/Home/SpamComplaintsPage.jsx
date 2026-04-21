import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Flag,
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
  Search,
  Clock,
  User,
  MessageSquare,
  Phone,
  Upload,
  Send,
  X,
  HelpCircle,
  Bell,
  Lock
} from 'lucide-react';

const SpamComplaintsPage = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('report');
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterEmail: '',
    spamEmail: '',
    senderEmail: '',
    documentName: '',
    receivedDate: '',
    reason: '',
    description: '',
    evidence: null,
    urgency: 'medium'
  });

  const complaintTypes = [
    {
      id: 'unsolicited',
      title: 'Unsolicited Email',
      description: 'Received email from SafeSign without signing up',
      icon: AlertTriangle
    },
    {
      id: 'phishing',
      title: 'Phishing Attempt',
      description: 'Suspicious email pretending to be SafeSign',
      icon: Shield
    },
    {
      id: 'excessive',
      title: 'Excessive Emails',
      description: 'Too many emails from SafeSign',
      icon: Bell
    },
    {
      id: 'wrong_recipient',
      title: 'Wrong Recipient',
      description: 'Email addressed to wrong person',
      icon: User
    },
    {
      id: 'fake_signature',
      title: 'Fake Signature Request',
      description: 'Signature request for document you don\'t recognize',
      icon: FileText
    },
    {
      id: 'other',
      title: 'Other Issue',
      description: 'Any other spam-related concern',
      icon: HelpCircle
    }
  ];

  const sections = [
    {
      id: 'what-is-spam',
      title: 'What is Considered Spam?',
      content: `At SafeSign, we take email integrity seriously. We consider the following as spam:`,
      subSections: [
        {
          title: 'Unsolicited Communications',
          content: `Emails sent without prior consent or business relationship. SafeSign only sends emails when:
- You or someone you know initiates a document signing process
- You have an active account with us
- You have subscribed to our communications`
        },
        {
          title: 'Phishing Attempts',
          content: `Emails pretending to be from SafeSign that try to:
- Steal your login credentials or personal information
- Trick you into downloading malware
- Request sensitive information via email`
        },
        {
          title: 'Excessive Frequency',
          content: `Multiple identical emails sent in a short period, beyond what is necessary for document signing workflow.`
        }
      ]
    },
    {
      id: 'legitimate-emails',
      title: 'Legitimate SafeSign Emails',
      content: `You may receive legitimate emails from SafeSign in these scenarios:`,
      subSections: [
        {
          title: 'Document Signing Requests',
          content: `When someone requests your signature on a document through SafeSign, you will receive:
- Initial invitation with OTP
- Reminders if you haven't completed signing
- Confirmation after signing
- Copy of signed document`
        },
        {
          title: 'Account Management',
          content: `Account-related communications including:
- Welcome emails when you create an account
- Password reset requests (only if initiated by you)
- Security alerts and notifications
- Billing and subscription updates`
        },
        {
          title: 'Service Communications',
          content: `Important service updates such as:
- Policy changes (with option to unsubscribe)
- Security bulletins
- Service interruptions or maintenance`
        }
      ]
    },
    {
      id: 'report-process',
      title: 'How to Report Spam',
      content: `Follow these steps to report suspected spam:`,
      subSections: [
        {
          title: 'Step 1: Gather Information',
          content: `Collect these details before reporting:
- Full email headers (not just the message body)
- Sender email address
- Date and time received
- Subject line
- Any attachments (do not open suspicious attachments)`
        },
        {
          title: 'Step 2: Do Not Respond',
          content: `Do not reply to suspected spam emails. Do not click any links or download attachments from suspicious emails.`
        },
        {
          title: 'Step 3: Report Through This Form',
          content: `Use our secure reporting form to submit your complaint. All reports are investigated within 24-48 hours.`
        },
        {
          title: 'Step 4: Mark as Spam',
          content: `In your email client, mark the message as spam to help improve spam filters for all users.`
        }
      ]
    },
    {
      id: 'investigation',
      title: 'Our Investigation Process',
      content: `When you report spam, here's what happens:`,
      subSections: [
        {
          title: 'Initial Review',
          content: `Within 24 hours:
- Verify sender identity
- Check if email originated from our systems
- Analyze email headers and content
- Cross-reference with legitimate sending patterns`
        },
        {
          title: 'Technical Analysis',
          content: `Deep technical investigation:
- IP address and domain verification
- SPF, DKIM, DMARC validation
- Pattern analysis against known phishing attempts
- Malware scanning if attachments present`
        },
        {
          title: 'Action & Resolution',
          content: `Based on findings:
- Block malicious senders from our platform
- Update spam filters
- Notify affected users if data compromise suspected
- Work with authorities for criminal phishing attempts`
        },
        {
          title: 'Follow-up',
          content: `We'll notify you of our findings and actions taken within 3-5 business days.`
        }
      ]
    },
    {
      id: 'prevention',
      title: 'How to Identify Legitimate Emails',
      content: `Legitimate SafeSign emails will always have these characteristics:`,
      subSections: [
        {
          title: 'Sender Verification',
          content: `- From: @safesign.com or our verified domains
- Proper SPF, DKIM, and DMARC alignment
- No suspicious characters or misspellings in sender address`
        },
        {
          title: 'Content Indicators',
          content: `- Personalized greeting with your name
- Specific document name you recognize
- No urgent or threatening language
- Clear opt-out options
- Professional formatting without major errors`
        },
        {
          title: 'Links & Attachments',
          content: `- Links point to https://safesign.com domains
- Hover over links to verify destination
- Attachments are PDF documents (never .exe, .zip, .scr files)`
        },
        {
          title: 'What We Never Ask',
          content: `SafeSign will NEVER ask for:
- Your password via email
- Credit card information via email
- To download software updates via email link
- To provide personal information via reply email`
        }
      ]
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting complaint:', formData);
    // Submit logic here
    alert('Complaint submitted successfully. We will investigate within 24-48 hours.');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      setFormData({ ...formData, evidence: file });
    } else {
      alert('File size must be less than 5MB');
    }
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
    <div className="safe-complaints-page">
      {/* Hero Section */}
      <section className="safe-complaints-hero">
        <div className="safe-complaints-container">
          <div className="safe-hero-content">
            <div className="safe-hero-badge">
              <Shield size={20} />
              <span>Security & Abuse</span>
            </div>
            <h1 className="safe-hero-title">Report Spam & Abuse</h1>
            <p className="safe-hero-subtitle">
              Help us maintain a secure platform by reporting suspicious emails and activities
            </p>

            <div className="safe-stats-grid">
              <div className="safe-stat-item">
                <div className="safe-stat-icon" style={{ background: '#fef3c7' }}>
                  <Clock size={20} color="#d97706" />
                </div>
                <div className="safe-stat-content">
                  <h3>24-48 Hours</h3>
                  <p>Average investigation time</p>
                </div>
              </div>
              <div className="safe-stat-item">
                <div className="safe-stat-icon" style={{ background: '#dbeafe' }}>
                  <CheckCircle size={20} color="#1d4ed8" />
                </div>
                <div className="safe-stat-content">
                  <h3>99% Accuracy</h3>
                  <p>Spam detection rate</p>
                </div>
              </div>
              <div className="safe-stat-item">
                <div className="safe-stat-icon" style={{ background: '#f0fdf4' }}>
                  <Lock size={20} color="#059669" />
                </div>
                <div className="safe-stat-content">
                  <h3>100% Confidential</h3>
                  <p>Reports are kept private</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="safe-complaints-tabs">
        <div className="safe-complaints-container">
          <div className="safe-tabs-navigation">
            <button
              className={`safe-tab ${activeTab === 'report' ? 'safe-tab-active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              <Flag size={18} />
              Report Spam
            </button>
            <button
              className={`safe-tab ${activeTab === 'guide' ? 'safe-tab-active' : ''}`}
              onClick={() => setActiveTab('guide')}
            >
              <Eye size={18} />
              Identification Guide
            </button>
            <button
              className={`safe-tab ${activeTab === 'faq' ? 'safe-tab-active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              <HelpCircle size={18} />
              FAQ
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="safe-complaints-main">
        <div className="safe-complaints-container">
          {/* Report Form */}
          {activeTab === 'report' && (
            <div className="safe-report-form-section">
              <div className="safe-form-header">
                <h2 className="safe-form-title">
                  <Flag size={24} />
                  Submit Spam Complaint
                </h2>
                <p className="safe-form-subtitle">
                  Please provide as much detail as possible to help us investigate quickly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="safe-complaint-form">
                {/* Step 1: Complaint Type */}
                <div className="safe-form-step">
                  <h3 className="safe-step-title">
                    <span className="safe-step-number">1</span>
                    Select Complaint Type
                  </h3>
                  <div className="safe-complaint-types">
                    {complaintTypes.map(type => (
                      <div
                        key={type.id}
                        className={`safe-complaint-type ${selectedType === type.id ? 'safe-type-selected' : ''}`}
                        onClick={() => {
                          setSelectedType(type.id);
                          setFormData({ ...formData, reason: type.title });
                        }}
                      >
                        <div className="safe-type-icon">
                          <type.icon size={20} />
                        </div>
                        <div className="safe-type-content">
                          <h4>{type.title}</h4>
                          <p>{type.description}</p>
                        </div>
                        {selectedType === type.id && (
                          <CheckCircle size={20} className="safe-type-check" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Complaint Details */}
                <div className="safe-form-step">
                  <h3 className="safe-step-title">
                    <span className="safe-step-number">2</span>
                    Provide Details
                  </h3>

                  <div className="safe-form-grid">
                    <div className="safe-form-group">
                      <label htmlFor="reporterName">
                        <User size={16} />
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="reporterName"
                        value={formData.reporterName}
                        onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="safe-form-group">
                      <label htmlFor="reporterEmail">
                        <Mail size={16} />
                        Your Email
                      </label>
                      <input
                        type="email"
                        id="reporterEmail"
                        value={formData.reporterEmail}
                        onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>

                    <div className="safe-form-group">
                      <label htmlFor="spamEmail">
                        <MessageSquare size={16} />
                        Spam Email Address
                      </label>
                      <input
                        type="email"
                        id="spamEmail"
                        value={formData.spamEmail}
                        onChange={(e) => setFormData({ ...formData, spamEmail: e.target.value })}
                        placeholder="Email that received spam"
                        required
                      />
                    </div>

                    <div className="safe-form-group">
                      <label htmlFor="senderEmail">
                        <User size={16} />
                        Sender Email (if known)
                      </label>
                      <input
                        type="email"
                        id="senderEmail"
                        value={formData.senderEmail}
                        onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                        placeholder="Spam sender's email"
                      />
                    </div>

                    <div className="safe-form-group">
                      <label htmlFor="documentName">
                        <FileText size={16} />
                        Document Name (if applicable)
                      </label>
                      <input
                        type="text"
                        id="documentName"
                        value={formData.documentName}
                        onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                        placeholder="Name of document in email"
                      />
                    </div>

                    <div className="safe-form-group">
                      <label htmlFor="receivedDate">
                        <Calendar size={16} />
                        Date Received
                      </label>
                      <input
                        type="date"
                        id="receivedDate"
                        value={formData.receivedDate}
                        onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="safe-form-group">
                    <label htmlFor="description">
                      <MessageSquare size={16} />
                      Detailed Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the spam email, why you believe it's spam, and any other relevant details..."
                      rows={4}
                      required
                    />
                  </div>
                </div>

                {/* Step 3: Evidence */}
                <div className="safe-form-step">
                  <h3 className="safe-step-title">
                    <span className="safe-step-number">3</span>
                    Upload Evidence
                  </h3>

                  <div className="safe-evidence-upload">
                    <label className="safe-upload-area">
                      <Upload size={24} />
                      <span>Drop email screenshot or forward the email</span>
                      <span className="safe-upload-hint">
                        Supported: .eml, .msg, .png, .jpg, .pdf (Max 5MB)
                      </span>
                      <input
                        type="file"
                        accept=".eml,.msg,.png,.jpg,.jpeg,.pdf"
                        onChange={handleFileUpload}
                        hidden
                      />
                    </label>

                    {formData.evidence && (
                      <div className="safe-file-preview">
                        <FileText size={20} />
                        <span>{formData.evidence.name}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, evidence: null })}
                          className="safe-remove-file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="safe-form-group">
                    <label>Urgency Level</label>
                    <div className="safe-urgency-options">
                      {['low', 'medium', 'high'].map(level => (
                        <label key={level} className="safe-urgency-option">
                          <input
                            type="radio"
                            name="urgency"
                            value={level}
                            checked={formData.urgency === level}
                            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          />
                          <span className={`safe-urgency-badge safe-urgency-${level}`}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submission */}
                <div className="safe-form-actions">
                  <button type="submit" className="safe-submit-btn">
                    <Send size={18} />
                    Submit Complaint
                  </button>
                  <p className="safe-form-disclaimer">
                    By submitting, you agree to our investigation process. We will contact you at the provided email within 48 hours.
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* Identification Guide */}
          {activeTab === 'guide' && (
            <div className="safe-guide-section">
              <div className="safe-guide-header">
                <h2 className="safe-guide-title">
                  <Eye size={24} />
                  How to Identify Spam vs Legitimate Emails
                </h2>

                <div className="safe-search-section">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search guide..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="safe-search-input"
                  />
                </div>
              </div>

              {/* Guide Sections */}
              <div className="safe-sections-container">
                {filteredSections.map((section, index) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="safe-guide-section-item"
                  >
                    <div className="safe-section-header" onClick={() => toggleSection(section.id)}>
                      <h2 className="safe-section-title">
                        <span className="safe-section-number">{index + 1}.</span>
                        {section.title}
                      </h2>
                      <ChevronDown className={`safe-expand-arrow ${expandedSections[section.id] ? 'safe-arrow-expanded' : ''}`} />
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

              {/* Quick Checklist */}
              <div className="safe-checklist">
                <h3 className="safe-checklist-title">
                  <CheckCircle size={20} />
                  Quick Safety Checklist
                </h3>
                <div className="safe-checklist-grid">
                  <div className="safe-checklist-item safe-item-good">
                    <CheckCircle size={16} />
                    <span>Hover over links to verify URL</span>
                  </div>
                  <div className="safe-checklist-item safe-item-good">
                    <CheckCircle size={16} />
                    <span>Check sender email carefully</span>
                  </div>
                  <div className="safe-checklist-item safe-item-good">
                    <CheckCircle size={16} />
                    <span>Verify document names match</span>
                  </div>
                  <div className="safe-checklist-item safe-item-bad">
                    <AlertTriangle size={16} />
                    <span>❌ Never share OTP via email</span>
                  </div>
                  <div className="safe-checklist-item safe-item-bad">
                    <AlertTriangle size={16} />
                    <span>❌ Don't click suspicious attachments</span>
                  </div>
                  <div className="safe-checklist-item safe-item-bad">
                    <AlertTriangle size={16} />
                    <span>❌ Ignore urgent/threatening language</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ */}
          {activeTab === 'faq' && (
            <div className="safe-faq-section">
              <h2 className="safe-faq-title">Frequently Asked Questions</h2>

              <div className="safe-faq-grid">
                <div className="safe-faq-item">
                  <h3>How long does investigation take?</h3>
                  <p>Most investigations are completed within 24-48 hours. Complex cases may take up to 5 business days. You will receive email updates throughout the process.</p>
                </div>

                <div className="safe-faq-item">
                  <h3>Will the sender know I reported them?</h3>
                  <p>No. All reports are confidential. We investigate discreetly and only contact senders when necessary for investigation or legal compliance.</p>
                </div>

                <div className="safe-faq-item">
                  <h3>What if I accidentally marked legitimate email as spam?</h3>
                  <p>Contact our support team immediately. We can whitelist legitimate senders and ensure future emails reach your inbox.</p>
                </div>

                <div className="safe-faq-item">
                  <h3>Do you work with law enforcement?</h3>
                  <p>Yes, for criminal activities like phishing or identity theft. We cooperate with law enforcement through proper legal channels and provide evidence when required by court order.</p>
                </div>

                <div className="safe-faq-item">
                  <h3>How can I prevent future spam?</h3>
                  <p>Use email filters, never share your email publicly, use unique passwords, and enable two-factor authentication on your SafeSign account.</p>
                </div>

                <div className="safe-faq-item">
                  <h3>What happens to confirmed spammers?</h3>
                  <p>Accounts are immediately suspended, IPs are blocked, domains are blacklisted, and in severe cases, legal action is pursued.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Emergency Section */}
      <section className="safe-emergency-section">
        <div className="safe-complaints-container">
          <div className="safe-emergency-card">
            <div className="safe-emergency-header">
              <AlertTriangle size={24} />
              <h3>⚠️ Emergency Security Issue?</h3>
            </div>
            <p>If you believe your account has been compromised or you've been a victim of fraud:</p>
            <div className="safe-emergency-contacts">
              <a href="mailto:security@safesign.com" className="safe-emergency-btn">
                <Mail size={16} />
                Email Security Team
              </a>
              <a href="tel:+18001234567" className="safe-emergency-btn">
                <Phone size={16} />
                Call Emergency Line
              </a>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* Base Styles */
        .safe-complaints-page {
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
        }

        .safe-complaints-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Hero Section */
        .safe-complaints-hero {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
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

        .safe-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        @media (max-width: 768px) {
          .safe-stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        .safe-stat-item {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          padding: 1.5rem;
          text-align: center;
        }

        .safe-stat-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .safe-stat-content h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin: 0 0 0.25rem;
        }

        .safe-stat-content p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        /* Tabs Navigation */
        .safe-complaints-tabs {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .safe-tabs-navigation {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.5rem 0;
        }

        .safe-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .safe-tab:hover {
          background: #e5e7eb;
        }

        .safe-tab-active {
          background: #0f766e;
          color: white;
        }

        /* Main Content */
        .safe-complaints-main {
          padding: 3rem 0;
        }

        /* Report Form Styles */
        .safe-report-form-section {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .safe-form-header {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .safe-form-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-form-subtitle {
          font-size: 1rem;
          color: #6b7280;
          margin: 0;
        }

        /* Form Steps */
        .safe-form-step {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .safe-step-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1.5rem;
        }

        .safe-step-number {
          width: 2rem;
          height: 2rem;
          background: #0f766e;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
        }

        /* Complaint Types */
        .safe-complaint-types {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .safe-complaint-types {
            grid-template-columns: 1fr;
          }
        }

        .safe-complaint-type {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .safe-complaint-type:hover {
          border-color: #0f766e;
        }

        .safe-type-selected {
          border-color: #0f766e;
          background: #f0fdfa;
        }

        .safe-type-icon {
          width: 3rem;
          height: 3rem;
          background: #f3f4f6;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          flex-shrink: 0;
        }

        .safe-type-selected .safe-type-icon {
          background: #0f766e;
          color: white;
        }

        .safe-type-content {
          flex: 1;
        }

        .safe-type-content h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-type-content p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .safe-type-check {
          color: #0f766e;
          flex-shrink: 0;
        }

        /* Form Grid */
        .safe-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-form-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-form-group {
          margin-bottom: 1.5rem;
        }

        .safe-form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .safe-form-group input,
        .safe-form-group textarea,
        .safe-form-group select {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          outline: none;
          transition: all 0.2s;
        }

        .safe-form-group input:focus,
        .safe-form-group textarea:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .safe-form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        /* Evidence Upload */
        .safe-evidence-upload {
          margin-bottom: 1.5rem;
        }

        .safe-upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background: white;
          border: 2px dashed #d1d5db;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .safe-upload-area:hover {
          border-color: #0f766e;
          background: #f0fdfa;
        }

        .safe-upload-area svg {
          color: #9ca3af;
          margin-bottom: 1rem;
        }

        .safe-upload-area span {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .safe-upload-hint {
          font-size: 0.75rem !important;
          color: #9ca3af !important;
          margin-top: 0.5rem;
        }

        .safe-file-preview {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          margin-top: 1rem;
        }

        .safe-file-preview svg {
          color: #6b7280;
        }

        .safe-file-preview span {
          flex: 1;
          font-size: 0.875rem;
          color: #374151;
        }

        .safe-remove-file {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: transparent;
          border: none;
          border-radius: 0.375rem;
          color: #dc2626;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-remove-file:hover {
          background: #fef2f2;
        }

        /* Urgency Options */
        .safe-urgency-options {
          display: flex;
          gap: 1rem;
        }

        .safe-urgency-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .safe-urgency-option input {
          display: none;
        }

        .safe-urgency-badge {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-urgency-low {
          background: #f3f4f6;
          color: #6b7280;
        }

        .safe-urgency-medium {
          background: #fef3c7;
          color: #d97706;
        }

        .safe-urgency-high {
          background: #fee2e2;
          color: #dc2626;
        }

        .safe-urgency-option input:checked + .safe-urgency-badge {
          transform: scale(1.05);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Form Actions */
        .safe-form-actions {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .safe-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-submit-btn:hover {
          background: #b91c1c;
          transform: translateY(-2px);
        }

        .safe-form-disclaimer {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 1rem 0 0;
        }

        /* Guide Section */
        .safe-guide-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .safe-guide-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-search-section {
          position: relative;
          min-width: 250px;
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
        }

        .safe-guide-section-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
          margin-bottom: 1rem;
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
          color: #dc2626;
          font-weight: 800;
        }

        .safe-expand-arrow {
          transition: transform 0.2s;
          color: #6b7280;
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
          border-left: 3px solid #fee2e2;
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

        /* Checklist */
        .safe-checklist {
          background: #f0fdfa;
          border: 1px solid #d1fae5;
          border-radius: 1rem;
          padding: 2rem;
          margin-top: 3rem;
        }

        .safe-checklist-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1.5rem;
        }

        .safe-checklist-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .safe-checklist-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-checklist-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .safe-item-good {
          color: #059669;
          border: 1px solid #d1fae5;
        }

        .safe-item-bad {
          color: #dc2626;
          border: 1px solid #fee2e2;
        }

        /* FAQ Section */
        .safe-faq-section {
          animation: fadeIn 0.3s ease;
        }

        .safe-faq-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 2rem;
          text-align: center;
        }

        .safe-faq-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .safe-faq-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-faq-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .safe-faq-item:hover {
          border-color: #0f766e;
          transform: translateY(-2px);
        }

        .safe-faq-item h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.75rem;
        }

        .safe-faq-item p {
          font-size: 0.875rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0;
        }

        /* Emergency Section */
        .safe-emergency-section {
          padding: 3rem 0;
          background: #fef2f2;
        }

        .safe-emergency-card {
          background: white;
          border: 2px solid #fecaca;
          border-radius: 1rem;
          padding: 2rem;
          text-align: center;
        }

        .safe-emergency-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: #dc2626;
          margin-bottom: 1rem;
        }

        .safe-emergency-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .safe-emergency-card p {
          color: #4b5563;
          margin: 0 0 1.5rem;
        }

        .safe-emergency-contacts {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .safe-emergency-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #dc2626;
          color: white;
          text-decoration: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .safe-emergency-btn:hover {
          background: #b91c1c;
          transform: translateY(-2px);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .safe-hero-title {
            font-size: 2.25rem;
          }
          
          .safe-form-title,
          .safe-guide-title {
            font-size: 1.5rem;
          }
          
          .safe-guide-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .safe-search-section {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .safe-complaints-container {
            padding: 0 1rem;
          }
          
          .safe-hero-title {
            font-size: 1.875rem;
          }
          
          .safe-form-step {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SpamComplaintsPage;
