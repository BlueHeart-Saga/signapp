import React, { useState } from "react";

const ZohoFeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("feedback");
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

  const toggleWidget = () => setIsOpen(!isOpen);

  const getFeedbackType = () => {
    if (activeTab === "ask") return "help";
    if (activeTab === "suggest") return "feature";
    return "general";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: feedback.trim(),
          email: email.trim(), // Added email field
          type: getFeedbackType(),
          page_url: window.location.pathname
        })
      });

      if (!response.ok) throw new Error("Feedback API error");

      setSubmitted(true);
      setFeedback("");
      setEmail(""); // Clear email on success

      setTimeout(() => {
        setSubmitted(false);
        setActiveTab("feedback");
      }, 2000);

    } catch (error) {
      console.error("Feedback error:", error);
      alert("Failed to submit feedback. Please try again.");
    }

    setLoading(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  };

  return (
    <div style={styles.zohoFeedbackContainer}>
      {/* Toggle Button */}
      <button 
        style={styles.zohoToggleBtn} 
        onClick={toggleWidget}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        {/* <span style={styles.zohoToggleBtnText}>Feedback</span> */}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div style={styles.zohoOverlay} onClick={handleOverlayClick}>
          <div style={styles.zohoModal}>
            {/* Header */}
            <div style={styles.zohoHeader}>
              <div>
                <h3 style={styles.zohoHeaderTitle}>We'd Love Your Feedback</h3>
                <p style={styles.zohoHeaderSubtitle}>Help us improve your experience</p>
              </div>
              <button 
                style={styles.zohoCloseBtn} 
                onClick={() => setIsOpen(false)}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div style={styles.zohoTabs}>
              <button
                style={{
                  ...styles.zohoTabBtn,
                  ...(activeTab === "feedback" ? styles.zohoTabBtnActive : {})
                }}
                onClick={() => setActiveTab("feedback")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span style={styles.zohoTabBtnText}>Feedback</span>
              </button>

              <button
                style={{
                  ...styles.zohoTabBtn,
                  ...(activeTab === "ask" ? styles.zohoTabBtnActive : {})
                }}
                onClick={() => setActiveTab("ask")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span style={styles.zohoTabBtnText}>Ask</span>
              </button>

              <button
                style={{
                  ...styles.zohoTabBtn,
                  ...(activeTab === "suggest" ? styles.zohoTabBtnActive : {})
                }}
                onClick={() => setActiveTab("suggest")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span style={styles.zohoTabBtnText}>Suggest</span>
              </button>
            </div>

            {/* Form */}
            <div style={styles.zohoForm}>
              {submitted ? (
                <div style={styles.zohoSuccessMessage}>
                  <div style={styles.zohoSuccessIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <h4 style={styles.zohoSuccessTitle}>Thank You!</h4>
                  <p style={styles.zohoSuccessText}>Your feedback was sent successfully</p>
                </div>
              ) : (
                <>
                  <div style={styles.zohoFormGroup}>
                    <label style={styles.zohoLabel}>
                      {activeTab === "feedback" && "Share your thoughts"}
                      {activeTab === "ask" && "What can we help you with?"}
                      {activeTab === "suggest" && "What would you like to see?"}
                    </label>

                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder={
                        activeTab === "feedback"
                          ? "Tell us what you think about our platform..."
                          : activeTab === "ask"
                          ? "Ask a question or report an issue..."
                          : "Suggest a new feature or improvement..."
                      }
                      style={styles.zohoTextarea}
                      rows="4"
                      required
                    />
                  </div>

                  {/* Email Input Field */}
                  <div style={styles.zohoFormGroup}>
                    <label style={styles.zohoLabel}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      style={styles.zohoInput}
                    />
                    <p style={styles.zohoEmailHelp}>
                      We'll only use this to follow up on your feedback
                    </p>
                  </div>

                  <div style={styles.zohoFormActions}>
                    <button 
                      type="button"
                      style={styles.zohoCancelBtn}
                      onClick={() => setIsOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      style={{
                        ...styles.zohoSubmitBtn,
                        ...(loading ? styles.zohoSubmitBtnDisabled : {})
                      }}
                      disabled={loading || !feedback.trim()}
                      onClick={handleSubmit}
                      onMouseEnter={(e) => !loading && (e.currentTarget.style.background = 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)')}
                      onMouseLeave={(e) => !loading && (e.currentTarget.style.background = 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)')}
                    >
                      {loading ? (
                        <>
                          <div style={styles.zohoSpinner}></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                          </svg>
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={styles.zohoFooter}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#90caf9" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span style={styles.zohoFooterText}>Your feedback is secure and confidential</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  zohoFeedbackContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  zohoToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    color: ' #0f6eeaff',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 16px rgba(33, 150, 243, 0.4)',
    transition: 'all 0.3s ease',
  },
  zohoToggleBtnText: {
    lineHeight: 1,
  },
  zohoOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    animation: 'zohoFadeIn 0.2s ease',
  },
  zohoModal: {
    background: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'zohoSlideUp 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  zohoHeader: {
    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #e0e0e0',
  },
  zohoHeaderTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#1565c0',
    marginBottom: '4px',
  },
  zohoHeaderSubtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#1976d2',
    opacity: 0.8,
  },
  zohoCloseBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    color: '#1976d2',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zohoTabs: {
    display: 'flex',
    padding: '16px 16px 0',
    gap: '8px',
    background: '#fafafa',
    borderBottom: '2px solid #e0e0e0',
  },
  zohoTabBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#757575',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  zohoTabBtnActive: {
    background: 'white',
    color: '#1976d2',
    fontWeight: '600',
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
  },
  zohoTabBtnText: {
    lineHeight: 1,
  },
  zohoForm: {
    padding: '24px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  zohoFormGroup: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  zohoLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#424242',
    marginBottom: '8px',
  },
  zohoTextarea: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    transition: 'all 0.2s ease',
    outline: 'none',
    minHeight: '100px',
    boxSizing: 'border-box',
  },
  zohoInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box',
  },
  zohoEmailHelp: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#757575',
    fontStyle: 'italic',
  },
  zohoFormActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: 'auto',
  },
  zohoCancelBtn: {
    padding: '10px 24px',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#616161',
    transition: 'all 0.2s ease',
  },
  zohoSubmitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
  },
  zohoSubmitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  zohoSuccessMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
  zohoSuccessIcon: {
    marginBottom: '20px',
    animation: 'zohoScaleIn 0.5s ease',
  },
  zohoSuccessTitle: {
    margin: '0 0 8px',
    fontSize: '20px',
    fontWeight: '700',
    color: '#1976d2',
  },
  zohoSuccessText: {
    margin: 0,
    fontSize: '14px',
    color: '#757575',
  },
  zohoFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px 24px',
    background: '#fafafa',
    borderTop: '1px solid #e0e0e0',
  },
  zohoFooterText: {
    fontSize: '12px',
    color: '#757575',
  },
  zohoSpinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'zohoSpin 0.6s linear infinite',
  },
};

// Add animations via style tag
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes zohoFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes zohoSlideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes zohoScaleIn {
    from { 
      opacity: 0;
      transform: scale(0.5);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes zohoSpin {
    to { transform: rotate(360deg); }
  }
  
  
`;
document.head.appendChild(styleSheet);

export default ZohoFeedbackWidget;
