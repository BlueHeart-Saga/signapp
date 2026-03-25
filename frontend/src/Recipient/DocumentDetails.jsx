import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  Avatar,
  Card,
  CardContent,
  LinearProgress,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Skeleton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Stack,
  alpha,
  useTheme
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Share as ShareIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Verified as VerifiedIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  CloudDownload as DescriptionIcon,
  Visibility as ViewIcon,
  AccessTime as TimeIcon,
  ContentCopy as CopyIcon,
  InsertDriveFile as FileIcon,
  Security as SecurityIcon,
  Fingerprint as FingerprintIcon,
  Receipt as ReceiptIcon,
  Groups as GroupsIcon,
  Assignment as AssignmentIcon,
  FactCheck as FactCheckIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`details-tabpanel-${index}`}
      aria-labelledby={`details-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Stats Card Component
const StatCard = ({ icon: Icon, label, value, color = 'primary', trend }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ 
          bgcolor: color === 'primary' ? 'rgba(46, 125, 50, 0.1)' : 
                   color === 'success' ? 'rgba(46, 125, 50, 0.1)' :
                   color === 'warning' ? 'rgba(237, 108, 2, 0.1)' :
                   color === 'info' ? 'rgba(2, 136, 209, 0.1)' :
                   color === 'error' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(0, 0, 0, 0.04)',
          color: color === 'primary' ? 'rgb(46, 125, 50)' : 
                 color === 'success' ? 'rgb(46, 125, 50)' :
                 color === 'warning' ? 'rgb(237, 108, 2)' :
                 color === 'info' ? 'rgb(2, 136, 209)' :
                 color === 'error' ? 'rgb(211, 47, 47)' : 'text.secondary'
        }}>
          <Icon />
        </Avatar>
      </Box>
      <Typography variant="h4" component="div" sx={{ mb: 0.5, fontWeight: 'bold' }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {trend && (
        <Typography variant="caption" sx={{ color: 'rgb(46, 125, 50)', mt: 1, display: 'block' }}>
          {trend}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Timeline Item Component
const TimelineItem = ({ event, isLast }) => {
  const theme = useTheme();
  
  const getIcon = () => {
    switch (event.type) {
      case 'sent': return <EmailIcon />;
      case 'viewed': return <ViewIcon />;
      case 'signed': return <FingerprintIcon />;
      case 'completed': return <CheckIcon />;
      case 'reminded': return <ScheduleIcon />;
      default: return <EventNoteIcon />;
    }
  };

  const getColor = () => {
    switch (event.type) {
      case 'signed': return 'rgb(46, 125, 50)';
      case 'completed': return 'rgb(46, 125, 50)';
      case 'sent': return 'rgb(2, 136, 209)';
      case 'viewed': return 'rgb(237, 108, 2)';
      default: return 'text.secondary';
    }
  };

  const getBgColor = () => {
    switch (event.type) {
      case 'signed': return 'rgba(46, 125, 50, 0.1)';
      case 'completed': return 'rgba(46, 125, 50, 0.1)';
      case 'sent': return 'rgba(2, 136, 209, 0.1)';
      case 'viewed': return 'rgba(237, 108, 2, 0.1)';
      default: return 'rgba(0, 0, 0, 0.04)';
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, position: 'relative' }}>
      {!isLast && (
        <Box
          sx={{
            position: 'absolute',
            left: 20,
            top: 40,
            bottom: 0,
            width: 2,
            bgcolor: 'divider'
          }}
        />
      )}
      <Avatar sx={{ bgcolor: getBgColor(), color: getColor(), zIndex: 1 }}>
        {getIcon()}
      </Avatar>
      <Box sx={{ flex: 1, pb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="subtitle2">{event.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(event.timestamp), 'MMM d, h:mm a')}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {event.description}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          By: {event.actor_name}
        </Typography>
      </Box>
    </Box>
  );
};

const DocumentDetails = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [docDetails, setDocDetails] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [shareDialog, setShareDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const token = localStorage.getItem('recipientToken');

  useEffect(() => {
    if (!token) {
      navigate('/recipient/access');
      return;
    }
    fetchDocumentDetails();
  }, [documentId, token]);

  const fetchDocumentDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/recipient-docs/document/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocDetails(response.data);
      fetchPreview();
    } catch (error) {
      console.error('Error fetching document:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('recipientToken');
        navigate('/recipient/access');
      } else {
        setSnackbar({
          open: true,
          message: 'Error loading document details',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    try {
      const response = await api.get(`/api/recipient-docs/document/${documentId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error fetching preview:', error);
    }
  };

  const handleDownload = async (includeSignatures = true) => {
    try {
      const response = await api.get(
        `/api/recipient-docs/document/${documentId}/download?include_signatures=${includeSignatures}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const contentType = response.headers['content-type'];
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.detail || 'Error downloading document');
      }

      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'application/pdf' });

      const url = window.URL.createObjectURL(blob);

      let filename = `document_${includeSignatures ? 'signed' : 'copy'}.pdf`;
      if (docDetails?.document?.name) {
        const safeName = docDetails.document.name
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase();
        filename = `${safeName}_${includeSignatures ? 'signed' : 'copy'}.pdf`;
      }

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Document downloaded successfully',
        severity: 'success'
      });

    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error downloading document',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'sent':
      case 'in_progress': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'signer': return <FingerprintIcon />;
      case 'approver': return <FactCheckIcon />;
      case 'viewer': return <VisibilityIcon />;
      case 'form_filler': return <AssignmentIcon />;
      case 'witness': return <GroupsIcon />;
      default: return <PersonIcon />;
    }
  };

  const getRoleLabel = (role) => {
    return role.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={500} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!docDetails) return null;

  const { document: doc, recipient, all_recipients, fields, timeline } = docDetails;

  // Calculate stats
  const totalFields = fields.length;
  const completedFields = fields.filter(f => f.completed).length;
  const pendingFields = totalFields - completedFields;
  const completedRecipients = all_recipients.filter(r => r.status === 'completed').length;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
               <Box
                    sx={{
                      // position: "fixed",
                      top: 20,
                      left: 20,
                      zIndex: 2000,
                      margin: "45px 45px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: "pointer",
                    }}
                    onClick={() => window.location.href = "/"}
                  >
                    <img
                      src={`${API_BASE_URL}/branding/logo/file`}    // ← replace with your actual logo path
                      alt="Logo"
                      style={{
                        height: 45,
                        objectFit: "contain",
                      }}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontSize: 30,
                        fontWeight: 700,
                        color: "#0d9488",
                        letterSpacing: 0.3,
                      }}
                    >
                      SafeSign
                    </Typography>
                  </Box>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            background: 'linear-gradient(45deg, rgb(46, 125, 50) 0%, rgb(27, 94, 32) 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton 
              onClick={() => navigate('/recipient/dashboard')} 
              sx={{ mr: 2, color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              <BackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
                {doc.name}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={doc.status.toUpperCase()}
                  color={getStatusColor(doc.status)}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 500,
                    '& .MuiChip-label': { px: 2 }
                  }}
                />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Envelope ID: {doc.envelope_id || 'N/A'}
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(true)}
                disabled={doc.status !== 'completed'}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'rgb(46, 125, 50)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                  '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.3)', color: 'white' }
                }}
              >
                Download Signed
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={() => setShareDialog(true)}
                sx={{ 
                  borderColor: 'white', 
                  color: 'white',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Share
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* Preview Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DocumentIcon sx={{ color: 'rgb(46, 125, 50)' }} />
            Document Preview
          </Typography>
          <Box
            sx={{
              height: 400,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
              position: 'relative'
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Document preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <FileIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography color="text.secondary" variant="h6">
                  Preview Not Available
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Click download to view the full document
                </Typography>
              </Box>
            )}
            <Badge
              badgeContent={`${doc.page_count} pages`}
              sx={{ 
                position: 'absolute', bottom: 16, right: 16,
                '& .MuiBadge-badge': { 
                  bgcolor: 'rgba(46, 125, 50, 0)',
                  color: 'black',
                }
              }}
            />
          </Box>
        </Paper>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={ReceiptIcon}
              label="Total Fields"
              value={totalFields}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={CheckIcon}
              label="Completed Fields"
              value={completedFields}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={ScheduleIcon}
              label="Pending Fields"
              value={pendingFields}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={GroupsIcon}
              label="Recipients"
              value={`${completedRecipients}/${all_recipients.length}`}
              color="info"
              trend={`${Math.round((completedRecipients / all_recipients.length) * 100)}% complete`}
            />
          </Grid>
        </Grid>

        {/* Main Content with Tabs */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: '#f8fafc',
              px: 3,
              '& .MuiTab-root.Mui-selected': {
                color: 'rgb(46, 125, 50)'
              },
              '& .MuiTabs-indicator': {
                bgcolor: 'rgb(46, 125, 50)'
              }
            }}
          >
            <Tab 
              label="Fields & Signatures" 
              icon={<FingerprintIcon />} 
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              label="Recipients" 
              icon={<GroupsIcon />} 
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              label="Timeline" 
              icon={<HistoryIcon />} 
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
            <Tab 
              label="Document Info" 
              icon={<FileIcon />} 
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          </Tabs>

          {/* Fields Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Your Assigned Fields
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You have {totalFields} field{totalFields !== 1 ? 's' : ''} to complete
                </Typography>
              </Box>
              
              {fields.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc' }}>
                  <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Fields Assigned
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    There are no fields assigned to you for this document
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {fields.map((field) => (
                    <Grid item xs={12} key={field.id}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2,
                          bgcolor: field.completed ? 'rgba(46, 125, 50, 0.02)' : 'transparent',
                          borderColor: field.completed ? 'rgb(46, 125, 50)' : theme.palette.divider,
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: field.completed ? 'rgb(46, 125, 50)' : 'rgb(46, 125, 50)',
                            boxShadow: 1
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: field.completed 
                                ? 'rgba(46, 125, 50, 0.1)'
                                : 'rgba(237, 108, 2, 0.1)',
                              color: field.completed ? 'rgb(46, 125, 50)' : 'rgb(237, 108, 2)'
                            }}
                          >
                            {field.completed ? <CheckIcon /> : <PendingIcon />}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1">
                                {field.label || field.type.replace('_', ' ').toUpperCase()}
                              </Typography>
                              {field.required && (
                                <Chip 
                                  label="Required" 
                                  size="small" 
                                  color="error" 
                                  variant="outlined"
                                  sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }}
                                />
                              )}
                            </Box>
                            <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
                              <Typography variant="body2" color="text.secondary">
                                Page {field.page + 1}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Type: {field.type.replace('_', ' ').toUpperCase()}
                              </Typography>
                            </Stack>
                            {field.completed && field.completed_at && (
                              <Typography variant="caption" sx={{ color: 'rgb(46, 125, 50)', mt: 1, display: 'block' }}>
                                Completed: {format(new Date(field.completed_at), 'MMM d, yyyy h:mm a')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </TabPanel>

          {/* Recipients Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                All Recipients ({all_recipients.length})
              </Typography>
              <Grid container spacing={2}>
                {all_recipients.map((r) => (
                  <Grid item xs={12} key={r.id}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: r.id === recipient.id 
                              ? 'rgba(46, 125, 50, 0.1)'
                              : 'rgba(0, 0, 0, 0.04)',
                            color: r.id === recipient.id ? 'rgb(46, 125, 50)' : 'text.secondary'
                          }}
                        >
                          {getRoleIcon(r.role)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1">
                              {r.name}
                            </Typography>
                            {r.id === recipient.id && (
                              <Chip 
                                label="You" 
                                size="small" 
                                sx={{ 
                                  height: 20, 
                                  bgcolor: 'rgba(46, 125, 50, 0.1)',
                                  color: 'rgb(46, 125, 50)',
                                  '& .MuiChip-label': { px: 1, fontSize: '0.65rem' }
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {r.email}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <Chip
                              size="small"
                              label={getRoleLabel(r.role)}
                              variant="outlined"
                              sx={{ height: 24 }}
                            />
                            <Chip
                              size="small"
                              label={r.status.toUpperCase()}
                              color={r.status === 'completed' ? 'success' : 'default'}
                              sx={{ height: 24 }}
                            />
                            {r.signing_order > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Order: {r.signing_order}
                              </Typography>
                            )}
                            {r.otp_verified && (
                              <Tooltip title="OTP Verified">
                                <VerifiedIcon sx={{ color: 'rgb(46, 125, 50)' }} fontSize="small" />
                              </Tooltip>
                            )}
                          </Stack>
                          {r.signed_at && (
                            <Typography variant="caption" sx={{ color: 'rgb(46, 125, 50)', mt: 1, display: 'block' }}>
                              Signed: {format(new Date(r.signed_at), 'MMM d, yyyy h:mm a')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </TabPanel>

          {/* Timeline Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Activity Timeline
              </Typography>
              {timeline.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc' }}>
                  <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Timeline Events
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Activity will appear here as the document progresses
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                  {timeline.map((event, index) => (
                    <TimelineItem 
                      key={event.id} 
                      event={event} 
                      isLast={index === timeline.length - 1}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Document Info Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Document Details
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <List sx={{ p: 0 }}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <EventNoteIcon color="action" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Created"
                            secondary={format(new Date(doc.created_at), 'MMMM d, yyyy h:mm a')}
                          />
                        </ListItem>
                        {doc.completed_at && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <CheckIcon sx={{ color: 'rgb(46, 125, 50)' }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Completed"
                              secondary={format(new Date(doc.completed_at), 'MMMM d, yyyy h:mm a')}
                            />
                          </ListItem>
                        )}
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <FileIcon color="action" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Pages"
                            secondary={doc.page_count}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <GroupsIcon color="action" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Total Recipients"
                            secondary={all_recipients.length}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Sender Information
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 56, 
                            height: 56, 
                            mr: 2,
                            bgcolor: 'rgba(46, 125, 50, 0.1)',
                            color: 'rgb(46, 125, 50)'
                          }}
                        >
                          {doc.sender_name?.charAt(0) || doc.sender_email?.charAt(0) || 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">
                            {doc.sender_name || 'Document Sender'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {doc.sender_email}
                          </Typography>
                          {doc.sender_organization && (
                            <Typography variant="body2" color="text.secondary">
                              {doc.sender_organization}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Your Status
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Role
                          </Typography>
                          <Typography variant="h6">
                            {getRoleLabel(recipient.role)}
                          </Typography>
                        </Grid>
                        {recipient.signing_order > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Signing Order
                            </Typography>
                            <Typography variant="h6">
                              #{recipient.signing_order}
                            </Typography>
                          </Grid>
                        )}
                        {recipient.otp_verified && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              OTP Verified
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <VerifiedIcon sx={{ color: 'rgb(46, 125, 50)' }} />
                              <Typography variant="body1">
                                {recipient.otp_verified_at ? 
                                  format(new Date(recipient.otp_verified_at), 'MMM d, yyyy') : 
                                  'Verified'
                                }
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {recipient.terms_accepted && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Terms Accepted
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CheckIcon sx={{ color: 'rgb(46, 125, 50)' }} />
                              <Typography variant="body1">
                                Accepted
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {recipient.signed_at && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Signed
                            </Typography>
                            <Typography variant="body1">
                              {format(new Date(recipient.signed_at), 'MMMM d, yyyy h:mm a')}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </Paper>
      </Container>

      {/* Share Dialog */}
      <Dialog open={shareDialog} onClose={() => setShareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon sx={{ color: 'rgb(46, 125, 50)' }} />
            <Typography variant="h6">Share Document</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Anyone with this link and the OTP can access this document.
          </Alert>
          <TextField
            fullWidth
            value={`${window.location.origin}/recipient/documents/${documentId}?token=${token}`}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/recipient/documents/${documentId}?token=${token}`);
                    setShareDialog(false);
                    setSnackbar({
                      open: true,
                      message: 'Link copied to clipboard',
                      severity: 'success'
                    });
                  }}
                >
                  <CopyIcon />
                </IconButton>
              )
            }}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShareDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentDetails;