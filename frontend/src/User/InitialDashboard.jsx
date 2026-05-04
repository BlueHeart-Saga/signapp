import React from "react";
import axios from "axios";

import { Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { getDocumentStats } from "../services/DocumentAPI";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { setPageTitle } from "../utils/pageTitle";
import PremiumBannerSlider from "../components/PremiumBannerSlider";

// External CSS styles
const styles = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f5f5;
  overflow-x: hidden;
}

.ss-init-container {
  min-height: 100vh;
  background: #f5f5f5;
}



/* Hero Section with Gradient */
.ss-init-hero {
  background: linear-gradient(135deg, #0f766e 0%, #0d9489bc 40%, #0d948976 70%, #0f766e 100%);
  padding: 40px 60px 30px;
  color: white;
  position: relative;
}

.ss-init-hero-content {
  display: flex;
  align-items: flex-start;
  gap: 40px;
}

.ss-init-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  flex-shrink: 0;
}

.ss-init-signature-section {
  flex: 1;
}

.ss-init-signature-label {
  font-size: 13px;
  opacity: 0.95;
  margin-bottom: 6px;
}

.ss-init-signature-box {
  display: inline-flex;
  align-items: center;
  border: 2px solid rgba(255,255,255,0.5);
  border-radius: 4px;
  padding: 8px 16px;
  gap: 10px;
  background: rgba(255,255,255,0.1);
}

.ss-init-signature-text {
  font-family: 'Pacifico', cursive;
  font-size: 18px;
  font-style: italic;
}

.ss-init-signature-id {
  font-size: 11px;
  opacity: 0.85;
  border-left: 1px solid rgba(255,255,255,0.4);
  padding-left: 10px;
}

.ss-init-stats {
  display: flex;
  gap: 80px;
  margin-left: 120px;
}

.ss-init-stat {
  text-align: center;
}

.ss-init-stat-number {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 6px;
}

.ss-init-stat-label {
  font-size: 13px;
  opacity: 0.95;
  white-space: nowrap;
}

/* Main Content Area */
.ss-init-main {
  padding: 0 60px 60px;
  margin-top: -20px;
  position: relative;
  z-index: 10;
}

.ss-init-upload {
  background: white;
  border: 3px dashed #cbd5e1;
  border-radius: 6px;
  padding: 80px 32px;
  text-align: center;
  margin-bottom: 40px;
  transition: all 0.3s;
}

.ss-init-upload:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.ss-init-upload h3 {
  font-size: 17px;
  color: #64748b;
  margin-bottom: 32px;
  font-weight: 500;
}

.ss-init-btn-primary {
  background: #fbbf24;
  color: #78350f;
  border: none;
  padding: 12px 28px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ss-init-btn-primary:hover {
  background: #f59e0b;
}

/* Promo Banner */
.ss-init-promo {
  background: white;
  border-radius: 8px;
  padding: 28px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  position: relative;
  overflow: hidden;
}

.ss-init-promo::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.ss-init-promo-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.ss-init-gift-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  position: relative;
}

.ss-init-gift-icon::after {
  content: '✨';
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 20px;
}

.ss-init-gift-icon svg {
  color: #f59e0b;
}

.ss-init-promo-text h3 {
  font-size: 17px;
  color: #1f2937;
  margin-bottom: 6px;
  font-weight: 700;
}

.ss-init-promo-details {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
}

.ss-init-promo-code {
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 600;
  color: #374151;
}

.ss-init-btn-promo {
  background: transparent;
  color: #f59e0b;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  font-weight: 700;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ss-init-btn-promo:hover {
  background: #fef3c7;
}

/* Decorative Elements */
.ss-init-sparkle {
  position: absolute;
  color: #fbbf24;
  opacity: 0.6;
}

.ss-init-sparkle-1 {
  bottom: 20px;
  right: 120px;
  font-size: 20px;
}

.ss-init-sparkle-2 {
  top: 20px;
  right: 40px;
  font-size: 16px;
}

@media (max-width: 1200px) {
  .ss-init-stats {
    gap: 50px;
  }
}

@media (max-width: 1024px) {
  .ss-init-header,
  .ss-init-hero,
  .ss-init-main {
    padding-left: 32px;
    padding-right: 32px;
  }
  
  .ss-init-hero-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .ss-init-stats {
    margin-left: 0;
    gap: 32px;
  }
  
  .ss-init-nav {
    display: none;
  }
}

