import React from "react";
import "../style/WorkflowAutomationHome.css";
import IntegrationsScroll from "./IntegrationsScroll";

import { setPageTitle } from "../utils/pageTitle";
import { useEffect } from "react";

const WorkflowAutomationHome = () => {
  useEffect(() => {
    setPageTitle(
      "Automated Document Workflows & Tracking | SafeSign",
      "Streamline your document processes with SafeSign's workflow automation. Track real-time document status, manage recipient actions, and automate follow-ups for faster completions."
    );
  }, []);
  return (
    <div className="wfa-container">

      {/* HERO SECTION */}
      <section className="wfa-hero">
        <div className="wfa-hero-left">
          <p className="wfa-breadcrumb">Sent Documents</p>

          <h1 className="wfa-hero-title">
            Advanced Document Tracking &
            <br />
            AI-Powered Workflow Automation
          </h1>

          <p className="wfa-hero-subtext">
            Access all your sent documents in one organized view. Easily track their progress,
            stay informed about recipient actions, and manage documents efficiently to ensure
            timely completion without unnecessary follow-ups.
          </p>

          <div className="wfa-hero-buttons">
            <button className="wfa-btn-primary">Request a demo</button>
            <button className="wfa-btn-outline">Start free trial</button>
          </div>
        </div>

        <div className="wfa-hero-right">
          <img
            src="/images/workflow-hero.png"
            alt="workflow automation"
            className="wfa-hero-img"
          />
        </div>
      </section>

      {/* TRUSTED CAROUSEL */}
      <IntegrationsScroll />

      {/* FEATURE 1 – DOCUMENT STATUS */}
      <section className="wfa-feature">
        <div className="wfa-feature-text">
          <h2 className="wfa-feature-title">Document Status</h2>
          <p className="wfa-feature-description">
            Stay updated with real-time document statuses such as Sent, Viewed, Signed,
            and Completed. Quickly identify which documents require action and which
            are already finalized.
          </p>
        </div>

        <div className="wfa-feature-image">
          <img src="/images/document-status.png" alt="document status" />
        </div>
      </section>

      {/* FEATURE 2 – RECIPIENT DETAILS */}
      <section className="wfa-feature wfa-feature-reverse">
        <div className="wfa-feature-image">
          <img src="/images/recipient-details.png" alt="recipient details" />
        </div>

        <div className="wfa-feature-text">
          <h2 className="wfa-feature-title">Recipient Details</h2>
          <p className="wfa-feature-description">
            See signer names, contact information, and activity history to understand
            who has viewed or acted on a document.
          </p>
        </div>
      </section>

      {/* FEATURE 3 – QUICK ACTIONS */}
      <section className="wfa-feature">
        <div className="wfa-feature-text">
          <h2 className="wfa-feature-title">Quick Actions</h2>
          <p className="wfa-feature-description">
            Take immediate action by resending documents, sending reminders,
            or canceling requests — all from a single screen.
          </p>
        </div>

        <div className="wfa-feature-image">
          <img src="/images/quick-actions.png" alt="quick actions" />
        </div>
      </section>

    </div>
  );
};

export default WorkflowAutomationHome;
