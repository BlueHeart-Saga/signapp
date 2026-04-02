import React, { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  Divider,
  Avatar,
  Paper,
  Alert,
  Button,
  Stack,
  Card,
  CardContent,
  alpha,
  Fade,
  Zoom,
  useTheme,
} from "@mui/material";
import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Send as SendIcon,
  Email as EmailIcon,
  VerifiedUser as VerifiedUserIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  Summarize as SummarizeIcon,
  CloudUpload as CloudUploadIcon,
  Merge as MergeIcon,
  SwapHoriz as SwapHorizIcon,
  EventNote as EventNoteIcon,
  Group as GroupIcon,
  Drafts as DraftsIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Block as BlockIcon,
  Undo as UndoIcon,
  FileCopy as FileCopyIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import {
  getTimeline,
  exportRecipientsCsv,
  exportTimelineCsv,
  exportFieldsCsv,
  generateHtmlReport
} from "../services/DocumentAPI";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";

/* ----------------------------------
   Enhanced Helper Functions
----------------------------------- */

// ============================================
// ICON MAPPING - Based on action and metadata
// ============================================
const getEventIcon = (event) => {
  const iconProps = { fontSize: "small" };
  const action = event.action || '';
  const metadata = event.metadata || {};
  const downloadType = metadata.download_type;

  // Download events
  if (action?.includes('download') || downloadType) {
    if (downloadType === 'professional_certificate' || downloadType === 'certificate') {
      return <VerifiedUserIcon color="success" {...iconProps} />;
    }
    if (downloadType === 'professional_summary' || downloadType === 'summary') {
      return <SummarizeIcon color="info" {...iconProps} />;
    }
    return <DownloadIcon color="success" {...iconProps} />;
  }

  // View events
  if (action === 'view_document' || action?.includes('view')) {
    return <VisibilityIcon color="info" {...iconProps} />;
  }

  // Document Operations
  if (action === 'upload_document') {
    return <CloudUploadIcon color="primary" {...iconProps} />;
  }
  if (action === 'create_document_from_template') {
    return <FileCopyIcon color="secondary" {...iconProps} />;
  }
  if (action === 'rename_document') {
    return <EditIcon color="action" {...iconProps} />;
  }

  // Recipient Operations
  if (action === 'invites_sent' || action === 'send_invites') {
    return <SendIcon color="primary" {...iconProps} />;
  }
  if (action === 'reminder_sent') {
    return <EmailIcon color="warning" {...iconProps} />;
  }
  if (action === 'recipients_added') {
    return <GroupIcon color="primary" {...iconProps} />;
  }
  if (action === 'recipient_deleted' || action === 'recipient_removed') {
    return <PersonIcon color="error" {...iconProps} />;
  }

  // File Operations
  if (action === 'file_added') {
    return <DescriptionIcon color="success" {...iconProps} />;
  }
  if (action === 'file_deleted') {
    return <DeleteIcon color="error" {...iconProps} />;
  }
  if (action === 'file_replaced') {
    return <RefreshIcon color="warning" {...iconProps} />;
  }

  // Recipient Actions
  if (action === 'otp_verified' || action === 'otp_resent') {
    return <VerifiedUserIcon color="success" {...iconProps} />;
  }
  if (action === 'accept_terms') {
    return <ThumbUpIcon color="success" {...iconProps} />;
  }
  if (action === 'decline_terms') {
    return <ThumbDownIcon color="error" {...iconProps} />;
  }
  if (action === 'field_completed') {
    return <CheckCircleIcon color="success" {...iconProps} />;
  }
  if (action === 'field_edited') {
    return <EditIcon color="warning" {...iconProps} />;
  }

  // Status Changes
  if (action === 'document_finalized' || action === 'completed') {
    return <CheckCircleIcon color="success" {...iconProps} />;
  }
  if (action === 'void_document') {
    return <BlockIcon color="error" {...iconProps} />;
  }
  if (action === 'soft_delete') {
    return <DeleteIcon color="error" {...iconProps} />;
  }
  if (action === 'permanent_delete') {
    return <DeleteIcon sx={{ color: 'black' }} {...iconProps} />;
  }
  if (action === 'restore_document') {
    return <RestoreIcon color="success" {...iconProps} />;
  }

  // Exports
  if (action?.includes('export') || action?.includes('report')) {
    return <ReceiptIcon color="info" {...iconProps} />;
  }

  // Default
  return <HistoryIcon color="action" {...iconProps} />;
};

