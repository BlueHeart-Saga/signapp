// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import api, { setAuthToken } from "../../services/api";

// export default function Login({ onLogin, onError, compact = false }) {
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [showForgotPassword, setShowForgotPassword] = useState(false);

//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     // Clear error when user starts typing
//     if (errorMsg) setErrorMsg("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setErrorMsg("");

//     try {
//       const form = new URLSearchParams();
//       form.append("username", formData.email.trim().toLowerCase());
//       form.append("password", formData.password.trim());

//       const res = await api.post("/auth/login", form.toString(), {
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       });

//       const token = res.data?.access_token;
//       if (!token) throw new Error("Invalid token received.");

//       // Store and decode token
//       localStorage.setItem("token", token);
//       localStorage.setItem("user", JSON.stringify(res.data.user));
//       setAuthToken(token);

//       const decoded = jwtDecode(token);
//       const role = decoded?.role?.toLowerCase() || "user";

//       // Call success callback if in modal mode
//       if (onLogin) {
//         onLogin(res.data.user);
//       } else {
//         // Regular navigation if standalone
//         switch (role) {
//           case "admin":
//             navigate("/admin/dashboard");
//             break;
//           case "recipient":
//             navigate("/recipient/dashboard");
//             break;
//           case "user":
//             navigate("/user/dashboard");
//             break;
//           default:
//             navigate("/dashboard");
//         }
//       }

//     } catch (err) {
//       const errorMessage = err?.response?.data?.detail || 
//         "Invalid email or password. Please try again.";
//       setErrorMsg(errorMessage);
//       onError?.(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🔐 Google Sign In
//   const handleGoogleSignIn = () => {
//   window.location.href = "http://localhost:9000/auth/google/login";
// };

//   // 🧭 Navigate to Register
//   const goToRegister = () => {
//     if (compact && onError) {
//       onError(""); // Clear errors when switching
//     } else {
//       navigate("/register");
//     }
//   };

//   // 🔑 Forgot Password
//   const handleForgotPassword = () => {
//     setShowForgotPassword(true);
//   };

//   // Compact version for modal
//   if (compact) {
//     return (
//       <div style={compactStyles.container}>
//         <form onSubmit={handleSubmit} style={compactStyles.form}>
//           <div>
//             <input
//               type="email"
//               name="email"
//               placeholder="Email address"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               style={{
//                 ...compactStyles.input,
//                 ...(errorMsg ? compactStyles.inputError : {})
//               }}
//               disabled={loading}
//             />
//           </div>

//           <div>
//             <input
//               type="password"
//               name="password"
//               placeholder="Password"
//               value={formData.password}
//               onChange={handleChange}
//               required
//               style={{
//                 ...compactStyles.input,
//                 ...(errorMsg ? compactStyles.inputError : {})
//               }}
//               disabled={loading}
//             />
//           </div>

