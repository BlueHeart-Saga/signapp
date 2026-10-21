import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import showAlert from "../../utils/swal";
import API_BASE_URL, { GOOGLE_CLIENT_ID } from "../../config/api";
import { setPageTitle } from "../../utils/pageTitle";

// Material UI Components
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
} from "@mui/material";

// Material UI Icons
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";

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
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savedUser, setSavedUser] = useState(null);
  const [showFastLogin, setShowFastLogin] = useState(true);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);

  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();
  const [brandName, setBrandName] = useState("Esigniva");
  const [logoUrl, setLogoUrl] = useState(null);

  // Hero carousel
  const [currentImageIndex] = useState(0);
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
        remembered_token: storedToken || parsedRecent?.remembered_token || null,
        is_google: Boolean(
          parsedUser?.is_google ||
          parsedRecent?.is_google ||
          parsedUser?.auth_provider === "google" ||
          parsedRecent?.auth_provider === "google" ||
          (typeof parsedUser?.profile_picture === "string" && parsedUser.profile_picture.includes("googleusercontent.com")) ||
          (typeof parsedRecent?.profile_image === "string" && parsedRecent.profile_image.includes("googleusercontent.com"))
        ),
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

          await showAlert.autoNavigate(
            "Welcome Back!",
            `Successfully signed in as ${freshName}. Redirecting to your dashboard...`,
            1400
          );

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

  // Focus first OTP input when step 2 opens
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        if (otpRefs.current[0]) otpRefs.current[0].focus();
      }, 120);
    }
  }, [step]);

  // Auto-hide verified email banner after displaying on Step 3
  useEffect(() => {
    if (step === 3) {
      setShowVerifiedBanner(true);
      const timer = setTimeout(() => {
        setShowVerifiedBanner(false);
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setShowVerifiedBanner(false);
    }
  }, [step]);

  // Password rules for 4 segmented validation lines
  const passwordChecks = [
    {
      id: "minLength",
      label: "At least 8 characters",
      isMet: formData.password.length >= 8,
    },
    {
      id: "hasCase",
      label: "Uppercase and lowercase letters",
      isMet: /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password),
    },
    {
      id: "hasNumber",
      label: "At least one number (0-9)",
      isMet: /\d/.test(formData.password),
    },
    {
      id: "hasSpecial",
      label: "At least one special character (!@#$%^&*)",
      isMet: /[^A-Za-z0-9]/.test(formData.password),
    },
  ];

  const allPasswordRulesMet = passwordChecks.every((c) => c.isMet);
  const missingPasswordChecks = passwordChecks.filter((c) => !c.isMet);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || "").trim());

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
      } else if (!(/[A-Z]/.test(value) && /[a-z]/.test(value))) {
        error = "Password must include both uppercase and lowercase letters";
      } else if (!/\d/.test(value)) {
        error = "Password must include at least one number (0-9)";
      } else if (!/[^A-Za-z0-9]/.test(value)) {
        error = "Password must include a special character (!@#$%^&*)";
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
    const val = (value || "").trim();
    if (submitted || val.length > 0) {
      const err = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");

    if (name === "password") {
      if (value.length > 0) {
        const err = validateField("password", value);
        setFieldErrors((prev) => ({ ...prev, password: err }));
      } else {
        setFieldErrors((prev) => ({ ...prev, password: submitted ? "Password is required" : "" }));
      }
      if (formData.confirmPassword) {
        if (value !== formData.confirmPassword) {
          setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
        } else {
          setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
        }
      }
    } else if (name === "confirmPassword") {
      if (value.length > 0) {
        if (value !== formData.password) {
          setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
        } else {
          setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
        }
      } else {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: submitted ? "Please confirm your password" : "" }));
      }
    } else if (submitted) {
      const err = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    } else if (touched[name]) {
      const val = (value || "").trim();
      if (val.length > 0) {
        const err = validateField(name, value);
        setFieldErrors((prev) => ({ ...prev, [name]: err }));
      } else {
        setFieldErrors((prev) => ({ ...prev, [name]: "" }));
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
    setFieldErrors((prev) => ({ ...prev, otp: "" }));

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
      setErrorMsg("");
      setFieldErrors((prev) => ({ ...prev, otp: "" }));
      const nextIndex = Math.min(pasteData.length, 5);
      if (otpRefs.current[nextIndex]) {
        otpRefs.current[nextIndex].focus();
      }
    }
  };

  // STEP 1: Send OTP to Email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const emailErr = validateField("email", formData.email);
    setTouched((prev) => ({ ...prev, email: true }));
    setFieldErrors((prev) => ({ ...prev, email: emailErr }));

    if (emailErr) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/register/send-otp", {
        email: formData.email.trim().toLowerCase(),
      });

      toast.success(res.data?.message || "Verification code sent to your email!", { id: "otp-sent" });
      setStep(2);
      setCountdown(60);
      setOtp("");
      setFieldErrors((prev) => ({ ...prev, otp: "" }));
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
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOTP = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setErrorMsg("");
    setFieldErrors((prev) => ({ ...prev, otp: "" }));
    try {
      await api.post("/auth/register/send-otp", {
        email: formData.email.trim().toLowerCase(),
      });
      toast.success("A new verification code has been sent!", { id: "otp-resend" });
      setCountdown(60);
      setOtp("");
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to resend code. Please try again.";
      setErrorMsg(typeof msg === "string" ? msg : "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (otp.length !== 6) {
      setFieldErrors((prev) => ({ ...prev, otp: "Please enter the complete 6-digit verification code" }));
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/register/verify-otp", {
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      toast.success("Email verified!", { id: "email-verified" });
      setFieldErrors((prev) => ({ ...prev, otp: "" }));
      setStep(3);
    } catch (err) {
      console.error("Verify OTP Error:", err);
      const msg = err.response?.data?.detail || "Invalid or expired verification code.";
      const errorText = typeof msg === "string" ? msg : "Invalid verification code";
      setFieldErrors((prev) => ({ ...prev, otp: errorText }));
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Complete Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (loading) return;
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

      if (onRegister) onRegister();

      await showAlert.autoNavigate(
        "Registration Successful!",
        `Welcome to ${brandName}! Your workspace has been created. Redirecting...`,
        1400
      );

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
    } finally {
      setLoading(false);
    }
  };

  // Google Auth
  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      setLoading(true);
      setErrorMsg("");
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

        await showAlert.autoNavigate(
          "Welcome to Esigniva!",
          `Account verified with Google. Entering your workspace...`,
          1400
        );

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
        setErrorMsg("Google authentication failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [navigate, setToken, setUser]
  );

  const googleInitializedRef = useRef(false);

  useEffect(() => {
    if (googleInitializedRef.current) return;

    const initGoogleAuth = () => {
      if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          googleInitializedRef.current = true;
          return true;
        } catch (e) {
          console.error("Google Auth Init Error:", e);
        }
      }
      return false;
    };

    if (!initGoogleAuth()) {
      const interval = setInterval(() => {
        if (initGoogleAuth()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [handleGoogleCredentialResponse]);

  const handleGoogleSignIn = () => {
    const originParam = `?origin=${encodeURIComponent(window.location.origin)}`;
    const redirectToOAuth = () => {
      window.location.href = `${API_BASE_URL}/auth/google/login${originParam}`;
    };

    if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn(
              "Google One Tap not displayed, falling back to OAuth redirect:",
              notification.getNotDisplayedReason?.() || notification.getSkippedReason?.()
            );
            redirectToOAuth();
          }
        });
        return;
      } catch (err) {
        console.warn("Google prompt error:", err);
      }
    }
    redirectToOAuth();
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
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: { xs: "column", md: "row" }, bgcolor: "#FFFFFF", overflowX: "hidden" }}>
      {/* Left Column: Hero Visual & Value Proposition (Light Teal Background) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1,
          width: { md: "50%", lg: "48%" },
          position: "relative",
          minHeight: "100vh",
          bgcolor: "#F0FDFA",
          background: "radial-gradient(circle at 20% 25%, #F0FDFA 0%, #D1F4EE 55%, #B7ECE4 100%)",
          borderRight: "1px solid #CCFBF1",
          alignItems: "center",
          justifyContent: "center",
          p: 6,
          overflow: "hidden",
        }}
      >
        {/* Subtle decorative glow */}
        <Box
          sx={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, rgba(209, 244, 238, 0) 70%)",
            top: "12%",
            left: "8%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 480, textAlign: "center" }}>
          <Box
            sx={{
              position: "relative",
              width: "min(380px, 85vw)",
              height: "min(340px, 80vw)",
              my: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src={images[currentImageIndex]}
              alt="Smart Signing"
              onError={(e) => {
                e.target.src = "/images/login1.png";
              }}
              sx={{
                width: "100%",
                height: "auto",
                maxHeight: 330,
                objectFit: "contain",
                filter: "drop-shadow(0 14px 28px rgba(15, 118, 110, 0.12))",
              }}
            />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, color: "#115E59", letterSpacing: "-0.02em", lineHeight: 1.25, mb: 1.25 }}>
            Smart Signing Insights
          </Typography>
          <Typography sx={{ fontSize: "1rem", color: "#0F766E", fontWeight: 500, mb: 0, maxWidth: 420 }}>
            Clear visuals and verified signatures that keep your documents moving forward seamlessly.
          </Typography>
        </Box>
      </Box>

      {/* Right Column: Registration Form with Clean White Background */}
      <Box
        sx={{
          flex: 1,
          width: { md: "50%", lg: "52%" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#FFFFFF",
          position: "relative",
          minHeight: "100vh",
          py: { xs: 6, md: 8 },
          px: { xs: 2.5, sm: 4 },
        }}
      >
        {/* Top Floating Navigation Bar */}
        <Paper
          elevation={0}
          sx={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: "#FFFFFF",
            p: 0.75,
            borderRadius: "20px",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
            border: "1px solid #E2E8F0",
            zIndex: 40,
            whiteSpace: "nowrap",
          }}
        >
          <Button
            size="small"
            onClick={goToHome}
            startIcon={<HomeRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: "14px",
              px: 2,
              py: 0.6,
              fontWeight: 600,
              fontSize: "0.8125rem",
              textTransform: "none",
              bgcolor: "#F0FDFA",
              color: "#0F766E",
              "&:hover": { bgcolor: "#CCFBF1" },
            }}
          >
            Home
          </Button>

          <Button
            size="small"
            onClick={() => navigate("/aboutus")}
            startIcon={<ExploreOutlinedIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: "14px",
              px: 2,
              py: 0.6,
              fontWeight: 500,
              fontSize: "0.8125rem",
              textTransform: "none",
              color: "#64748B",
              "&:hover": { bgcolor: "#F1F5F9", color: "#334155" },
            }}
          >
            Explore
          </Button>

          <Button
            size="small"
            onClick={() => navigate("/contactus")}
            startIcon={<PeopleOutlineIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: "14px",
              px: 2,
              py: 0.6,
              fontWeight: 500,
              fontSize: "0.8125rem",
              textTransform: "none",
              color: "#64748B",
              "&:hover": { bgcolor: "#F1F5F9", color: "#334155" },
            }}
          >
            Let's Talk
          </Button>

          <Button
            size="small"
            onClick={() => navigate("/pricing")}
            startIcon={<WorkspacePremiumIcon sx={{ fontSize: 18, color: "#D97706" }} />}
            sx={{
              borderRadius: "14px",
              px: 2,
              py: 0.6,
              fontWeight: 600,
              fontSize: "0.8125rem",
              textTransform: "none",
              color: "#475569",
              "&:hover": { bgcolor: "#FEF3C7", color: "#B45309" },
            }}
          >
            Upgrade
          </Button>
        </Paper>

        {/* Center Card Container */}
        <Box sx={{ width: "100%", maxWidth: 450, pt: { xs: 8, md: 5 } }}>
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: 430,
              mx: "auto",
              p: { xs: 3, sm: 3.5 },
              bgcolor: "#FFFFFF",
              borderRadius: "20px",
              boxShadow: "0 20px 45px -10px rgba(15, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(203, 213, 225, 0.8)",
              textAlign: "center",
            }}
          >
            {/* Header with Optically Centered Branding */}
            <Box sx={{ mb: 2 }}>
              <Box
                onClick={goToHome}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.25,
                  cursor: "pointer",
                  mb: 1.25,
                  transition: "transform 0.15s ease",
                  "&:hover": { transform: "scale(1.02)" },
                }}
              >
                {logoUrl ? (
                  <Box component="img" src={logoUrl} alt="logo" sx={{ height: 40, width: "auto", objectFit: "contain" }} />
                ) : (
                  <ShieldOutlinedIcon sx={{ fontSize: 40, color: "#0F766E" }} />
                )}
                <Typography sx={{ fontSize: "1.85rem", fontWeight: 700, color: "#0F766E", letterSpacing: "-0.03em" }}>
                  {brandName}
                </Typography>
              </Box>

              <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {step > 1 && (
                  <IconButton
                    size="small"
                    onClick={goBack}
                    sx={{
                      position: "absolute",
                      left: 0,
                      color: "#64748B",
                      "&:hover": { color: "#0F766E", bgcolor: "#F1F5F9" },
                    }}
                    title="Go Back"
                  >
                    <ArrowBackRoundedIcon fontSize="small" />
                  </IconButton>
                )}
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#115E59", letterSpacing: "-0.02em" }}>
                  {step === 1 && "Create Your Account"}
                  {step === 2 && "Verify Email Address"}
                  {step === 3 && "Workspace & Password"}
                </Typography>
              </Box>

              <Typography sx={{ fontSize: "0.875rem", color: "#64748B", mt: 0.5 }}>
                {step === 1 && "Start your free workspace with Google or your email"}
                {step === 2 && `Enter the 6-digit verification code sent to ${formData.email}`}
                {step === 3 && "Complete your organization name and set a secure password"}
              </Typography>
            </Box>

            {/* Stepper Progress Indicator */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 2 }}>
              {/* Step 1 badge */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    bgcolor: step >= 1 ? "#0F766E" : "#F1F5F9",
                    color: step >= 1 ? "#FFFFFF" : "#94A3B8",
                    border: step >= 1 ? "none" : "1px solid #CBD5E1",
                  }}
                >
                  {step > 1 ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : "1"}
                </Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: step >= 1 ? 700 : 500, color: step >= 1 ? "#115E59" : "#94A3B8" }}>
                  Email
                </Typography>
              </Box>

              <Box sx={{ width: 28, height: 2, bgcolor: step > 1 ? "#0F766E" : "#E2E8F0" }} />

              {/* Step 2 badge */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    bgcolor: step >= 2 ? "#0F766E" : "#F1F5F9",
                    color: step >= 2 ? "#FFFFFF" : "#94A3B8",
                    border: step >= 2 ? "none" : "1px solid #CBD5E1",
                  }}
                >
                  {step > 2 ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : "2"}
                </Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: step >= 2 ? 700 : 500, color: step >= 2 ? "#115E59" : "#94A3B8" }}>
                  Verify
                </Typography>
              </Box>

              <Box sx={{ width: 28, height: 2, bgcolor: step > 2 ? "#0F766E" : "#E2E8F0" }} />

              {/* Step 3 badge */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    bgcolor: step >= 3 ? "#0F766E" : "#F1F5F9",
                    color: step >= 3 ? "#FFFFFF" : "#94A3B8",
                    border: step >= 3 ? "none" : "1px solid #CBD5E1",
                  }}
                >
                  3
                </Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: step >= 3 ? 700 : 500, color: step >= 3 ? "#115E59" : "#94A3B8" }}>
                  Workspace
                </Typography>
              </Box>
            </Box>

            {/* Form Error Banner - only rendered when active */}
            {(errorMsg || successMsg) && (
              <Box sx={{ mb: 2 }}>
                {errorMsg ? (
                  <Alert severity="error" icon={<ErrorOutlineIcon fontSize="inherit" />} sx={{ borderRadius: "10px", fontSize: "0.8125rem", textAlign: "left" }}>
                    {errorMsg}
                  </Alert>
                ) : successMsg ? (
                  <Alert severity="success" icon={<CheckCircleOutlineIcon fontSize="inherit" />} sx={{ borderRadius: "10px", fontSize: "0.8125rem", textAlign: "left" }}>
                    {successMsg}
                  </Alert>
                ) : null}
              </Box>
            )}

            <Box sx={{ width: "100%", maxWidth: 380, mx: "auto" }}>
              {/* ========================================================= */}
              {/* STEP 1: Enter Email or Continue with Google               */}
              {/* ========================================================= */}
              {step === 1 && (
                <Box sx={{ width: "100%" }}>
                  {/* Google Button */}
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    id="googleRegisterBtn"
                    sx={{
                      width: "100%",
                      height: 48,
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      color: "#1E293B",
                      bgcolor: "#FFFFFF",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      gap: 1.5,
                      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
                      mb: 2,
                      mx: "auto",
                      boxSizing: "border-box",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        bgcolor: "#F8FAFC",
                        borderColor: "#0F766E",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                        transform: "translateY(-1px)",
                      },
                      "&:focus-visible": {
                        outline: "none",
                        borderColor: "#0F766E",
                        boxShadow: "0 0 0 3px rgba(15, 118, 110, 0.12)",
                      },
                      "&:active": {
                        transform: "translateY(0)",
                        bgcolor: "#F1F5F9",
                      },
                    }}
                  >
                    <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </Button>

                  {/* Divider */}
                  <Divider sx={{ my: 2, textAlign: "center", "&::before, &::after": { borderColor: "#E2E8F0" } }}>
                    <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      or register with email
                    </Typography>
                  </Divider>

                  <Box component="form" onSubmit={handleSendOTP} noValidate sx={{ width: "100%", textAlign: "left" }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        component="label"
                        htmlFor="register-email"
                        sx={{
                          display: "block",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#334155",
                          mb: 0.75,
                        }}
                      >
                        Email Address
                        <Box component="span" sx={{ color: "#DC2626", ml: 0.5 }}>
                          *
                        </Box>
                      </Typography>
                      <TextField
                        id="register-email"
                        fullWidth
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="you@example.com"
                        required
                        disabled={loading}
                        error={Boolean(fieldErrors.email)}
                        helperText={fieldErrors.email}
                        variant="outlined"
                        size="small"
                        FormHelperTextProps={{
                          sx: { mx: 0, mt: 0.6, fontSize: 13, fontWeight: 500, color: "#DC2626" },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MailOutlineRoundedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: 48,
                            borderRadius: "10px",
                            backgroundColor: "#FFFFFF",
                            "& fieldset": {
                              borderColor: "#CBD5E1",
                            },
                            "&:hover fieldset": {
                              borderColor: "#0F766E",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#0F766E",
                              borderWidth: "2px",
                            },
                            "&.Mui-focused": {
                              boxShadow: "0 0 0 3px rgba(15, 118, 110, 0.12)",
                            },
                            "&.Mui-error fieldset": {
                              borderColor: "#DC2626",
                            },
                          },
                          "& .MuiInputBase-input": {
                            fontSize: 14,
                            color: "#0F172A",
                            "&::placeholder": {
                              color: "#94A3B8",
                              opacity: 1,
                            },
                          },
                        }}
                      />
                    </Box>

                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        height: 48,
                        borderRadius: "10px",
                        bgcolor: "#0F766E",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        fontSize: "0.925rem",
                        textTransform: "none",
                        boxShadow: "0 4px 12px rgba(15, 118, 110, 0.22)",
                        "&.Mui-disabled, &:disabled": {
                          bgcolor: "#99F6E4",
                          color: "#0F766E",
                          boxShadow: "none",
                          cursor: "not-allowed",
                        },
                        mt: 0.5,
                        mb: 2,
                      }}
                    >
                      {loading ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CircularProgress size={18} color="inherit" />
                          <span>Sending Code...</span>
                        </Box>
                      ) : (
                        "Continue with Email"
                      )}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* ========================================================= */}
              {/* STEP 2: Verify OTP                                        */}
              {/* ========================================================= */}
              {step === 2 && (
                <Box component="form" onSubmit={handleVerifyOTP} noValidate sx={{ width: "100%", textAlign: "left" }}>
                  <Box sx={{ mb: 2.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Typography component="label" sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#334155" }}>
                        6-Digit Verification Code <Box component="span" sx={{ color: "#EF4444" }}>*</Box>
                      </Typography>
                      <Button
                        type="button"
                        size="small"
                        onClick={() => {
                          setStep(1);
                          setSubmitted(false);
                          setErrorMsg("");
                          setSuccessMsg("");
                          setFieldErrors((prev) => ({ ...prev, otp: "" }));
                        }}
                        startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "14px !important" }} />}
                        sx={{
                          textTransform: "none",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#0F766E",
                          p: 0,
                          minWidth: "auto",
                          "&:hover": { color: "#115E59", bgcolor: "transparent", textDecoration: "underline" },
                        }}
                      >
                        Change email
                      </Button>
                    </Box>

                    {/* 6 Digit Input Boxes */}
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between", gap: { xs: 1, sm: 1.5 }, mb: 1.5 }}
                      onPaste={handleOtpPaste}
                    >
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <Box
                          key={index}
                          component="input"
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
                          sx={{
                            width: { xs: 44, sm: 50 },
                            height: 52,
                            textAlign: "center",
                            fontSize: { xs: "1.25rem", sm: "1.45rem" },
                            fontWeight: 700,
                            bgcolor: "#FFFFFF",
                            color: "#0F172A",
                            border: "1.5px solid",
                            borderColor: fieldErrors.otp ? "#DC2626" : "#CBD5E1",
                            borderRadius: "10px",
                            outline: "none",
                            transition: "all 0.15s ease-in-out",
                            "&:focus": {
                              borderColor: fieldErrors.otp ? "#DC2626" : "#0F766E",
                              boxShadow: fieldErrors.otp
                                ? "0 0 0 3px rgba(220, 38, 38, 0.15)"
                                : "0 0 0 3px rgba(15, 118, 110, 0.15)",
                            },
                            "&:disabled": {
                              bgcolor: "#F8FAFC",
                              cursor: "not-allowed",
                            },
                          }}
                        />
                      ))}
                    </Box>

                    {fieldErrors.otp && (
                      <Typography sx={{ color: "#EF4444", fontSize: "0.75rem", fontWeight: 500, mt: 1, mb: 0.5 }}>
                        {fieldErrors.otp}
                      </Typography>
                    )}

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#64748B", mt: 2 }}>
                      <span>Didn't receive the code?</span>
                      {countdown > 0 ? (
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#94A3B8" }}>
                          Resend in {countdown}s
                        </Typography>
                      ) : (
                        <Button
                          type="button"
                          size="small"
                          onClick={handleResendOTP}
                          disabled={loading}
                          startIcon={<RefreshRoundedIcon sx={{ fontSize: "14px !important" }} />}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#0F766E",
                            p: 0,
                            minWidth: "auto",
                            "&:hover": { color: "#115E59", bgcolor: "transparent", textDecoration: "underline" },
                          }}
                        >
                          Resend Code
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={loading || otp.length < 6}
                    sx={{
                      height: 48,
                      borderRadius: "10px",
                      bgcolor: "#0F766E",
                      color: "#FFFFFF",
                      fontWeight: 600,
                      fontSize: "0.925rem",
                      textTransform: "none",
                      boxShadow: "0 4px 12px rgba(15, 118, 110, 0.22)",
                      "&.Mui-disabled, &:disabled": {
                        bgcolor: "#99F6E4",
                        color: "#0F766E",
                        boxShadow: "none",
                        cursor: "not-allowed",
                      },
                      mt: 1,
                      mb: 2.5,
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={18} color="inherit" />
                        <span>Verifying...</span>
                      </Box>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                </Box>
              )}

              {/* ========================================================= */}
              {/* STEP 3: Organization Details & Password                   */}
              {/* ========================================================= */}
              {step === 3 && (
                <Box component="form" onSubmit={handleCompleteRegistration} noValidate sx={{ width: "100%", textAlign: "left" }}>
                  {/* Verified Email Banner (Dismissible) */}
                  <AnimatePresence>
                    {showVerifiedBanner && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <Alert
                          severity="success"
                          icon={<CheckCircleOutlineIcon fontSize="inherit" />}
                          action={
                            <IconButton size="small" onClick={() => setShowVerifiedBanner(false)} color="inherit">
                              <CloseRoundedIcon fontSize="small" />
                            </IconButton>
                          }
                          sx={{
                            borderRadius: "10px",
                            bgcolor: "#ECFDF5",
                            color: "#065F46",
                            border: "1px solid #A7F3D0",
                            py: 0.5,
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                          }}
                        >
                          Verified: <strong>{formData.email}</strong>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Full Name */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      component="label"
                      htmlFor="register-full-name"
                      sx={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#334155",
                        mb: 0.75,
                      }}
                    >
                      Full Name
                      <Box component="span" sx={{ color: "#DC2626", ml: 0.5 }}>
                        *
                      </Box>
                    </Typography>
                    <TextField
                      id="register-full-name"
                      fullWidth
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="John Doe"
                      required
                      disabled={loading}
                      error={Boolean(fieldErrors.full_name)}
                      helperText={fieldErrors.full_name}
                      variant="outlined"
                      size="small"
                      FormHelperTextProps={{
                        sx: { mx: 0, mt: 0.6, fontSize: 13, fontWeight: 500, color: "#DC2626" },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineRoundedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: 48,
                          borderRadius: "10px",
                          backgroundColor: "#FFFFFF",
                          "& fieldset": {
                            borderColor: "#CBD5E1",
                          },
                          "&:hover fieldset": {
                            borderColor: "#0F766E",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#0F766E",
                            borderWidth: "2px",
                          },
                          "&.Mui-focused": {
                            boxShadow: "0 0 0 3px rgba(15, 118, 110, 0.12)",
                          },
                          "&.Mui-error fieldset": {
                            borderColor: "#DC2626",
                          },
                        },
                        "& .MuiInputBase-input": {
                          fontSize: 14,
                          color: "#0F172A",
                          "&::placeholder": {
                            color: "#94A3B8",
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Organization Name */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      component="label"
                      htmlFor="register-org-name"
                      sx={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#334155",
                        mb: 0.75,
                      }}
                    >
                      Workspace / Organization Name
                      <Box component="span" sx={{ color: "#DC2626", ml: 0.5 }}>
                        *
                      </Box>
                    </Typography>
                    <TextField
                      id="register-org-name"
                      fullWidth
                      type="text"
                      name="organization_name"
                      value={formData.organization_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Acme Corp"
                      required
                      disabled={loading}
                      error={Boolean(fieldErrors.organization_name)}
                      helperText={fieldErrors.organization_name}
                      variant="outlined"
                      size="small"
                      FormHelperTextProps={{
                        sx: { mx: 0, mt: 0.6, fontSize: 13, fontWeight: 500, color: "#DC2626" },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: 48,
                          borderRadius: "10px",
                          backgroundColor: "#FFFFFF",
                          "& fieldset": {
                            borderColor: "#CBD5E1",
                          },
                          "&:hover fieldset": {
                            borderColor: "#0F766E",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#0F766E",
                            borderWidth: "2px",
                          },
                          "&.Mui-focused": {
                            boxShadow: "0 0 0 3px rgba(15, 118, 110, 0.12)",
                          },
                          "&.Mui-error fieldset": {
                            borderColor: "#DC2626",
                          },
                        },
                        "& .MuiInputBase-input": {
                          fontSize: 14,
                          color: "#0F172A",
                          "&::placeholder": {
                            color: "#94A3B8",
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Admin Secret Key (if admin mode) */}
                  {isAdminMode && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        component="label"
                        htmlFor="register-secret-key"
                        sx={{
                          display: "block",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#334155",
                          mb: 0.75,
                        }}
                      >
                        Admin Secret Key
                        <Box component="span" sx={{ color: "#DC2626", ml: 0.5 }}>
                          *
                        </Box>
                      </Typography>
                      <TextField
                        id="register-secret-key"
                        fullWidth
                        type="password"
                        name="secret_key"
                        value={formData.secret_key}
                        onChange={handleChange}
                        placeholder="Enter admin secret key"
                        required
                        disabled={loading}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <KeyOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: 48,
                            borderRadius: "10px",
                            backgroundColor: "#FFFFFF",
                            "& fieldset": {
                              borderColor: "#CBD5E1",
                            },
                            "&:hover fieldset": {
                              borderColor: "#0F766E",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#0F766E",
                              borderWidth: "2px",
                            },
                            "&.Mui-focused": {
                              boxShadow: "0 0 0 3px rgba(15, 118, 110, 0.12)",
                            },
                          },
                          "& .MuiInputBase-input": {
                            fontSize: 14,
                            color: "#0F172A",
                            "&::placeholder": {
                              color: "#94A3B8",
                              opacity: 1,
                            },
                          },
                        }}
                      />
                    </Box>
                  )}

                  {/* Password with 4 Segmented Validation Lines directly in bottom border */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      component="label"
                      htmlFor="register-password"
                      sx={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#334155",
                        mb: 0.75,
                      }}
                    >
                      Password
                      <Box component="span" sx={{ color: "#DC2626", ml: 0.5 }}>
                        *
                      </Box>
                    </Typography>

                    <Box sx={{ position: "relative" }}>
                      <TextField
                        id="register-password"
                        fullWidth
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="••••••••••••"
                        required
                        disabled={loading}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                                edge="end"
                                sx={{ color: "#94A3B8", "&:hover": { color: "#475569" } }}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: 48,
                            borderRadius: "10px",
                            backgroundColor: "#FFFFFF",
                            "& fieldset": {
                              borderColor:
                                formData.password && allPasswordRulesMet
                                  ? "#16A34A"
                                  : submitted && !formData.password
                                  ? "#DC2626"
                                  : "#CBD5E1",
                              borderWidth: formData.password && allPasswordRulesMet ? "1.5px" : "1px",
                            },
                            "&:hover fieldset": {
                              borderColor: "#0F766E",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#0F766E",
                              borderWidth: "2px",
                            },
                            "&.Mui-focused": {
                              boxShadow: "0 0 0 3px rgba(15, 118, 110, 0.12)",
                            },
                          },
                          "& .MuiInputBase-input": {
                            fontSize: 14,
                            color: "#0F172A",
                            "&::placeholder": {
                              color: "#94A3B8",
                              opacity: 1,
                            },
                          },
                        }}
                      />

                      {/* 4 Segmented Validation Lines directly along bottom border */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: "5px",
                          position: "absolute",
                          bottom: 0,
                          left: 10,
                          right: 10,
                          pointerEvents: "none",
                          zIndex: 2,
                        }}
                      >
                        {passwordChecks.map((item) => {
                          const hasTyped = formData.password.length > 0;
                          let barColor = "transparent";
                          if (hasTyped) {
                            barColor = item.isMet ? "#16A34A" : "#DC2626";
                          }
                          return (
                            <Box
                              key={item.id}
                              sx={{
                                flex: 1,
                                height: "3.5px",
                                borderRadius: "3px",
                                bgcolor: barColor,
                                transition: "background-color 0.2s ease",
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Box>

                    {/* Underneath: Show ONLY missing requirements in red, or Strong Password in green */}
                    {formData.password.length > 0 && (
                      <Box sx={{ mt: 0.75 }}>
                        {allPasswordRulesMet ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                              color: "#16A34A",
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#16A34A" }} />
                            <span>Strong password</span>
                          </Box>
                        ) : (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                            {missingPasswordChecks.map((m) => (
                              <Typography
                                key={m.id}
                                sx={{
                                  color: "#DC2626",
                                  fontSize: 12,
                                  fontWeight: 500,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.6,
                                }}
                              >
                                <Box component="span" sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#DC2626", flexShrink: 0 }} />
                                <span>Missing: {m.label}</span>
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}

                    {submitted && !formData.password && (
                      <Typography sx={{ color: "#DC2626", fontSize: 13, fontWeight: 500, mt: 0.6 }}>
                        Password is required
                      </Typography>
                    )}
                  </Box>

                  {/* Confirm Password */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      component="label"
                      htmlFor="register-confirm-password"
                      sx={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#334155",
                        mb: 0.75,
                      }}
                    >
                      Confirm Password
                      <Box component="span" sx={{ color: "#DC2626", ml: 0.5 }}>
                        *
                      </Box>
                    </Typography>

                    <Box sx={{ position: "relative" }}>
                      <TextField
                        id="register-confirm-password"
                        fullWidth
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="••••••••••••"
                        required
                        disabled={loading}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={loading}
                                edge="end"
                                sx={{ color: "#94A3B8", "&:hover": { color: "#475569" } }}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                              >
                                {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: 48,
                            borderRadius: "10px",
                            backgroundColor: "#FFFFFF",
                            "& fieldset": {
                              borderColor:
                                formData.confirmPassword && formData.password === formData.confirmPassword
                                  ? "#16A34A"
                                  : formData.confirmPassword && formData.password !== formData.confirmPassword
                                  ? "#DC2626"
                                  : "#CBD5E1",
                              borderWidth: formData.confirmPassword ? "1.5px" : "1px",
                            },
                            "&:hover fieldset": {
                              borderColor: "#0F766E",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#0F766E",
                              borderWidth: "2px",
                            },
                            "&.Mui-focused": {
                              boxShadow: "0 0 0 3px rgba(15, 118, 110, 0.12)",
                            },
                          },
                          "& .MuiInputBase-input": {
                            fontSize: 14,
                            color: "#0F172A",
                            "&::placeholder": {
                              color: "#94A3B8",
                              opacity: 1,
                            },
                          },
                        }}
                      />

                      {/* Confirm Password Bottom Border Segment */}
                      {formData.confirmPassword && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 10,
                            right: 10,
                            height: "3.5px",
                            borderRadius: "3px",
                            bgcolor: formData.password === formData.confirmPassword ? "#16A34A" : "#DC2626",
                            transition: "background-color 0.2s ease",
                            pointerEvents: "none",
                            zIndex: 2,
                          }}
                        />
                      )}
                    </Box>

                    {submitted && !formData.confirmPassword && (
                      <Typography sx={{ color: "#DC2626", fontSize: 13, fontWeight: 500, mt: 0.6 }}>
                        Please confirm your password
                      </Typography>
                    )}
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <Typography sx={{ color: "#DC2626", fontSize: 13, fontWeight: 500, mt: 0.6 }}>
                        Passwords do not match
                      </Typography>
                    )}
                  </Box>

                  {/* Complete Registration Submit Button */}
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={loading || !allPasswordRulesMet || formData.password !== formData.confirmPassword}
                    sx={{
                      height: 48,
                      borderRadius: "10px",
                      bgcolor: "#0F766E",
                      color: "#FFFFFF",
                      fontWeight: 600,
                      fontSize: "0.925rem",
                      textTransform: "none",
                      boxShadow: "0 4px 12px rgba(15, 118, 110, 0.22)",
                      "&.Mui-disabled, &:disabled": {
                        bgcolor: "#99F6E4",
                        color: "#0F766E",
                        boxShadow: "none",
                        cursor: "not-allowed",
                      },
                      mt: 1,
                      mb: 2,
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={18} color="inherit" />
                        <span>Creating Workspace...</span>
                      </Box>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </Box>
              )}

              {/* Login Link */}
              <Box sx={{ textAlign: "center", fontSize: "0.875rem", color: "#64748B" }}>
                <span>Already have an account?</span>{" "}
                <Typography
                  component="span"
                  onClick={goToLogin}
                  sx={{
                    color: "#0F766E",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    "&:hover": { color: "#115E59", textDecoration: "underline" },
                  }}
                >
                  Sign in here
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Floating Fast Login / Recent Account Popup (Material UI) */}
        <AnimatePresence>
          {savedUser && showFastLogin && (
            <motion.div
              key="fast-login-popup-register"
              initial={{ x: 380, opacity: 0, scale: 0.96 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 380, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
              style={{
                position: "fixed",
                top: 24,
                right: 24,
                width: 360,
                maxWidth: "calc(100vw - 32px)",
                zIndex: 1000,
              }}
            >
              <Paper
                elevation={6}
                sx={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: "1px solid #F1F5F9" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box
                      component="img"
                      src="/logo.png"
                      alt="Logo"
                      onError={(e) => (e.target.src = "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png")}
                      sx={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                    <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#334155" }}>
                      Sign in back to {brandName}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setShowFastLogin(false)} sx={{ color: "#94A3B8" }}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", mb: 2.5 }}>
                    <Box sx={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                      <Avatar
                        src={savedUser.profile_image || undefined}
                        sx={{ width: 48, height: 48, bgcolor: "#0F766E", fontSize: "1.15rem", fontWeight: 600 }}
                      >
                        {savedUser.full_name ? savedUser.full_name[0].toUpperCase() : "U"}
                      </Avatar>
                      {(savedUser.is_google || savedUser.auth_provider === "google") && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: -2,
                            right: -2,
                            width: 20,
                            height: 20,
                            bgcolor: "#FFFFFF",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }}
                        >
                          <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ textAlign: "left", overflow: "hidden" }}>
                      <Typography sx={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1E293B", lineHeight: 1.3, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {savedUser.full_name || "User Account"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748B", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {savedUser.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleContinueAs}
                    sx={{
                      height: 40,
                      borderRadius: "8px",
                      bgcolor: "#0F766E",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      "&:hover": { bgcolor: "#115E59" },
                    }}
                  >
                    Continue as {savedUser.full_name ? savedUser.full_name.split(" ")[0] : "User"}
                  </Button>
                </Box>

                <Box sx={{ py: 1.5, px: 2, textAlign: "center", borderTop: "1px solid #F1F5F9" }}>
                  <Typography
                    onClick={() => {
                      handleSwitchAccount();
                      setShowFastLogin(false);
                    }}
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#0F766E",
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Use another account
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default Register;
