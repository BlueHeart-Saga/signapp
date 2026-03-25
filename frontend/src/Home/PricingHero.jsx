import React from "react";
import "../style/PricingHero.css";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiShield, FiZap } from "react-icons/fi";


const PricingHero = () => {
    const navigate = useNavigate();
  return (
    <section className="pricing-hero">

      {/* ===== Background Layers ===== */}
      <div className="bg-left" />
      <div className="bg-middle" />
      <div className="bg-right" />

      {/* ===== Content Wrapper ===== */}
      <div className="pricing-container">

        {/* LEFT CONTENT */}
        <div className="pricing-left">
          <h1>
            Plans for every stage <br /> of growth
          </h1>

         <p>
  Start for free and scale with confidence. No hidden fees,
  just transparent pricing designed for your success.
</p>

<ul className="pricing-points">
  <li>
    <FiCheckCircle className="point-icon" />
    No credit card required to get started
  </li>
  <li>
    <FiZap className="point-icon" />
    Upgrade or downgrade plans anytime
  </li>
  <li>
    <FiShield className="point-icon" />
    Secure, compliant, and audit-ready signing
  </li>
</ul>


          <div className="pricing-badge">
            <span className="badge">BEST VALUE</span>
            <span className="badge-text">Save 20% with annual billing</span>
          </div>
           <div className="about-hero-actions1">
          <button className="btn-primary1" onClick={() => navigate("/login")}>Get Started</button>
          <button className="herocss-btn-secondary" onClick={() => navigate("/login")}>Book Demo</button>
        </div>
        </div>
        

        {/* RIGHT IMAGE */}
        <div className="pricing-right">
          <div className="image-circle">
            <img
              src="/images/pricing-person.png"
              alt="Pricing illustration"
            />
          </div>
        </div>

      </div>
    </section>
  );
};

export default PricingHero;
