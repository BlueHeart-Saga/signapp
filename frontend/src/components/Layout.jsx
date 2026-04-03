import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import ProfileSetupModal from "./ProfileSetupModal";
import "../style/Layout.css";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(true);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const hasCheckedRef = useRef(false);

  const toggleSidebar = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  // Function to check if profile is complete
  const isProfileComplete = (user) => {
    if (!user) return false;
    // Check if full_name exists and is not empty
    return user.full_name && user.full_name.trim().length > 0;
  };

  // Check user profile after login/register
  useEffect(() => {
    // Prevent multiple checks
    if (hasCheckedRef.current) return;
    
    const checkProfile = () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        
        console.log("Checking profile - Token:", !!token, "User:", !!userStr);
        
        if (!token || !userStr) {
          setIsChecking(false);
          return;
        }

        let user;
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.error("Failed to parse user data:", e);
          setIsChecking(false);
          return;
        }

        const profileComplete = isProfileComplete(user);
        console.log("Profile complete:", profileComplete, "User data:", user);
        
        // Only show popup if profile is NOT complete
        if (!profileComplete) {
          // Small delay to ensure smooth UI
          setTimeout(() => {
            setShowProfilePopup(true);
          }, 100);
        } else {
          setShowProfilePopup(false);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        setIsChecking(false);
        hasCheckedRef.current = true;
      }
    };

    checkProfile();
  }, []); // Empty dependency array - run once on mount

  // Handle route changes - check if we need to show popup on dashboard routes
  useEffect(() => {
    // Only check again if we're on dashboard and popup is not showing
    if (location.pathname.includes('/dashboard') && !showProfilePopup && !isChecking) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (!isProfileComplete(user)) {
            setShowProfilePopup(true);
          }
        } catch (e) {
          console.error("Error parsing user on route change:", e);
        }
      }
    }
  }, [location.pathname, showProfilePopup, isChecking]);

  // Handle profile completion
  const handleProfileComplete = useCallback((updatedUser) => {
    console.log("Profile completed, updating state");
    setShowProfilePopup(false);
    
    // Update localStorage with the new user data
    if (updatedUser) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    
    // Navigate to dashboard
    navigate("/user/dashboard");
  }, [navigate]);

  // Don't render children while checking (prevents flash)
  if (isChecking) {
    return (
      <div className="layout">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(prev => !prev)} />
        <div className={`main ${collapsed ? "collapsed" : ""}`}>
          <Navbar toggleSidebar={toggleSidebar} />
          <div className="content" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '400px'
          }}>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(prev => !prev)}
      />

      <div className={`main ${collapsed ? "collapsed" : ""}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="content">
          {children}
        </div>

        {showProfilePopup && (
          <ProfileSetupModal
            onComplete={handleProfileComplete}
          />
        )}
      </div>
    </div>
  );
}