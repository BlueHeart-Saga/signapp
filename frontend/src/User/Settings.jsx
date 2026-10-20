import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaCalendarAlt,
  FaCamera,
  FaEdit,
  FaPencilAlt,
  FaSignature,
  FaStamp,
  FaUpload,
  FaDownload,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
  FaShieldAlt,
  FaCheckCircle
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { setAuthToken } from "../services/api";
import { showAlert } from "../utils/swal";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const getTimezones = () => {
  try {
    if (typeof Intl !== "undefined" && Intl.supportedValuesOf) {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch (e) {}
  return [
    "Asia/Kolkata",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Dubai",
    "Australia/Sydney",
    "UTC"
  ];
};

const evaluatePasswordStrength = (pwd) => {
  if (!pwd) {
    return {
      score: 0,
      label: "Enter password",
      color: "#94a3b8",
      checks: {
        length: false,
        hasLower: false,
        hasUpper: false,
        hasNumber: false,
        hasSpecial: false,
      },
    };
  }

  const checks = {
    length: pwd.length >= 8,
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[^A-Za-z0-9]/.test(pwd),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  let label = "Very Weak";
  let color = "#ef4444";

  if (passedCount >= 5) {
    label = "Very Strong";
    color = "#10b981";
  } else if (passedCount === 4) {
    label = "Strong";
    color = "#16a34a";
  } else if (passedCount === 3) {
    label = "Medium";
    color = "#f59e0b";
  } else if (passedCount === 2) {
    label = "Weak";
    color = "#f97316";
  }

  return { score: passedCount, label, color, checks };
};

const Settings = () => {
  const { setUser: setAuthUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const stampInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const avatarMenuRef = useRef(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    first_name: "",
    last_name: "",
    company: "",
    job_title: "",
    date_format: "DD/MM/YYYY",
    time_zone: "Asia/Kolkata",
    signature_text: "",
    initials_text: "",
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    reminder_days: 3,
    expiry_days: 30,
  });

  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [removeProfilePicFlag, setRemoveProfilePicFlag] = useState(false);
  const [stampFile, setStampFile] = useState(null);
  const [stampPreviewUrl, setStampPreviewUrl] = useState(null);
  const [removeStampFlag, setRemoveStampFlag] = useState(false);

  // Synchronize tab parameter from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      const lower = tabParam.toLowerCase();
      if (lower === "security" || lower === "password") setActiveTab("password");
      else if (lower === "schedule" || lower === "reminders") setActiveTab("schedule");
      else if (lower === "profile" || lower === "signature" || lower === "stamp") setActiveTab("profile");
    }
  }, [location.search]);

  // Close avatar dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setAvatarMenuOpen(false);
      }
    };
    if (avatarMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarMenuOpen]);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Reset Password
  const [forgotForm, setForgotForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  // Dynamic password evaluations
  const newPasswordStrength = evaluatePasswordStrength(passwordForm.newPassword);
  const forgotNewPasswordStrength = evaluatePasswordStrength(forgotForm.newPassword);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me?_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setUser(data);

      const defaultTz = data.time_zone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Kolkata") || "Asia/Kolkata";
      const resolvedName = data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim() || data.name || data.username || "";
      const resolvedCompany = data.company || data.organization_name || "";
      const sigText = data.signature_text || resolvedName || "User Signature";
      const initText = data.initials_text || (resolvedName ? resolvedName.split(" ").map(w => w.charAt(0)).join("").substring(0, 2).toUpperCase() : "US");

      const parts = resolvedName.split(" ");
      const fn = data.first_name || parts[0] || "";
      const ln = data.last_name || parts.slice(1).join(" ") || "";

      setProfileForm({
        full_name: resolvedName,
        first_name: fn,
        last_name: ln,
        company: resolvedCompany,
        job_title: data.job_title || "",
        date_format: data.date_format || "DD/MM/YYYY",
        time_zone: defaultTz,
        signature_text: sigText,
        initials_text: initText,
      });
      setScheduleForm({
        reminder_days: data.reminder_days || 3,
        expiry_days: data.expiry_days || 30,
      });

      // Parse and normalize profile picture across Google and uploaded formats
      const rawPic = data.profile_picture || data.profile_image || data.picture || data.avatar_url || data.photo_url || data.avatar;
      if (rawPic) {
        if (typeof rawPic === "string") {
          setPreviewUrl(rawPic);
          setImgError(false);
        } else if (rawPic.data) {
          setPreviewUrl(`data:${rawPic.content_type || 'image/jpeg'};base64,${rawPic.data}`);
          setImgError(false);
        } else {
          setPreviewUrl(null);
        }
      } else {
        setPreviewUrl(null);
      }

      if (data.stamp_image) {
        if (typeof data.stamp_image === "string") {
          if (data.stamp_image.startsWith("data:") || data.stamp_image.startsWith("http")) {
            setStampPreviewUrl(data.stamp_image);
          } else {
            setStampPreviewUrl(`data:image/png;base64,${data.stamp_image}`);
          }
        } else if (data.stamp_image.data) {
          setStampPreviewUrl(`data:${data.stamp_image.content_type || 'image/png'};base64,${data.stamp_image.data}`);
        } else {
          setStampPreviewUrl(null);
        }
      } else {
        setStampPreviewUrl(null);
      }

      setStampFile(null);
      setProfilePic(null);
      setRemoveStampFlag(false);

      // Pre-fill forgot email with current user email
      setForgotForm(prev => ({ ...prev, email: data.email || "" }));
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user settings");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // Client-side validation: ensure required fields are not empty
    const trimmedName = (profileForm.full_name || "").trim();
    if (!trimmedName) {
      showAlert.warning("Name Required", "Please enter your full name.");
      return;
    }

    const trimmedCompany = (profileForm.company || "").trim();
    if (!trimmedCompany) {
      showAlert.warning("Company Required", "Please enter your company or organization name.");
      return;
    }

    const trimmedJobTitle = (profileForm.job_title || "").trim();
    if (!trimmedJobTitle) {
      showAlert.warning("Job Title Required", "Please enter your professional job title.");
      return;
    }

    const trimmedSignature = (profileForm.signature_text || "").trim();
    if (!trimmedSignature) {
      showAlert.warning("Signature Name Required", "Please enter your signature name.");
      return;
    }

    const trimmedInitials = (profileForm.initials_text || "").trim();
    if (!trimmedInitials) {
      showAlert.warning("Initials Required", "Please enter your initials.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const parts = trimmedName.split(" ");
      const fn = profileForm.first_name?.trim() || parts[0] || "";
      const ln = profileForm.last_name?.trim() || parts.slice(1).join(" ") || "";

      formData.append("full_name", trimmedName);
      formData.append("first_name", fn);
      formData.append("last_name", ln);
      formData.append("company", trimmedCompany);
      formData.append("job_title", trimmedJobTitle);
      formData.append("date_format", profileForm.date_format);
      formData.append("time_zone", profileForm.time_zone);
      formData.append("reminder_days", scheduleForm.reminder_days);
      formData.append("expiry_days", scheduleForm.expiry_days);
      formData.append("signature_text", trimmedSignature);
      formData.append("initials_text", trimmedInitials);

      if (profilePic) {
        formData.append("profile_picture", profilePic);
      }
      if (removeProfilePicFlag) {
        formData.append("remove_profile_picture", "true");
      }
      if (stampFile) {
        formData.append("stamp_image", stampFile);
      }
      if (removeStampFlag) {
        formData.append("remove_stamp", "true");
      }

      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const updatedData = await response.json();
        const updatedUser = updatedData.user;

        // Safely store user without crashing on localStorage quota
        try {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (e) {
          try {
            const safeUser = { ...updatedUser };
            delete safeUser.profile_picture;
            delete safeUser.stamp_image;
            localStorage.setItem("user", JSON.stringify(safeUser));
          } catch (err) {}
        }
        setUser(updatedUser);
        if (setAuthUser) setAuthUser(updatedUser);

        // Also update recent-user in localStorage for the fast login popup
        try {
          const storedRecent = localStorage.getItem("recent-user");
          const parsed = storedRecent ? JSON.parse(storedRecent) : {};
          const safeName = updatedUser.full_name || `${updatedUser.first_name || ""} ${updatedUser.last_name || ""}`.trim() || parsed.full_name;
          parsed.full_name = safeName;
          if (updatedUser.email) parsed.email = updatedUser.email;
          localStorage.setItem("recent-user", JSON.stringify(parsed));
        } catch (e) {
          console.warn("Failed to update recent-user cache", e);
        }

        // Broadcast profile change across the portal so all navbar/dashboards update instantly
        window.dispatchEvent(new CustomEvent("user_profile_updated", { detail: updatedUser }));

        // Refresh previews from server data
        if (updatedUser.profile_picture) {
          if (typeof updatedUser.profile_picture === "string") {
            setPreviewUrl(updatedUser.profile_picture);
          } else if (updatedUser.profile_picture.data) {
            setPreviewUrl(`data:${updatedUser.profile_picture.content_type || 'image/jpeg'};base64,${updatedUser.profile_picture.data}`);
          } else {
            setPreviewUrl(null);
          }
        } else {
          setPreviewUrl(null);
        }

        if (updatedUser.stamp_image) {
          if (typeof updatedUser.stamp_image === "string") {
            if (updatedUser.stamp_image.startsWith("data:") || updatedUser.stamp_image.startsWith("http")) {
              setStampPreviewUrl(updatedUser.stamp_image);
            } else {
              setStampPreviewUrl(`data:image/png;base64,${updatedUser.stamp_image}`);
            }
          } else if (updatedUser.stamp_image.data) {
            setStampPreviewUrl(`data:${updatedUser.stamp_image.content_type || 'image/png'};base64,${updatedUser.stamp_image.data}`);
          } else {
            setStampPreviewUrl(null);
          }
        } else {
          setStampPreviewUrl(null);
        }

        setStampFile(null); // Clear local file state
        setProfilePic(null);
        setRemoveStampFlag(false);
        setRemoveProfilePicFlag(false);

        showAlert.toast("success", "Profile updated successfully");
      } else {
        const errJson = await response.json().catch(() => ({}));
        showAlert.error("Profile Update Failed", errJson.detail || "Failed to update profile settings.");
      }
    } catch (error) {
      showAlert.error("Network Error", "An error occurred while updating profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    const confirmResult = await showAlert.confirm(
      "Remove Profile Picture?",
      "Are you sure you want to remove your profile picture? Your profile avatar will revert to your name initials.",
      "Yes, Remove",
      "Keep Picture"
    );

    if (!confirmResult.isConfirmed) return;

    const hasServerPic = Boolean(
      user?.profile_picture || user?.profile_image || user?.picture || user?.avatar_url || user?.photo_url || user?.avatar
    );

    // If user only selected an unsaved local file without previous server image
    if (profilePic && !hasServerPic) {
      setProfilePic(null);
      setPreviewUrl(null);
      setImgError(false);
      setRemoveProfilePicFlag(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      showAlert.toast("info", "Selected photo removed");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/auth/remove-profile-picture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        const updatedUser = data.user || {
          ...user,
          profile_picture: null,
          profile_image: null,
          picture: null,
          avatar_url: null,
          photo_url: null,
          avatar: null,
        };

        setUser(updatedUser);
        setProfilePic(null);
        setPreviewUrl(null);
        setImgError(false);
        setRemoveProfilePicFlag(false);
        if (avatarInputRef.current) avatarInputRef.current.value = "";

        if (setAuthUser) setAuthUser(updatedUser);

        try {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (e) {}

        // Broadcast profile change across navbar and dashboards
        window.dispatchEvent(new CustomEvent("user_profile_updated", { detail: updatedUser }));
        showAlert.toast("success", "Profile picture removed successfully");
      } else {
        showAlert.error("Removal Failed", data.detail || "Unable to remove profile picture");
      }
    } catch (err) {
      console.error("Error removing profile picture:", err);
      showAlert.error("Removal Error", "An error occurred while removing your profile picture");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const currPw = (passwordForm.currentPassword || "").trim();
    const newPw = (passwordForm.newPassword || "").trim();
    const confirmPw = (passwordForm.confirmPassword || "").trim();

    if (!currPw) {
      showAlert.warning("Current Password Required", "Please enter your current password to proceed.");
      return;
    }
    if (!newPw) {
      showAlert.warning("New Password Required", "Please enter your new password.");
      return;
    }
    if (newPw.length < 8) {
      showAlert.warning(
        "Password Too Short",
        "Your new password must be at least 8 characters long for strong account security."
      );
      return;
    }
    if (!/[A-Za-z]/.test(newPw) || !/[0-9]/.test(newPw)) {
      showAlert.warning(
        "Password Complexity",
        "Your new password must contain a combination of letters and numbers."
      );
      return;
    }
    if (currPw === newPw) {
      showAlert.warning(
        "Same Password",
        "Your new password cannot be the same as your current password. Please choose a different password."
      );
      return;
    }
    if (newPw !== confirmPw) {
      showAlert.warning(
        "Passwords Do Not Match",
        "New password and confirm password do not match. Please verify both fields."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          current_password: currPw,
          new_password: newPw,
        }),
      });

      const resData = await response.json();

      if (response.ok) {
        await showAlert.success(
          "Password Changed Successfully!",
          "Your account security credentials have been updated. You can now use your new password for future logins."
        );
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

        if (resData.access_token) {
          localStorage.setItem("token", resData.access_token);
          setAuthToken(resData.access_token);
          try {
            const storedRecent = localStorage.getItem("recent-user");
            if (storedRecent) {
              const parsed = JSON.parse(storedRecent);
              parsed.remembered_token = resData.access_token;
              localStorage.setItem("recent-user", JSON.stringify(parsed));
            }
          } catch (e) {}
        }
      } else {
        showAlert.error(
          "Password Change Failed",
          resData.detail || "Current password is incorrect or password update failed. Please try again."
        );
      }
    } catch (error) {
      showAlert.error("Network Error", "An error occurred while changing password. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestForgotOTP = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const email = (forgotForm.email || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      showAlert.warning("Email Address Required", "Please enter your registered account email address.");
      return;
    }
    if (!emailRegex.test(email)) {
      showAlert.warning("Invalid Email Format", "Please enter a valid email address (e.g. name@company.com).");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlert.success(
          "Verification Code Sent!",
          `A 6-digit verification code has been dispatched to ${email}. Please check your inbox and spam folder.`
        );
        setForgotStep(2);
        setResendCooldown(45);
      } else {
        showAlert.error(
          "Failed to Send OTP",
          data.detail || "Unable to send verification code. Please check that your email is registered."
        );
      }
    } catch (error) {
      showAlert.error("Network Error", "An error occurred while sending OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotOTP = async (e) => {
    e.preventDefault();
    const email = (forgotForm.email || "").trim();
    const otp = (forgotForm.otp || "").trim().replace(/\s+/g, "");

    if (!otp) {
      showAlert.warning("Verification Code Required", "Please enter the 6-digit verification code sent to your email.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      showAlert.warning("Invalid Code Format", "Verification code must be exactly 6 numeric digits.");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          otp: otp,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlert.toast("success", "OTP verified! Please create your new password.");
        setForgotStep(3);
      } else {
        showAlert.error(
          "Invalid Verification Code",
          data.detail || "The verification code is invalid or has expired. Please check and try again."
        );
      }
    } catch (error) {
      showAlert.error("Verification Error", "An error occurred while verifying OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const newPw = (forgotForm.newPassword || "").trim();
    const confirmPw = (forgotForm.confirmPassword || "").trim();

    if (!newPw) {
      showAlert.warning("New Password Required", "Please enter your new password.");
      return;
    }
    if (newPw.length < 8) {
      showAlert.warning(
        "Password Too Short",
        "Password must be at least 8 characters long for strong account security."
      );
      return;
    }
    if (!/[A-Za-z]/.test(newPw) || !/[0-9]/.test(newPw)) {
      showAlert.warning(
        "Password Complexity",
        "Password must contain a combination of letters and numbers."
      );
      return;
    }
    if (newPw !== confirmPw) {
      showAlert.warning(
        "Passwords Do Not Match",
        "New password and confirm password fields must match exactly."
      );
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotForm.email,
          otp: forgotForm.otp,
          new_password: newPw,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        await showAlert.success(
          "Password Reset Successful!",
          "Your password has been reset securely. You can now use your new password."
        );
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotForm({ email: user?.email || "", otp: "", newPassword: "", confirmPassword: "" });
      } else {
        showAlert.error(
          "Password Reset Failed",
          data.detail || "Failed to reset password. The session may have expired. Please request a new code."
        );
      }
    } catch (error) {
      showAlert.error("Reset Error", "An error occurred while resetting password. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showAlert.warning("Invalid File Format", "Please select a valid image file (PNG, JPG, JPEG, WEBP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showAlert.warning("File Too Large", "Profile picture must be under 5MB in size.");
        return;
      }
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImgError(false);
      setRemoveProfilePicFlag(false);
      showAlert.toast("success", "Photo selected! Click 'Update' at the bottom to save changes.");
    }
  };

  const handleStampChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }
      setStampFile(file);
      setStampPreviewUrl(URL.createObjectURL(file));
      setRemoveStampFlag(false);
    }
  };

  const handleDownloadStamp = () => {
    if (!stampPreviewUrl) {
      toast.error("No custom stamp image available to download");
      return;
    }
    try {
      const link = document.createElement("a");
      const safeName = (profileForm.full_name || "esigniva").trim().replace(/\s+/g, "_").toLowerCase();
      link.download = `${safeName}-stamp.png`;
      link.href = stampPreviewUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Stamp image downloaded successfully");
    } catch (err) {
      console.error("Failed to download stamp:", err);
      toast.error("Failed to download stamp image");
    }
  };

  const handleRemoveStamp = () => {
    setStampFile(null);
    setStampPreviewUrl(null);
    setRemoveStampFlag(true);
    if (stampInputRef.current) {
      stampInputRef.current.value = "";
    }
    toast.success("Stamp removed. Click Update to save changes.");
  };

  const getSignatureText = () => {
    const fn = profileForm.first_name || "";
    const ln = profileForm.last_name || "";
    return `${fn} ${ln}`.trim() || "User Signature";
  };

  const getInitialText = () => {
    const fn = profileForm.first_name?.charAt(0) || "";
    const ln = profileForm.last_name?.charAt(0) || "";
    return `${fn}${ln}`.toUpperCase() || "US";
  };

  const DefaultStamp = () => (
    <div className="default-stamp">
      <div className="stamp-inner-circle">
        <span className="stamp-user-name">{user?.full_name || "User Name"}</span>
        <span className="stamp-current-date">{new Date().toLocaleDateString('en-GB')}</span>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="settings-profile-content">
            <div className="profile-top-info">
              <div className="avatar-section">
                {previewUrl && !imgError ? (
                  <img
                    src={previewUrl}
                    alt="Profile"
                    className="profile-img-large"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    onClick={() => setAvatarMenuOpen((prev) => !prev)}
                    title="Click to change or remove profile photo"
                  />
                ) : (
                  <div
                    className="profile-placeholder-large"
                    onClick={() => avatarInputRef.current?.click()}
                    title="Click to upload profile photo"
                  >
                    {(user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}
                  </div>
                )}

                {/* Right corner small pencil edit icon button with action dropdown */}
                <div className="avatar-pencil-dropdown-wrapper" ref={avatarMenuRef}>
                  <button
                    type="button"
                    className="avatar-pencil-badge"
                    onClick={() => setAvatarMenuOpen((prev) => !prev)}
                    title="Edit profile photo"
                    aria-label="Edit Profile Photo"
                  >
                    <FaPencilAlt size={12} />
                  </button>

                  {avatarMenuOpen && (
                    <div className="avatar-action-menu">
                      <button
                        type="button"
                        className="avatar-menu-item"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          avatarInputRef.current?.click();
                        }}
                      >
                        <FaCamera size={13} style={{ color: "#0f766e" }} />
                        <span>Upload photo</span>
                      </button>

                      {(previewUrl || profilePic) && (
                        <button
                          type="button"
                          className="avatar-menu-item danger"
                          onClick={() => {
                            setAvatarMenuOpen(false);
                            handleRemoveProfilePic();
                          }}
                        >
                          <FaTrash size={12} style={{ color: "#ef4444" }} />
                          <span>Remove photo</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <input
                  ref={avatarInputRef}
                  id="avatar-upload"
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                />
              </div>
              <div className="profile-identity-text">
                <h2>{user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User"}</h2>
                <p>{user?.email || "user@example.com"}</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="profile-form-layout">
              {/* Signature Row */}
              <div className="form-row">
                <label className="row-label">Signature and initial</label>
                <div className="row-input signature-container">
                  <div className="signature-preview-row">
                    <div className="signature-preview-box handwriting">
                      {profileForm.signature_text || getSignatureText()}
                    </div>
                    <div className="initial-preview-box handwriting">
                      {profileForm.initials_text || getInitialText()}
                    </div>
                  </div>
                  <div className="signature-inputs-row">
                    <div className="signature-name-field">
                      <label>Signature Name</label>
                      <input
                        type="text"
                        value={profileForm.signature_text}
                        placeholder={getSignatureText()}
                        onChange={(e) => setProfileForm({ ...profileForm, signature_text: e.target.value })}
                        className="styled-input"
                      />
                    </div>
                    <div className="initials-field">
                      <label>Initials</label>
                      <input
                        type="text"
                        value={profileForm.initials_text}
                        placeholder={getInitialText()}
                        onChange={(e) => setProfileForm({ ...profileForm, initials_text: e.target.value })}
                        className="styled-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stamp Row */}
              <div className="form-row">
                <label className="row-label">Stamp</label>
                <div className="row-input stamp-container">
                  <div className="stamp-preview-box">
                    {stampPreviewUrl ? (
                      <img src={stampPreviewUrl} alt="Stamp" className="stamp-preview-img" />
                    ) : (
                      <DefaultStamp />
                    )}
                  </div>
                  <div className="stamp-buttons-wrapper">
                    <button
                      type="button"
                      className="stamp-upload-btn"
                      onClick={() => stampInputRef.current.click()}
                    >
                      <FaUpload /> Upload Stamp
                    </button>

                    {/* Download option ONLY available for custom uploaded stamps, avoiding default stamp/initials */}
                    {stampPreviewUrl && (
                      <button
                        type="button"
                        className="stamp-download-btn"
                        onClick={handleDownloadStamp}
                        title="Download custom stamp image"
                      >
                        <FaDownload /> Download Stamp
                      </button>
                    )}

                    {stampPreviewUrl && (
                      <button
                        type="button"
                        className="stamp-remove-btn"
                        onClick={handleRemoveStamp}
                        title="Revert to default stamp"
                      >
                        <FaTrash /> Remove
                      </button>
                    )}

                    <span className="stamp-hint-text">
                      PNG or JPG with transparent background (Max 5MB)
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={stampInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleStampChange}
                  />
                </div>
              </div>

              {/* Name Row (Consolidated single field) */}
              <div className="form-row">
                <label className="row-label">Name</label>
                <div className="row-input">
                  <input
                    type="text"
                    value={profileForm.full_name}
                    placeholder="Enter your name"
                    required
                    onChange={(e) => {
                      const val = e.target.value;
                      const parts = val.trim().split(" ");
                      const fn = parts[0] || "";
                      const ln = parts.slice(1).join(" ") || "";
                      const sigText = val.trim() || "User Signature";
                      const initText = `${fn.charAt(0)}${ln.charAt(0) || fn.charAt(1) || ""}`.toUpperCase() || "US";
                      setProfileForm(prev => ({
                        ...prev,
                        full_name: val,
                        first_name: fn,
                        last_name: ln,
                        signature_text: prev.signature_text ? prev.signature_text : sigText,
                        initials_text: prev.initials_text ? prev.initials_text : initText
                      }));
                    }}
                    className="styled-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <label className="row-label">Company</label>
                <div className="row-input">
                  <input
                    type="text"
                    value={profileForm.company}
                    onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                    className="styled-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <label className="row-label">Job title</label>
                <div className="row-input">
                  <input
                    type="text"
                    value={profileForm.job_title}
                    onChange={(e) => setProfileForm({ ...profileForm, job_title: e.target.value })}
                    className="styled-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <label className="row-label">Date format</label>
                <div className="row-input">
                  <select
                    value={profileForm.date_format}
                    onChange={(e) => setProfileForm({ ...profileForm, date_format: e.target.value })}
                    className="styled-select"
                  >
                    <option value="MMM dd yyyy HH:mm z">MMM dd yyyy HH:mm z</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <label className="row-label">Time zone</label>
                <div className="row-input" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={profileForm.time_zone}
                    onChange={(e) => setProfileForm({ ...profileForm, time_zone: e.target.value })}
                    className="styled-select"
                    style={{ flex: 1, minWidth: '200px' }}
                  >
                    {getTimezones().map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        if (detected) {
                          setProfileForm(prev => ({ ...prev, time_zone: detected }));
                          toast.success(`Detected timezone: ${detected}`);
                        }
                      } catch (err) {
                        toast.error("Could not auto-detect timezone");
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#0f766e',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Auto-Detect
                  </button>
                </div>
              </div>

              <div className="form-actions-footer">
                <button type="submit" className="update-btn" disabled={loading}>
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        );
      case "password":
        return (
          <div className="settings-profile-content">
            <div className="section-title-wrap">
              <h3 className="tab-header-title">Reset Password</h3>
              <p className="tab-header-desc">
                Update your login credentials to protect and keep your Esigniva account secure.
              </p>
            </div>
            <form onSubmit={handlePasswordChange} className="profile-form-layout narrow-form">
              <div className="form-row">
                <label className="row-label">Current Password</label>
                <div className="row-input" style={{ position: "relative" }}>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="styled-input"
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="password-eye-btn"
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label className="row-label">New Password</label>
                <div className="row-input" style={{ position: "relative", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ position: "relative", width: "100%", maxWidth: "480px" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="styled-input"
                      placeholder="At least 8 characters (letters & numbers)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="password-eye-btn"
                      title={showNewPassword ? "Hide password" : "Show password"}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {/* Real-time Password Strength Meter & Checklist */}
                  {passwordForm.newPassword && (
                    <div className="password-strength-container">
                      <div className="strength-header-text">
                        <span>Password Strength:</span>
                        <span className="strength-label" style={{ color: newPasswordStrength.color }}>
                          {newPasswordStrength.label}
                        </span>
                      </div>
                      <div className="strength-bars-row">
                        {[1, 2, 3, 4, 5].map((seg) => (
                          <div
                            key={seg}
                            className="strength-bar-segment"
                            style={{
                              backgroundColor:
                                seg <= newPasswordStrength.score ? newPasswordStrength.color : "#e2e8f0",
                            }}
                          />
                        ))}
                      </div>
                      <div className="password-rules-row">
                        <span className={`rule-chip ${newPasswordStrength.checks.length ? "valid" : ""}`}>
                          {newPasswordStrength.checks.length ? <FaCheck size={10} /> : <FaTimes size={10} />} 8+ chars
                        </span>
                        <span className={`rule-chip ${newPasswordStrength.checks.hasUpper ? "valid" : ""}`}>
                          {newPasswordStrength.checks.hasUpper ? <FaCheck size={10} /> : <FaTimes size={10} />} Uppercase
                        </span>
                        <span className={`rule-chip ${newPasswordStrength.checks.hasLower ? "valid" : ""}`}>
                          {newPasswordStrength.checks.hasLower ? <FaCheck size={10} /> : <FaTimes size={10} />} Lowercase
                        </span>
                        <span className={`rule-chip ${newPasswordStrength.checks.hasNumber ? "valid" : ""}`}>
                          {newPasswordStrength.checks.hasNumber ? <FaCheck size={10} /> : <FaTimes size={10} />} Number
                        </span>
                        <span className={`rule-chip ${newPasswordStrength.checks.hasSpecial ? "valid" : ""}`}>
                          {newPasswordStrength.checks.hasSpecial ? <FaCheck size={10} /> : <FaTimes size={10} />} Symbol
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <label className="row-label">Confirm Password</label>
                <div className="row-input" style={{ position: "relative", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ position: "relative", width: "100%", maxWidth: "480px" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="styled-input"
                      placeholder="Re-enter your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-eye-btn"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {passwordForm.confirmPassword && (
                    <div
                      className={`password-match-badge ${
                        passwordForm.newPassword === passwordForm.confirmPassword ? "match" : "mismatch"
                      }`}
                    >
                      {passwordForm.newPassword === passwordForm.confirmPassword ? (
                        <>
                          <FaCheck size={11} /> Passwords match
                        </>
                      ) : (
                        <>
                          <FaTimes size={11} /> Passwords do not match
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions-footer password-actions">
                <button type="submit" className="update-btn" disabled={loading}>
                  {loading ? "Updating Password..." : "Change Password"}
                </button>
                <button
                  type="button"
                  className="forgot-link-btn"
                  onClick={() => {
                    setForgotForm((prev) => ({
                      ...prev,
                      email: user?.email || prev.email,
                      otp: "",
                      newPassword: "",
                      confirmPassword: "",
                    }));
                    setForgotStep(1);
                    setShowForgotModal(true);
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        );
      case "schedule":
        return (
          <div className="settings-profile-content">
            <h3 className="tab-header-title">Schedule Settings</h3>
            <form onSubmit={handleProfileUpdate} className="profile-form-layout narrow-form">
              <div className="form-row">
                <label className="row-label">Reminder Days</label>
                <div className="row-input">
                  <input
                    type="number"
                    min="1"
                    value={scheduleForm.reminder_days}
                    onChange={(e) => setScheduleForm({
                      ...scheduleForm,
                      reminder_days: Math.max(1, parseInt(e.target.value) || 1)
                    })}
                    className="styled-input mini"
                  />
                  <span className="input-hint-text">days</span>
                </div>
              </div>

              <div className="form-row">
                <label className="row-label">Expiry Days</label>
                <div className="row-input">
                  <input
                    type="number"
                    min="1"
                    value={scheduleForm.expiry_days}
                    onChange={(e) => setScheduleForm({
                      ...scheduleForm,
                      expiry_days: Math.max(1, parseInt(e.target.value) || 1)
                    })}
                    className="styled-input mini"
                  />
                  <span className="input-hint-text">days</span>
                </div>
              </div>

              <div className="form-actions-footer">
                <button type="submit" className="update-btn" disabled={loading}>
                  {loading ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="settings-layout">
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />

      <div className="settings-header">
        <h1 className="settings-title">Profile</h1>
      </div>

      <div className="settings-body">
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            <button
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <span>My profile</span>
            </button>
            <button
              className={`nav-item ${activeTab === "password" ? "active" : ""}`}
              onClick={() => setActiveTab("password")}
            >
              <span>Reset password</span>
            </button>
            <button
              className={`nav-item ${activeTab === "schedule" ? "active" : ""}`}
              onClick={() => setActiveTab("schedule")}
            >
              <span>Schedule</span>
            </button>
          </nav>
        </aside>

        <main className="settings-main">
          {renderTabContent()}
        </main>
      </div>

      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="modal-header-icon">
                  <FaShieldAlt style={{ color: "#0f766e", fontSize: "18px" }} />
                </div>
                <div>
                  <h3>Reset Your Password</h3>
                  <span className="modal-subtitle">Secure Account Recovery</span>
                </div>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep(1);
                }}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="step-indicator">
                <div className={`step-dot ${forgotStep >= 1 ? "active" : ""}`}>
                  {forgotStep > 1 ? <FaCheck size={11} /> : "1"}
                </div>
                <div className={`step-line ${forgotStep >= 2 ? "active" : ""}`}></div>
                <div className={`step-dot ${forgotStep >= 2 ? "active" : ""}`}>
                  {forgotStep > 2 ? <FaCheck size={11} /> : "2"}
                </div>
                <div className={`step-line ${forgotStep >= 3 ? "active" : ""}`}></div>
                <div className={`step-dot ${forgotStep >= 3 ? "active" : ""}`}>3</div>
              </div>

              {forgotStep === 1 && (
                <form onSubmit={handleRequestForgotOTP} className="forgot-step-form">
                  <p className="step-desc">
                    Enter your registered email address and we'll send a 6-digit verification code to reset your password.
                  </p>
                  <div className="modal-field-group">
                    <label className="modal-field-label">Email Address</label>
                    <input
                      type="email"
                      value={forgotForm.email}
                      onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                      className="styled-input full-width"
                      placeholder="e.g. yourname@example.com"
                      required
                    />
                  </div>
                  <button type="submit" className="modal-submit-btn" disabled={forgotLoading}>
                    {forgotLoading ? "Sending Verification Code..." : "Send Verification Code"}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyForgotOTP} className="forgot-step-form">
                  <p className="step-desc">
                    We've sent a 6-digit verification code to <strong>{forgotForm.email}</strong>. Enter it below to continue.
                  </p>
                  <div className="modal-field-group">
                    <label className="modal-field-label">Verification Code (OTP)</label>
                    <input
                      type="text"
                      value={forgotForm.otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setForgotForm({ ...forgotForm, otp: val });
                      }}
                      className="styled-input full-width center-text"
                      placeholder="0 0 0 0 0 0"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="resend-row">
                    <span style={{ color: "#64748b", fontSize: "13px" }}>Didn't receive the code?</span>
                    <button
                      type="button"
                      className="resend-btn"
                      disabled={resendCooldown > 0 || forgotLoading}
                      onClick={handleRequestForgotOTP}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                    </button>
                  </div>

                  <div className="modal-row-actions">
                    <button
                      type="button"
                      className="modal-back-btn"
                      onClick={() => setForgotStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="modal-submit-btn"
                      disabled={forgotLoading || forgotForm.otp.length !== 6}
                    >
                      {forgotLoading ? "Verifying..." : "Verify Code"}
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="forgot-step-form">
                  <p className="step-desc">Create a new secure password for your Esigniva account.</p>

                  <div className="modal-field-group">
                    <label className="modal-field-label">New Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showForgotNewPassword ? "text" : "password"}
                        value={forgotForm.newPassword}
                        onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                        className="styled-input full-width"
                        placeholder="Minimum 8 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="password-eye-btn"
                        title={showForgotNewPassword ? "Hide password" : "Show password"}
                        aria-label={showForgotNewPassword ? "Hide password" : "Show password"}
                      >
                        {showForgotNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    {forgotForm.newPassword && (
                      <div className="password-strength-container" style={{ maxWidth: "100%" }}>
                        <div className="strength-header-text">
                          <span>Password Strength:</span>
                          <span className="strength-label" style={{ color: forgotNewPasswordStrength.color }}>
                            {forgotNewPasswordStrength.label}
                          </span>
                        </div>
                        <div className="strength-bars-row">
                          {[1, 2, 3, 4, 5].map((seg) => (
                            <div
                              key={seg}
                              className="strength-bar-segment"
                              style={{
                                backgroundColor:
                                  seg <= forgotNewPasswordStrength.score ? forgotNewPasswordStrength.color : "#e2e8f0",
                              }}
                            />
                          ))}
                        </div>
                        <div className="password-rules-row">
                          <span className={`rule-chip ${forgotNewPasswordStrength.checks.length ? "valid" : ""}`}>
                            {forgotNewPasswordStrength.checks.length ? <FaCheck size={10} /> : <FaTimes size={10} />} 8+ chars
                          </span>
                          <span className={`rule-chip ${forgotNewPasswordStrength.checks.hasUpper ? "valid" : ""}`}>
                            {forgotNewPasswordStrength.checks.hasUpper ? <FaCheck size={10} /> : <FaTimes size={10} />} Uppercase
                          </span>
                          <span className={`rule-chip ${forgotNewPasswordStrength.checks.hasLower ? "valid" : ""}`}>
                            {forgotNewPasswordStrength.checks.hasLower ? <FaCheck size={10} /> : <FaTimes size={10} />} Lowercase
                          </span>
                          <span className={`rule-chip ${forgotNewPasswordStrength.checks.hasNumber ? "valid" : ""}`}>
                            {forgotNewPasswordStrength.checks.hasNumber ? <FaCheck size={10} /> : <FaTimes size={10} />} Number
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="modal-field-group">
                    <label className="modal-field-label">Confirm Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showForgotConfirmPassword ? "text" : "password"}
                        value={forgotForm.confirmPassword}
                        onChange={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })}
                        className="styled-input full-width"
                        placeholder="Re-enter your new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        className="password-eye-btn"
                        title={showForgotConfirmPassword ? "Hide password" : "Show password"}
                        aria-label={showForgotConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showForgotConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    {forgotForm.confirmPassword && (
                      <div
                        className={`password-match-badge ${
                          forgotForm.newPassword === forgotForm.confirmPassword ? "match" : "mismatch"
                        }`}
                      >
                        {forgotForm.newPassword === forgotForm.confirmPassword ? (
                          <>
                            <FaCheck size={11} /> Passwords match
                          </>
                        ) : (
                          <>
                            <FaTimes size={11} /> Passwords do not match
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="modal-submit-btn" disabled={forgotLoading}>
                    {forgotLoading ? "Resetting Password..." : "Set New Password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .settings-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: white;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #333;
          overflow: hidden;
        }

        .settings-header {
          padding: 15px 30px;
          border-bottom: 2px solid #f0f0f0;
          background: white;
          flex-shrink: 0;
        }

        .settings-title {
          font-size: 24px;
          font-weight: 400;
          margin: 0;
          color: #1a1a1a;
        }

        .settings-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* Sidebar Styles */
        .settings-sidebar {
          width: 220px;
          background: #eef0f2;
          flex-shrink: 0;
          height: 100%;
          border-right: 1px solid #f0f0f0;
        }

        .settings-nav {
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        .nav-item {
          text-align: left;
          padding: 18px 25px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: #e2e4e6;
        }

        .nav-item.active {
          color: #0f766e;
          font-weight: 600;
          background: #ffffff;
        }

        /* Main Content Styles */
        .settings-main {
          flex: 1;
          background: white;
          overflow-y: auto;
          padding: 40px 60px;
        }

        .settings-profile-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .profile-top-info {
          display: flex;
          align-items: center;
          gap: 25px;
          margin-bottom: 40px;
        }

        .avatar-section {
          position: relative;
          width: 86px;
          height: 86px;
          flex-shrink: 0;
        }

        .profile-img-large {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e2e8f0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .profile-img-large:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
        }

        .profile-placeholder-large {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(15, 118, 110, 0.25);
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .profile-placeholder-large:hover {
          transform: scale(1.02);
        }

        .avatar-pencil-dropdown-wrapper {
          position: absolute;
          bottom: -2px;
          right: -2px;
          z-index: 10;
        }

        .avatar-pencil-badge {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #0f766e;
          color: #ffffff;
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
        }

        .avatar-pencil-badge:hover {
          background: #0d6d66;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.4);
        }

        .avatar-action-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: -40px;
          min-width: 165px;
          background: #ffffff;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          padding: 6px;
          z-index: 100;
          animation: menuFadeIn 0.15s ease-out;
        }

        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .avatar-menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
        }

        .avatar-menu-item:hover {
          background: #f1f5f9;
        }

        .avatar-menu-item.danger {
          color: #ef4444;
        }

        .avatar-menu-item.danger:hover {
          background: #fef2f2;
        }

        .profile-identity-text h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 500;
        }

        .profile-identity-text p {
          margin: 5px 0 0;
          color: #666;
          font-size: 14px;
        }

        /* Form Layout Table-like */
        .profile-form-layout {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .form-row {
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }

        .row-label {
          width: 180px;
          font-size: 14px;
          color: #666;
          flex-shrink: 0;
          padding-top: 10px;
        }

        .row-input {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .styled-input, .styled-select {
          width: 100%;
          max-width: 480px;
          box-sizing: border-box;
          padding: 10px 14px;
          border: 1px solid #dcdde1;
          border-radius: 6px;
          background: #f8fafc;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
        }

        .styled-input:focus, .styled-select:focus {
          border-color: #0f766e;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
        }

        .disabled-like {
          cursor: default;
          background: #f1f5f9;
        }

        .mini {
          width: 100px !important;
        }

        .input-hint-text {
          font-size: 14px;
          color: #64748b;
        }

        /* Signature and Stamp Previews */
        .signature-container, .stamp-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 480px;
          box-sizing: border-box;
        }

        .signature-preview-row, .signature-inputs-row {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          width: 100%;
          box-sizing: border-box;
        }

        .signature-preview-box {
          flex: 1;
          min-width: 0;
          height: 84px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          white-space: nowrap;
          overflow: hidden;
          background: #fff;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .initial-preview-box {
          width: 86px;
          height: 84px;
          flex-shrink: 0;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          background: #fff;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .signature-name-field {
          flex: 1;
          min-width: 0;
        }

        .signature-name-field label, .initials-field label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 5px;
          display: block;
        }

        .signature-name-field .styled-input {
          max-width: 100%;
        }

        .initials-field {
          width: 86px;
          flex-shrink: 0;
        }

        .initials-field label {
          text-align: center;
        }

        .initials-field .styled-input {
          max-width: 100%;
          text-align: center;
        }

        .handwriting {
          font-family: 'Great Vibes', cursive;
          color: #1e293b;
        }

        .stamp-preview-box {
          width: 100%;
          max-width: 480px;
          height: 120px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .stamp-preview-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .stamp-upload-btn {
          padding: 10px 18px;
          border: 1px solid #0f766e;
          border-radius: 6px;
          background: #fff;
          color: #0f766e;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .stamp-upload-btn:hover {
          background: #0f766e0a;
        }

        .stamp-buttons-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 480px;
          flex-wrap: wrap;
          box-sizing: border-box;
        }

        .stamp-hint-text {
          font-size: 12px;
          color: #64748b;
          margin-left: auto;
        }

        .stamp-download-btn {
          padding: 10px 18px;
          border: 1px solid #0284c7;
          border-radius: 6px;
          background: #f0f9ff;
          color: #0284c7;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .stamp-download-btn:hover {
          background: #e0f2fe;
          color: #0369a1;
          border-color: #0369a1;
        }

        .stamp-remove-btn {
          padding: 10px 16px;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          background: #fff;
          color: #ef4444;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .stamp-remove-btn:hover {
          background: #fef2f2;
          color: #dc2626;
          border-color: #ef4444;
        }

        /* Default Stamp UI */
        .default-stamp {
          width: 110px;
          height: 110px;
          border: 2px solid #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          opacity: 0.8;
          transform: rotate(-15deg);
        }

        .stamp-inner-circle {
          width: 100%;
          height: 100%;
          border: 1px solid #ef4444;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .stamp-user-name {
          font-size: 11px;
          font-weight: 700;
          color: #ef4444;
          text-transform: uppercase;
          line-height: 1.1;
          max-width: 80px;
          margin-bottom: 2px;
        }

        .stamp-current-date {
          font-size: 9px;
          font-weight: 500;
          color: #ef4444;
        }

        .form-actions-footer {
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #f1f5f9;
        }

        .password-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .forgot-link-btn {
          background: none;
          border: none;
          color: #0f766e;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
        }

        .forgot-link-btn:hover {
          text-decoration: underline;
        }

        .update-btn {
          padding: 12px 40px;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .update-btn:hover {
          background: #0d6d66;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);
        }

        .update-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          box-shadow: none;
        }

        .tab-header-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 25px;
          color: #1e293b;
        }

        .narrow-form {
          max-width: 650px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
          padding: 20px;
        }

        .forgot-modal {
          background: white;
          width: 100%;
          max-width: 480px;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .close-modal-btn {
          background: #f1f5f9;
          border: none;
          font-size: 20px;
          color: #64748b;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-modal-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-header-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #0f766e15;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-subtitle {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
          font-weight: 400;
        }

        .modal-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .modal-field-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          gap: 8px;
        }

        .step-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 13px;
          border: 1px solid #e2e8f0;
          transition: all 0.25s ease;
        }

        .step-dot.active {
          background: #0f766e;
          color: #ffffff;
          border-color: #0f766e;
          box-shadow: 0 2px 8px rgba(15, 118, 110, 0.28);
        }

        .step-line {
          width: 44px;
          height: 3px;
          background: #e2e8f0;
          transition: background 0.25s ease;
          border-radius: 2px;
        }

        .step-line.active {
          background: #0f766e;
        }

        .forgot-step-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .step-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        .full-width {
          width: 100% !important;
          max-width: none !important;
        }

        .center-text {
          text-align: center;
          letter-spacing: 8px;
          font-size: 20px !important;
          font-weight: 700;
          color: #0f766e !important;
        }

        .modal-submit-btn {
          padding: 12px 20px;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .modal-submit-btn:hover {
          background: #0d6d66;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);
        }

        .modal-submit-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          box-shadow: none;
        }

        .modal-row-actions {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }

        .modal-back-btn {
          padding: 12px 20px;
          background: #f8fafc;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-back-btn:hover {
          background: #e2e8f0;
        }

        .resend-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: -6px;
        }

        .resend-btn {
          background: none;
          border: none;
          color: #0f766e;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          font-size: 13px;
          text-decoration: underline;
        }

        .resend-btn:disabled {
          color: #94a3b8;
          cursor: not-allowed;
          text-decoration: none;
        }

        .section-title-wrap {
          margin-bottom: 25px;
        }

        .section-title-wrap .tab-header-title {
          margin-bottom: 4px;
        }

        .tab-header-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .password-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.15s ease;
        }

        .password-eye-btn:hover {
          color: #0f766e;
        }

        .password-strength-container {
          width: 100%;
          max-width: 480px;
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .strength-header-text {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
        }

        .strength-label {
          font-weight: 600;
        }

        .strength-bars-row {
          display: flex;
          gap: 4px;
          height: 4px;
          width: 100%;
        }

        .strength-bar-segment {
          flex: 1;
          height: 100%;
          border-radius: 2px;
          transition: background-color 0.25s ease;
        }

        .password-rules-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
          margin-top: 4px;
        }

        .rule-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #94a3b8;
          transition: color 0.2s ease;
        }

        .rule-chip.valid {
          color: #10b981;
          font-weight: 600;
        }

        .password-match-badge {
          font-size: 12px;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }

        .password-match-badge.match {
          color: #10b981;
        }

        .password-match-badge.mismatch {
          color: #ef4444;
        }
        @media (max-width: 900px) {
          .settings-main {
            padding: 30px;
          }
          .row-label {
            width: 140px;
          }
        }

        @media (max-width: 768px) {
          .settings-layout {
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }
          
          .settings-body {
            flex-direction: column;
            overflow: visible;
          }
          
          .settings-sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #f1f5f9;
            background: #fff;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .settings-nav {
            flex-direction: row;
            overflow-x: auto;
            padding: 0 10px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .settings-nav::-webkit-scrollbar {
            display: none;
          }
          
          .nav-item {
            padding: 15px 20px;
            flex-shrink: 0;
            border-bottom: 2px solid transparent;
            font-size: 13px;
          }
          
          .nav-item.active {
            background: transparent;
            border-bottom-color: #0f766e;
          }
          
          .settings-main {
            padding: 24px 20px;
            overflow: visible;
          }
          
          .form-row {
            flex-direction: column;
            gap: 8px;
          }
          
          .row-label {
            width: 100%;
            padding-top: 0;
            font-weight: 600;
            color: #1e293b;
          }
          
          .row-input {
            width: 100%;
          }
          
          .signature-preview-box, .stamp-preview-box, .styled-input, .styled-select {
            max-width: none;
          }
          
          .signature-container, .stamp-container {
            flex-direction: column;
            align-items: stretch;
          }
          
          .initial-preview-box {
            width: 100%;
          }

          .profile-top-info {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }

          .update-btn {
            width: 100%;
          }

          .password-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .forgot-link-btn {
            text-align: center;
            padding: 10px 0;
          }
        }

        /* Scrollbar styles */
        .settings-main::-webkit-scrollbar {
          width: 6px;
        }
        .settings-main::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Settings;
