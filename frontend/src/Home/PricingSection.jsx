import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, CreditCard, Check, Shield, Award, Sparkles, Clock, 
  ChevronRight, Star, CheckCircle, ArrowRight, Layers, FileText, 
  Smartphone, Mail, RefreshCw, Send, Building, User, MessageSquare, AlertCircle, X,
  ChevronDown, ChevronUp
} from 'lucide-react';

import IntegrationsScroll from './IntegrationsScroll';
import SimpleFAQ from './SimpleFAQ';
import PricingHero from './PricingHero';
import FeatureComparisonTable from './FeatureComparisonTable';
import api from '../services/api';

import { setPageTitle } from "../utils/pageTitle";

function PricingSection() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'schedule'
  const [showEnterpriseRow, setShowEnterpriseRow] = useState(false); // Dropdown toggle state

  // Sales Popup Modal State
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    volume: '50,000 - 100,000 Credits',
    message: ''
  });
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    setPageTitle(
      "Transparent Credit Plans & Top-Up Pricing | Esigniva",
      "Explore Esigniva's transparent credit plans: Free Trial, Starter, Standard, Professional, Enterprise, and Custom Pricing."
    );
  }, []);

  // ROW 1 PLANS (4 CARDS: Free Trial, Starter, Standard, Professional)
  const row1Plans = [
    {
      id: 'free_trial',
      name: 'Free Trial',
      subtitle: '15-Day Free Trial access with starter credits',
      credits: '100 Credits',
      priceDisplay: 'Free',
      priceSub: '100 Included Free Credits',
      badge: '15-DAY TRIAL',
      color: '#64748b',
      ctaText: 'Start Free Trial',
      featureHeader: 'Features included:',
      features: [
        '100 Included Free Credits',
        'Send ~20 Document Envelopes (5 cr/doc)',
        'AI Agreement Generator Access',
        'Real-time Audit Trails & Certificates',
        'Email Support'
      ],
      isFree: true
    },
    {
      id: 'pack_500',
      name: 'Starter',
      subtitle: 'Ideal for independent signers & small teams',
      credits: '500 Credits',
      priceDisplay: '$5.00',
      priceSub: 'One-time payment · $0.010/credit',
      badge: 'STARTER',
      color: '#0284c7',
      ctaText: 'Subscribe',
      featureHeader: 'Everything in Free Trial, plus:',
      features: [
        '500 Credits Included',
        'Send ~100 Envelopes (5 cr/doc)',
        'Generate ~25 AI Agreements',
        'Credits Never Expire',
        'Audit Certificates Included',
        'Standard Customer Support'
      ]
    },
    {
      id: 'pack_2000',
      name: 'Standard',
      subtitle: 'Best value for active signers & growing teams',
      credits: '2,000 Credits',
      priceDisplay: '$15.00',
      priceSub: 'One-time payment · $0.0075/credit (25% OFF)',
      badge: 'MOST POPULAR',
      color: '#0f766e',
      isPopular: true,
      ctaText: 'Subscribe',
      featureHeader: 'Everything in Starter, plus:',
      features: [
        '2,000 Credits Included (25% Savings)',
        'Send ~400 Envelopes (5 cr/doc)',
        'Generate ~100 AI Agreements',
        'Credits Never Expire',
        'Audit Certificates & OTP Included',
        'Priority Customer Support'
      ]
    },
    {
      id: 'pack_10000',
      name: 'Professional',
      subtitle: 'High-volume credit pack for power users & workflows',
      credits: '10,000 Credits',
      priceDisplay: '$50.00',
      priceSub: 'One-time payment · $0.0050/credit (50% OFF)',
      badge: 'BEST VALUE',
      color: '#7c3aed',
      ctaText: 'Subscribe',
      featureHeader: 'Everything in Standard, plus:',
      features: [
        '10,000 Credits Included (50% Savings)',
        'Send ~2,000 Envelopes',
        'Generate ~500 AI Agreements',
        'AI Field Auto-Positioning & Parsing',
        'Bulk Send & Custom Brand Logo',
        '24/7 Priority Dedicated Support'
      ]
    }
  ];

  // ROW 2 PLANS (2 CARDS CENTERED: Enterprise, Custom Price - Hidden by default)
  const row2Plans = [
    {
      id: 'pack_50000',
      name: 'Enterprise',
      subtitle: 'Scale automation & high-volume contract engine',
      credits: '50,000 Credits',
      priceDisplay: '$200.00',
      priceSub: 'One-time payment · $0.0040/credit (60% OFF)',
      badge: 'MAX SAVINGS',
      color: '#2563eb',
      ctaText: 'Subscribe',
      featureHeader: 'Everything in Professional, plus:',
      features: [
        '50,000 Enterprise Credits (60% Savings)',
        'Send ~10,000 Envelopes',
        'Generate ~2,500 AI Agreements',
        'Full Webhook & API Access',
        'VIP Dedicated Account Manager & SLA'
      ]
    },
    {
      id: 'custom_price',
      name: 'Custom Price',
      subtitle: 'Tailored credits & dedicated enterprise SLA',
      credits: 'Tailored Credits',
      priceDisplay: 'Custom Price',
      priceSub: 'Contact Sales for Custom Quote',
      badge: 'ENTERPRISE & API',
      color: '#059669',
      isCustom: true,
      ctaText: 'Talk to Sales',
      featureHeader: 'Everything in Enterprise, plus:',
      features: [
        '100,000+ Custom Volume Credits',
        'Dedicated Account Manager & SLA',
        'Single Sign-On (SSO / SAML)',
        'Custom White-label Portal',
        'Direct Engineering & Legal Support'
      ]
    }
  ];

  // Action Credit Costs Schedule
  const creditRates = [
    { action: 'Document Send & E-Signing', cost: '5 Credits', description: 'Send envelope with signature fields to recipients', icon: <FileText size={18} color="#0284c7" /> },
    { action: 'Recipient Signing', cost: '2 Credits', description: 'Signer completes signature or input submission', icon: <CheckCircle size={18} color="#0f766e" /> },
    { action: 'AI Agreement Generator', cost: '20 Credits', description: 'Generate custom legal agreement via AI prompt', icon: <Sparkles size={18} color="#7c3aed" /> },
    { action: 'AI Processing & Parsing', cost: '10 Credits', description: 'Extract fields & summarize document text via AI', icon: <Zap size={18} color="#ea580c" /> },
    { action: 'Template Usage', cost: '3 Credits', description: 'Use pre-built reusable contract template', icon: <Layers size={18} color="#0284c7" /> },
    { action: 'SMS Notifications', cost: '2 Credits', description: 'Send SMS alert or signing invitation link', icon: <Smartphone size={18} color="#e11d48" /> },
    { action: 'Email Delivery', cost: '1 Credit', description: 'Automated email dispatch & status tracking', icon: <Mail size={18} color="#64748b" /> },
    { action: 'Audit Trail & 2FA OTP', cost: 'FREE (0 Credits)', description: 'Tamper-evident legal certificate & OTP verification', icon: <Shield size={18} color="#16a34a" /> }
  ];

  const handlePlanClick = (plan) => {
    if (plan.isCustom) {
      setSalesModalOpen(true);
      return;
    }
    if (plan.isFree) {
      navigate('/login');
      return;
    }
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/user/subscription', { state: { selectedPack: plan.id } });
    } else {
      navigate('/login', { state: { selectedPack: plan.id } });
    }
  };

  const handleCustomFormSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setContactError('Please fill out all required fields.');
      return;
    }

    setSubmittingContact(true);
    setContactError('');
    setContactSuccess(false);

    try {
      await api.post('/contact', {
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        subject: `Custom Pricing Request - ${contactForm.volume}`,
        message: `[CUSTOM ENTERPRISE QUOTE REQUEST]\nEstimated Volume: ${contactForm.volume}\n\nClient Requirements:\n${contactForm.message.trim()}`
      });

      setContactSuccess(true);
      setContactForm({ name: '', email: '', volume: '50,000 - 100,000 Credits', message: '' });
    } catch (err) {
      console.error('Custom pricing contact submission error:', err);
      setContactError(err.response?.data?.detail || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmittingContact(false);
    }
  };

  const renderCard = (plan) => (
    <div
      key={plan.id}
      className={`modern-card ${plan.isPopular ? 'popular' : ''} ${plan.isCustom ? 'custom-card' : ''}`}
      style={{ borderColor: plan.isPopular ? '#10b981' : plan.isCustom ? '#059669' : '#e2e8f0' }}
    >
      {plan.badge && (
        <div className="popular-pill-tag" style={{ background: plan.isPopular ? '#10b981' : plan.color }}>
          <span>{plan.badge}</span>
        </div>
      )}

      <div className="card-top-section">
        <h3 className="plan-name-title">{plan.name}</h3>
        <p className="plan-subtitle-desc">{plan.subtitle}</p>

        <div className="plan-price-display-wrapper">
          <div className="price-primary-text">{plan.priceDisplay}</div>
          <div className="price-secondary-sub">{plan.priceSub}</div>
        </div>

        <button
          className={`card-cta-button ${plan.isCustom ? 'custom-cta' : plan.isPopular ? 'popular-cta' : ''}`}
          onClick={() => handlePlanClick(plan)}
        >
          {plan.ctaText}
        </button>
      </div>

      <div className="card-features-section">
        <h4 className="feature-header-title">{plan.featureHeader}</h4>
        <ul className="features-list">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="feature-item">
              <CheckCircle size={16} className="check-icon" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="modern-pricing">
      <PricingHero />
      <IntegrationsScroll />

      {/* Main Header & View Selector */}
      <div className="modern-pricing-header">
        <div className="modern-container">
          
          <h1 className="modern-title">Simple, Transparent Credit Pricing</h1>
          <p className="modern-subtitle">
            Flexible credit-based plans built for every scale. No hidden recurring fees. Credits **never expire** and automatically roll over.
          </p>

          {/* View Tabs */}
          <div className="pricing-view-tabs">
            <button
              className={`view-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
              onClick={() => setActiveTab('plans')}
            >
              <CreditCard size={18} /> Pricing Plans
            </button>
            <button
              className={`view-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              <Zap size={18} /> Credit Cost Schedule
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: PRICING PLANS (ROW 1 = 4 CARDS, ROW 2 = 2 CARDS CENTERED & HIDDEN BY DEFAULT) */}
      {activeTab === 'plans' && (
        <div className="modern-pricing-cards">
          <div className="modern-container">
            {/* ROW 1: 4 CARDS (Free Trial, Starter, Standard, Professional) */}
            <div className="pricing-grid-row-1">
              {row1Plans.map(renderCard)}
            </div>

            {/* EXPAND DROPDOWN BUTTON FOR ENTERPRISE & CUSTOM PRICE CARDS */}
            <div className="enterprise-toggle-container">
              <button
                className="enterprise-toggle-btn"
                onClick={() => setShowEnterpriseRow(!showEnterpriseRow)}
              >
                <Building size={18} />
                <span>
                  {showEnterpriseRow
                    ? "Hide Enterprise & Custom Plans"
                    : "View Enterprise & Custom Volume Plans ($200 / 50k Credits & Custom SLA)"}
                </span>
                {showEnterpriseRow ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {/* ROW 2: 2 CARDS (Enterprise, Custom Price) - CENTERED & EXPANDABLE */}
            {showEnterpriseRow && (
              <div className="pricing-grid-row-2 animate-expand">
                {row2Plans.map(renderCard)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREDIT COST SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="credit-schedule-section">
          <div className="modern-container">
            <div className="schedule-header">
              <h2>How Credit Consumption Works</h2>
              <p>Transparent action pricing. No mystery charges. You only consume credits when actions are performed.</p>
            </div>

            <div className="schedule-grid">
              {creditRates.map((rate, index) => (
                <div key={index} className="schedule-card">
                  <div className="schedule-card-top">
                    <div className="schedule-icon-wrapper">
                      {rate.icon}
                    </div>
                    <span className="schedule-cost-chip">{rate.cost}</span>
                  </div>
                  <h4 className="schedule-action-title">{rate.action}</h4>
                  <p className="schedule-action-desc">{rate.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: TALK TO SALES / LET'S CONNECT FORM */}
      {salesModalOpen && (
        <div className="sales-modal-backdrop" onClick={() => setSalesModalOpen(false)}>
          <div className="sales-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="sales-modal-close" onClick={() => setSalesModalOpen(false)}>
              <X size={20} />
            </button>

            <div className="sales-modal-header">
              <div className="modal-badge-tag">
                <Building size={14} /> ENTERPRISE & CUSTOM SLA
              </div>
              <h2>Talk to Sales — Let's Connect</h2>
              <p>
                Tell us about your team size, custom credit volume, or API integration needs. Our enterprise team will connect with you within 24 hours.
              </p>
            </div>

            {contactSuccess ? (
              <div className="modal-success-box">
                <CheckCircle size={48} color="#10b981" />
                <h3>Request Sent Successfully!</h3>
                <p>
                  Thank you! Your custom pricing request has been routed directly to Esigniva Admin & Sales. We will reach out to you shortly.
                </p>
                <button
                  type="button"
                  className="modal-done-btn"
                  onClick={() => {
                    setContactSuccess(false);
                    setSalesModalOpen(false);
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form className="modal-sales-form" onSubmit={handleCustomFormSubmit}>
                <div className="modal-form-group">
                  <label><User size={14} /> Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>

                <div className="modal-form-group">
                  <label><Mail size={14} /> Business Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sarah@company.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>

                <div className="modal-form-group">
                  <label><Zap size={14} /> Estimated Credit Volume</label>
                  <select
                    value={contactForm.volume}
                    onChange={(e) => setContactForm({ ...contactForm, volume: e.target.value })}
                  >
                    <option value="10,000 - 50,000 Credits">10,000 - 50,000 Credits</option>
                    <option value="50,000 - 100,000 Credits">50,000 - 100,000 Credits</option>
                    <option value="100,000+ Credits (Custom SLA)">100,000+ Credits (Custom SLA)</option>
                    <option value="API / White-label Integration">API / White-label Integration</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label><MessageSquare size={14} /> Organization / Requirements *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tell us about your team size, workflow, or custom requirements..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>

                {contactError && (
                  <div className="modal-error-box">
                    <AlertCircle size={16} /> {contactError}
                  </div>
                )}

                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={submittingContact}
                >
                  {submittingContact ? (
                    <>Sending Request...</>
                  ) : (
                    <>
                      <Send size={16} /> Submit Sales Request
                    </>
                  )}
                </button>
                <small className="modal-privacy-note">
                  <Shield size={12} /> Managed via Esigniva Support Desk · Instant Confirmation
                </small>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Embedded Components */}
      
      <FeatureComparisonTable />
      <SimpleFAQ />

      {/* Component Scoped Styling */}
      <style jsx>{`
        .modern-pricing {
          width: 100%;
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
        }

        .modern-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .modern-pricing-header {
          padding: 60px 0 30px;
          text-align: center;
        }

        .pricing-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          color: #166534;
          font-size: 13px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #bbf7d0;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modern-title {
          font-size: 42px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 14px;
          line-height: 1.15;
          letter-spacing: -1px;
        }

        .modern-subtitle {
          font-size: 18px;
          color: #64748b;
          margin-bottom: 32px;
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.5;
        }

        /* View Tabs */
        .pricing-view-tabs {
          display: inline-flex;
          background: #f1f5f9;
          padding: 6px;
          border-radius: 14px;
          gap: 6px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
        }

        .view-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-tab-btn.active {
          background: #ffffff;
          color: #0f766e;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        /* Desktop Row 1 = exactly 4 cards */
        .pricing-grid-row-1 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
          align-items: stretch;
        }

        /* Enterprise Toggle Container & Button */
        .enterprise-toggle-container {
          display: flex;
          justify-content: center;
          margin: 16px 0 30px;
        }

        .enterprise-toggle-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f0fdf4;
          color: #0f766e;
          border: 1.5px solid #a7f3d0;
          padding: 12px 28px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.08);
        }

        .enterprise-toggle-btn:hover {
          background: #dcfce7;
          border-color: #0f766e;
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(15, 118, 110, 0.15);
        }

        /* Desktop Row 2 = exactly 2 cards, horizontally centered & expandable */
        .pricing-grid-row-2 {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 60px;
          align-items: stretch;
        }

        .animate-expand {
          animation: expandFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes expandFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pricing-grid-row-2 .modern-card {
          width: calc(25% - 15px); /* Same width as Row 1 items on 4-column layout */
          min-width: 260px;
        }

        @media (max-width: 1024px) {
          .pricing-grid-row-1 {
            grid-template-columns: repeat(2, 1fr);
          }
          .pricing-grid-row-2 {
            flex-wrap: wrap;
          }
          .pricing-grid-row-2 .modern-card {
            width: calc(50% - 10px);
          }
        }

        @media (max-width: 640px) {
          .pricing-grid-row-1 {
            grid-template-columns: 1fr;
          }
          .pricing-grid-row-2 {
            flex-direction: column;
            align-items: center;
          }
          .pricing-grid-row-2 .modern-card {
            width: 100%;
          }
        }

        .modern-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 28px 24px;
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .modern-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.08);
        }

        .modern-card.popular {
          border-color: #10b981;
          box-shadow: 0 12px 28px -6px rgba(16, 185, 129, 0.18);
        }

        .modern-card.custom-card {
          background: #f0fdf4;
        }

        .popular-pill-tag {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          padding: 4px 18px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
        }

        .card-top-section {
          padding-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 20px;
        }

        .plan-name-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
        }

        .plan-subtitle-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 20px;
          line-height: 1.4;
          min-height: 38px;
        }

        .plan-price-display-wrapper {
          margin-bottom: 20px;
        }

        .price-primary-text {
          font-size: 38px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
        }

        .price-secondary-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
          font-weight: 600;
        }

        .card-cta-button {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 12px;
          background: #0f172a;
          color: white;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .card-cta-button:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .card-cta-button.popular-cta {
          background: #10b981;
        }

        .card-cta-button.popular-cta:hover {
          background: #059669;
        }

        .card-cta-button.custom-cta {
          background: #0f766e;
        }

        .card-cta-button.custom-cta:hover {
          background: #0d655e;
        }

        /* Card Features List */
        .card-features-section {
          flex-grow: 1;
        }

        .feature-header-title {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 14px;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: #334155;
          line-height: 1.4;
        }

        .check-icon {
          color: #10b981;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* POPUP SALES MODAL STYLING */
        .sales-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .sales-modal-content {
          background: #ffffff;
          border-radius: 24px;
          width: 100%;
          max-width: 520px;
          padding: 32px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .sales-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #f1f5f9;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .sales-modal-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .sales-modal-header {
          margin-bottom: 24px;
        }

        .modal-badge-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          color: #166534;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .sales-modal-header h2 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
        }

        .sales-modal-header p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .modal-sales-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .modal-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .modal-form-group label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .modal-form-group input, .modal-form-group select, .modal-form-group textarea {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s ease;
        }

        .modal-form-group input:focus, .modal-form-group select:focus, .modal-form-group textarea:focus {
          border-color: #10b981;
        }

        .modal-submit-btn {
          background: #0f766e;
          color: white;
          padding: 12px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
        }

        .modal-submit-btn:hover {
          background: #0d655e;
        }

        .modal-success-box {
          text-align: center;
          padding: 20px 0;
        }

        .modal-success-box h3 {
          font-size: 20px;
          color: #0f172a;
          margin: 14px 0 8px;
        }

        .modal-success-box p {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 20px;
        }

        .modal-done-btn {
          background: #0f766e;
          color: white;
          padding: 10px 24px;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .modal-error-box {
          background: #fef2f2;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-privacy-note {
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        /* Schedule Section */
        .credit-schedule-section {
          padding: 20px 0 60px;
        }

        .schedule-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .schedule-header h2 {
          font-size: 28px;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .schedule-header p {
          color: #64748b;
          font-size: 15px;
        }

        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }

        .schedule-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .schedule-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
        }

        .schedule-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .schedule-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .schedule-cost-chip {
          background: #0f766e15;
          color: #0f766e;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .schedule-action-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px;
        }

        .schedule-action-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}

export default PricingSection;
