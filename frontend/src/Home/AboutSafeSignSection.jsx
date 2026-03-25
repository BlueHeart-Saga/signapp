import React from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AboutSafeSignSection() {
    const navigate = useNavigate();
  return (
    <section>
      {/* TOP HERO SECTION */}
      <div
        style={{
          backgroundColor: "#0d9488",
          padding: "80px 100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#ffffff",
          flexWrap: "wrap",
          marginTop: "-8px"
        }}
      >
        {/* Left Content */}
        <div style={{ maxWidth: "520px" }}>
          <h1
            style={{
              fontSize: "40px",
              fontWeight: "700",
              marginBottom: "20px",
            }}
          >
            About Safe Sign
          </h1>

          <p
            style={{
              fontSize: "17px",
              lineHeight: "1.7",
              opacity: 0.95,
              marginBottom: "30px",
            }}
          >
            We're rewriting the rules of documentation. By combining legal-grade
            security with a frictionless digital interface, we help professional
            teams transition from legacy paper-heavy processes to high-velocity
            digital workflows.
          </p>

          <div style={{ display: "flex", gap: "16px" }}>
            <button
            onClick={() => navigate("/login")}
              style={{
                backgroundColor: "#f97316",
                border: "none",
                color: "#fff",
                padding: "14px 22px",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Start Free Trial
            </button>

            <button
            onClick={() => navigate("/login")}
              style={{
                backgroundColor: "#ffffff",
                border: "none",
                color: "#111827",
                padding: "14px 22px",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Contact Sales
            </button>
          </div>
        </div>

        {/* Right Illustration */}
        <div>
          <img
            src="/images/about-illustration.png"
            alt="E-sign illustration"
            style={{
              maxWidth: "420px",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* BOTTOM FEATURE SECTION */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "90px 100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "60px",
          minHeight: "300px"
        }}
      >
        {/* Left Image */}
        <div style={{ position: "relative" }}>
          <img
            src="/images/mobile-user.png"
            alt="User signing"
            style={{
              width: "360px",
              borderRadius: "50%",
              background: "#e6f7f5",
              padding: "20px",
            }}
          />

          {/* Status Badge */}
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              left: "-20px",
              background: "#ffffff",
              padding: "10px 14px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            <CheckCircle size={16} color="#16a34a" />
            Document Signed Successfully
          </div>
        </div>

        {/* Right Content */}
        <div style={{ maxWidth: "520px" }}>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: "700",
              marginBottom: "18px",
              color: "#111827",
            }}
          >
            Create secure e-signatures
          </h2>

          <p
            style={{
              fontSize: "16px",
              color: "#4b5563",
              lineHeight: "1.7",
              marginBottom: "26px",
            }}
          >
            Experience military-grade encryption and legally binding signatures
            that speed up your workflow from days to minutes. Every signature is
            backed by a comprehensive audit trail, ensuring non-repudiation and
            compliance with global standards like eIDAS and the ESIGN Act.
          </p>

          <div style={{ display: "flex", gap: "30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} color="#16a34a" />
              <span style={{ fontWeight: "600", fontSize: "14px" }}>
                AES-256 Encryption
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} color="#16a34a" />
              <span style={{ fontWeight: "600", fontSize: "14px" }}>
                Audit Trails
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
