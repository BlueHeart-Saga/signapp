import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Book,
  FileText,
  Code,
  Zap,
  Shield,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Terminal,
  Globe,
  Download,
  Eye,
  Lock,
  Clock,
  Tag,
  Star,
  ExternalLink,
  Menu,
  X,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Play,
  GitBranch
} from 'lucide-react';

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedCode, setCopiedCode] = useState(null);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('javascript');
  const searchRef = useRef(null);

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Zap size={20} />,
      color: '#0f766e',
      description: 'Begin your SafeSign journey'
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: <Code size={20} />,
      color: '#8b5cf6',
      description: 'Complete API documentation'
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      icon: <Shield size={20} />,
      color: '#ef4444',
      description: 'Security features and compliance'
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: <GitBranch size={20} />,
      color: '#3b82f6',
      description: 'Third-party integrations'
    },
    {
      id: 'guides',
      title: 'Guides & Tutorials',
      icon: <Book size={20} />,
      color: '#10b981',
      description: 'Step-by-step tutorials'
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <HelpCircle size={20} />,
      color: '#f59e0b',
      description: 'Common issues and solutions'
    }
  ];

  const popularGuides = [
    {
      id: 'guide-1',
      title: 'Quick Start Guide',
      category: 'getting-started',
      readTime: '5 min',
      difficulty: 'Beginner'
    },
    {
      id: 'guide-2',
      title: 'API Authentication Guide',
      category: 'api-reference',
      readTime: '8 min',
      difficulty: 'Intermediate'
    },
    {
      id: 'guide-3',
      title: 'Webhook Implementation',
      category: 'integrations',
      readTime: '10 min',
      difficulty: 'Advanced'
    },
    {
      id: 'guide-4',
      title: 'Security Best Practices',
      category: 'security',
      readTime: '7 min',
      difficulty: 'Intermediate'
    }
  ];

  const apiEndpoints = [
    {
      method: 'POST',
      endpoint: '/api/v1/documents',
      description: 'Create a new document for signing',
      requiresAuth: true
    },
    {
      method: 'GET',
      endpoint: '/api/v1/documents/{id}',
      description: 'Retrieve document details',
      requiresAuth: true
    },
    {
      method: 'PUT',
      endpoint: '/api/v1/documents/{id}/send',
      description: 'Send document to signers',
      requiresAuth: true
    },
    {
      method: 'GET',
      endpoint: '/api/v1/templates',
      description: 'List available templates',
      requiresAuth: true
    }
  ];

  const codeSamples = {
    javascript: `// Initialize SafeSign SDK
const safesign = require('@safesign/sdk');

const client = new safesign.Client({
  apiKey: process.env.SAFESIGN_API_KEY,
  environment: 'production'
});

// Create a document
async function createDocument() {
  try {
    const document = await client.documents.create({
      title: 'Employment Agreement',
      recipients: [
        {
          email: 'john@example.com',
          name: 'John Doe',
          role: 'signer'
        }
      ],
      files: [
        {
          name: 'agreement.pdf',
          content: await fs.readFile('agreement.pdf')
        }
      ],
      signingOrder: 'parallel'
    });
    
    console.log('Document created:', document.id);
  } catch (error) {
    console.error('Error:', error.message);
  }
}`,
    python: `# Initialize SafeSign SDK
from safesign import Client

client = Client(api_key=os.getenv('SAFESIGN_API_KEY'))

# Create a document
try:
    document = client.documents.create(
        title="Employment Agreement",
        recipients=[
            {
                "email": "john@example.com",
                "name": "John Doe",
                "role": "signer"
            }
        ],
        files=[
            {
                "name": "agreement.pdf",
                "content": open("agreement.pdf", "rb").read()
            }
        ],
        signing_order="parallel"
    )
    
    print(f"Document created: {document.id}")
except Exception as e:
    print(f"Error: {str(e)}")`,
    curl: `curl -X POST https://api.safesign.com/v1/documents \\
  -H "Authorization: Bearer $SAFESIGN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Employment Agreement",
    "recipients": [
      {
        "email": "john@example.com",
        "name": "John Doe",
        "role": "signer"
      }
    ],
    "signingOrder": "parallel"
  }'`
  };

  const sections = {
    'getting-started': [
      {
        id: 'overview',
        title: 'Overview',
        content: `SafeSign is a secure, legally-binding electronic signature platform that helps businesses streamline document workflows. Our platform provides enterprise-grade security, comprehensive audit trails, and seamless integrations.`
      },
      {
        id: 'quick-start',
        title: 'Quick Start',
        content: `To get started with SafeSign:\n\n1. Create an account at app.safesign.com\n2. Verify your email address\n3. Set up your organization profile\n4. Add team members (optional)\n5. Upload your first document\n\nYou can start with our free plan which includes 5 documents per month.`
      },
      {
        id: 'features',
        title: 'Key Features',
        items: [
          'Legally binding e-signatures',
          'Advanced document templates',
          'Team collaboration tools',
          'API and webhook support',
          'Comprehensive audit trails',
          'Bank-level security'
        ]
      }
    ],
    'api-reference': [
      {
        id: 'authentication',
        title: 'Authentication',
        content: `All API requests require authentication using your API key. Include the API key in the Authorization header:\n\n\`Authorization: Bearer YOUR_API_KEY\`\n\nYou can generate API keys in your SafeSign dashboard under Settings > API Keys.`
      },
      {
        id: 'rate-limiting',
        title: 'Rate Limiting',
        content: `API requests are limited to:\n\n- Free plan: 100 requests/hour\n- Pro plan: 1,000 requests/hour\n- Business plan: 10,000 requests/hour\n- Enterprise: Custom limits\n\nRate limit headers are included in all responses.`
      }
    ]
  };

  const faqs = [
    {
      question: 'How do I generate an API key?',
      answer: 'Navigate to Settings > API Keys in your SafeSign dashboard. Click "Generate New Key" and copy the key immediately - it will only be shown once.'
    },
    {
      question: 'Are webhooks real-time?',
      answer: 'Yes, webhooks are delivered in real-time when events occur. We recommend setting up retry logic in your webhook handler.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'SafeSign supports PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, and TIFF files. Maximum file size is 100MB.'
    }
  ];

  const languages = [
    { id: 'javascript', name: 'JavaScript', icon: 'JS' },
    { id: 'python', name: 'Python', icon: 'Py' },
    { id: 'curl', name: 'cURL', icon: 'CLI' }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setShowMobileNav(false);
    }
  };

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  const filteredGuides = popularGuides.filter(guide =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="safe-docs">
      {/* Header */}
      <header className="safe-docs-header">
        <div className="safe-docs-container">
          <div className="safe-header-content">
            <div className="safe-header-main">
              <div className="safe-header-left">
                <button 
                  className="safe-mobile-toggle"
                  onClick={() => setShowMobileNav(!showMobileNav)}
                >
                  {showMobileNav ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="safe-docs-logo">
                  <Book size={24} />
                  <span>SafeSign Docs</span>
                </div>
              </div>
              
              <div className="safe-header-actions">
                <a href="/api-reference" className="safe-header-link">
                  <Terminal size={18} />
                  API Reference
                </a>
                <a href="/guides" className="safe-header-link">
                  <Book size={18} />
                  Guides
                </a>
                <button className="safe-header-btn">
                  <Download size={18} />
                  Download SDK
                </button>
              </div>
            </div>
            
            <div className="safe-hero-section">
              <h1 className="safe-hero-title">SafeSign Documentation</h1>
              <p className="safe-hero-subtitle">
                Comprehensive guides, API references, and tutorials to help you integrate and use SafeSign effectively
              </p>
              
              {/* Search */}
              <div className="safe-docs-search">
                <Search className="safe-search-icon" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search documentation, APIs, or guides..."
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
                    <span className="safe-results-count">{filteredGuides.length} results</span>
                  </div>
                  {filteredGuides.length > 0 ? (
                    <div className="safe-results-list">
                      {filteredGuides.map(guide => (
                        <div 
                          key={guide.id} 
                          className="safe-result-item"
                          onClick={() => scrollToSection(guide.category)}
                        >
                          <div className="safe-result-content">
                            <h4>{guide.title}</h4>
                            <div className="safe-result-meta">
                              <span className="safe-result-category">{guide.category}</span>
                              <span className="safe-result-time">{guide.readTime} read</span>
                              <span className="safe-result-difficulty">{guide.difficulty}</span>
                            </div>
                          </div>
                          <ChevronRight size={20} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="safe-no-results">
                      <Search size={24} />
                      <p>No results found. Try different keywords.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="safe-docs-main">
        <div className="safe-docs-container">
          <div className="safe-docs-layout">
            {/* Sidebar */}
            <aside className={`safe-docs-sidebar ${showMobileNav ? 'safe-sidebar-open' : ''}`}>
              <div className="safe-sidebar-header">
                <div className="safe-sidebar-title">Documentation</div>
                <button 
                  className="safe-sidebar-close"
                  onClick={() => setShowMobileNav(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              <nav className="safe-sidebar-nav">
                {/* Categories */}
                <div className="safe-categories-list">
                  {categories.map(category => (
                    <div key={category.id} className="safe-category-group">
                      <button
                        className={`safe-category-btn ${activeCategory === category.id ? 'safe-category-active' : ''}`}
                        onClick={() => setActiveCategory(category.id)}
                      >
                        <span className="safe-category-icon" style={{ color: category.color }}>
                          {category.icon}
                        </span>
                        <span className="safe-category-text">{category.title}</span>
                        <ChevronRight className="safe-category-arrow" />
                      </button>
                      
                      {activeCategory === category.id && sections[category.id] && (
                        <div className="safe-sections-list">
                          {sections[category.id].map(section => (
                            <button
                              key={section.id}
                              className="safe-section-link"
                              onClick={() => scrollToSection(`${category.id}-${section.id}`)}
                            >
                              {section.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Popular Guides */}
                <div className="safe-popular-section">
                  <h3 className="safe-popular-title">
                    <Star size={16} />
                    Popular Guides
                  </h3>
                  <div className="safe-popular-list">
                    {popularGuides.map(guide => (
                      <a
                        key={guide.id}
                        href={`#${guide.category}-${guide.id}`}
                        className="safe-popular-link"
                      >
                        <FileText size={14} />
                        <span>{guide.title}</span>
                        <span className="safe-guide-time">{guide.readTime}</span>
                      </a>
                    ))}
                  </div>
                </div>
                
                {/* API Endpoints */}
                <div className="safe-api-section">
                  <h3 className="safe-api-title">
                    <Terminal size={16} />
                    API Endpoints
                  </h3>
                  <div className="safe-endpoints-list">
                    {apiEndpoints.map((endpoint, index) => (
                      <div key={index} className="safe-endpoint-item">
                        <span className={`safe-endpoint-method safe-method-${endpoint.method.toLowerCase()}`}>
                          {endpoint.method}
                        </span>
                        <code className="safe-endpoint-path">{endpoint.endpoint}</code>
                        {endpoint.requiresAuth && (
                          <Lock size={12} className="safe-endpoint-auth" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </nav>
            </aside>

            {/* Main Content */}
            <div className="safe-docs-content">
              {/* Category Header */}
              <div className="safe-category-header">
                <div className="safe-category-info">
                  <div className="safe-category-icon-lg" style={{ backgroundColor: `${categories.find(c => c.id === activeCategory)?.color}15` }}>
                    {categories.find(c => c.id === activeCategory)?.icon}
                  </div>
                  <div>
                    <h1 className="safe-category-title">
                      {categories.find(c => c.id === activeCategory)?.title}
                    </h1>
                    <p className="safe-category-description">
                      {categories.find(c => c.id === activeCategory)?.description}
                    </p>
                  </div>
                </div>
                <div className="safe-category-actions">
                  <button className="safe-action-btn">
                    <Eye size={18} />
                    View on GitHub
                  </button>
                  <button className="safe-action-btn">
                    <Download size={18} />
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Sections */}
              <div className="safe-sections-container">
                {sections[activeCategory]?.map(section => (
                  <section 
                    key={section.id} 
                    id={`${activeCategory}-${section.id}`}
                    className="safe-docs-section"
                  >
                    <div className="safe-section-header">
                      <h2 className="safe-section-title">{section.title}</h2>
                      <button 
                        className="safe-expand-btn"
                        onClick={() => toggleSection(`${activeCategory}-${section.id}`)}
                      >
                        {expandedSections[`${activeCategory}-${section.id}`] ? 'Collapse' : 'Expand'}
                        <ChevronDown className={`safe-expand-arrow ${expandedSections[`${activeCategory}-${section.id}`] ? 'safe-arrow-expanded' : ''}`} />
                      </button>
                    </div>
                    
                    <div className={`safe-section-content ${expandedSections[`${activeCategory}-${section.id}`] ? 'safe-content-expanded' : ''}`}>
                      {section.content && (
                        <div className="safe-content-text">
                          {section.content.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      )}
                      
                      {section.items && (
                        <ul className="safe-features-list">
                          {section.items.map((item, i) => (
                            <li key={i} className="safe-feature-item">
                              <Check size={16} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                ))}

                {/* Code Samples */}
                {activeCategory === 'api-reference' && (
                  <section className="safe-code-section">
                    <div className="safe-section-header">
                      <h2 className="safe-section-title">Code Examples</h2>
                      <div className="safe-language-tabs">
                        {languages.map(lang => (
                          <button
                            key={lang.id}
                            className={`safe-language-tab ${activeLanguage === lang.id ? 'safe-tab-active' : ''}`}
                            onClick={() => setActiveLanguage(lang.id)}
                          >
                            <span className="safe-lang-icon">{lang.icon}</span>
                            {lang.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="safe-code-block">
                      <div className="safe-code-header">
                        <div className="safe-code-title">Create a Document</div>
                        <button
                          className="safe-copy-btn"
                          onClick={() => copyToClipboard(codeSamples[activeLanguage], activeLanguage)}
                        >
                          {copiedCode === activeLanguage ? (
                            <>
                              <Check size={16} />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="safe-code-content">
                        <code>{codeSamples[activeLanguage]}</code>
                      </pre>
                    </div>
                  </section>
                )}

                {/* API Endpoints Table */}
                {activeCategory === 'api-reference' && (
                  <section className="safe-api-table-section">
                    <h2 className="safe-section-title">API Endpoints</h2>
                    <div className="safe-api-table">
                      <div className="safe-table-header">
                        <div className="safe-table-col safe-col-method">Method</div>
                        <div className="safe-table-col safe-col-endpoint">Endpoint</div>
                        <div className="safe-table-col safe-col-description">Description</div>
                        <div className="safe-table-col safe-col-auth">Auth</div>
                      </div>
                      {apiEndpoints.map((endpoint, index) => (
                        <div key={index} className="safe-table-row">
                          <div className="safe-table-col safe-col-method">
                            <span className={`safe-method-badge safe-method-${endpoint.method.toLowerCase()}`}>
                              {endpoint.method}
                            </span>
                          </div>
                          <div className="safe-table-col safe-col-endpoint">
                            <code>{endpoint.endpoint}</code>
                          </div>
                          <div className="safe-table-col safe-col-description">
                            {endpoint.description}
                          </div>
                          <div className="safe-table-col safe-col-auth">
                            {endpoint.requiresAuth ? (
                              <Lock size={14} className="safe-auth-icon" />
                            ) : (
                              <span className="safe-auth-none">None</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* FAQs */}
                <section className="safe-faqs-section">
                  <h2 className="safe-section-title">
                    <HelpCircle size={24} />
                    Frequently Asked Questions
                  </h2>
                  <div className="safe-faqs-list">
                    {faqs.map((faq, index) => (
                      <div key={index} className="safe-faq-item">
                        <h3 className="safe-faq-question">{faq.question}</h3>
                        <p className="safe-faq-answer">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* CTA */}
                <div className="safe-docs-cta">
                  <div className="safe-cta-content">
                    <Globe className="safe-cta-icon" />
                    <div className="safe-cta-text">
                      <h3 className="safe-cta-title">Need More Help?</h3>
                      <p className="safe-cta-subtitle">
                        Join our developer community or contact our support team
                      </p>
                    </div>
                    <div className="safe-cta-actions">
                      <button className="safe-cta-btn-primary">
                        Join Community
                        <ArrowRight size={18} />
                      </button>
                      <button className="safe-cta-btn-secondary">
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        /* Base Styles */
        .safe-docs {
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
        }

        .safe-docs-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Header */
        .safe-docs-header {
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
          position: relative;
        }

        .safe-header-content {
          position: relative;
          z-index: 2;
        }

        .safe-header-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .safe-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .safe-mobile-toggle {
          display: none;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background 0.2s;
        }

        .safe-mobile-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .safe-docs-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
        }

        .safe-header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .safe-header-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .safe-header-link:hover {
          color: white;
        }

        .safe-header-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-header-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        /* Hero Section */
        .safe-hero-section {
          padding: 3rem 0;
          text-align: center;
        }

        .safe-hero-title {
          font-size: 2.5rem;
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
        .safe-docs-search {
          position: relative;
          max-width: 600px;
          margin: 0 auto;
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
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 600px;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin-top: 0.5rem;
          z-index: 100;
          animation: safe-slide-down 0.3s ease;
        }

        @keyframes safe-slide-down {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
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
        .safe-docs-main {
          padding: 2rem 0;
        }

        .safe-docs-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
          position: relative;
        }

        /* Sidebar */
        .safe-docs-sidebar {
          position: sticky;
          top: 2rem;
          height: calc(100vh - 4rem);
          overflow-y: auto;
          background: #f9fafb;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
        }

        .safe-sidebar-header {
          display: none;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .safe-sidebar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .safe-sidebar-close {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .safe-sidebar-close:hover {
          background: #f3f4f6;
        }

        /* Navigation */
        .safe-categories-list {
          margin-bottom: 2rem;
        }

        .safe-category-group {
          margin-bottom: 0.5rem;
        }

        .safe-category-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: transparent;
          border: none;
          border-radius: 0.5rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-category-btn:hover {
          background: #f3f4f6;
        }

        .safe-category-active {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }

        .safe-category-icon {
          flex-shrink: 0;
        }

        .safe-category-text {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }

        .safe-category-arrow {
          font-size: 0.75rem;
          color: #9ca3af;
          transition: transform 0.2s;
        }

        .safe-category-active .safe-category-arrow {
          transform: rotate(90deg);
        }

        .safe-sections-list {
          padding-left: 2.25rem;
          margin-top: 0.25rem;
        }

        .safe-section-link {
          display: block;
          padding: 0.5rem 0.75rem;
          color: #4b5563;
          text-decoration: none;
          font-size: 0.8125rem; 
          border: none;
            background: transparent;
        }

        .safe-section-link:hover {
          color: #0f766e;
        }

        /* Popular Guides */
        .safe-popular-section {
          margin-bottom: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .safe-popular-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1rem;
        }

        .safe-popular-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-popular-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          color: #4b5563;
          text-decoration: none;
          font-size: 0.8125rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .safe-popular-link:hover {
          background: #f3f4f6;
          color: #0f766e;
        }

        .safe-guide-time {
          margin-left: auto;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* API Endpoints */
        .safe-api-section {
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .safe-api-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1rem;
        }

        .safe-endpoints-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-endpoint-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.75rem;
        }

        .safe-endpoint-method {
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: 600;
          font-size: 0.6875rem;
          text-transform: uppercase;
        }

        .safe-method-get {
          background: #dbeafe;
          color: #1e40af;
        }

        .safe-method-post {
          background: #d1fae5;
          color: #065f46;
        }

        .safe-method-put {
          background: #fef3c7;
          color: #92400e;
        }

        .safe-endpoint-path {
          flex: 1;
          color: #4b5563;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .safe-endpoint-auth {
          color: #9ca3af;
        }

        /* Main Content Area */
        .safe-docs-content {
          min-width: 0; /* Prevents flex item overflow */
        }

        .safe-category-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .safe-category-info {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .safe-category-icon-lg {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .safe-category-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-category-description {
          font-size: 1rem;
          color: #6b7280;
          margin: 0;
        }

        .safe-category-actions {
          display: flex;
          gap: 0.75rem;
        }

        .safe-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-action-btn:hover {
          background: #e5e7eb;
        }

        /* Documentation Sections */
        .safe-sections-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .safe-docs-section {
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
        }

        .safe-section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
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
          border-color: #0f766e;
          color: #0f766e;
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
          max-height: 2000px;
        }

        .safe-content-text {
          font-size: 0.9375rem;
          color: #4b5563;
          line-height: 1.7;
        }

        .safe-content-text p {
          margin: 0 0 1rem;
        }

        .safe-content-text p:last-child {
          margin-bottom: 0;
        }

        /* Features List */
        .safe-features-list {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .safe-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.9375rem;
          color: #4b5563;
        }

        .safe-feature-item svg {
          color: #10b981;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        /* Code Section */
        .safe-code-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
        }

        .safe-language-tabs {
          display: flex;
          gap: 0.5rem;
        }

        .safe-language-tab {
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

        .safe-language-tab:hover {
          background: #e5e7eb;
        }

        .safe-tab-active {
          background: #0f766e;
          color: white;
        }

        .safe-lang-icon {
          font-family: monospace;
          font-weight: 600;
          margin-right: 0.375rem;
        }

        .safe-code-block {
          background: #1f2937;
          border-radius: 0.75rem;
          margin: 1.5rem;
          overflow: hidden;
        }

        .safe-code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: #374151;
          border-bottom: 1px solid #4b5563;
        }

        .safe-code-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #d1d5db;
        }

        .safe-copy-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: #4b5563;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-copy-btn:hover {
          background: #6b7280;
        }

        .safe-code-content {
          padding: 1.5rem;
          margin: 0;
          overflow-x: auto;
        }

        .safe-code-content code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          color: #e5e7eb;
        }

        /* API Table */
        .safe-api-table-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .safe-api-table {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
          margin-top: 1rem;
        }

        .safe-table-header {
          display: grid;
          grid-template-columns: 100px 1fr 2fr 80px;
          padding: 1rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .safe-table-row {
          display: grid;
          grid-template-columns: 100px 1fr 2fr 80px;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          transition: background 0.2s;
        }

        .safe-table-row:hover {
          background: #f9fafb;
        }

        .safe-table-row:last-child {
          border-bottom: none;
        }

        .safe-table-col {
          display: flex;
          align-items: center;
        }

        .safe-method-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .safe-auth-icon {
          color: #0f766e;
        }

        .safe-auth-none {
          color: #9ca3af;
          font-size: 0.75rem;
        }

        /* FAQs */
        .safe-faqs-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .safe-faqs-section .safe-section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .safe-faqs-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .safe-faq-item {
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .safe-faq-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .safe-faq-question {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.75rem;
        }

        .safe-faq-answer {
          font-size: 0.9375rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0;
        }

        /* CTA */
        .safe-docs-cta {
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
          border-radius: 1rem;
          padding: 2rem;
          color: white;
          text-align: center;
        }

        .safe-cta-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .safe-cta-icon {
          margin: 0 auto 1.5rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .safe-cta-text {
          margin-bottom: 2rem;
        }

        .safe-cta-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .safe-cta-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.6;
        }

        .safe-cta-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .safe-cta-btn-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: white;
          color: #0f766e;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-cta-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .safe-cta-btn-secondary {
          padding: 0.75rem 1.5rem;
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-cta-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: white;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .safe-docs-layout {
            grid-template-columns: 1fr;
          }
          
          .safe-docs-sidebar {
            position: fixed;
            top: 0;
            left: -280px;
            width: 280px;
            height: 100vh;
            z-index: 1000;
            transition: left 0.3s ease;
          }
          
          .safe-sidebar-open {
            left: 0;
          }
          
          .safe-sidebar-header {
            display: flex;
          }
          
          .safe-mobile-toggle {
            display: block;
          }
        }

        @media (max-width: 768px) {
          .safe-hero-title {
            font-size: 2rem;
          }
          
          .safe-category-header {
            flex-direction: column;
            gap: 1rem;
          }
          
          .safe-category-actions {
            width: 100%;
          }
          
          .safe-action-btn {
            flex: 1;
            justify-content: center;
          }
          
          .safe-table-header,
          .safe-table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          
          .safe-table-col {
            padding: 0.25rem 0;
          }
          
          .safe-cta-actions {
            flex-direction: column;
          }
          
          .safe-cta-btn-primary,
          .safe-cta-btn-secondary {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 640px) {
          .safe-docs-container {
            padding: 0 1rem;
          }
          
          .safe-header-actions {
            display: none;
          }
          
          .safe-hero-title {
            font-size: 1.75rem;
          }
          
          .safe-hero-subtitle {
            font-size: 1rem;
          }
          
          .safe-section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .safe-expand-btn {
            align-self: flex-start;
          }
          
          .safe-code-block {
            margin: 1rem;
          }
          
          .safe-code-content {
            padding: 1rem;
          }
        }

        /* Print Styles */
        @media print {
          .safe-docs-header {
            background: white !important;
            color: black !important;
          }
          
          .safe-docs-sidebar,
          .safe-category-actions,
          .safe-expand-btn,
          .safe-copy-btn,
          .safe-cta-actions {
            display: none !important;
          }
          
          .safe-docs-layout {
            display: block;
          }
          
          .safe-section-content {
            max-height: none !important;
          }
          
          .safe-code-block {
            background: #f9fafb !important;
            color: black !important;
          }
          
          .safe-code-content code {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Documentation;
