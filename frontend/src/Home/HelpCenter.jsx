import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  Search, 
  HelpCircle, 
  FileText, 
  Lock, 
  User, 
  Settings, 
  CreditCard,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Phone,
  Mail,
  MessageCircle,
  Book,
  Shield,
  Users,
  Zap,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Star,
  BookOpen,
  Send,
  Printer,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

const HelpCenter = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReleaseNotesModal, setShowReleaseNotesModal] = useState(false);
  const [showLiveChatModal, setShowLiveChatModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! Welcome to Esigniva Support. How can we help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState({});

  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    category: 'general',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef(null);

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Zap size={24} />,
      color: '#0f766e',
      description: 'Learn the basics of Esigniva'
    },
    {
      id: 'signing-documents',
      title: 'Signing Documents',
      icon: <FileText size={24} />,
      color: '#10b981',
      description: 'Guide to creating and sending documents'
    },
    {
      id: 'security-privacy',
      title: 'Security & Privacy',
      icon: <Shield size={24} />,
      color: '#ef4444',
      description: 'Learn about our security measures'
    },
    {
      id: 'account-billing',
      title: 'Account & Billing',
      icon: <CreditCard size={24} />,
      color: '#8b5cf6',
      description: 'Manage your account and payments'
    },
    {
      id: 'templates-workflows',
      title: 'Templates & Workflows',
      icon: <BookOpen size={24} />,
      color: '#f59e0b',
      description: 'Create and use templates'
    },
    {
      id: 'team-collaboration',
      title: 'Team & Collaboration',
      icon: <Users size={24} />,
      color: '#3b82f6',
      description: 'Work with your team members'
    }
  ];

  const popularArticles = [
    {
      id: 'article-1',
      title: 'How to Create Your First E-Signature Request',
      category: 'getting-started',
      readTime: '3 min',
      views: '12.4k',
      summary: 'A step-by-step walkthrough to upload documents, add signer fields, configure recipients, and send your first legally binding document.',
      content: [
        'Creating your first e-signature request with Esigniva takes less than two minutes. Follow these simple steps:',
        '1. Upload your Document: From your Dashboard, click "Upload Document" or drag and drop any PDF, DOCX, or scan (up to 100MB).',
        '2. Add Signers & Recipients: Specify the names and email addresses of everyone who needs to sign or receive a copy. You can set sequential signing orders or parallel signing.',
        '3. Place Fields with Drag & Drop: Drag signature fields, date stamps, initials, text fields, and checkboxes directly onto the document where required.',
        '4. Review & Send: Add a customized subject line and invitation note, then click "Send for Signature".',
        '5. Track & Audit: Once sent, you can monitor document status in real time. Both you and all signers receive an automated Certificate of Completion upon signature.'
      ],
      tags: ['getting-started', 'upload', 'signature-request', 'beginner']
    },
    {
      id: 'article-2',
      title: 'Understanding Legal Compliance for E-Signatures',
      category: 'security-privacy',
      readTime: '5 min',
      views: '8.7k',
      summary: 'Learn how Esigniva signatures comply with ESIGN, UETA, eIDAS, and GDPR global regulations.',
      content: [
        'Esigniva electronic signatures are fully legally binding, court-admissible, and enforceable worldwide.',
        '• United States: Compliant with the federal ESIGN Act (15 U.S.C. 7001) and Uniform Electronic Transactions Act (UETA).',
        '• European Union & UK: Meets EU Regulation No 910/2014 (eIDAS) for Advanced Electronic Signatures (AES), providing cryptographic integrity and signer authentication.',
        '• Cryptographic Audit Trail: Each signed document generates a tamper-evident audit log with UTC timestamps, verified IP addresses, email hashes, and digital signature certificates.',
        '• Data Encryption: Bank-grade 256-bit AES encryption at rest and TLS 1.3 in transit guarantees total document privacy.'
      ],
      tags: ['compliance', 'eidas', 'esign', 'legal', 'security']
    },
    {
      id: 'article-3',
      title: 'Setting Up Team Members and Permissions',
      category: 'team-collaboration',
      readTime: '4 min',
      views: '6.2k',
      summary: 'How to invite colleagues, organize departments, and configure administrative roles and security permissions.',
      content: [
        'Manage your organization with granular role-based access control and shared workspaces:',
        '1. Go to Team Settings: Navigate to your Organization Dashboard and click "Team Members".',
        '2. Invite New Users: Enter employee email addresses and select their department role (Admin, Manager, or Signer).',
        '3. Role Permissions: Admins have full access to billing, templates, and audit logs. Managers can oversee team envelopes, while standard members can draft and dispatch documents.',
        '4. Shared Template Folders: Keep legal contracts, NDAs, and onboarding paperwork organized in shared team folders with unified company branding.'
      ],
      tags: ['team', 'roles', 'permissions', 'collaboration']
    },
    {
      id: 'article-4',
      title: 'Troubleshooting Common Signing Issues',
      category: 'signing-documents',
      readTime: '4 min',
      views: '10.1k',
      summary: 'Quick fixes for missing invitation emails, browser signing errors, mobile responsive issues, and declined requests.',
      content: [
        'If signers or colleagues experience difficulty completing a document, review these immediate solutions:',
        '• Recipient Missing Email: Check the Spam or Junk folder for emails sent from info@esigniva.com. In your Documents list, click "Resend Invitation" to immediately send a fresh notification.',
        '• Signature Link Expired: For security, signing tokens expire after a preset period. The document owner can click "Extend Expiry" or resend from their dashboard.',
        '• Mobile Device Signing: Esigniva runs seamlessly on all mobile browsers (iOS Safari, Android Chrome). No software download is necessary.',
        '• Browser Caching: Ensure third-party cookies and modern JavaScript are enabled in your browser settings.'
      ],
      tags: ['troubleshooting', 'signing', 'email', 'mobile']
    }
  ];

  const faqs = {
    'getting-started': [
      {
        question: 'How do I create my first document for signing?',
        answer: 'To create your first document: 1) Upload your PDF or DOC file, 2) Drag and drop signature fields, 3) Add recipient emails, 4) Click "Send for Signature". You can also use our pre-built templates to get started faster.',
        tags: ['beginner', 'documents', 'quick-start']
      },
      {
        question: 'Is Esigniva legally binding?',
        answer: 'Yes, Esigniva complies with ESIGN, UETA, eIDAS, and other global e-signature laws. All signatures are court-admissible and legally binding worldwide. We provide detailed audit trails and certificate of completion for every signed document.',
        tags: ['legal', 'compliance', 'security']
      },
      {
        question: 'What file formats are supported?',
        answer: 'Esigniva supports PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, and image files (JPG, PNG, TIFF). Maximum file size is 100MB per document. For optimal results, we recommend using PDF format.',
        tags: ['files', 'formats', 'limitations']
      }
    ],
    'signing-documents': [
      {
        question: 'How do recipients sign documents?',
        answer: 'Recipients receive an email with a secure link. They can sign directly in their browser on any device - no software installation required. Signatures can be drawn, typed, or uploaded as an image.',
        tags: ['recipients', 'signing', 'process']
      },
      {
        question: 'Can I set signing order for multiple signers?',
        answer: 'Yes, you can define a specific signing sequence. Simply drag signers in the desired order when setting up the document. Each signer will receive the document only after the previous person has signed.',
        tags: ['workflow', 'multiple-signers', 'sequence']
      },
      {
        question: 'How do I add signature fields to my document?',
        answer: 'Use our drag-and-drop editor to place signature fields, date fields, text fields, and checkboxes exactly where needed. You can also use auto-place to automatically detect signature areas.',
        tags: ['fields', 'editor', 'formatting']
      }
    ],
    'security-privacy': [
      {
        question: 'How secure is my data with Esigniva?',
        answer: 'We use bank-level 256-bit AES encryption, SOC 2 Type II compliance, GDPR-ready data centers, and regular security audits. Documents are encrypted both in transit and at rest.',
        tags: ['encryption', 'security', 'compliance']
      },
      {
        question: 'What audit trail information is recorded?',
        answer: 'We record IP addresses, timestamps, device information, email addresses, and every action taken on the document. This creates a complete, tamper-proof audit trail for legal evidence.',
        tags: ['audit-trail', 'legal', 'tracking']
      }
    ]
  };

  const contactMethods = [
    {
      type: 'email',
      icon: <Mail size={24} />,
      title: 'Email Support',
      description: 'Get help via email',
      details: 'info@esigniva.com',
      responseTime: 'Within 4 hours',
      color: '#0f766e'
    },
    {
      type: 'chat',
      icon: <MessageCircle size={24} />,
      title: 'Live Chat',
      description: 'Chat with our support team',
      details: 'Available 24/7',
      responseTime: 'Instant',
      color: '#3b82f6'
    },
    {
      type: 'phone',
      icon: <Phone size={24} />,
      title: 'Phone Support',
      description: 'Call our support team',
      details: '+44 (0)20 7946 0192',
      responseTime: 'Within 15 minutes',
      color: '#10b981'
    }
  ];

  const quickLinks = [
    { label: 'API Documentation', action: () => navigate('/docs'), icon: <Book size={20} /> },
    { label: 'Pricing Plans', action: () => navigate('/pricing'), icon: <CreditCard size={20} /> },
    { label: 'System Status', action: () => setShowStatusModal(true), icon: <Globe size={20} /> },
    { label: 'Release Notes', action: () => setShowReleaseNotesModal(true), icon: <AlertCircle size={20} /> }
  ];

  const toggleFaq = (category, index) => {
    const key = `${category}-${index}`;
    setExpandedFaqs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    Swal.fire({
      icon: 'success',
      title: 'Message Sent!',
      text: "Your support request has been logged. We'll get back to you within 4 hours.",
      confirmButtonColor: '#0f766e'
    });
    setContactData({ name: '', email: '', category: 'general', message: '' });
    setShowContactForm(false);
    setIsSubmitting(false);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenArticle = (item) => {
    setSelectedArticle(item);
  };

  const handleChatSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      let reply = "Thanks for asking! Our support engineer is reviewing your inquiry. In the meantime, you can explore our documentation or create a support ticket.";
      if (/price|cost|plan/i.test(userMsg)) {
        reply = "You can view all our transparent tiers on the Pricing page! We offer Free, Pro, Business, and Enterprise plans with annual discounts.";
      } else if (/sign|document|upload/i.test(userMsg)) {
        reply = "To sign or send a document, simply click 'Upload Document' on your dashboard, add your recipient emails, and drag & drop signature fields.";
      } else if (/api|webhook|token/i.test(userMsg)) {
        reply = "You can access complete API documentation at /docs. Authentication uses Bearer API tokens generated in your Settings.";
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 800);
  };

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const allSearchableItems = [
    ...popularArticles.map(a => ({ ...a, type: 'article' })),
    ...Object.entries(faqs).flatMap(([cat, list]) => 
      list.map((faq, i) => ({
        id: `faq-${cat}-${i}`,
        title: faq.question,
        category: cat,
        readTime: '2 min read',
        views: '4.2k views',
        summary: faq.answer.slice(0, 110) + '...',
        content: [faq.answer],
        type: 'faq',
        tags: faq.tags
      }))
    )
  ];

  const filteredArticles = searchQuery.trim() === '' ? [] : allSearchableItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.content && item.content.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))) ||
    (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="safe-help-center">
      {/* Header */}
      <header className="safe-help-header">
        <div className="safe-help-container">
          <div className="safe-header-content">
            <h1 className="safe-header-title">
              <HelpCircle size={32} />
              Esigniva Help Center
            </h1>
            <p className="safe-header-subtitle">
              Find answers, guides, and troubleshooting tips for all things Esigniva
            </p>
            
            {/* Search Bar */}
            <div className="safe-search-wrapper">
              <Search className="safe-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for help articles, FAQs, or contact support..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="safe-search-input"
              />
              <button 
                className="safe-search-btn"
                onClick={() => {
                  if (filteredArticles.length > 0) {
                    handleOpenArticle(filteredArticles[0]);
                  }
                }}
              >
                Search
              </button>
            </div>
            
            {searchQuery && (
              <div className="safe-search-results">
                <div className="safe-results-header">
                  <span>Search results for "{searchQuery}"</span>
                  <span className="safe-results-count">{filteredArticles.length} results found</span>
                </div>
                {filteredArticles.length > 0 ? (
                  <div className="safe-results-list">
                    {filteredArticles.map(article => (
                      <div 
                        key={article.id} 
                        className="safe-result-item"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenArticle(article)}
                      >
                        <div className="safe-result-content">
                          <h4>{article.title}</h4>
                          <div className="safe-result-meta">
                            <span className="safe-result-category">{article.category.replace('-', ' ')}</span>
                            <span className="safe-result-readtime">{article.readTime}</span>
                            <span className="safe-result-views">{article.views}</span>
                          </div>
                        </div>
                        <ChevronRight size={20} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="safe-no-results">
                    <AlertCircle size={24} />
                    <p>No results found. Try different keywords or contact our support team.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="safe-help-main">
        <div className="safe-help-container">
          {/* Categories Grid */}
          <section className="safe-categories-section">
            <h2 className="safe-section-title">How can we help you today?</h2>
            <div className="safe-categories-grid">
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`safe-category-card ${activeCategory === category.id ? 'safe-category-active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <div className="safe-category-icon" style={{ backgroundColor: `${category.color}15` }}>
                    <span style={{ color: category.color }}>{category.icon}</span>
                  </div>
                  <h3 className="safe-category-title">{category.title}</h3>
                  <p className="safe-category-desc">{category.description}</p>
                  <div className="safe-category-badge">
                    {faqs[category.id]?.length || 0} articles
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="safe-help-content-grid">
            {/* Left Column - FAQs */}
            <div className="safe-help-content">
              {/* Popular Articles */}
              <section className="safe-popular-section">
                <div className="safe-section-header">
                  <Star size={24} />
                  <h2 className="safe-section-title">Popular Help Articles</h2>
                </div>
                <div className="safe-popular-grid">
                  {popularArticles.map(article => (
                    <article 
                      key={article.id} 
                      className="safe-popular-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenArticle(article)}
                    >
                      <div className="safe-popular-content">
                        <h3 className="safe-popular-title">{article.title}</h3>
                        <div className="safe-popular-meta">
                          <span className="safe-article-category">{article.category.replace('-', ' ')}</span>
                          <span className="safe-article-readtime">
                            <Clock size={14} />
                            {article.readTime}
                          </span>
                          <span className="safe-article-views">
                            {article.views} views
                          </span>
                        </div>
                      </div>
                      <button 
                        className="safe-view-article-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenArticle(article);
                        }}
                      >
                        View Article
                        <ChevronRight size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              {/* FAQs for Active Category */}
              <section className="safe-faqs-section">
                <div className="safe-section-header">
                  <HelpCircle size={24} />
                  <h2 className="safe-section-title">Frequently Asked Questions</h2>
                </div>
                
                <div className="safe-faqs-list">
                  {faqs[activeCategory]?.map((faq, index) => {
                    const key = `${activeCategory}-${index}`;
                    const isExpanded = expandedFaqs[key];
                    
                    return (
                      <div key={key} className="safe-faq-item">
                        <button
                          className="safe-faq-question"
                          onClick={() => toggleFaq(activeCategory, index)}
                          aria-expanded={isExpanded}
                        >
                          <span className="safe-faq-text">{faq.question}</span>
                          <ChevronDown className={`safe-faq-arrow ${isExpanded ? 'safe-arrow-expanded' : ''}`} />
                        </button>
                        
                        {isExpanded && (
                          <div className="safe-faq-answer">
                            <p className="safe-answer-text">{faq.answer}</p>
                            <div className="safe-faq-tags">
                              {faq.tags.map(tag => (
                                <span key={tag} className="safe-tag">{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Right Sidebar */}
            <aside className="safe-help-sidebar">
              {/* Quick Links */}
              <div className="safe-sidebar-card">
                <h3 className="safe-sidebar-title">Quick Links</h3>
                <div className="safe-quick-links">
                  {quickLinks.map(link => (
                    <button 
                      key={link.label} 
                      onClick={link.action} 
                      className="safe-quick-link"
                      style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {link.icon}
                      <span style={{ flex: 1, marginLeft: '0.5rem' }}>{link.label}</span>
                      <ExternalLink size={14} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Methods */}
              <div className="safe-sidebar-card">
                <h3 className="safe-sidebar-title">Contact Support</h3>
                <div className="safe-contact-methods">
                  {contactMethods.map(method => (
                    <div 
                      key={method.type} 
                      className="safe-contact-method"
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => {
                        if (method.type === 'email') {
                          window.open('mailto:info@esigniva.com?subject=Esigniva%20Support%20Inquiry', '_blank');
                          setShowContactForm(true);
                        } else if (method.type === 'chat') {
                          setShowLiveChatModal(true);
                        } else if (method.type === 'phone') {
                          setShowPhoneModal(true);
                        }
                      }}
                    >
                      <div className="safe-contact-icon" style={{ backgroundColor: `${method.color}15` }}>
                        <span style={{ color: method.color }}>{method.icon}</span>
                      </div>
                      <div className="safe-contact-info">
                        <h4 className="safe-contact-title">{method.title}</h4>
                        <p className="safe-contact-desc">{method.description}</p>
                        <div className="safe-contact-details">
                          <span className="safe-contact-detail">{method.details}</span>
                          <span className="safe-contact-time">
                            <Clock size={12} />
                            {method.responseTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="safe-contact-btn"
                  onClick={() => setShowContactForm(true)}
                >
                  Send a Message
                  <MessageSquare size={18} />
                </button>
              </div>

              {/* Status */}
              <div 
                className="safe-sidebar-card" 
                style={{ cursor: 'pointer' }}
                onClick={() => setShowStatusModal(true)}
                title="Click to view detailed system uptime & components"
              >
                <div className="safe-status-header">
                  <Globe size={20} />
                  <h3 className="safe-sidebar-title">System Status</h3>
                </div>
                <div className="safe-status-list">
                  <div className="safe-status-item safe-status-operational">
                    <CheckCircle size={16} />
                    <span>All Systems Operational (99.98%)</span>
                  </div>
                  <div className="safe-status-item safe-status-updated">
                    <Clock size={16} />
                    <span>Click for live service details</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="safe-contact-modal">
          <div className="safe-modal-overlay" onClick={() => setShowContactForm(false)} />
          <div className="safe-modal-content">
            <div className="safe-modal-header">
              <h2 className="safe-modal-title">Contact Support</h2>
              <button 
                className="safe-modal-close"
                onClick={() => setShowContactForm(false)}
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleContactSubmit} className="safe-contact-form">
              <div className="safe-form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={contactData.name}
                  onChange={handleContactChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="safe-form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={contactData.email}
                  onChange={handleContactChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="safe-form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={contactData.category}
                  onChange={handleContactChange}
                  required
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing Question</option>
                  <option value="feature">Feature Request</option>
                  <option value="security">Security Concern</option>
                </select>
              </div>
              
              <div className="safe-form-group">
                <label htmlFor="message">How can we help?</label>
                <textarea
                  id="message"
                  name="message"
                  value={contactData.message}
                  onChange={handleContactChange}
                  required
                  rows={5}
                  placeholder="Describe your issue or question in detail..."
                />
              </div>
              
              <div className="safe-form-actions">
                <button 
                  type="button" 
                  className="safe-btn-secondary"
                  onClick={() => setShowContactForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="safe-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="safe-contact-modal" style={{ zIndex: 1100 }}>
          <div className="safe-modal-overlay" onClick={() => setSelectedArticle(null)} />
          <div className="safe-modal-content" style={{ maxWidth: '720px' }}>
            <div className="safe-modal-header" style={{ alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    backgroundColor: '#e6fffa', 
                    color: '#0f766e',
                    textTransform: 'capitalize'
                  }}>
                    {selectedArticle.category?.replace('-', ' ')}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {selectedArticle.readTime}
                  </span>
                </div>
                <h2 className="safe-modal-title" style={{ fontSize: '1.4rem', lineHeight: '1.4' }}>
                  {selectedArticle.title}
                </h2>
              </div>
              <button 
                className="safe-modal-close"
                onClick={() => setSelectedArticle(null)}
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
              {selectedArticle.summary && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f8fafc', 
                  borderLeft: '4px solid #0f766e', 
                  borderRadius: '0.25rem',
                  marginBottom: '1.5rem',
                  color: '#334155',
                  fontSize: '0.95rem'
                }}>
                  {selectedArticle.summary}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#1e293b', fontSize: '0.95rem', lineHeight: '1.7' }}>
                {Array.isArray(selectedArticle.content) ? (
                  selectedArticle.content.map((paragraph, idx) => (
                    <p key={idx} style={{ margin: 0 }}>{paragraph}</p>
                  ))
                ) : (
                  <p style={{ margin: 0 }}>{selectedArticle.content}</p>
                )}
              </div>

              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tags:</span>
                  {selectedArticle.tags.map(t => (
                    <span key={t} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#475569' }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Feedback & Actions */}
              <div style={{ 
                marginTop: '2rem', 
                paddingTop: '1.5rem', 
                borderTop: '1px solid #e2e8f0', 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Was this article helpful?</span>
                  <button 
                    onClick={() => {
                      setFeedbackGiven(prev => ({ ...prev, [selectedArticle.id]: 'yes' }));
                      Swal.fire({ icon: 'success', title: 'Thank you!', text: 'Your feedback helps us improve our documentation.', timer: 1500, showConfirmButton: false });
                    }}
                    style={{ 
                      padding: '0.4rem 0.75rem', 
                      borderRadius: '0.375rem', 
                      border: '1px solid #cbd5e1', 
                      background: feedbackGiven[selectedArticle.id] === 'yes' ? '#e6fffa' : 'white',
                      color: feedbackGiven[selectedArticle.id] === 'yes' ? '#0f766e' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <ThumbsUp size={14} /> Yes
                  </button>
                  <button 
                    onClick={() => {
                      setFeedbackGiven(prev => ({ ...prev, [selectedArticle.id]: 'no' }));
                      Swal.fire({ icon: 'info', title: 'Thanks for letting us know', text: 'Our documentation team will review and expand this article.', timer: 1500, showConfirmButton: false });
                    }}
                    style={{ 
                      padding: '0.4rem 0.75rem', 
                      borderRadius: '0.375rem', 
                      border: '1px solid #cbd5e1', 
                      background: feedbackGiven[selectedArticle.id] === 'no' ? '#fff1f2' : 'white',
                      color: feedbackGiven[selectedArticle.id] === 'no' ? '#e11d48' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <ThumbsDown size={14} /> No
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      Swal.fire({ icon: 'success', title: 'Link Copied', text: 'Article link copied to clipboard.', timer: 1200, showConfirmButton: false });
                    }}
                    style={{ 
                      padding: '0.4rem 0.75rem', 
                      borderRadius: '0.375rem', 
                      border: '1px solid #cbd5e1', 
                      background: 'white',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <Copy size={14} /> Copy Link
                  </button>
                  <button 
                    onClick={() => window.print()}
                    style={{ 
                      padding: '0.4rem 0.75rem', 
                      borderRadius: '0.375rem', 
                      border: '1px solid #cbd5e1', 
                      background: 'white',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Status Modal */}
      {showStatusModal && (
        <div className="safe-contact-modal" style={{ zIndex: 1100 }}>
          <div className="safe-modal-overlay" onClick={() => setShowStatusModal(false)} />
          <div className="safe-modal-content" style={{ maxWidth: '640px' }}>
            <div className="safe-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Activity size={24} color="#0f766e" />
                <div>
                  <h2 className="safe-modal-title">Esigniva System Status</h2>
                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>● All Systems Fully Operational</span>
                </div>
              </div>
              <button className="safe-modal-close" onClick={() => setShowStatusModal(false)}>
                <XCircle size={24} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f0fdf4', 
                border: '1px solid #bbf7d0', 
                borderRadius: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#166534' }}>99.98% Overall Uptime</div>
                  <div style={{ fontSize: '0.8rem', color: '#15803d' }}>Measured over the last 90 continuous days</div>
                </div>
                <div style={{ padding: '0.35rem 0.75rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '1rem', fontWeight: 700, fontSize: '0.85rem' }}>
                  OPERATIONAL
                </div>
              </div>

              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#1e293b' }}>Core Service Components</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { name: 'Core API Gateway & Routing', uptime: '99.99%', status: 'Operational' },
                  { name: 'Document Signing & Interactive Canvas', uptime: '100%', status: 'Operational' },
                  { name: 'Audit Trail & Cryptographic Timestamping Engine', uptime: '100%', status: 'Operational' },
                  { name: 'Email & SMS Notification Dispatcher', uptime: '99.95%', status: 'Operational' },
                  { name: 'Encrypted Cloud Storage Vault (AES-256)', uptime: '100%', status: 'Operational' },
                  { name: 'Webhooks & Real-Time Event Dispatch', uptime: '99.98%', status: 'Operational' }
                ].map((svc, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.75rem 1rem', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>{svc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Uptime: {svc.uptime}</div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle size={14} /> {svc.status}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                <strong>Scheduled Maintenance:</strong> No maintenance scheduled for the next 7 days. Routine infrastructure updates occur on Sundays between 02:00 and 03:00 GMT with zero downtime failover.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Release Notes Modal */}
      {showReleaseNotesModal && (
        <div className="safe-contact-modal" style={{ zIndex: 1100 }}>
          <div className="safe-modal-overlay" onClick={() => setShowReleaseNotesModal(false)} />
          <div className="safe-modal-content" style={{ maxWidth: '680px' }}>
            <div className="safe-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Sparkles size={24} color="#0f766e" />
                <div>
                  <h2 className="safe-modal-title">Esigniva Release Notes</h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Changelog and Platform Improvements</span>
                </div>
              </div>
              <button className="safe-modal-close" onClick={() => setShowReleaseNotesModal(false)}>
                <XCircle size={24} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Release 2.4.0 */}
                <div style={{ borderLeft: '3px solid #0f766e', paddingLeft: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f766e' }}>Version 2.4.0</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', backgroundColor: '#e6fffa', color: '#0f766e', borderRadius: '1rem', fontWeight: 600 }}>Latest</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• October 2026</span>
                  </div>
                  <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
                    <li><strong>AI Document Field Detection:</strong> Automatically identifies standard contract signature lines, date spots, and participant names.</li>
                    <li><strong>Dynamic Watermarking:</strong> Protect sensitive documents with real-time viewer IP and timestamp watermarks.</li>
                    <li><strong>HMAC Webhook Signatures:</strong> Enhanced security with SHA-256 HMAC headers on every event webhook payload.</li>
                    <li><strong>Multi-Signer Sequence Engine:</strong> Complete control over parallel vs. step-by-step signing workflows.</li>
                  </ul>
                </div>

                {/* Release 2.3.5 */}
                <div style={{ borderLeft: '3px solid #94a3b8', paddingLeft: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>Version 2.3.5</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• September 2026</span>
                  </div>
                  <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
                    <li><strong>100MB File Engine:</strong> Support for large blueprints, multi-page financial filings, and high-resolution contracts.</li>
                    <li><strong>Audit Certificate 2.0:</strong> Cryptographic verification QR code embedded into the final page of every signed envelope.</li>
                    <li><strong>Self-Serve Unsubscribe & Preference Center:</strong> Clean management of notifications and newsletters.</li>
                  </ul>
                </div>

                {/* Release 2.3.0 */}
                <div style={{ borderLeft: '3px solid #94a3b8', paddingLeft: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>Version 2.3.0</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• August 2026</span>
                  </div>
                  <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
                    <li><strong>Enterprise Single Sign-On (SSO):</strong> SAML 2.0 and Google Workspace directory sync.</li>
                    <li><strong>Custom Branding:</strong> Dynamic company logo and tailored email templates for all recipient interactions.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Chat Modal */}
      {showLiveChatModal && (
        <div className="safe-contact-modal" style={{ zIndex: 1100 }}>
          <div className="safe-modal-overlay" onClick={() => setShowLiveChatModal(false)} />
          <div className="safe-modal-content" style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column' }}>
            <div className="safe-modal-header" style={{ backgroundColor: '#0f766e', color: 'white', borderRadius: '1rem 1rem 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageCircle size={20} color="white" />
                  </div>
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid #0f766e' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'white' }}>Esigniva Live Support</h3>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>Support Agent Online • Typical reply: Instant</span>
                </div>
              </div>
              <button 
                className="safe-modal-close" 
                onClick={() => setShowLiveChatModal(false)}
                style={{ color: 'white' }}
              >
                <XCircle size={24} />
              </button>
            </div>

            <div style={{ padding: '1rem', height: '320px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  style={{ 
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    padding: '0.75rem 1rem',
                    borderRadius: msg.sender === 'user' ? '1rem 1rem 0.2rem 1rem' : '1rem 1rem 1rem 0.2rem',
                    backgroundColor: msg.sender === 'user' ? '#0f766e' : 'white',
                    color: msg.sender === 'user' ? 'white' : '#1e293b',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Quick Prompts */}
            <div style={{ padding: '0.5rem 1rem', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {['How to add signers?', 'API documentation', 'Pricing plans'].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setChatMessages(prev => [...prev, { sender: 'user', text: prompt }]);
                    setTimeout(() => {
                      let r = "You can add multiple signers directly during upload or through templates!";
                      if (prompt.includes('API')) r = "Full REST API docs are available at /docs with SDKs in JS and Python.";
                      if (prompt.includes('Pricing')) r = "Check out our /pricing page for plans starting with 5 free documents/month.";
                      setChatMessages(prev => [...prev, { sender: 'bot', text: r }]);
                    }, 600);
                  }}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '1rem',
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleChatSend} style={{ display: 'flex', padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', backgroundColor: 'white' }}>
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem', padding: '0.5rem' }}
              />
              <button 
                type="submit" 
                style={{ background: '#0f766e', border: 'none', color: 'white', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Phone Support Modal */}
      {showPhoneModal && (
        <div className="safe-contact-modal" style={{ zIndex: 1100 }}>
          <div className="safe-modal-overlay" onClick={() => setShowPhoneModal(false)} />
          <div className="safe-modal-content" style={{ maxWidth: '520px' }}>
            <div className="safe-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={24} color="#10b981" />
                <div>
                  <h2 className="safe-modal-title">Esigniva Phone Support</h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Connect directly with a specialist</span>
                </div>
              </div>
              <button className="safe-modal-close" onClick={() => setShowPhoneModal(false)}>
                <XCircle size={24} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* UK & Global Number */}
                <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>UNITED KINGDOM & GLOBAL</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f766e' }}>+44 (0)20 7946 0192</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mon-Fri 08:00 - 20:00 GMT</div>
                  </div>
                  <a 
                    href="tel:+442079460192" 
                    className="safe-btn-primary" 
                    style={{ textDecoration: 'none', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '0.375rem', fontSize: '0.85rem' }}
                  >
                    <Phone size={14} /> Call Now
                  </a>
                </div>

                {/* US & Americas Number */}
                <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>NORTH AMERICA (TOLL-FREE)</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f766e' }}>+1 (800) 555-0199</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mon-Fri 09:00 - 18:00 EST</div>
                  </div>
                  <a 
                    href="tel:+18005550199" 
                    className="safe-btn-primary" 
                    style={{ textDecoration: 'none', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '0.375rem', fontSize: '0.85rem' }}
                  >
                    <Phone size={14} /> Call Now
                  </a>
                </div>
              </div>

              {/* Callback Option */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1e293b' }}>Prefer a Callback?</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0' }}>Leave your number and an e-signature consultant will contact you within 15 minutes.</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="tel" 
                    placeholder="Enter phone with country code" 
                    id="callbackPhoneInput"
                    style={{ flex: 1, padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.85rem' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      const input = document.getElementById('callbackPhoneInput');
                      if (!input?.value) {
                        Swal.fire({ icon: 'warning', title: 'Phone Required', text: 'Please enter your contact phone number.' });
                        return;
                      }
                      Swal.fire({ icon: 'success', title: 'Callback Scheduled', text: "Thank you! We'll call " + input.value + " within 15 minutes." });
                      setShowPhoneModal(false);
                    }}
                    style={{ padding: '0.6rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Request Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Base Styles */
        .safe-help-center {
          min-height: 100vh;
          background: #ffffff;
          font-family: "Inter", "Segoe UI", Arial, sans-serif;
          color: #111827;
        }

        .safe-help-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Header */
        .safe-help-header {
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
          padding: 3rem 0;
          position: relative;
        }

        .safe-header-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .safe-header-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin: 0 0 1rem;
        }

        .safe-header-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.95);
          margin: 0 0 2.5rem;
          line-height: 1.6;
        }

        /* Search */
        .safe-search-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }

        .safe-search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          z-index: 2;
        }

        .safe-search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 1rem;
          border: none;
          border-radius: 0.75rem;
          background: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          outline: none;
          transition: all 0.3s;
        }

        .safe-search-input:focus {
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
          outline: 2px solid #0f766e;
        }

        .safe-search-btn {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          padding: 0.625rem 1.25rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-search-btn:hover {
          background: #0f766e;
        }

        /* Search Results */
        .safe-search-results {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin-top: 1rem;
          animation: safe-slide-down 0.3s ease;
        }

        @keyframes safe-slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .safe-results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .safe-results-count {
          font-weight: 600;
          color: #0f766e;
        }

        .safe-results-list {
          padding: 0.5rem 0;
        }

        .safe-result-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .safe-result-item:hover {
          background: #f9fafb;
        }

        .safe-result-content h4 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-result-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .safe-result-category {
          text-transform: capitalize;
        }

        .safe-no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          color: #6b7280;
          text-align: center;
        }

        .safe-no-results p {
          margin-top: 1rem;
          font-size: 0.875rem;
        }

        /* Main Content */
        .safe-help-main {
          padding: 3rem 0;
        }

        /* Categories */
        .safe-categories-section {
          margin-bottom: 3rem;
        }

        .safe-section-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 2rem;
        }

        .safe-categories-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .safe-category-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .safe-category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
          border-color: #0f766e;
        }

        .safe-category-active {
          border-color: #0f766e;
          background: #f0fdfa;
        }

        .safe-category-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .safe-category-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-category-desc {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 1rem;
          line-height: 1.5;
        }

        .safe-category-badge {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: #f3f4f6;
          color: #6b7280;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Content Grid */
        .safe-help-content-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 3rem;
          align-items: start;
        }

        /* Popular Articles */
        .safe-section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          color: #0f766e;
        }

        .safe-popular-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 3rem;
        }

        .safe-popular-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.25rem;
          transition: all 0.3s;
        }

        .safe-popular-card:hover {
          border-color: #0f766e;
          transform: translateX(4px);
        }

        .safe-popular-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-popular-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .safe-article-category {
          text-transform: capitalize;
        }

        .safe-view-article-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 1rem;
          background: #f0fdfa;
          color: #0f766e;
          border: 1px solid #d1fae5;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .safe-view-article-btn:hover {
          background: #0f766e;
          color: white;
        }

        /* FAQs */
        .safe-faqs-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-faq-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
          transition: all 0.3s;
        }

        .safe-faq-item:hover {
          border-color: #0f766e;
        }

        .safe-faq-question {
          width: 100%;
          padding: 1.25rem;
          background: transparent;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #111827;
          text-align: left;
          transition: background 0.2s;
        }

        .safe-faq-question:hover {
          background: #f9fafb;
        }

        .safe-faq-text {
          flex: 1;
          padding-right: 1rem;
        }

        .safe-faq-arrow {
          color: #6b7280;
          transition: transform 0.3s;
          flex-shrink: 0;
        }

        .safe-arrow-expanded {
          transform: rotate(180deg);
          color: #0f766e;
        }

        .safe-faq-answer {
          padding: 0 1.25rem 1.25rem;
        }

        .safe-answer-text {
          font-size: 0.875rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0 0 1rem;
        }

        .safe-faq-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .safe-tag {
          padding: 0.25rem 0.75rem;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Sidebar */
        .safe-help-sidebar {
          position: sticky;
          top: 1rem;
        }

        .safe-sidebar-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .safe-sidebar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1rem;
        }

        /* Quick Links */
        .safe-quick-links {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .safe-quick-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: #4b5563;
          text-decoration: none;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .safe-quick-link:hover {
          background: #f9fafb;
          color: #0f766e;
          transform: translateX(4px);
        }

        .safe-quick-link span {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Contact Methods */
        .safe-contact-methods {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .safe-contact-method {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .safe-contact-method:hover {
          border-color: #0f766e;
          background: #f9fafb;
        }

        .safe-contact-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .safe-contact-info {
          flex: 1;
        }

        .safe-contact-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.125rem;
        }

        .safe-contact-desc {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0 0 0.5rem;
        }

        .safe-contact-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .safe-contact-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .safe-contact-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-contact-btn:hover {
          background: #0f766e;
          transform: translateY(-2px);
        }

        /* Status */
        .safe-status-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .safe-status-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-status-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          font-size: 0.875rem;
          border-radius: 0.5rem;
        }

        .safe-status-operational {
          background: #f0fdfa;
          color: #0f766e;
        }

        .safe-status-updated {
          background: #fef3c7;
          color: #92400e;
        }

        /* Contact Modal */
        .safe-contact-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .safe-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .safe-modal-content {
          position: relative;
          background: white;
          border-radius: 1rem;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          animation: safe-modal-appear 0.3s ease;
        }

        @keyframes safe-modal-appear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .safe-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .safe-modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .safe-modal-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .safe-modal-close:hover {
          color: #ef4444;
          background: #fef2f2;
        }

        /* Contact Form */
        .safe-contact-form {
          padding: 1.5rem;
        }

        .safe-form-group {
          margin-bottom: 1.5rem;
        }

        .safe-form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .safe-form-group input,
        .safe-form-group select,
        .safe-form-group textarea {
          width: 100%;
          padding: 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .safe-form-group input:focus,
        .safe-form-group select:focus,
        .safe-form-group textarea:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .safe-form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .safe-form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .safe-btn-primary {
          flex: 1;
          padding: 0.75rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-btn-primary:hover:not(:disabled) {
          background: #0f766e;
        }

        .safe-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .safe-btn-secondary {
          flex: 1;
          padding: 0.75rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-btn-secondary:hover {
          background: #e5e7eb;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .safe-categories-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .safe-help-content-grid {
            grid-template-columns: 1fr;
          }
          
          .safe-help-sidebar {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .safe-header-title {
            font-size: 2rem;
          }
          
          .safe-section-title {
            font-size: 1.5rem;
          }
          
          .safe-categories-grid {
            grid-template-columns: 1fr;
          }
          
          .safe-help-container {
            padding: 0 1rem;
          }
        }

        @media (max-width: 640px) {
          .safe-header-title {
            font-size: 1.75rem;
          }
          
          .safe-header-subtitle {
            font-size: 1rem;
          }
          
          .safe-form-actions {
            flex-direction: column;
          }
          
          .safe-popular-card {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          
          .safe-view-article-btn {
            width: 100%;
            justify-content: center;
          }
        }

        /* Print Styles */
        @media print {
          .safe-help-header {
            background: white !important;
            color: black !important;
          }
          
          .safe-search-wrapper,
          .safe-contact-btn,
          .safe-modal-close {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HelpCenter;
