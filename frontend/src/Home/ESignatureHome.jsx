import React from "react";
import "../style/ESignatureHome.css";
import IntegrationsScroll from "./IntegrationsScroll";

const ESignatureHome = () => {
  return (
    <div className="esig-container">

      {/* HERO SECTION */}
      <section className="esig-hero">
        <div className="esig-hero-left">
          <p className="esig-breadcrumb">Build / Upload Documents</p>

          <h1 className="esig-hero-title">
            Create documents your way — build
            <br />
            from scratch or upload existing files
          </h1>

          <p className="esig-hero-subtext">
            Design, customize, or upload documents in seconds
            with an intuitive drag-and-drop editor.
          </p>

          <div className="esig-hero-buttons">
            <button className="esig-btn-primary">Request a demo</button>
            <button className="esig-btn-outline">Start free trial</button>
          </div>
        </div>

        <div className="esig-hero-right">
          <img
            src="/images/hero-sign.png"
            alt="e-sign hero"
            className="esig-hero-img"
          />
        </div>
      </section>

      {/* TRUSTED SECTION */}
      <IntegrationsScroll />

      {/* FEATURE 1 */}
      <section className="esig-feature">
        <div className="esig-feature-text">
          <h2 className="esig-feature-title">Build Document</h2>
          <p className="esig-feature-description">
            Design documents using ready-made templates or start fresh.
            Add text fields, signature fields, dates, checkboxes, and assign signer
            roles easily — all in a clean drag-and-drop interface.
          </p>
        </div>

        <div className="esig-feature-image">
          <img src="/images/build-doc.png" alt="build document" />
        </div>
      </section>

      {/* FEATURE 2 */}
      <section className="esig-feature esig-feature-reverse">
        <div className="esig-feature-image">
          <img src="/images/upload-doc.png" alt="upload document" />
        </div>

        <div className="esig-feature-text">
          <h2 className="esig-feature-title">Upload Document</h2>
          <p className="esig-feature-description">
            Upload PDFs, Word, or image files and convert them into
            sign-ready documents in seconds. Place signature fields
            precisely where needed and send for signing without rework.
          </p>
        </div>
      </section>

      {/* FEATURE 3 */}
      <section className="esig-feature">
        <div className="esig-feature-text">
          <h2 className="esig-feature-title">Secure & Compliant</h2>
          <p className="esig-feature-description">
            Every document is protected with encryption, audit trails,
            and legally valid e-signatures to ensure authenticity and compliance.
          </p>
        </div>

        <div className="esig-feature-image">
          <img src="/images/secure.png" alt="secure document" />
        </div>
      </section>
    </div>
  );
};

export default ESignatureHome;
