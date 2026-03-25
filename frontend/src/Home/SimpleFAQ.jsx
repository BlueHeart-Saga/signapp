import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function SimpleFAQ() {
  const [activeFAQ, setActiveFAQ] = useState(null);

  const testimonials = [
    {
      text: "Since switching to the Professional plan, we've increased our influencer marketing ROI by 137%. The advanced analytics alone are worth the investment.",
      name: "Sarah Johnson",
      company: "Brown Cosmetics"
    },
    {
      text: "The Enterprise plan has transformed how we manage influencer relationships. The custom workflows and dedicated support have saved us countless hours.",
      name: "Michael Chen",
      company: "TechInsights Inc."
    },
    {
      text: "We started with the Starter plan and gradually upgraded as our needs grew. The scalability of the platform has been perfect for our expanding business.",
      name: "Jessica Williams",
      company: "FitLife Apparel"
    }
  ];

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, the new features are available immediately. When downgrading, changes take effect at the start of your next billing cycle."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes! We offer a 14-day free trial for all paid plans. No credit card required to start. You'll get full access to all features during your trial period."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and for annual Enterprise plans we also accept bank transfers."
    },
    {
      question: "Do you offer discounts for non-profits?",
      answer: "Yes, we offer a 25% discount for registered non-profit organizations. Please contact our sales team with proof of your non-profit status to get this discount applied."
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
          width: 100%;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
          padding: 80px 0;
        }

        .faq-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Section Titles */
        .section-title {
          font-size: 32px;
          font-weight: 700;
          text-align: center;
          color: #111827;
          margin-bottom: 40px;
        }

        /* Testimonials */
        .testimonials-section {
          margin-bottom: 80px;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .testimonial-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 32px;
          transition: all 0.3s;
        }

        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border-color: #0d9488;
        }

        .quote-mark {
          font-size: 48px;
          color: #0d9488;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 16px;
          height: 40px;
        }

        .testimonial-text {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 24px;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-info {
          flex: 1;
        }

        .author-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .author-company {
          font-size: 14px;
          color: #6b7280;
        }

        /* FAQ Section */
        .faq-section {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-item {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .faq-item:hover {
          border-color: #d1d5db;
        }

        .faq-item.active {
          border-color: #0d9488;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }

        .faq-question {
          width: 100%;
          padding: 24px;
          background: transparent;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          text-align: left;
          transition: background 0.2s;
        }

        .faq-question:hover {
          background: #f9fafb;
        }

        .question-text {
          flex: 1;
          padding-right: 20px;
        }

        .faq-icon {
          color: #6b7280;
          flex-shrink: 0;
        }

        .faq-answer {
          padding: 0 24px 24px;
        }

        .faq-answer p {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.6;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .testimonials-grid {
            gap: 20px;
          }
          
          .testimonial-card {
            padding: 24px;
          }
        }

        @media (max-width: 768px) {
          .simple-faq {
            padding: 60px 0;
          }
          
          .testimonials-grid {
            grid-template-columns: 1fr;
            max-width: 500px;
            margin: 0 auto;
          }
          
          .section-title {
            font-size: 28px;
            margin-bottom: 32px;
          }
          
          .faq-question {
            padding: 20px;
            font-size: 16px;
          }
          
          .faq-answer {
            padding: 0 20px 20px;
          }
        }

        @media (max-width: 480px) {
          .simple-faq {
            padding: 40px 0;
          }
          
          .faq-container {
            padding: 0 16px;
          }
          
          .section-title {
            font-size: 24px;
            margin-bottom: 24px;
          }
          
          .testimonial-card {
            padding: 20px;
          }
          
          .testimonial-text {
            font-size: 15px;
          }
          
          .faq-question {
            padding: 16px;
          }
          
          .faq-answer {
            padding: 0 16px 16px;
          }
          
          .faq-answer p {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
}

export default SimpleFAQ;