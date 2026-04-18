// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../services/api";

// export default function Register({ onRegister }) {
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     confirmPassword: "",
//     role: "user",
//     organization_name: "",
//     full_name: "",
//     secret_key: "",
//   });

//   const [isAdminMode, setIsAdminMode] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");
//   const navigate = useNavigate();

//   // 🧩 Handle input change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // 🔁 Toggle Admin Mode
//   const toggleAdminMode = () => {
//     setIsAdminMode((prev) => !prev);
//     setFormData((prev) => ({
//       ...prev,
//       role: !isAdminMode ? "admin" : "user",
//       secret_key: "",
//       organization_name: "",
//     }));
//     setErrorMsg("");
//   };

//   // Validate form
//   const validateForm = () => {
//     if (formData.password.length < 6) {
//       setErrorMsg("Password must be at least 6 characters long");
//       return false;
//     }

//     if (formData.password !== formData.confirmPassword) {
//       setErrorMsg("Passwords do not match");
//       return false;
//     }

//     if (formData.role === "user" && !formData.organization_name.trim()) {
//       setErrorMsg("Organization name is required for organization users");
//       return false;
//     }

//     if (formData.role === "recipient" && !formData.full_name.trim()) {
//       setErrorMsg("Full name is required for recipients");
//       return false;
//     }

//     return true;
//   };

//   // 🚀 Submit Registration
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setErrorMsg("");

//     if (!validateForm()) {
//       setLoading(false);
//       return;
//     }

//     try {
//       const payload = {
//         email: formData.email.trim(),
//         password: formData.password.trim(),
//         role: formData.role,
//       };

//       // Add role-specific fields
//       if (formData.role === "admin") {
//         payload.secret_key = formData.secret_key.trim();
//       } else if (formData.role === "user") {
//         payload.organization_name = formData.organization_name.trim();
//       }

//       // Add full name for all roles except admin (optional)
//       if (formData.full_name.trim() && formData.role !== "admin") {
//         payload.full_name = formData.full_name.trim();
//       }

//       const res = await api.post("/auth/register", payload);

//       alert("Registration successful!");
//       const role = res?.data?.user?.role || formData.role;

//       // Redirect by role
//       if (role === "admin") navigate("/admin/dashboard");
//       else if (role === "user") navigate("/user/dashboard");
//       else if (role === "recipient") navigate("/recipient/dashboard");
//       else navigate("/");

//       // Reset form
//       setFormData({
//         email: "",
//         password: "",
//         confirmPassword: "",
//         role: "user",
//         organization_name: "",
//         full_name: "",
//         secret_key: "",
//       });
//       setIsAdminMode(false);
//       onRegister && onRegister();
//     } catch (err) {
//       console.error("Registration Error:", err);
//       setErrorMsg(err?.response?.data?.detail || "Registration failed. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🔐 Google Sign In
//   const handleGoogleSignIn = () => {
//   window.location.href = "http://localhost:9000/auth/google/login";
// };

//   // 🧭 Navigate to Login
//   const goToLogin = () => navigate("/login");

//   return (
//     <div style={styles.container}>
//       <h2 style={styles.title}>Create an Account</h2>

//       <button 
//         type="button"
//         onClick={toggleAdminMode} 
//         style={styles.adminToggle}
//       >
//         {isAdminMode ? "Exit Admin Mode" : "Switch to Admin Mode"}
//       </button>

//       {/* Google Sign In Button */}
//       <button
//         type="button"
//         onClick={handleGoogleSignIn}
//         style={styles.googleButton}
//       >
//         <span style={styles.googleIcon}>G</span>
//         Continue with Google
//       </button>

//       <div style={styles.divider}>
//         <span style={styles.dividerText}>or</span>
//       </div>

//       <form onSubmit={handleSubmit} style={styles.form}>
//         {/* Role Selection */}
//         {!isAdminMode && (
//           <>
//             <label style={styles.label}>Account Type</label>
//             <select
//               name="role"
//               value={formData.role}
//               onChange={handleChange}
//               style={styles.select}
//             >
//               <option value="user">Organization User</option>
//               <option value="recipient">Document Recipient</option>
//             </select>
//           </>
//         )}

