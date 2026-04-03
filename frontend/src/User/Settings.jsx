import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

export default function Settings() {

  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [image, setImage] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const fileRef = useRef();
  const token = localStorage.getItem("token");

  // Load user
  useEffect(() => {

    const loadUser = async () => {

      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: "Bearer " + token
        }
      });

      const data = await res.json();

      setUser(data);
      setFullName(data.full_name || "");

    };

    loadUser();

  }, []);

  // Update profile
  const updateProfile = async () => {

    try {

      setLoading(true);

      const formData = new FormData();
      formData.append("full_name", fullName);

      if (image) {
        formData.append("profile_picture", image);
      }

      await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token
        },
        body: formData
      });

      toast.success("Profile updated");

      setUser({
        ...user,
        full_name: fullName,
        profile_picture: image
          ? URL.createObjectURL(image)
          : user.profile_picture
      });

    } catch (err) {

      console.error(err);
      toast.error("Profile update failed");

    } finally {

      setLoading(false);

    }

  };

  // Change password
  const changePassword = async () => {

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {

      setLoading(true);

      await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      toast.success("Password updated");

      setCurrentPassword("");
      setNewPassword("");

    } catch (err) {

      console.error(err);
      toast.error("Password change failed");

    } finally {

      setLoading(false);

    }

  };

  if (!user)
    return (
      <div className="ss-content-wrapper">
        <div className="ss-loading-overlay">
          <div className="ss-spinner-container">
            <div className="ss-loading-spinner"></div>
            <div className="ss-loader-text">
              <p>Loading</p>
              <div className="ss-rotating-words">
                <span className="ss-word">Status</span>
                <span className="ss-word">Reports</span>
                <span className="ss-word">Profile</span>
                <span className="ss-word">Documents</span>
                <span className="ss-word">Signatures</span>
                <span className="ss-word">Status</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div style={styles.page}>

      <h1 style={styles.title}>Account Settings</h1>

      {/* Profile */}

      <div style={styles.card}>

        <h2 style={styles.sectionTitle}>Profile</h2>

        <div
          style={styles.avatar}
          onClick={() => fileRef.current.click()}
        >

          {image ? (
            <img
              src={URL.createObjectURL(image)}
              style={styles.avatarImg}
            />
          ) : user.profile_picture ? (
            <img
              src={`data:${user.profile_picture.content_type};base64,${user.profile_picture.data}`}
              style={styles.avatarImg}
            />
          ) : (
            <span style={{ color: "#9ca3af" }}>Upload</span>
          )}

        </div>

        <input
          type="file"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={(e) => setImage(e.target.files[0])}
        />

        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={styles.input}
        />

        <button
          style={styles.button}
          onClick={updateProfile}
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>

      </div>

      {/* Password */}

      <div style={styles.card}>

        <h2 style={styles.sectionTitle}>Change Password</h2>

        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={styles.input}
        />

        <button
          style={styles.button}
          onClick={changePassword}
        >
          {loading ? "Updating..." : "Change Password"}
        </button>

      </div>

    </div>
  );
}

const styles = {

  page: {
    maxWidth: 700,
    margin: "40px auto",
    padding: 20,
    fontFamily: "Inter"
  },

  title: {
    fontSize: 26,
    marginBottom: 30
  },

  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 12,
    marginBottom: 25,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 15
  },

  sectionTitle: {
    fontSize: 18
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    cursor: "pointer",
    border: "2px solid #e5e7eb"
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #d1d5db"
  },

  button: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg,#0d9488,#14b8a6)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer"
  }

};