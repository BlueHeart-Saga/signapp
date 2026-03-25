import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Home, Users, FileText, Layers, LogOut, Image, Wand2, Brain, FilePlus, Shield, LayoutDashboard, Sparkles, Zap, Activity, Images, Settings} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const menuItems = {
  admin: [
   
    { name: "Dashboard", path: "/admin/dashboard", icon: <Home size={18} /> },
    { name: "Manage Users", path: "/admin/users", icon: <Users size={18} /> },
    { name: "Templates", path: "/admin/templates", icon: <FileText size={18} /> },
    { name: "Logo & Branding", path: "/admin/logo", icon: <Image size={18} /> },
    { name: "Banners", path: "/admin/banner", icon: <Images size={18} /> }
  ],
  user: [
     {
    name: "Overview",
    path: "/user",
    icon: <Activity size={18} />,
  },
    { name: "Dashboard", path: "/user/dashboard", icon: <LayoutDashboard  size={18} /> },
    { name: "My Documents", path: "/user/documents", icon: <FileText size={18} /> },
     { name: "Contacts", path: "/user/contacts", icon: <Users size={18} /> },

    { name: "AI Templates", path: "/user/ai-template", icon: <Wand2 size={18} /> },
    { name: "Templates", path: "/user/templates", icon: <FilePlus size={18} /> },
    // { name: "D-Sign", path: "/user/d-sign", icon: <Edit3 size={18} /> },
  ],
  recipient: [
    { name: "Dashboard", path: "/recipient/home", icon: <Home size={18} /> },
    { name: "Documents", path: "/recipient/documents", icon: <FileText size={18} /> },
    { name: "History", path: "/recipient/history", icon: <Activity size={18} /> },
    { name: "View Document", path: "/recipient/view", icon: <Layers size={18} /> },
  ],
};

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const [brandName, setBrandName] = useState("SafeSign");
const [logoUrl, setLogoUrl] = useState(null);

