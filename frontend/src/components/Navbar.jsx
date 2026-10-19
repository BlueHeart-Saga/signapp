import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Search,
  User,
  Menu,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ChevronRight,
  Loader,
  History,
  Sparkles,
  Send,
  Users,
  CreditCard,
  Trash2,
  LayoutDashboard,
  Lock,
  FileSignature,
  Stamp,
  Sliders,
  ArrowRight
} from 'lucide-react';

import CreditBadge from "./CreditBadge";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import FilenameDisplay from "./FilenameDisplay";
import "../style/Navbar.css";

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300,
  MAX_DOC_RESULTS: 8,
  MAX_RECENT_SEARCHES: 5,
  MIN_QUERY_LENGTH: 1
};

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: '#10b981', label: 'Completed' },
  in_progress: { icon: Loader, color: '#f59e0b', label: 'In Progress' },
  sent: { icon: Clock, color: '#3b82f6', label: 'Sent' },
  draft: { icon: FileText, color: '#6b7280', label: 'Draft' },
  voided: { icon: XCircle, color: '#ef4444', label: 'Voided' },
  declined: { icon: AlertCircle, color: '#ef4444', label: 'Declined' }
};

// Global system pages, settings tabs, and status filters
const GLOBAL_SHORTCUTS = [
  // Core Pages
  {
    category: "Pages",
    title: "Dashboard Overview",
    subtitle: "Overview of your signing metrics, envelopes & activities",
    path: "/user/dashboard",
    keywords: ["dashboard", "home", "overview", "analytics", "stats", "main"],
    icon: LayoutDashboard,
    iconColor: "#2563eb",
    role: "user"
  },
  {
    category: "Pages",
    title: "My Documents & Envelopes",
    subtitle: "View and manage all uploaded and received documents",
    path: "/user/documents",
    keywords: ["document", "documents", "my documents", "envelopes", "files", "all files", "manage documents"],
    icon: FileText,
    iconColor: "#0284c7",
    role: "user"
  },
  {
    category: "Actions",
    title: "Upload & Send Document",
    subtitle: "Upload PDF or DOCX file and send for e-signatures",
    path: "/user/document-builder",
    keywords: ["builder", "upload", "create", "new document", "send document", "prepare", "sign"],
    icon: Send,
    iconColor: "#16a34a",
    role: "user"
  },
  {
    category: "Pages",
    title: "Document Templates & AI",
    subtitle: "Reusable agreement templates & AI smart contract generator",
    path: "/user/templates",
    keywords: ["template", "templates", "ai template", "reusable", "contracts", "ai builder"],
    icon: Sparkles,
    iconColor: "#7c3aed",
    role: "user"
  },
  {
    category: "Pages",
    title: "Contacts & Address Book",
    subtitle: "Manage saved recipient names, emails and favorites",
    path: "/user/contacts",
    keywords: ["contact", "contacts", "address book", "recipient", "recipients", "emails", "saved contacts"],
    icon: Users,
    iconColor: "#0891b2",
    role: "user"
  },
  {
    category: "Pages",
    title: "Credit Wallet & Subscription",
    subtitle: "Check balance, view packages and upgrade subscription plan",
    path: "/user/subscription",
    keywords: ["credit", "credits", "wallet", "subscription", "plan", "upgrade", "buy", "pricing", "billing", "packages"],
    icon: CreditCard,
    iconColor: "#ea580c",
    role: "user"
  },
  {
    category: "Pages",
    title: "Trash / Deleted Envelopes",
    subtitle: "View removed documents, restore files or empty trash",
    path: "/user/documents/trash",
    keywords: ["trash", "deleted", "bin", "recycle bin", "archive", "restore"],
    icon: Trash2,
    iconColor: "#dc2626",
    role: "user"
  },

  // Settings Deep Links
  {
    category: "Settings",
    title: "Profile & Personal Information",
    subtitle: "Update full name, company name, job title, timezone and photo",
    path: "/user/settings?tab=profile",
    keywords: ["profile", "setting", "settings", "name", "full name", "company", "timezone", "account", "photo", "avatar", "user profile"],
    icon: User,
    iconColor: "#3b82f6"
  },
  {
    category: "Settings",
    title: "Signature & Initials Settings",
    subtitle: "Configure default handwritten signature text and initials",
    path: "/user/settings?tab=profile",
    keywords: ["signature", "initial", "initials", "sign", "handwriting", "draw signature", "my signature"],
    icon: FileSignature,
    iconColor: "#6366f1"
  },
  {
    category: "Settings",
    title: "Stamp & Company Seal",
    subtitle: "Upload, download or manage official company rubber stamp image",
    path: "/user/settings?tab=profile",
    keywords: ["stamp", "company stamp", "seal", "official seal", "stamp image", "download stamp", "upload stamp"],
    icon: Stamp,
    iconColor: "#059669"
  },
  {
    category: "Settings",
    title: "Security & Change Password",
    subtitle: "Update account password, reset credentials and verify security",
    path: "/user/settings?tab=security",
    keywords: ["password", "security", "change password", "forgot password", "credentials", "auth", "lock"],
    icon: Lock,
    iconColor: "#d97706"
  },
  {
    category: "Settings",
    title: "Reminders & Expiry Schedule",
    subtitle: "Configure automatic email reminder intervals & document expiration days",
    path: "/user/settings?tab=schedule",
    keywords: ["schedule", "reminder", "reminders", "expiry", "expiration", "days", "notifications", "alerts", "auto reminder"],
    icon: Sliders,
    iconColor: "#475569"
  },

  // Status Quick Filters
  {
    category: "Status Filter",
    title: "Completed Documents",
    subtitle: "Filter all fully signed and executed envelopes",
    path: "/user/documents?status=completed",
    keywords: ["completed", "complete", "signed", "done", "finished", "executed"],
    icon: CheckCircle,
    iconColor: "#10b981",
    statusBadge: "completed",
    role: "user"
  },
  {
    category: "Status Filter",
    title: "In Progress Documents",
    subtitle: "Filter documents waiting on recipient actions or signatures",
    path: "/user/documents?status=in_progress",
    keywords: ["in progress", "inprogress", "pending", "signing", "waiting for others", "active"],
    icon: Loader,
    iconColor: "#f59e0b",
    statusBadge: "in-progress",
    role: "user"
  },
  {
    category: "Status Filter",
    title: "Sent Documents",
    subtitle: "Filter envelopes dispatched to recipient outbox",
    path: "/user/documents?status=sent",
    keywords: ["sent", "delivered", "outbox", "dispatched"],
    icon: Clock,
    iconColor: "#3b82f6",
    statusBadge: "sent",
    role: "user"
  },
  {
    category: "Status Filter",
    title: "Draft Documents",
    subtitle: "Filter unfinished document drafts ready to edit or send",
    path: "/user/documents?status=draft",
    keywords: ["draft", "drafts", "unpublished", "work in progress", "uncompleted"],
    icon: FileText,
    iconColor: "#6b7280",
    statusBadge: "draft",
    role: "user"
  },
  {
    category: "Status Filter",
    title: "Declined Documents",
    subtitle: "Filter envelopes declined by one or more signers",
    path: "/user/documents?status=declined",
    keywords: ["declined", "rejected", "refused", "decline"],
    icon: AlertCircle,
    iconColor: "#ef4444",
    statusBadge: "declined",
    role: "user"
  },
  {
    category: "Status Filter",
    title: "Voided Documents",
    subtitle: "Filter cancelled or voided envelopes",
    path: "/user/documents?status=voided",
    keywords: ["voided", "void", "cancelled", "rescinded", "terminated"],
    icon: XCircle,
    iconColor: "#ef4444",
    statusBadge: "voided",
    role: "user"
  },

  // Admin shortcuts
  {
    category: "Admin",
    title: "Admin Dashboard",
    subtitle: "System overview, active users and platform usage metrics",
    path: "/admin/dashboard",
    keywords: ["admin", "dashboard", "overview"],
    icon: LayoutDashboard,
    iconColor: "#2563eb",
    role: "admin"
  },
  {
    category: "Admin",
    title: "User Management",
    subtitle: "Manage registered user accounts, roles and status",
    path: "/admin/users",
    keywords: ["users", "manage users", "user management", "accounts"],
    icon: Users,
    iconColor: "#7c3aed",
    role: "admin"
  },
  {
    category: "Admin",
    title: "Envelope Management",
    subtitle: "Global view of all platform envelopes and audit logs",
    path: "/admin/envelopes",
    keywords: ["admin envelopes", "all envelopes", "envelope management"],
    icon: FileText,
    iconColor: "#0284c7",
    role: "admin"
  }
];

