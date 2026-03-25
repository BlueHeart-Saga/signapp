import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, 
  FaChevronDown, 
  FaEnvelope, 
  FaTag,
  FaTimes,
  FaBars,
  FaSignature,
  FaFileAlt,
  FaRobot,
  FaClone,
  FaShieldAlt,
  FaCompass,
  FaRocket,
  FaCrown,
  FaUserFriends,
  FaSignInAlt,
  FaLightbulb
} from 'react-icons/fa';
import API_BASE_URL from "../config/api";
import {
  Shield,
} from "lucide-react";


const MainNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef(null);
  const featuresRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [brandName, setBrandName] = useState("SafeSign");
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/branding/config`);
        if (res.data.platform_name) setBrandName(res.data.platform_name);
        if (res.data.logo_url !== null)
          setLogoUrl(`${API_BASE_URL}/branding/logo/file`);
      } catch (err) {
        console.log("Branding fetch failed, using defaults");
      }
    };
    fetchBranding();
  }, []);

  const features = [
    { 
      label: 'E-Signature', 
      href: '/e-signature', 
      icon: <FaSignature />,
      color: '#0d9488',
      desc: 'Secure digital signing solutions'
    },
    { 
      label: 'Documents', 
      href: '/document-management', 
      icon: <FaFileAlt />,
      color: '#3b82f6',
      desc: 'Smart document management'
    },
    { 
      label: 'Automation', 
      href: '/workflow-automation', 
      icon: <FaRobot />,
      color: '#8b5cf6',
      desc: 'Automated workflow processes'
    },
    { 
      label: 'Templates', 
      href: '/templates', 
      icon: <FaClone />,
      color: '#ef4444',
      desc: 'Pre-built document templates'
    },
    { 
      label: 'Security', 
      href: '/security', 
      icon: <FaShieldAlt />,
      color: '#10b981',
      desc: 'Enterprise-grade security'
    },
  ];

  const navItems = [
    { 
      label: 'Home', 
      href: '/', 
      icon: <FaHome className="safe-nav-link-icon" />,
      hasDropdown: false 
    },
    { 
      label: 'Explore', 
      href: '/aboutus', 
      icon: <FaCompass className="safe-nav-link-icon" />,
      hasDropdown: false 
    },
    // { 
    //   label: 'Features', 
    //   hasDropdown: true,
    //   icon: <FaChartLine className="safe-nav-link-icon" />
    // },
    { 
      label: 'Let\'s Talk', 
      href: '/contactus', 
      icon: <FaUserFriends className="safe-nav-link-icon" />,
      hasDropdown: false 
    },
    { 
      label: 'Upgrade', 
      href: '/pricing', 
      icon: <FaCrown className="safe-nav-link-icon" />,
      hasDropdown: false 
    },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (featuresRef.current && !featuresRef.current.contains(event.target)) {
        setIsFeaturesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsFeaturesOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav className={`safe-nav ${isScrolled ? 'safe-nav-scrolled' : ''}`}>
        <div className="safe-nav-container">
          {/* Logo */}
          <div className="safe-nav-logo" onClick={() => navigate('/')}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="logo"
                className="safe-logo-img"
              />
            ) : (
              <div className="safe-logo-icon">
                {/* <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="9" fill="#0d9488"/>
                  <path d="M9 16L13 20L17 16M9 12L13 8L17 12M15 8V24" 
                        stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg> */}
                <Shield />
              </div>
            )}
            <span className="safe-logo-text">{brandName}</span>
          </div>

          {/* Desktop Navigation */}
          <div className="safe-nav-desktop">
            {navItems.map((item) => (
              <div key={item.label} className="safe-nav-item">
                {item.hasDropdown ? (
                  <div 
                    className="safe-dropdown-wrapper"
                    ref={featuresRef}
                    onMouseEnter={() => setIsFeaturesOpen(true)}
                    onMouseLeave={() => setIsFeaturesOpen(false)}
                  >
                    <button className={`safe-nav-btn ${isFeaturesOpen ? 'safe-nav-active' : ''}`}>
                      {item.icon}
                      <span>Features</span>
                      <FaChevronDown className={`safe-nav-arrow ${isFeaturesOpen ? 'safe-arrow-rotated' : ''}`} />
                    </button>
                    
                    <div className={`safe-nav-dropdown ${isFeaturesOpen ? 'safe-dropdown-show' : ''}`}>
                      <div className="safe-dropdown-header">
                        <div className="safe-dropdown-title">Our Features</div>
                        <div className="safe-dropdown-subtitle">Everything you need for digital signing</div>
                      </div>
                      <div className="safe-dropdown-grid">
                        {features.map((feature) => (
                          <div
                            key={feature.label}
                            className="safe-feature-card"
                            onClick={() => navigate(feature.href)}
                          >
                            <div className="safe-feature-icon-wrapper" style={{ backgroundColor: `${feature.color}15` }}>
                              <span style={{ color: feature.color }}>
                                {feature.icon}
                              </span>
                            </div>
                            <div className="safe-feature-info">
                              <div className="safe-feature-label">{feature.label}</div>
                              <div className="safe-feature-desc">{feature.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="safe-dropdown-footer">
                        <button className="safe-btn safe-btn-outline" onClick={() => navigate('/features')}>
                          View All Features
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`safe-nav-link ${location.pathname === item.href ? 'safe-link-active' : ''}`}
                    onClick={() => navigate(item.href)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="safe-nav-cta">
            <button 
              className="safe-btn safe-btn-ghost" 
              onClick={() => navigate('/login')}
            >
              <FaLightbulb className="safe-btn-icon" />
              <span>Login</span>
            </button>
            <button 
              className="safe-btn safe-btn-primary" 
              onClick={() => navigate('/register')}
            >
              <FaSignInAlt className="safe-btn-icon" />
              <span>Try Free</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="safe-mobile-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="safe-nav-overlay" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div className={`safe-mobile-menu ${isMenuOpen ? 'safe-menu-open' : ''}`} ref={menuRef}>
        <div className="safe-mobile-header">
          <div className="safe-nav-logo" onClick={() => { navigate('/'); setIsMenuOpen(false); }}>
            <div className="safe-logo-icon">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="9" fill="#0d9488"/>
                <path d="M9 16L13 20L17 16M9 12L13 8L17 12M15 8V24" 
                      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="safe-logo-text">{brandName}</span>
          </div>
          <button 
            className="safe-mobile-close"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="safe-mobile-nav">
          {navItems.map((item) => (
            <div key={item.label}>
              {item.hasDropdown ? (
                <>
                  <button 
                    className="safe-mobile-nav-btn"
                    onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
                  >
                    {item.icon}
                    <span>Features</span>
                    <FaChevronDown className={`safe-mobile-arrow ${isFeaturesOpen ? 'safe-arrow-rotated' : ''}`} />
                  </button>
                  
                  {isFeaturesOpen && (
                    <div className="safe-mobile-dropdown">
                      <div className="safe-mobile-dropdown-header">
                        <h4>Our Features</h4>
                        <p>Complete digital signing solution</p>
                      </div>
                      {features.map((feature) => (
                        <div
                          key={feature.label}
                          className="safe-mobile-feature"
                          onClick={() => {
                            navigate(feature.href);
                            setIsMenuOpen(false);
                          }}
                        >
                          <div className="safe-mobile-feature-icon" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
                            {feature.icon}
                          </div>
                          <div className="safe-mobile-feature-info">
                            <div className="safe-mobile-feature-label">{feature.label}</div>
                            <div className="safe-mobile-feature-desc">{feature.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className={`safe-mobile-nav-link ${location.pathname === item.href ? 'safe-mobile-link-active' : ''}`}
                  onClick={() => {
                    navigate(item.href);
                    setIsMenuOpen(false);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              )}
            </div>
          ))}
          
          <div className="safe-mobile-cta">
            <div className="safe-mobile-cta-title">Ready to sign smarter?</div>
            <button 
              className="safe-btn safe-btn-ghost safe-btn-full" 
              onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
            >
              <FaLightbulb className="safe-btn-icon" />
              <span>Login</span>
            </button>
            <button 
              className="safe-btn safe-btn-primary safe-btn-full" 
              onClick={() => { navigate('/register'); setIsMenuOpen(false); }}
            >
              <FaRocket className="safe-btn-icon" />
              <span>Try Free</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Navbar Base */
        .safe-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid rgba(229, 231, 235, 0.8);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .safe-nav-scrolled {
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border-bottom-color: rgba(229, 231, 235, 0.95);
        }

        .safe-nav-container {
         
          margin: 0 auto;
          padding: 0 2rem;
          height: 5.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Logo */
        .safe-nav-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: 51px;
          cursor: pointer;
          user-select: none;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .safe-nav-logo:hover {
          transform: scale(1.02);
        }

        .safe-logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .safe-logo-img {
          height: 3rem;
          object-fit: contain;
        }

        .safe-logo-text {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.025em;
        }

        /* Desktop Navigation */
        .safe-nav-desktop {
          display: none;
          align-items: center;
          gap: 0.5rem;
          margin-left: 3rem;
        }

        @media (min-width: 1024px) {
          .safe-nav-desktop {
            display: flex;
          }
        }

        .safe-nav-item {
          position: relative;
        }

        .safe-nav-link {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          color: #4b5563;
          font-size: 1rem;
          font-weight: 600;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .safe-nav-link:hover {
          color: #0d9488;
          background: rgba(13, 148, 136, 0.08);
          transform: translateY(-1px);
        }

        .safe-link-active {
          color: #0d9488;
          background: rgba(13, 148, 136, 0.12);
          font-weight: 700;
        }

        .safe-nav-link-icon {
          font-size: 1.125rem;
          opacity: 0.9;
        }

        .safe-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: #4b5563;
          font-size: 1rem;
          font-weight: 600;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .safe-nav-btn:hover,
        .safe-nav-active {
          color: #0d9488;
          background: rgba(13, 148, 136, 0.08);
          transform: translateY(-1px);
        }

        .safe-nav-arrow {
          font-size: 0.75rem;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .safe-arrow-rotated {
          transform: rotate(180deg);
        }

        /* Dropdown */
        .safe-dropdown-wrapper {
          position: relative;
        }

        .safe-nav-dropdown {
          position: absolute;
          top: calc(100% + 0.75rem);
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08);
          padding: 0;
          min-width: 20rem;
          opacity: 0;
          visibility: hidden;
          transform: translateX(-50%) translateY(-1rem) scale(0.98);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1001;
          overflow: hidden;
        }

        .safe-dropdown-show {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0) scale(1);
        }

        .safe-dropdown-header {
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .safe-dropdown-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .safe-dropdown-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .safe-dropdown-grid {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.75rem;
        }

        .safe-feature-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #374151;
          padding: 0.875rem;
          border-radius: 0.75rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .safe-feature-card:hover {
          background: #f9fafb;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .safe-feature-icon-wrapper {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .safe-feature-card:hover .safe-feature-icon-wrapper {
          transform: scale(1.1);
        }

        .safe-feature-info {
          flex: 1;
          min-width: 0;
        }

        .safe-feature-label {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          line-height: 1.3;
          margin-bottom: 0.125rem;
        }

        .safe-feature-desc {
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .safe-dropdown-footer {
          padding: 1rem 1.5rem 1.5rem;
          border-top: 1px solid #f3f4f6;
          text-align: center;
        }

        /* CTA Buttons */
        .safe-nav-cta {
          display: none;
          align-items: center;
          gap: 0.75rem;
        }

        @media (min-width: 1024px) {
          .safe-nav-cta {
            display: flex;
          }
        }

        .safe-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 0.75rem;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .safe-btn-icon {
          font-size: 1.125rem;
        }

        .safe-btn-ghost {
          background: transparent;
          color: #4b5563;
          border-color: rgba(13, 148, 136, 0.3);
        }

        .safe-btn-ghost:hover {
          color: #0d9488;
          background: rgba(13, 148, 136, 0.1);
          border-color: rgba(13, 148, 136, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 148, 136, 0.15);
        }

        .safe-btn-primary {
          background: #ea580c;
          color: white;
          border: none;
          box-shadow: 0 4px 20px rgba(13, 148, 136, 0.4);
        }

        .safe-btn-primary:hover {
        background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(13, 148, 136, 0.5);
        }

        .safe-btn-outline {
          background: transparent;
          color: #0d9488;
          border-color: rgba(13, 148, 136, 0.3);
          width: 100%;
        }

        .safe-btn-outline:hover {
          background: rgba(13, 148, 136, 0.1);
          border-color: rgba(13, 148, 136, 0.5);
        }

        .safe-btn-full {
          width: 100%;
        }

        /* Mobile Toggle */
        .safe-mobile-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #374151;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.75rem;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
        }

        .safe-mobile-toggle:hover {
          background: #f3f4f6;
          color: #0d9488;
        }

        @media (min-width: 1024px) {
          .safe-mobile-toggle {
            display: none;
          }
        }

        /* Mobile Overlay */
        .safe-nav-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 998;
          animation: safe-fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes safe-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Mobile Menu */
        .safe-mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 24rem;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 999;
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 40px rgba(0, 0, 0, 0.15);
        }

        .safe-menu-open {
          transform: translateX(0);
        }

        .safe-mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: white;
        }

        .safe-mobile-close {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #374151;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .safe-mobile-close:hover {
          background: #f3f4f6;
          color: #0d9488;
        }

        .safe-mobile-nav {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-mobile-nav-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 1rem 1rem;
          background: none;
          border: none;
          color: #111827;
          font-size: 1.125rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 0.75rem;
        }

        .safe-mobile-nav-btn:hover {
          color: #0d9488;
          background: rgba(13, 148, 136, 0.08);
        }

        .safe-mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1rem;
          color: #111827;
          font-size: 1.125rem;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          border-radius: 0.75rem;
        }

        .safe-mobile-nav-link:hover {
          color: #0d9488;
          background: rgba(13, 148, 136, 0.08);
        }

        .safe-mobile-link-active {
          color: #0d9488;
          background: rgba(13, 148, 136, 0.12);
          font-weight: 700;
        }

        .safe-mobile-arrow {
          font-size: 0.875rem;
          color: #6b7280;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .safe-mobile-dropdown {
          padding: 0.5rem 0 1rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .safe-mobile-dropdown-header {
          padding: 0 1rem;
          margin-bottom: 0.5rem;
        }

        .safe-mobile-dropdown-header h4 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .safe-mobile-dropdown-header p {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .safe-mobile-feature {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem;
          color: #374151;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .safe-mobile-feature:hover {
          background: #f9fafb;
          transform: translateX(4px);
        }

        .safe-mobile-feature-icon {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .safe-mobile-feature-info {
          flex: 1;
        }

        .safe-mobile-feature-label {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          line-height: 1.3;
          margin-bottom: 0.125rem;
        }

        .safe-mobile-feature-desc {
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .safe-mobile-cta {
          margin-top: auto;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .safe-mobile-cta-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .safe-nav-container {
            padding: 0 1.5rem;
            height: 5rem;
          }
          
          .safe-logo-text {
            font-size: 1.5rem;
          }
          
          .safe-mobile-menu {
            max-width: 100%;
          }
          
          .safe-mobile-nav {
            padding: 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .safe-nav-container {
            padding: 0 1.25rem;
            height: 4.5rem;
          }
          
          .safe-logo-text {
            font-size: 1.375rem;
          }
          
          .safe-logo-img {
            height: 2.5rem;
          }
          
          .safe-mobile-header {
            padding: 1.25rem;
          }
          
          .safe-mobile-nav {
            padding: 1rem;
          }
          
          .safe-mobile-nav-btn,
          .safe-mobile-nav-link {
            font-size: 1.0625rem;
            padding: 0.875rem;
          }
        }

        /* Touch Device Optimizations */
        @media (hover: none) and (pointer: coarse) {
          .safe-nav-link,
          .safe-nav-btn,
          .safe-feature-card,
          .safe-mobile-nav-link,
          .safe-mobile-nav-btn,
          .safe-mobile-feature {
            min-height: 48px;
          }
          
          .safe-btn {
            min-height: 48px;
            padding: 0.875rem 1.5rem;
          }
          
          .safe-mobile-toggle,
          .safe-mobile-close {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Smooth Animations */
        * {
          scroll-behavior: smooth;
        }
      `}</style>
    </>
  );
};

export default MainNavbar;