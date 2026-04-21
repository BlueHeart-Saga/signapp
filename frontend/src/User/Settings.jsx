import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaLock,
  FaCalendarAlt,
  FaCamera,
  FaEdit,
  FaSignature,
  FaStamp,
  FaUpload
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const stampInputRef = useRef(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    first_name: "",
    last_name: "",
    company: "",
    job_title: "",
    date_format: "MMM dd yyyy HH:mm z",
    time_zone: "Asia/Kolkata",
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    reminder_days: 3,
    expiry_days: 30,
  });

  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [stampFile, setStampFile] = useState(null);
  const [stampPreviewUrl, setStampPreviewUrl] = useState(null);

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

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setUser(data);
      setProfileForm({
        full_name: data.full_name || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        company: data.company || "",
        job_title: data.job_title || "",
        date_format: data.date_format || "MMM dd yyyy HH:mm z",
        time_zone: data.time_zone || "Asia/Kolkata",
      });
      setScheduleForm({
        reminder_days: data.reminder_days || 3,
        expiry_days: data.expiry_days || 30,
      });
      if (data.profile_picture) {
        setPreviewUrl(`data:${data.profile_picture.content_type};base64,${data.profile_picture.data}`);
      }
      if (data.stamp_image) {
        setStampPreviewUrl(`data:${data.stamp_image.content_type};base64,${data.stamp_image.data}`);
      }

      // Pre-fill forgot email with current user email
      setForgotForm(prev => ({ ...prev, email: data.email || "" }));
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user settings");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("full_name", profileForm.full_name);
      formData.append("first_name", profileForm.first_name);
      formData.append("last_name", profileForm.last_name);
      formData.append("company", profileForm.company);
      formData.append("job_title", profileForm.job_title);
      formData.append("date_format", profileForm.date_format);
      formData.append("time_zone", profileForm.time_zone);
      formData.append("reminder_days", scheduleForm.reminder_days);
      formData.append("expiry_days", scheduleForm.expiry_days);

      if (profilePic) {
        formData.append("profile_picture", profilePic);
      }
      if (stampFile) {
        formData.append("stamp_image", stampFile);
      }

      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        const updatedData = await response.json();
        localStorage.setItem("user", JSON.stringify(updatedData.user));
        setUser(updatedData.user);

        // Refresh previews from server data
        if (updatedData.user.profile_picture) {
          setPreviewUrl(`data:${updatedData.user.profile_picture.content_type};base64,${updatedData.user.profile_picture.data}`);
        }
        if (updatedData.user.stamp_image) {
          setStampPreviewUrl(`data:${updatedData.user.stamp_image.content_type};base64,${updatedData.user.stamp_image.data}`);
        }
        setStampFile(null); // Clear local file state
        setProfilePic(null);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
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
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        toast.success("Password changed successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to change password");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestForgotOTP = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotForm.email }),
      });
      if (response.ok) {
        toast.success("OTP sent to your email");
        setForgotStep(2);
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotOTP = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotForm.email,
          otp: forgotForm.otp
        }),
      });
      if (response.ok) {
        toast.success("OTP verified successfully");
        setForgotStep(3);
      } else {
        const data = await response.json();
        toast.error(data.detail || "Invalid or expired OTP");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      toast.error("Passwords do not match");
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
          new_password: forgotForm.newPassword
        }),
      });
      if (response.ok) {
        toast.success("Password reset successfully");
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotForm({ ...forgotForm, otp: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleStampChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStampFile(file);
      setStampPreviewUrl(URL.createObjectURL(file));
    }
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
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="profile-img-large" />
                ) : (
                  <div className="profile-placeholder-large">
                    {user?.full_name?.charAt(0) || "U"}
                  </div>
                )}
                <label htmlFor="avatar-upload" className="avatar-overlay">
                  <FaCamera />
                  <input
                    id="avatar-upload"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <div className="profile-identity-text">
                <h2>{user?.first_name || user?.full_name || "User"}</h2>
                <p>{user?.email || "user@example.com"}</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="profile-form-layout">
              {/* Signature Row */}
              <div className="form-row">
                <label className="row-label">Signature and initial</label>
                <div className="row-input signature-container">
                  <div className="signature-preview-box handwriting">
                    {getSignatureText()}
                  </div>
                  <div className="initial-preview-box handwriting">
                    {getInitialText()}
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
                  <button
                    type="button"
                    className="stamp-upload-btn"
                    onClick={() => stampInputRef.current.click()}
                  >
                    <FaUpload /> Upload Stamp
                  </button>
                  <input
                    type="file"
                    ref={stampInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleStampChange}
                  />
                </div>
              </div>

              {/* Basic Info Rows */}
              <div className="form-row">
                <label className="row-label">First name</label>
                <div className="row-input">
                  <input
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    className="styled-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <label className="row-label">Last name</label>
                <div className="row-input">
                  <input
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
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
                <div className="row-input">
                  <input
                    type="text"
                    value={profileForm.time_zone}
                    onChange={(e) => setProfileForm({ ...profileForm, time_zone: e.target.value })}
                    className="styled-input disabled-like"
                  />
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
            <h3 className="tab-header-title">Reset Password</h3>
            <form onSubmit={handlePasswordChange} className="profile-form-layout narrow-form">
              <div className="form-row">
                <label className="row-label">Current Password</label>
                <div className="row-input">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="styled-input"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <label className="row-label">New Password</label>
                <div className="row-input">
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="styled-input"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <label className="row-label">Confirm Password</label>
                <div className="row-input">
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="styled-input"
                    required
                  />
                </div>
              </div>
              <div className="form-actions-footer password-actions">
                <button type="submit" className="update-btn" disabled={loading}>
                  {loading ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  className="forgot-link-btn"
                  onClick={() => setShowForgotModal(true)}
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
                    value={scheduleForm.reminder_days}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, reminder_days: parseInt(e.target.value) })}
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
                    value={scheduleForm.expiry_days}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, expiry_days: parseInt(e.target.value) })}
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
        <div className="modal-overlay">
          <div className="forgot-modal">
            <div className="modal-header">
              <h3>Reset Your Password</h3>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep(1);
                }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="step-indicator">
                <div className={`step-dot ${forgotStep >= 1 ? 'active' : ''}`}>1</div>
                <div className={`step-line ${forgotStep >= 2 ? 'active' : ''}`}></div>
                <div className={`step-dot ${forgotStep >= 2 ? 'active' : ''}`}>2</div>
                <div className={`step-line ${forgotStep >= 3 ? 'active' : ''}`}></div>
                <div className={`step-dot ${forgotStep >= 3 ? 'active' : ''}`}>3</div>
              </div>

              {forgotStep === 1 && (
                <form onSubmit={handleRequestForgotOTP} className="forgot-step-form">
                  <p className="step-desc">Enter your email address and we'll send you an OTP to reset your password.</p>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={forgotForm.email}
                    onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                    className="styled-input full-width"
                    placeholder="example@email.com"
                    required
                  />
                  <button type="submit" className="modal-submit-btn" disabled={forgotLoading}>
                    {forgotLoading ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyForgotOTP} className="forgot-step-form">
                  <p className="step-desc">We've sent a 6-digit code to {forgotForm.email}. Please enter it below.</p>
                  <label>Verification Code</label>
                  <input
                    type="text"
                    value={forgotForm.otp}
                    onChange={(e) => setForgotForm({ ...forgotForm, otp: e.target.value })}
                    className="styled-input full-width center-text"
                    placeholder="0 0 0 0 0 0"
                    maxLength={6}
                    required
                  />
                  <div className="modal-row-actions">
                    <button
                      type="button"
                      className="modal-back-btn"
                      onClick={() => setForgotStep(1)}
                    >
                      Back
                    </button>
                    <button type="submit" className="modal-submit-btn" disabled={forgotLoading}>
                      {forgotLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="forgot-step-form">
                  <p className="step-desc">Create a new secure password for your account.</p>
                  <label>New Password</label>
                  <input
                    type="password"
                    value={forgotForm.newPassword}
                    onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                    className="styled-input full-width"
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={forgotForm.confirmPassword}
                    onChange={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })}
                    className="styled-input full-width"
                    placeholder="Re-enter your password"
                    required
                  />
                  <button type="submit" className="modal-submit-btn" disabled={forgotLoading}>
                    {forgotLoading ? "Resetting..." : "Set New Password"}
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
        }

        .profile-top-info {
          display: flex;
          align-items: center;
          gap: 25px;
          margin-bottom: 40px;
        }

        .avatar-section {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .profile-img-large {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #ddd;
        }

        .profile-placeholder-large {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #000;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
        }

        .avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .avatar-overlay:hover {
          opacity: 1;
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
          align-items: center;
        }

        .row-label {
          width: 180px;
          font-size: 14px;
          color: #333;
          flex-shrink: 0;
        }

        .row-input {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .styled-input, .styled-select {
          width: 100%;
          max-width: 350px;
          padding: 8px 12px;
          border: 1px solid #dcdde1;
          border-radius: 4px;
          background: #f1f2f6;
          font-size: 14px;
          color: #2f3640;
          outline: none;
        }

        .styled-input:focus, .styled-select:focus {
          border-color: #0f766e;
          background: #fff;
        }

        .disabled-like {
          cursor: default;
        }

        .mini {
          width: 80px !important;
        }

        .input-hint-text {
          font-size: 14px;
          color: #666;
        }

        /* Signature and Stamp Previews */
        .signature-container, .stamp-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .signature-preview-box {
          width: 350px;
          height: 80px;
          border: 1px solid #dcdde1;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          white-space: nowrap;
          overflow: hidden;
          background: #fff;
        }

        .initial-preview-box {
          width: 80px;
          height: 80px;
          border: 1px solid #dcdde1;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          background: #fff;
        }

        .handwriting {
          font-family: 'Great Vibes', cursive;
          color: #222;
        }

        .stamp-preview-box {
          width: 350px;
          height: 120px;
          border: 1px solid #dcdde1;
          border-radius: 4px;
          background: #fff;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stamp-preview-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .stamp-upload-btn {
          padding: 8px 16px;
          border: 1px solid #0f766e;
          border-radius: 4px;
          background: #fff;
          color: #0f766e;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .stamp-upload-btn:hover {
          background: #0f766e10;
        }

        /* Default Stamp UI */
        .default-stamp {
          width: 110px;
          height: 110px;
          border: 2px solid #ef4444; /* Red stamp color */
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

        .edit-icon-btn {
          background: transparent;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .edit-icon-btn:hover {
          color: #0f766e;
        }

        .form-actions-footer {
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #f0f0f0;
        }

        .password-actions {
          display: flex;
          align-items: center;
          gap: 20px;
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
          padding: 10px 40px;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .update-btn:hover {
          background: #0f766d;
        }

        .update-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .tab-header-title {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 25px;
        }

        .narrow-form {
          max-width: 600px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .forgot-modal {
          background: white;
          width: 100%;
          max-width: 450px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          overflow: hidden;
          animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
          padding: 20px 25px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .close-modal-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
          padding: 5px;
        }

        .modal-body {
          padding: 25px;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 30px;
        }

        .step-dot {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #f0f0f0;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .step-dot.active {
          background: #0f766e;
          color: white;
        }

        .step-line {
          flex: 0 0 50px;
          height: 2px;
          background: #f0f0f0;
          margin: 0 10px;
          transition: all 0.3s;
        }

        .step-line.active {
          background: #0f766e;
        }

        .forgot-step-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .forgot-step-form label {
          font-size: 14px;
          font-weight: 500;
          color: #444;
        }

        .step-desc {
          font-size: 14px;
          color: #666;
          line-height: 1.5;
          margin-bottom: 10px;
        }

        .full-width {
          max-width: none !important;
        }

        .center-text {
          text-align: center;
          letter-spacing: 4px;
          font-weight: 700;
          font-size: 18px !important;
        }

        .modal-submit-btn {
          background: #0f766e;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.2s;
        }

        .modal-submit-btn:hover {
          background: #0b7a70;
        }

        .modal-submit-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .modal-row-actions {
          display: flex;
          gap: 12px;
        }

        .modal-row-actions .modal-submit-btn {
          flex: 1;
        }

        .modal-back-btn {
          flex: 0 0 80px;
          background: #f1f2f6;
          color: #444;
          border: none;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
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
