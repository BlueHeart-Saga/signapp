import React, { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import ProfileSetupModal from "./ProfileSetupModal";
import DashboardSkeleton from "./DashboardSkeleton";
import PageLoadingAnimation from "./PageLoadingAnimation";
import "../style/Layout.css";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(true);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const hasCheckedRef = useRef(false);
  const prevPathRef = useRef(location.pathname);
  const [isNavigating, setIsNavigating] = useState(false);

  // Smooth route transition: Show logo animation cleanly during page navigation loop
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setIsNavigating(true);
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const toggleSidebar = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  // Function to check if profile is complete
  const isProfileComplete = (user) => {
    if (!user) return false;
    // Check if full_name exists and is not empty
    return user.full_name && user.full_name.trim().length > 0;
  };

  // Check user profile after login/register (runs unobtrusively in background)
  useEffect(() => {
    if (hasCheckedRef.current) return;

    const checkProfile = () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
          return;
        }

        let user;
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.error("Failed to parse user data:", e);
          return;
        }

        const profileComplete = isProfileComplete(user);

        // Only show popup if profile is NOT complete
        if (!profileComplete) {
          setTimeout(() => {
            setShowProfilePopup(true);
          }, 300);
        } else {
          setShowProfilePopup(false);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        hasCheckedRef.current = true;
      }
    };

    checkProfile();
  }, []);

  // Handle route changes - check if we need to show popup on dashboard routes
  useEffect(() => {
    if (location.pathname.includes('/dashboard') && !showProfilePopup) {
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
  }, [location.pathname, showProfilePopup]);

  // Handle profile completion
  const handleProfileComplete = useCallback((updatedUser) => {
    setShowProfilePopup(false);

    let role = "user";
    if (updatedUser) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      role = updatedUser.role || localStorage.getItem("role") || "user";
    } else {
      const uStr = localStorage.getItem("user");
      if (uStr) {
        try {
          const u = JSON.parse(uStr);
          role = u.role || localStorage.getItem("role") || "user";
        } catch (e) { }
      }
    }

    role = String(role).toLowerCase();

    // Navigate to appropriate dashboard
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "recipient") {
      navigate("/recipient/home");
    } else {
      navigate("/user/dashboard");
    }
  }, [navigate]);

  return (
    <div className="layout">
      {/* Mobile Sidebar Backdrop */}
      {!collapsed && (
        <div
          className="sidebar-backdrop"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(prev => !prev)}
      />

      <div className={`main ${collapsed ? "collapsed" : ""}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="content">
          {isNavigating ? (
            <PageLoadingAnimation />
          ) : (
            <Suspense fallback={<PageLoadingAnimation />}>
              <div key={location.pathname} className="content-area-outlet">
                {children || <Outlet />}
              </div>
            </Suspense>
          )}
        </div>

        {showProfilePopup && (
          <ProfileSetupModal
            onComplete={handleProfileComplete}
          />
        )}
      </div>

      <style jsx>{`
        .sidebar-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 999;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .sidebar-backdrop {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
