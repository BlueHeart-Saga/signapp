import React from "react";
import "../style/AboutHero.css";
import { useNavigate } from "react-router-dom";

const AboutHero = () => {
  const navigate = useNavigate();
  return (
    <section className="about-hero">

      <div className="about-hero-content">

        <h1 className="about-hero-title">
          <span className="highlight">Future-Ready E-Signatures</span> for <br />
          Modern Business
        </h1>

        <p className="about-hero-subtext">
          Fast, secure & automated document signing. Powered
          by intelligent workflows and real-time verification.
        </p>

        <div className="about-hero-actions">
          <button className="btn-primary1" onClick={() => navigate("/login")}>Get Started</button>
          <button className="herocss-btn-secondary" onClick={() => navigate("/login")}>Book Demo</button>
        </div>
      </div>

      {/* bottom visual section */}
      <div className="about-hero-visual">
        <img
          src="/images/hero-person.png"
          alt="business person signing"
          className="hero-person"
        />
      </div>

    </section>
  );
};

export default AboutHero;