//         {/* Full Name (for recipients and regular users) */}
//         {!isAdminMode && formData.role !== "admin" && (
//           <div>
//             <label style={styles.label}>
//               Full Name {formData.role === "recipient" && " *"}
//             </label>
//             <input
//               type="text"
//               name="full_name"
//               placeholder={
//                 formData.role === "recipient" 
//                   ? "Enter your full name" 
//                   : "Enter your name (optional)"
//               }
//               value={formData.full_name}
//               onChange={handleChange}
//               required={formData.role === "recipient"}
//               style={styles.input}
//             />
//           </div>
//         )}

//         {/* Organization Name (User only) */}
//         {formData.role === "user" && !isAdminMode && (
//           <div>
//             <label style={styles.label}>Organization Name *</label>
//             <input
//               type="text"
//               name="organization_name"
//               placeholder="Enter your organization name"
//               value={formData.organization_name}
//               onChange={handleChange}
//               required
//               style={styles.input}
//             />
//           </div>
//         )}

//         {/* Admin Secret Key (Admin only) */}
//         {isAdminMode && (
//           <div>
//             <label style={styles.label}>Admin Secret Key *</label>
//             <input
//               type="text"
//               name="secret_key"
//               placeholder="Enter Admin Secret Key"
//               value={formData.secret_key}
//               onChange={handleChange}
//               required
//               style={styles.input}
//             />
//           </div>
//         )}

//         {/* Email */}
//         <label style={styles.label}>Email *</label>
//         <input
//           type="email"
//           name="email"
//           placeholder="Enter your email address"
//           value={formData.email}
//           onChange={handleChange}
//           required
//           style={styles.input}
//         />

//         {/* Password */}
//         <label style={styles.label}>Password *</label>
//         <input
//           type="password"
//           name="password"
//           placeholder="Enter your password (min. 6 characters)"
//           value={formData.password}
//           onChange={handleChange}
//           required
//           minLength={6}
//           style={styles.input}
//         />

//         {/* Confirm Password */}
//         <label style={styles.label}>Confirm Password *</label>
//         <input
//           type="password"
//           name="confirmPassword"
//           placeholder="Confirm your password"
//           value={formData.confirmPassword}
//           onChange={handleChange}
//           required
//           style={styles.input}
//         />

//         {/* Role Description */}
//         {!isAdminMode && (
//           <div style={styles.roleInfo}>
//             {formData.role === "user" ? (
//               <p style={styles.infoText}>
//                 <strong>Organization User:</strong> Create and send documents for signing, manage your organization's documents.
//               </p>
//             ) : (
//               <p style={styles.infoText}>
//                 <strong>Document Recipient:</strong> Sign documents sent to you, access your signing history, and manage your signed documents.
//               </p>
//             )}
//           </div>
//         )}

//         {/* Error message */}
//         {errorMsg && <p style={styles.error}>{errorMsg}</p>}

//         {/* Submit */}
//         <button 
//           type="submit" 
//           disabled={loading} 
//           style={{
//             ...styles.submitBtn,
//             ...(loading ? styles.submitBtnDisabled : {})
//           }}
//         >
//           {loading
//             ? "Registering..."
//             : isAdminMode
//             ? "Register as Admin"
//             : `Register as ${formData.role === 'user' ? 'Organization User' : 'Recipient'}`}
//         </button>

//         {/* Navigate to Login */}
//         <p style={styles.footerText}>
//           Already have an account?{" "}
//           <span onClick={goToLogin} style={styles.link}>
//             Login here
//           </span>
//         </p>
//       </form>
//     </div>
//   );
// }

