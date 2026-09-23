import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function SimpleFAQ() {
  const [activeFAQ, setActiveFAQ] = useState(null);

  const testimonials = [
    {
      text: "The credit-based model is fantastic for our legal practice. We only pay for the documents we send and AI contracts we generate. The 7,000 yearly credits save us over 30% compared to legacy signature software.",
      name: "Sarah Johnson",
      company: "Brown & Associates Law"
    },
    {
      text: "The Lifetime plan with 50,000 credits was an incredible investment for our enterprise team. Instant API access and zero monthly bills.",
      name: "Michael Chen",
      company: "TechInsights Inc."
    },
    {
      text: "We started with the 100 free trial credits, generated our first 5 contracts with the AI builder, and bought the 2,000 credit top-up pack. Smooth, fast, and transparent.",
      name: "Jessica Williams",
      company: "FitLife Apparel"
    }
  ];

  const faqs = [
    {
      question: "How does the credit-based pricing model work?",
      answer: "Every platform action (sending a document for e-signature, generating an AI contract, or parsing fields) consumes credits based on a transparent schedule. Your monthly or annual subscription includes credits every billing period, and you can add top-up credit packs whenever you need more."
    },
    {
      question: "Do credit top-up packs expire?",
      answer: "No! Pay-as-you-go credit top-up packs never expire. They remain in your available credit balance indefinitely until you use them."
    },
    {
      question: "What comes with the 15-day Free Trial?",
      answer: "New signups automatically receive 100 free credits with full platform access for 15 days. No credit card is required to start testing e-signatures, AI document generation, or real-time audit trails."
    },
    {
      question: "Can I change plans or buy extra credits anytime?",
      answer: "Yes! You can switch between Monthly and Yearly billing, upgrade to Lifetime access, or purchase credit top-up packs directly from your user dashboard at any time."
    }
  ];

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  return (
    <div className="simple-faq">
      <div className="faq-container">
        {/* Testimonials Section */}
        <section className="testimonials-section">
          <h2 className="section-title">What Our Customers Say</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="quote-mark">"</div>
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-author">
                  <div className="author-info">
                    <h4 className="author-name">{testimonial.name}</h4>
                    <p className="author-company">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${activeFAQ === index ? 'active' : ''}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="question-text">{faq.question}</span>
                  <span className="faq-icon">
                    {activeFAQ === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </span>
                </button>
                
                {activeFAQ === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .simple-faq {
          padding: 60px 0;
          background: #f8fafc;
        }

        .faq-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .section-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          text-align: center;
          margin-bottom: 40px;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 60px;
        }

        .testimonial-card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          border: 1px solid #e2e8f0;
          position: relative;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .quote-mark {
          font-size: 48px;
          color: #0f766e;
          font-family: Georgia, serif;
          line-height: 1;
          margin-bottom: -10px;
        }

        .testimonial-text {
          font-size: 14px;
          color: #334155;
          line-height: 1.6;
          margin-bottom: 20px;
          font-style: italic;
        }

        .author-name {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .author-company {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0 0;
        }

        .faq-list {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .faq-item.active {
          border-color: #0f766e;
        }

        .faq-question {
          width: 100%;
          padding: 20px 24px;
          background: transparent;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          text-align: left;
        }

        .question-text {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .faq-answer {
          padding: 0 24px 20px;
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
        }
      `}</style>
    </div>
  );
}

export default SimpleFAQ;
