import React from "react";
import "../style/DocumentManagementHome.css";
import IntegrationsScroll from "./IntegrationsScroll";

const DocumentManagementHome = () => {
  return (
    <div className="dmh-container">

      {/* HERO SECTION */}
      <section className="dmh-hero">
        <div className="dmh-hero-left">
          <p className="dmh-breadcrumb">Choose Recipients</p>

          <h1 className="dmh-hero-title">
            Add people, assign roles, and control
            <br />
            the signing flow
          </h1>

          <p className="dmh-hero-subtext">
            Select recipients, assign roles, and set the signing order
            to ensure documents are completed smoothly and securely.
          </p>

          <div className="dmh-hero-buttons">
            <button className="dmh-btn-primary">Request a demo</button>
            <button className="dmh-btn-outline">Start free trial</button>
          </div>
        </div>

        <div className="dmh-hero-right">
          <img
            src="/images/recipients-hero.png"
            alt="recipient management"
            className="dmh-hero-img"
          />
        </div>
      </section>

      {/* TRUSTED BY / LOGO CAROUSEL */}
      <IntegrationsScroll />

      {/* FEATURE 1 – ADD RECIPIENTS */}
      <section className="dmh-feature">
        <div className="dmh-feature-text">
          <h2 className="dmh-feature-title">Add Recipients</h2>

          <p className="dmh-feature-description">
            Enter recipient names and email addresses to include everyone involved
            in the document workflow. Add multiple recipients easily and manage them from
            a single panel.
          </p>
        </div>

        <div className="dmh-feature-image">
          <img src="/images/add-recipient.png" alt="add recipients" />
        </div>
      </section>

      {/* FEATURE 2 – ASSIGN ROLES */}
      <section className="dmh-feature dmh-feature-reverse">
        <div className="dmh-feature-image">
          <img src="/images/assign-roles.png" alt="assign roles" />
        </div>

        <div className="dmh-feature-text">
          <h2 className="dmh-feature-title">Assign Roles</h2>

          <p className="dmh-feature-description">
            Choose roles such as Signer, Reviewer, or CC to control what actions
            each recipient can perform. Roles help keep responsibilities clear and
            prevent errors.
          </p>
        </div>
      </section>

      {/* FEATURE 3 – SET SIGNING ORDER */}
      <section className="dmh-feature">
        <div className="dmh-feature-text">
          <h2 className="dmh-feature-title">Set Signing Order</h2>

          <p className="dmh-feature-description">
            Define a sequential or parallel signing flow so documents move in the
            correct order. Ensure approvals and signatures are collected without
            delays or confusion.
          </p>
        </div>

        <div className="dmh-feature-image">
          <img src="/images/signing-order.png" alt="set signing order" />
        </div>
      </section>

    </div>
  );
};

export default DocumentManagementHome;