// ============================================
// COLOR MAPPING
// ============================================
const getEventColor = (event) => {
  const action = event.action || '';
  const metadata = event.metadata || {};
  const downloadType = metadata.download_type;

  if (action?.includes('download') || downloadType) return 'success';
  if (action?.includes('view')) return 'info';
  if (action === 'upload_document') return 'primary';
  if (action?.includes('file_added')) return 'success';
  if (action?.includes('delete')) return 'error';
  if (action === 'otp_verified' || action === 'accept_terms' || action === 'field_completed') return 'success';
  if (action === 'field_edited' || action === 'reminder_sent') return 'warning';
  if (action === 'document_finalized' || action === 'completed' || action === 'restore_document') return 'success';
  if (action === 'void_document' || action === 'recipient_declined' || action === 'decline_terms') return 'error';
  if (action?.includes('export') || action?.includes('report')) return 'info';
  if (action?.includes('invites_sent') || action?.includes('recipients_added')) return 'primary';

  return 'default';
};

// ============================================
// CATEGORY MAPPING
// ============================================
const getEventCategory = (event) => {
  const action = event.action || '';
  const metadata = event.metadata || {};
  const downloadType = metadata.download_type;

  if (action?.includes('download') || downloadType) return 'Downloads';
  if (action?.includes('view')) return 'Document Views';
  if (action?.includes('upload') || action?.includes('create') || action?.includes('rename')) return 'Document Management';
  if (action?.includes('file')) return 'File Management';
  if (action?.includes('recipient') || action?.includes('otp') || action?.includes('terms') || action?.includes('field') || action?.includes('invite') || action?.includes('reminder')) return 'Recipient Actions';
  if (action?.includes('export') || action?.includes('report') || action?.includes('summary')) return 'Reports & Exports';
  if (action === 'document_finalized' || action === 'completed' || action?.includes('void') || action?.includes('delete') || action?.includes('restore')) return 'Status Changes';

  return 'Other Activities';
};

// ============================================
// USER-FRIENDLY TITLES
// Prioritize backend data if available
// ============================================
const getUserFriendlyTitle = (event) => {
  if (event.title) return event.title;

  const action = event.action || '';
  const metadata = event.metadata || {};
  const downloadType = metadata.download_type;

  // Download events
  if (action === 'download_professional_certificate' || downloadType === 'professional_certificate' || downloadType === 'certificate') return 'Certificate Downloaded';
  if (action === 'download_professional_summary' || downloadType === 'professional_summary' || downloadType === 'summary') return 'Document Summary Downloaded';
  if (action === 'download_signed' || downloadType === 'signed') return 'Signed Document Downloaded';
  if (action === 'download_original' || downloadType === 'original') return 'Original Document Downloaded';
  if (action === 'view_document') return 'Document Viewed';
  if (action?.includes('preview')) return 'Preview Viewed';
  if (action === 'upload_document') return 'Document Uploaded';
  if (action === 'create_document_from_template') return 'Created from Template';
  if (action === 'file_added') return 'File Added';
  if (action === 'file_deleted') return 'File Removed';
  if (action === 'otp_verified') return 'OTP Verified';
  if (action === 'accept_terms') return 'Terms Accepted';
  if (action === 'field_completed') return 'Field Completed';
  if (action === 'document_finalized' || action === 'completed') return 'Document Completed';
  if (action === 'void_document') return 'Document Voided';

  // Fallback to action name or 'Activity'
  return action ? action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Activity';
};

