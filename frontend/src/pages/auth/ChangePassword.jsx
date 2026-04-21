import React, { useState } from "react";
import api from "../../services/api";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear messages when user starts typing
    if (errorMsg) setErrorMsg("");
    if (successMsg) setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Validation
    if (formData.newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/change-password", {
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      });

      setSuccessMsg("Password changed successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Change Password</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Enter your current password"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>New Password</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password (min. 6 characters)"
            required
            minLength={6}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your new password"
            required
            minLength={6}
            style={styles.input}
          />
        </div>

        {errorMsg && (
          <div style={styles.error}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={styles.success}>
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.submitBtn,
            ...(loading ? styles.submitBtnDisabled : {})
          }}
        >
          {loading ? "Changing Password..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "20px",
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    fontWeight: "600",
    color: "#333",
    fontSize: "24px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#555",
  },
  input: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  submitBtn: {
    padding: "12px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "16px",
    transition: "background-color 0.2s",
  },
  submitBtnDisabled: {
    backgroundColor: "#6c757d",
    cursor: "not-allowed",
  },
  error: {
    color: "#dc3545",
    fontSize: "14px",
    textAlign: "center",
    padding: "8px",
    backgroundColor: "#f8d7da",
    borderRadius: "4px",
    border: "1px solid #f5c6cb",
  },
  success: {
    color: "#28a745",
    fontSize: "14px",
    textAlign: "center",
    padding: "8px",
    backgroundColor: "#d4edda",
    borderRadius: "4px",
    border: "1px solid #c3e6cb",
  },
};
