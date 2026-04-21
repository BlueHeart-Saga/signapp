import React, { useMemo, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Home,
  Users,
  FileText,
  Layers,
  LogOut,
  Image,
  Wand2,
  FilePlus,
  Shield,
  LayoutDashboard,
  Activity,
  Images,
  Settings,
  ChevronDown,
  ChevronRight,
  Circle
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const menuItems = {
  admin: [
    { name: "Dashboard", path: "/admin/dashboard", icon: <Home size={18} /> },
    { name: "Manage Users", path: "/admin/users", icon: <Users size={18} /> },
    { name: "Templates", path: "/admin/templates", icon: <FileText size={18} /> },
    { name: "Envelope Management", path: "/admin/envelopes", icon: <Shield size={18} /> },
    { name: "Logo & Branding", path: "/admin/logo", icon: <Image size={18} /> },
    { name: "Banners", path: "/admin/banner", icon: <Images size={18} /> }
  ],
  user: [
    { name: "Overview", path: "/user", icon: <Activity size={18} /> },
    { name: "Dashboard", path: "/user/dashboard", icon: <LayoutDashboard size={18} /> },
    {
      name: "My Documents",
      path: "/user/documents",
      icon: <FileText size={18} />,
      hasSubmenu: true,
      subItems: [
        { name: "All Documents", path: "/user/documents", filter: "all" },
        { name: "Draft", path: "/user/documents", filter: "draft" },
        { name: "Sent", path: "/user/documents", filter: "sent" },
        { name: "Completed", path: "/user/documents", filter: "completed" },
        { name: "Declined", path: "/user/documents", filter: "declined" },
        { name: "Expired", path: "/user/documents", filter: "expired" },
        { name: "Voided", path: "/user/documents", filter: "voided" },

      ]
    },
    { name: "Contacts", path: "/user/contacts", icon: <Users size={18} /> },
    { name: "AI Templates", path: "/user/ai-template", icon: <Wand2 size={18} /> },
    {
      name: "Templates",
      path: "/user/templates",
      icon: <FilePlus size={18} />,
      hasSubmenu: true,
      subItems: [
        { name: "Browse Templates", path: "/user/templates", filter: "templates", param: "tab" },
        { name: "Documents", path: "/user/templates", filter: "documents", param: "tab" },
        { name: "Trash", path: "/user/templates", filter: "trash", param: "tab" },
      ]
    },
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
  const [openSubmenus, setOpenSubmenus] = useState({ "/user/documents": true });
  const [hoveredPath, setHoveredPath] = useState(null);

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
      if (storedUser) return JSON.parse(storedUser).role?.toLowerCase() || "user";
      const token = localStorage.getItem("token");
      if (!token) return "user";
      return jwtDecode(token).role?.toLowerCase() || "user";
    } catch {
      return "user";
    }
  }, []);

  const toggleSubmenu = (path, e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSubmenus(prev => ({ ...prev, [path]: !prev[path] }));
  };

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
          {!collapsed && <span className="safesign-sidebar__logo-text">{brandName}</span>}
        </div>
      </div>

      <nav className="safesign-sidebar__nav">
        {items.map((item) => {
          const isParentActive = location.pathname.startsWith(item.path);
          const isOpen = openSubmenus[item.path];
          const isHovered = hoveredPath === item.path;
          const showSub = (isOpen && !collapsed) || isHovered;

          if (item.hasSubmenu) {
            return (
              <div
                key={item.path}
                className="safesign-sidebar__menu-group"
                onMouseEnter={() => setHoveredPath(item.path)}
                onMouseLeave={() => setHoveredPath(null)}
              >
                <div
                  className={`safesign-sidebar__link ${isParentActive ? "safesign-sidebar__link--active" : ""}`}
                  onClick={(e) => !collapsed && toggleSubmenu(item.path, e)}
                  title={collapsed ? item.name : ""}
                >
                  <span className="safesign-sidebar__link-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="safesign-sidebar__link-label">{item.name}</span>
                      <span className="safesign-sidebar__chevron">
                        {showSub ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    </>
                  )}
                </div>

                {showSub && (
                  <div
                    className={`safesign-sidebar__submenu ${collapsed ? "safesign-sidebar__submenu--floating" : ""
                      }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {collapsed && (
                      <div className="safesign-sidebar__submenu-header">
                        {item.name}
                      </div>
                    )}
                    {item.subItems.map((sub, idx) => {
                      const params = new URLSearchParams(location.search);
                      const isActive = location.pathname === sub.path &&
                        params.get(sub.param || 'status') === sub.filter;

                      return (
                        <Link
                          key={idx}
                          to={`${sub.path}?${sub.param || 'status'}=${sub.filter}`}
                          className={`safesign-sidebar__submenu-link ${isActive ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.innerWidth <= 768) {
                              onToggle();
                            }
                          }}
                        >
                          <Circle
                            size={collapsed ? 4 : 6}
                            fill={isActive ? "#0f766e" : "transparent"}
                            strokeWidth={3}
                            style={{ flexShrink: 0 }}
                          />
                          <span>{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.name : ""}
              onClick={(e) => e.stopPropagation()}
              className={`safesign-sidebar__link ${location.pathname === item.path ||
                (item.path === "/user" && location.pathname === "/user")
                ? "safesign-sidebar__link--active"
                : ""
                }`}
            >
              <span className="safesign-sidebar__link-icon">{item.icon}</span>
              {!collapsed && <span className="safesign-sidebar__link-label">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="safesign-sidebar__footer">
        {role === "user" && (
          <Link
            to="/user/settings"
            className={`safesign-sidebar__settings ${location.pathname === "/user/settings" ? "safesign-sidebar__settings--active" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Settings size={18} />
            {!collapsed && <span>Settings</span>}
          </Link>
        )}

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
          border-right: 1px solid #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
          flex-shrink: 0;
        }

        .safesign-sidebar__logo {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: flex-start;
          padding-left: 4px;
        }

        .safesign-sidebar--collapsed .safesign-sidebar__logo {
          justify-content: center;
          padding-left: 0;
        }

        .safesign-sidebar__logo-icon {
          color: #0f766e;
          flex-shrink: 0;
        }

        .safesign-sidebar__logo-text {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #0f766e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .safesign-sidebar__nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
          overflow-x: visible;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }

        .safesign-sidebar--collapsed .safesign-sidebar__nav {
          overflow-x: visible;
        }

        .safesign-sidebar__nav::-webkit-scrollbar {
          width: 4px;
        }

        .safesign-sidebar__nav::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }

        .safesign-sidebar__menu-group {
          position: relative;
        }

        .safesign-sidebar__link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          margin-bottom: 4px;
          color: #475569;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          position: relative;
          cursor: pointer;
        }

        .safesign-sidebar__link:hover {
          background: #f8fafc;
          color: #0f766e;
        }

        .safesign-sidebar__link--active {
          background: #f0fdf9;
          color: #0f766e;
          font-weight: 600;
        }

        .safesign-sidebar__link-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .safesign-sidebar__link-label {
          white-space: nowrap;
        }

        .safesign-sidebar__chevron {
          margin-left: auto;
          display: flex;
          align-items: center;
          color: #94a3b8;
          transition: transform 0.2s;
        }

        .safesign-sidebar__submenu {
          margin-left: 24px;
          padding-left: 12px;
          border-left: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 1px;
          margin-top: 2px;
          margin-bottom: 8px;
        }

        .safesign-sidebar__submenu--floating {
          position: absolute;
          left: 100%;
          top: 0;
          margin-left: 12px;
          min-width: 180px;
          background: white;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 8px;
          z-index: 1001;
          margin-top: 0;
          margin-bottom: 0;
        }

        .safesign-sidebar__submenu-header {
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 4px;
        }

        .safesign-sidebar__submenu-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          color: #64748b;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .safesign-sidebar__submenu-link:hover {
          background: #f1f5f9;
          color: #0f766e;
        }

        .safesign-sidebar__submenu-link.active {
          color: #0f766e;
          background: #f0fdfa;
        }

        .safesign-sidebar__footer {
          padding: 16px 12px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: auto;
        }

        .safesign-sidebar__settings, .safesign-sidebar__logout {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
          text-decoration: none;
        }

        .safesign-sidebar__settings {
          color: #475569;
        }

        .safesign-sidebar__settings:hover {
          background: #f8fafc;
          color: #0f766e;
        }

        .safesign-sidebar__settings--active {
          background: #f0fdf9;
          color: #0f766e;
        }

        .safesign-sidebar__logout {
          background: transparent;
          border: none;
          color: #ef4444;
          width: 100%;
          text-align: left;
        }

        .safesign-sidebar__logout:hover {
          background: #fef2f2;
        }

        @media (max-width: 991px) {
          .safesign-sidebar:not(.safesign-sidebar--collapsed) {
            width: 70px;
          }
        }

        @media (max-width: 768px) {
          .safesign-sidebar {
            width: 260px !important;
            transform: translateX(-100%);
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.1);
          }
          
          .safesign-sidebar:not(.safesign-sidebar--collapsed) {
             transform: translateX(0);
          }

          .safesign-sidebar--collapsed {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </aside>
  );
}