@media (max-width: 768px) {
  .ss-init-stats {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .ss-init-promo {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .ss-init-promo-left {
    flex-direction: column;
  }
}
`;

const InitialDashboard = () => {
  const navigate = useNavigate();

  // Helper to get last date of current month
  const getLastDateOfCurrentMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      day: lastDay.getDate(),
      monthName: lastDay.toLocaleString('default', { month: 'long' }),
      monthNum: String(lastDay.getMonth() + 1).padStart(2, '0'),
      year: lastDay.getFullYear(),
      shortYear: String(lastDay.getFullYear()).slice(-2)
    };
  };

  const promoExpiry = getLastDateOfCurrentMonth();

  const [banners, setBanners] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [pauseBanner, setPauseBanner] = useState(false);



  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL || "http://localhost:9000"}/banners/active`
      );
      setBanners(res.data || []);
    } catch (err) {
      console.error("Banner load failed", err);
    }
  };

  useEffect(() => {
    if (banners.length <= 1 || pauseBanner) return;

    const interval = setInterval(() => {
      setActiveBanner((prev) =>
        prev === banners.length - 1 ? 0 : prev + 1
      );
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [banners, pauseBanner]);




  const handleNavigate = (path) => {
    navigate(path);
  };



  const [stats, setStats] = useState({
    actionRequired: 0,
    waiting: 0,
    expiring: 0,
    completed: 0
  });
  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    setPageTitle(
      "Organization Dashboard",
      "View your activity, recent documents, and quick actions from your SafeSign dashboard."
    );
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDocumentStats();

      setStats({
        actionRequired: (data.sent || 0) + (data.in_progress || 0),
        waiting: data.sent || 0,
        expiring: data.expired || 0,
        completed: data.completed || 0
      });
    } catch (err) {
      console.error("Stats load failed", err);
    }
  };

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="ss-content-wrapper">
        <div className="ss-loading-overlay">
          <div className="ss-spinner-container">
            <div className="ss-loading-spinner"></div>
            <div className="ss-loader-text">
              <p>Loading</p>
              <div className="ss-rotating-words">
                <span className="ss-word">Status</span>
                <span className="ss-word">Reports</span>
                <span className="ss-word">Features</span>
                <span className="ss-word">Documents</span>
                <span className="ss-word">Signatures</span>
                <span className="ss-word">Status</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <>
      <style>{styles}</style>
      <div className="ss-init-container">
        {/* Header */}

        {/* Hero Section with Gradient Background */}
        <div className="ss-init-hero">
          <div className="ss-init-hero-content">
            {/* <img
//   src={user.profile_picture || "/images/default-avatar.png"}
  alt="profile"
  className="ss-init-avatar"
/> */}


            <div className="ss-init-signature-section">
              <h2>
                Welcome,{" "}
                {(user?.full_name || "user").toUpperCase()}

              </h2>

              <div className="ss-init-signature-label">
                {user?.email
                  ? user.email
                    .split("@")[0]          // john.doe123
                    .replace(/[0-9]/g, "")  // john.doe
                    .replace(/[._]/g, " ")  // john doe
                    .replace(/\b\w/g, c => c.toUpperCase()) // John Doe
                  : "User"}
                {/* {(user?.role || "user").toUpperCase()} */}
                _ACCOUNT
              </div>

              <div className="ss-init-signature-box">
                <span className="ss-init-signature-text">
                  {user?.organization_name || "Personal Workspace"}
                </span>

              </div>
            </div>
          </div>

          <div className="ss-init-stats">
            <div className="ss-init-stat">
              <div className="ss-init-stat-number">{stats.actionRequired}</div>

              <div className="ss-init-stat-label">Action Required</div>
            </div>
            <div className="ss-init-stat">
              <div className="ss-init-stat-number">{stats.waiting}</div>
              <div className="ss-init-stat-label">Waiting for Others</div>
            </div>
            <div className="ss-init-stat">
              <div className="ss-init-stat-number">{stats.expiring}</div>
              <div className="ss-init-stat-label">Expiring Soon</div>
            </div>
            <div className="ss-init-stat">
              <div className="ss-init-stat-number">{stats.completed}</div>
              <div className="ss-init-stat-label">Completed</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="ss-init-main">
          {/* Upload Section */}
          <div className="ss-init-upload">
            <h3>Drop documents here to get started</h3>
            <button
              className="ss-init-btn-primary"
              onClick={() => {
                if (stats.actionRequired > 0) {
                  handleNavigate("/user/documents");
                } else if (stats.waiting > 0) {
                  handleNavigate("/user/documents");
                } else {
                  handleNavigate("/user/documents");
                }
              }}
            >
              START NOW
            </button>

          </div>

          {/* Promo Banner */}
          <div className="ss-init-promo">
            <div className="ss-init-promo-left">
              <div className="ss-init-gift-icon">
                <Gift size={36} strokeWidth={2} />
              </div>
              <div className="ss-init-promo-text">
                <h3>Ends {promoExpiry.day} {promoExpiry.monthName}! Buy now and Save 20%</h3>
                  <span>Offer expires: {promoExpiry.day}/{promoExpiry.monthNum}/{promoExpiry.shortYear}</span>
              </div>
            </div>
            <button className="ss-init-btn-promo" onClick={() => navigate("/user/subscription")}>
              Upgrade <span>→</span>
            </button>

            <div className="ss-init-sparkle ss-init-sparkle-1">✨</div>
            <div className="ss-init-sparkle ss-init-sparkle-2">💫</div>
          </div>
        </div>


        {/* ===== Banner Slider ===== */}



        <PremiumBannerSlider />

      </div>
    </>
  );
};

export default InitialDashboard;
