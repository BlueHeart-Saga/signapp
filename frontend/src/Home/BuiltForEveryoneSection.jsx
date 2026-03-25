import React from "react";
import { CheckCircle, Lock, Globe, Plug } from "lucide-react";

export default function BuiltForEveryoneSection() {
  return (
    <section style={{ background: "#ffffff" }}>
      {/* TOP SECTION */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "80px",
          flexWrap: "wrap",
        }}
      >
        {/* LEFT CONTENT */}
        <div style={{ maxWidth: "520px" }}>
          <h2
            style={{
              fontSize: "30px",
              fontWeight: "700",
              marginBottom: "20px",
              color: "#0d9488",
            }}
          >
            Built for everyone
          </h2>

          <p
            style={{
              fontSize: "16px",
              color: "#374151",
              lineHeight: "1.7",
              marginBottom: "26px",
            }}
          >
            Whether you are a student submitting forms, a freelancer closing
            deals, or a large enterprise managing thousands of contracts, our
            tools scale to meet your specific professional needs. We provide
            specialized templates for every industry.
          </p>

          <div style={{ display: "flex", gap: "30px", marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} color="#16a34a" />
              <span style={{ fontWeight: "600", fontSize: "14px" }}>
                Simple & Easy
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} color="#16a34a" />
              <span style={{ fontWeight: "600", fontSize: "14px" }}>
                Mass-sending & API
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "360px",
              height: "360px",
              borderRadius: "50%",
              background: "#e6f7f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <img
              src="/images/business-user.png"
              alt="Business user"
              style={{
                width: "360px",
                borderRadius: "12px",
                zIndex: 2,
              }}
            />

            {/* Avatars */}
            <div
              style={{
                position: "absolute",
                top: "80px",
                right: "-10px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {["A", "S", "G", "M", "L"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#0d9488",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "-6px",
                    border: "2px solid white",
                  }}
                >
                  {c}
                </div>
              ))}
              <div
                style={{
                  width: "32px",
                  height: "28px",
                  borderRadius: "14px",
                  background: "#3b82f6",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: "-6px",
                  border: "2px solid white",
                }}
              >
                +20
              </div>
            </div>

            {/* Send Button */}
            <button
              style={{
                position: "absolute",
                right: "-10px",
                top: "140px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div
        style={{
        //   padding: "80px 20px",
          background: "#ffffff",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "30px",
            fontWeight: "700",
            marginBottom: "12px",
            color: "#0d9488",
          }}
        >
          Why Businesses Choose Signd
        </h2>

        <p
          style={{
            fontSize: "16px",
            color: "#6b7280",
            marginBottom: "50px",
          }}
        >
          Built for professional teams that value security and speed.
        </p>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "30px",
          }}
        >
          {/* Card 1 */}
          <div style={cardStyle}>
            <Lock size={32} color="#0d9488" />
            <h4 style={cardTitle}>Security First</h4>
            <p style={cardText}>
              Every signature is backed by industry-leading crypto standards and
              multi-factor authentication.
            </p>
          </div>

          {/* Card 2 */}
          <div style={cardStyle}>
            <Globe size={32} color="#0d9488" />
            <h4 style={cardTitle}>Global Compliance</h4>
            <p style={cardText}>
              Fully compliant with eIDAS, ESIGN, and UETA regulations across 180+
              countries.
            </p>
          </div>

          {/* Card 3 */}
          <div style={cardStyle}>
            <Plug size={32} color="#0d9488" />
            <h4 style={cardTitle}>Instant Integration</h4>
            <p style={cardText}>
              Seamlessly connect with Salesforce, Slack, or your existing tech
              stack using our robust developer API.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "30px",
  textAlign: "left",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
};

const cardTitle = {
  fontSize: "18px",
  fontWeight: "600",
  margin: "16px 0 10px",
  color: "#111827",
};

const cardText = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "1.6",
};
