import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api";

export default function AdminRegister() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    secret_key: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email: form.email,
        password: form.password,
        role: "admin",
        secret_key: form.secret_key,
        organization_name: "", // backend expects field
      };

      const res = await axios.post(`${API_BASE_URL}/auth/register`, payload);

      setMessage(res.data.message || "Admin registered successfully");
      setForm({
        email: "",
        password: "",
        confirmPassword: "",
        secret_key: "",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Registration failed. Check secret key or email.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Admin Registration</h2>
      <p>Create a privileged administrator account.</p>

      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ color: "green", marginBottom: 10 }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          name="email"
          required
          value={form.email}
          onChange={handleChange}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          required
          value={form.password}
          onChange={handleChange}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <label>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          required
          value={form.confirmPassword}
          onChange={handleChange}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <label>Admin Secret Key</label>
        <input
          type="password"
          name="secret_key"
          required
          value={form.secret_key}
          onChange={handleChange}
          placeholder="ADMIN_SECRET_KEY"
          style={{ width: "100%", padding: 8, marginBottom: 15 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Creating admin..." : "Register Admin"}
        </button>
      </form>
    </div>
  );
}
