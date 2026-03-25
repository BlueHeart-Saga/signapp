import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, FileText, Shield, Clock, Users, Zap } from 'lucide-react';

function SafeSignFAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqCategories = [
    {
      id: 'general',
      name: 'General',
      icon: <HelpCircle size={20} />,
      questions: [
        {
          q: "What is SafeSign?",
          a: "SafeSign is a secure, compliant electronic signature platform that helps businesses streamline their document signing processes. We provide legally binding e-signatures that are recognized worldwide under ESIGN, UETA, eIDAS, and other international regulations.",
          tags: ['General', 'Getting Started']
        },
        {
          q: "Is SafeSign legally binding?",
          a: "Yes, absolutely. SafeSign complies with ESIGN, UETA, eIDAS, GDPR, and other global e-signature laws. All signatures are court-admissible and legally binding in over 180 countries. We maintain comprehensive audit trails for every document.",
          tags: ['Legal', 'Compliance']
        },
        {
          q: "How secure is SafeSign?",
          a: "SafeSign uses bank-level 256-bit SSL/TLS encryption, SOC 2 Type II compliance, regular third-party security audits, and GDPR-ready data centers. All documents are encrypted both in transit and at rest.",
          tags: ['Security', 'Privacy']
        }
      ]
    },
    {
      id: 'pricing',
      name: 'Pricing & Plans',
      icon: <FileText size={20} />,
      questions: [
        {
          q: "What's included in the free plan?",
          a: "Our free plan includes: 5 documents per month, basic e-signature functionality, standard security features, email support, and 30-day document retention. Perfect for individual users and occasional use.",
          tags: ['Free Plan', 'Features']
        },
        {
          q: "Can I switch plans at any time?",
          a: "Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle. We'll prorate any charges accordingly.",
          tags: ['Billing', 'Upgrade']
        },
        {
          q: "Do you offer discounts for non-profits or educational institutions?",
          a: "Yes, we offer a 40% discount for registered non-profits and educational institutions. Contact our sales team with proof of status to have this discount applied to your account.",
          tags: ['Discounts', 'Education']
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers for Enterprise plans. All transactions are PCI DSS compliant.",
          tags: ['Payment', 'Billing']
        }
      ]
    },
    {
      id: 'features',
      name: 'Features',
      icon: <Zap size={20} />,
      questions: [
        {
          q: "What file formats does SafeSign support?",
          a: "SafeSign supports PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, and TXT files. Maximum file size is 100MB per document. All documents are converted to PDF for signing and storage.",
          tags: ['Files', 'Formats']
        },
        {
          q: "Can I customize the signing experience?",
          a: "Yes, starting from the Pro plan you can add custom branding, logos, colors, and custom email templates. Enterprise plans offer fully white-labeled experiences with custom domains.",
          tags: ['Customization', 'Branding']
        },
        {
          q: "Does SafeSign integrate with other tools?",
          a: "Yes, we offer integrations with Google Drive, Dropbox, OneDrive, Salesforce, HubSpot, Slack, Zapier, and 200+ other applications through our API and pre-built connectors.",
          tags: ['Integrations', 'API']
        }
      ]
    },
    {
      id: 'security',
      name: 'Security & Compliance',
      icon: <Shield size={20} />,
      questions: [
        {
          q: "Where is my data stored?",
          a: "Your data is stored in SOC 2 Type II certified data centers in your region (US, EU, or Asia-Pacific). We never share your data with third parties and comply with all major data privacy regulations.",
          tags: ['Data Storage', 'Privacy']
        },
        {
          q: "What compliance standards does SafeSign meet?",
          a: "SafeSign is SOC 2 Type II certified, GDPR compliant, CCPA ready, HIPAA capable (BAA available), and meets ISO 27001, 27017, and 27018 standards. We undergo regular third-party audits.",
          tags: ['Compliance', 'Certifications']
        },
        {
          q: "How long are documents stored?",
          a: "Document retention varies by plan: Free - 30 days, Pro - 90 days, Business - 1 year, Enterprise - Unlimited. You can export your documents anytime during the retention period.",
          tags: ['Retention', 'Storage']
        }
      ]
    },
    {
      id: 'support',
      name: 'Support',
      icon: <Users size={20} />,
      questions: [
        {
          q: "What support options are available?",
          a: "Support varies by plan: Free - Email support (48hr response), Pro - Priority email & chat (24hr response), Business - 24/7 chat & phone, Enterprise - Dedicated account manager & 24/7 phone.",
          tags: ['Support', 'Help']
        },
        {
          q: "Do you offer training or onboarding?",
          a: "Yes, we provide comprehensive documentation, video tutorials, and webinars for all plans. Business and Enterprise plans include personalized onboarding sessions and training for your team.",
          tags: ['Training', 'Onboarding']
        },
        {
          q: "Is there an API available?",
          a: "API access is available on Business and Enterprise plans. Our REST API supports full integration capabilities including document creation, sending, signing, and status tracking.",
          tags: ['API', 'Developers']
        }
      ]
    },
    {
      id: 'billing',
      name: 'Billing & Accounts',
      icon: <Clock size={20} />,
      questions: [
        {
          q: "How does the free trial work?",
          a: "All paid plans include a 14-day free trial with full access to all features. No credit card required to start. After 14 days, you'll need to choose a plan to continue using the service.",
          tags: ['Trial', 'Free']
        },
        {
          q: "Can I cancel anytime?",
          a: "Yes, you can cancel your subscription at any time. When you cancel, you'll retain access until the end of your current billing period. We offer a 30-day money-back guarantee for annual plans.",
          tags: ['Cancellation', 'Refund']
        },
        {
          q: "How many users can I add to my account?",
          a: "User limits vary by plan: Free - 1 user, Pro - 5 users included, Business - 20 users included, Enterprise - Unlimited users. Additional users can be added at $10/user/month.",
          tags: ['Users', 'Team']
        }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setActiveIndex(activeIndex === key ? null : key);
  };

  return (
    <div className="safesign-faq">
      <div className="faq-container">
        {/* Header */}
        <div className="faq-header">
          <h1 className="faq-title">Frequently Asked Questions</h1>
          <p className="faq-subtitle">
            Find answers to common questions about SafeSign. Can't find what you're looking for? 
            <a href="/contact" className="contact-link"> Contact our support team</a>.
          </p>
        </div>

        {/* Search Bar */}
        <div className="faq-search">
          <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="Search questions..." 
              className="search-input"
            />
            <button className="search-button">
              Search
            </button>
          </div>
          <p className="search-hint">
            Try searching for "legal", "pricing", "security", or "integration"
          </p>
        </div>

        {/* Category Navigation */}
        <div className="faq-categories">
          {faqCategories.map((category, catIndex) => (
            <button 
              key={catIndex}
              className="category-tab"
              onClick={() => {
                const element = document.getElementById(`category-${category.id}`);
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>

        {/* FAQ Content */}
        <div className="faq-content">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex} id={`category-${category.id}`} className="faq-category-section">
              <div className="category-header">
                <h2 className="category-title">{category.name}</h2>
                <div className="question-count">{category.questions.length} questions</div>
              </div>

              <div className="questions-list">
                {category.questions.map((faq, qIndex) => {
                  const isActive = activeIndex === `${catIndex}-${qIndex}`;
                  return (
                    <div key={qIndex} className={`faq-item ${isActive ? 'active' : ''}`}>
                      <button 
                        className="faq-question"
                        onClick={() => toggleQuestion(catIndex, qIndex)}
                        aria-expanded={isActive}
                      >
                        <div className="question-content">
                          <h3 className="question-text">{faq.q}</h3>
                          <div className="question-tags">
                            {faq.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="tag">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="question-toggle">
                          {isActive ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>
                      
                      <div className="faq-answer-wrapper">
                        <div className="faq-answer">
                          <p>{faq.a}</p>
                          {faq.id === 'pricing' && qIndex === 0 && (
                            <div className="additional-info">
                              <a href="/pricing" className="info-link">View detailed pricing →</a>
                            </div>
                          )}
                          {faq.id === 'security' && qIndex === 0 && (
                            <div className="additional-info">
                              <a href="/security" className="info-link">Learn more about security →</a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="faq-cta">
          <div className="cta-card">
            <div className="cta-icon">
              <HelpCircle size={48} />
            </div>
            <h3 className="cta-title">Still have questions?</h3>
            <p className="cta-text">
              Our support team is here to help you get the most out of SafeSign.
            </p>
            <div className="cta-buttons">
              <a href="/contact" className="cta-button primary">
                Contact Support
              </a>
              <a href="/docs" className="cta-button secondary">
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .safesign-faq {
          width: 100%;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
          line-height: 1.6;
        }

        .faq-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 20px;
        }

        /* Header */
        .faq-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .faq-title {
          font-size: 48px;
          font-weight: 800;
          color: #0d9488;
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .faq-subtitle {
          font-size: 18px;
          color: #6b7280;
          max-width: 600px;
          margin: 0 auto;
        }

        .contact-link {
          color: #0d9488;
          text-decoration: none;
          font-weight: 600;
          margin-left: 4px;
        }

        .contact-link:hover {
          text-decoration: underline;
        }

        /* Search */
        .faq-search {
          max-width: 600px;
          margin: 0 auto 48px;
        }

        .search-wrapper {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }

        .search-input {
          flex: 1;
          padding: 16px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          color: #111827;
          background: #ffffff;
          transition: all 0.3s;
        }

        .search-input:focus {
          outline: none;
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .search-button {
          padding: 16px 32px;
          background: #0d9488;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .search-button:hover {
          background: #0f766e;
          transform: translateY(-2px);
        }

        .search-hint {
          font-size: 14px;
          color: #9ca3af;
          text-align: center;
        }

        /* Categories */
        .faq-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          margin-bottom: 48px;
          padding: 0 20px;
        }

        .category-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .category-tab:hover {
          border-color: #0d9488;
          background: #f0fdfa;
          color: #0d9488;
          transform: translateY(-2px);
        }

        .category-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* FAQ Content */
        .faq-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-category-section {
          margin-bottom: 64px;
        }

        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f3f4f6;
        }

        .category-title {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .question-count {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
          background: #f3f4f6;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-item {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .faq-item:hover {
          border-color: #d1d5db;
        }

        .faq-item.active {
          border-color: #0d9488;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.1);
        }

        .faq-question {
          width: 100%;
          padding: 24px;
          background: transparent;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s;
        }

        .faq-question:hover {
          background: #f9fafb;
        }

        .question-content {
          flex: 1;
          padding-right: 20px;
        }

        .question-text {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .question-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 10px;
          border-radius: 12px;
        }

        .question-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          flex-shrink: 0;
        }

        .faq-answer-wrapper {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .faq-item.active .faq-answer-wrapper {
          max-height: 1000px;
        }

        .faq-answer {
          padding: 0 24px 24px;
        }

        .faq-answer p {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.7;
          margin: 0 0 16px 0;
        }

        .additional-info {
          margin-top: 16px;
        }

        .info-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #0d9488;
          font-weight: 600;
          text-decoration: none;
          font-size: 15px;
        }

        .info-link:hover {
          text-decoration: underline;
        }

        /* CTA Section */
        .faq-cta {
          margin-top: 80px;
        }

        .cta-card {
          background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
          border: 2px solid #0d9488;
          border-radius: 20px;
          padding: 48px;
          text-align: center;
        }

        .cta-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: #0d9488;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cta-title {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
        }

        .cta-text {
          font-size: 18px;
          color: #6b7280;
          max-width: 500px;
          margin: 0 auto 32px;
        }

        .cta-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .cta-button {
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s;
          display: inline-block;
        }

        .cta-button.primary {
          background: #0d9488;
          color: white;
        }

        .cta-button.primary:hover {
          background: #0f766e;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 148, 136, 0.2);
        }

        .cta-button.secondary {
          background: white;
          color: #0d9488;
          border: 2px solid #0d9488;
        }

        .cta-button.secondary:hover {
          background: #f0fdfa;
          transform: translateY(-2px);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .faq-container {
            padding: 48px 16px;
          }

          .faq-title {
            font-size: 36px;
          }

          .search-wrapper {
            flex-direction: column;
          }

          .search-button {
            width: 100%;
          }

          .faq-categories {
            justify-content: flex-start;
            overflow-x: auto;
            padding-bottom: 8px;
            margin-bottom: 32px;
          }

          .category-tab {
            flex-shrink: 0;
          }

          .category-title {
            font-size: 24px;
          }

          .faq-question {
            padding: 20px;
          }

          .faq-answer {
            padding: 0 20px 20px;
          }

          .cta-card {
            padding: 32px 24px;
          }

          .cta-title {
            font-size: 28px;
          }

          .cta-buttons {
            flex-direction: column;
          }

          .cta-button {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .faq-title {
            font-size: 28px;
          }

          .faq-subtitle {
            font-size: 16px;
          }

          .question-text {
            font-size: 16px;
          }

          .faq-question {
            padding: 16px;
          }

          .faq-answer {
            padding: 0 16px 16px;
          }

          .cta-card {
            padding: 24px 16px;
          }

          .cta-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}

export default SafeSignFAQ;