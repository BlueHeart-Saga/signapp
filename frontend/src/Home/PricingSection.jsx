import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import IntegrationsScroll from './IntegrationsScroll';

import SimpleFAQ from './SimpleFAQ';
import PricingHero from './PricingHero';
import FeatureComparisonTable from './FeatureComparisonTable';

import { setPageTitle } from "../utils/pageTitle";
import { useEffect } from "react";

function PricingSection() {
  useEffect(() => {
    setPageTitle(
      "Transparent E-Signature Pricing & Plans | SafeSign",
      "Find the perfect plan for your business with SafeSign's transparent pricing. From individual pros to large enterprises, we offer scalable e-signature and document management solutions."
    );
  }, []);
  
  const navigate = useNavigate();

  const plans = [
    {
      name: 'BASIC',
      price: '9.99',
      description: 'Perfect for individuals & small projects',
      features: [
        'Unlimited Document Uploads',
        'Professional Document Builder',
        'Real-time Email Notifications',
        'Standard Audit Trails',
        'Basic Document Analytics',
        'Email Support'
      ],
      cta: 'Start Monthly',
      color: '#ff6a34', // Orange
      period: 'per month'
    },
    {
      name: 'STANDARD',
      price: '99.99',
      description: 'Ideal for growing teams & professionals',
      features: [
        'Everything in Basic',
        'AI-Powered Template Generation',
        'Custom Branding (Logos)',
        'AI Field Auto-Positioning',
        'Advanced Analytics Dashboard',
        'Priority Chat Support'
      ],
      cta: 'Go Standard',
      color: '#1e6afb', // Blue
      popular: true,
      period: 'per year'
    },
    {
      name: 'ENTERPRISE',
      price: '0',
      description: 'For large organizations with complex needs',
      features: [
        'Everything in Standard',
        'Dedicated Account Manager',
        'Custom SLA & API Access',
        'In-person Signing Support',
        'White-label Document Portal',
        'Single Sign-On (SSO)'
      ],
      cta: 'Contact Enterprise',
      color: '#00c25a', // Green
      isEnterprise: true
    }
  ];



  return (
    <div className="modern-pricing">
      <PricingHero />
      {/* Header */}
      <div className="modern-pricing-header">
        <div className="modern-container">
          <h1 className="modern-title">Choose the perfect plan for your business</h1>
          <p className="modern-subtitle">Simple, transparent pricing. No hidden fees.</p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="modern-pricing-cards">
        <div className="modern-container">
          <div className="cards-grid">
            {plans.map((plan, index) => (
              <div key={index} className={`modern-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && (
                  <div className="popular-tag">
                    <span>Most Popular</span>
                  </div>
                )}

                <div className="card-content">
                  <div className="card-header-v2">
                    <div className="plan-badge" style={{ backgroundColor: `${plan.color}15`, color: plan.color }}>
                      {plan.name}
                    </div>
                    <div className="price-container">
                      {plan.isEnterprise ? (
                        <div className="enterprise-price-box">
                          <span className="enterprise-title" style={{ color: plan.color }}>Custom Plan</span>
                          <span className="enterprise-desc">Talk to Sales</span>
                        </div>
                      ) : (
                        <div className="standard-price-box">
                          {plan.originalPrice && (
                            <span className="strikethrough-price">${plan.originalPrice}</span>
                          )}
                          <div className="price-main">
                            <span className="currency">$</span>
                            <span className="amount">{plan.price.split('.')[0]}</span>
                            <span className="decimal">.{plan.price.split('.')[1]}</span>
                          </div>
                          <span className="price-period">{plan.period}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="cta-button"
                    onClick={() => navigate("/login")}

                  >
                    {plan.cta}
                  </button>

                  <div className="features-section">
                    <div className="features-header">
                      <span className="features-label">FEATURES</span>
                      <p className="features-description">{plan.description}</p>
                    </div>

                    <ul className="features-list">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="feature-item">
                          <span className="feature-bullet">-</span>
                          <span className="feature-text">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>



        <IntegrationsScroll />

        <FeatureComparisonTable />

        <SimpleFAQ />

        <section className="pricing-cta">
          <div className="pricing-cta-container">

            {/* LEFT IMAGE */}
            <div className="pricing-cta-image">
              <img
                src="/images/demo-person.png"   // 🔁 put your image here
                alt="Schedule a demo"
              />
            </div>

            {/* RIGHT CONTENT */}
            <div className="pricing-cta-content">
              <h2>Still not sure which plan is right for you?</h2>

              <p>
                Our team is happy to provide a personalized demo and help you choose
                the best fit for your team’s unique requirements.
              </p>

              <div className="pricing-cta-actions">
                <button
                  className="btn-primary2"
                  onClick={() => navigate("/demo")}
                >
                  Schedule a Demo
                </button>

                <button
                  className="btn-outline1"
                  onClick={() => navigate("/login")}
                >
                  Get Started Free
                </button>
              </div>

              <small>
                No credit card required · 14-day free trial · Cancel anytime
              </small>
            </div>

          </div>
        </section>


        {/* 
         <section style={{
      width: '100%',
      padding: '80px 0',
      background: '#0f766e',
      color: 'white',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <h2 style={{
          fontSize: '48px',
          fontWeight: '800',
          marginBottom: '16px',
          lineHeight: '1.2'
        }}>
          Still not sure which plans is right for you ?
        </h2>
        
        <p style={{
          fontSize: '20px',
          opacity: '0.9',
          marginBottom: '40px',
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: '0 auto 40px'
        }}>
          Join over 5,000 brands that trust SafeSign to power their partnerships
        </p>
        
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center'
        }}>
          <button 
            onClick={() => navigate("/login")}
            style={{
              padding: '16px 32px',
              background: 'white',
              color: '#0f766e',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          >
            Start Free Trial
          </button>
          
          <button 
            onClick={() => navigate("/demo")}
            style={{
              padding: '16px 32px',
              background: 'transparent',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'white';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Schedule a Demo
          </button>
        </div>
      </div>
    </section> */}
      </div>

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

        /* Header Styles */
        .modern-pricing-header {
          padding: 80px 0 40px;
          text-align: center;
        }

        .modern-title {
          font-size: 48px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 16px;
          line-height: 1.1;
          letter-spacing: -1.5px;
        }

        .modern-subtitle {
          font-size: 20px;
          color: #64748b;
          margin-bottom: 48px;
          font-weight: 400;
        }

        .billing-options {
          display: none;
        }

        /* Cards Section */
        .modern-pricing-cards {
          padding: 40px 0 0;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 32px;
        }

        .modern-card {
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 32px;
          transition: all 0.3s;
          position: relative;
          height: 100%;
        }

        .modern-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border-color: transparent;
        }

        .modern-card.popular {
          border-color: #0f766e;
          box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.1);
        }

        .popular-tag {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          background: #0f766e;
          color: white;
          padding: 8px 24px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .card-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        /* Header V2 Styles */
        .card-header-v2 {
          text-align: center;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .plan-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .price-container {
          min-height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .strikethrough-price {
          font-size: 16px;
          color: #94a3b8;
          text-decoration: line-through;
          font-weight: 600;
          display: block;
          margin-bottom: 2px;
        }

        .price-main {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          color: #1e293b;
        }

        .currency {
          font-size: 20px;
          font-weight: 700;
          margin-top: 6px;
          margin-right: 2px;
        }

        .amount {
          font-size: 56px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -2px;
        }

        .decimal {
          font-size: 20px;
          font-weight: 700;
          margin-top: 6px;
        }

        .price-period {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
          display: block;
        }

        .enterprise-price-box {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .enterprise-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .enterprise-desc {
          font-size: 15px;
          color: #64748b;
          font-weight: 600;
          margin-top: 4px;
        }

        .cta-button {
          width: 100%;
          padding: 16px;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 32px;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .cta-button:hover {
          background: #115e59;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 118, 110, 0.3);
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .features-section {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .features-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .features-label {
          display: inline-block;
          background: #f3f4f6;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 12px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .features-description {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          flex: 1;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 14px;
          color: #4b5563;
          line-height: 1.5;
        }

        .feature-item:last-child {
          margin-bottom: 0;
        }

        .feature-bullet {
          color: #10b981;
          font-weight: 700;
          font-size: 18px;
          line-height: 1;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .feature-text {
          flex: 1;
        }

          .btn-primary2 {
  padding: 16px 32px;
  background: #ffffff;
  color: #0f766e;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
}

.btn-primary2:hover {
color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.35);
  background: rgba(255,255,255,0.12);
}

        .btn-outline1 {
          padding: 16px 32px;
          background: transparent;
          color: #ffffff;
          border: 2px solid rgba(255,255,255,0.4);
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .btn-outline1:hover {
          background: rgba(255,255,255,0.12);
          border-color: #ffffff;
          transform: translateY(-2px);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .cards-grid {
            gap: 24px;
          }

          .modern-card {
            padding: 24px;
          }

          .price {
            font-size: 40px;
          }
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          }

          .modern-title {
            font-size: 32px;
          }

          .billing-options {
            flex-direction: column;
            align-items: center;
            max-width: 300px;
            margin-left: auto;
            margin-right: auto;
          }

          .billing-option {
            width: 100%;
            justify-content: center;
          }

          .modern-pricing-header {
            padding: 60px 0 40px;
          }

          .modern-pricing-cards {
            padding: 20px 0 60px;
          }
        }

        @media (max-width: 480px) {
          .modern-title {
            font-size: 28px;
          }

          .modern-container {
            padding: 0 16px;
          }

          .modern-card {
            padding: 20px;
          }

          .price {
            font-size: 36px;
          }

          .plan-name {
            font-size: 20px;
          }

          .cta-button {
            padding: 14px;
            font-size: 15px;
          }

          .feature-item {
            font-size: 13px;
          }
        }

        @media (max-width: 360px) {
          .modern-title {
            font-size: 24px;
          }

          .price {
            font-size: 32px;
          }

          .plan-name {
            font-size: 18px;
          }

          .popular-tag {
            font-size: 12px;
            padding: 6px 16px;
          }

          
        }
      `}</style>
    </div>
  );
}

export default PricingSection;
