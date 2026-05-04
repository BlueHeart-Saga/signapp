import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { motion } from "framer-motion";
import { setPageTitle } from "../../utils/pageTitle";
import { useAuth } from "../../context/AuthContext";

// Material UI Icons
import ArrowBack from "@mui/icons-material/ArrowBack";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import Send from "@mui/icons-material/Send";
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
  const otpRefs = React.useRef([]);

  useEffect(() => {
    setPageTitle(
      "Reset Password | SafeSign",
      "Reset your password to regain access to your SafeSign account securely."
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

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Handled by paste

    const newOtpArr = otp.split('');
    newOtpArr[index] = value;
    const newOtp = newOtpArr.join('');
    setOtp(newOtp);
    setErrorMsg("");

    // Move to next input
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // If current is empty, go to previous and clear it
        otpRefs.current[index - 1].focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    if (pasteData) {
      setOtp(pasteData);
      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(pasteData.length, 5);
      otpRefs.current[nextIndex].focus();
    }
  };

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
      setSuccessMsg(response.data?.message || "If the email exists, an OTP has been sent.");
      setStep(2);
    } catch (err) {
      // UX for security
      setSuccessMsg("If the email exists, an OTP has been sent.");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

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

    try {
      await api.post("/auth/reset-password", { 
        email: email.toLowerCase(), 
        otp,
        new_password: newPassword
      });
      
      setSuccessMsg("Password reset successful! Redirecting...");
      
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
            switch (user.role) {
              case "admin": navigate("/admin/dashboard"); break;
              case "recipient": navigate("/recipient/dashboard"); break;
              default: navigate("/user");
            }
          } else {
            navigate("/login");
          }
        } catch (loginErr) {
          navigate("/login");
        }
      }, 2000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const goToLogin = () => navigate("/login");
  const goToRegister = () => navigate("/register");

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrorMsg("");
      setSuccessMsg("");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="ss-fp-container">
      {/* Left Side - Illustration */}
      <div className="ss-fp-hero">
        <div className="ss-fp-hero-accent-1"></div>
        <div className="ss-fp-hero-accent-2"></div>
        
        <div className="ss-fp-hero-image-wrapper">
          <img 
            src="/images/forgot-bg.png" 
            alt="Secure Connections" 
            className="ss-fp-hero-image" 
          />
        </div>

        <div className="ss-fp-hero-content">
          <h2 className="ss-fp-hero-title">Secure Password Recovery</h2>
          <p className="ss-fp-hero-subtitle">
            Regain access to your account with our secure multi-step verification process.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="ss-fp-side">
        <div className="ss-fp-card">
          {/* Logo Area */}
          <div className="ss-fp-logo-section" onClick={() => navigate("/")}>
            <div className="ss-fp-logo-container">
              {logoUrl ? (
                <img src={logoUrl} alt="SafeSign" className="ss-fp-logo" />
              ) : (
                <Shield color="#0f766e" size={48} />
              )}
            </div>
            <span className="ss-fp-brand-name">{brandName}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="ss-fp-title">
              <button className="ss-fp-simple-back" onClick={goBack} title="Go back">
                <ArrowBack />
              </button>
              <span>
                {step === 1 && "Forgot Password"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "New Password"}
              </span>
            </h1>

            {errorMsg && (
              <div className="ss-fp-error">
                <ErrorOutline fontSize="small" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="ss-fp-success">
                <CheckCircle fontSize="small" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Step 1: Email */}
            {step === 1 && (
              <form onSubmit={handleRequestOTP}>
                <div className="ss-fp-form-group">
                  <label className="ss-fp-label">Email Address <span className="ss-fp-required">*</span></label>
                  <div className="ss-fp-input-wrapper">
                    <input
                      type="email"
                      className="ss-fp-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="safesign@email.com"
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                <button className="ss-fp-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Code"}
                  <Send size={18} />
                </button>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <div className="ss-fp-form-group">
                  <label className="ss-fp-label">6-Digit Verification Code <span className="ss-fp-required">*</span></label>
                  <div className="ss-fp-otp-container" onPaste={handleOtpPaste}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        className="ss-fp-otp-input"
                        value={otp[index] || ""}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        maxLength={1}
                        pattern="\d*"
                        inputMode="numeric"
                        autoFocus={index === 0}
                        disabled={loading}
                      />
                    ))}
                  </div>
                  <p style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
                    Code sent to <strong>{email}</strong>
                  </p>
                </div>

                <button className="ss-fp-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button 
                    type="button" 
                    className="ss-fp-footer-link" 
                    onClick={handleRequestOTP} 
                    style={{ background: 'none', border: 'none', padding: 0 }}
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="ss-fp-form-group">
                  <label className="ss-fp-label">New Password <span className="ss-fp-required">*</span></label>
                  <div className="ss-fp-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="ss-fp-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                </div>

                <div className="ss-fp-form-group">
                  <label className="ss-fp-label">Confirm New Password <span className="ss-fp-required">*</span></label>
                  <div className="ss-fp-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="ss-fp-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                    />
                  </div>
                </div>

                <button className="ss-fp-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}

            <div className="ss-fp-footer">
              <div className="ss-fp-footer-row">
                <span className="ss-fp-footer-text">Remember password?</span>
                <span className="ss-fp-footer-link" onClick={goToLogin}>Sign in</span>
              </div>
              <div className="ss-fp-footer-row">
                <span className="ss-fp-footer-text">New to {brandName}?</span>
                <span className="ss-fp-footer-link" onClick={goToRegister}>Create account</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
