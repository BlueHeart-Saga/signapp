import React, { useEffect, useState, useMemo } from "react";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  BarChart3,
  Calendar,
  UserCheck,
  FileDown,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  History,
  User,
  Eye,
  CheckSquare,
  XCircle,
  Send,
  Mail,
  FilePlus,
  Trash2,
  Copy,
  Code,
  Table2,
  Archive
} from "lucide-react";
import {
  FiArrowLeft,
  FiEye,
  FiEdit,
  FiMail,
  FiMoreHorizontal
} from "react-icons/fi";
import { HiOutlineDocumentCheck } from "react-icons/hi2";
import DocumentViewerModal from "../components/DocumentViewerModal";
import TimelineDrawer from "../components/TimelineDrawer"; // Import the enhanced TimelineDrawer
import { viewDocumentUrl } from "../services/DocumentAPI";
import { useNavigate } from "react-router-dom";
import { Typography } from "@mui/material";
import api from "../services/api";
import "../style/DocumentSummary.css";
import DocumentPreviewSection from "../components/DocumentPreviewSection";
import {
  HiOutlineDocumentText,
  HiOutlinePaperAirplane,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle
} from "react-icons/hi2";
import SummaryHeaderActions from "../components/SummaryHeaderActions";
import RecipientStatusBar from "../components/RecipientStatusBar";
import DocumentStatusDashboard from '../components/DocumentStatusDashboard';

const statusConfig = {
  draft: {
    label: "Draft",
    color: "#475569",
    icon: <HiOutlineDocumentText size={16} />
  },
  sent: {
    label: "Sent",
    color: "#2563eb",
    icon: <HiOutlinePaperAirplane size={16} />
  },
  in_progress: {
    label: "In Progress",
    color: "#d97706",
    icon: <HiOutlineClock size={16} />
  },
  completed: {
    label: "Completed",
    color: "#059669",
    icon: <HiOutlineCheckCircle size={16} />
  },
  declined: {
    label: "Declined",
    color: "#dc2626",
    icon: <HiOutlineXCircle size={16} />
  },
  voided: {
    label: "Voided",
    color: "#9ca3af",
    icon: <XCircle size={16} />
  },
  expired: {
    label: "Expired",
    color: "#7c3aed",
    icon: <HiOutlineClock size={16} />
  },
  deleted: {
    label: "Deleted",
    color: "#111827",
    icon: <Trash2 size={16} />
  }
};

const getTimelineIcon = (type = "") => {
  switch (type) {
    case 'upload_document':
    case 'create_document_from_template':
      return <FilePlus size={16} />;
    case 'view_document':
    case 'view_signed_preview':
      return <Eye size={16} />;
    case 'download_original':
    case 'download_signed_or_current_pdf':
      return <Download size={16} />;
    case 'file_added':
      return <FilePlus size={16} />;
    case 'file_deleted':
      return <Trash2 size={16} />;
    case 'set_envelope_id':
      return <Copy size={16} />;
    case 'send_to_recipient':
      return <Send size={16} />;
    case 'email_document':
      return <Mail size={16} />;
    case 'recipient_completed':
      return <CheckCircle size={16} />;
    case 'recipient_declined':
      return <XCircle size={16} />;
    case 'field_completed':
      return <CheckSquare size={16} />;
    default:
      return <History size={16} />;
  }
};

const getTimelineColor = (type = "") => {
  if (type.includes('download') || type.includes('completed')) return '#10b981';
  if (type.includes('view')) return '#3b82f6';
  if (type.includes('upload') || type.includes('create')) return '#8b5cf6';
  if (type.includes('send') || type.includes('email')) return '#f59e0b';
  if (type.includes('delete') || type.includes('decline') || type.includes('error')) return '#ef4444';
  if (type.includes('file')) return '#6366f1';
  return '#6b7280';
};

