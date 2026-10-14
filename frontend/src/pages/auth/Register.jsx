import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import API_BASE_URL, { GOOGLE_CLIENT_ID } from "../../config/api";
import { setPageTitle } from "../../utils/pageTitle";

// Icons
import Home from "@mui/icons-material/Home";
import Explore from "@mui/icons-material/Explore";
import People from "@mui/icons-material/People";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Close from "@mui/icons-material/Close";
import LockOutlined from "@mui/icons-material/LockOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import Google from "@mui/icons-material/Google";
import { FaCrown } from "react-icons/fa";
import { Shield, Check, RefreshCw } from "lucide-react";

const Register = ({ onRegister }) => {
  // Registration step: 1 = Email / Google, 2 = Verify OTP, 3 = Org & Password
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    organization_name: "",
    secret_key: "",
  });

  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savedUser, setSavedUser] = useState(null);
  const [showFastLogin, setShowFastLogin] = useState(true);

  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();
  const [brandName, setBrandName] = useState("Esigniva");
  const [logoUrl, setLogoUrl] = useState(null);

  // Hero carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const backgroundImages = ["/images/register1.png"];
  const images = backgroundImages;

  const [isAdminMode] = useState(false);
  const [currentRole] = useState("user");

  useEffect(() => {
    setPageTitle(
      "Create Workspace | Esigniva",
      "Sign up for Esigniva to create, send, and securely sign documents."
    );
  }, []);

  // Check saved / remembered user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRecent = localStorage.getItem("recent-user");
    const storedToken = localStorage.getItem("token");

    let parsedUser = null;
    let parsedRecent = null;
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
      } catch (e) {}
    }
    if (storedRecent) {
      try {
        parsedRecent = JSON.parse(storedRecent);
      } catch (e) {}
    }

    if (parsedUser || parsedRecent) {
      const merged = {
        ...parsedRecent,
        ...parsedUser,
        full_name: parsedUser?.full_name || parsedRecent?.full_name || "",
        email: parsedUser?.email || parsedRecent?.email || "",
        profile_image: typeof parsedUser?.profile_picture === "string"
          ? parsedUser.profile_picture
          : (parsedRecent?.profile_image || null),
        remembered_token: storedToken || parsedRecent?.remembered_token || null
      };
      setSavedUser(merged);
    }
  }, []);

  const handleContinueAs = async () => {
    if (!savedUser) return;

    if (savedUser.remembered_token) {
      try {
        setLoading(true);
        const response = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${savedUser.remembered_token}` },
        });

        if (response.data) {
          const freshUser = response.data;
          const freshName = freshUser.full_name || `${freshUser.first_name || ""} ${freshUser.last_name || ""}`.trim() || savedUser.full_name || freshUser.email;
          localStorage.setItem("token", savedUser.remembered_token);
          setToken(savedUser.remembered_token);
          setUser(freshUser, savedUser.remembered_token);
          toast.success(`Welcome back, ${freshName}!`);
          setTimeout(() => {
            const role = freshUser.role;
            switch (role) {
              case "admin":
                navigate("/admin/dashboard");
                break;
              case "recipient":
                navigate("/recipient/home");
                break;
              default:
                navigate("/user");
            }
          }, 800);
          return;
        }
      } catch (err) {
        console.warn("Remembered session expired.");
      } finally {
        setLoading(false);
      }
    }

    if (savedUser.is_google) {
      if (window.google) {
        window.google.accounts.id.prompt();
      } else {
        toast("Initializing Google login...");
      }
    } else {
      navigate("/login", { state: { prefillEmail: savedUser.email } });
      toast("Welcome back! Redirecting to login...");
    }
  };

  const handleSwitchAccount = () => {
    setShowFastLogin(false);
  };

  // Branding fetch
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

  // OTP resend countdown
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Validation rules
  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || "").trim());

  const passwordRules = {
    minLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[^A-Za-z0-9]/.test(formData.password),
  };

  const allPasswordRulesMet = Object.values(passwordRules).every(Boolean);

  const validateField = (name, value) => {
    let error = "";
    if (name === "email") {
      const emailVal = (value || "").trim();
      if (!emailVal) {
        error = "Email address is required";
      } else if (!validateEmail(emailVal)) {
        error = "Please enter a valid email address";
      }
    } else if (name === "organization_name") {
      const orgVal = (value || "").trim();
      if (!orgVal) {
        error = "Workspace / Organization name is required";
      } else if (orgVal.length < 2) {
        error = "Organization name must be at least 2 characters";
      }
    } else if (name === "full_name") {
      const nameVal = (value || "").trim();
      if (!nameVal) {
        error = "Full name is required";
      } else if (nameVal.length < 2) {
        error = "Full name must be at least 2 characters";
      }
    } else if (name === "password") {
      if (!value) {
        error = "Password is required";
      } else if (value.length < 8) {
        error = "Password must be at least 8 characters";
      } else if (!allPasswordRulesMet) {
        error = "Password does not meet all security criteria";
      }
    } else if (name === "confirmPassword") {
      if (!value) {
        error = "Please confirm your password";
      } else if (value !== formData.password) {
        error = "Passwords do not match";
      }
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
    if (touched[name]) {
      const err = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
    // Also re-validate confirm password if password changes
    if (name === "password" && touched.confirmPassword) {
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      } else {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  // OTP inputs handling
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

  // -------------------------------------------------------------
  // STEP 1: Send OTP to Email
  // -------------------------------------------------------------
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const emailErr = validateField("email", formData.email);
    setTouched((prev) => ({ ...prev, email: true }));
    setFieldErrors((prev) => ({ ...prev, email: emailErr }));

    if (emailErr) {
      setErrorMsg(emailErr);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/register/send-otp", {
        email: formData.email.trim().toLowerCase(),
      });

      setSuccessMsg(res.data?.message || `Verification code sent to ${formData.email}`);
      toast.success("Verification code sent to your email!");
      setStep(2);
      setCountdown(60);
      setOtp("");
    } catch (err) {
      console.error("Send OTP Error:", err);
      let msg = "Failed to send verification code. Please try again.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          msg = detail;
        } else if (detail.message) {
          msg = detail.message;
        }
      }
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOTP = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await api.post("/auth/register/send-otp", {
        email: formData.email.trim().toLowerCase(),
      });
      toast.success("A new verification code has been sent!");
      setCountdown(60);
      setOtp("");
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to resend code. Please try again.";
      setErrorMsg(typeof msg === "string" ? msg : "Failed to resend code");
      toast.error(typeof msg === "string" ? msg : "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2: Verify OTP
  // -------------------------------------------------------------
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
      await api.post("/auth/register/verify-otp", {
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      setSuccessMsg("Email verified successfully! Complete your profile below.");
      toast.success("Email verified!");
      setStep(3);
    } catch (err) {
      console.error("Verify OTP Error:", err);
      const msg = err.response?.data?.detail || "Invalid or expired verification code.";
      setErrorMsg(typeof msg === "string" ? msg : "Invalid verification code");
      toast.error(typeof msg === "string" ? msg : "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 3: Complete Registration
  // -------------------------------------------------------------
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const orgErr = validateField("organization_name", formData.organization_name);
    const nameErr = validateField("full_name", formData.full_name);
    const passErr = validateField("password", formData.password);
    const confirmErr = validateField("confirmPassword", formData.confirmPassword);

    setTouched({
      organization_name: true,
      full_name: true,
      password: true,
      confirmPassword: true,
    });

    setFieldErrors({
      organization_name: orgErr,
      full_name: nameErr,
      password: passErr,
      confirmPassword: confirmErr,
    });

    if (orgErr || nameErr || passErr || confirmErr) {
      setErrorMsg(orgErr || nameErr || passErr || confirmErr);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        role: isAdminMode ? "admin" : currentRole,
        organization_name: formData.organization_name.trim(),
        full_name: formData.full_name.trim(),
      };

      if (payload.role === "admin") {
        payload.secret_key = formData.secret_key.trim();
      }

      const registerRes = await api.post("/auth/register", payload);
      if (!registerRes || registerRes.status !== 200) {
        throw new Error("Registration failed");
      }

      // Auto-Login
      const form = new URLSearchParams();
      form.append("username", payload.email);
      form.append("password", payload.password);

      const loginRes = await api.post("/auth/login", form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const token = loginRes.data?.access_token;
      const user = loginRes.data?.user;

      if (!token || !user) {
        throw new Error("Auto-login failed");
      }

      setToken(token);
      setUser(user, token);
      setSuccessMsg("Account created successfully! Redirecting to your workspace...");
      toast.success("Welcome! Registration completed successfully.");

      if (onRegister) onRegister();

      setTimeout(() => {
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
      }, 800);
    } catch (err) {
      console.error("Registration Error:", err);
      let msg = "Registration failed. Please check your details and try again.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          msg = detail;
        } else if (detail.message) {
          msg = detail.message;
        }
      }
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Google Auth (preserved as requested)
  // -------------------------------------------------------------
  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      setLoading(true);
      try {
        const res = await api.post("/auth/google/verify-token", {
          credential: response.credential,
        });

        const token = res.data?.access_token;
        const user = res.data?.user;

        if (!token || !user) throw new Error("Invalid response from server");

        const userWithFlag = { ...user, is_google: true };
        setToken(token);
        setUser(userWithFlag, token);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userWithFlag));

        toast.success("Account created/logged in with Google!");

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
      } catch (err) {
        console.error("Google verify error:", err);
        toast.error("Google authentication failed");
      } finally {
        setLoading(false);
      }
    },
    [navigate, setToken, setUser]
  );

  const initGoogleAuth = useCallback(() => {
    if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        return true;
      } catch (e) {
        console.error("Google Auth Init Error:", e);
      }
    }
    return false;
  }, [handleGoogleCredentialResponse]);

  useEffect(() => {
    if (!initGoogleAuth()) {
      const interval = setInterval(() => {
        if (initGoogleAuth()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [initGoogleAuth]);

  const handleGoogleSignIn = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (
            notification.isNotDisplayed() ||
            notification.isSkippedMoment() ||
            notification.isDismissedMoment()
          ) {
            window.location.href = `${API_BASE_URL}/auth/google/login`;
          }
        });
        return;
      } catch (err) {
        console.warn("Google prompt error, falling back to OAuth redirect:", err);
      }
    }
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  const goToLogin = () => navigate("/login");
  const goToHome = () => navigate("/");

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setErrorMsg("");
      setSuccessMsg("");
    } else if (step === 3) {
      setStep(2);
      setErrorMsg("");
      setSuccessMsg("");
    } else {
      goToLogin();
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
                  src={images[currentImageIndex]}
                  alt="Smart Signing"
                  className="relative w-[min(420px,95%)] h-auto z-[2] rounded-xl object-contain drop-shadow-sm"
                  onError={(e) => {
                    e.target.src = "/images/login1.png";
                  }}
                />
              </div>
            </div>

            <div className="text-center mt-4 px-3">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-teal-800 leading-tight mb-2 tracking-tight">
                Smart Signing Insights
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-teal-700 font-medium max-w-[520px]">
                Clear visuals and verified signatures that keep your documents moving forward seamlessly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
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
                  {step === 1 && "Create Your Account"}
                  {step === 2 && "Verify Email Address"}
                  {step === 3 && "Workspace & Password"}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {step === 1 && "Start your free workspace with Google or your email"}
                {step === 2 && `Enter the 6-digit verification code sent to ${formData.email}`}
                {step === 3 && "Complete your organization name and set a secure password"}
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
                  Workspace
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
              {/* ========================================================= */}
              {/* STEP 1: Enter Email or Continue with Google               */}
              {/* ========================================================= */}
              {step === 1 && (
                <div>
                  {/* Google Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    id="googleRegisterBtn"
                    className="w-full h-11 bg-white border border-slate-200 rounded-md px-4 flex items-center justify-center gap-2.5 text-[14px] font-medium text-slate-700 cursor-pointer transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
                  >
                    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Divider */}
                  <div className="relative text-center my-4.5 w-full before:content-[''] before:absolute before:top-1/2 before:left-0 before:right-0 before:h-px before:bg-slate-200">
                    <span className="relative bg-white px-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      or register with email
                    </span>
                  </div>

                  <form onSubmit={handleSendOTP} noValidate>
                    <div className="mb-4">
                      <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                        Work / Personal Email <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
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
                      className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[14.5px] font-medium tracking-wide cursor-pointer transition-colors duration-150 mt-2 mb-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                      {loading ? "Sending Code..." : "Continue with Email"}
                    </button>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 2: Verify OTP                                        */}
              {/* ========================================================= */}
              {step === 2 && (
                <form onSubmit={handleVerifyOTP} noValidate>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2 tracking-wide">
                      <span>6-Digit Verification Code <span className="text-red-500">*</span></span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                      >
                        Change email
                      </button>
                    </div>

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
                    className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[14.5px] font-medium tracking-wide cursor-pointer transition-colors duration-150 mt-3 mb-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                </form>
              )}

              {/* ========================================================= */}
              {/* STEP 3: Organization Details & Password                   */}
              {/* ========================================================= */}
              {step === 3 && (
                <form onSubmit={handleCompleteRegistration} noValidate>
                  {/* Verified Email Banner */}
                  <div className="mb-4 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-md flex items-center justify-between text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{formData.email}</span>
                    </div>
                    <span className="font-semibold text-emerald-700 text-[11px] uppercase tracking-wider">Verified</span>
                  </div>

                  {/* Full Name */}
                  <div className="mb-4">
                    <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                      Full Name <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="John Doe"
                        required
                        disabled={loading}
                        className={`w-full h-11 bg-white border ${
                          fieldErrors.full_name ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-teal-700"
                        } rounded-md px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none disabled:bg-slate-50`}
                      />
                    </div>
                    {fieldErrors.full_name && (
                      <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.full_name}</p>
                    )}
                  </div>

                  {/* Organization Name */}
                  <div className="mb-4">
                    <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                      Workspace / Organization Name <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        name="organization_name"
                        value={formData.organization_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Acme Corp"
                        required
                        disabled={loading}
                        className={`w-full h-11 bg-white border ${
                          fieldErrors.organization_name
                            ? "border-red-500 focus:border-red-500"
                            : "border-slate-200 focus:border-teal-700"
                        } rounded-md px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none disabled:bg-slate-50`}
                      />
                    </div>
                    {fieldErrors.organization_name && (
                      <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.organization_name}</p>
                    )}
                  </div>

                  {/* Admin Secret Key (if admin mode) */}
                  {isAdminMode && (
                    <div className="mb-4">
                      <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                        Admin Secret Key <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="password"
                        name="secret_key"
                        value={formData.secret_key}
                        onChange={handleChange}
                        placeholder="Enter admin secret key"
                        required
                        disabled={loading}
                        className="w-full h-11 bg-white border border-slate-200 rounded-md px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none focus:border-teal-700 disabled:bg-slate-50"
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div className="mb-4">
                    <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                      Create Password <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative w-full">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="••••••••"
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

                    {/* Live Password Rules */}
                    <div className="mt-2.5 p-2.5 bg-slate-50 rounded-md border border-slate-200/70 text-[11px] space-y-1">
                      <div className={`flex items-center gap-1.5 ${passwordRules.minLength ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordRules.minLength ? "bg-emerald-100" : "bg-slate-200"}`}>
                          {passwordRules.minLength ? "✓" : "•"}
                        </div>
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordRules.hasUpper && passwordRules.hasLower ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordRules.hasUpper && passwordRules.hasLower ? "bg-emerald-100" : "bg-slate-200"}`}>
                          {passwordRules.hasUpper && passwordRules.hasLower ? "✓" : "•"}
                        </div>
                        <span>Uppercase and lowercase letters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordRules.hasNumber ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordRules.hasNumber ? "bg-emerald-100" : "bg-slate-200"}`}>
                          {passwordRules.hasNumber ? "✓" : "•"}
                        </div>
                        <span>At least one number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordRules.hasSpecial ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordRules.hasSpecial ? "bg-emerald-100" : "bg-slate-200"}`}>
                          {passwordRules.hasSpecial ? "✓" : "•"}
                        </div>
                        <span>Special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-4">
                    <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                      Confirm Password <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative w-full">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        className={`w-full h-11 bg-white border ${
                          fieldErrors.confirmPassword
                            ? "border-red-500 focus:border-red-500"
                            : formData.confirmPassword && formData.password === formData.confirmPassword
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
                    {formData.confirmPassword && (
                      <p className={`text-xs mt-1 font-medium ${formData.password === formData.confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                        {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !allPasswordRulesMet || formData.password !== formData.confirmPassword}
                    className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[14.5px] font-medium tracking-wide cursor-pointer transition-colors duration-150 mt-2 mb-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? "Creating Workspace..." : "Complete Registration"}
                  </button>
                </form>
              )}

              {/* Login Link */}
              <div className="text-center text-sm text-slate-500 mt-2">
                <span className="text-slate-500">Already have an account?</span>
                <span
                  onClick={goToLogin}
                  className="text-teal-700 font-semibold cursor-pointer ml-1.5 hover:text-teal-800 hover:underline transition-colors"
                >
                  Sign in here
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Fast Login / Recent Account Popup */}
        <AnimatePresence>
          {savedUser && showFastLogin && (
            <motion.div
              key="fast-login-popup-register"
              initial={{ x: 380, opacity: 0, scale: 0.96 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 380, opacity: 0, scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 28,
                mass: 0.8,
              }}
              className="fixed top-6 right-6 w-[360px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/80 z-[1000] overflow-hidden font-sans"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-5 h-5 object-contain"
                    onError={(e) => (e.target.src = "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png")}
                  />
                  <span className="text-sm text-slate-700 font-medium">Sign in back to {brandName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFastLogin(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <Close fontSize="small" />
                </button>
              </div>

              <div className="p-5 flex flex-col items-center">
                <div className="flex items-center gap-3 w-full mb-5">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                    {savedUser.profile_image ? (
                      <img src={savedUser.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-teal-700 text-white flex items-center justify-center text-xl font-medium">
                        {savedUser.full_name ? savedUser.full_name[0].toUpperCase() : savedUser.email ? savedUser.email[0].toUpperCase() : "U"}
                      </div>
                    )}
                    {savedUser.is_google && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                        <Google style={{ fontSize: "10px", color: "#4285F4" }} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[15px] font-medium text-slate-800 leading-snug">
                      {savedUser.full_name || "User Account"}
                    </span>
                    <span className="text-xs text-slate-500">{savedUser.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinueAs}
                  className="w-full bg-teal-700 text-white border-0 py-2.5 px-6 rounded-md text-sm font-medium cursor-pointer shadow-sm hover:bg-teal-800 active:bg-teal-900 transition-colors"
                >
                  Continue as {savedUser.full_name ? savedUser.full_name.split(" ")[0] : "User"}
                </button>
              </div>

              <div className="py-3 px-4 text-center border-t border-slate-100">
                <span
                  onClick={() => {
                    handleSwitchAccount();
                    setShowFastLogin(false);
                  }}
                  className="text-xs text-teal-700 font-medium hover:underline cursor-pointer"
                >
                  Use another account
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Register;
