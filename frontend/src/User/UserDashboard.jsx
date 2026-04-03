import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, FileText, CheckCircle, XCircle, AlertCircle,
  Upload, Send, FileCheck, Search, Filter, Bell,
  User, Settings, Menu, MoreVertical, Download,
  Eye, Trash2, TrendingUp, Users, Clock3,
  Mail, Calendar, FilePlus, RefreshCw, AlertTriangle,
  History, Plus, X, Edit, Shield, FilePlus2, MailWarning
} from 'lucide-react';
import { FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../style/UserDashboard.css';
import {
  getDocumentStats,
  getRecentActivities,
  downloadDocument,
  voidDocument,
  restoreDocument,
  softDeleteDocument,
  permanentDeleteDocument,
  viewDocumentUrl,
  signedPreviewUrl
} from '../services/DocumentAPI';

// Import MUI components
import { Snackbar, Alert } from "@mui/material";

import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Tooltip, Legend, XAxis, YAxis
} from "recharts";


// Import components
import DocumentViewerModal from "../components/DocumentViewerModal";
import SignedPreviewModal from "../components/SignedPreviewModal";
import TimelineDrawer from "../components/TimelineDrawer";
import RecipientManager from "./RecipientSelector";
import UploadPreviewModal from "../components/UploadPreviewModal";
import TemplateBrowser from "./TemplateBrowser";
import AITemplateBrowser from './AITemplateBrowser';
import { setPageTitle } from "../utils/pageTitle";
import DashboardAnalyticsInline from "../components/DashboardAnalyticsInline";
// import DashboardAnalytics from "../components/DashboardAnalytics";
// Import API functions
import templatesAPI from "../services/api";
import { addFileToDocument, uploadDocument } from "../services/DocumentAPI";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";
const token = localStorage.getItem("token");

