// src/pages/ComplaintPage.jsx
import React, { useState } from "react";
import "../style/ComplaintPage.css";
import SpamComplaintsPage from "./SpamComplaintsPage";
import AbuseHeroCard from "./AbuseHeroCard";

export default function ComplaintPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    incident_date: "",
    sender_name: "",
    sender_email: "",
    document_id: "",
    document_name: "",
    complaint_type: "",
    message: "",
    evidence: null,
    declaration: false,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // ─────────────────────────────
  // HANDLE INPUT CHANGE
  // ─────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setForm({ ...form, [name]: files[0] });
    } else if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // ─────────────────────────────
  // SUBMIT FORM
  // ─────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.evidence) {
      setError("Evidence file is required");
      return;
    }

    if (!form.declaration) {
      setError("You must accept the declaration");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/e-sign/complaints`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Submission failed");

      setSuccess(true);
      setForm({
        name: "",
        email: "",
        company: "",
        incident_date: "",
        sender_name: "",
        sender_email: "",
        document_id: "",
        document_name: "",
        complaint_type: "",
        message: "",
        evidence: null,
        declaration: false,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AbuseHeroCard />
      <div className="complaint-wrapper">
        <div className="complaint-card">
          <h1>Abuse Report Form</h1>
          <p className="intro">
            Report phishing, fraud, or unauthorized e-signature requests.
            SafeSign’s Trust & Security team will investigate.
          </p>

          <form onSubmit={handleSubmit}>

            {/* CONTACT INFO */}
            <section>
              <h2>Contact Information</h2>

              <label>
                Name<span>*</span>
                <input type="text" name="name" required value={form.name} onChange={handleChange} />
              </label>

              <label>
                Email<span>*</span>
                <input type="email" name="email" required value={form.email} onChange={handleChange} />
              </label>

              <label>
                Organization / Company
                <input type="text" name="company" value={form.company} onChange={handleChange} />
              </label>

              <label>
                Incident Date & Time
                <input type="datetime-local" name="incident_date" value={form.incident_date} onChange={handleChange} />
              </label>
            </section>

            {/* ENTITY DETAILS */}
            <section>
              <h2>Involved Entity Details</h2>

              <label>
                Sender Name
                <input type="text" name="sender_name" value={form.sender_name} onChange={handleChange} />
              </label>

              <label>
                Sender Email
                <input type="email" name="sender_email" value={form.sender_email} onChange={handleChange} />
              </label>

              <label>
                Document ID (Optional)
                <input type="text" name="document_id" value={form.document_id} onChange={handleChange} />
              </label>

              <label>
                Document Name
                <input type="text" name="document_name" value={form.document_name} onChange={handleChange} />
              </label>
            </section>

            {/* COMPLAINT TYPE */}
            <section>
              <h2>Abuse Complaint Type<span>*</span></h2>

              <select
                name="complaint_type"
                required
                value={form.complaint_type}
                onChange={handleChange}
              >
                <option value="">Select type</option>
                <option value="phishing">Phishing / Scam</option>
                <option value="unauthorized">Unauthorized Request</option>
                <option value="impersonation">Impersonation</option>
                <option value="forgery">Forged Document</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
              </select>
            </section>

            {/* DESCRIPTION + EVIDENCE */}
            <section>
              <h2>Evidence</h2>

              <label>
                Describe the Issue<span>*</span>
                <textarea
                  name="message"
                  rows={5}
                  required
                  value={form.message}
                  onChange={handleChange}
                />
              </label>

              <label className="file-upload">
                Upload Supporting Evidence<span>*</span>
                <input
                  type="file"
                  name="evidence"
                  required
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleChange}
                />
                <small>
                  Upload screenshots, PDFs, or email headers.
                </small>
              </label>
            </section>

            {/* DECLARATION */}
            <section className="declaration">
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="declaration"
                  checked={form.declaration}
                  onChange={handleChange}
                />
                I confirm the information provided is accurate and truthful.
              </label>
            </section>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Submitting…" : "Submit Abuse Report"}
            </button>
          </form>

          <div className="footer-note">
            This report is confidential and reviewed by SafeSign’s Trust & Security team.
          </div>
          {success && <div className="success-box">Complaint submitted successfully.</div>}
          {error && <div className="error-box">⚠️ {error}</div>}
        </div>


      </div>
      <SpamComplaintsPage />
    </>
  );
}
