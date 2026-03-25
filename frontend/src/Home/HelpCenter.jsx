import React, { useState, useEffect, useRef } from 'react';
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
  BookOpen
} from 'lucide-react';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [showContactForm, setShowContactForm] = useState(false);
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
      color: '#0d9488',
      description: 'Learn the basics of SafeSign'
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
      views: '12.4k'
    },
    {
      id: 'article-2',
      title: 'Understanding Legal Compliance for E-Signatures',
      category: 'security-privacy',
      readTime: '5 min',
      views: '8.7k'
    },
    {
      id: 'article-3',
      title: 'Setting Up Team Members and Permissions',
      category: 'team-collaboration',
      readTime: '4 min',
      views: '6.2k'
    },
    {
      id: 'article-4',
      title: 'Troubleshooting Common Signing Issues',
      category: 'signing-documents',
      readTime: '4 min',
      views: '10.1k'
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
        question: 'Is SafeSign legally binding?',
        answer: 'Yes, SafeSign complies with ESIGN, UETA, eIDAS, and other global e-signature laws. All signatures are court-admissible and legally binding worldwide. We provide detailed audit trails and certificate of completion for every signed document.',
        tags: ['legal', 'compliance', 'security']
      },
      {
        question: 'What file formats are supported?',
        answer: 'SafeSign supports PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, and image files (JPG, PNG, TIFF). Maximum file size is 100MB per document. For optimal results, we recommend using PDF format.',
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
        question: 'How secure is my data with SafeSign?',
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
      details: 'support@safesign.com',
      responseTime: 'Within 4 hours',
      color: '#0d9488'
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
      details: '+1 (800) 123-4567',
      responseTime: 'Within 15 minutes',
      color: '#10b981'
    }
  ];

  const quickLinks = [
    { label: 'API Documentation', href: '/api-docs', icon: <Book size={20} /> },
    { label: 'Pricing Plans', href: '/pricing', icon: <CreditCard size={20} /> },
    { label: 'System Status', href: '/status', icon: <Globe size={20} /> },
    { label: 'Release Notes', href: '/releases', icon: <AlertCircle size={20} /> }
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    alert('Your message has been sent! We\'ll get back to you within 4 hours.');
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

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const filteredArticles = popularArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="safe-help-center">
      {/* Header */}
      <header className="safe-help-header">
        <div className="safe-help-container">
          <div className="safe-header-content">
            <h1 className="safe-header-title">
              <HelpCircle size={32} />
              SafeSign Help Center
            </h1>
            <p className="safe-header-subtitle">
              Find answers, guides, and troubleshooting tips for all things SafeSign
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
              <button className="safe-search-btn">Search</button>
            </div>
            
            {searchQuery && (
              <div className="safe-search-results">
                <div className="safe-results-header">
                  <span>Search results for "{searchQuery}"</span>
                  <span className="safe-results-count">{filteredArticles.length} articles found</span>
                </div>
                {filteredArticles.length > 0 ? (
                  <div className="safe-results-list">
                    {filteredArticles.map(article => (
                      <div key={article.id} className="safe-result-item">
                        <div className="safe-result-content">
                          <h4>{article.title}</h4>
                          <div className="safe-result-meta">
                            <span className="safe-result-category">{article.category.replace('-', ' ')}</span>
                            <span className="safe-result-readtime">{article.readTime} read</span>
                            <span className="safe-result-views">{article.views} views</span>
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
                    <article key={article.id} className="safe-popular-card">
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
                      <button className="safe-view-article-btn">
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
                    <a key={link.label} href={link.href} className="safe-quick-link">
                      {link.icon}
                      <span>{link.label}</span>
                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Contact Methods */}
              <div className="safe-sidebar-card">
                <h3 className="safe-sidebar-title">Contact Support</h3>
                <div className="safe-contact-methods">
                  {contactMethods.map(method => (
                    <div key={method.type} className="safe-contact-method">
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
              <div className="safe-sidebar-card">
                <div className="safe-status-header">
                  <Globe size={20} />
                  <h3 className="safe-sidebar-title">System Status</h3>
                </div>
                <div className="safe-status-list">
                  <div className="safe-status-item safe-status-operational">
                    <CheckCircle size={16} />
                    <span>All Systems Operational</span>
                  </div>
                  <div className="safe-status-item safe-status-updated">
                    <Clock size={16} />
                    <span>Last updated: Just now</span>
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

      <style jsx>{`
        /* Base Styles */
        .safe-help-center {
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
        }

        .safe-help-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Header */
        .safe-help-header {
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
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
          outline: 2px solid #0d9488;
        }

        .safe-search-btn {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          padding: 0.625rem 1.25rem;
          background: #0d9488;
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
          color: #0d9488;
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
          border-color: #0d9488;
        }

        .safe-category-active {
          border-color: #0d9488;
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
          color: #0d9488;
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
          border-color: #0d9488;
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
          color: #0d9488;
          border: 1px solid #d1fae5;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .safe-view-article-btn:hover {
          background: #0d9488;
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
          border-color: #0d9488;
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
          color: #0d9488;
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
          color: #0d9488;
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
          border-color: #0d9488;
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
          background: #0d9488;
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
          color: #0d9488;
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
          border-color: #0d9488;
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
          background: #0d9488;
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