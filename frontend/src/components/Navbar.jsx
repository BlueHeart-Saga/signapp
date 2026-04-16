import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Chip, Tooltip } from "@mui/material";
import {
  Search,
  Bell,
  User,
  Settings,
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
  Sparkles
} from 'lucide-react';

import SubscriptionBadge from "./SubscriptionBadge";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../style/Navbar.css";

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 400,
  MAX_RESULTS: 8,
  MAX_RECENT_SEARCHES: 5,
  MIN_QUERY_LENGTH: 2
};

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: '#10b981', label: 'Completed' },
  in_progress: { icon: Loader, color: '#f59e0b', label: 'In Progress' },
  sent: { icon: Clock, color: '#3b82f6', label: 'Sent' },
  draft: { icon: FileText, color: '#6b7280', label: 'Draft' },
  voided: { icon: XCircle, color: '#ef4444', label: 'Voided' },
  declined: { icon: AlertCircle, color: '#ef4444', label: 'Declined' }
};

// ============================================
// CUSTOM HOOKS
// ============================================

/**
 * Debounce hook for search input
 */
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

/**
 * Hook for managing recent searches in localStorage
 */
const useRecentSearches = (maxItems = SEARCH_CONFIG.MAX_RECENT_SEARCHES) => {
  const [recentSearches, setRecentSearches] = useState([]);

  // Load from localStorage on mount
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

  // Save to localStorage
  const saveRecentSearch = useCallback((query, document) => {
    const newSearch = {
      id: document.id,
      query,
      filename: document.filename,
      timestamp: Date.now()
    };

    setRecentSearches(prev => {
      const updated = [newSearch, ...prev.filter(s => s.id !== document.id)]
        .slice(0, maxItems);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  }, [maxItems]);

  return { recentSearches, saveRecentSearch };
};

/**
 * Hook for click outside detection
 */
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

/**
 * Hook for keyboard shortcuts
 */
const useKeyboardShortcuts = (inputRef, onEscape, onFocus) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onFocus?.();
      }
      // Escape to close
      if (e.key === 'Escape') {
        onEscape?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onFocus]);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get user role from localStorage or token
 */
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

/**
 * Format date relative to now
 */
const formatRelativeDate = (dateString) => {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  } catch {
    return 'Invalid date';
  }
};

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Subscription Warning Chip
 */
const SubscriptionWarning = ({ subscription, onClick }) => {
  if (!subscription) return null;

  const isExpired = subscription.status === "expired";
  const showWarning = isExpired || (subscription.days_remaining <= 3);

  if (!showWarning) return null;

  const tooltipTitle = isExpired
    ? "Your subscription has expired. Renew to continue using all features."
    : `Your subscription expires in ${subscription.days_remaining} days`;

  const label = isExpired ? "Expired" : `${subscription.days_remaining}d left`;

  return (
    <Tooltip title={tooltipTitle} arrow>
      <Chip
        color="warning"
        size="small"
        label={label}
        onClick={onClick}
        sx={{
          fontWeight: 600,
          cursor: 'pointer',
          '&:hover': { opacity: 0.9 }
        }}
      />
    </Tooltip>
  );
};

/**
 * Search Results Component
 */
