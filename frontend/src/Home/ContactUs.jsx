import React, { useState, useRef, useEffect } from "react";
import { Mail, Phone, MessageCircle, AlertCircle, CheckCircle, Clock, ShieldCheck, Copy, Check, Send } from "lucide-react";
import { setPageTitle } from "../utils/pageTitle";
import showAlert from "../utils/swal";

function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);
  const [buttonState, setButtonState] = useState("default"); // "default" or "sent"
  const buttonRef = useRef(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const subjectInputRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    setPageTitle(
      "Contact Esigniva | Sales, Support & Partnership Inquiries",
      "Contact the Esigniva team for enterprise sales, customer support, or partnership opportunities. We provide secure e-signature solutions and dedicated support for global teams."
    );
  }, []);

  const validateField = (name, value) => {
    let error = "";
    if (name === "name") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        error = "Full name is required";
      } else if (trimmed.length < 2) {
        error = "Name must be at least 2 characters";
      } else if (!/[a-zA-Z]/.test(trimmed)) {
        error = "Name must contain alphabetical characters";
      } else if (/<[^>]*>/i.test(trimmed)) {
        error = "Invalid characters detected in name";
      }
    } else if (name === "email") {
      const trimmed = (value || "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmed) {
        error = "Email address is required";
      } else if (!emailRegex.test(trimmed)) {
        error = "Please enter a valid email address (e.g. name@company.com)";
      }
    } else if (name === "subject") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        error = "Subject is required";
      } else if (trimmed.length < 2) {
        error = "Subject must be at least 2 characters";
      }
    } else if (name === "message") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        error = "Message is required";
      } else if (trimmed.length < 10) {
        error = `Please write at least 10 characters (${10 - trimmed.length} more needed)`;
      } else if (trimmed.length > 5000) {
        error = "Message cannot exceed 5000 characters";
      }
    } else if (name === "agreeToPolicy") {
      if (!value) {
        error = "Please agree to the privacy policy to submit";
      }
    }
    return error;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setButtonState("default");

    if (submitted || touched[name]) {
      const err = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleCopy = (text, type) => {
    try {
      navigator.clipboard.writeText(text);
      if (type === "email") {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      }
    } catch (err) {
      console.debug("Clipboard copy failed:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setSubmitted(true);
    setTouched({
      name: true,
      email: true,
      subject: true,
      message: true,
      agreeToPolicy: true,
    });

    const nameErr = validateField("name", formData.name);
    const emailErr = validateField("email", formData.email);
    const subjectErr = validateField("subject", formData.subject);
    const messageErr = validateField("message", formData.message);
    const policyErr = validateField("agreeToPolicy", agreeToPolicy);

    const newErrors = {
      name: nameErr,
      email: emailErr,
      subject: subjectErr,
      message: messageErr,
      agreeToPolicy: policyErr,
    };

    setFieldErrors(newErrors);

    if (nameErr || emailErr || subjectErr || messageErr || policyErr) {
      if (nameErr && nameInputRef.current) nameInputRef.current.focus();
      else if (emailErr && emailInputRef.current) emailInputRef.current.focus();
      else if (subjectErr && subjectInputRef.current) subjectInputRef.current.focus();
      else if (messageErr && messageInputRef.current) messageInputRef.current.focus();
      return;
    }

    setIsSubmitting(true);
    setButtonState("default");

    try {
      if (buttonRef.current) {
        buttonRef.current.focus();
      }

      const API_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "http://localhost:9000";

      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          subject: formData.subject.trim() || "General Inquiry",
          message: formData.message.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to submit form");
      }

      setButtonState("sent");

      // Show SweetAlert Success Modal
      await showAlert.success(
        "Message Sent Successfully!",
        "Thank you for contacting Esigniva! A confirmation email has been dispatched to your inbox, and our dedicated team will get back to you shortly.",
        {
          confirmButtonText: "Got It",
          timer: 5000,
          timerProgressBar: true,
        }
      );

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setAgreeToPolicy(false);
      setTouched({});
      setSubmitted(false);
      setFieldErrors({});

      setTimeout(() => {
        setButtonState("default");
      }, 1500);

    } catch (error) {
      console.error("Error submitting contact form:", error);
      setButtonState("default");
      showAlert.error(
        "Submission Failed",
        error.message || "Failed to send message. Please check your network and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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
              style={{ width: '100%', borderRadius: '20px', objectFit: 'cover', height: '100%', minHeight: '380px' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/contact-hero.png";
              }}
            />
            {/* Overlay quick response badge */}
            <div style={styles.heroBadge}>
              <Clock size={16} color="#0f766e" />
              <span>Average response time: <strong>under 2 hours</strong></span>
            </div>
          </div>

          {/* Contact Methods Card */}
          <div style={styles.contactMethodsCard}>
            <div style={styles.contactMethod}>
              <div style={{ ...styles.methodIcon, backgroundColor: '#f0fdfa' }}>
                <span style={styles.methodEmoji}><Mail size={24} color="#0f766e" /></span>
              </div>
              <div style={styles.methodDetails}>
                <h4 style={styles.methodTitle}>EMAIL US DIRECTLY</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <a href="mailto:info@esigniva.com" style={styles.contactLink}>
                    info@esigniva.com
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy("info@esigniva.com", "email")}
                    style={styles.copyBtn}
                    title="Copy email address"
                  >
                    {copiedEmail ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#64748b" />}
                    <span>{copiedEmail ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.contactMethod}>
              <div style={{ ...styles.methodIcon, backgroundColor: '#f0fdfa' }}>
                <span style={styles.methodEmoji}><Phone size={24} color="#0f766e" /></span>
              </div>
              <div style={styles.methodDetails}>
                <h4 style={styles.methodTitle}>DIRECT PHONE LINE</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <a href="tel:+442079460192" style={styles.contactLink}>
                    +44 (0)20 7946 0192
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy("+442079460192", "phone")}
                    style={styles.copyBtn}
                    title="Copy phone number"
                  >
                    {copiedPhone ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#64748b" />}
                    <span>{copiedPhone ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.contactMethod}>
              <div style={{ ...styles.methodIcon, backgroundColor: '#f0fdfa' }}>
                <span style={styles.methodEmoji}><MessageCircle size={24} color="#0f766e" /></span>
              </div>
              <div style={styles.methodDetails}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={styles.methodTitle}>LIVE SUPPORT</h4>
                  <span style={styles.liveIndicator}>
                    <span style={styles.liveDot}></span>
                    Online
                  </span>
                </div>
                <p style={styles.methodText}>Available 9:00 AM - 6:00 PM EST (Mon-Fri)</p>
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
              <ShieldCheck size={18} color="#0f766e" />
              <span>All communications are 256-bit SSL encrypted & strictly confidential.</span>
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
              <p style={styles.formSubtitle}>
                Have a question, need enterprise support, or looking to partner? Fill out the form and our team will get back to you shortly.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate style={styles.formContainer}>
              {/* Full Name */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Full name <span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  placeholder="e.g. John Doe"
                  style={styles.input(!!fieldErrors.name)}
                />
                {fieldErrors.name && (
                  <p style={styles.errorText}>
                    <AlertCircle size={14} />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Email address <span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  placeholder="you@company.com"
                  style={styles.input(!!fieldErrors.email)}
                />
                {fieldErrors.email && (
                  <p style={styles.errorText}>
                    <AlertCircle size={14} />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Subject */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Subject <span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  ref={subjectInputRef}
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  placeholder="What is this regarding?"
                  style={styles.input(!!fieldErrors.subject)}
                />
                {fieldErrors.subject && (
                  <p style={styles.errorText}>
                    <AlertCircle size={14} />
                    <span>{fieldErrors.subject}</span>
                  </p>
                )}
              </div>

              {/* Message */}
              <div style={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={styles.label}>
                    Message <span style={styles.requiredAsterisk}>*</span>
                  </label>
                  <span style={styles.charCounter(formData.message.length < 10 && (submitted || touched.message))}>
                    {formData.message.length} / 5000 chars (min 10)
                  </span>
                </div>
                <textarea
                  ref={messageInputRef}
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  placeholder="How can we help you? Please describe your request or question in detail..."
                  rows="4"
                  maxLength={5000}
                  style={styles.textarea(!!fieldErrors.message)}
                />
                {fieldErrors.message && (
                  <p style={styles.errorText}>
                    <AlertCircle size={14} />
                    <span>{fieldErrors.message}</span>
                  </p>
                )}
              </div>

              {/* Privacy Policy Checkbox */}
              <div style={styles.checkboxWrapper}>
                <div style={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={agreeToPolicy}
                    onChange={(e) => {
                      setAgreeToPolicy(e.target.checked);
                      if (e.target.checked && fieldErrors.agreeToPolicy) {
                        setFieldErrors((prev) => ({ ...prev, agreeToPolicy: "" }));
                      }
                    }}
                    style={styles.checkbox}
                  />
                  <label htmlFor="privacy" style={styles.checkboxLabel}>
                    I agree to the{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" style={styles.link}>
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" style={styles.link}>
                      Privacy Policy
                    </a>.
                  </label>
                </div>
                {fieldErrors.agreeToPolicy && (
                  <p style={{ ...styles.errorText, marginLeft: '28px', marginTop: '4px' }}>
                    <AlertCircle size={14} />
                    <span>{fieldErrors.agreeToPolicy}</span>
                  </p>
                )}
              </div>

              {/* Animated Button */}
              <button
                ref={buttonRef}
                type="submit"
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
                    {isSubmitting ? (
                      <span>Sending Message...</span>
                    ) : (
                      <>
                        <span style={{ '--i': 0 }}>S</span>
                        <span style={{ '--i': 1 }}>e</span>
                        <span style={{ '--i': 2 }}>n</span>
                        <span style={{ '--i': 3 }}>d</span>
                        <span style={{ '--i': 4 }}>&nbsp;</span>
                        <span style={{ '--i': 5 }}>M</span>
                        <span style={{ '--i': 6 }}>e</span>
                        <span style={{ '--i': 7 }}>s</span>
                        <span style={{ '--i': 8 }}>s</span>
                        <span style={{ '--i': 9 }}>a</span>
                        <span style={{ '--i': 10 }}>g</span>
                        <span style={{ '--i': 11 }}>e</span>
                      </>
                    )}
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
            </form>
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

// Enhanced styles
const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '48px 20px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1.15fr',
    gap: '36px',
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
    borderRadius: '20px',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.07)',
    border: '1px solid #f1f5f9',
  },
  heroBadge: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    right: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    backdropFilter: 'blur(8px)',
    padding: '10px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
  },
  contactMethodsCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
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
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid #ccfbf1',
  },
  methodEmoji: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodDetails: {
    flex: 1,
  },
  methodTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    margin: '0 0 4px 0',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
  },
  contactLink: {
    fontSize: '14.5px',
    color: '#0f172a',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  },
  methodText: {
    fontSize: '13.5px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500',
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    fontSize: '11.5px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  liveIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#ecfdf5',
    color: '#047857',
    fontSize: '11.5px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1px solid #a7f3d0',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    display: 'inline-block',
  },
  divider: {
    height: '1px',
    backgroundColor: '#f1f5f9',
    margin: '16px 0',
  },
  rightSection: {
    position: 'sticky',
    top: '30px',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 12px 35px -10px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
  },
  formHeader: {
    marginBottom: '28px',
  },
  formTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#0f766e',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  formSubtitle: {
    fontSize: '14.5px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#334155',
  },
  requiredAsterisk: {
    color: '#ef4444',
    marginLeft: '3px',
  },
  input: (hasError) => ({
    width: '100%',
    padding: '12px 16px',
    fontSize: '14.5px',
    border: hasError ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
    backgroundColor: hasError ? '#fef2f2' : '#ffffff',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    color: '#0f172a',
  }),
  textarea: (hasError) => ({
    width: '100%',
    padding: '12px 16px',
    fontSize: '14.5px',
    border: hasError ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
    backgroundColor: hasError ? '#fef2f2' : '#ffffff',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
    color: '#0f172a',
  }),
  charCounter: (isWarning) => ({
    fontSize: '12px',
    fontWeight: '500',
    color: isWarning ? '#ef4444' : '#94a3b8',
  }),
  errorText: {
    color: '#ef4444',
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  checkboxWrapper: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '2px',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    marginTop: '2px',
    cursor: 'pointer',
    accentColor: '#0f766e',
    flexShrink: 0,
  },
  checkboxLabel: {
    fontSize: '13.5px',
    color: '#475569',
    lineHeight: '1.45',
  },
  link: {
    color: '#0f766e',
    fontWeight: '600',
    textDecoration: 'underline',
    cursor: 'pointer',
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
