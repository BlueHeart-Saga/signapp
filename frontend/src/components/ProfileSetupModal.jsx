import React, { useState, useRef, useEffect } from "react";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export default function ProfileSetupModal({ onComplete }) {
  const [fullName, setFullName] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef();

  // Load existing user data if available
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.full_name) {
          setFullName(user.full_name);
        }
      }
    } catch (e) {
      console.error("Error loading user data:", e);
    }
  }, []);

  const handleSubmit = async () => {
    // Trim and validate
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError("Please enter your full name");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("full_name", trimmedName);

      if (image) {
        formData.append("profile_picture", image);
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle various error formats from backend
        const errorMessage = result.detail || result.message || (Array.isArray(result.detail) ? result.detail[0]?.msg : null) || "Failed to update profile";
        throw new Error(errorMessage);
      }

      // Update user in localStorage with the new data
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      // result.user contains the full updated user object from backend
      const updatedUser = {
        ...currentUser,
        ...result.user
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Update role explicitly if it changed
      if (updatedUser.role) {
        localStorage.setItem("role", updatedUser.role);
      }

      // Call onComplete with updated user
      onComplete(updatedUser);
    } catch (error) {
      console.error("Profile update failed:", error);
      setError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);

      // Set default name as "SafeSign User"
      const defaultName = "SafeSign User";

      const formData = new FormData();
      formData.append("full_name", defaultName);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        // If API call fails, still update localStorage with default name
        console.warn("API call failed, updating local storage only");
      }

      // Update user in localStorage with default name
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = {
        ...currentUser,
        full_name: defaultName
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Call onComplete with updated user
      onComplete(updatedUser);

    } catch (error) {
      console.error("Skip profile update failed", error);
      // Even if API fails, still complete the flow with default name in localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = {
        ...currentUser,
        full_name: "SafeSign User"
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onComplete(updatedUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "420px",
          background: "#fff",
          borderRadius: "14px",
          padding: "34px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "600",
            marginBottom: "6px",
            color: "#111827",
          }}
        >
          Complete Your Profile
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "26px",
          }}
        >
          Add your name and profile photo to continue
        </p>

        {/* Error message */}
        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Avatar Preview */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            margin: "0 auto 18px",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            cursor: "pointer",
            border: "2px solid #e5e7eb",
            transition: "all 0.2s ease",
          }}
        >
          {image ? (
            <img
              src={URL.createObjectURL(image)}
              alt="avatar"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span
              style={{
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              Upload
            </span>
          )}
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setImage(e.target.files[0]);
              setError(""); // Clear error when image is selected
            }
          }}
        />

        {/* Choose Image Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          type="button"
          style={{
            padding: "9px 16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            marginBottom: "22px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f9fafb";
            e.currentTarget.style.borderColor = "#14b8a6";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "#e5e7eb";
          }}
        >
          Choose Profile Image
        </button>

        {/* Full Name Input */}
        <input
          type="text"
          placeholder="Full Name *"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setError(""); // Clear error when user types
          }}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "8px",
            border: error ? "1px solid #dc2626" : "1px solid #d1d5db",
            fontSize: "14px",
            marginBottom: "22px",
            outline: "none",
          }}
        />

        {/* Buttons Container */}
        <div style={{ display: "flex", gap: "12px" }}>
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "9px",
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#4b5563",
              fontWeight: "600",
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Processing..." : "Skip"}
          </button>

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "9px",
              border: "none",
              background: "linear-gradient(135deg,#0d9488,#14b8a6)",
              color: "#fff",
              fontWeight: "600",
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 8px 20px rgba(20,184,166,0.35)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>

        <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "16px" }}>
          You can always update your profile later
        </p>
      </div>
    </div>
  );
}