import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import API_BASE_URL, { GOOGLE_CLIENT_ID } from "../../config/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { setPageTitle } from "../../utils/pageTitle";

// Icons
import Home from "@mui/icons-material/Home";
import Google from "@mui/icons-material/Google";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Explore from "@mui/icons-material/Explore";
import People from "@mui/icons-material/People";
import Close from "@mui/icons-material/Close";
import LockOutlined from "@mui/icons-material/LockOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import { FaCrown } from "react-icons/fa";
import { Shield } from "lucide-react";

const Login = ({ onLogin, onError, compact = false }) => {
  const [brandName, setBrandName] = useState("Esigniva");
  const [logoUrl, setLogoUrl] = useState(null);
  const { setUser, setToken } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [savedUser, setSavedUser] = useState(null);
  const [, setShowFullForm] = useState(true);
  const [showFastLogin, setShowFastLogin] = useState(true);
  const passwordRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

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
        remembered_token: storedToken || parsedRecent?.remembered_token || null
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
          toast.success(`Welcome back, ${freshName}!`, { id: "login-success" });
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

      setTimeout(() => {
        if (passwordRef.current) passwordRef.current.focus();
      }, 300);
    }
  };

  const handleSwitchAccount = () => {
    setShowFullForm(true);
  };

  useEffect(() => {
    if (location.state?.prefillEmail) {
      setFormData((prev) => ({ ...prev, email: location.state.prefillEmail }));
      if (location.state.welcomeBack) {
        setSuccessMsg(`Welcome back, ${location.state.name}! Please enter your password.`);
        setShowFastLogin(false);
      }
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

  const backgroundImages = [
    "/images/login1.png",
  ];
  const images = backgroundImages;

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
    const error = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
    if (touched[name]) {
      const error = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const emailErr = validateField("email", formData.email);
    const passwordErr = validateField("password", formData.password);
    setTouched({ email: true, password: true });
    setFieldErrors({ email: emailErr, password: passwordErr });

    if (emailErr || passwordErr) {
      setErrorMsg(emailErr || passwordErr);
      setLoading(false);
      return;
    }

    try {
      const form = new URLSearchParams();
      form.append("username", formData.email.trim().toLowerCase());
      form.append("password", formData.password.trim());

      const res = await api.post("/auth/login", form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const token = res.data?.access_token;
      const user = res.data?.user;

      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      setToken(token);
      setUser(user, token);
      setSuccessMsg("Login successful! Redirecting...");

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
      }, 700);
    } catch (err) {
      console.error("Login Error:", err);
      let message = "Login failed. Please try again.";

      if (err.response) {
        const data = err.response.data;
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          message = data.detail.map((item) => item.msg).join(", ");
        } else if (data.detail && typeof data.detail === "object") {
          message = data.detail.message || data.detail.error || message;
        } else if (data.message) {
          message = data.message;
        }
      } else if (err.request) {
        message = "Unable to connect to server.";
      }

      toast.error(message);
      setErrorMsg(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
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

      toast.success("Logged in with Google!", { id: "login-success" });

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
      toast.error("Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

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
        console.warn("Google One Tap prompt error, falling back to OAuth redirect:", err);
      }
    }
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  const goToRegister = () => {
    if (compact && onError) {
      onError("");
    } else {
      navigate("/register");
    }
  };

  const goToHome = () => navigate("/");
  const handleForgotPassword = () => navigate("/forgot-password");

  // Compact version for modal
  if (compact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-5 relative font-sans">
        <button
          type="button"
          onClick={goToHome}
          className="absolute top-6 left-6 flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold text-sm cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="h-6 w-auto object-contain" />
          ) : (
            <Home fontSize="small" className="text-teal-700" />
          )}
          <span>{brandName}</span>
        </button>

        <motion.div
          className="w-full max-w-[420px] p-8 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-xs text-slate-500 mt-1">Sign in to your account</p>
          </div>

          <div className="w-full max-w-[380px] mx-auto">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              id="googleSignInBtnCompact"
              className="w-full h-11 bg-white border border-slate-200 rounded-md px-4 flex items-center justify-center gap-2.5 text-[14px] font-medium text-slate-700 cursor-pointer transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative text-center my-4.5 w-full before:content-[''] before:absolute before:top-1/2 before:left-0 before:right-0 before:h-px before:bg-slate-200">
              <span className="relative bg-white px-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                or use email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="w-full text-left" noValidate>
              <div className="mb-4">
                <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                  Email <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className={`w-full h-11 bg-white border ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-teal-700'} rounded-md px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed`}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                  <label className="flex items-center text-xs font-semibold text-slate-700 tracking-wide">
                    Password <span className="text-red-500 ml-1">*</span>
                  </label>
                  <span
                    onClick={handleForgotPassword}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </span>
                </div>
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className={`w-full h-11 bg-white border ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-teal-700'} rounded-md pl-3.5 pr-10 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded transition-colors disabled:cursor-not-allowed"
                  >
                    {showPassword ? <LockOpenOutlined fontSize="small" /> : <LockOutlined fontSize="small" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.password}</p>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-md text-xs sm:text-sm flex items-center gap-2 mb-3.5 font-medium bg-red-50 border border-red-200 text-red-600">
                  <ErrorOutline fontSize="small" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-md text-xs sm:text-sm flex items-center gap-2 mb-3.5 font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <CheckCircle fontSize="small" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[14.5px] font-medium tracking-wide cursor-pointer transition-colors duration-150 mt-2 mb-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="text-center text-sm text-slate-500 mt-2">
                Don't have an account?{" "}
                <span
                  onClick={goToRegister}
                  className="text-teal-700 font-semibold cursor-pointer ml-1 hover:text-teal-800 hover:underline transition-colors"
                >
                  Sign up
                </span>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // Full version with split layout
  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans overflow-x-hidden bg-white">
      {/* Left Side - Hero Visual */}
      <div className="hidden md:flex flex-1 md:w-1/2 lg:w-[48%] relative min-h-screen overflow-hidden bg-[#BDF0E9] items-center justify-center">
        <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
          <div className="relative z-20 flex flex-col items-center w-full max-w-[520px]">
            <div className="relative w-[min(380px,85vw)] h-[min(380px,85vw)] my-5 shrink-0 flex items-center justify-center">
              <div className="relative w-full h-full rounded-full flex justify-center items-center">
                <div className="absolute w-[80%] h-[80%] bg-white/0 rounded-full z-[1]"></div>
                <img
                  src={images[currentImageIndex]}
                  alt="Smart Signing"
                  className="relative w-[min(420px,90%)] h-auto z-[2] rounded-xl object-contain drop-shadow-sm"
                />
              </div>
            </div>

            <div className="text-center mt-3 px-3">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-teal-800 leading-tight">
                Building Stronger Connections
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-teal-700 mt-1.5 font-medium">
                Through Secure Signing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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

        {/* Login Form Wrapper */}
        <div className="w-full max-w-[480px] pt-14 md:pt-16 pb-8 px-2 sm:px-4 flex justify-center">
          <motion.div
            className="w-full max-w-[440px] bg-white p-6 sm:p-9 rounded-[20px] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] border border-slate-200/80 text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="text-center mb-6">
              <div className="w-full flex items-center justify-center mb-2">
                <div
                  onClick={goToHome}
                  className="inline-flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01] relative -left-1.5 sm:-left-2"
                >
                  {logoUrl ? (
                    <>
                      <img src={logoUrl} alt="logo" className="h-8 sm:h-9 w-auto object-contain shrink-0" />
                      <span className="text-2xl sm:text-[26px] font-semibold text-teal-700 tracking-tight leading-none">{brandName}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-teal-700 shrink-0" />
                      <span className="text-2xl sm:text-[26px] font-semibold text-teal-700 tracking-tight leading-none">{brandName}</span>
                    </>
                  )}
                </div>
              </div>
              <h2 className="text-2xl sm:text-[28px] font-semibold text-teal-800 tracking-tight mb-2">
                Welcome Back
              </h2>
            </div>

            <div className="w-full max-w-[380px] mx-auto">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                id="googleSignInBtn"
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
                  or use email
                </span>
              </div>

              <form onSubmit={handleSubmit} className="w-full text-left" noValidate>
                <div className="mb-4">
                  <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                    Email Address <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="you@company.com"
                    required
                    disabled={loading}
                    className={`w-full h-11 bg-white border ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-teal-700'} rounded-md px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed`}
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                    <label className="flex items-center text-xs font-semibold text-slate-700 tracking-wide">
                      Password <span className="text-red-500 ml-1">*</span>
                    </label>
                    <span
                      onClick={handleForgotPassword}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      ref={passwordRef}
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      className={`w-full h-11 bg-white border ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-teal-700'} rounded-md pl-3.5 pr-10 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded transition-colors disabled:cursor-not-allowed"
                    >
                      {showPassword ? <LockOpenOutlined fontSize="small" /> : <LockOutlined fontSize="small" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.password}</p>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-md text-xs sm:text-sm flex items-center gap-2 mb-3.5 font-medium bg-red-50 border border-red-200 text-red-600">
                    <ErrorOutline fontSize="small" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-md text-xs sm:text-sm flex items-center gap-2 mb-3.5 font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <CheckCircle fontSize="small" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[14.5px] font-medium tracking-wide cursor-pointer transition-colors duration-150 mt-2 mb-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <div className="text-center text-sm text-slate-500 mt-2">
                  <span className="text-slate-500">Don't have an account?</span>
                  <span
                    onClick={goToRegister}
                    className="text-teal-700 font-semibold cursor-pointer ml-1.5 hover:text-teal-800 hover:underline transition-colors"
                  >
                    Create account
                  </span>
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Floating Fast Login Popup (Google One Tap Style) */}
        <AnimatePresence>
          {savedUser && showFastLogin && savedUser.email && (
            <motion.div
              key="fast-login-popup"
              initial={{ x: 380, opacity: 0, scale: 0.96 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 380, opacity: 0, scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 260,
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

export default Login;
