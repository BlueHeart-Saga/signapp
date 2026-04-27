import React from 'react';
import { FileText, Shield, Users } from 'lucide-react';
import AboutHero from './AboutHero';
import AboutSafeSignSection from './AboutSafeSignSection';
import { setPageTitle } from "../utils/pageTitle";
import { useEffect } from "react";
import {
  FiCheckCircle,
  FiLock,
  FiClock,
  FiShield
} from "react-icons/fi";


export default function About() {


  useEffect(() => {
    setPageTitle(
      "About SafeSign | Our Mission for Secure Digital Signatures",
      "Discover SafeSign's mission to provide the world's most secure and user-friendly digital signature platform. Learn how we empower businesses with legally binding e-signatures and automated document workflows."
    );
  }, []);
  return (
    <div className="about-page">
      <AboutHero />
      {/* <AboutSafeSignSection /> */}
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Secure Digital Signatures.<br />
              Trusted Everywhere.
            </h1>
            <p className="hero-description">
              SafeSign is a secure, cloud-based digital signature platform that helps
              businesses sign, send, and manage documents faster—without paperwork or delays.
            </p>

            <ul className="hero-points">
              <li><FiCheckCircle /> Legally binding & audit-ready signatures</li>
              <li><FiClock /> Faster turnaround with automated workflows</li>
              <li><FiLock /> Enterprise-grade security & encryption</li>
            </ul>

            {/* <div className="hero-buttons">
              <button className="btn-primary">Get Started</button>
              <button className="btn-secondary">Book Demo</button>
            </div> */}
          </div>
          <div className="hero-image">
            <img
              src="/images/about1.png"
              alt="Professional with documents"
              className="hero-img"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="feature-card blue-bg">
            <div className="feature-icon">
              <FileText size={40} color="#4299e1" />
            </div>
            <h3 className="feature-title">For Admins</h3>
            <p className="feature-description">
              Easily create, deploy digital docs and manage your entire agreement lifecycle effortlessly.
            </p>
          </div>

          <div className="feature-card yellow-bg">
            <div className="feature-icon">
              <Users size={40} color="#eab308" />
            </div>
            <h3 className="feature-title">For Signers</h3>
            <p className="feature-description">
              Sign your documents easily and securely on any device in just a few clicks.
            </p>
          </div>

          <div className="feature-card green-bg">
            <div className="feature-icon">
              <Shield size={40} color="#10b981" />
            </div>
            <h3 className="feature-title">For HR / Legal Teams</h3>
            <p className="feature-description">
              Create a single source of truth for contracts, ensuring compliance and easy tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Simple Fast Section */}
      <section className="simple-section">
        <div className="simple-container">
          <div className="simple-content">
            <h2 className="simple-title">Simple, Fast, and Paperless</h2>
            <p className="simple-description">
              SafeSign removes friction from document signing by digitizing every step
              of the process.
            </p>

            <ul className="content-points">
              <li><FiCheckCircle /> Upload documents in seconds</li>
              <li><FiCheckCircle /> Add signature, date, and approval fields easily</li>
              <li><FiCheckCircle /> Complete signing from desktop or mobile</li>
              <li><FiCheckCircle /> No software installation required</li>
            </ul>

          </div>
          <div className="simple-image">
            <img
              src="/images/about2.png"
              alt="Woman working on tablet"
              className="section-img"
            />
          </div>
        </div>
      </section>

      {/* Create Once Section */}
      <section className="create-section">
        <div className="create-container">
          <div className="create-image">
            <img
              src="/images/about3.png"
              alt="Man working on laptop"
              className="section-img"
            />
          </div>
          <div className="create-content">
            <h2 className="create-title">Create once. Send anytime.</h2>
            <p className="create-description">
              Build reusable document templates that save time and ensure consistency
              across your organization.
            </p>

            <ul className="content-points">
              <li><FiShield /> Standardized and compliant document workflows</li>
              <li><FiClock /> Faster document preparation and reuse</li>
              <li><FiCheckCircle /> Reduced errors with predefined fields</li>
            </ul>

          </div>
        </div>
      </section>

      <style jsx>{`
        .about-page {
          
          min-height: 100vh;
        }
          /* Bullet Points */
.hero-points,
.content-points {
  list-style: none;
  padding: 0;
  margin-top: 16px;
}

.hero-points li,
.content-points li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #475569;
  margin-bottom: 8px;
}

.hero-points svg,
.content-points svg {
  color: #0f766e;
  font-size: 18px;
}


        /* Hero Section */
        .hero-section {
          padding: 80px 20px 60px;
          background: #ffffff;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-content {
          padding-right: 20px;
        }

        .hero-title {
          font-size: 42px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 20px 0;
          line-height: 1.2;
        }

        .hero-description {
          font-size: 15px;
          color: #64748b;
          margin: 0 0 30px 0;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 12px;
        }

        .hero-image {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-img {
          width: 100%;
          max-width: 500px;
          height: auto;
          border-radius: 16px;
          object-fit: cover;
        }

        /* Features Section */
        .features-section {
          padding: 60px 20px;
          background: #ffffff;
        }

        .features-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          padding: 40px 28px;
          border-radius: 12px;
          text-align: center;
          transition: transform 0.2s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
        }

        .feature-card.blue-bg {
          background: #eff6ff;
        }

        .feature-card.yellow-bg {
          background: #fefce8;
        }

        .feature-card.green-bg {
          background: #f0fdf4;
        }

        .feature-icon {
          margin: 0 auto 20px;
          width: 80px;
          height: 80px;
          background: #ffffff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .feature-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .feature-description {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
        }

        /* Simple Section */
        .simple-section {
          padding: 60px 20px;
          background: #f8fafc;
        }

        .simple-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .simple-title {
          font-size: 36px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 20px 0;
        }

        .simple-description {
          font-size: 15px;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
        }

        .simple-image {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .section-img {
          width: 100%;
          max-width: 450px;
          height: auto;
          border-radius: 16px;
          object-fit: cover;
        }

        /* Create Section */
        .create-section {
          padding: 60px 20px;
          background: #ffffff;
        }

        .create-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .create-image {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .create-title {
          font-size: 36px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 20px 0;
        }

        .create-description {
          font-size: 15px;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero-container,
          .simple-container,
          .create-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .features-container {
            grid-template-columns: 1fr;
          }

          .hero-title {
            font-size: 32px;
          }

          .simple-title,
          .create-title {
            font-size: 28px;
          }

          .hero-img,
          .section-img {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