const UserDashboard = () => {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);

  // Modal states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [signedOpen, setSignedOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);

  // Recipient Manager state
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showRecipientManager, setShowRecipientManager] = useState(false);

  // Upload states
  const [file, setFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [templateBrowserOpen, setTemplateBrowserOpen] = useState(false);

  const [defaultRecipientTab, setDefaultRecipientTab] = useState("recipients");

  const [statsOpen, setStatsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);

  const [renaming, setRenaming] = useState(false);
  const [renameDocId, setRenameDocId] = useState(null);
  const [newFilename, setNewFilename] = useState("");

  const [analyticsData, setAnalyticsData] = useState({
    documents: {},
    recipients: {},
    fields: {},
    activities: {},
    subscription: {},
    contacts: {}
  });

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    documents: true,
    recipients: true,
    fields: true,
    activity: true,
    subscription: true,
    contacts: true
  });

  // Merge state
  const [mergeDoc, setMergeDoc] = useState(null);
  const [mergeOpen, setMergeOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    setPageTitle(
      "User Dashboard",
      "Manage your documents, templates, and signatures from your SafeSign user dashboard."
    );
  }, []);

  // Load real data
  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
      if (!e.target.closest('.signapp-dropdown-menu')) {
        setOpenMenuId(null);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);



  //   const analyticsData = stats.map(s => ({
  //   name: s.label.replace("_", " "),
  //   value: Number(s.value),
  // }));

  const chartColors = [
    "#6366f1", // indigo
    "#22c55e", // green
    "#f97316", // orange
    "#ef4444", // red
    "#0ea5e9", // blue
    "#a855f7"  // purple
  ];



  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, recentActivities] = await Promise.all([
        getDocumentStats(),
        getRecentActivities()
      ]);

      // Process stats
      const draft = statsData.draft || 0;
      const sent = statsData.sent || 0;
      const inProgress = statsData.in_progress || 0;
      const completed = statsData.completed || 0;
      const declined = statsData.declined || 0;
      const expired = statsData.expired || 0;
      const voided = statsData.voided || 0;
      const deletedDocs = statsData.deleted || 0;

      // Update stats
      setStats([
        {
          icon: <FileText className="signapp-stats-icon" />,
          value: draft.toString(),
          label: 'draft',
          change: getChangePercentage(draft),
          color: 'signapp-stat-grey',
          lightBg: 'signapp-stat-bg-grey',
          textColor: 'signapp-stat-text-grey',
          onClick: () => navigate('/user/documents?status=draft')
        },
        {
          icon: <Send className="signapp-stats-icon" />,
          value: sent.toString(),
          label: 'sent',
          change: getChangePercentage(sent),
          color: 'signapp-stat-blue',
          lightBg: 'signapp-stat-bg-blue',
          textColor: 'signapp-stat-text-blue',
          onClick: () => navigate('/user/documents?status=sent')
        },
        {
          icon: <Clock className="signapp-stats-icon" />,
          value: inProgress.toString(),
          label: 'in_progress',
          change: getChangePercentage(inProgress),
          color: 'signapp-stat-amber',
          lightBg: 'signapp-stat-bg-amber',
          textColor: 'signapp-stat-text-amber',
          onClick: () => navigate('/user/documents?status=in_progress')
        },
        {
          icon: <CheckCircle className="signapp-stats-icon" />,
          value: completed.toString(),
          label: 'completed',
          change: getChangePercentage(completed),
          color: 'signapp-stat-green',
          lightBg: 'signapp-stat-bg-green',
          textColor: 'signapp-stat-text-green',
          onClick: () => navigate('/user/documents?status=completed')
        },
        {
          icon: <XCircle className="signapp-stats-icon" />,
          value: declined.toString(),
          label: 'declined',
          change: getChangePercentage(declined),
          color: 'signapp-stat-red',
          lightBg: 'signapp-stat-bg-red',
          textColor: 'signapp-stat-text-red',
          onClick: () => navigate('/user/documents?status=declined')
        },
        {
          icon: <AlertTriangle className="signapp-stats-icon" />,
          value: expired.toString(),
          label: 'expired',
          change: getChangePercentage(expired),
          color: 'signapp-stat-orange',
          lightBg: 'signapp-stat-bg-orange',
          textColor: 'signapp-stat-text-orange',
          onClick: () => navigate('/user/documents?status=expired')
        },
        {
          icon: <AlertCircle className="signapp-stats-icon" />,
          value: voided.toString(),
          label: 'voided',
          change: getChangePercentage(voided),
          color: 'signapp-stat-purple',
          lightBg: 'signapp-stat-bg-purple',
          textColor: 'signapp-stat-text-purple',
          onClick: () => navigate('/user/documents?status=voided')
        },
        {
          icon: <Trash2 className="signapp-stats-icon" />,
          value: deletedDocs.toString(),
          label: 'deleted',
          change: getChangePercentage(deletedDocs),
          color: 'signapp-stat-black',
          lightBg: 'signapp-stat-bg-black',
          textColor: 'signapp-stat-text-black',
          onClick: () => navigate('/user/documents?status=deleted')
        }
      ]);

      // Process activities from real data
      const processedActivities = recentActivities.map(a => ({
        id: a.id || a._id,
        title: a.document_name || a.filename || 'Untitled',
        status: a.status,
        date: a.timestamp ? formatTimeAgo(a.timestamp) : 'Unknown time',
        signersTotal: Number(a.signers_total ?? 0),
        signersCompleted: Number(a.signers_completed ?? 0),
        description: getActivityDescription(a),
        sender: a.sender || a.email || 'System',
        documentId: a.document_id || a.doc_id,
        documentData: a // Store full document data for actions
      }));

      setActivities(processedActivities);

      // Fetch analytics data
      await fetchAnalyticsData();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load dashboard data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getChangePercentage = (data) => {
    if (typeof data !== "number") return '+0';
    return `+${data}`;
  };

  const getActivityDescription = (activity) => {
    const action = activity.action || activity.event || activity.type;

    const map = {
      document_uploaded: 'Document uploaded',
      document_created: 'Document created',
      document_sent: 'Document sent for signing',
      document_viewed: 'Document viewed',
      document_completed: 'Document completed',
      document_declined: 'Document declined',
      document_expired: 'Document expired',
      recipient_added: 'Recipient added',
      recipient_signed: 'Recipient completed signing',
      reminder_sent: 'Reminder email sent'
    };

    return map[action] || 'Activity recorded';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: {
        bg: 'signapp-badge-bg-grey',
        text: 'signapp-badge-text-grey',
        icon: <FileText className="signapp-badge-icon" />,
        label: 'draft'
      },
      sent: {
        bg: 'signapp-badge-bg-blue',
        text: 'signapp-badge-text-blue',
        icon: <Send className="signapp-badge-icon" />,
        label: 'sent'
      },
      in_progress: {
        bg: 'signapp-badge-bg-amber',
        text: 'signapp-badge-text-amber',
        icon: <Clock className="signapp-badge-icon" />,
        label: 'in_progress'
      },
      completed: {
        bg: 'signapp-badge-bg-green',
        text: 'signapp-badge-text-green',
        icon: <CheckCircle className="signapp-badge-icon" />,
        label: 'completed'
      },
      declined: {
        bg: 'signapp-badge-bg-red',
        text: 'signapp-badge-text-red',
        icon: <XCircle className="signapp-badge-icon" />,
        label: 'declined'
      },
      expired: {
        bg: 'signapp-badge-bg-orange',
        text: 'signapp-badge-text-orange',
        icon: <AlertTriangle className="signapp-badge-icon" />,
        label: 'expired'
      },
      voided: {
        bg: 'signapp-badge-bg-purple',
        text: 'signapp-badge-text-purple',
        icon: <AlertCircle className="signapp-badge-icon" />,
        label: 'voided'
      },
      deleted: {
        bg: 'signapp-badge-bg-black',
        text: 'signapp-badge-text-black',
        icon: <Trash2 className="signapp-badge-icon" />,
        label: 'deleted'
      }
    };

    return badges[status] || badges.draft;
  };

  // Document action handlers
  const handleViewDocument = (documentId, title) => {
    setActiveDocId(documentId);
    setActiveDocument({ id: documentId, title });
    setViewerOpen(true);
  };

  const handleDownloadDocument = async (documentId, filename) => {
    try {
      await downloadDocument(documentId, filename);
      setSnackbar({
        open: true,
        message: 'Download started successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Download failed:', error);
      setSnackbar({
        open: true,
        message: 'Download failed',
        severity: 'error'
      });
    }
  };

  // Prepare & Send - navigate with document data
  const handlePrepareSend = (documentId, title) => {
    navigate(`/user/prepare-send/${documentId}`, {
      state: {
        document: { id: documentId, title }
      }
    });
  };


  const handleViewTimeline = (documentId) => {
    setActiveDocId(documentId);
    setTimelineOpen(true);
  };

  const handleManageRecipients = (documentId, title) => {
    setSelectedDocument({ id: documentId, title });
    setShowRecipientManager(true);
    setDefaultRecipientTab("manage");
  };


  const handleBuildTemplate = (documentId) => {
    navigate(`/user/documentbuilder/${documentId}`);
  };

  const handleVoidDocument = async (documentId, documentTitle) => {
    if (!window.confirm(`Void "${documentTitle}"? This will prevent further signing.`)) return;
    try {
      await voidDocument(documentId);
      setSnackbar({
        open: true,
        message: 'Document voided successfully',
        severity: 'success'
      });
      loadDashboardData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to void document',
        severity: 'error'
      });
    }
  };

  const handleRestoreDocument = async (documentId, documentTitle) => {
    if (!window.confirm(`Restore "${documentTitle}"?`)) return;
    try {
      await restoreDocument(documentId);
      setSnackbar({
        open: true,
        message: 'Document restored successfully',
        severity: 'success'
      });
      loadDashboardData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to restore document',
        severity: 'error'
      });
    }
  };

  const handleSoftDelete = async (documentId, documentTitle) => {
    if (!window.confirm(`Move "${documentTitle}" to trash?`)) return;
    try {
      await softDeleteDocument(documentId);
      setSnackbar({
        open: true,
        message: 'Document moved to trash',
        severity: 'success'
      });
      loadDashboardData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete document',
        severity: 'error'
      });
    }
  };

  const handlePermanentDelete = async (documentId, documentTitle) => {
    if (!window.confirm(`Permanently delete "${documentTitle}"? This cannot be undone.`)) return;
    try {
      await permanentDeleteDocument(documentId);
      setSnackbar({
        open: true,
        message: 'Document permanently deleted',
        severity: 'success'
      });
      loadDashboardData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete document',
        severity: 'error'
      });
    }
  };

  const handleSendReminder = (documentId, title) => {
    setSelectedDocument({ id: documentId, title });
    setShowRecipientManager(true);
    setDefaultRecipientTab("send");



    // Open directly in SEND tab
    setTimeout(() => {
      const modal = document.querySelector('.recipient-manager-modal');
      if (modal) {
        // no-op, just ensuring modal mounted before props update
      }
    }, 50);
  };


  const handleAddMergeFile = (documentId, title) => {
    setMergeDoc({ id: documentId, filename: title });
    setMergeOpen(true);
  };

  const handleViewSignedPreview = (documentId, title) => {
    setActiveDocId(documentId);
    setActiveDocument({ id: documentId, title });
    setSignedOpen(true);
  };

  // Template handlers
  const handleTemplateSelect = async (template) => {
    try {
      setLoading(true);

      const result = await templatesAPI.createFromTemplate(
        template.originalData.id,
        `Copy of ${template.name}`
      );

      setSnackbar({
        open: true,
        message: `Document created successfully from "${template.name}" template!`,
        severity: "success",
      });

      loadDashboardData();
      setShowTemplateBrowser(false);

    } catch (error) {
      console.error('Error creating from template:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create document from template',
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateUse = (template) => {
    console.log('Template selected for use:', template);
    setTemplateBrowserOpen(false);
  };

  // Upload handlers
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewFile(selectedFile);
    setPreviewOpen(true);
  };

  const handleUpload = async (uploadFile) => {
    if (!uploadFile) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      await uploadDocument(uploadFile, setUploadProgress);

      setSnackbar({
        open: true,
        message: "Document uploaded successfully",
        severity: "success",
      });

      loadDashboardData();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Upload failed",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleMergeFile = async () => {
    if (!mergeDoc || !file) return;

    try {
      await addFileToDocument(mergeDoc.id, file);
      setSnackbar({
        open: true,
        message: "File merged successfully",
        severity: "success"
      });
      setMergeOpen(false);
      setFile(null);
      loadDashboardData();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Merge failed",
        severity: "error"
      });
    }
  };

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      // Document Analytics
      const docStats = await getDocumentStats();
      const { getCompleteAnalytics } = await import('../services/DocumentAPI');
      // You'll need to implement these API functions in your DocumentAPI service
      // For now, using placeholder data
      setAnalyticsData({
        documents: {
          total: docStats.total || 0,
          draft: docStats.draft || 0,
          sent: docStats.sent || 0,
          in_progress: docStats.in_progress || 0,
          completed: docStats.completed || 0,
          declined: docStats.declined || 0,
          expired: docStats.expired || 0,
          voided: docStats.voided || 0,
          deleted: docStats.deleted || 0
        },
        recipients: {
          total: 0,
          invited: 0,
          viewed: 0,
          in_progress: 0,
          completed: 0,
          declined: 0,
          avg_signing_time: 0,
          completion_rate: 0
        },
        fields: {
          total_fields: 0,
          completed_fields: 0,
          completion_percentage: 0,
          signatures: { total: 0, completed: 0, percentage: 0 },
          initials: { total: 0, completed: 0, percentage: 0 },
          form_fields: { total: 0, completed: 0, percentage: 0 },
          checkboxes: { total: 0, completed: 0, percentage: 0 }
        },
        activities: {
          total_activities: activities.length,
          counts: {
            viewed: 0,
            downloaded: 0,
            signed: 0,
            completed: 0,
            declined: 0,
            voided: 0,
            other: 0
          },
          timeline: []
        },
        subscription: {
          has_active: false,
          status: 'inactive',
          plan_name: 'No Active Plan',
          days_remaining: 0,
          total_revenue: 0,
          total_payments: 0,
          payment_success_rate: 0,
          is_trial: false
        },
        contacts: {
          total_contacts: 0,
          frequent_recipients: 0,
          unique_contacts: 0,
          recent_contacts: 0
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };


  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigation handlers
  const handleUploadDocument = () => navigate('/user/documents');
  const handleRequestSignature = () => navigate('/user/documents');
  const handleViewTemplates = () => navigate('/user/templates');
  const handleViewAITemplates = () => navigate('/user/ai-template');

  const filteredActivities = activeFilter === 'all'
    ? activities
    : activities.filter(activity => activity.status === activeFilter);

  const displayedActivities = showAllActivities ? filteredActivities : filteredActivities.slice(0, 4);

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
    <div className="signapp-dashboard">
      <main className="signapp-main">
        {/* Welcome Section */}
        <div className="signapp-welcome-section">
          <div className="signapp-welcome-header">
            <div>
              <h2 className="signapp-welcome-title">Welcome back!</h2>
              <p className="signapp-welcome-subtitle">Here's what's happening with your documents today.</p>
            </div>
            <div className="signapp-welcome-header">

              <button
                onClick={loadDashboardData}
                className="ss-refresh-dashboard-btn"
                title="Refresh dashboard"
              >
                <RefreshCw size={16} className="ss-refresh-icon-animate" />
                Refresh
              </button>

              <button
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                className="ss-analytics-toggle-btn"
              >
                <TrendingUp size={16} />
                Analytics
              </button>
            </div>
          </div>
        </div>
        {/* <div className="signapp-ai-spotlight" onClick={handleViewAITemplates}>
          <div className="signapp-ai-spotlight-content">
            <h3>Start Your Business</h3>
          <p>Create smart and instantly using and View your activity, recent documents, and quick actions from your SafeSign.</p> 
            <button className="signapp-ai-btn">Explore AI Templates</button>
          </div>
        </div> */}

        {/* Quick Actions */}
        <div className="signapp-quick-actions">

          {/* Upload */}
          <button className="signapp-action-btn signapp-video-bg" onClick={handleUploadDocument}>
            <video className="signapp-bg-video" autoPlay muted loop playsInline>
              <source src="/videos/upload.mp4" type="video/mp4" />
            </video>

            <div className="signapp-action-icon-wrapper">
              <Upload className="signapp-action-icon" />
            </div>

            <div className="signapp-action-content">
              <div className="signapp-action-title">Upload Document</div>
              <div className="signapp-action-description">Add new document to sign</div>
            </div>
          </button>

          {/* Request Signature */}
          <button className="signapp-action-btn signapp-video-bg" onClick={handleRequestSignature}>
            <video className="signapp-bg-video" autoPlay muted loop playsInline>
              <source src="/videos/send.mp4" type="video/mp4" />
            </video>

            <div className="signapp-action-icon-wrapper">
              <Send className="signapp-action-icon" />
            </div>

            <div className="signapp-action-content">
              <div className="signapp-action-title">Request Signature</div>
              <div className="signapp-action-description">Send document for signing</div>
            </div>
          </button>

          {/* Templates */}
          <button className="signapp-action-btn signapp-video-bg" onClick={handleViewTemplates}>
            <video className="signapp-bg-video" autoPlay muted loop playsInline>
              <source src="/videos/templates.mp4" type="video/mp4" />
            </video>

            <div className="signapp-action-icon-wrapper">
              <FileCheck className="signapp-action-icon" />
            </div>

            <div className="signapp-action-content">
              <div className="signapp-action-title">View Templates</div>
              <div className="signapp-action-description">Browse document templates</div>
            </div>
          </button>

        </div>


        {/* AI Spotlight Card */}
        <div className="signapp-ai-spotlight" onClick={handleViewAITemplates}>
          <div className="signapp-ai-spotlight-content">
            <h3>AI Templates</h3>
            <p>Create smart templates instantly using AI assistance.</p>
            <button className="signapp-ai-btn">Explore AI Templates</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="ss-ra-section-wrapper">
          <div
            className={`ss-ra-collapsible-header ${statsOpen ? 'ss-ra-header-open' : ''}`}
            onClick={() => setStatsOpen(!statsOpen)}
          >
            <div className="ss-ra-header-left">
              <TrendingUp size={18} />
              <span>Document Statistics</span>
            </div>

            <div className="ss-ra-header-right">
              {statsOpen ? "Hide" : "Show"}
            </div>
          </div>

          {statsOpen && (
            <div className="ss-ra-collapsible-content">
              <div className="signapp-stats-grid">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="signapp-stat-card signapp-video-bg"
                    onClick={stat.onClick}
                  >
                    <video
                      className="signapp-bg-video"
                      autoPlay
                      muted
                      loop
                      playsInline
                    >
                      <source src="/videos/Target_Arrow.mp4" type="video/mp4" />
                    </video>


                    <div className="signapp-stat-header">
                      <div className={`signapp-stat-icon-container ${stat.lightBg}`}>
                        <div className={stat.textColor}>
                          {stat.icon}
                        </div>
                      </div>
                      <span className={`signapp-stat-change ${stat.textColor} ${stat.lightBg}`}>
                        {stat.change}
                      </span>
                    </div>
                    <div className="signapp-stat-value">{stat.value}</div>
                    <div className="signapp-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* Analytics Overview Section */}
        <div className="ss-ra-section-wrapper">
          <div
            className={`ss-ra-collapsible-header ${analyticsOpen ? 'ss-ra-header-open' : ''}`}
            onClick={() => setAnalyticsOpen(!analyticsOpen)}
          >
            <div className="ss-ra-header-left">
              <TrendingUp size={18} />
              <span>Analytics Overview</span>
            </div>
            <div className="ss-ra-header-right">
              {analyticsOpen ? "Hide" : "Show"}
            </div>
          </div>

          {analyticsOpen && (
            <div className="ss-ra-collapsible-content">
              {/* Detailed Analytics Cards Component */}
              <DashboardAnalyticsInline
                analyticsData={analyticsData}
                loading={analyticsLoading}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              />

              {/* Chart Grid Section */}
              <div className="signapp-analytics-section">
                <h4 className="signapp-analytics-title">Document Analytics Charts</h4>

                <div className="signapp-analytics-grid">
                  {/* 1 — Bar Chart - Using document stats */}
                  <div className="signapp-chart-card">
                    <h4>Status Distribution</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          { name: 'Draft', value: analyticsData.documents?.draft || 0 },
                          { name: 'Sent', value: analyticsData.documents?.sent || 0 },
                          { name: 'In Progress', value: analyticsData.documents?.in_progress || 0 },
                          { name: 'Completed', value: analyticsData.documents?.completed || 0 },
                          { name: 'Declined', value: analyticsData.documents?.declined || 0 },
                          { name: 'Expired', value: analyticsData.documents?.expired || 0 },
                          { name: 'Voided', value: analyticsData.documents?.voided || 0 }
                        ].filter(item => item.value > 0)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: "none" }}
                          wrapperClassName="signapp-chart-tooltip"
                        />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#0d9488" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 2 — Line Chart - Activity Timeline */}
                  <div className="signapp-chart-card">
                    <h4>Activity Timeline</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart
                        data={analyticsData.activities?.timeline?.length ? analyticsData.activities.timeline : [
                          { date: 'Day 1', count: 0 },
                          { date: 'Day 2', count: 0 },
                          { date: 'Day 3', count: 0 },
                          { date: 'Day 4', count: 0 },
                          { date: 'Day 5', count: 0 }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: "none" }}
                          wrapperClassName="signapp-chart-tooltip"
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#0d9488"
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: "#0d9488" }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 3 — Pie Chart - Recipient Status */}
                  <div className="signapp-chart-card">
                    <h4>Recipient Status</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Completed', value: analyticsData.recipients?.completed || 0 },
                            { name: 'In Progress', value: analyticsData.recipients?.in_progress || 0 },
                            { name: 'Invited', value: analyticsData.recipients?.invited || 0 },
                            { name: 'Declined', value: analyticsData.recipients?.declined || 0 }
                          ].filter(item => item.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={80}
                          fill="#0d9488"
                          label
                        >
                          {[
                            { name: 'Completed', value: analyticsData.recipients?.completed || 0 },
                            { name: 'In Progress', value: analyticsData.recipients?.in_progress || 0 },
                            { name: 'Invited', value: analyticsData.recipients?.invited || 0 },
                            { name: 'Declined', value: analyticsData.recipients?.declined || 0 }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell
                              key={index}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: "none" }}
                          wrapperClassName="signapp-chart-tooltip"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 4 — Area Chart - Document Growth */}
                  <div className="signapp-chart-card">
                    <h4>Document Volume</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart
                        data={[
                          { month: 'Jan', count: Math.floor(Math.random() * 10) + 1 },
                          { month: 'Feb', count: Math.floor(Math.random() * 10) + 1 },
                          { month: 'Mar', count: Math.floor(Math.random() * 10) + 1 },
                          { month: 'Apr', count: Math.floor(Math.random() * 10) + 1 },
                          { month: 'May', count: Math.floor(Math.random() * 10) + 1 },
                          { month: 'Jun', count: Math.floor(Math.random() * 10) + 1 }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: "none" }}
                          wrapperClassName="signapp-chart-tooltip"
                        />
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0d9488" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          dataKey="count"
                          stroke="#0d9488"
                          fill="url(#areaGradient)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 5 — Radar Chart - Field Completion */}
                  <div className="signapp-chart-card">
                    <h4>Field Completion</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart
                        data={[
                          { type: 'Signatures', value: analyticsData.fields?.signatures?.percentage || 0 },
                          { type: 'Initials', value: analyticsData.fields?.initials?.percentage || 0 },
                          { type: 'Form Fields', value: analyticsData.fields?.form_fields?.percentage || 0 },
                          { type: 'Checkboxes', value: analyticsData.fields?.checkboxes?.percentage || 0 }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="type" />
                        <Radar
                          dataKey="value"
                          stroke="#0d9488"
                          fill="#0d9488"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: "none" }}
                          wrapperClassName="signapp-chart-tooltip"
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 6 — Horizontal Bar - Performance */}
                  <div className="signapp-chart-card">
                    <h4>Performance Metrics</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          { name: 'Completion Rate', value: analyticsData.recipients?.completion_rate || 0 },
                          { name: 'Field Completion', value: analyticsData.fields?.completion_percentage || 0 },
                          { name: 'Active Documents', value: analyticsData.documents?.in_progress || 0 },
                          { name: 'Total Signatures', value: analyticsData.fields?.signatures?.total || 0 }
                        ]}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                      >
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: "none" }}
                          wrapperClassName="signapp-chart-tooltip"
                        />
                        <Bar dataKey="value" fill="#f97316" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>





        {/* Recent Activities Section */}
        <div className="ss-ra-section-wrapper">
          <div
            className="ss-ra-collapsible-header"
            onClick={() => setActivitiesOpen(!activitiesOpen)}
          >
            <div className="ss-ra-header-left">
              <History size={18} />
              <span>Recent Activities</span>
            </div>
            <div className="ss-ra-header-right">
              {activitiesOpen ? "Hide" : "Show"}
            </div>
          </div>

          {activitiesOpen && (
            <div className="ss-ra-container-card">
              <div className="ss-ra-card-header">
                <div className="ss-ra-title-group">
                  <h3 className="ss-ra-title">Recent Activities</h3>
                  <p className="ss-ra-subtitle">Track your latest document activities</p>
                </div>
                <div className="ss-ra-header-actions">
                  <button
                    className="ss-ra-refresh-btn"
                    onClick={() => loadDashboardData()}
                  >
                    <RefreshCw size={14} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Filter Row */}
              <div className="ss-ra-filter-row">
                {['all', 'draft', 'sent', 'in_progress', 'completed', 'declined', 'expired', 'voided', 'deleted'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`ss-ra-filter-chip ${activeFilter === filter ? 'ss-ra-filter-chip-active' : ''
                      }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              <div className="ss-ra-items-list">
                {displayedActivities.length === 0 ? (
                  <div className="ss-ra-empty-state">
                    <FileText className="ss-ra-empty-icon" />
                    <p className="ss-ra-empty-text">No activities found</p>
                    <p className="ss-ra-empty-subtext">Upload a document to get started</p>
                  </div>
                ) : (
                  displayedActivities.map((activity) => {
                    const statusBadge = getStatusBadge(activity.status);
                    return (
                      <div key={activity.id} className="ss-ra-item-row">
                        <div className="ss-ra-item-content">
                          <div className="ss-ra-item-info-main">
                            <div className={`ss-ra-status-icon-box ${statusBadge.bg}`}>
                              {statusBadge.icon}
                            </div>
                            <div className="ss-ra-item-details-box">
                              <div className="ss-ra-item-header-line">
                                <h4 className="ss-ra-item-title">
                                  {activity.title}
                                </h4>
                                <span className={`ss-ra-status-tag ${statusBadge.bg} ${statusBadge.text}`}>
                                  {statusBadge.label}
                                </span>
                              </div>
                              <p className="ss-ra-item-description">{activity.description}</p>
                              <div className="ss-ra-item-meta-footer">
                                <span className="ss-ra-meta-pill">
                                  <Clock3 size={12} />
                                  <span>{activity.date}</span>
                                </span>
                                <span className="ss-ra-meta-pill">
                                  <User size={12} />
                                  <span>{activity.sender}</span>
                                </span>
                                <span className="ss-ra-meta-pill">
                                  <Users size={12} />
                                  <span>{activity.signersCompleted} / {activity.signersTotal}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="ss-ra-item-action-buttons">
                            {activity.status === 'draft' && (
                              <button
                                className="ss-ra-btn-primary-action"
                                onClick={() => handlePrepareSend(activity.documentId, activity.title)}
                                title="Prepare & Send"
                              >
                                <Send size={14} />
                                <span>Prepare & Send</span>
                              </button>
                            )}
                            <button
                              className="ss-ra-btn-subtle-action"
                              onClick={() => {
                                setRenameDocId(activity.documentId);
                                setNewFilename((activity.title || "").replace(/\.pdf$/i, ""));
                                setRenameOpen(true);
                              }}
                              title="Rename"
                            >
                              <FaEdit size={14} />
                              <span>Rename</span>
                            </button>

                            <div className="ss-ra-more-wrapper">
                              <button
                                className="ss-ra-btn-more"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === activity.id ? null : activity.id);
                                }}
                                title="More actions"
                              >
                                <MoreVertical size={18} />
                              </button>

                              {openMenuId === activity.id && (
                                <div className="ss-ra-dropdown-portal" ref={dropdownRef}>
                                  <button
                                    className="ss-ra-dropdown-item"
                                    onClick={() => handleViewDocument(activity.documentId, activity.title)}
                                  >
                                    <Eye size={16} />
                                    <span>View Document</span>
                                  </button>

                                  <button
                                    className="ss-ra-dropdown-item"
                                    onClick={() => handleDownloadDocument(activity.documentId, activity.title)}
                                  >
                                    <Download size={16} />
                                    <span>Download</span>
                                  </button>

                                  <button
                                    className="ss-ra-dropdown-item"
                                    onClick={() => handleViewTimeline(activity.documentId)}
                                  >
                                    <History size={16} />
                                    <span>View Timeline</span>
                                  </button>

                                  <button
                                    className="ss-ra-dropdown-item"
                                    onClick={() => handleViewSignedPreview(activity.documentId, activity.title)}
                                  >
                                    <Eye size={16} />
                                    <span>Signed Preview</span>
                                  </button>

                                  {['draft', 'sent', 'in_progress'].includes(activity.status) && (
                                    <>
                                      <div className="ss-ra-dropdown-divider" />

                                      {activity.status === 'draft' && (
                                        <>
                                          <button
                                            className="ss-ra-dropdown-item"
                                            onClick={() => handlePrepareSend(activity.documentId, activity.title)}
                                          >
                                            <Send size={16} />
                                            <span>Prepare & Send</span>
                                          </button>

                                          <button
                                            className="ss-ra-dropdown-item"
                                            onClick={() => handleBuildTemplate(activity.documentId)}
                                          >
                                            <Edit size={16} />
                                            <span>Build Template</span>
                                          </button>

                                          <button
                                            className="ss-ra-dropdown-item"
                                            onClick={() => handleAddMergeFile(activity.documentId, activity.title)}
                                          >
                                            <Plus size={16} />
                                            <span>Add/Merge File</span>
                                          </button>
                                        </>
                                      )}

                                      {['sent', 'in_progress'].includes(activity.status) && (
                                        <button
                                          className="ss-ra-dropdown-item"
                                          onClick={() => handleSendReminder(activity.documentId, activity.title)}
                                        >
                                          <MailWarning size={16} />
                                          <span>Send Reminder</span>
                                        </button>
                                      )}

                                      <div className="ss-ra-dropdown-divider" />

                                      <button
                                        className="ss-ra-dropdown-item ss-ra-dropdown-item-warning"
                                        onClick={() => handleVoidDocument(activity.documentId, activity.title)}
                                      >
                                        <X size={16} />
                                        <span>Void Document</span>
                                      </button>

                                      <button
                                        className="ss-ra-dropdown-item ss-ra-dropdown-item-danger"
                                        onClick={() => handleSoftDelete(activity.documentId, activity.title)}
                                      >
                                        <Trash2 size={16} />
                                        <span>Move to Trash</span>
                                      </button>
                                    </>
                                  )}

                                  {activity.status === 'voided' && (
                                    <>
                                      <div className="ss-ra-dropdown-divider" />
                                      <button
                                        className="ss-ra-dropdown-item ss-ra-dropdown-item-success"
                                        onClick={() => handleRestoreDocument(activity.documentId, activity.title)}
                                      >
                                        <RefreshCw size={16} />
                                        <span>Cancel Void</span>
                                      </button>
                                      <button
                                        className="ss-ra-dropdown-item ss-ra-dropdown-item-danger"
                                        onClick={() => handleSoftDelete(activity.documentId, activity.title)}
                                      >
                                        <Trash2 size={16} />
                                        <span>Move to Trash</span>
                                      </button>
                                    </>
                                  )}

                                  {activity.status === 'deleted' && (
                                    <>
                                      <div className="ss-ra-dropdown-divider" />
                                      <button
                                        className="ss-ra-dropdown-item ss-ra-dropdown-item-success"
                                        onClick={() => handleRestoreDocument(activity.documentId, activity.title)}
                                      >
                                        <RefreshCw size={16} />
                                        <span>Restore</span>
                                      </button>
                                      <button
                                        className="ss-ra-dropdown-item ss-ra-dropdown-item-danger"
                                        onClick={() => handlePermanentDelete(activity.documentId, activity.title)}
                                      >
                                        <Trash2 size={16} />
                                        <span>Permanent Delete</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {!showAllActivities && filteredActivities.length > 4 && (
                <div className="ss-ra-footer-area">
                  <button
                    onClick={() => setShowAllActivities(true)}
                    className="ss-ra-view-all-btn"
                  >
                    View More Activities ({filteredActivities.length - 4} more)
                  </button>
                </div>
              )}

              {showAllActivities && (
                <div className="ss-ra-footer-area">
                  <button
                    onClick={() => setShowAllActivities(false)}
                    className="ss-ra-view-less-btn"
                  >
                    Show Less
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals and Drawers */}
      <DocumentViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        documentId={activeDocId}
        title={activeDocument?.title}
        url={viewDocumentUrl(activeDocId)}
      />

      <SignedPreviewModal
        open={signedOpen}
        onClose={() => setSignedOpen(false)}
        documentId={activeDocId}
        title={activeDocument?.title}
        url={signedPreviewUrl(activeDocId)}
      />

      <TimelineDrawer
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        documentId={activeDocId}
      />

      {/* Recipient Manager Modal */}
      {showRecipientManager && selectedDocument && (
        <div className="modal-backdrop">
          <div className="modal recipient-manager-modal">
            <div className="modal-header">
              <h3>Manage Recipients - {selectedDocument.title}</h3>
              <button
                className="close-btn"
                onClick={() => setShowRecipientManager(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <RecipientManager
                document={selectedDocument}
                defaultTab={defaultRecipientTab}
                onUpdate={() => {
                  loadDashboardData();
                  setShowRecipientManager(false);
                }}
              />

            </div>
          </div>
        </div>
      )}

      {/* Upload Preview Modal */}
      <UploadPreviewModal
        open={previewOpen}
        file={previewFile}
        onClose={() => setPreviewOpen(false)}
        onUpload={() => {
          setPreviewOpen(false);
          handleUpload(previewFile);
        }}
      />

      {/* Template Browser Modal */}
      <TemplateBrowser
        isOpen={showTemplateBrowser}
        onClose={() => setShowTemplateBrowser(false)}
        onTemplateSelect={handleTemplateSelect}
      />

      {/* AI Template Browser */}
      <AITemplateBrowser
        open={templateBrowserOpen}
        onClose={() => setTemplateBrowserOpen(false)}
        onTemplateUse={handleTemplateUse}
      />

      {/* Merge File Modal */}
      {mergeOpen && (
        <div className="modal-backdrop">
          <div className="modal merge-modal">
            <div className="modal-header">
              <h3>Add / Merge File</h3>
              <button
                className="close-btn"
                onClick={() => setMergeOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <p>
                File will be appended to:
                <strong> {mergeDoc?.filename}</strong>
              </p>

              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg"
                onChange={(e) => setFile(e.target.files[0])}
                className="merge-file-input"
              />

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setMergeOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!file}
                  onClick={handleMergeFile}
                >
                  Merge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renameOpen && (
        <div className="rename-dialog-backdrop">
          <div className="rename-dialog">
            <h3>Rename Document</h3>

            <div className="rename-input-wrapper">
              <input
                type="text"
                value={newFilename}
                onChange={(e) =>
                  setNewFilename(
                    (e.target.value || "").replace(/\.pdf$/i, "")
                  )
                }
                placeholder="Enter document name"
                autoFocus
              />
              <span className="rename-suffix">.pdf</span>
            </div>

            <div className="rename-dialog-actions">
              <button
                className="rename-btn-cancel"
                onClick={() => setRenameOpen(false)}
                disabled={renaming}
              >
                Cancel
              </button>

              <button
                className="rename-btn-primary"
                disabled={!newFilename.trim() || renaming}
                onClick={async () => {
                  try {
                    setRenaming(true);

                    const finalFilename = `${newFilename.trim()}.pdf`;

                    await fetch(
                      `${API_BASE_URL}/documents/${renameDocId}/rename`,
                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          filename: finalFilename,
                        }),
                      }
                    );

                    setSnackbar({
                      open: true,
                      message: "Document renamed successfully",
                      severity: "success",
                    });

                    setRenameOpen(false);
                    loadDashboardData(); // refresh dashboard
                  } catch (err) {
                    setSnackbar({
                      open: true,
                      message: "Rename failed",
                      severity: "error",
                    });
                  } finally {
                    setRenaming(false);
                  }
                }}
              >
                {renaming ? "Renaming…" : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* {analyticsOpen && (
  <DashboardAnalytics onClose={() => setAnalyticsOpen(false)} />
)} */}



      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default UserDashboard;