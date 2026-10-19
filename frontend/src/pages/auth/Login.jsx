import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import API_BASE_URL, { GOOGLE_CLIENT_ID } from "../../config/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import showAlert from "../../utils/swal";
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
import SecurityIcon from "@mui/icons-material/Security";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const Login = ({ onLogin, onError, compact = false }) => {
  const [brandName, setBrandName] = useState("Esigniva");
  const [logoUrl, setLogoUrl] = useState(null);
  const { setUser, setToken } = useAuth();

  // Authentication Step: 1 = Email & Password, 2 = Verify OTP
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "", otp: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [savedUser, setSavedUser] = useState(null);
  const [, setShowFullForm] = useState(true);
  const [showFastLogin, setShowFastLogin] = useState(true);
  const passwordRef = useRef(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // OTP Verification state
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const otpRefs = useRef([]);

  const navigate = useNavigate();
  const location = useLocation();

  // Check saved lockout in sessionStorage on load or email change
  useEffect(() => {
    const cleanEmail = (formData.email || "").trim().toLowerCase();
    if (!cleanEmail) return;
    try {
      const savedUntil = sessionStorage.getItem(`esigniva_lockout_${cleanEmail}`);
      if (savedUntil) {
        const remaining = Math.max(0, Math.ceil((new Date(savedUntil).getTime() - Date.now()) / 1000));
        if (remaining > 0) {
          setLockoutSeconds(remaining);
        } else {
          sessionStorage.removeItem(`esigniva_lockout_${cleanEmail}`);
        }
      }
    } catch (e) {}
  }, [formData.email]);

  // Countdown timer for lockout
  useEffect(() => {
    let timer;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setErrorMsg("");
            const cleanEmail = (formData.email || "").trim().toLowerCase();
            if (cleanEmail) {
              try {
                sessionStorage.removeItem(`esigniva_lockout_${cleanEmail}`);
              } catch (e) {}
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds, formData.email]);

  const formatLockoutTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Countdown timer for OTP resend in Step 2
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Focus first OTP input when entering step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        if (otpRefs.current[0]) otpRefs.current[0].focus();
      }, 120);
    }
  }, [step]);

  useEffect(() => {
    // Check for saved user or recent user in localStorage
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

    // ⚡ CASE 1: Try remembered token for "1-click Login"
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

          // SweetAlert Modal on Successful Fast Login
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
        console.warn("Remembered session expired, falling back to manual login.");
      } finally {
        setLoading(false);
      }
    }

    // CASE 2: No valid session - help user log back in manually
    if (savedUser.is_google) {
      if (window.google) {
        window.google.accounts.id.prompt();
      } else {
        toast("Initializing Google login...");
      }
    } else {
      const displayName = savedUser.full_name ? `, ${savedUser.full_name}` : "";
      setFormData((prev) => ({ ...prev, email: savedUser.email }));
      setSuccessMsg(`Welcome back${displayName}! Please enter your password to continue.`);
      setShowFastLogin(false);
      setStep(1);

      setTimeout(() => {
        if (passwordRef.current) passwordRef.current.focus();
      }, 300);
    }
  };

  const handleSwitchAccount = () => {
    setShowFullForm(true);
    setStep(1);
  };

  useEffect(() => {
    if (location.state?.prefillEmail) {
      setFormData((prev) => ({ ...prev, email: location.state.prefillEmail }));
      if (location.state.welcomeBack) {
        setSuccessMsg(`Welcome back, ${location.state.name}! Please enter your password.`);
        setShowFastLogin(false);
      }
      setStep(1);
    }
  }, [location.state]);

  useEffect(() => {
    if (successMsg && successMsg.includes("enter your password") && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [successMsg]);

  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying] = useState(true);

  const backgroundImages = ["/images/login1.png"];
  const images = backgroundImages;

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

  // Auto-play carousel
  useEffect(() => {
    let interval;
    if (isAutoPlaying && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, images.length]);

  useEffect(() => {
    setPageTitle(
      "Login",
      "Sign in to your Esigniva account to manage documents, signatures, and workflows."
    );
  }, []);

  const validateField = (name, value) => {
    let error = "";
    if (name === "email") {
      const emailTrimmed = (value || "").trim();
      if (!emailTrimmed) {
        error = "Email address is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        error = "Please enter a valid email address";
      }
    } else if (name === "password") {
      if (!value) {
        error = "Password is required";
      } else if (value.length < 6) {
        error = "Password must be at least 6 characters";
      }
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const val = (value || "").trim();
    if (submitted || val.length > 0) {
      const error = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
    const val = (value || "").trim();
    if (submitted) {
      const error = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: error }));
    } else if (touched[name]) {
      if (val.length > 0) {
        const error = validateField(name, value);
        setFieldErrors((prev) => ({ ...prev, [name]: error }));
      } else {
        setFieldErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }
  };

  // STEP 1: Validate Email & Password, Send Login OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const emailErr = validateField("email", formData.email);
    const passwordErr = validateField("password", formData.password);
    setTouched({ email: true, password: true });
    setFieldErrors((prev) => ({ ...prev, email: emailErr, password: passwordErr }));

    if (emailErr || passwordErr) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/login/send-otp", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
      });

      toast.success(res.data?.message || "Verification code sent to your email!", { id: "login-otp-sent" });
      setStep(2);
      setCountdown(60);
      setOtp("");
      setFieldErrors((prev) => ({ ...prev, otp: "" }));
    } catch (err) {
      console.error("Login Step 1 Error:", err);
      let message = "Invalid email or password. Please try again.";
      let isLockout = false;
      let retryAfter = 0;

      if (err.response) {
        const data = err.response.data;
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          message = data.detail.map((item) => item.msg).join(", ");
        } else if (data.detail && typeof data.detail === "object") {
          message = data.detail.message || data.detail.error || message;
          if (data.detail.code === "ACCOUNT_LOCKED_TEMPORARY" || err.response.status === 429) {
            isLockout = true;
            retryAfter = data.detail.retry_after || 300;
          }
        } else if (data.message) {
          message = data.message;
        }
      } else if (err.request) {
        message = "Unable to connect to server.";
      }

      if (isLockout || err.response?.status === 429) {
        const seconds = retryAfter || 300;
        setLockoutSeconds(seconds);
        const cleanEmail = formData.email.trim().toLowerCase();
        try {
          const lockoutDate = new Date(Date.now() + seconds * 1000).toISOString();
          sessionStorage.setItem(`esigniva_lockout_${cleanEmail}`, lockoutDate);
        } catch (e) {}

        showAlert.confirm(
          "Account Temporarily Locked",
          "You have entered an incorrect password 5 times. For your security, this account is temporarily locked for 5 minutes. Would you like to reset your password now?",
          "Reset Password",
          "Wait and Try Later"
        ).then((result) => {
          if (result?.isConfirmed) {
            handleForgotPassword();
          }
        });
      }

      setErrorMsg(message);
      onError?.(message);
    } finally {
      setLoading(false);
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

  // STEP 2: Verify OTP and Complete Login
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
      const res = await api.post("/auth/login/verify-otp", {
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      const token = res.data?.access_token;
      const user = res.data?.user;

      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      setToken(token);
      setUser(user, token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Clear lockout in sessionStorage upon successful login
      try {
        sessionStorage.removeItem(`esigniva_lockout_${formData.email.trim().toLowerCase()}`);
      } catch (e) {}
      setLockoutSeconds(0);

      // SweetAlert Modal on Successful Login
      await showAlert.autoNavigate(
        "Login Successful!",
        `Welcome back to ${brandName}, ${user.full_name || user.email}!`,
        1400
      );

      if (onLogin) {
        onLogin(user);
      } else {
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
      }
    } catch (err) {
      console.error("Login Verify OTP Error:", err);
      let message = "Invalid or expired verification code. Please try again.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          message = detail;
        } else if (detail.message) {
          message = detail.message;
        }
      }
      setFieldErrors((prev) => ({ ...prev, otp: message }));
      setErrorMsg(message);
      onError?.(message);
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
      const res = await api.post("/auth/login/resend-otp", {
        email: formData.email.trim().toLowerCase(),
      });
      toast.success(res.data?.message || "A new verification code has been sent!", { id: "login-otp-resend" });
      setCountdown(60);
      setOtp("");
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    } catch (err) {
      console.error("Resend OTP Error:", err);
      const msg = err.response?.data?.detail || "Failed to resend code. Please try again.";
      setErrorMsg(typeof msg === "string" ? msg : "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

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

        await showAlert.autoNavigate(
          "Logged in with Google!",
          `Welcome back to ${brandName}, ${user.full_name || user.email}!`,
          1400
        );

        if (onLogin) {
          onLogin(user);
        } else {
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
        }
      } catch (err) {
        console.error("Google verify error:", err);
        setErrorMsg("Google authentication failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [brandName, navigate, onLogin, setToken, setUser]
  );

  useEffect(() => {
    const initGoogleAuth = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            cancel_on_tap_outside: false,
            use_fedcm_for_prompt: false,
          });
          return true;
        } catch (err) {
          console.debug("Google Auth init:", err);
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
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn("Google One Tap prompt error:", err);
      }
    }
    const originParam = `?origin=${encodeURIComponent(window.location.origin)}`;
    window.location.href = `${API_BASE_URL}/auth/google/login${originParam}`;
  };

  const goToRegister = () => {
    if (compact && onError) {
      onError("");
    } else {
      navigate("/register");
    }
  };

  const goToHome = () => navigate("/");
  const handleForgotPassword = () => {
    if (formData.email) {
      navigate("/forgot-password", { state: { prefillEmail: formData.email.trim() } });
    } else {
      navigate("/forgot-password");
    }
  };

  // Reusable Step 1 Form Content (Material UI)
  const renderStep1Form = () => (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: "100%", textAlign: "left" }}>
      {/* Email Input */}
      <Box sx={{ mb: 2 }}>
        <Typography
          component="label"
          htmlFor="login-email"
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
          id="login-email"
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

      {/* Password Input */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75, flexWrap: "wrap", gap: 0.5 }}>
          <Typography
            component="label"
            htmlFor="login-password"
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: "#334155",
            }}
          >
            Password
            <Box component="span" sx={{ color: "#DC2626", ml: 0.5 }}>
              *
            </Box>
          </Typography>
          <Typography
            onClick={handleForgotPassword}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "#0F766E",
              cursor: "pointer",
              "&:hover": { color: "#115E59", textDecoration: "underline" },
            }}
          >
            Forgot password?
          </Typography>
        </Box>
        <TextField
          id="login-password"
          fullWidth
          type={showPassword ? "text" : "password"}
          name="password"
          inputRef={passwordRef}
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="••••••••••••"
          required
          disabled={loading}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password}
          variant="outlined"
          size="small"
          FormHelperTextProps={{
            sx: { mx: 0, mt: 0.6, fontSize: 13, fontWeight: 500, color: "#DC2626" },
          }}
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

      {/* Form-Level Feedback / Lockout Alert - only rendered when active */}
      {(lockoutSeconds > 0 || errorMsg || successMsg) && (
        <Box sx={{ my: 1.5 }}>
        {lockoutSeconds > 0 ? (
          <Alert
            severity="warning"
            icon={<SecurityIcon fontSize="inherit" />}
            sx={{
              borderRadius: "10px",
              bgcolor: "#FFFBEB",
              color: "#92400E",
              border: "1px solid #FDE68A",
              "& .MuiAlert-icon": { color: "#D97706" },
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleForgotPassword}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem" }}
              >
                Reset now
              </Button>
            }
          >
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>Security Lockout Active</Typography>
            <Typography sx={{ fontSize: "0.75rem", mt: 0.25 }}>
              Too many failed attempts (5/5). Please wait <strong>{formatLockoutTime(lockoutSeconds)}</strong> before retrying.
            </Typography>
          </Alert>
        ) : errorMsg ? (
          <Alert
            severity={errorMsg.toLowerCase().includes("warning") || errorMsg.toLowerCase().includes("attempt") ? "warning" : "error"}
            icon={errorMsg.toLowerCase().includes("warning") || errorMsg.toLowerCase().includes("attempt") ? <SecurityIcon fontSize="inherit" /> : <ErrorOutlineIcon fontSize="inherit" />}
            sx={{
              borderRadius: "10px",
              fontSize: "0.8125rem",
              "& .MuiAlert-message": { width: "100%" },
            }}
          >
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>{errorMsg}</Typography>
            {(errorMsg.toLowerCase().includes("warning") || errorMsg.toLowerCase().includes("attempt")) && (
              <Typography
                onClick={handleForgotPassword}
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#0F766E",
                  cursor: "pointer",
                  mt: 0.5,
                  display: "inline-block",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Forgot your password? Click here to reset &rarr;
              </Typography>
            )}
          </Alert>
        ) : successMsg ? (
          <Alert
            severity="success"
            icon={<CheckCircleOutlineIcon fontSize="inherit" />}
            sx={{ borderRadius: "10px", fontSize: "0.8125rem" }}
          >
            {successMsg}
          </Alert>
        ) : null}
      </Box>
      )}

      {/* Submit Button */}
      <Button
        fullWidth
        type="submit"
        variant="contained"
        disabled={loading || lockoutSeconds > 0}
        sx={{
          height: 48,
          borderRadius: "10px",
          bgcolor: "#0F766E",
          color: "#FFFFFF",
          fontWeight: 600,
          fontSize: "0.925rem",
          textTransform: "none",
          boxShadow: "0 4px 12px rgba(15, 118, 110, 0.22)",
          "&:hover": {
            bgcolor: "#115E59",
            boxShadow: "0 6px 16px rgba(15, 118, 110, 0.32)",
          },
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
        {lockoutSeconds > 0 ? (
          `Locked (${formatLockoutTime(lockoutSeconds)})`
        ) : loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={18} color="inherit" />
            <span>Validating...</span>
          </Box>
        ) : (
          "Sign In"
        )}
      </Button>

      {/* Create Account Link */}
      <Box sx={{ textAlign: "center", fontSize: "0.875rem", color: "#64748B" }}>
        <span>Don't have an account?</span>{" "}
        <Typography
          component="span"
          onClick={goToRegister}
          sx={{
            color: "#0F766E",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.875rem",
            "&:hover": { color: "#115E59", textDecoration: "underline" },
          }}
        >
          Create account
        </Typography>
      </Box>
    </Box>
  );

  // Reusable Step 2 Verify OTP Form Content (Material UI)
  const renderStep2Form = () => (
    <Box component="form" onSubmit={handleVerifyOTP} noValidate sx={{ width: "100%", textAlign: "left" }}>
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography component="label" sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#334155" }}>
            Verification Code <Box component="span" sx={{ color: "#EF4444" }}>*</Box>
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

        {/* Resend Code Section */}
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

      {/* Form Error Banner */}
      {errorMsg && (
        <Box sx={{ my: 1.5 }}>
          <Alert severity="error" icon={<ErrorOutlineIcon fontSize="inherit" />} sx={{ borderRadius: "10px", fontSize: "0.8125rem" }}>
            {errorMsg}
          </Alert>
        </Box>
      )}

      {/* Verify & Sign In Button */}
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
          "&:hover": {
            bgcolor: "#115E59",
            boxShadow: "0 6px 16px rgba(15, 118, 110, 0.32)",
          },
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
            <span>Verifying...</span>
          </Box>
        ) : (
          "Verify & Sign In"
        )}
      </Button>

      {/* Back to Email & Password */}
      <Box sx={{ textAlign: "center" }}>
        <Typography
          onClick={() => {
            setStep(1);
            setSubmitted(false);
            setErrorMsg("");
            setSuccessMsg("");
          }}
          sx={{
            fontSize: "0.8125rem",
            color: "#64748B",
            fontWeight: 500,
            cursor: "pointer",
            "&:hover": { color: "#0F766E", textDecoration: "underline" },
          }}
        >
          &larr; Back to email and password
        </Typography>
      </Box>
    </Box>
  );

  // -------------------------------------------------------------
  // Compact version (Modal mode)
  // -------------------------------------------------------------
  if (compact) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F0FDFA",
          background: "radial-gradient(circle at 20% 25%, #F0FDFA 0%, #D1F4EE 55%, #B7ECE4 100%)",
          p: 2.5,
          position: "relative",
          fontFamily: "inherit",
        }}
      >
        <Button
          onClick={goToHome}
          startIcon={
            logoUrl ? (
              <Box component="img" src={logoUrl} alt="logo" sx={{ height: 22, width: "auto" }} />
            ) : (
              <HomeRoundedIcon sx={{ color: "#0F766E", fontSize: 20 }} />
            )
          }
          sx={{
            position: "absolute",
            top: 24,
            left: 24,
            bgcolor: "#FFFFFF",
            border: "1px solid #CBD5E1",
            color: "#1E293B",
            borderRadius: "12px",
            px: 2,
            py: 0.8,
            fontWeight: 600,
            fontSize: "0.875rem",
            textTransform: "none",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            "&:hover": { bgcolor: "#F8FAFC" },
          }}
        >
          {brandName}
        </Button>

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 420,
            p: { xs: 3, sm: 3.5 },
            bgcolor: "#FFFFFF",
            borderRadius: "20px",
            boxShadow: "0 20px 45px -10px rgba(15, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(203, 213, 225, 0.8)",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
              {step === 1 ? "Welcome Back" : "Two-Step Verification"}
            </Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", mt: 0.5 }}>
              {step === 1 ? (
                "Sign in to your account"
              ) : (
                <>
                  Enter the 6-digit code sent to{" "}
                  <Box component="span" sx={{ fontWeight: 600, color: "#334155" }}>{formData.email}</Box>
                </>
              )}
            </Typography>
          </Box>

          <Box sx={{ width: "100%", maxWidth: 380, mx: "auto" }}>
            {step === 1 ? (
              <>
                {/* Google Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  id="googleSignInBtnCompact"
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
                <Divider sx={{ my: 2.5, "&::before, &::after": { borderColor: "#E2E8F0" } }}>
                  <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    or use email
                  </Typography>
                </Divider>

                {renderStep1Form()}
              </>
            ) : (
              renderStep2Form()
            )}
          </Box>
        </Paper>
      </Box>
    );
  }

  // -------------------------------------------------------------
  // Full version with premium two-column SaaS layout (Material UI)
  // -------------------------------------------------------------
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
          {/* Hero Promotional Image */}
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
            Building Stronger Connections
          </Typography>
          <Typography sx={{ fontSize: "1rem", color: "#0F766E", fontWeight: 500, mb: 0, maxWidth: 420 }}>
            Through Secure, Legally-Binding Digital Signing
          </Typography>
        </Box>
      </Box>

      {/* Right Column: Authentication Form with Clean White Background */}
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
            {/* Logo & Brand Header */}
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

              <Typography variant="h5" sx={{ fontWeight: 700, color: "#115E59", letterSpacing: "-0.02em", mb: 0.5 }}>
                {step === 1 ? "Welcome Back" : "Two-Step Verification"}
              </Typography>
              <Typography sx={{ fontSize: "0.875rem", color: "#64748B" }}>
                {step === 1 ? (
                  "Sign in to your account"
                ) : (
                  <>
                    Enter the 6-digit code sent to{" "}
                    <Box component="span" sx={{ fontWeight: 600, color: "#334155" }}>{formData.email}</Box>
                  </>
                )}
              </Typography>
            </Box>

            <Box sx={{ width: "100%", maxWidth: 380, mx: "auto" }}>
              {step === 1 ? (
                <>
                  {/* Google Button */}
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    id="googleSignInBtn"
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
                  <Divider sx={{ my: 2, "&::before, &::after": { borderColor: "#E2E8F0" } }}>
                    <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      or use email
                    </Typography>
                  </Divider>

                  {renderStep1Form()}
                </>
              ) : (
                renderStep2Form()
              )}
            </Box>
          </Paper>
        </Box>

        {/* Floating Fast Login Popup (Google One-Tap Style with Material UI Paper) */}
        <AnimatePresence>
          {savedUser && showFastLogin && savedUser.email && (
            <motion.div
              key="fast-login-popup"
              initial={{ x: 380, opacity: 0, scale: 0.96 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 380, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.8 }}
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

export default Login;
