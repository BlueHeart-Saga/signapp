import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { motion } from "framer-motion";
import { setPageTitle } from "../../utils/pageTitle";
import { useAuth } from "../../context/AuthContext";

// Material UI Icons
import ArrowBack from "@mui/icons-material/ArrowBack";
import Email from "@mui/icons-material/Email";
import Lock from "@mui/icons-material/Lock";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import Security from "@mui/icons-material/Security";
import Send from "@mui/icons-material/Send";
import VpnKey from "@mui/icons-material/VpnKey";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Shield } from "lucide-react";
import API_BASE_URL from "../../config/api";
// CSS
import "../../style/ForgotPassword.css";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [brandName, setBrandName] = useState("SafeSign");
  const [logoUrl, setLogoUrl] = useState(null);
  
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  useEffect(() => {
    setPageTitle(
      "Reset Password",
      "Reset your password to regain access to your SafeSign account."
    );
  }, []);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await api.get("/branding/config");
        if (res.data.platform_name) setBrandName(res.data.platform_name);
        if (res.data.logo_url !== null) {
          setLogoUrl(`${API_BASE_URL}/branding/logo/file`);
        }
      } catch (err) {
        console.log("Branding fetch failed, using defaults");
      }
    };
    fetchBranding();
  }, []);

  // Handle OTP input (numbers only, max 6 digits)
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setErrorMsg("");
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!validateEmail(email)) {
      setErrorMsg("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
  const response = await api.post("/auth/forgot-password", { 
    email: email.toLowerCase() 
  });

  setSuccessMsg(
    response.data?.message ||
    "If the email exists, a password reset OTP has been sent to your inbox."
  );

  setStep(2);

} catch (err) {
  console.error("OTP request error:", err);

  // Same UX for security
  setSuccessMsg(
    "If the email exists, a password reset OTP has been sent to your inbox."
  );

  setStep(2);
} finally {
  setLoading(false);
}

  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (otp.length !== 6) {
      setErrorMsg("Please enter the 6-digit OTP");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/verify-otp", { 
        email: email.toLowerCase(), 
        otp 
      });
      setSuccessMsg("OTP verified successfully");
      setStep(3);
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Validate passwords
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      setLoading(false);
      return;
    }

    // Password strength validation
    const passwordRules = {
      minLength: newPassword.length >= 6,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
    };

    const allPasswordRulesMet = Object.values(passwordRules).every(rule => rule);
    if (!allPasswordRulesMet) {
      setErrorMsg("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/reset-password", { 
        email: email.toLowerCase(), 
        otp,
        new_password: newPassword
      });
      
      setSuccessMsg("✅ Password reset successfully! Redirecting to login...");
      
      // Auto login after successful password reset
      setTimeout(async () => {
        try {
          const form = new URLSearchParams();
          form.append("username", email.toLowerCase());
          form.append("password", newPassword);

          const loginRes = await api.post("/auth/login", form.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });

          const token = loginRes.data?.access_token;
          const user = loginRes.data?.user;

          if (token && user) {
            setToken(token);
            setUser(user);
            
            // Redirect based on role
            switch (user.role) {
              case "admin":
                navigate("/admin/dashboard");
                break;
              case "recipient":
                navigate("/recipient/dashboard");
                break;
              default:
                navigate("/user");
            }
          } else {
            navigate("/login");
          }
        } catch (loginErr) {
          navigate("/login");
        }
      }, 2000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrorMsg("");
      setSuccessMsg("");
    } else {
      navigate("/login");
    }
  };

  const goToLogin = () => navigate("/login");
  const goToRegister = () => navigate("/register");

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, color: "#e5e7eb", label: "Empty" };
    
    let score = 0;
    if (password.length >= 6) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    const colors = ["#ef4444", "#f59e0b", "#eab308", "#10a37f", "#059669"];
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    
    return {
      score: Math.min(score, 5),
      color: colors[Math.min(score - 1, 4)] || "#e5e7eb",
      label: labels[Math.min(score - 1, 4)] || "Very Weak"
    };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="forgot-password-page">
      {/* Left Side - Illustration */}
      <div className="forgot-password-hero">
        <div className="hero-overlay">
               <div className="avatar avatar-left">
    {/* <img src="/images/avatar1.jpg" alt="User" /> */}
  </div>

  <div className="avatar avatar-right">
    {/* <img src="/images/avatar2.jpg" alt="User" /> */}
  </div>
          <div className="hero-content">
            <div className="brand-logo" onClick={() => navigate("/")}>
              {logoUrl ? (
                <div className="logo-with-name">
                  <img src={logoUrl} alt="logo" className="hero-logo" />
                  <span className="hero-brand-name">{brandName}</span>
                </div>
              ) : (
                <div className="logo-placeholder">
                  <Shield className="logo-icon" />
                  <span className="hero-brand-name">{brandName}</span>
                </div>
              )}
            </div>

            <div className="hero-text center">
              <h1>Secure Password Reset</h1>
              <p className="hero-subtitle">
                Follow the steps to securely reset your password and regain access to your account
              </p>
            </div>

            {/* Security Features */}
            <div className="security-features">
              <div className="security-header">
                <Security className="security-icon" />
                <h3>Protected Process</h3>
              </div>
              
              <div className="security-grid">
                <div className="security-item">
                  <div className="security-icon-wrapper">
                    <Email />
                  </div>
                  <div className="security-text">
                    <h4>Email Verification</h4>
                    <p>Secure OTP sent to your email</p>
                  </div>
                </div>
                
                <div className="security-item">
                  <div className="security-icon-wrapper">
                    <VpnKey />
                  </div>
                  <div className="security-text">
                    <h4>One-Time Code</h4>
                    <p>6-digit OTP valid for 10 minutes</p>
                  </div>
                </div>
                
                <div className="security-item">
                  <div className="security-icon-wrapper">
                    <Lock />
                  </div>
                  <div className="security-text">
                    <h4>Encrypted</h4>
                    <p>Military-grade password encryption</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
              <div className={`step ${step >= 1 ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Enter Email</div>
              </div>
              <div className="step-connector"></div>
              <div className={`step ${step >= 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Verify OTP</div>
              </div>
              <div className="step-connector"></div>
              <div className={`step ${step >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">New Password</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="forgot-password-side">
        <div className="forgot-password-wrapper">
          <motion.div 
            className="forgot-password-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header with Back Button */}
            <div className="header-with-back">
              <button className="back-button" onClick={goBack}>
                <ArrowBack />
                <span>Back</span>
              </button>
              <div className="header-content">
                <h2>Reset Your Password</h2>
                <p className="subtitle">
                  {step === 1 && "Enter your email to receive a password reset OTP"}
                  {step === 2 && "Enter the 6-digit OTP sent to your email"}
                  {step === 3 && "Create a new password for your account"}
                </p>
              </div>
            </div>

            {/* Step 1: Email Input */}
            {step === 1 && (
              <form onSubmit={handleRequestOTP}>
                <div className="form-group">
                  <label>Email Address <span className="required">*</span></label>
                  <div className="input-with-icon">
                    {/* <Email className="input-icon" /> */}
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="safesign@example.com"
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  {/* <p className="input-hint">
                    Enter the email address associated with your account
                  </p> */}
                </div>

                {errorMsg && (
                  <div className="error-message">
                    <ErrorOutline />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="success-message">
                    <CheckCircle />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      {/* <span className="spinner"></span> */}
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Send className="btn-icon" />
                      Send OTP
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP Input */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <div className="form-group">
                  <label>6-Digit OTP <span className="required">*</span></label>
                  <div className="otp-container">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="text"
                        className="otp-input"
                        value={otp[index] || ""}
                        onChange={(e) => {
                          const newOtp = otp.split('');
                          newOtp[index] = e.target.value.replace(/\D/g, '')[0] || '';
                          setOtp(newOtp.join(''));
                        }}
                        maxLength={1}
                        disabled={loading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <p className="input-hint">
                    Enter the 6-digit code sent to {email}
                  </p>
                  
                  <div className="resend-otp">
                    <span>Didn't receive the code?</span>
                    <button 
                      type="button" 
                      className="resend-btn"
                      onClick={handleRequestOTP}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="error-message">
                    <ErrorOutline />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="success-message">
                    <CheckCircle />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      {/* <span className="spinner"></span> */}
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label>New Password <span className="required">*</span></label>
                  <div className="password-wrapper">
                    <div className="input-with-icon">
                      <Lock className="input-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        {[1, 2, 3, 4, 5].map((segment) => (
                          <div
                            key={segment}
                            className="strength-segment"
                            style={{
                              backgroundColor: segment <= passwordStrength.score ? passwordStrength.color : '#e5e7eb',
                            }}
                          />
                        ))}
                      </div>
                      <div className="strength-label">
                        <span>Password Strength: </span>
                        <span style={{ color: passwordStrength.color, fontWeight: 600 }}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      
                      <div className="password-rules">
                        <div className={`password-rule ${newPassword.length >= 6 ? 'valid' : ''}`}>
                          <span className="rule-icon">{newPassword.length >= 6 ? '✓' : '✗'}</span>
                          <span>At least 6 characters</span>
                        </div>
                        <div className={`password-rule ${/[A-Z]/.test(newPassword) ? 'valid' : ''}`}>
                          <span className="rule-icon">{/[A-Z]/.test(newPassword) ? '✓' : '✗'}</span>
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`password-rule ${/[a-z]/.test(newPassword) ? 'valid' : ''}`}>
                          <span className="rule-icon">{/[a-z]/.test(newPassword) ? '✓' : '✗'}</span>
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`password-rule ${/\d/.test(newPassword) ? 'valid' : ''}`}>
                          <span className="rule-icon">{/\d/.test(newPassword) ? '✓' : '✗'}</span>
                          <span>One number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Confirm Password <span className="required">*</span></label>
                  <div className="password-wrapper">
                    <div className="input-with-icon">
                      <Lock className="input-icon" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="error-hint">Passwords do not match</p>
                  )}
                </div>

                {errorMsg && (
                  <div className="error-message">
                    <ErrorOutline />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="success-message">
                    <CheckCircle />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      {/* <span className="spinner"></span> */}
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}

            {/* Footer Links */}
            <div className="footer-links">
              <div className="footer-item">
                <span className="text">Remember your password?</span>
                <span className="link" onClick={goToLogin}>
                  Sign in
                </span>
              </div>
              <div className="footer-item">
                <span className="text">Don't have an account?</span>
                <span className="link" onClick={goToRegister}>
                  Sign up
                </span>
              </div>
            </div>

            {/* Security Notice */}
            {/* <div className="security-notice">
              <Lock className="notice-icon" />
              <p>
                <strong>Security Note:</strong> For your protection, this password reset process uses encrypted OTP verification. 
                Never share your OTP with anyone.
              </p>
            </div> */}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;