useEffect(() => {
  const loadBranding = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branding/config`);

      if (res.data.platform_name) setBrandName(res.data.platform_name);

      if (res.data.logo_url !== null)
        setLogoUrl(`${API_BASE_URL}/branding/logo/file`);

    } catch (e) {
      console.log("Branding fetch failed");
    }
  };

  loadBranding();
}, []);



  const role = useMemo(() => {
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      return JSON.parse(storedUser).role?.toLowerCase() || "user";
    }

    const token = localStorage.getItem("token");
    if (!token) return "user";

    return jwtDecode(token).role?.toLowerCase() || "user";
  } catch {
    return "user";
  }
}, []);


  const items = menuItems[role] || [];

  return (
    <aside
      className={`safesign-sidebar ${collapsed ? "safesign-sidebar--collapsed" : ""}`}
      onClick={onToggle}
    >
      <div className="safesign-sidebar__header">
        <div className="safesign-sidebar__logo">

  {logoUrl ? (
    <img
      src={logoUrl}
      alt="logo"
      style={{ height: collapsed ? 22 : 28, objectFit: "contain" }}
    />
  ) : (
    <Shield size={collapsed ? 20 : 24} className="safesign-sidebar__logo-icon" />
  )}

  {!collapsed && (
    <span className="safesign-sidebar__logo-text">
      {brandName}
    </span>
  )}
</div>

      </div>

      <nav className="safesign-sidebar__nav">
        {items.map((item) => (
          <Link
  key={item.path}
  to={item.path}
  title={collapsed ? item.name : ""}
  onClick={(e) => e.stopPropagation()}
  className={`safesign-sidebar__link ${
  location.pathname === item.path ||
  (item.path === "/user" && location.pathname === "/user")
    ? "safesign-sidebar__link--active"
    : ""
}`}
>

            <span className="safesign-sidebar__link-icon">{item.icon}</span>
            {!collapsed && <span className="safesign-sidebar__link-label">{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="safesign-sidebar__footer">

  {/* Settings Button */}
  <Link
    to="/user/settings"
    className="safesign-sidebar__settings"
    onClick={(e) => e.stopPropagation()}
  >
    <Settings size={18} />
    {!collapsed && <span>Settings</span>}
  </Link>

  {/* Logout Button */}
  <button
    className="safesign-sidebar__logout"
    onClick={(e) => {
      e.stopPropagation();
      localStorage.removeItem("token");
      window.location.href = "/login";
    }}
  >
    <LogOut size={18} />
    {!collapsed && <span>Logout</span>}
  </button>

</div>

      <style jsx>{`
        .safesign-sidebar {
          display: flex;
          flex-direction: column;
          width: 230px;
          height: 100vh;
          background: white;
          border-right: 1px solid #595a5b3e;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: fixed;
          left: 0;
          top: 0;
          box-shadow: 1px 0 3px rgba(0, 0, 0, 0.04);
          z-index: 1000;
        }
          

        .safesign-sidebar--collapsed {
          width: 70px;
        }

        .safesign-sidebar__header {
          padding: 20px 16px;
          border-bottom: 1px solid #e2e8f0;
          background: white;
        }

        .safesign-sidebar__logo {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }

        .safesign-sidebar__logo-icon {
          color: #0d9488;
        }

        .safesign-sidebar__logo-text {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.3px;
          color: #0d9488;
        }

        .safesign-sidebar--collapsed .safesign-sidebar__logo {
          justify-content: center;
        }

        .safesign-sidebar__nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .safesign-sidebar__nav::-webkit-scrollbar {
          width: 5px;
        }

        .safesign-sidebar__nav::-webkit-scrollbar-track {
          background: transparent;
        }

        .safesign-sidebar__nav::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .safesign-sidebar__link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          margin-bottom: 4px;
          color: #0d9488;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          position: relative;
        }

        .safesign-sidebar__link:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .safesign-sidebar__link--active {
          background: #e0f2fe;
          color: #0d9488;
          font-weight: 600;
        }

        .safesign-sidebar__link--active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          height: 20px;
          width: 3px;
          background: #0d9488;
          border-radius: 0 2px 2px 0;
        }

        .safesign-sidebar--collapsed .safesign-sidebar__link {
          justify-content: center;
          padding: 11px;
        }

        .safesign-sidebar__link-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .safesign-sidebar__link-label {
          white-space: nowrap;
          color: gray;
          font-weight: 500;
        }

        .safesign-sidebar__footer {
          padding: 16px 12px;
          border-top: 1px solid #e2e8f0;
          background: #ffffff;
          display: flex;
    flex-wrap: wrap;
    justify-content: center;
        }

        .safesign-sidebar__logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 11px 14px;
          background: #ab191900;
          color: #ff0000;
          border: 1px solid #ff000000;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .safesign-sidebar__logout:hover {
          background: #fef2f200;
          color: #ef4444;
          border-color: #fecaca00;
        }

        .safesign-sidebar__logout:active {
          transform: scale(0.98);
        }

        .safesign-sidebar--collapsed .safesign-sidebar__logout {
          padding: 11px;
        }

        .safesign-sidebar--collapsed .safesign-sidebar__logout span {
          display: none;
        }

        @media (max-width: 768px) {
          .safesign-sidebar {
            width: 70px;
          }

          .safesign-sidebar__logo-text,
          .safesign-sidebar__link-label,
          .safesign-sidebar__logout span {
            display: none;
          }

          .safesign-sidebar__link {
            justify-content: center;
            padding: 11px;
          }

          .safesign-sidebar__settings {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 11px 14px;
  margin-bottom: 6px;
  color: #0d9488;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.safesign-sidebar__settings:hover {
  background: #f1f5f9;
  color: #111b28;
}

.safesign-sidebar--collapsed .safesign-sidebar__settings span {
  display: none;
}
        }
      `}</style>
    </aside>
  );
}