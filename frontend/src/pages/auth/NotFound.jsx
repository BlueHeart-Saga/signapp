import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.code}>404</h1>
        <h2 style={styles.title}>Page Not Found</h2>
        <p style={styles.text}>
          The page you’re looking for doesn’t exist or has been moved.
        </p>

        <div style={styles.actions}>
          <button style={styles.primaryBtn} onClick={() => navigate("/")}>
            Go to Home
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f9fafb",
    padding: "20px",
  },
  card: {
    maxWidth: "420px",
    width: "100%",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  code: {
    fontSize: "64px",
    fontWeight: "700",
    margin: "0",
    color: "#0d9488", // SafeSign teal
  },
  title: {
    margin: "12px 0 8px",
    fontSize: "22px",
    fontWeight: "600",
    color: "#111827",
  },
  text: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "24px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  primaryBtn: {
    background: "#0d9488",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "#e5e7eb",
    color: "#111827",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
  },
};