const SearchResults = ({
  query,
  results,
  isLoading,
  recentSearches,
  onResultClick,
  onViewAll,
  onRecentClick
}) => {
  if (!query) {
    // Recent searches view
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
                  <span>{search.filename}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="signapp-search-empty small">
            <Sparkles size={24} />
            <p>No recent searches</p>
            <span>Start typing to search documents</span>
          </div>
        )}

        <div className="signapp-search-tips">
          <span className="tips-label">💡 Search tips:</span>
          <span className="tip">Use "filename:contract" to search by name</span>
          <span className="tip">Use "status:completed" to filter by status</span>
        </div>
      </>
    );
  }

  // Search results view
  if (isLoading) {
    return (
      <div className="signapp-search-loading">
        <Loader size={24} className="spinning" />
        <span>Searching documents...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="signapp-search-empty">
        <Search size={32} />
        <p>No documents found for "{query}"</p>
        <span>Try different keywords or filters</span>
      </div>
    );
  }

  return (
    <>
      <div className="signapp-search-header">
        <span className="signapp-search-header-title">
          <Search size={14} />
          Search Results
        </span>
        <span className="signapp-search-header-count">
          {results.length} found
        </span>
      </div>

      {results.map((doc) => {
        const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
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
                {doc.filename}
                <span className="signapp-search-item-status">
                  <StatusIcon size={14} color={status.color} />
                  <span className={`status-badge status-${doc.status}`}>
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

      <div
        className="signapp-search-view-all"
        onClick={onViewAll}
      >
        <span>View all results</span>
        <ChevronRight size={16} />
      </div>
    </>
  );
};

/**
 * Icon Button Component
 */
const IconButton = ({ icon: Icon, badge, onClick, title, className = "" }) => (
  <button
    className={`signapp-navbar-icon-btn ${className}`}
    onClick={onClick}
    title={title}
  >
    <Icon className="signapp-navbar-icon" />
    {badge && <span className="signapp-navbar-badge" />}
  </button>
);

// ============================================
// MAIN COMPONENT
// ============================================

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, subscription } = useAuth();

  // State
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

  // Derived state
  const userRole = user?.role || "user";
  const showSubscriptionWarning = subscription && (
    subscription.status === "expired" || subscription.days_remaining <= 3
  );

  // ============================================
  // EFFECTS
  // ============================================

  // Search documents
  // In your Navbar component, update the search effect:
  useEffect(() => {
    const searchDocuments = async () => {
      const trimmedQuery = debouncedQuery.trim();

      if (trimmedQuery.length < 2) { // Changed from 1 to 2
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get(
          `/documents/search?q=${encodeURIComponent(trimmedQuery)}&limit=8`
        );

        // Handle both array response and wrapped response
        const results = Array.isArray(response.data) ? response.data :
          (response.data?.results || []);

        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);

        // Show user-friendly error
        if (error.response?.status === 400) {
          console.log("Invalid search query, showing empty results");
          setSearchResults([]);
        } else {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    searchDocuments();
  }, [debouncedQuery]);

  // Click outside handler
  useClickOutside(searchRef, () => setShowResults(false));

  // Keyboard shortcuts
  useKeyboardShortcuts(
    inputRef,
    () => setShowResults(false),
    () => inputRef.current?.focus()
  );

  // ============================================
  // HANDLERS
  // ============================================

  const handleDocumentClick = useCallback((doc) => {
    saveRecentSearch(searchQuery, doc);
    setShowResults(false);
    setSearchQuery("");

    navigate(userRole === 'admin'
      ? `/admin/documents/${doc.id}`
      : `/user/documents/${doc.id}`
    );
  }, [searchQuery, saveRecentSearch, navigate, userRole]);

  const handleViewAllResults = useCallback(() => {
    setShowResults(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  }, [searchQuery, navigate]);

  const handleRecentClick = useCallback((query) => {
    setSearchQuery(query);
    inputRef.current?.focus();
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    inputRef.current?.focus();
  }, []);

  // ============================================
  // RENDER
  // ============================================

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
            onClick={() => navigate('/')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && navigate('/')}
          >
            SafeSign
          </h1>
        </div>

        {/* Right Section */}
        <div className="signapp-navbar-right">
          <SubscriptionBadge subscription={subscription} />

          {showSubscriptionWarning && (
            <SubscriptionWarning
              subscription={subscription}
              onClick={() => navigate('/subscription')}
            />
          )}

          {/* Search */}
          <div className="signapp-navbar-search-wrapper" ref={searchRef}>
            <div className={`signapp-navbar-search ${showResults ? 'active' : ''}`}>
              <Search className="signapp-navbar-search-icon" />

              <input
                ref={inputRef}
                type="text"
                placeholder="Search documents... (⌘K)"
                className="signapp-navbar-search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                aria-label="Search documents"
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

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="signapp-search-results">
                <SearchResults
                  query={searchQuery}
                  results={searchResults}
                  isLoading={isSearching}
                  recentSearches={recentSearches}
                  onResultClick={handleDocumentClick}
                  onViewAll={handleViewAllResults}
                  onRecentClick={handleRecentClick}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {/* <IconButton
            icon={Bell}
            badge
            onClick={() => { }}
            title="Notifications"
          />

          {userRole === "user" && (
            <IconButton
              icon={Settings}
              onClick={() => navigate('/user/settings')}
              title="Settings"
              className="navbar-settings-icon"
            />
          )} */}
          <div
            className="signapp-navbar-profile"
            onClick={userRole === "user" ? () => navigate("/user/settings") : undefined}
            title={userRole === "user" ? "My Profile" : ""}
            style={{ cursor: userRole === "user" ? "pointer" : "default" }}
          >
            {user?.profile_picture ? (
              <img
                src={`data:${user.profile_picture.content_type};base64,${user.profile_picture.data}`}
                className="signapp-navbar-avatar"
                alt="profile"
              />
            ) : (
              <div className="signapp-navbar-avatar-fallback">
                <User size={18} />
              </div>
            )}

            <span className="signapp-navbar-username desktop-only">
              {user?.full_name || user?.email || "SafeSign User"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Navbar);