// // 🎨 Enhanced Inline Styles
// const styles = {
//   container: {
//     padding: "40px",
//     maxWidth: "480px",
//     margin: "40px auto",
//     position: "relative",
//     backgroundColor: "#ffffff",
//     borderRadius: "12px",
//     boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
//   },
//   title: { 
//     textAlign: "center", 
//     marginBottom: "20px", 
//     fontWeight: "600",
//     color: "#333",
//     fontSize: "24px"
//   },
//   adminToggle: {
//     position: "absolute",
//     top: "15px",
//     right: "15px",
//     fontSize: "12px",
//     color: "#007bff",
//     background: "transparent",
//     border: "1px solid #007bff",
//     borderRadius: "4px",
//     padding: "4px 8px",
//     cursor: "pointer",
//   },
//   googleButton: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: "10px",
//     width: "100%",
//     padding: "12px",
//     backgroundColor: "#ffffff",
//     color: "#333",
//     border: "1px solid #ddd",
//     borderRadius: "6px",
//     cursor: "pointer",
//     fontWeight: "600",
//     fontSize: "14px",
//     marginBottom: "20px",
//     transition: "all 0.2s",
//   },
//   googleIcon: {
//     width: "18px",
//     height: "18px",
//     backgroundColor: "#4285f4",
//     color: "white",
//     borderRadius: "50%",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: "12px",
//     fontWeight: "bold",
//   },
//   divider: {
//     position: "relative",
//     textAlign: "center",
//     margin: "20px 0",
//     "&::before": {
//       content: '""',
//       position: "absolute",
//       top: "50%",
//       left: 0,
//       right: 0,
//       height: "1px",
//       backgroundColor: "#ddd",
//     }
//   },
//   dividerText: {
//     backgroundColor: "white",
//     padding: "0 15px",
//     color: "#666",
//     fontSize: "14px",
//     position: "relative",
//   },
//   form: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "18px",
//   },
//   label: { 
//     fontWeight: "600", 
//     fontSize: "14px",
//     color: "#555",
//     marginBottom: "4px",
//     display: "block"
//   },
//   input: {
//     padding: "12px",
//     borderRadius: "6px",
//     border: "1px solid #ddd",
//     width: "100%",
//     fontSize: "14px",
//     boxSizing: "border-box",
//   },
//   select: {
//     padding: "12px",
//     borderRadius: "6px",
//     border: "1px solid #ddd",
//     width: "100%",
//     fontSize: "14px",
//     backgroundColor: "white",
//   },
//   roleInfo: {
//     backgroundColor: "#f8f9fa",
//     padding: "12px",
//     borderRadius: "6px",
//     border: "1px solid #e9ecef",
//   },
//   infoText: {
//     margin: 0,
//     fontSize: "13px",
//     color: "#666",
//     lineHeight: "1.4",
//   },
//   submitBtn: {
//     padding: "12px",
//     backgroundColor: "#007bff",
//     color: "white",
//     border: "none",
//     borderRadius: "6px",
//     cursor: "pointer",
//     fontWeight: "600",
//     fontSize: "16px",
//     transition: "background-color 0.2s",
//   },
//   submitBtnDisabled: {
//     backgroundColor: "#6c757d",
//     cursor: "not-allowed",
//   },
//   error: {
//     color: "#dc3545",
//     fontSize: "14px",
//     textAlign: "center",
//     padding: "8px",
//     backgroundColor: "#f8d7da",
//     borderRadius: "4px",
//     border: "1px solid #f5c6cb",
//   },
//   footerText: {
//     textAlign: "center",
//     marginTop: "15px",
//     fontSize: "14px",
//     color: "#666",
//   },
//   link: {
//     color: "#007bff",
//     cursor: "pointer",
//     textDecoration: "underline",
//     fontWeight: "500",
//   },
// };

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "../../style/Register.css";
import API_BASE_URL from "../../config/api";

import { setPageTitle } from "../../utils/pageTitle";
// Material UI Icons
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Home from "@mui/icons-material/Home";
import Google from "@mui/icons-material/Google";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Security from "@mui/icons-material/Security";
import Lock from "@mui/icons-material/Lock";
import AccessTime from "@mui/icons-material/AccessTime";
import CloudDone from "@mui/icons-material/CloudDone";
import ArrowBackIos from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIos from "@mui/icons-material/ArrowForwardIos";
import Circle from "@mui/icons-material/Circle";
import {
  Shield,
} from "lucide-react";
import Explore from "@mui/icons-material/Explore";
import People from "@mui/icons-material/People";
import Upgrade from "@mui/icons-material/Upgrade";
import {
  FaCrown,
} from 'react-icons/fa';
import LockOutlined from "@mui/icons-material/LockOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";




