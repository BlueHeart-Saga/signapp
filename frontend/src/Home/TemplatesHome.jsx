import React from "react";
import "../style/TemplatesHome.css";
import IntegrationsScroll from "./IntegrationsScroll";

import { setPageTitle } from "../utils/pageTitle";
import { useEffect } from "react";

const TemplatesHome = () => {
  useEffect(() => {
    setPageTitle(
      "Document Templates & Real-Time Tracking | SafeSign",
      "Access professional document templates and track document status in real-time with SafeSign. Our platform provides live updates and activity timelines for all your signed documents."
    );
  }, []);
  return (
    <div className="tmh-container">

      {/* HERO SECTION */}
      <section className="tmh-hero">
        <div className="tmh-hero-left">
          <p className="tmh-breadcrumb">Track & Manage</p>

          <h1 className="tmh-hero-title">
            Enterprise Document Control &
            <br />
            Real-Time Activity Management
          </h1>

          <p className="tmh-hero-subtext">
            Easily monitor and manage all sent documents from one dashboard.
            Stay informed at every stage, take quick actions, and ensure timely
            completion without confusion or follow-ups.
          </p>

          <div className="tmh-hero-buttons">
            <button className="tmh-btn-primary">Request a demo</button>
            <button className="tmh-btn-outline">Start free trial</button>
          </div>
        </div>

        <div className="tmh-hero-right">
          <img
            src="/images/templates-hero.png"
            alt="templates hero"
            className="tmh-hero-img"
          />
        </div>
      </section>

      {/* TRUSTED BY LOGOS */}
      <IntegrationsScroll />

      {/* FEATURE 1 */}
      <section className="tmh-feature">
        <div className="tmh-feature-text">
          <h2 className="tmh-feature-title">Live Status Updates</h2>

          <p className="tmh-feature-description">
            Get real-time visibility into every document’s progress.
            Instantly know whether a document is sent, viewed, signed, or completed,
            so you’re never left guessing about its current state.
          </p>
        </div>

        <div className="tmh-feature-image">
          <img src="/images/live-status.png" alt="live status updates" />
        </div>
      </section>

      {/* FEATURE 2 */}
      <section className="tmh-feature tmh-feature-reverse">
        <div className="tmh-feature-image">
          <img src="/images/activity-timeline.png" alt="activity timeline" />
        </div>

        <div className="tmh-feature-text">
          <h2 className="tmh-feature-title">Activity Timeline</h2>

          <p className="tmh-feature-description">
            View a detailed timeline of all document actions. Track when recipients
            open, view, or sign documents, complete with timestamps for full transparency
            and accountability.
          </p>
        </div>


      </section>

      {/* FEATURE 3 */}
      <section className="tmh-feature">
        <div className="tmh-feature-text">
          <h2 className="tmh-feature-title">Manage Documents</h2>

          <p className="tmh-feature-description">
            Manage documents effortlessly from one place. Send reminders,
            resend documents, update signer details, or cancel requests to keep
            your workflows moving smoothly.
          </p>
        </div>

        <div className="tmh-feature-image">
          <img src="/images/manage-documents.png" alt="manage documents" />
        </div>
      </section>

    </div>
  );
};

export default TemplatesHome;