const DocumentSummary = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [docData, setDocData] = useState(null);
  const [docStats, setDocStats] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [documentRecipients, setDocumentRecipients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [downloadInProgress, setDownloadInProgress] = useState("");

  const [viewerOpen, setViewerOpen] = useState(false);
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false);
  const [showOwnerDownloads, setShowOwnerDownloads] = useState(false);

  useEffect(() => {
    fetchDocumentSummary();
  }, [documentId]);

  const TIMELINE_LIMIT = 6;

  const visibleTimelineEvents = useMemo(() => (
    timelineEvents
      .filter(e => !["debug_log", "internal_note"].includes(e.action))
      .slice(0, TIMELINE_LIMIT) // Show first 6 (which are most recent due to sort)
  ), [timelineEvents]);

  const fetchDocumentSummary = async () => {
    try {
      setIsLoading(true);
      const [docResponse, statsResponse, timelineResponse, progressResponse] = await Promise.all([
        api.get(`/documents/${documentId}`),
        api.get(`/documents/${documentId}/stats`),
        api.get(`/documents/${documentId}/timeline`),
        api.get(`/signing/document/${documentId}/progress`),
      ]);
      setDocData(docResponse.data);
      setDocStats(statsResponse.data);
      setTimelineEvents(timelineResponse.data || []);
      setDocumentRecipients(progressResponse.data?.recipients || []);
    } catch (err) {
      console.error("Document summary fetch error:", err);
      setErrorMessage("Failed to load document summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportDownload = async (format) => {
    try {
      setDownloadInProgress(format);
      let endpoint, fileName;

      switch (format) {
        case 'json':
          endpoint = `/documents/${documentId}/summary/json`;
          fileName = `${docData?.filename || 'document'}_summary.json`;
          break;
        case 'csv':
          endpoint = `/documents/${documentId}/summary/recipients-csv`;
          fileName = `${docData?.filename || 'document'}_recipients.csv`;
          break;
        case 'html':
          endpoint = `/documents/${documentId}/summary/html`;
          fileName = `${docData?.filename || 'document'}_report.html`;
          break;
        case 'zip':
          endpoint = `/documents/${documentId}/summary/bulk-export`;
          fileName = `${docData?.filename || 'document'}_full_export.zip`;
          break;
        case 'analytics':
          endpoint = `/documents/${documentId}/summary/analytics`;
          fileName = `${docData?.filename || 'document'}_analytics.json`;
          break;
        default:
          return;
      }

      const response = await api.get(endpoint, { responseType: 'blob' });
      const fileBlob = new Blob([response.data]);
      const downloadLink = document.createElement('a');
      downloadLink.href = window.URL.createObjectURL(fileBlob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error(`Download error for ${format}:`, err);
      alert(`Failed to download ${format.toUpperCase()} report`);
    } finally {
      setDownloadInProgress('');
    }
  };

  const toggleSectionVisibility = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(past).toLocaleDateString();
  };

  const getEventTitle = (event) => {
    if (event.title) return event.title;
    const typeMap = {
      'upload_document': 'Document Uploaded',
      'view_document': 'Document Viewed',
      'download_signed_or_current_pdf': 'PDF Downloaded',
      'file_added': 'File Added',
      'file_deleted': 'File Deleted',
      'recipient_declined': 'Document Declined',
      'set_envelope_id': 'Envelope ID Set',
      'email_document': 'Document Emailed',
      'create_document_from_template': 'Created From Template'
    };
    return typeMap[event.type] || event.type?.replace(/_/g, ' ')?.toUpperCase();
  };

  if (errorMessage && !docData) return (
    <div className="doc-summary-error">
      <AlertCircle size={48} />
      <h2>Error Loading Summary</h2>
      <p>{errorMessage}</p>
      <button onClick={fetchDocumentSummary} className="doc-summary-retry-btn">
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  );

  const currentStatus = docData ? (statusConfig[docData?.status] || statusConfig.draft) : statusConfig.draft;
  const completionPercentage = docStats?.completion_rate || 0;

  return (
    <div className="document-summary-container">
      {/* ================= HEADER & CONTROLS ================= */}
      <header className="doc-simple-header">
        <div className="doc-simple-left">
          <button
            className="doc-header-icon-btn"
            onClick={() => window.history.back()}
            title="Back"
          >
            <FiArrowLeft size={18} />
          </button>

          <button
            className="doc-header-action"
            onClick={() => setViewerOpen(true)}
            disabled={!docData}
          >
            <FiEye size={16} />
            <span>View document</span>
          </button>

          <button
            className="doc-header-action"
            onClick={() =>
              navigate("/user/prepare-send", {
                state: { document: docData }
              })
            }
            disabled={!docData || docData?.status !== "draft"}
          >
            <FiEdit size={16} />
            <span>Edit</span>
          </button>
        </div>

        <div className="doc-simple-actions">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isLoading && (
              <Box sx={{ animation: 'spin 2s linear infinite', display: 'flex' }}>
                <RefreshCw size={16} style={{ color: '#0d9488' }} />
              </Box>
            )}
            {!isLoading && <RefreshCw size={16} onClick={fetchDocumentSummary} style={{ cursor: 'pointer' }} />}
            <SummaryHeaderActions documentId={documentId} documentStatus={docData?.status} />
          </Box>
        </div>
      </header>

      {(!docData || !docStats) ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 20,
          gap: 2,
          opacity: 0.6
        }}>
          <RefreshCw size={32} style={{ color: '#0d9488' }} className="doc-loading-spinner" />
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
            Fetching latest document details...
          </Typography>
        </Box>
      ) : (
        <>
          {docData?.id && (
            <div className="doc-summary-preview-section">
              <DocumentPreviewSection document={docData} />
            </div>
          )}

          <div className="document-status-page">
            <DocumentStatusDashboard
              document={docData}
              recipients={documentRecipients}
              documentId={documentId}
            />
          </div>

          {/* Details Sections - Toggleable based on Footer Tabs */}

          {activeSection === 'timeline' && (
            <section className="doc-summary-expanded-section">
              <div className="doc-summary-section-header">
                <div className="doc-summary-section-title">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <History size={20} style={{ color: '#0d9488' }} />
                    <h3>Recent Activity</h3>
                  </Box>
                  <small className="doc-summary-timeline-stats">
                    {timelineEvents.length} total activities • {new Set(timelineEvents.map(e => e.user)).size} users
                  </small>
                </div>
                <div className="doc-summary-section-actions">
                  <button className="doc-summary-download-small" onClick={() => handleReportDownload('html')} disabled={downloadInProgress === 'html'}>
                    <Download size={14} /> {downloadInProgress === 'html' ? '...' : 'Audit Report'}
                  </button>
                  <button className="doc-summary-section-close" onClick={() => toggleSectionVisibility('timeline')}>✕</button>
                </div>
              </div>

              <div className="doc-summary-timeline-container">
                {timelineEvents.length === 0 ? (
                  <div className="doc-summary-empty-state">
                    <History size={32} />
                    <p>No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="doc-summary-timeline-list">
                    {visibleTimelineEvents.map((event, index) => (
                      <div key={index} className="doc-summary-timeline-event">
                        <div className="doc-summary-timeline-icon" style={{
                          backgroundColor: getTimelineColor(event.type || event.action) + '15',
                          color: getTimelineColor(event.type || event.action),
                          border: `1px solid ${getTimelineColor(event.type || event.action)}30`
                        }}>
                          {getTimelineIcon(event.type || event.action)}
                        </div>
                        <div className="doc-summary-timeline-content">
                          <div className="doc-summary-timeline-header">
                            <h4>{getEventTitle(event)}</h4>
                            <span className="doc-summary-timeline-time">{formatTimeAgo(event.timestamp)}</span>
                          </div>
                          <p className="doc-summary-timeline-description">
                            {event.description || event.action?.replace(/_/g, ' ')}
                          </p>
                          <div className="doc-summary-timeline-footer">
                            <div className="doc-summary-timeline-user">
                              <User size={12} />
                              <span>{event.user || 'System'}</span>
                              {event.metadata?.ip && (
                                <span className="doc-summary-timeline-ip"> • {event.metadata.ip}</span>
                              )}
                            </div>
                            <small className="doc-summary-timeline-full-date">{new Date(event.timestamp).toLocaleString()}</small>
                          </div>
                        </div>
                      </div>
                    ))}

                    {timelineEvents.length > TIMELINE_LIMIT && (
                      <div className="doc-summary-timeline-more">
                        <button
                          className="doc-summary-view-all-btn"
                          onClick={() => setTimelineDrawerOpen(true)}
                        >
                          <History size={16} />
                          View Full Audit History
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeSection === 'overview' && (
            <section className="doc-summary-expanded-section">
              <div className="doc-summary-section-header">
                <h3>Document Overview</h3>
                <button className="doc-summary-section-close" onClick={() => toggleSectionVisibility('overview')}>✕</button>
              </div>
              <div className="doc-summary-overview-grid">
                <div className="doc-summary-overview-item">
                  <label>Document Name</label>
                  <p>{docData.filename}</p>
                </div>
                <div className="doc-summary-overview-item">
                  <label>Envelope ID</label>
                  <p>{docData.envelope_id || 'Not assigned'}</p>
                </div>
                <div className="doc-summary-overview-item">
                  <label>Uploaded</label>
                  <p>{new Date(docData.uploaded_at).toLocaleString()}</p>
                </div>
                <div className="doc-summary-overview-item">
                  <label>Size</label>
                  <p>{docData.size ? `${(docData.size / 1024).toFixed(1)} KB` : 'Unknown'}</p>
                </div>
                <div className="doc-summary-overview-item">
                  <label>Pages</label>
                  <p>{docData.page_count || 'Unknown'}</p>
                </div>
                <div className="doc-summary-overview-item">
                  <label>Owner</label>
                  <p>{docData.owner_email || 'Unknown'}</p>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'progress' && (
            <section className="doc-summary-expanded-section">
              <div className="doc-summary-section-header">
                <h3>Signing Progress</h3>
                <button className="doc-summary-section-close" onClick={() => toggleSectionVisibility('progress')}>✕</button>
              </div>
              <div className="doc-summary-progress-container">
                <div className="doc-summary-progress-header">
                  <span>Overall Completion</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className="doc-summary-progress-bar">
                  <div
                    className="doc-summary-progress-fill"
                    style={{ width: `${completionPercentage}%`, backgroundColor: currentStatus.color }}
                  />
                </div>
                <div className="doc-summary-progress-details">
                  <div className="doc-summary-progress-detail">
                    <span className="doc-summary-detail-label">Completed</span>
                    <span className="doc-summary-detail-value">{docStats.signed_recipients || 0}</span>
                  </div>
                  <div className="doc-summary-progress-detail">
                    <span className="doc-summary-detail-label">Pending</span>
                    <span className="doc-summary-detail-value">{docStats.total_recipients - docStats.signed_recipients || 0}</span>
                  </div>
                  <div className="doc-summary-progress-detail">
                    <span className="doc-summary-detail-label">Declined</span>
                    <span className="doc-summary-detail-value">0</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'recipients' && (
            <section className="doc-summary-expanded-section">
              <div className="doc-summary-section-header">
                <div className="doc-summary-section-title">
                  <h3>Recipients ({documentRecipients.length})</h3>
                  <button className="doc-summary-download-small" onClick={() => handleReportDownload('csv')} disabled={downloadInProgress === 'csv'}>
                    <Download size={14} /> {downloadInProgress === 'csv' ? '...' : 'CSV'}
                  </button>
                </div>
                <button className="doc-summary-section-close" onClick={() => toggleSectionVisibility('recipients')}>✕</button>
              </div>
              <div className="doc-summary-recipients-grid">
                {documentRecipients.map((recipient) => {
                  const recipientStatus = statusConfig[recipient.status] || statusConfig.draft;
                  const lastAction = recipient.signed_at || recipient.approved_at || recipient.viewer_at || recipient.form_completed_at || recipient.witnessed_at || 'No action yet';
                  return (
                    <div key={recipient.id} className="doc-summary-recipient-card">
                      <div className="doc-summary-recipient-header">
                        <div className="doc-summary-recipient-avatar"><Users size={16} /></div>
                        <div className="doc-summary-recipient-info">
                          <h4>{recipient.name || recipient.email}</h4>
                          <p>{recipient.email}</p>
                        </div>
                        <span className="doc-summary-recipient-status" style={{ color: recipientStatus.color }}>{recipientStatus.icon} {recipientStatus.label}</span>
                      </div>
                      <div className="doc-summary-recipient-details">
                        <div className="doc-summary-recipient-detail"><span>Role</span><strong>{recipient.role?.replace('_', ' ') || 'Signer'}</strong></div>
                        <div className="doc-summary-recipient-detail"><span>Order</span><strong>{recipient.signing_order || 'N/A'}</strong></div>
                        <div className="doc-summary-recipient-detail"><span>Last Action</span><small>{lastAction !== 'No action yet' ? new Date(lastAction).toLocaleDateString() : lastAction}</small></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <footer className="doc-summary-footer">
            <div className="doc-summary-footer-tabs">
              <div
                className={`doc-summary-tab-card ${activeSection === 'overview' ? 'active' : ''}`}
                onClick={() => toggleSectionVisibility('overview')}
              >
                <div className="doc-summary-tab-icon" style={{ color: '#0d9488' }}><FileText size={18} /></div>
                <div className="doc-summary-tab-content">
                  <p>Overview</p>
                  <span>Doc Details</span>
                </div>
                <div className="doc-summary-tab-indicator">{activeSection === 'overview' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
              </div>

              <div
                className={`doc-summary-tab-card ${activeSection === 'recipients' ? 'active' : ''}`}
                onClick={() => toggleSectionVisibility('recipients')}
              >
                <div className="doc-summary-tab-icon" style={{ color: '#3b82f6' }}><Users size={18} /></div>
                <div className="doc-summary-tab-content">
                  <p>Recipients</p>
                  <span>{documentRecipients.length} People</span>
                </div>
                <div className="doc-summary-tab-indicator">{activeSection === 'recipients' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
              </div>

              <div
                className={`doc-summary-tab-card ${activeSection === 'progress' ? 'active' : ''}`}
                onClick={() => toggleSectionVisibility('progress')}
              >
                <div className="doc-summary-tab-icon" style={{ color: '#10b981' }}><BarChart3 size={18} /></div>
                <div className="doc-summary-tab-content">
                  <p>Progress</p>
                  <span>{completionPercentage}% Done</span>
                </div>
                <div className="doc-summary-tab-indicator">{activeSection === 'progress' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
              </div>

              <div
                className={`doc-summary-tab-card ${activeSection === 'timeline' ? 'active' : ''}`}
                onClick={() => toggleSectionVisibility('timeline')}
              >
                <div className="doc-summary-tab-icon" style={{ color: '#8b5cf6' }}><History size={18} /></div>
                <div className="doc-summary-tab-content">
                  <p>Activities</p>
                  <span>{timelineEvents.length} Events</span>
                </div>
                <div className="doc-summary-tab-indicator">{activeSection === 'timeline' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
              </div>
            </div>

            <div className="doc-summary-footer-actions-bar">
              <div className="doc-summary-export-group">
                <span className="export-label">Download Analysis:</span>
                <div className="export-buttons">
                  <button className="export-btn" onClick={() => handleReportDownload('json')} disabled={downloadInProgress === 'json'}>
                    <Code size={14} /> JSON
                  </button>
                  <button className="export-btn" onClick={() => handleReportDownload('csv')} disabled={downloadInProgress === 'csv'}>
                    <Table2 size={14} /> CSV
                  </button>
                  <button className="export-btn export-main" onClick={() => handleReportDownload('zip')} disabled={downloadInProgress === 'zip'}>
                    <Archive size={14} /> Full Package (ZIP)
                  </button>
                </div>
              </div>

              <div className="doc-summary-info-group">
                <div className="info-item">
                  <Clock size={12} />
                  <span>Generated: {new Date().toLocaleString()}</span>
                </div>
                <div className="info-item">
                  <Copy size={12} />
                  <span>ID: {documentId}</span>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {viewerOpen && docData?.id && (
        <DocumentViewerModal
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          documentId={docData.id}
          url={viewDocumentUrl(docData.id)}
        />
      )}

      {timelineDrawerOpen && (
        <TimelineDrawer
          open={timelineDrawerOpen}
          onClose={() => setTimelineDrawerOpen(false)}
          documentId={documentId}
          documentName={docData?.filename}
        />
      )}
    </div>
  );
};

export default DocumentSummary;