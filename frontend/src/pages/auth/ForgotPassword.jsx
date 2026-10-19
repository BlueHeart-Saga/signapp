import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import API_BASE_URL from "../../config/api";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { setPageTitle } from "../../utils/pageTitle";

// Icons
import Home from "@mui/icons-material/Home";
import Explore from "@mui/icons-material/Explore";
import People from "@mui/icons-material/People";
import ArrowBack from "@mui/icons-material/ArrowBack";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import LockOutlined from "@mui/icons-material/LockOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import { FaCrown } from "react-icons/fa";
import { Shield, Check, RefreshCw } from "lucide-react";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [brandName, setBrandName] = useState("Esigniva");
  const [logoUrl, setLogoUrl] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken } = useAuth();
  const otpRefs = useRef([]);

  useEffect(() => {
    if (location.state?.prefillEmail) {
      setEmail(location.state.prefillEmail);
    }
  }, [location.state]);

  useEffect(() => {
    setPageTitle(
      "Reset Password | Esigniva",
      "Reset your password to regain access to your Esigniva account securely."
    );
  }, []);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await api.get("/branding/config");
        if (res.data?.platform_name) setBrandName(res.data.platform_name);
        if (res.data?.logo_url !== null) {
          setLogoUrl(`${API_BASE_URL}/branding/logo/file`);
        }
      } catch (err) {
        console.log("Branding fetch failed, using defaults");
      }
    };
    fetchBranding();
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || "").trim());

  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
  };

  const allRulesMet = Object.values(passwordRules).every(Boolean);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const cleanDigit = value.replace(/\D/g, "");
    const newOtpArr = otp.split("");
    newOtpArr[index] = cleanDigit;
    const newOtpStr = newOtpArr.join("");
    setOtp(newOtpStr);
    setErrorMsg("");

    if (cleanDigit && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && otpRefs.current[index - 1]) {
        otpRefs.current[index - 1].focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6).replace(/\D/g, "");
    if (pasteData) {
      setOtp(pasteData);
      const nextIndex = Math.min(pasteData.length, 5);
      if (otpRefs.current[nextIndex]) {
        otpRefs.current[nextIndex].focus();
      }
    }
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setFieldErrors({});

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setFieldErrors({ email: "Email address is required" });
      setErrorMsg("Email address is required");
      setLoading(false);
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setFieldErrors({ email: "Please enter a valid email address" });
      setErrorMsg("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/forgot-password", { email: cleanEmail });
      setSuccessMsg(response.data?.message || `Password reset code sent to ${cleanEmail}`);
      toast.success("Verification code sent to your email!");
      setStep(2);
      setCountdown(60);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "No account found with this email address. Please check your email or create an account.";
      setErrorMsg(typeof msg === "string" ? msg : "Error processing password reset request");
      toast.error(typeof msg === "string" ? msg : "Error processing request");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      toast.success("A new verification code has been sent!");
      setCountdown(60);
      setOtp("");
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to resend code. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
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
      setErrorMsg("Please enter the complete 6-digit verification code");
      toast.error("Please enter the complete 6-digit code");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/verify-otp", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      setSuccessMsg("OTP verified successfully!");
      toast.success("Code verified successfully!");
      setStep(3);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Invalid or expired verification code.";
      setErrorMsg(typeof msg === "string" ? msg : "Invalid or expired code");
      toast.error(typeof msg === "string" ? msg : "Invalid code");
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
    setFieldErrors({});

    if (newPassword.length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters long" });
      setErrorMsg("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (!allRulesMet) {
      setFieldErrors({ password: "Password does not meet all security requirements" });
      setErrorMsg("Password does not meet all security requirements");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      setErrorMsg("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        new_password: newPassword,
      });

      setSuccessMsg("Password reset successfully! Logging you in...");
      toast.success("Password reset successfully!");

      // Clear any temporary lockout for this email so they can log in freely
      try {
        sessionStorage.removeItem(`esigniva_lockout_${email.trim().toLowerCase()}`);
      } catch (e) {}

      // Auto-login
      setTimeout(async () => {
        try {
          const form = new URLSearchParams();
          form.append("username", email.trim().toLowerCase());
          form.append("password", newPassword);

          const loginRes = await api.post("/auth/login", form.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });

          const token = loginRes.data?.access_token;
          const user = loginRes.data?.user;

          if (token && user) {
            setToken(token);
            setUser(user, token);
            switch (user.role) {
              case "admin":
                navigate("/admin/dashboard");
                break;
              case "recipient":
                navigate("/recipient/home");
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
      }, 900);
    } catch (err) {
      let msg = "Failed to reset password. Please try again.";
      if (err?.response?.data?.detail) {
        msg = typeof err.response.data.detail === "string" 
          ? err.response.data.detail 
          : err.response.data.detail?.message || msg;
      }
      setErrorMsg(msg);

      if (msg.toLowerCase().includes("different from") || msg.toLowerCase().includes("current password")) {
        setFieldErrors({ password: msg });
        Swal.fire({
          icon: 'warning',
          title: 'Different Password Required',
          text: msg,
          confirmButtonColor: '#0f766e'
        });
      } else {
        toast.error(typeof msg === "string" ? msg : "Reset failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => navigate("/login");
  const goToRegister = () => navigate("/register");
  const goToHome = () => navigate("/");

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
    <div className="min-h-screen flex flex-col md:flex-row font-sans overflow-x-hidden bg-white">
      {/* Left Side - Hero Visual */}
      <div className="hidden md:flex flex-1 md:w-1/2 lg:w-[48%] relative min-h-screen overflow-hidden bg-[#BDF0E9] items-center justify-center">
        <div className="relative z-10 w-full h-full flex items-center justify-center p-6 text-white">
          <div className="relative z-20 flex flex-col items-center w-full max-w-[520px]">
            <div className="relative w-[min(360px,85vw)] h-[min(360px,85vw)] mx-auto mb-6 shrink-0 flex items-center justify-center">
              <div className="relative w-full h-full rounded-full flex justify-center items-center">
                <img
                  src="/images/forgot-bg.png"
                  alt="Secure Password Recovery"
                  className="relative w-[min(420px,95%)] h-auto z-[2] rounded-xl object-contain drop-shadow-sm"
                  onError={(e) => {
                    e.target.src = "/images/login1.png";
                  }}
                />
              </div>
            </div>

            <div className="text-center mt-4 px-3">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-teal-800 leading-tight mb-2 tracking-tight">
                Secure Account Recovery
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-teal-700 font-medium max-w-[520px]">
                Regain access to your documents and signing workflows through verified encryption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Card */}
      <div className="flex-1 md:w-1/2 lg:w-[52%] flex flex-col items-center justify-center bg-slate-50 md:bg-white relative min-h-screen py-16 px-4 sm:px-6">
        {/* Top Navigation Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 bg-white p-1.5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-40 whitespace-nowrap border border-slate-100">
          <button
            type="button"
            onClick={goToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-0 cursor-pointer text-[13px] font-semibold bg-teal-50 text-teal-700 transition-all"
          >
            <Home fontSize="small" className="text-teal-700" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/aboutus")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-0 cursor-pointer text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-all"
          >
            <Explore fontSize="small" />
            <span className="hidden sm:inline">Explore</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/contactus")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-0 cursor-pointer text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-all"
          >
            <People fontSize="small" />
            <span className="hidden sm:inline">Let’s Talk</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-0 cursor-pointer text-[13px] font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-all"
          >
            <FaCrown fontSize="small" />
            <span className="hidden sm:inline">Upgrade</span>
          </button>
        </div>

        {/* Card Wrapper */}
        <div className="w-full max-w-[480px] pt-14 md:pt-16 pb-8 px-2 sm:px-4 flex justify-center">
          <motion.div
            className="w-full max-w-[440px] bg-white p-6 sm:p-9 rounded-[20px] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] border border-slate-200/80 text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {/* Header with Optically Centered Branding */}
            <div className="text-center mb-6">
              <div className="w-full flex items-center justify-center mb-2">
                <div
                  onClick={goToHome}
                  className="inline-flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01] relative -left-1.5 sm:-left-2"
                >
                  {logoUrl ? (
                    <>
                      <img src={logoUrl} alt="logo" className="h-8 sm:h-9 w-auto object-contain shrink-0" />
                      <span className="text-2xl sm:text-[26px] font-semibold text-teal-700 tracking-tight leading-none">
                        {brandName}
                      </span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-teal-700 shrink-0" />
                      <span className="text-2xl sm:text-[26px] font-semibold text-teal-700 tracking-tight leading-none">
                        {brandName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="relative flex items-center justify-center mt-1">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="absolute left-0 p-1 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Go Back"
                  >
                    <ArrowBack fontSize="small" />
                  </button>
                )}
                <h2 className="text-2xl sm:text-[28px] font-semibold text-teal-800 tracking-tight">
                  {step === 1 && "Forgot Password"}
                  {step === 2 && "Verify Security Code"}
                  {step === 3 && "Set New Password"}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {step === 1 && "Enter your email address to receive a verification code"}
                {step === 2 && `Enter the 6-digit code sent to ${email}`}
                {step === 3 && "Create a secure new password for your account"}
              </p>
            </div>

            {/* Step Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6 px-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    step >= 1 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {step > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
                </div>
                <span className={`text-xs font-medium ${step >= 1 ? "text-teal-800 font-semibold" : "text-slate-400"}`}>
                  Email
                </span>
              </div>

              <div className={`w-8 h-0.5 ${step > 1 ? "bg-teal-700" : "bg-slate-200"}`} />

              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    step >= 2 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {step > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
                </div>
                <span className={`text-xs font-medium ${step >= 2 ? "text-teal-800 font-semibold" : "text-slate-400"}`}>
                  Verify
                </span>
              </div>

              <div className={`w-8 h-0.5 ${step > 2 ? "bg-teal-700" : "bg-slate-200"}`} />

              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    step >= 3 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  3
                </div>
                <span className={`text-xs font-medium ${step >= 3 ? "text-teal-800 font-semibold" : "text-slate-400"}`}>
                  Password
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-md text-xs sm:text-sm flex items-center gap-2 mb-4 font-medium bg-red-50 border border-red-200 text-red-600 text-left">
                <ErrorOutline fontSize="small" className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3 rounded-md text-xs sm:text-sm flex items-center gap-2 mb-4 font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 text-left">
                <CheckCircle fontSize="small" className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="w-full max-w-[380px] mx-auto text-left">
              {/* STEP 1: Request OTP */}
              {step === 1 && (
                <form onSubmit={handleRequestOTP} noValidate>
                  <div className="mb-4">
                    <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                      Email Address <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMsg("");
                        if (fieldErrors.email) setFieldErrors({});
                      }}
                      placeholder="you@company.com"
                      required
                      autoFocus
                      disabled={loading}
                      className={`w-full h-11 bg-white border ${
                        fieldErrors.email ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-teal-700"
                      } rounded-md px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed`}
                    />
                    {fieldErrors.email && (
                      <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.email}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[14.5px] font-medium tracking-wide cursor-pointer transition-colors duration-150 mt-2 mb-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending Code..." : "Send Reset Code"}
                  </button>
                </form>
              )}

              {/* STEP 2: Verify OTP */}
              {step === 2 && (
                <form onSubmit={handleVerifyOTP} noValidate>
                  <div className="mb-4">
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2 tracking-wide">
                      <span>6-Digit Verification Code <span className="text-red-500">*</span></span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                      >
                        Change email
                      </button>
                    </label>

                    <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2" onPaste={handleOtpPaste}>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          ref={(el) => (otpRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          pattern="\d*"
                          value={otp[index] || ""}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          disabled={loading}
                          autoFocus={index === 0}
                          className="w-11 sm:w-12 h-12 text-center text-lg sm:text-xl font-bold bg-white border border-slate-200 rounded-md focus:border-teal-700 focus:outline-none text-slate-900 transition-colors disabled:bg-slate-50"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5">
                      <span>Didn't receive the code?</span>
                      {countdown > 0 ? (
                        <span className="text-slate-400 font-medium">Resend in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={loading}
                          className="font-semibold text-teal-700 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[14.5px] font-medium tracking-wide cursor-pointer transition-colors duration-150 mt-3 mb-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                </form>
              )}

              {/* STEP 3: Set New Password */}
              {step === 3 && (
                <form onSubmit={handleResetPassword} noValidate>
                  <div className="mb-4">
                    <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                      New Password <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative w-full">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setErrorMsg("");
                          if (fieldErrors.password) setFieldErrors({});
                        }}
                        placeholder="At least 8 characters"
                        required
                        disabled={loading}
                        className={`w-full h-11 bg-white border ${
                          fieldErrors.password ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-teal-700"
                        } rounded-md pl-3.5 pr-10 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none disabled:bg-slate-50`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded transition-colors"
                      >
                        {showPassword ? <LockOpenOutlined fontSize="small" /> : <LockOutlined fontSize="small" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.password}</p>
                    )}

                    {/* Password Requirements Checklist */}
                    <div className="mt-2.5 p-2.5 bg-slate-50 rounded-md border border-slate-200/70 text-[11px] space-y-1">
                      <div className={`flex items-center gap-1.5 ${passwordRules.minLength ? "text-emerald-700" : "text-slate-500"}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordRules.minLength ? "bg-emerald-100" : "bg-slate-200"}`}>
                          {passwordRules.minLength ? "✓" : "•"}
                        </div>
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordRules.hasUpper && passwordRules.hasLower ? "text-emerald-700" : "text-slate-500"}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordRules.hasUpper && passwordRules.hasLower ? "bg-emerald-100" : "bg-slate-200"}`}>
                          {passwordRules.hasUpper && passwordRules.hasLower ? "✓" : "•"}
                        </div>
                        <span>Uppercase and lowercase letters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordRules.hasNumber ? "text-emerald-700" : "text-slate-500"}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordRules.hasNumber ? "bg-emerald-100" : "bg-slate-200"}`}>
                          {passwordRules.hasNumber ? "✓" : "•"}
                        </div>
                        <span>At least one number (0-9)</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200/70 text-slate-600 text-[11px] flex items-center gap-1.5 font-medium">
                        <span className="text-teal-700 font-bold">•</span>
                        <span>Must be different from your current password</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                      Confirm New Password <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative w-full">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setErrorMsg("");
                          if (fieldErrors.confirmPassword) setFieldErrors({});
                        }}
                        placeholder="Re-enter new password"
                        required
                        disabled={loading}
                        className={`w-full h-11 bg-white border ${
                          fieldErrors.confirmPassword
                            ? "border-red-500 focus:border-red-500"
                            : confirmPassword && newPassword === confirmPassword
                            ? "border-emerald-500 focus:border-emerald-500"
                            : "border-slate-200 focus:border-teal-700"
                        } rounded-md pl-3.5 pr-10 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none disabled:bg-slate-50`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded transition-colors"
                      >
                        {showConfirmPassword ? <LockOpenOutlined fontSize="small" /> : <LockOutlined fontSize="small" />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <p className={`text-xs mt-1 font-medium ${newPassword === confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                        {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !allRulesMet || newPassword !== confirmPassword}
                    className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[14.5px] font-medium tracking-wide cursor-pointer transition-colors duration-150 mt-2 mb-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating Password..." : "Reset Password"}
                  </button>
                </form>
              )}

              {/* Footer Links */}
              <div className="text-center text-sm text-slate-500 mt-2 space-y-1">
                <div>
                  Remember your password?{" "}
                  <span
                    onClick={goToLogin}
                    className="text-teal-700 font-semibold cursor-pointer ml-1 hover:text-teal-800 hover:underline transition-colors"
                  >
                    Sign in
                  </span>
                </div>
                <div>
                  Don't have an account?{" "}
                  <span
                    onClick={goToRegister}
                    className="text-teal-700 font-semibold cursor-pointer ml-1 hover:text-teal-800 hover:underline transition-colors"
                  >
                    Create account
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
