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
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();



  const plans = [
    {
      name: 'Basic',
      price: 22,
      description: 'Everything in our free plan plus....',
      features: [
        '200+ integrations',
        'Advanced reporting and analytics',
        'Up to 10 individual users',
        '20GB individual data each user',
        'Basic chat and email support'
      ],
      cta: 'Get started',
      color: '#4ba6f1'
    },
    {
      name: 'Business',
      price: 40,
      description: 'Everything in Basic plus....',
      features: [
        '200+ integrations',
        'Advanced reporting and analytics',
        'Up to 20 individual users',
        '40GB individual data each user',
        'Priority chat and email support'
      ],
      cta: 'Get started',
      color: '#10b981',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 64,
      description: 'Everything in Business plus....',
      features: [
        '200+ integrations',
        'Advanced reporting and analytics',
        'Unlimited individual users',
        'Unlimited individual data',
        'Personalized + priority service'
      ],
      cta: 'Get started',
      color: '#f6da5c'
    }
  ];

  const getPrice = (plan) => {
    if (billingCycle === 'annually') {
      const annualPrice = Math.round(plan.price * 12 * 0.8); // 20% discount
      return `$${annualPrice}`;
    }
    return `$${plan.price}`;
  };

  const getPeriod = () => {
    return billingCycle === 'monthly' ? 'per month' : 'per year';
  };

  return (
    <div className="modern-pricing">
      <PricingHero />
      {/* Header */}
      <div className="modern-pricing-header">
        <div className="modern-container">
          <h1 className="modern-title">Simple & transparent pricing for all business sizes</h1>

          {/* Billing Toggle */}
          <div className="billing-options">
            <button
              className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              <div className="billing-dot"></div>
              <span>Monthly billing</span>
            </button>

            <button
              className={`billing-option ${billingCycle === 'annually' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annually')}
            >
              <div className="billing-dot"></div>
              <span>Annual billing</span>
              <span className="save-label">Save 20%</span>
            </button>
          </div>
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
                  <div className="card-header">
                    <h3 className="plan-name">{plan.name} plan</h3>
                    <div className="price-section">
                      <span className="price">{getPrice(plan)}</span>
                      <span className="period">{getPeriod()}</span>
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
          font-size: 38px;
          font-weight: 700;
          color: #0f766e;
          margin-bottom: 48px;
          line-height: 1.2;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .billing-options {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 40px;
        }

        .billing-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          font-size: 16px;
          font-weight: 500;
          color: #6b7280;
        }

        .billing-option:hover {
          border-color: #d1d5db;
          background: #f3f4f6;
        }

        .billing-option.active {
          background: #ffffff;
          border-color: #0f766e;
          color: #111827;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }

        .billing-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #d1d5db;
          transition: background 0.3s;
        }

        .billing-option.active .billing-dot {
          background: #0f766e;
        }

        .save-label {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #10b981;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          white-space: nowrap;
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

        .card-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .plan-name {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .price-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .price {
          font-size: 48px;
          font-weight: 800;
          color: #111827;
          line-height: 1;
        }

        .period {
          font-size: 16px;
          color: #6b7280;
          font-weight: 500;
        }

        .cta-button {
          width: 100%;
          padding: 16px;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 32px;
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