//           {errorMsg && (
//             <div style={compactStyles.error}>
//               {errorMsg}
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             style={{
//               ...compactStyles.submitBtn,
//               ...(loading ? compactStyles.submitBtnDisabled : {})
//             }}
//           >
//             {loading ? "Signing in..." : "Sign In"}
//           </button>

//           <div style={compactStyles.footer}>
//             <span 
//               onClick={handleForgotPassword} 
//               style={compactStyles.footerLink}
//             >
//               Forgot password?
//             </span>
//           </div>
//         </form>
//       </div>
//     );
//   }

//   // Full version with enhanced styling
//   return (
//     <div style={styles.container}>
//       <div style={styles.header}>
//         <h2 style={styles.title}>Welcome Back</h2>
//         <p style={styles.subtitle}>Sign in to your account</p>
//       </div>

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
//         <div style={styles.inputGroup}>
//           <label style={styles.label}>Email Address</label>
//           <input
//             type="email"
//             name="email"
//             placeholder="Enter your email address"
//             value={formData.email}
//             onChange={handleChange}
//             required
//             disabled={loading}
//             style={{
//               ...styles.input,
//               ...(errorMsg ? styles.inputError : {})
//             }}
//           />
//         </div>

//         <div style={styles.inputGroup}>
//           <div style={styles.passwordHeader}>
//             <label style={styles.label}>Password</label>
//             <span 
//               onClick={handleForgotPassword} 
//               style={styles.forgotPassword}
//             >
//               Forgot password?
//             </span>
//           </div>
//           <input
//             type="password"
//             name="password"
//             placeholder="Enter your password"
//             value={formData.password}
//             onChange={handleChange}
//             required
//             disabled={loading}
//             style={{
//               ...styles.input,
//               ...(errorMsg ? styles.inputError : {})
//             }}
//           />
//         </div>

//         {errorMsg && (
//           <div style={styles.error}>
//             <span style={styles.errorIcon}>⚠️</span>
//             {errorMsg}
//           </div>
//         )}

//         <button
//           type="submit"
//           disabled={loading}
//           style={{
//             ...styles.submitBtn,
//             ...(loading ? styles.submitBtnDisabled : {})
//           }}
//         >
//           {loading ? (
//             <>
//               <span style={styles.spinner}></span>
//               Signing in...
//             </>
//           ) : (
//             "Sign In"
//           )}
//         </button>

//         <div style={styles.divider}>
//           <span style={styles.dividerText}>New to our platform?</span>
//         </div>

//         <button
//           type="button"
//           onClick={goToRegister}
//           style={styles.registerBtn}
//           disabled={loading}
//         >
//           Create an account
//         </button>

//         <div style={styles.roleInfo}>
//           <p style={styles.roleInfoText}>
//             <strong>Account Types:</strong>
//           </p>
//           <ul style={styles.roleList}>
//             <li>👤 <strong>Organization Users:</strong> Create and manage documents</li>
//             <li>📝 <strong>Recipients:</strong> Sign documents and access history</li>
//             <li>⚙️ <strong>Admins:</strong> Platform administration</li>
//           </ul>
//         </div>
//       </form>

//       {/* Forgot Password Modal */}
//       {showForgotPassword && (
//         <ForgotPasswordModal 
//           onClose={() => setShowForgotPassword(false)}
//         />
//       )}
//     </div>
//   );
// }

// // Forgot Password Modal Component
// function ForgotPasswordModal({ onClose }) {
//   const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Reset Password
//   const [email, setEmail] = useState("");
//   const [otp, setOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [successMsg, setSuccessMsg] = useState("");

//   const handleRequestOTP = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setErrorMsg("");
//     setSuccessMsg("");

//     try {
//       await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
//       setSuccessMsg("OTP sent to your email address");
//       setStep(2);
//     } catch (err) {
//       setErrorMsg(err?.response?.data?.detail || "Failed to send OTP. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerifyOTP = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setErrorMsg("");
//     setSuccessMsg("");

//     try {
//       await api.post("/auth/verify-otp", { 
//         email: email.trim().toLowerCase(), 
//         otp 
//       });
//       setSuccessMsg("OTP verified successfully");
//       setStep(3);
//     } catch (err) {
//       setErrorMsg(err?.response?.data?.detail || "Invalid OTP. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setErrorMsg("");
//     setSuccessMsg("");

//     if (newPassword !== confirmPassword) {
//       setErrorMsg("Passwords do not match");
//       setLoading(false);
//       return;
//     }

//     if (newPassword.length < 6) {
//       setErrorMsg("Password must be at least 6 characters");
//       setLoading(false);
//       return;
//     }

//     try {
//       await api.post("/auth/reset-password", { 
//         email: email.trim().toLowerCase(), 
//         otp,
//         new_password: newPassword
//       });
//       setSuccessMsg("Password reset successfully! You can now login with your new password.");
//       setTimeout(() => {
//         onClose();
//       }, 2000);
//     } catch (err) {
//       setErrorMsg(err?.response?.data?.detail || "Failed to reset password. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={modalStyles.overlay}>
//       <div style={modalStyles.modal}>
//         <div style={modalStyles.header}>
//           <h3 style={modalStyles.title}>
//             {step === 1 && "Reset Your Password"}
//             {step === 2 && "Verify OTP"}
//             {step === 3 && "Create New Password"}
//           </h3>
//           <button onClick={onClose} style={modalStyles.closeButton}>×</button>
//         </div>

//         <div style={modalStyles.content}>
//           {step === 1 && (
//             <form onSubmit={handleRequestOTP}>
//               <p style={modalStyles.description}>
//                 Enter your email address and we'll send you a One-Time Password to reset your password.
//               </p>
//               <div style={modalStyles.inputGroup}>
//                 <label style={modalStyles.label}>Email Address</label>
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="Enter your email"
//                   required
//                   style={modalStyles.input}
//                 />
//               </div>
//               {errorMsg && <p style={modalStyles.error}>{errorMsg}</p>}
//               {successMsg && <p style={modalStyles.success}>{successMsg}</p>}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 style={modalStyles.submitButton}
//               >
//                 {loading ? "Sending OTP..." : "Send OTP"}
//               </button>
//             </form>
//           )}

//           {step === 2 && (
//             <form onSubmit={handleVerifyOTP}>
//               <p style={modalStyles.description}>
//                 Enter the 6-digit OTP sent to your email address.
//               </p>
//               <div style={modalStyles.inputGroup}>
//                 <label style={modalStyles.label}>OTP Code</label>
//                 <input
//                   type="text"
//                   value={otp}
//                   onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                   placeholder="Enter 6-digit OTP"
//                   required
//                   maxLength={6}
//                   style={modalStyles.input}
//                 />
//               </div>
//               {errorMsg && <p style={modalStyles.error}>{errorMsg}</p>}
//               {successMsg && <p style={modalStyles.success}>{successMsg}</p>}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 style={modalStyles.submitButton}
//               >
//                 {loading ? "Verifying..." : "Verify OTP"}
//               </button>
//             </form>
//           )}

//           {step === 3 && (
//             <form onSubmit={handleResetPassword}>
//               <p style={modalStyles.description}>
//                 Create your new password. Must be at least 6 characters long.
//               </p>
//               <div style={modalStyles.inputGroup}>
//                 <label style={modalStyles.label}>New Password</label>
//                 <input
//                   type="password"
//                   value={newPassword}
//                   onChange={(e) => setNewPassword(e.target.value)}
//                   placeholder="Enter new password"
//                   required
//                   minLength={6}
//                   style={modalStyles.input}
//                 />
//               </div>
//               <div style={modalStyles.inputGroup}>
//                 <label style={modalStyles.label}>Confirm Password</label>
//                 <input
//                   type="password"
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   placeholder="Confirm new password"
//                   required
//                   minLength={6}
//                   style={modalStyles.input}
//                 />
//               </div>
//               {errorMsg && <p style={modalStyles.error}>{errorMsg}</p>}
//               {successMsg && <p style={modalStyles.success}>{successMsg}</p>}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 style={modalStyles.submitButton}
//               >
//                 {loading ? "Resetting..." : "Reset Password"}
//               </button>
//             </form>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // Modal Styles
// const modalStyles = {
//   overlay: {
//     position: "fixed",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 1000,
//   },
//   modal: {
//     backgroundColor: "white",
//     borderRadius: "12px",
//     padding: "0",
//     maxWidth: "400px",
//     width: "90%",
//     maxHeight: "90vh",
//     overflow: "auto",
//   },
//   header: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "20px 20px 0 20px",
//     borderBottom: "1px solid #eee",
//     paddingBottom: "20px",
//   },
//   title: {
//     margin: 0,
//     fontSize: "20px",
//     fontWeight: "600",
//     color: "#333",
//   },
//   closeButton: {
//     background: "none",
//     border: "none",
//     fontSize: "24px",
//     cursor: "pointer",
//     color: "#666",
//   },
//   content: {
//     padding: "20px",
//   },
//   description: {
//     margin: "0 0 20px 0",
//     color: "#666",
//     fontSize: "14px",
//     lineHeight: "1.5",
//   },
//   inputGroup: {
//     marginBottom: "15px",
//   },
//   label: {
//     display: "block",
//     marginBottom: "5px",
//     fontWeight: "600",
//     fontSize: "14px",
//     color: "#555",
//   },
//   input: {
//     width: "100%",
//     padding: "10px",
//     border: "1px solid #ddd",
//     borderRadius: "6px",
//     fontSize: "14px",
//     boxSizing: "border-box",
//   },
//   submitButton: {
//     width: "100%",
//     padding: "12px",
//     backgroundColor: "#007bff",
//     color: "white",
//     border: "none",
//     borderRadius: "6px",
//     cursor: "pointer",
//     fontWeight: "600",
//     fontSize: "14px",
//   },
//   error: {
//     color: "#dc3545",
//     fontSize: "14px",
//     textAlign: "center",
//     margin: "10px 0",
//     padding: "8px",
//     backgroundColor: "#f8d7da",
//     borderRadius: "4px",
//   },
//   success: {
//     color: "#28a745",
//     fontSize: "14px",
//     textAlign: "center",
//     margin: "10px 0",
//     padding: "8px",
//     backgroundColor: "#d4edda",
//     borderRadius: "4px",
//   },
// };

// // Enhanced compact styles for modal
// const compactStyles = {
//   container: {
//     padding: "15px 0",
//   },
//   form: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "15px",
//   },
//   input: {
//     padding: "12px",
//     width: "100%",
//     borderRadius: "6px",
//     border: "1px solid #ddd",
//     fontSize: "14px",
//     boxSizing: "border-box",
//     transition: "border-color 0.2s, box-shadow 0.2s",
//   },
//   inputError: {
//     borderColor: "#dc3545",
//     boxShadow: "0 0 0 2px rgba(220, 53, 69, 0.1)",
//   },
//   submitBtn: {
//     padding: "12px",
//     backgroundColor: "#007bff",
//     color: "white",
//     border: "none",
//     borderRadius: "6px",
//     cursor: "pointer",
//     fontWeight: "600",
//     fontSize: "14px",
//     transition: "background-color 0.2s",
//   },
//   submitBtnDisabled: {
//     backgroundColor: "#6c757d",
//     cursor: "not-allowed",
//   },
//   error: {
//     color: "#dc3545",
//     fontSize: "13px",
//     textAlign: "center",
//     padding: "8px",
//     backgroundColor: "#f8d7da",
//     borderRadius: "4px",
//     border: "1px solid #f5c6cb",
//   },
//   footer: {
//     textAlign: "center",
//     marginTop: "5px",
//   },
//   footerLink: {
//     color: "#007bff",
//     fontSize: "12px",
//     cursor: "pointer",
//     textDecoration: "underline",
//   },
// };

// // Enhanced full version styles
// const styles = {
//   container: {
//     padding: "40px",
//     maxWidth: "480px",
//     margin: "40px auto",
//     backgroundColor: "#ffffff",
//     borderRadius: "12px",
//     boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
//   },
//   header: {
//     textAlign: "center",
//     marginBottom: "20px",
//   },
//   title: {
//     fontSize: "28px",
//     fontWeight: "700",
//     color: "#333",
//     marginBottom: "8px",
//   },
//   subtitle: {
//     fontSize: "16px",
//     color: "#666",
//     margin: 0,
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
//     gap: "20px",
//   },
//   inputGroup: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "6px",
//   },
//   passwordHeader: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   label: {
//     fontWeight: "600",
//     fontSize: "14px",
//     color: "#555",
//   },
//   input: {
//     padding: "14px",
//     borderRadius: "8px",
//     border: "1px solid #ddd",
//     fontSize: "15px",
//     boxSizing: "border-box",
//     transition: "all 0.2s",
//   },
//   inputError: {
//     borderColor: "#dc3545",
//     boxShadow: "0 0 0 2px rgba(220, 53, 69, 0.1)",
//   },
//   forgotPassword: {
//     color: "#007bff",
//     fontSize: "13px",
//     cursor: "pointer",
//     textDecoration: "underline",
//   },
//   error: {
//     display: "flex",
//     alignItems: "center",
//     gap: "8px",
//     color: "#dc3545",
//     fontSize: "14px",
//     padding: "12px",
//     backgroundColor: "#f8d7da",
//     borderRadius: "6px",
//     border: "1px solid #f5c6cb",
//   },
//   errorIcon: {
//     fontSize: "16px",
//   },
//   submitBtn: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: "8px",
//     padding: "14px",
//     backgroundColor: "#007bff",
//     color: "white",
//     border: "none",
//     borderRadius: "8px",
//     cursor: "pointer",
//     fontWeight: "600",
//     fontSize: "16px",
//     transition: "all 0.2s",
//   },
//   submitBtnDisabled: {
//     backgroundColor: "#6c757d",
//     cursor: "not-allowed",
//   },
//   spinner: {
//     width: "16px",
//     height: "16px",
//     border: "2px solid transparent",
//     borderTop: "2px solid white",
//     borderRadius: "50%",
//     animation: "spin 1s linear infinite",
//   },
//   registerBtn: {
//     padding: "14px",
//     backgroundColor: "transparent",
//     color: "#007bff",
//     border: "2px solid #007bff",
//     borderRadius: "8px",
//     cursor: "pointer",
//     fontWeight: "600",
//     fontSize: "16px",
//     transition: "all 0.2s",
//   },
//   roleInfo: {
//     backgroundColor: "#f8f9fa",
//     padding: "15px",
//     borderRadius: "8px",
//     border: "1px solid #e9ecef",
//     marginTop: "10px",
//   },
//   roleInfoText: {
//     margin: "0 0 8px 0",
//     fontSize: "14px",
//     color: "#333",
//     fontWeight: "600",
//   },
//   roleList: {
//     margin: 0,
//     paddingLeft: "20px",
//     fontSize: "13px",
//     color: "#666",
//     lineHeight: "1.5",
//   },
// };

// // Add CSS animation for spinner
// const styleSheet = document.styleSheets[0];
// const keyframes = `
// @keyframes spin {
//   0% { transform: rotate(0deg); }
//   100% { transform: rotate(360deg); }
// }
// `;
// styleSheet.insertRule(keyframes, styleSheet.cssRules.length);



import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../../style/Login.css";
import api, { setAuthToken } from "../../services/api";
import API_BASE_URL from "../../config/api";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

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
import Explore from "@mui/icons-material/Explore";
import People from "@mui/icons-material/People";
import Upgrade from "@mui/icons-material/Upgrade";
import {
  FaCrown,
} from 'react-icons/fa';

import toast from "react-hot-toast";


import { setPageTitle } from "../../utils/pageTitle";


import {
  Shield,
} from "lucide-react";

import LockOutlined from "@mui/icons-material/LockOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";



const Login = ({ onLogin, onError, compact = false }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  // Track if profile check has been done
  const profileCheckDoneRef = useRef(false);

  const [showProfilePopup, setShowProfilePopup] = useState(false);


  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const [brandName, setBrandName] = useState("SafeSign");
  const [logoUrl, setLogoUrl] = useState(null);

  // Background images for carousel
  const backgroundImages = [
    "/images/login1.png",
    // "/images/login2.jpg",
    // "/images/login3.jpg",
    // "/images/login4.jpg",
    // "/images/login5.jpg"
  ];

  // Fallback images if the above don't exist
  const defaultImages = [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
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
      "Login",
      "Sign in to your SafeSign account to manage documents, signatures, and workflows."
    );
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
    // setSuccessMsg("");
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Function to check if profile is complete
  const isProfileComplete = (user) => {
    return user && user.full_name && user.full_name.trim().length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    // setSuccessMsg("");

    if (!validateEmail(formData.email)) {
      setErrorMsg("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // if (formData.password.length < 6) {
    //   setErrorMsg("Password must be at least 6 characters");
    //   setLoading(false);
    //   return;
    // }

    try {
      const form = new URLSearchParams();
      form.append("username", formData.email.trim().toLowerCase());
      form.append("password", formData.password.trim());

      const res = await api.post("/auth/login", form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // const token = res.data?.access_token;
      // if (!token) throw new Error("Invalid token received.");



      const token = res.data?.access_token;
      const user = res.data?.user;

      if (!token || !user) {
        throw new Error("Invalid login response");
      }





      // 🔥 THIS IS THE FIX
      setToken(token);   // updates axios + localStorage
      setUser(user);     // updates context immediately



      setSuccessMsg("✅ Login successful! Redirecting...");


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


      // setSuccessMsg("✅ Login successful! Redirecting...");


      // const decoded = jwtDecode(token);
      // const role = decoded?.role?.toLowerCase() || "user";

      // setTimeout(() => {
      //   if (onLogin) {
      //     onLogin(res.data.user);
      //   } else {
      //     switch (role) {
      //       case "admin":
      //         navigate("/admin/dashboard");
      //         break;
      //       case "recipient":
      //         navigate("/recipient/dashboard");
      //         break;
      //       case "user":
      //         navigate("/user/");
      //         break;
      //       default:
      //         navigate("/");
      //     }
      //   }
      // }, 1500);

    } catch (err) {
      console.error("Login Error:", err);

      let message = "Login failed. Please try again.";

      if (err.response) {
        const data = err.response.data;

        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (typeof data.detail === "object") {
          message = data.detail.message || data.detail.error || message;
        } else if (data.message) {
          message = data.message;
        }
      }
      else if (err.request) {
        message = "Unable to connect to server.";
      }

      toast.error(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
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

  // Carousel navigation
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
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

  // Compact version for modal
  if (compact) {
    return (
      <div className="login-page compact">
        <button className="home-btn" onClick={goToHome}>
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="logo-img" />
          ) : (
            <Home />
          )}
          <span className="brand-name">{brandName}</span>
        </button>

        <motion.div
          className="login-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="header">
            <h1>Welcome Back</h1>
            <p className="header-subtitle">Sign in to your account</p>
          </div>

          <button className="google-btn" onClick={handleGoogleSignIn}>
            <Google className="google-icon" />
            Continue with Google
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input
                type="email"
                className="form-input"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div className="password-header">
                <label>Password <span className="required">*</span></label>
                <span className="forgot-password" onClick={handleForgotPassword}>
                  Forgot password?
                </span>
              </div>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <LockOpenOutlined /> : <LockOutlined />}
                </button>
              </div>
            </div>

            {/* {errorMsg && (
              <div className="error-message">
                <ErrorOutline />
                {errorMsg}
              </div>
            )} */}

            {/* {successMsg && (
              <div className="success-message">
                <CheckCircle />
                {successMsg}
              </div>
            )} */}

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="register-link">
              Don't have an account? <span onClick={goToRegister}>Sign up</span>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  // Full version with split layout
  return (
    <div className="split-login-page">
      {/* Animated Background Icons */}

      {/* Left Side - Hero with Image Carousel */}

      <div className="login-hero">


        {/* Image Carousel */}

        <div className="hero-overlay">

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

            {/* Image */}
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
/>




            
            <div className="hero-text">
              <h1>Secure Digital Signatures</h1>
              <p className="hero-subtitle">
                Streamline your document workflow with enterprise-grade security and compliance
              </p>
            </div> */}

            <div className="connections-visual">


              <div className="main-circle">
                <div className="bg-circle"></div>

                <img
                  src={images[currentImageIndex]}
                  alt="Smart Signing"
                  className="person-image"
                />
              </div>

            </div>

            <div className="hero-text2 center">
              <h1>Building Stronger Connections</h1>
              <p className="hero-subtitle2">
                Through Secure Signing
              </p>
            </div>




            {/* <SecurityFeatures /> */}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-side">
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


        <div className="login-wrapper">
          <motion.div
            className="login-card"
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
                  fontSize: "22px",
                  fontWeight: "600",
                  color: "#0d9488",
                  letterSpacing: "0.3px",
                  marginBottom: "6px"
                }}
              >
                Welcome Back
              </h2>

              {/* <p
    style={{
      fontSize: "13px",
      color: "#6b7280",
      margin: 0
    }}
  >
    Sign in to continue to your workspace
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
              <div className="form-group">
                <label>Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  className="form-input"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <div className="password-header">
                  <label>Password <span className="required">*</span></label>
                  <span className="forgot-password" onClick={handleForgotPassword}>
                    Forgot password?
                  </span>
                </div>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <LockOpenOutlined /> : <LockOutlined />}
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
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="register-link">
                <span className="text">Don't have an account?</span>
                <span className="link" onClick={goToRegister}>
                  Create account
                </span>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default Login;