// ============================================
// DETAILED DESCRIPTIONS
// Prioritize backend data if available
// ============================================
const getUserFriendlyDescription = (event) => {
  if (event.description) return event.description;

  const action = event.action || '';
  const metadata = event.metadata || {};
  const downloadType = metadata.download_type;
  const user = event.user || 'Someone';

  // Download events with rich metadata
  if (action === 'download_professional_certificate' || downloadType === 'professional_certificate' || downloadType === 'certificate') {
    return `Certificate downloaded${metadata.recipient_name ? ` for ${metadata.recipient_name}` : ''} with ID: ${metadata.certificate_id || ''}`;
  }
  if (action === 'download_professional_summary' || downloadType === 'professional_summary' || downloadType === 'summary') {
    return `Document summary downloaded${metadata.recipient_name ? ` by ${metadata.recipient_name}` : ''} (ID: ${metadata.summary_id || ''})`;
  }
  if (action === 'download_signed' || downloadType === 'signed') {
    return `Signed document "${metadata.filename || ''}" was downloaded`;
  }
  if (action === 'download_original' || downloadType === 'original') {
    return `Original document "${metadata.filename || ''}" was downloaded`;
  }
  if (action === 'view_document') {
    return `Document viewed${metadata.preview_type ? ` (${metadata.preview_type} preview)` : ''}`;
  }
  if (action === 'upload_document') {
    return `Document "${metadata.filename || ''}" was uploaded with envelope ID: ${metadata.envelope_id || ''}`;
  }
  if (action === 'document_finalized' || action === 'completed') {
    return `Document status updated to COMPLETED with envelope ID: ${metadata.envelope_id || event.envelope_id || ''}`;
  }

  // Default with metadata
  if (metadata.envelope_id) {
    return `Activity recorded for envelope: ${metadata.envelope_id}`;
  }

  return `Action performed on document`;
};

// ============================================
// ENRICH EVENT
// ============================================
const enrichEvent = (event) => {
  return {
    ...event,
    userFriendlyTitle: getUserFriendlyTitle(event),
    userFriendlyDescription: getUserFriendlyDescription(event),
    category: getEventCategory(event),
    color: getEventColor(event),
    icon: getEventIcon(event),
  };
};

// ============================================
// TIME FORMATTING
// ============================================
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown';

  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return past.toLocaleDateString();
};

const formatFullDateTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const groupByDate = (events = []) => {
  return events.reduce((acc, event) => {
    if (!event.timestamp) return acc;
    const day = new Date(event.timestamp).toDateString();
    acc[day] = acc[day] || [];
    acc[day].push(event);
    return acc;
  }, {});
};

const formatDayHeader = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }
};

// ============================================
// CATEGORIZE EVENTS
// ============================================
const categorizeEvents = (events = []) => {
  const categories = {
    'Downloads': [],
    'Document Views': [],
    'Document Management': [],
    'File Management': [],
    'Recipient Actions': [],
    'Status Changes': [],
    'Other Activities': [],
  };

  events.forEach(event => {
    const category = event.category || 'Other Activities';
    if (categories[category]) {
      categories[category].push(event);
    } else {
      categories['Other Activities'].push(event);
    }
  });

  return categories;
};