// ============================================
// CUSTOM HOOKS
// ============================================

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const useRecentSearches = (maxItems = SEARCH_CONFIG.MAX_RECENT_SEARCHES) => {
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recentSearches");
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, maxItems));
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error);
    }
  }, [maxItems]);

  const saveRecentSearch = useCallback((query, item) => {
    if (!query || !query.trim()) return;
    const newSearch = {
      id: item?.id || item?.path || Date.now(),
      query: query.trim(),
      filename: item?.filename || item?.title || query.trim(),
      timestamp: Date.now()
    };

    setRecentSearches(prev => {
      const updated = [newSearch, ...prev.filter(s => s.query.toLowerCase() !== newSearch.query.toLowerCase())]
        .slice(0, maxItems);
      try {
        localStorage.setItem("recentSearches", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, [maxItems]);

  return { recentSearches, saveRecentSearch };
};

const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getUserRole = () => {
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.role || "user";
    }

    const token = localStorage.getItem("token");
    if (!token) return "guest";

    const decoded = jwtDecode(token);
    return decoded.role || "user";
  } catch {
    return "user";
  }
};

const formatRelativeDate = (dateString) => {
  if (!dateString) return 'Recent';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recent';
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Recent';
  }
};

// Resolve avatar image from user object (handling Google profile URLs, base64 data, etc.)
const resolveAvatarSrc = (usr) => {
  if (!usr) return null;
  const pic = usr.profile_picture || usr.profile_image || usr.picture || usr.avatar_url || usr.photo_url || usr.avatar;
  if (!pic) return null;
  if (typeof pic === "string") return pic;
  if (pic?.data) {
    return `data:${pic.content_type || 'image/jpeg'};base64,${pic.data}`;
  }
  return null;
};

// ============================================
// SUB-COMPONENTS
// ============================================

const SearchResults = ({
  query,
  results,
  isLoading,
  recentSearches,
  onResultClick,
  onViewAll,
  onRecentClick,
  userRole
}) => {
  const qClean = (query || "").trim().toLowerCase();

  // Match system shortcuts, settings tabs, and status filters
  const matchedShortcuts = useMemo(() => {
    if (!qClean) return [];
    return GLOBAL_SHORTCUTS.filter(s => {
      if (s.role && s.role !== userRole) return false;
      const titleMatch = s.title.toLowerCase().includes(qClean);
      const subtitleMatch = s.subtitle && s.subtitle.toLowerCase().includes(qClean);
      const categoryMatch = s.category.toLowerCase().includes(qClean);
      const keywordMatch = s.keywords.some(k => k.includes(qClean) || qClean.includes(k));
      return titleMatch || subtitleMatch || categoryMatch || keywordMatch;
    });
  }, [qClean, userRole]);

  // Group shortcuts into Settings, Status, and Pages
  const settingsShortcuts = useMemo(() => matchedShortcuts.filter(s => s.category === "Settings"), [matchedShortcuts]);
  const statusShortcuts = useMemo(() => matchedShortcuts.filter(s => s.category === "Status Filter"), [matchedShortcuts]);
  const pageShortcuts = useMemo(() => matchedShortcuts.filter(s => s.category === "Pages" || s.category === "Actions"), [matchedShortcuts]);

  if (!query) {
    // Recent searches & initial view
    return (
      <>
        <div className="signapp-search-header">
          <span className="signapp-search-header-title">
            <History size={14} />
            Recent Searches
          </span>
        </div>

        {recentSearches.length > 0 ? (
          recentSearches.map((search) => (
            <div
              key={`${search.id}-${search.timestamp}`}
              className="signapp-search-item recent"
              onClick={() => onRecentClick(search.query)}
            >
              <div className="signapp-search-item-icon recent">
                <History size={14} />
              </div>
              <div className="signapp-search-item-content">
                <div className="signapp-search-item-title">
                  {search.query}
                </div>
                <div className="signapp-search-item-meta">
                  <FilenameDisplay filename={search.filename} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="signapp-search-empty small">
            <Sparkles size={24} color="#2563eb" />
            <p>Global Search Across Everything</p>
            <span>Search files by name, date, envelope ID, status, or jump to any settings & page</span>
          </div>
        )}

        <div className="signapp-search-tips">
          <span className="tips-label">💡 Search anything:</span>
          <span className="tip">Filename (e.g. "NDA", "Contract", "Offer Letter")</span>
          <span className="tip">Status (e.g. "Completed", "In Progress", "Draft", "Sent")</span>
          <span className="tip">Settings (e.g. "Profile", "Signature", "Stamp", "Password", "Schedule")</span>
          <span className="tip">Date (e.g. "Today", "Yesterday", "2026-10")</span>
        </div>
      </>
    );
  }

  // Loading state
  if (isLoading && results.length === 0 && matchedShortcuts.length === 0) {
    return (
      <div className="signapp-search-loading">
        <Loader size={24} className="spinning" />
        <span>Searching documents, dates, statuses & settings...</span>
      </div>
    );
  }

  // Empty state
  if (results.length === 0 && matchedShortcuts.length === 0) {
    return (
      <div className="signapp-search-empty">
        <Search size={32} />
        <p>No results found for "{query}"</p>
        <span>Try searching by document title, date (e.g. "today"), status ("completed"), or settings</span>
      </div>
    );
  }

  return (
    <>
      {/* 1. Pages & Actions */}
      {pageShortcuts.length > 0 && (
        <>
          <div className="signapp-search-header">
            <span className="signapp-search-header-title">
              <Sparkles size={14} />
              Pages & Navigation ({pageShortcuts.length})
            </span>
          </div>
          {pageShortcuts.map((sc, idx) => {
            const IconComponent = sc.icon || Sparkles;
            return (
              <div
                key={`page-sc-${idx}`}
                className="signapp-search-item shortcut"
                onClick={() => onResultClick({ isShortcut: true, path: sc.path, filename: sc.title })}
              >
                <div className="signapp-search-item-icon" style={{ backgroundColor: `${sc.iconColor}15`, color: sc.iconColor }}>
                  <IconComponent size={18} />
                </div>
                <div className="signapp-search-item-content">
                  <div className="signapp-search-item-title">
                    {sc.title}
                    <span className="signapp-search-item-status">
                      <span className="status-badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>{sc.category}</span>
                    </span>
                  </div>
                  <div className="signapp-search-item-meta">
                    <span className="meta-item">{sc.subtitle}</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </div>
            );
          })}
        </>
      )}

      {/* 2. Settings Deep Links */}
      {settingsShortcuts.length > 0 && (
        <>
          <div className="signapp-search-header">
            <span className="signapp-search-header-title">
              <Sliders size={14} />
              Settings & Account ({settingsShortcuts.length})
            </span>
          </div>
          {settingsShortcuts.map((sc, idx) => {
            const IconComponent = sc.icon || User;
            return (
              <div
                key={`settings-sc-${idx}`}
                className="signapp-search-item shortcut"
                onClick={() => onResultClick({ isShortcut: true, path: sc.path, filename: sc.title })}
              >
                <div className="signapp-search-item-icon" style={{ backgroundColor: `${sc.iconColor}15`, color: sc.iconColor }}>
                  <IconComponent size={18} />
                </div>
                <div className="signapp-search-item-content">
                  <div className="signapp-search-item-title">
                    {sc.title}
                    <span className="signapp-search-item-status">
                      <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>Settings</span>
                    </span>
                  </div>
                  <div className="signapp-search-item-meta">
                    <span className="meta-item">{sc.subtitle}</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </div>
            );
          })}
        </>
      )}

      {/* 3. Status Quick Filters */}
      {statusShortcuts.length > 0 && (
        <>
          <div className="signapp-search-header">
            <span className="signapp-search-header-title">
              <CheckCircle size={14} />
              Filter By Status ({statusShortcuts.length})
            </span>
          </div>
          {statusShortcuts.map((sc, idx) => {
            const IconComponent = sc.icon || CheckCircle;
            return (
              <div
                key={`status-sc-${idx}`}
                className="signapp-search-item shortcut"
                onClick={() => onResultClick({ isShortcut: true, path: sc.path, filename: sc.title })}
              >
                <div className="signapp-search-item-icon" style={{ backgroundColor: `${sc.iconColor}15`, color: sc.iconColor }}>
                  <IconComponent size={18} />
                </div>
                <div className="signapp-search-item-content">
                  <div className="signapp-search-item-title">
                    {sc.title}
                    <span className="signapp-search-item-status">
                      <span className={`status-badge status-${sc.statusBadge || 'sent'}`}>{sc.title.replace('Documents', '')}</span>
                    </span>
                  </div>
                  <div className="signapp-search-item-meta">
                    <span className="meta-item">{sc.subtitle}</span>
                  </div>
                </div>
                <ArrowRight size={16} color="#94a3b8" />
              </div>
            );
          })}
        </>
      )}

      {/* 4. Document Results from Server */}
      {results.length > 0 && (
        <>
          <div className="signapp-search-header">
            <span className="signapp-search-header-title">
              <FileText size={14} />
              Documents & Envelopes
            </span>
            <span className="signapp-search-header-count">
              {results.length} found
            </span>
          </div>

          {results.map((doc) => {
            const statusKey = doc.status ? String(doc.status).toLowerCase().replace(/[\s-]/g, '_') : 'draft';
            const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.draft;
            const StatusIcon = status.icon;

            return (
              <div
                key={doc.id}
                className="signapp-search-item"
                onClick={() => onResultClick(doc)}
              >
                <div className="signapp-search-item-icon">
                  <FileText size={18} />
                </div>
                <div className="signapp-search-item-content">
                  <div className="signapp-search-item-title">
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <FilenameDisplay
                        filename={doc.filename || doc.title}
                        middleTruncate={true}
                      />
                    </div>
                    <span className="signapp-search-item-status">
                      <StatusIcon size={14} color={status.color} />
                      <span className={`status-badge status-${statusKey}`}>
                        {status.label}
                      </span>
                    </span>
                  </div>
                  <div className="signapp-search-item-meta">
                    <span className="meta-item">
                      <Clock size={12} />
                      {formatRelativeDate(doc.uploaded_at)}
                    </span>
                    <span className="meta-item">
                      <Eye size={12} />
                      {doc.recipient_count || 0} recipients
                    </span>
                    {doc.envelope_id && (
                      <span className="meta-item envelope">
                        ID: {doc.envelope_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Footer link to view all */}
      <div
        className="signapp-search-view-all"
        onClick={onViewAll}
      >
        <span>View all matching documents in My Documents</span>
        <ChevronRight size={16} />
      </div>
    </>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // Local user state synchronized with broadcast events
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : authUser;
    } catch {
      return authUser;
    }
  });

  const [avatarError, setAvatarError] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Refs
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Custom hooks
  const debouncedQuery = useDebounce(searchQuery, SEARCH_CONFIG.DEBOUNCE_DELAY);
  const { recentSearches, saveRecentSearch } = useRecentSearches();

  // Keep currentUser synced with authUser
  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
      setAvatarError(false);
    }
  }, [authUser]);

  // Listen to profile update broadcast events
  useEffect(() => {
    const handleProfileUpdated = (e) => {
      if (e.detail) {
        setCurrentUser(e.detail);
        setAvatarError(false);
      }
    };
    window.addEventListener("user_profile_updated", handleProfileUpdated);
    return () => {
      window.removeEventListener("user_profile_updated", handleProfileUpdated);
    };
  }, []);

  const userRole = currentUser?.role || getUserRole();

  // Live document search effect
  useEffect(() => {
    const searchDocuments = async () => {
      const trimmedQuery = debouncedQuery.trim();

      if (trimmedQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get(
          `/documents/search?q=${encodeURIComponent(trimmedQuery)}&limit=${SEARCH_CONFIG.MAX_DOC_RESULTS}`
        );

        const results = Array.isArray(response.data)
          ? response.data
          : (response.data?.results || []);

        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchDocuments();
  }, [debouncedQuery]);

  // Click outside to dismiss search results
  useClickOutside(searchRef, () => setShowResults(false));

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowResults(true);
      }
      if (e.key === 'Escape') {
        setShowResults(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Result Click Navigation Handler
  const handleResultClick = useCallback((item) => {
    saveRecentSearch(searchQuery, item);
    setShowResults(false);
    setSearchQuery("");

    if (item.isShortcut) {
      navigate(item.path);
      return;
    }

    if (userRole === 'admin') {
      navigate(`/admin/envelopes`);
      return;
    }

    if (item.status === 'draft') {
      navigate(`/user/documentbuilder/${item.id}`);
    } else if (item.status === 'in_progress' || item.status === 'sent') {
      navigate(`/user/prepare-send/${item.id}`);
    } else if (item.status === 'completed' || item.status === 'voided' || item.status === 'declined') {
      navigate(`/user/document-summary/${item.id}`);
    } else {
      navigate(`/user/documents`);
    }
  }, [searchQuery, saveRecentSearch, navigate, userRole]);

  // View all results in MyDocuments with search query param
  const handleViewAllResults = useCallback(() => {
    setShowResults(false);
    const q = searchQuery.trim();
    if (userRole === 'admin') {
      navigate(`/admin/envelopes`);
    } else {
      navigate(q ? `/user/documents?search=${encodeURIComponent(q)}` : `/user/documents`);
    }
  }, [navigate, userRole, searchQuery]);

  const handleRecentClick = useCallback((query) => {
    setSearchQuery(query);
    setShowResults(true);
    inputRef.current?.focus();
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    inputRef.current?.focus();
  }, []);

  const avatarSrc = resolveAvatarSrc(currentUser);

  return (
    <header className="signapp-navbar">
      <div className="signapp-navbar-container">
        {/* Left Section */}
        <div className="signapp-navbar-left">
          <button
            onClick={toggleSidebar}
            className="signapp-navbar-menu-btn"
            title="Toggle Sidebar"
          >
            <Menu className="signapp-navbar-menu-icon" />
          </button>

          <h1
            className="signapp-navbar-logo"
            onClick={() => {
              if (userRole === 'admin') navigate('/admin/dashboard');
              else if (userRole === 'user') navigate('/user/dashboard');
              else if (userRole === 'recipient') navigate('/recipient/dashboard');
              else navigate('/');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (userRole === 'admin') navigate('/admin/dashboard');
                else if (userRole === 'user') navigate('/user/dashboard');
                else if (userRole === 'recipient') navigate('/recipient/dashboard');
                else navigate('/');
              }
            }}
          >
            Esigniva
          </h1>
        </div>

        {/* Right Section */}
        <div className="signapp-navbar-right">
          <CreditBadge />

          {/* Global Search Bar */}
          <div className="signapp-navbar-search-wrapper" ref={searchRef}>
            <div className={`signapp-navbar-search ${showResults ? 'active' : ''}`}>
              <Search className="signapp-navbar-search-icon" />

              <input
                ref={inputRef}
                type="text"
                placeholder="Search documents, dates, status, settings... (⌘K)"
                className="signapp-navbar-search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleViewAllResults();
                  }
                }}
                aria-label="Search documents and portal"
              />

              {searchQuery && (
                <button
                  className="signapp-navbar-search-clear"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

              {isSearching && (
                <div className="signapp-navbar-search-spinner">
                  <Loader size={16} className="spinning" />
                </div>
              )}
            </div>

            {/* Global Search Results Dropdown */}
            {showResults && (
              <div className="signapp-search-results">
                <SearchResults
                  query={searchQuery}
                  results={searchResults}
                  isLoading={isSearching}
                  recentSearches={recentSearches}
                  onResultClick={handleResultClick}
                  onViewAll={handleViewAllResults}
                  onRecentClick={handleRecentClick}
                  userRole={userRole}
                />
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div
            className="signapp-navbar-profile"
            onClick={userRole === "user" ? () => navigate("/user/settings") : undefined}
            title={userRole === "user" ? "Account & Profile Settings" : ""}
            style={{ cursor: userRole === "user" ? "pointer" : "default" }}
          >
            {avatarSrc && !avatarError ? (
              <img
                src={avatarSrc}
                className="signapp-navbar-avatar"
                alt="profile"
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="signapp-navbar-avatar-fallback">
                {currentUser?.full_name ? (
                  <span className="signapp-avatar-initial">
                    {currentUser.full_name.charAt(0).toUpperCase()}
                  </span>
                ) : currentUser?.email ? (
                  <span className="signapp-avatar-initial">
                    {currentUser.email.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User size={18} />
                )}
              </div>
            )}

            <span className="signapp-navbar-username desktop-only">
              {currentUser?.full_name || currentUser?.email || "Esigniva User"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Navbar);

