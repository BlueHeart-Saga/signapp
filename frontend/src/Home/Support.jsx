import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Search,
  GitBranch,
  ChevronDown,
  FileText,
  Video,
  Book,
  Shield,
  Users,
  Zap,
  Globe,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  PlayIcon,
  Star,
  Award,
  Download,
  Share2,
  Bookmark,
  ThumbsUp,
  MessageCircle,
  Headphones,
  LifeBuoy,
  Bot,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Briefcase,
  CreditCard,
  Settings,
  Database,
  Code,
  Lock
} from 'lucide-react';

const Support = () => {
  const [activeTab, setActiveTab] = useState('contact');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [ticketPriority, setTicketPriority] = useState('normal');
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const supportStats = [
    { icon: <MessageSquare size={20} />, label: 'Avg. Response Time', value: 'Under 2 hours' },
    { icon: <CheckCircle size={20} />, label: 'Satisfaction Rate', value: '98%' },
    { icon: <Users size={20} />, label: 'Support Engineers', value: '24/7' },
    { icon: <Globe size={20} />, label: 'Global Coverage', value: '150+ countries' }
  ];

  const supportChannels = [
    {
      id: 'live-chat',
      title: 'Live Chat',
      icon: <MessageCircle size={24} />,
      color: '#0d9488',
      description: 'Instant chat with our support team',
      availability: '24/7',
      responseTime: 'Under 2 minutes',
      bestFor: 'Quick questions & troubleshooting'
    },
    {
      id: 'email',
      title: 'Email Support',
      icon: <Mail size={24} />,
      color: '#3b82f6',
      description: 'Detailed support via email',
      availability: '24/7',
      responseTime: 'Under 2 hours',
      bestFor: 'Complex issues & documentation'
    },
    {
      id: 'phone',
      title: 'Phone Support',
      icon: <Phone size={24} />,
      color: '#10b981',
      description: 'Direct phone conversation',
      availability: 'Business Hours',
      responseTime: 'Under 15 minutes',
      bestFor: 'Urgent issues & detailed discussions'
    },
    {
      id: 'enterprise',
      title: 'Enterprise Support',
      icon: <Headphones size={24} />,
      color: '#8b5cf6',
      description: 'Dedicated support team',
      availability: '24/7',
      responseTime: 'Under 30 minutes',
      bestFor: 'Enterprise customers'
    }
  ];

  const quickLinks = [
    { title: 'API Documentation', icon: <Code size={18} />, link: '/docs', category: 'developers' },
    { title: 'Security Center', icon: <Shield size={18} />, link: '/security', category: 'security' },
    { title: 'Billing Help', icon: <CreditCard size={18} />, link: '/billing', category: 'account' },
    { title: 'System Status', icon: <Globe size={18} />, link: '/status', category: 'status' },
    { title: 'Video Tutorials', icon: <Video size={18} />, link: '/tutorials', category: 'learning' },
    { title: 'Community Forum', icon: <Users size={18} />, link: '/community', category: 'community' }
  ];

  const popularArticles = [
    {
      id: 1,
      title: 'How to reset your account password',
      category: 'account',
      readTime: '3 min',
      views: '15.2k'
    },
    {
      id: 2,
      title: 'Troubleshooting common signing errors',
      category: 'troubleshooting',
      readTime: '5 min',
      views: '12.8k'
    },
    {
      id: 3,
      title: 'API authentication guide',
      category: 'developers',
      readTime: '8 min',
      views: '9.4k'
    },
    {
      id: 4,
      title: 'Security and compliance overview',
      category: 'security',
      readTime: '10 min',
      views: '7.6k'
    }
  ];

  const faqCategories = [
    {
      id: 'account',
      title: 'Account & Billing',
      icon: <UserCheck size={20} />,
      questions: [
        {
          q: 'How do I upgrade or downgrade my plan?',
          a: 'You can change your plan at any time from the Billing section in your account settings. Changes are prorated, and you\'ll only pay for the time you use on each plan.'
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise plans. All payments are secured with 256-bit encryption.'
        },
        {
          q: 'Can I cancel my subscription anytime?',
          a: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period, and we\'ll prorate any unused time for annual plans.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: <Settings size={20} />,
      questions: [
        {
          q: 'What are the system requirements for SafeSign?',
          a: 'SafeSign works on all modern browsers (Chrome, Firefox, Safari, Edge) and on any device with internet access. No software installation is required for signers.'
        },
        {
          q: 'How do I integrate SafeSign with my application?',
          a: 'We provide comprehensive REST APIs, webhooks, and SDKs for popular programming languages. Check our API documentation for detailed integration guides.'
        },
        {
          q: 'What file formats are supported?',
          a: 'SafeSign supports PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, and TIFF files. Maximum file size is 100MB per document.'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      icon: <Lock size={20} />,
      questions: [
        {
          q: 'Is SafeSign compliant with global regulations?',
          a: 'Yes, SafeSign complies with ESIGN, UETA, eIDAS, GDPR, HIPAA, and other global regulations. We provide comprehensive audit trails for all documents.'
        },
        {
          q: 'How is my data protected?',
          a: 'We use bank-level 256-bit AES encryption, SOC 2 Type II compliance, regular security audits, and secure data centers with redundant backups.'
        },
        {
          q: 'Do you offer HIPAA compliance?',
          a: 'Yes, we offer HIPAA-compliant plans with Business Associate Agreements (BAAs). Contact our sales team for more information.'
        }
      ]
    }
  ];

  const supportTiers = [
    {
      name: 'Basic',
      responseTime: '24 hours',
      channels: ['Email'],
      features: ['Standard support', 'Community access', 'Basic documentation'],
      price: 'Free'
    },
    {
      name: 'Pro',
      responseTime: '4 hours',
      channels: ['Email', 'Live Chat'],
      features: ['Priority support', 'Phone callback', 'Advanced troubleshooting'],
      price: 'Included'
    },
    {
      name: 'Business',
      responseTime: '2 hours',
      channels: ['Email', 'Live Chat', 'Phone'],
      features: ['24/7 support', 'Dedicated engineer', 'SLA guarantee'],
      price: 'Included'
    },
    {
      name: 'Enterprise',
      responseTime: '30 minutes',
      channels: ['All channels', 'Direct line'],
      features: ['Dedicated team', 'Custom SLA', 'On-call engineer'],
      price: 'Custom'
    }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert('Support ticket submitted! We\'ll get back to you soon.');
    setContactData({ name: '', email: '', subject: '', message: '' });
    setShowContactForm(false);
  };

  const toggleFaq = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setExpandedFaq(expandedFaq === key ? null : key);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="safe-support">
      {/* Hero Section */}
      <section className="safe-support-hero">
        <div className="safe-support-container">
          <div className="safe-hero-content">
            <div className="safe-hero-badge">
              <LifeBuoy size={20} />
              <span>SafeSign Support Center</span>
            </div>
            <h1 className="safe-hero-title">How can we help you today?</h1>
            <p className="safe-hero-subtitle">
              Get instant help from our support team, explore documentation, or connect with our community
            </p>
            
            {/* Search */}
            <div className="safe-support-search">
              <Search className="safe-search-icon" />
              <input
                type="text"
                placeholder="Search for help articles, troubleshooting guides, or contact support..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="safe-search-input"
              />
              <button className="safe-search-btn">Search</button>
            </div>
            
            {/* Stats */}
            <div className="safe-hero-stats">
              {supportStats.map((stat, index) => (
                <div key={index} className="safe-stat-card">
                  <div className="safe-stat-icon">
                    {stat.icon}
                  </div>
                  <div className="safe-stat-content">
                    <div className="safe-stat-value">{stat.value}</div>
                    <div className="safe-stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="safe-tabs-nav">
        <div className="safe-support-container">
          <div className="safe-tabs-wrapper">
            <button
              className={`safe-tab-btn ${activeTab === 'contact' ? 'safe-tab-active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              <MessageSquare size={18} />
              Contact Support
            </button>
            <button
              className={`safe-tab-btn ${activeTab === 'guides' ? 'safe-tab-active' : ''}`}
              onClick={() => setActiveTab('guides')}
            >
              <Book size={18} />
              Guides & Tutorials
            </button>
            <button
              className={`safe-tab-btn ${activeTab === 'faq' ? 'safe-tab-active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              <HelpCircle size={18} />
              FAQs
            </button>
            <button
              className={`safe-tab-btn ${activeTab === 'status' ? 'safe-tab-active' : ''}`}
              onClick={() => setActiveTab('status')}
            >
              <Globe size={18} />
              System Status
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="safe-support-main">
        <div className="safe-support-container">
          {/* Contact Support Tab */}
          {activeTab === 'contact' && (
            <div className="safe-contact-tab">
              <div className="safe-contact-grid">
                {/* Support Channels */}
                <div className="safe-channels-section">
                  <h2 className="safe-section-title">Choose Your Support Channel</h2>
                  <p className="safe-section-subtitle">Select the best way to get help based on your needs</p>
                  
                  <div className="safe-channels-grid">
                    {supportChannels.map(channel => (
                      <div key={channel.id} className="safe-channel-card">
                        <div className="safe-channel-header">
                          <div className="safe-channel-icon" style={{ backgroundColor: `${channel.color}15` }}>
                            <span style={{ color: channel.color }}>{channel.icon}</span>
                          </div>
                          <div className="safe-channel-info">
                            <h3 className="safe-channel-title">{channel.title}</h3>
                            <p className="safe-channel-desc">{channel.description}</p>
                          </div>
                        </div>
                        
                        <div className="safe-channel-details">
                          <div className="safe-channel-detail">
                            <Clock size={14} />
                            <span><strong>Availability:</strong> {channel.availability}</span>
                          </div>
                          <div className="safe-channel-detail">
                            <Zap size={14} />
                            <span><strong>Response Time:</strong> {channel.responseTime}</span>
                          </div>
                          <div className="safe-channel-detail">
                            <Target size={14} />
                            <span><strong>Best For:</strong> {channel.bestFor}</span>
                          </div>
                        </div>
                        
                        <button 
                          className="safe-channel-btn"
                          onClick={() => {
                            if (channel.id === 'live-chat') {
                              alert('Live chat opened! A support agent will be with you shortly.');
                            } else if (channel.id === 'email') {
                              setShowContactForm(true);
                            } else if (channel.id === 'phone') {
                              window.open('tel:+18001234567');
                            } else {
                              window.open('/enterprise-support');
                            }
                          }}
                        >
                          {channel.id === 'live-chat' ? 'Start Live Chat' : 
                           channel.id === 'email' ? 'Send Email' :
                           channel.id === 'phone' ? 'Call Now' : 'Contact Sales'}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="safe-quick-links-section">
                  <h3 className="safe-sidebar-title">Quick Resources</h3>
                  <div className="safe-quick-links-grid">
                    {quickLinks.map((link, index) => (
                      <a key={index} href={link.link} className="safe-quick-link">
                        <div className="safe-link-icon">
                          {link.icon}
                        </div>
                        <div className="safe-link-text">
                          <span className="safe-link-title">{link.title}</span>
                          <span className="safe-link-category">{link.category}</span>
                        </div>
                        <ExternalLink size={14} />
                      </a>
                    ))}
                  </div>
                  
                  {/* Support Tiers */}
                  <div className="safe-tiers-section">
                    <h3 className="safe-sidebar-title">Support Tiers</h3>
                    <div className="safe-tiers-list">
                      {supportTiers.map((tier, index) => (
                        <div key={index} className="safe-tier-card">
                          <div className="safe-tier-header">
                            <h4 className="safe-tier-name">{tier.name}</h4>
                            <div className="safe-tier-response">
                              <Clock size={12} />
                              {tier.responseTime}
                            </div>
                          </div>
                          <div className="safe-tier-channels">
                            {tier.channels.map((channel, i) => (
                              <span key={i} className="safe-channel-tag">{channel}</span>
                            ))}
                          </div>
                          <div className="safe-tier-features">
                            {tier.features.map((feature, i) => (
                              <div key={i} className="safe-feature-item">
                                <CheckCircle size={12} />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                          <div className="safe-tier-price">{tier.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guides & Tutorials Tab */}
          {activeTab === 'guides' && (
            <div className="safe-guides-tab">
              <div className="safe-guides-header">
                <div className="safe-guides-title-section">
                  <h2 className="safe-section-title">Guides & Tutorials</h2>
                  <p className="safe-section-subtitle">Step-by-step guides to help you get the most out of SafeSign</p>
                </div>
                <div className="safe-guides-filters">
                  <div className="safe-category-filters">
                    <span className="safe-filter-label">Filter by:</span>
                    {['All', 'Getting Started', 'API', 'Security', 'Account', 'Troubleshooting'].map(cat => (
                      <button key={cat} className="safe-category-filter">
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="safe-guides-grid">
                {/* Popular Articles */}
                <div className="safe-popular-guides">
                  <h3 className="safe-section-subtitle">Most Popular Articles</h3>
                  <div className="safe-articles-list">
                    {popularArticles.map(article => (
                      <div key={article.id} className="safe-article-card">
                        <div className="safe-article-header">
                          <span className="safe-article-category">{article.category}</span>
                          <div className="safe-article-meta">
                            <span className="safe-article-time">
                              <Clock size={12} />
                              {article.readTime}
                            </span>
                            <span className="safe-article-views">
                              {article.views} views
                            </span>
                          </div>
                        </div>
                        <h4 className="safe-article-title">{article.title}</h4>
                        <p className="safe-article-excerpt">
                          Learn how to resolve common issues and get back to signing documents quickly...
                        </p>
                        <div className="safe-article-actions">
                          <button className="safe-read-btn">Read Guide</button>
                          <button className="safe-save-btn">
                            <Bookmark size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Video Tutorials */}
                <div className="safe-video-tutorials">
                  <h3 className="safe-section-subtitle">Video Tutorials</h3>
                  <div className="safe-videos-grid">
                    {[
                      { title: 'Getting Started Guide', duration: '5:32', views: '24K' },
                      { title: 'API Integration Basics', duration: '12:15', views: '18K' },
                      { title: 'Security Features Tour', duration: '8:47', views: '15K' },
                      { title: 'Advanced Workflows', duration: '15:30', views: '12K' }
                    ].map((video, index) => (
                      <div key={index} className="safe-video-card">
                        <div className="safe-video-thumbnail">
                          <div className="safe-video-overlay">
                            <PlayIcon />
                          </div>
                        </div>
                        <div className="safe-video-info">
                          <h4 className="safe-video-title">{video.title}</h4>
                          <div className="safe-video-meta">
                            <span className="safe-video-duration">{video.duration}</span>
                            <span className="safe-video-views">{video.views} views</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Documentation Links */}
                <div className="safe-docs-links">
                  <h3 className="safe-section-subtitle">Documentation</h3>
                  <div className="safe-docs-list">
                    {[
                      { title: 'API Reference', icon: <Code size={18} />, pages: 45 },
                      { title: 'Security Guide', icon: <Shield size={18} />, pages: 28 },
                      { title: 'Integration Guides', icon: <GitBranch size={18} />, pages: 32 },
                      { title: 'Compliance Docs', icon: <FileText size={18} />, pages: 19 }
                    ].map((doc, index) => (
                      <a key={index} href="#" className="safe-doc-link">
                        <div className="safe-doc-icon">
                          {doc.icon}
                        </div>
                        <div className="safe-doc-info">
                          <div className="safe-doc-title">{doc.title}</div>
                          <div className="safe-doc-pages">{doc.pages} pages</div>
                        </div>
                        <ExternalLink size={14} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="safe-faq-tab">
              <div className="safe-faq-header">
                <h2 className="safe-section-title">Frequently Asked Questions</h2>
                <p className="safe-section-subtitle">Find quick answers to common questions</p>
              </div>
              
              <div className="safe-faq-categories">
                {faqCategories.map((category, catIndex) => (
                  <div key={category.id} className="safe-faq-category">
                    <div className="safe-category-header">
                      <div className="safe-category-icon">
                        {category.icon}
                      </div>
                      <h3 className="safe-category-title">{category.title}</h3>
                    </div>
                    
                    <div className="safe-category-questions">
                      {category.questions.map((faq, qIndex) => {
                        const key = `${catIndex}-${qIndex}`;
                        const isExpanded = expandedFaq === key;
                        
                        return (
                          <div key={key} className="safe-faq-item">
                            <button
                              className="safe-faq-question"
                              onClick={() => toggleFaq(catIndex, qIndex)}
                            >
                              <span className="safe-faq-text">{faq.q}</span>
                              <ChevronDown className={`safe-faq-arrow ${isExpanded ? 'safe-arrow-expanded' : ''}`} />
                            </button>
                            
                            {isExpanded && (
                              <div className="safe-faq-answer">
                                <p className="safe-answer-text">{faq.a}</p>
                                <div className="safe-faq-actions">
                                  <button className="safe-helpful-btn">
                                    <ThumbsUp size={14} />
                                    Helpful
                                  </button>
                                  <button className="safe-share-btn">
                                    <Share2 size={14} />
                                    Share
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Still Need Help */}
              <div className="safe-need-help">
                <div className="safe-help-content">
                  <AlertCircle size={32} />
                  <div className="safe-help-text">
                    <h3 className="safe-help-title">Still need help?</h3>
                    <p className="safe-help-subtitle">Can't find what you're looking for? Our support team is ready to assist you.</p>
                  </div>
                  <button 
                    className="safe-help-btn"
                    onClick={() => setActiveTab('contact')}
                  >
                    Contact Support
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Status Tab */}
          {activeTab === 'status' && (
            <div className="safe-status-tab">
              <div className="safe-status-header">
                <div className="safe-status-title-section">
                  <h2 className="safe-section-title">System Status</h2>
                  <p className="safe-section-subtitle">Current status of SafeSign services and infrastructure</p>
                </div>
                <div className="safe-status-updated">
                  <Clock size={16} />
                  Last updated: Just now
                </div>
              </div>
              
              <div className="safe-status-overview">
                <div className="safe-overall-status">
                  <div className="safe-status-indicator safe-status-operational">
                    <CheckCircle size={24} />
                    <div className="safe-status-info">
                      <div className="safe-status-label">All Systems Operational</div>
                      <div className="safe-status-desc">All services are running normally</div>
                    </div>
                  </div>
                </div>
                
                <div className="safe-services-status">
                  <h3 className="safe-services-title">Service Status</h3>
                  <div className="safe-services-grid">
                    {[
                      { name: 'API Services', status: 'operational', uptime: '99.99%' },
                      { name: 'Web Application', status: 'operational', uptime: '99.98%' },
                      { name: 'Document Processing', status: 'operational', uptime: '99.97%' },
                      { name: 'Email Delivery', status: 'operational', uptime: '99.96%' },
                      { name: 'Database Services', status: 'operational', uptime: '99.99%' },
                      { name: 'File Storage', status: 'operational', uptime: '99.98%' }
                    ].map((service, index) => (
                      <div key={index} className="safe-service-card">
                        <div className="safe-service-header">
                          <div className="safe-service-name">{service.name}</div>
                          <div className={`safe-service-status safe-status-${service.status}`}>
                            {service.status === 'operational' ? 'Operational' : 'Degraded'}
                          </div>
                        </div>
                        <div className="safe-service-meta">
                          <span className="safe-service-uptime">
                            <TrendingUp size={12} />
                            {service.uptime} uptime
                          </span>
                          <a href="#" className="safe-service-details">View Details</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Incident History */}
                <div className="safe-incident-history">
                  <h3 className="safe-incidents-title">Recent Incidents</h3>
                  <div className="safe-incidents-list">
                    <div className="safe-incident-item safe-incident-resolved">
                      <div className="safe-incident-status">Resolved</div>
                      <div className="safe-incident-info">
                        <div className="safe-incident-title">API Latency Issues</div>
                        <div className="safe-incident-time">Jan 15, 2025 • 14:30 - 16:45 EST</div>
                      </div>
                    </div>
                    <div className="safe-incident-item safe-incident-resolved">
                      <div className="safe-incident-status">Resolved</div>
                      <div className="safe-incident-info">
                        <div className="safe-incident-title">Scheduled Maintenance</div>
                        <div className="safe-incident-time">Jan 10, 2025 • 02:00 - 04:00 EST</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="safe-contact-modal">
          <div className="safe-modal-overlay" onClick={() => setShowContactForm(false)} />
          <div className="safe-modal-content">
            <div className="safe-modal-header">
              <h2 className="safe-modal-title">Submit Support Request</h2>
              <button 
                className="safe-modal-close"
                onClick={() => setShowContactForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleContactSubmit} className="safe-contact-form">
              <div className="safe-form-grid">
                <div className="safe-form-group">
                  <label htmlFor="name">Full Name *</label>
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
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactData.email}
                    onChange={handleContactChange}
                    required
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
              
              <div className="safe-form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={contactData.subject}
                  onChange={handleContactChange}
                  required
                  placeholder="Brief description of your issue"
                />
              </div>
              
              <div className="safe-form-group">
                <label htmlFor="priority">Priority Level</label>
                <div className="safe-priority-buttons">
                  {['Low', 'Normal', 'High', 'Urgent'].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`safe-priority-btn ${ticketPriority === level.toLowerCase() ? 'safe-priority-active' : ''}`}
                      onClick={() => setTicketPriority(level.toLowerCase())}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="safe-form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={contactData.message}
                  onChange={handleContactChange}
                  required
                  rows={6}
                  placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, and what you've tried so far."
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
                <button type="submit" className="safe-btn-primary">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Base Styles */
        .safe-support {
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
        }

        .safe-support-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Hero Section */
        .safe-support-hero {
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
          margin: 0 auto 2.5rem;
          max-width: 600px;
          line-height: 1.6;
        }

        /* Search */
        .safe-support-search {
          position: relative;
          max-width: 600px;
          margin: 0 auto 3rem;
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

        /* Stats */
        .safe-hero-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 2rem;
        }

        @media (min-width: 768px) {
          .safe-hero-stats {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .safe-stat-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          padding: 1.5rem;
          backdrop-filter: blur(8px);
          transition: all 0.3s;
        }

        .safe-stat-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.15);
        }

        .safe-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          margin: 0 auto 1rem;
          color: white;
        }

        .safe-stat-content {
          text-align: center;
        }

        .safe-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.25rem;
        }

        .safe-stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
        }

        /* Tabs Navigation */
        .safe-tabs-nav {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .safe-tabs-wrapper {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 1rem 0;
        }

        .safe-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #f9fafb;
          color: #6b7280;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .safe-tab-btn:hover {
          background: #f3f4f6;
        }

        .safe-tab-active {
          background: #0d9488;
          color: white;
        }

        /* Main Content */
        .safe-support-main {
          padding: 3rem 0;
        }

        .safe-section-title {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-section-subtitle {
          font-size: 1rem;
          color: #6b7280;
          margin: 0 0 2rem;
        }

        /* Contact Tab */
        .safe-contact-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 3rem;
        }

        @media (max-width: 1024px) {
          .safe-contact-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Support Channels */
        .safe-channels-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .safe-channels-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-channel-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .safe-channel-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
          border-color: #0d9488;
        }

        .safe-channel-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .safe-channel-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .safe-channel-info {
          flex: 1;
        }

        .safe-channel-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem;
        }

        .safe-channel-desc {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .safe-channel-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .safe-channel-detail {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .safe-channel-detail strong {
          font-weight: 600;
          margin-right: 0.25rem;
        }

        .safe-channel-btn {
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

        .safe-channel-btn:hover {
          background: #0f766e;
        }

        /* Quick Links */
        .safe-quick-links-section {
          position: sticky;
          top: 6rem;
        }

        .safe-sidebar-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem;
        }

        .safe-quick-links-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .safe-quick-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f9fafb;
          color: #4b5563;
          text-decoration: none;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .safe-quick-link:hover {
          background: #f3f4f6;
          color: #0d9488;
          transform: translateX(4px);
        }

        .safe-link-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d9488;
          flex-shrink: 0;
        }

        .safe-link-text {
          flex: 1;
        }

        .safe-link-title {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.125rem;
        }

        .safe-link-category {
          font-size: 0.75rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Support Tiers */
        .safe-tiers-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .safe-tier-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1rem;
        }

        .safe-tier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .safe-tier-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-tier-response {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .safe-tier-channels {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .safe-channel-tag {
          padding: 0.125rem 0.5rem;
          background: #f3f4f6;
          color: #4b5563;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .safe-tier-features {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .safe-feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #4b5563;
        }

        .safe-tier-price {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0d9488;
          text-align: right;
        }

        /* Guides Tab */
        .safe-guides-header {
          margin-bottom: 2rem;
        }

        .safe-guides-filters {
          margin-top: 1rem;
        }

        .safe-category-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .safe-filter-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .safe-category-filter {
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-category-filter:hover {
          background: #e5e7eb;
        }

        .safe-guides-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .safe-guides-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-popular-guides,
        .safe-video-tutorials,
        .safe-docs-links {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .safe-articles-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .safe-article-card {
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .safe-article-card:hover {
          border-color: #0d9488;
          transform: translateX(4px);
        }

        .safe-article-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .safe-article-category {
          padding: 0.125rem 0.75rem;
          background: #f3f4f6;
          color: #4b5563;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .safe-article-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .safe-article-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-article-excerpt {
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0 0 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .safe-article-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .safe-read-btn {
          padding: 0.5rem 1rem;
          background: #0d9488;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-read-btn:hover {
          background: #0f766e;
        }

        .safe-save-btn {
          padding: 0.5rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-save-btn:hover {
          background: #e5e7eb;
          color: #0d9488;
        }

        /* Video Tutorials */
        .safe-videos-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .safe-videos-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-video-card {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
          transition: all 0.2s;
        }

        .safe-video-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .safe-video-thumbnail {
          height: 120px;
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
          position: relative;
        }

        .safe-video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
        }

        .safe-video-info {
          padding: 0.75rem;
        }

        .safe-video-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem;
          line-height: 1.4;
        }

        .safe-video-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* Docs Links */
        .safe-docs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .safe-doc-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: #4b5563;
          text-decoration: none;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .safe-doc-link:hover {
          background: #f9fafb;
          color: #0d9488;
        }

        .safe-doc-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d9488;
          flex-shrink: 0;
        }

        .safe-doc-info {
          flex: 1;
        }

        .safe-doc-title {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.125rem;
        }

        .safe-doc-pages {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* FAQ Tab */
        .safe-faq-categories {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .safe-faq-category {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .safe-category-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          color: #0d9488;
        }

        .safe-category-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          background: #f0fdfa;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .safe-category-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-category-questions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-faq-item {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .safe-faq-question {
          width: 100%;
          padding: 1rem;
          background: #f9fafb;
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
          background: #f3f4f6;
        }

        .safe-faq-arrow {
          color: #6b7280;
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .safe-arrow-expanded {
          transform: rotate(180deg);
          color: #0d9488;
        }

        .safe-faq-answer {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .safe-answer-text {
          font-size: 0.875rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0 0 1rem;
        }

        .safe-faq-actions {
          display: flex;
          gap: 0.75rem;
        }

        .safe-helpful-btn,
        .safe-share-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-helpful-btn:hover,
        .safe-share-btn:hover {
          background: #e5e7eb;
          color: #0d9488;
        }

        /* Still Need Help */
        .safe-need-help {
          margin-top: 3rem;
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
          border-radius: 1rem;
          padding: 2rem;
          color: white;
        }

        .safe-help-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .safe-help-text {
          flex: 1;
        }

        .safe-help-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .safe-help-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.5;
        }

        .safe-help-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: white;
          color: #0d9488;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-help-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Status Tab */
        .safe-status-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .safe-status-updated {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .safe-status-overview {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .safe-overall-status {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .safe-status-indicator {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .safe-status-operational {
          color: #10b981;
        }

        .safe-status-info {
          flex: 1;
        }

        .safe-status-label {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .safe-status-desc {
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Services Status */
        .safe-services-status {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .safe-services-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1.5rem;
        }

        .safe-services-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .safe-services-grid {
            grid-template-columns: 1fr;
          }
        }

        .safe-service-card {
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
        }

        .safe-service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .safe-service-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }

        .safe-service-status {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 2rem;
        }

        .safe-status-operational {
          background: #d1fae5;
          color: #065f46;
        }

        .safe-service-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .safe-service-uptime {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .safe-service-details {
          color: #0d9488;
          text-decoration: none;
          font-weight: 500;
        }

        .safe-service-details:hover {
          text-decoration: underline;
        }

        /* Incident History */
        .safe-incident-history {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .safe-incidents-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1.5rem;
        }

        .safe-incidents-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .safe-incident-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
        }

        .safe-incident-resolved {
          border-left: 4px solid #10b981;
        }

        .safe-incident-status {
          padding: 0.25rem 0.75rem;
          background: #d1fae5;
          color: #065f46;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .safe-incident-info {
          flex: 1;
        }

        .safe-incident-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .safe-incident-time {
          font-size: 0.75rem;
          color: #6b7280;
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
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          animation: safe-modal-slide 0.3s ease;
        }

        @keyframes safe-modal-slide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .safe-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .safe-modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
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

        .safe-contact-form {
          padding: 2rem;
        }

        .safe-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 640px) {
          .safe-form-grid {
            grid-template-columns: 1fr;
          }
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
        .safe-form-group textarea:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .safe-form-group textarea {
          resize: vertical;
          min-height: 120px;
        }

        .safe-priority-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .safe-priority-btn {
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-priority-btn:hover {
          background: #e5e7eb;
        }

        .safe-priority-active {
          background: #0d9488;
          color: white;
        }

        .safe-form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .safe-btn-primary {
          flex: 1;
          padding: 0.875rem;
          background: #0d9488;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-btn-primary:hover {
          background: #0f766e;
        }

        .safe-btn-secondary {
          flex: 1;
          padding: 0.875rem;
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

        /* Responsive */
        @media (max-width: 768px) {
          .safe-hero-title {
            font-size: 2.25rem;
          }
          
          .safe-section-title {
            font-size: 1.75rem;
          }
          
          .safe-tabs-wrapper {
            flex-wrap: wrap;
          }
          
          .safe-tab-btn {
            flex: 1;
            min-width: 120px;
            justify-content: center;
          }
        }

        @media (max-width: 640px) {
          .safe-support-container {
            padding: 0 1rem;
          }
          
          .safe-hero-title {
            font-size: 1.875rem;
          }
          
          .safe-hero-stats {
            grid-template-columns: 1fr;
          }
          
          .safe-form-actions {
            flex-direction: column;
          }
        }

        /* Play Icon Component */
        .safe-icon-play {
          display: inline-block;
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
          position: relative;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .safe-icon-play:hover {
          transform: scale(1.1);
        }

        .safe-icon-play::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 55%;
          transform: translate(-50%, -50%);
          width: 0;
          height: 0;
          border-left: 12px solid #0d9488;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
        }

        .PlayIcon {
          composes: safe-icon-play;
        }
      `}</style>
    </div>
  );
};

export default Support;