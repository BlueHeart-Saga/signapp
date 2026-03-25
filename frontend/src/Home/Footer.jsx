import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Linkedin,
  Instagram,
  Globe
} from "lucide-react";
import "../style/Footer.css";
import API_BASE_URL from "../config/api";

export default function Footer() {
  const navigate = useNavigate();

  const [brandName, setBrandName] = useState("SafeSign");
  const [tagline, setTagline] = useState(
    "SIGN SMARTER WITH AI-POWERED E-SIGNATURES"
  );
  const [logoUrl, setLogoUrl] = useState(null);

  /* ----------------------------------
     Social links configuration
  ---------------------------------- */
  const socialLinks = {
    facebook: "https://www.facebook.com/profile.php?id=61579126233218",
    website: "https://devopstrio.co.uk/",
    linkedin:
      "https://www.linkedin.com/company/devopstrioglobal/posts/?feedView=all",
    instagram: "https://www.instagram.com/devopstrio_offcl/"
  };

  const openExternal = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ----------------------------------
     Load branding dynamically
  ---------------------------------- */
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/branding/config`);

        if (res.data?.platform_name) setBrandName(res.data.platform_name);
        if (res.data?.tagline) setTagline(res.data.tagline);

        if (res.data?.logo_url !== null) {
          setLogoUrl(`${API_BASE_URL}/branding/logo/file`);
        }
      } catch (error) {
        console.warn("Branding load failed. Using defaults.");
      }
    };

    fetchBranding();
  }, []);

  return (
    <footer className="safesign-footer">
      <div className="safesign-footer-container">
        {/* Brand Section */}
        <div>
          <div
            className="safesign-footer-brand-wrapper"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt={`${brandName} logo`}
                className="safesign-footer-logo-img"
              />
            )}
            <h2 className="safesign-footer-brand">{brandName}</h2>
          </div>

          <p className="safesign-footer-tagline">{tagline}</p>

          <div className="safesign-footer-socials">
            <button
              aria-label="Facebook"
              onClick={() => openExternal(socialLinks.facebook)}
            >
              <Facebook />
            </button>

            <button
              aria-label="Website"
              onClick={() => openExternal(socialLinks.website)}
            >
              <Globe />
            </button>

            <button
              aria-label="LinkedIn"
              onClick={() => openExternal(socialLinks.linkedin)}
            >
              <Linkedin />
            </button>

            <button
              aria-label="Instagram"
              onClick={() => openExternal(socialLinks.instagram)}
            >
              <Instagram />
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="safesign-footer-title">Quick Links</h3>
          <ul className="safesign-footer-list">
            <li onClick={() => navigate("/")}>Home</li>
            <li onClick={() => navigate("/aboutus")}>About Us</li>
            <li onClick={() => navigate("/contactus")}>Contact Us</li>
            <li onClick={() => navigate("/pricing")}>Pricing</li>
            {/* <li onClick={() => navigate("/e-signature")}>E-Signature</li> */}
            <li onClick={() => navigate("/security")}>Security</li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="safesign-footer-title">Resources</h3>
          <ul className="safesign-footer-list">
            <li onClick={() => navigate("/blog")}>Blog</li>
            <li onClick={() => navigate("/helpcenter")}>Help Center</li>
            <li onClick={() => navigate("/case-studies")}>Case Studies</li>
            <li onClick={() => navigate("/docs")}>Documentation</li>
            <li onClick={() => navigate("/community")}>Community</li>
            <li onClick={() => navigate("/support")}>Support</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="safesign-footer-title">Contact Us</h3>

          <p className="safesign-footer-contact">
            <Mail size={16} /> support@{brandName.toLowerCase()}.com
          </p>

          <p className="safesign-footer-contact">
            <Phone size={16} /> +91 98765 43210
          </p>

          <p className="safesign-footer-contact">
            <MapPin size={16} /> India
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="safesign-footer-bottom">
        <p>© 2026 {brandName} — All rights reserved.</p>

        <div className="safesign-footer-policies">
          <span onClick={() => navigate("/privacy-policy")}>Privacy Policy</span>
          <span onClick={() => navigate("/terms-of-service")}>
            Terms of Service
          </span>
          <span onClick={() => navigate("/cookies")}>Cookie Policy</span>
          <span onClick={() => navigate("/abusepolicy")}>Abuse Policy</span>
          <span onClick={() => navigate("/trademarkpolicy")}>Trademark Policy</span>
          
          <span onClick={() => navigate("/complaints")}>GDPR Compliance</span>
          <span onClick={() => navigate("/faq")}>FAQ</span>
          
        </div>
      </div>
    </footer>
  );
}