// ============================================
// METADATA DISPLAY
// ============================================
const MetadataDisplay = ({ metadata }) => {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  // Filter out empty values and format nicely
  const displayItems = Object.entries(metadata)
    .filter(([key, value]) =>
      value &&
      typeof value !== 'object' &&
      !key.includes('user_agent') &&
      !key.includes('ip')
    )
    .slice(0, 5); // Show only first 5 items

  if (displayItems.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {displayItems.map(([key, value]) => {
        let displayValue = String(value);
        if (displayValue.length > 25) {
          displayValue = displayValue.substring(0, 22) + '...';
        }

        return (
          <Chip
            key={key}
            label={`${key.replace(/_/g, ' ')}: ${displayValue}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.65rem', height: 20 }}
          />
        );
      })}
    </Box>
  );
};

// ============================================
// STATISTICS COMPONENT
// ============================================
const EventStatistics = ({ events }) => {
  const theme = useTheme();

  const downloadCount = events.filter(e => e.category === 'Downloads').length;
  const viewCount = events.filter(e => e.category === 'Document Views').length;
  const statusCount = events.filter(e => e.category === 'Status Changes').length;

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon fontSize="small" color="primary" />
          Timeline Overview
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            icon={<HistoryIcon />}
            label={`${events.length} total events`}
            size="small"
            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
          />
          {downloadCount > 0 && (
            <Chip
              icon={<DownloadIcon />}
              label={`${downloadCount} downloads`}
              size="small"
              sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}
            />
          )}
          {viewCount > 0 && (
            <Chip
              icon={<VisibilityIcon />}
              label={`${viewCount} views`}
              size="small"
              sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}
            />
          )}
          {statusCount > 0 && (
            <Chip
              icon={<CheckCircleIcon />}
              label={`${statusCount} status changes`}
              size="small"
              sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ============================================
// CATEGORY FILTER
// ============================================
const EventCategoryFilter = ({ categories, activeCategory, onCategoryChange, totalEvents }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
        <Chip
          label={`All Events (${totalEvents})`}
          onClick={() => onCategoryChange('all')}
          color={activeCategory === 'all' ? 'primary' : 'default'}
          variant={activeCategory === 'all' ? 'filled' : 'outlined'}
          size="small"
        />
        {Object.entries(categories).map(([category, events]) =>
          events.length > 0 && (
            <Chip
              key={category}
              label={`${category} (${events.length})`}
              onClick={() => onCategoryChange(category)}
              color={activeCategory === category ? 'primary' : 'default'}
              variant={activeCategory === category ? 'filled' : 'outlined'}
              size="small"
            />
          )
        )}
      </Stack>
    </Box>
  );
};

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = () => (
  <Box sx={{ textAlign: "center", py: 8 }}>
    <Paper elevation={0} sx={{ p: 4, maxWidth: 400, mx: 'auto', bgcolor: 'background.default', borderRadius: 2 }}>
      <HistoryIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No Activity Yet
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Timeline events will appear here as you interact with the document
      </Typography>
    </Paper>
  </Box>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function TimelineDrawer({ open, onClose, documentId, documentName }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (!open || !documentId) return;

    const loadTimeline = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Loading timeline for document:', documentId);
        const data = await getTimeline(documentId);
        console.log('Raw timeline data:', data);

        // Sort by timestamp descending (newest first)
        const sortedData = (data || []).sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );
        setTimeline(sortedData);
      } catch (err) {
        console.error('Error loading timeline:', err);
        setError(err.message || "Failed to load timeline. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [open, documentId]);

  // Enrich events with user-friendly data
  const enrichedTimeline = timeline.map(enrichEvent);
  console.log('Enriched timeline:', enrichedTimeline);

  // Categorize events
  const eventCategories = categorizeEvents(enrichedTimeline);

  // Filter events by category
  const filteredEvents = activeCategory === 'all'
    ? enrichedTimeline
    : eventCategories[activeCategory] || [];

  const groupedFilteredEvents = groupByDate(filteredEvents);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const isExportMenuOpen = Boolean(exportAnchorEl);

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportAction = (action) => {
    handleExportClose();
    switch (action) {
      case 'recipients':
        exportRecipientsCsv(documentId);
        break;
      case 'timeline':
        exportTimelineCsv(documentId);
        break;
      case 'fields':
        exportFieldsCsv(documentId);
        break;
      case 'report':
        generateHtmlReport(documentId);
        break;
      default:
        break;
    }
  };

  const totalEvents = enrichedTimeline.length;

  const handleViewSummary = () => {
    navigate(`/user/document-summary/${documentId}`);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 600 },
          maxWidth: "100%",
          borderLeft: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: 'background.paper' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon color="primary" />
              Document Timeline
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {documentName || 'Document History'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {totalEvents > 0 && (
              <>
                <Tooltip title="Export Data">
                  <IconButton onClick={handleExportClick} size="small" color="primary">
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={exportAnchorEl}
                  open={isExportMenuOpen}
                  onClose={handleExportClose}
                  PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 200, mt: 1, borderRadius: 2 }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase' }}>
                    Export Options
                  </Typography>
                  <MenuItem onClick={() => handleExportAction('timeline')}>
                    <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Export Timeline (CSV)" secondary="Full activity history" />
                  </MenuItem>
                  <MenuItem onClick={() => handleExportAction('recipients')}>
                    <ListItemIcon><GroupIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Export Recipients (CSV)" secondary="Recipient status & details" />
                  </MenuItem>
                  <MenuItem onClick={() => handleExportAction('fields')}>
                    <ListItemIcon><CheckCircleIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Export Field Data (CSV)" secondary="Values & completion status" />
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => handleExportAction('report')}>
                    <ListItemIcon><DescriptionIcon fontSize="small" color="primary" /></ListItemIcon>
                    <ListItemText primary="Generate Audit Report" secondary="Professional HTML evidence" />
                  </MenuItem>
                </Menu>
              </>
            )}
            <Tooltip title="Refresh">
              <IconButton onClick={() => window.location.reload()} size="small" disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {loading && (
            <Fade in={loading}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 8 }}>
                <CircularProgress size={40} />
                <Typography sx={{ mt: 2, color: "text.secondary" }}>Loading document history...</Typography>
              </Box>
            </Fade>
          )}

          {error && (
            <Fade in={!!error}>
              <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            </Fade>
          )}

          {!loading && !error && enrichedTimeline.length === 0 && <EmptyState />}

          {!loading && !error && enrichedTimeline.length > 0 && (
            <Fade in={true}>
              <Box>
                <EventStatistics events={enrichedTimeline} />
                <EventCategoryFilter
                  categories={eventCategories}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  totalEvents={totalEvents}
                />

                {Object.keys(groupedFilteredEvents).length === 0 ? (
                  <Alert severity="info" sx={{ mb: 3 }}>No events in this category</Alert>
                ) : (
                  Object.entries(groupedFilteredEvents).map(([day, events]) => (
                    <Box key={day} sx={{ mb: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Divider sx={{ flex: 1 }} />
                        <Typography variant="caption" sx={{ px: 2, py: 0.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 600 }}>
                          {formatDayHeader(day)}
                        </Typography>
                        <Divider sx={{ flex: 1 }} />
                      </Box>

                      {events.map((event, index) => {
                        const eventColor = event.color || 'default';
                        const themeColor = theme.palette[eventColor]?.main || theme.palette.grey[500];

                        return (
                          <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={event.id || `${day}-${index}`}>
                            <Card variant="outlined" sx={{ mb: 2, transition: 'all 0.2s', '&:hover': { boxShadow: 2, borderColor: 'primary.light' } }}>
                              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                  <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(themeColor, 0.1), color: themeColor }}>
                                    {event.icon}
                                  </Avatar>

                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.5 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {event.userFriendlyTitle}
                                      </Typography>
                                      <Tooltip title={formatFullDateTime(event.timestamp)}>
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2, whiteSpace: 'nowrap' }}>
                                          {formatTimeAgo(event.timestamp)}
                                        </Typography>
                                      </Tooltip>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" paragraph>
                                      {event.userFriendlyDescription}
                                    </Typography>

                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                                      {event.user && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                          <PersonIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                                          <Typography variant="caption" color="text.primary" sx={{ fontWeight: 500 }}>
                                            {event.user}
                                          </Typography>
                                        </Box>
                                      )}
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                                        <Typography variant="caption" color="text.secondary">
                                          {event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                                        </Typography>
                                      </Box>
                                    </Box>

                                    <MetadataDisplay metadata={event.metadata} />

                                    <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                                      <Chip label={event.category} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: alpha(themeColor, 0.1), color: themeColor, fontWeight: 500 }} />

                                      {event.document_status && (
                                        <Chip
                                          label={event.document_status.replace('_', ' ').toUpperCase()}
                                          size="small"
                                          color={
                                            event.document_status === "completed" ? "success" :
                                              event.document_status === "voided" ? "error" : "default"
                                          }
                                          variant="outlined"
                                          sx={{ fontSize: '0.65rem', height: 20 }}
                                        />
                                      )}

                                      {(event.envelope_id || event.metadata?.envelope_id) && (
                                        <Tooltip title="Envelope ID">
                                          <Chip
                                            icon={<DescriptionIcon sx={{ fontSize: 12 }} />}
                                            label={event.envelope_id || event.metadata?.envelope_id}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.65rem', height: 20 }}
                                          />
                                        </Tooltip>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </Zoom>
                        );
                      })}
                    </Box>
                  ))
                )}
              </Box>
            </Fade>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2.5, borderTop: "1px solid", borderColor: "divider", bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            {totalEvents === 0 ? "No events recorded" : `${totalEvents} event${totalEvents !== 1 ? 's' : ''}`}
          </Typography>

          {documentId && (
            <Button variant="contained" startIcon={<SummarizeIcon />} onClick={handleViewSummary} size="small" sx={{ textTransform: 'none', px: 2 }}>
              View Summary
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}