const Register = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    organization_name: "",
    secret_key: "",
  });

  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [brandName, setBrandName] = useState("SafeSign");
  const [logoUrl, setLogoUrl] = useState(null);
  const { setUser, setToken } = useAuth();

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentRole, setCurrentRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  // Background images for carousel
  const backgroundImages = [
    "/images/register1.png",
    // "/images/register2.jpg",
    // "/images/register3.jpg",
    // "/images/register4.jpg",
    // "/images/register5.jpg"
  ];

  // Fallback images if the above don't exist
  const defaultImages = [
    "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1545235617-9465d2a55698?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80"
  ];

  // Use local images if they exist, otherwise use fallback
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
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Change image every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, images.length]);

  useEffect(() => {
    setPageTitle(
      "Register",
      "Create a SafeSign account and start signing and managing documents online today."
    );
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
    // setSuccessMsg("");
  };

  // Toggle Admin Mode
  const toggleAdminMode = () => {
    const newAdminMode = !isAdminMode;
    setIsAdminMode(newAdminMode);

    if (newAdminMode) {
      setCurrentRole("admin");
    } else {
      setCurrentRole("user");
    }

    // Reset relevant fields
    setFormData(prev => ({
      ...prev,
      secret_key: "",
    }));
    setErrorMsg("");
  };

  // Handle role change for non-admin users
  const handleRoleChange = (e) => {
    const role = e.target.value;
    setCurrentRole(role);
    setErrorMsg("");
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validate email
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Password validation rules
  const passwordRules = {
    minLength: formData.password.length >= 6,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
  };

  const allPasswordRulesMet = Object.values(passwordRules).every(rule => rule);

  // Validate form
  const validateForm = () => {
    if (!validateEmail(formData.email)) {
      setErrorMsg("Please enter a valid email address");
      return false;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      return false;
    }

    if (!allPasswordRulesMet) {
      setErrorMsg("Please meet all password requirements");
      return false;
    }

    if (currentRole === "user" && !isAdminMode && !formData.organization_name.trim()) {
      setErrorMsg("Organization name is required");
      return false;
    }

    if (currentRole === "recipient" && !formData.full_name.trim()) {
      setErrorMsg("Full name is required");
      return false;
    }

    if (isAdminMode && !formData.secret_key.trim()) {
      setErrorMsg("Admin secret key is required");
      return false;
    }

    return true;
  };

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    // setSuccessMsg("");

    // Basic validation
    if (!validateEmail(formData.email)) {
      setErrorMsg("Please enter a valid email address");
      toast.error("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      toast.error("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // 🔹 1. REGISTER USER
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        role: isAdminMode ? "admin" : currentRole,
      };

      if (payload.role === "user") {
        payload.organization_name = formData.organization_name.trim();
      }

      if (payload.role === "recipient") {
        payload.full_name = formData.full_name.trim();
      }

      if (payload.role === "admin") {
        payload.secret_key = formData.secret_key.trim();
      }

      const registerRes = await api.post("/auth/register", payload);

      if (!registerRes || registerRes.status !== 200) {
        throw new Error("Registration failed");
      }

      // 🔹 2. AUTO LOGIN
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

      // 🔹 3. SAVE AUTH STATE
      setToken(token);
      setUser(user);


      setSuccessMsg("Account created successfully! Redirecting...");


      // 🔹 4. ROLE-BASED REDIRECT
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
      console.error("Registration Error:", err);

      let message = "Registration failed. Please try again.";

      if (err.response) {
        const data = err.response.data;

        // Handle different error response formats from your backend
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (data.detail && typeof data.detail === "object") {
          // Handle the structured error response from your backend
          message = data.detail.message || data.detail.error || message;

          // Check for specific error codes from your backend
          if (data.detail.code === "EMAIL_EXISTS") {
            message = "This email is already registered. Please use a different email or try logging in.";
          } else if (data.detail.code === "INVALID_ADMIN_SECRET") {
            message = "The provided admin secret key is invalid.";
          } else if (data.detail.code === "ADMIN_SECRET_REQUIRED") {
            message = "Admin secret key is required for admin registration.";
          } else if (data.detail.code === "FULL_NAME_REQUIRED") {
            message = "Full name is required for recipient accounts.";
          } else if (data.detail.code === "DB_CONNECTION_ERROR") {
            message = "Unable to connect to the database. Please try again later.";
          } else if (data.detail.code === "DB_QUERY_ERROR") {
            message = "This email address is already registered. Please use a different email or try logging in.";
          } else if (data.detail.code === "USER_CREATION_FAILED") {
            message = "Unable to create user account. Please try again.";
          }

          // Add field-specific message if available
          if (data.detail.field) {
            message = `${data.detail.field}: ${message}`;
          }
        } else if (data.message) {
          message = data.message;
        }
      } else if (err.request) {
        message = "Unable to connect to server. Please check your internet connection.";
      }

      toast.error(message);
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };


  // Google Sign In
  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  // Navigate to Login
  const goToLogin = () => navigate("/login");

  // Navigate to Home
  const goToHome = () => navigate("/");

  // Carousel navigation
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    const rulesMetCount = Object.values(passwordRules).filter(Boolean).length;
    if (rulesMetCount <= 1) return '#ef4444';
    if (rulesMetCount <= 2) return '#f59e0b';
    if (rulesMetCount <= 3) return '#eab308';
    return '#10a37f';
  };

  // Get submit button text
  const getSubmitButtonText = () => {
    if (loading) return "Creating Account...";
    if (isAdminMode) return "Register as Admin";
    if (currentRole === "user") return "Register as Organization User";
    return "Register as Recipient";
  };

  // Security Features Component
  const SecurityFeatures = () => (
    <div className="security-features">
      <div className="security-header">
        <Security className="security-icon" />
        <h3>Enterprise-Grade Security</h3>
      </div>
      {/* <p className="security-description">
        Your documents and signatures are protected with military-grade encryption, 
        secure infrastructure, and globally recognized compliance standards.
      </p> */}

      <div className="security-grid">
        <div className="security-item">
          <div className="security-icon-wrapper">
            <CloudDone />
          </div>
          <div className="security-text">
            <h4>99.9%</h4>
            <p>Uptime SLA</p>
          </div>
        </div>

        <div className="security-item">
          <div className="security-icon-wrapper">
            <Lock />
          </div>
          <div className="security-text">
            <h4>256-bit</h4>
            <p>AES Encryption</p>
          </div>
        </div>

        <div className="security-item">
          <div className="security-icon-wrapper">
            <AccessTime />
          </div>
          <div className="security-text">
            <h4>24/7</h4>
            <p>Security Monitoring</p>
          </div>
        </div>
      </div>

      {/* <div className="security-buttons">
        <button className="demo-btn">Request a Demo →</button>
        <button className="trial-btn">Start Free Trial</button>
      </div> */}
    </div>
  );

  return (
    <div className="split-register-page">
      {/* Animated Background Icons */}

      {/* Left Side - Hero with Image Carousel */}
      <div className="register-hero">
        {/* Image Carousel */}




        <div className="hero-overlay">



          {/* Floating avatars */}
          <div className="avatar avatar-left">
            {/* <img src="/images/avatar1.jpg" alt="User" /> */}
          </div>

          <div className="avatar avatar-right">
            {/* <img src="/images/avatar2.jpg" alt="User" /> */}
          </div>
          <div className="hero-content">
            {/* <div className="brand-logo" onClick={goToHome}>
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
</div> */}

            {/* <motion.img
  key={currentImageIndex}
  src={images[currentImageIndex]}
  alt="Login visual"
  className="hero-image"
  initial={{ opacity: 0, scale: 0.98 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 1.2, ease: "easeInOut" }}
  style={{
    transform: "none",
    height: "100%",
    width: "100%",
    maxHeight: "450px",
    maxWidth: "450px",
    margin: "auto",
    display: "block",
  }}
/> */}

            <div className="insight-visual">
              {/* Floating avatars */}


              <div className="main-circle">
                <div className="bg-circle"></div>

                <img
                  src={images[currentImageIndex]}
                  alt="Smart Signing"
                  className="person-image"
                />
              </div>



              {/* Chat bubble */}
              {/* <div className="chat-bubble">•••</div> */}
            </div>

            <div className="hero-text center">
              <h1>Smart Signing Insights</h1>
              <p className="hero-subtitle">
                Clear visuals that show how your documents move from sent to signed.
              </p>
            </div>


            {/* <div className="hero-text">
              <h1>Join SafeSign Today</h1>
              <p className="hero-subtitle">
                Start your journey with secure digital signatures and streamline your document workflow
              </p>
            </div> */}

            {/* <SecurityFeatures /> */}
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="register-side">
        {/* <button className="home-btn floating" onClick={goToHome}>
          <Home />
        </button> */}
        <div className="top-nav">
          <button className="nav-item active" onClick={goToHome}>
            <Home fontSize="small" />
            <span>Home</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/aboutus")}>
            <Explore fontSize="small" />
            <span>Explore</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/contactus")}>
            <People fontSize="small" />
            <span>Let’s Talk</span>
          </button>

          <button className="nav-item upgrade" onClick={() => navigate("/pricing")}>
            <FaCrown fontSize="small" />
            <span>Upgrade</span>
          </button>
        </div>

        <div className="register-wrapper">
          <motion.div
            className="register-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>

              <div className="brand-logo" onClick={goToHome}>
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
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#0d9488",
                  letterSpacing: "0.3px",
                  marginBottom: "6px"
                }}
              >
                Activate Your Workspace
              </h2>

              {/* <p
    style={{
      fontSize: "13px",
      color: "#6b7280",
      margin: 0
    }}
  >
    Start signing documents securely in seconds
  </p> */}
            </div>


            <button className="google-btn" onClick={handleGoogleSignIn}>
              <Google className="google-icon" />
              Continue with Google
            </button>

            <div className="divider">
              <span>or use email</span>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Account Type */}
              {/* <div className={`form-group ${isAdminMode ? "hidden" : ""}`}>
                <label>Account Type</label>
                <select 
                  className="form-select" 
                  value={currentRole}
                  onChange={handleRoleChange}
                >
                  <option value="user">Organization User</option>
                  <option value="recipient">Document Recipient</option>
                </select>
              </div> */}

              {/* Full Name – show only for recipient */}
              {currentRole === "recipient" && !isAdminMode && (
                <div className="form-group">
                  <label>
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              {/* Organization Name – show only for user */}
              {currentRole === "user" && !isAdminMode && (
                <div className="form-group">
                  <label>
                    Organization Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    placeholder="Enter organization name"
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  className="form-input"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label>Password <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter Password (min. 6 characters)"
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <LockOpenOutlined /> : <LockOutlined />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      {[1, 2, 3, 4].map((segment) => {
                        const rulesMetCount = Object.values(passwordRules).filter(Boolean).length;
                        const isActive = segment <= Math.ceil((rulesMetCount / 4) * 4);
                        return (
                          <div
                            key={segment}
                            className="strength-segment"
                            style={{
                              backgroundColor: isActive ? getPasswordStrengthColor() : '#e5e7eb',
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="password-rules">
                      {Object.entries({
                        'At least 6 characters': passwordRules.minLength,
                        'One uppercase letter': passwordRules.hasUpper,
                        'One lowercase letter': passwordRules.hasLower,
                        'One number': passwordRules.hasNumber,
                      }).map(([rule, met]) => (
                        <div
                          key={rule}
                          className={`password-rule ${met ? 'valid' : ''}`}
                        >
                          <span className="rule-icon">{met ? '✓' : '✗'}</span>
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="error-message">
                  <ErrorOutline />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="success-message">
                  <CheckCircle />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                className="submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    {/* <span className="spinner"></span> */}
                    Creating Account...
                  </>
                ) : (
                  getSubmitButtonText()
                )}
              </button>

              {/* Login Link */}
              <div className="login-link">
                <span className="text">Already have an account?</span>
                <span className="link" onClick={goToLogin}>
                  Login here
                </span>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;