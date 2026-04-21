import React, { useState, useRef } from "react";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { setPageTitle } from "../utils/pageTitle";
import { useEffect } from "react";

function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);
  const [buttonState, setButtonState] = useState("default"); // "default" or "sent"
  const buttonRef = useRef(null);
  const [showContactInfo, setShowContactInfo] = useState(false);


  useEffect(() => {
    setPageTitle(
      "Contact Us",
      "Get in touch with the SafeSign team for sales, support, or partnership inquiries. We’re here to help you succeed."
    );
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus(null);
    setButtonState("default");

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus("⚠️ Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus("⚠️ Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (!agreeToPolicy) {
      setSubmitStatus("⚠️ Please agree to the privacy policy.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Trigger button animation
      if (buttonRef.current) {
        buttonRef.current.focus();
      }

      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          subject: formData.subject.trim() || null,
          message: formData.message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      const result = await response.json();

      // Set button to "sent" state after animation
      setTimeout(() => {
        setButtonState("sent");
      }, 800);

      setSubmitStatus("" + result.message);

      // Reset form after delay
      setTimeout(() => {
        setFormData({ name: "", email: "", subject: "", message: "" });
        setAgreeToPolicy(false);
        setIsSubmitting(false);
      }, 2000);

    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitStatus("❌ Failed to send message. Please try again later.");
      setIsSubmitting(false);
      // Reset button state on error
      setButtonState("default");
    }
  };

  // Reset button state when form changes
  const handleFormChange = (e) => {
    handleChange(e);
    setButtonState("default");
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container} className="contact-grid">

        {/* Left Side - Hero Image & Contact Info */}
        <div
          className={`left-section ${showContactInfo ? "show" : ""}`}
          style={styles.leftSection}
        >

          {/* Hero Card with Image */}
          <div style={styles.heroCard}>
            <img
              src="/images/contact-hero.jpg"
              alt="Contact Us Hero"
              style={{ width: '100%', borderRadius: '20px', objectFit: 'cover', height: '100%' }}
            />
          </div>

          {/* Contact Methods Card */}
          <div style={styles.contactMethodsCard}>
            <div style={styles.contactMethod}>
              <div style={{ ...styles.methodIcon, backgroundColor: '#e3f2fd00' }}>
                <span style={styles.methodEmoji}><Mail size={28} color="#0f766e" /></span>
              </div>
              <div style={styles.methodDetails}>
                <h4 style={styles.methodTitle}>MAIL</h4>
                <p style={styles.methodText}>support@influenceai.com</p>
              </div>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.contactMethod}>
              <div style={{ ...styles.methodIcon, backgroundColor: '#e8f5e900' }}>
                <span style={styles.methodEmoji}><Phone size={28} color="#0f766e" /></span>
              </div>
              <div style={styles.methodDetails}>
                <h4 style={styles.methodTitle}>PHONE</h4>
                <p style={styles.methodText}>+1 (555) 123-4567</p>
              </div>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.contactMethod}>
              <div style={{ ...styles.methodIcon, backgroundColor: '#f3e5f500' }}>
                <span style={styles.methodEmoji}><MessageCircle size={28} color="#0f766e" /></span>
              </div>
              <div style={styles.methodDetails}>
                <h4 style={styles.methodTitle}>LIVE MESSAGE</h4>
                <p style={styles.methodText}>Available 9AM-6PM EST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Contact Form */}
        <div style={styles.rightSection}>
          {/* Mobile Toggle Button */}
          <button
            className="mobile-toggle"
            onClick={() => setShowContactInfo(prev => !prev)}
          >
            {showContactInfo ? "Hide contact details" : "Show contact details"}
          </button>

          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>Get in touch</h2>
              <p style={styles.formSubtitle}>Our friendly team would love to hear from you</p>
            </div>

            <div style={styles.formContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter your full name"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="Enter your email"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  placeholder="What is this regarding?"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  placeholder="How can we help you?"
                  rows="4"
                  style={styles.textarea}
                />
              </div>

              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="privacy"
                  checked={agreeToPolicy}
                  onChange={(e) => setAgreeToPolicy(e.target.checked)}
                  style={styles.checkbox}
                />
                <label htmlFor="privacy" style={styles.checkboxLabel}>
                  I agree to with friendly{" "}
                  <span style={styles.link}>privacy policy</span>
                </label>
              </div>

              {/* Animated Button */}
              <button
                ref={buttonRef}
                onClick={handleSubmit}
                className="button"
                style={buttonStyles.button}
                disabled={isSubmitting}
              >
                <div className="outline" style={buttonStyles.outline}></div>

                {/* Default State */}
                <div
                  className={`state state--default ${buttonState === "sent" ? "hidden" : ""}`}
                  style={buttonStyles.state}
                >
                  <div className="icon" style={buttonStyles.icon}>
                    <svg
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g style={{ filter: 'url(#shadow)' }}>
                        <path
                          d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
                          fill="currentColor"
                        ></path>
                      </g>
                      <defs>
                        <filter id="shadow">
                          <feDropShadow
                            dx="0"
                            dy="1"
                            stdDeviation="0.6"
                            floodOpacity="0.5"
                          />
                        </filter>
                      </defs>
                    </svg>
                  </div>
                  <p style={buttonStyles.paragraph}>
                    <span style={{ '--i': 0 }}>S</span>
                    <span style={{ '--i': 1 }}>e</span>
                    <span style={{ '--i': 2 }}>n</span>
                    <span style={{ '--i': 3 }}>d</span>
                    <span style={{ '--i': 4 }}>M</span>
                    <span style={{ '--i': 5 }}>e</span>
                    <span style={{ '--i': 6 }}>s</span>
                    <span style={{ '--i': 7 }}>s</span>
                    <span style={{ '--i': 8 }}>a</span>
                    <span style={{ '--i': 9 }}>g</span>
                    <span style={{ '--i': 10 }}>e</span>
                  </p>
                </div>

                {/* Sent State */}
                <div
                  className={`state state--sent ${buttonState === "sent" ? "" : "hidden"}`}
                  style={buttonStyles.state}
                >
                  <div className="icon" style={buttonStyles.icon}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      height="1em"
                      width="1em"
                      strokeWidth="0.5px"
                      stroke="black"
                    >
                      <g style={{ filter: 'url(#shadow)' }}>
                        <path
                          fill="currentColor"
                          d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"
                        ></path>
                        <path
                          fill="currentColor"
                          d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
                        ></path>
                      </g>
                    </svg>
                  </div>
                  <p style={buttonStyles.paragraph}>
                    <span style={{ '--i': 5 }}>S</span>
                    <span style={{ '--i': 6 }}>e</span>
                    <span style={{ '--i': 7 }}>n</span>
                    <span style={{ '--i': 8 }}>t</span>
                  </p>
                </div>
              </button>

              {submitStatus && (
                <div style={{
                  ...styles.submitStatus,
                  backgroundColor: submitStatus.includes('✅') ? '#d1fae5' : '#fee2e2',
                  color: submitStatus.includes('✅') ? '#065f46' : '#991b1b',
                  border: `1px solid ${submitStatus.includes('✅') ? '#a7f3d0' : '#fecaca'}`
                }}>
                  {submitStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        /* Button Animations */
        .button {
          --primary: #ff5569;
          --neutral-1: #f7f8f7;
          --neutral-2: #e7e7e7;
          --radius: 14px;
        }

        .button:hover {
          transform: scale(1.02);
          box-shadow: 0 0 1px 2px rgba(255, 255, 255, 0.3),
            0 15px 30px rgba(0, 0, 0, 0.3), 0 10px 3px -3px rgba(0, 0, 0, 0.04);
        }
        
        .button:active {
          transform: scale(1);
          box-shadow: 0 0 1px 2px rgba(255, 255, 255, 0.3),
            0 10px 3px -3px rgba(0, 0, 0, 0.2);
        }
        
        .button:focus {
          outline: none;
        }
        
        .button:focus .state--default {
          position: absolute;
        }
        
        .button:focus .state--sent {
          display: flex;
        }
        
        .button:hover .outline {
          opacity: 1;
        }
        
        .button:hover .outline::before {
          animation-play-state: running;
        }
        
        .button:hover p span {
          opacity: 1;
          animation: wave 0.5s ease forwards calc(var(--i) * 0.02s);
        }
        
        .button:focus p span {
          opacity: 1;
          animation: disapear 0.6s ease forwards calc(var(--i) * 0.03s);
        }
        
        .state--sent .icon svg {
          transform: scale(1.25);
          margin-right: 8px;
        }
        
        .state--default .icon svg {
          animation: land 0.6s ease forwards;
        }
        
        .button:hover .state--default .icon {
          transform: rotate(45deg) scale(1.25);
        }
        
        .button:focus .state--default svg {
          animation: takeOff 0.8s linear forwards;
        }
        
        .button:focus .state--default .icon {
          transform: rotate(0) scale(1.25);
        }
        
        .button:focus .state--default .icon:before {
          animation: contrail 0.8s linear forwards;
        }
        
        .button:focus .state--sent span {
          opacity: 0;
          animation: slideDown 0.8s ease forwards calc(var(--i) * 0.2s);
        }
        
        .button:focus .state--sent .icon svg {
          opacity: 0;
          animation: appear 1.2s ease forwards 0.8s;
        }
        
        .hidden {
          display: none !important;
        }
        
        /* Outline */
        .outline::before {
          content: "";
          position: absolute;
          inset: -100%;
          background: conic-gradient(
            from 180deg,
            transparent 60%,
            white 80%,
            transparent 100%
          );
          animation: spin 2s linear infinite;
          animation-play-state: paused;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Mobile behavior */
@media (max-width: 768px) {
  .left-section {
    display: none;
  }

  .left-section.show {
    display: block;
  }

  .mobile-toggle {
    display: block;
    width: 100%;
    margin-bottom: 16px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1.5px solid #0f766e;
    background: #f0fdfa;
    color: #0f766e;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
}

/* Desktop behavior */
.mobile-toggle {
  display: none;
}
@media (max-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr !important;
  }
}



        /* Letters */
        .state p span {
          display: block;
          opacity: 0;
          animation: slideDown 0.8s ease forwards calc(var(--i) * 0.03s);
        }
        
        @keyframes wave {
          30% {
            opacity: 1;
            transform: translateY(4px) translateX(0) rotate(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-3px) translateX(0) rotate(0);
            color: var(--primary);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0);
          }
        }
        
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateY(-20px) translateX(5px) rotate(-90deg);
            color: var(--primary);
            filter: blur(5px);
          }
          30% {
            opacity: 1;
            transform: translateY(4px) translateX(0) rotate(0);
            filter: blur(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-3px) translateX(0) rotate(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0);
          }
        }
        
        @keyframes disapear {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
            transform: translateX(5px) translateY(20px);
            color: var(--primary);
            filter: blur(5px);
          }
        }
        
        /* Plane */
        @keyframes takeOff {
          0% { opacity: 1; }
          60% {
            opacity: 1;
            transform: translateX(70px) rotate(45deg) scale(2);
          }
          100% {
            opacity: 0;
            transform: translateX(160px) rotate(45deg) scale(0);
          }
        }
        
        @keyframes land {
          0% {
            transform: translateX(-60px) translateY(30px) rotate(-50deg) scale(2);
            opacity: 0;
            filter: blur(3px);
          }
          100% {
            transform: translateX(0) translateY(0) rotate(0);
            opacity: 1;
            filter: blur(0);
          }
        }
        
        /* Contrail */
        .state--default .icon:before {
          content: "";
          position: absolute;
          top: 50%;
          height: 2px;
          width: 0;
          left: -5px;
          background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.5));
        }
        
        @keyframes contrail {
          0% {
            width: 0;
            opacity: 1;
          }
          8% {
            width: 15px;
          }
          60% {
            opacity: 0.7;
            width: 80px;
          }
          100% {
            opacity: 0;
            width: 160px;
          }
        }
        
        /* Checkmark */
        @keyframes appear {
          0% {
            opacity: 0;
            transform: scale(4) rotate(-40deg);
            color: var(--primary);
            filter: blur(4px);
          }
          30% {
            opacity: 1;
            transform: scale(0.6);
            filter: blur(1px);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

// Original styles remain the same
const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#ffffffff',
    padding: '40px 20px'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    alignItems: 'start',
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heroCard: {
    backgroundColor: 'white',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '400px',
  },
  contactMethodsCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  contactMethod: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '8px 0',
  },
  methodIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  methodEmoji: {
    fontSize: '24px',
  },
  methodDetails: {
    flex: 1,
  },
  methodTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 4px 0',
    letterSpacing: '0.5px',
  },
  methodText: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
    fontWeight: '500',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '16px 0',
  },
  rightSection: {
    position: 'sticky',
    top: '40px',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  formHeader: {
    marginBottom: '32px',
  },
  formTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#0f766e',
    margin: '0 0 8px 0',
  },
  formSubtitle: {
    fontSize: '15px',
    color: '#0d948992',
    margin: 0,
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '1.5px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '1.5px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginTop: '4px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    marginTop: '2px',
    cursor: 'pointer',
    accentColor: '#0f766e',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  submitStatus: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center',
  },
};

// New button styles
const buttonStyles = {
  button: {
    cursor: 'pointer',
    border: 'none',
    borderRadius: '14px',
    textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
    boxShadow: '0 0.5px 0.5px 1px rgba(255, 255, 255, 0.2), 0 10px 20px rgba(0, 0, 0, 0.2), 0 4px 5px 0px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.3s ease',
    minWidth: '200px',
    padding: '20px',
    height: '68px',
    fontFamily: '"Galano Grotesque", Poppins, Montserrat, sans-serif',
    fontSize: '18px',
    fontWeight: '600',
    width: '100%',
    marginTop: '8px',
    backgroundColor: 'transparent',
    color: '#1a1a1a',
  },
  outline: {
    position: 'absolute',
    borderRadius: 'inherit',
    overflow: 'hidden',
    zIndex: 1,
    opacity: 0,
    transition: 'opacity 0.4s ease',
    inset: '-2px -3.5px',
  },
  state: {
    paddingLeft: '29px',
    zIndex: 2,
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    position: 'absolute',
    left: '0',
    top: '0',
    bottom: '0',
    margin: 'auto',
    transform: 'scale(1.25)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paragraph: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
  },
};

export default ContactUs;
