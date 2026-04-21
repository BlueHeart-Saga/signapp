import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
  Paper,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  Skeleton,
  Stack,
  alpha,
  useTheme,
  Fade
} from '@mui/material';
import {
  Search as SearchIcon,
  Description as DocumentIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Schedule as ScheduledIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  MoreVert as MoreIcon,
  FileCopy as CopyIcon,
  Email as EmailIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Person as PersonIcon,
  PictureAsPdf as PdfIcon,
  AccessTime as TimeIcon,
  Verified as VerifiedIcon,
  Fingerprint as FingerprintIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, formatDistance } from 'date-fns';
import api from '../services/api';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';


// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, trend }) => {
  const theme = useTheme();
  
  const getColorValue = (colorName) => {
    switch(colorName) {
      case 'primary': return 'rgb(46, 125, 50)';
      case 'success': return 'rgb(46, 125, 50)';
      case 'warning': return 'rgb(237, 108, 2)';
      case 'info': return 'rgb(2, 136, 209)';
      case 'error': return 'rgb(211, 47, 47)';
      default: return 'rgb(46, 125, 50)';
    }
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: alpha(getColorValue(color), 0.1),
              color: getColorValue(color),
              width: 48,
              height: 48
            }}
          >
            <Icon />
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: getColorValue('success') }}>
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Document Card Component
const DocumentCard = ({ document, recipient, onMenuOpen, onView, onDownload, token }) => {
  const theme = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'rgb(46, 125, 50)';
      case 'sent':
      case 'in_progress': return 'rgb(237, 108, 2)';
      case 'expired': return 'rgb(211, 47, 47)';
      default: return 'rgb(156, 163, 175)';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'completed': return 'rgba(46, 125, 50, 0.1)';
      case 'sent':
      case 'in_progress': return 'rgba(237, 108, 2, 0.1)';
      case 'expired': return 'rgba(211, 47, 47, 0.1)';
      default: return 'rgba(156, 163, 175, 0.1)';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'sent': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'signer': return 'Signer';
      case 'approver': return 'Approver';
      case 'viewer': return 'Viewer';
      case 'form_filler': return 'Form Filler';
      case 'witness': return 'Witness';
      default: return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'signer': return <FingerprintIcon fontSize="small" />;
      case 'approver': return <VerifiedIcon fontSize="small" />;
      case 'viewer': return <ViewIcon fontSize="small" />;
      case 'form_filler': return <DocumentIcon fontSize="small" />;
      case 'witness': return <PersonIcon fontSize="small" />;
      default: return <DocumentIcon fontSize="small" />;
    }
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    onDownload(document.id, true);
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        minWidth: 450,
        maxWidth: 450,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          borderColor: 'transparent'
        }
      }}
      onClick={() => onView(document.id)}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header with Status and Role */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              bgcolor: getStatusBgColor(document.status),
              border: `1px solid ${alpha(getStatusColor(document.status), 0.2)}`
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: getStatusColor(document.status),
                mr: 1
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, color: getStatusColor(document.status) }}>
              {getStatusLabel(document.status)}
            </Typography>
          </Box>
          
          <Tooltip title={`Role: ${getRoleLabel(recipient.role)}`}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'rgb(46, 125, 50)'
              }}
            >
              {getRoleIcon(recipient.role)}
            </Avatar>
          </Tooltip>
        </Box>

        {/* Document Icon and Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 48,
              height: 48,
              mr: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'rgb(46, 125, 50)'
            }}
          >
            <PdfIcon />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
              {document.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 20, height: 20, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <Typography variant="caption" sx={{ color: 'rgb(46, 125, 50)' }}>
                  {document.sender_name?.charAt(0) || 'S'}
                </Typography>
              </Avatar>
              <Typography variant="caption" color="text.secondary" noWrap>
                {document.sender_name || document.sender_email}
              </Typography>
            </Stack>
          </Box>
        </Box>

        {/* Envelope ID */}
        {document.envelope_id && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Envelope: {document.envelope_id}
          </Typography>
        )}

        {/* Progress Bar */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: getStatusColor(document.status) }}>
              {recipient.status === 'completed' ? '100%' : 'Pending'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={recipient.status === 'completed' ? 100 : recipient.status === 'in_progress' ? 50 : 0}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(getStatusColor(document.status), 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: getStatusColor(document.status),
                borderRadius: 3
              }
            }}
          />
        </Box>

        {/* Footer with Dates */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Tooltip title={`Sent: ${format(new Date(document.created_at), 'PPP')}`}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimeIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                {formatDistance(new Date(document.created_at), new Date(), { addSuffix: true })}
              </Typography>
            </Box>
          </Tooltip>
          
          {document.completed_at && (
            <Chip
              size="small"
              icon={<CompletedIcon />}
              label="Signed"
              sx={{
                bgcolor: 'rgba(46, 125, 50, 0.1)',
                color: 'rgb(46, 125, 50)',
                height: 24,
                '& .MuiChip-icon': { fontSize: 14, color: 'rgb(46, 125, 50)' }
              }}
            />
          )}
        </Box>
      </CardContent>

      <Divider />
      
      <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onView(document.id);
          }}
          sx={{ color: 'text.secondary' }}
        >
          View
        </Button>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadClick}
          disabled={document.status !== 'completed'}
          sx={{ 
            color: document.status === 'completed' ? 'rgb(46, 125, 50)' : 'text.disabled',
            '&:hover': document.status === 'completed' ? {
              bgcolor: 'rgba(46, 125, 50, 0.04)'
            } : {}
          }}
        >
          Download
        </Button>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            onMenuOpen(e, { document, recipient });
          }}
        >
          <MoreIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const token = localStorage.getItem('recipientToken');

 useEffect(() => {
  const storedToken = localStorage.getItem('recipientToken');

  // Reject invalid values that often appear after refresh
  if (!storedToken || storedToken === 'undefined' || storedToken === 'null') {
    navigate('/recipient/access', { replace: true });
    return;
  }

  fetchData(storedToken);
}, []);


  const fetchData = async (authToken) => {
  setLoading(true);

  try {
    const docsResponse = await api.get('/api/recipient-docs/documents', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    setDocuments(docsResponse.data.documents || []);

    const statsResponse = await api.get('/api/recipient-history/summary', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    setStats(statsResponse.data);

  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('recipientToken');
      navigate('/recipient/access', { replace: true });
      return;
    }

    setSnackbar({
      open: true,
      message: 'Error loading documents',
      severity: 'error'
    });

  } finally {
    setLoading(false);
  }
};


  const handleDownload = async (docId, includeSignatures = true) => {
    try {
      const response = await api.get(
        `/api/recipient-docs/document/${docId}/download?include_signatures=${includeSignatures}`,
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

      const doc = documents.find(d => d.document.id === docId);
      let filename = `document_${includeSignatures ? 'signed' : 'copy'}.pdf`;
      
      if (doc?.document?.name) {
        const safeName = doc.document.name
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
    handleMenuClose();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event, doc) => {
    setAnchorEl(event.currentTarget);
    setSelectedDoc(doc);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDoc(null);
  };

  const handleFilterOpen = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchor(null);
  };

  const handleViewDocument = (docId) => {
    navigate(`/recipient/documents/${docId}`);
    handleMenuClose();
  };

  const handleViewHistory = (docId) => {
    navigate(`/recipient/history/${docId}`);
    handleMenuClose();
  };

  const handleViewSummary = (docId) => {
    navigate(`/recipient/summary/${docId}`);
    handleMenuClose();
  };

  const handleCopyLink = (docId) => {
    const link = `${window.location.origin}/recipient/documents/${docId}?token=${token}`;
    navigator.clipboard.writeText(link);
    setSnackbar({
      open: true,
      message: 'Link copied to clipboard',
      severity: 'success'
    });
    handleMenuClose();
  };

  // Filter and sort documents
  const getFilteredDocuments = () => {
    let filtered = [...documents];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.document.sender_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.document.envelope_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.document.status === statusFilter);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.document.created_at);
      const dateB = new Date(b.document.created_at);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  const filteredDocuments = getFilteredDocuments();

  const pendingDocs = filteredDocuments.filter(item => 
    ['sent', 'in_progress'].includes(item.document.status)
  );
  const completedDocs = filteredDocuments.filter(item => item.document.status === 'completed');

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 4 }} />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                 <Box
            sx={{
              // position: "fixed",
              top: 20,
              left: 20,
              zIndex: 2000,
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
                color: "#0f766e",
                letterSpacing: 0.3,
              }}
            >
              SafeSign
            </Typography>
          </Box>
          
          <Box>
            {/* <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Your Documents
            </Typography> */}
            <Typography variant="body1" color="text.secondary">
              View and manage all documents sent to you
            </Typography>
          </Box>
         
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ borderColor: theme.palette.divider }}
          >
            Refresh
          </Button>
        </Box>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Documents"
                value={stats.total_documents}
                icon={DocumentIcon}
                color="primary"
                subtitle="All time"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completed"
                value={stats.completed_documents}
                icon={CompletedIcon}
                color="success"
                subtitle={`${stats.total_documents > 0 
                  ? Math.round((stats.completed_documents / stats.total_documents) * 100)
                  : 0}% completion rate`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending"
                value={stats.pending_documents}
                icon={PendingIcon}
                color="warning"
                subtitle="Awaiting action"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Signatures"
                value={stats.total_signatures || 0}
                icon={FingerprintIcon}
                color="info"
                subtitle="Across all documents"
              />
            </Grid>
          </Grid>
        )}

        {/* Search and Filter Bar */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            mb: 3,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by document name, sender, or envelope ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'rgb(46, 125, 50)',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={handleFilterOpen}
                sx={{ 
                  borderColor: theme.palette.divider,
                  color: 'text.primary',
                  justifyContent: 'space-between'
                }}
              >
                <span>Status: {statusFilter === 'all' ? 'All' : statusFilter}</span>
              </Button>
              <Menu
                anchorEl={filterAnchor}
                open={Boolean(filterAnchor)}
                onClose={handleFilterClose}
                TransitionComponent={Fade}
              >
                <MenuItem onClick={() => { setStatusFilter('all'); handleFilterClose(); }}>
                  <ListItemText>All Documents</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setStatusFilter('sent'); handleFilterClose(); }}>
                  <ListItemIcon><ScheduledIcon sx={{ color: 'rgb(2, 136, 209)' }} /></ListItemIcon>
                  <ListItemText>Pending</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { setStatusFilter('in_progress'); handleFilterClose(); }}>
                  <ListItemIcon><PendingIcon sx={{ color: 'rgb(237, 108, 2)' }} /></ListItemIcon>
                  <ListItemText>In Progress</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { setStatusFilter('completed'); handleFilterClose(); }}>
                  <ListItemIcon><CompletedIcon sx={{ color: 'rgb(46, 125, 50)' }} /></ListItemIcon>
                  <ListItemText>Completed</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { setStatusFilter('expired'); handleFilterClose(); }}>
                  <ListItemIcon><ScheduledIcon sx={{ color: 'rgb(211, 47, 47)' }} /></ListItemIcon>
                  <ListItemText>Expired</ListItemText>
                </MenuItem>
              </Menu>
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                sx={{ 
                  borderColor: theme.palette.divider,
                  color: 'text.primary',
                  justifyContent: 'space-between'
                }}
              >
                <span>{sortBy === 'newest' ? 'Newest First' : 'Oldest First'}</span>
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root.Mui-selected': {
                color: 'rgb(46, 125, 50)'
              },
              '& .MuiTabs-indicator': {
                bgcolor: 'rgb(46, 125, 50)'
              }
            }}
          >
            <Tab 
              label={
                <Badge 
                  badgeContent={filteredDocuments.length} 
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: 'rgb(46, 125, 50)',
                      color: 'white'
                    }
                  }}
                >
                  All Documents
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge 
                  badgeContent={pendingDocs.length} 
                  color="warning"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: 'rgb(237, 108, 2)',
                      color: 'white'
                    }
                  }}
                >
                  Pending
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge 
                  badgeContent={completedDocs.length} 
                  color="success"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: 'rgb(46, 125, 50)',
                      color: 'white'
                    }
                  }}
                >
                  Completed
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        {/* All Documents Tab - 3 Cards Per Row */}
        <TabPanel value={tabValue} index={0}>
          {filteredDocuments.length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 6, 
                textAlign: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                bgcolor: '#f8fafc'
              }}
            >
              <DocumentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                No documents found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm 
                  ? 'Try adjusting your search or filters'
                  : 'You don\'t have any documents yet'}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredDocuments.map((item) => (
                <Grid item xs={12} md={6} lg={4} key={item.document.id}>
                  <DocumentCard
                    document={item.document}
                    recipient={item.recipient}
                    onMenuOpen={handleMenuOpen}
                    onView={handleViewDocument}
                    onDownload={handleDownload}
                    token={token}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Pending Tab - 3 Cards Per Row */}
        <TabPanel value={tabValue} index={1}>
          {pendingDocs.length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 6, 
                textAlign: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                bgcolor: '#f8fafc'
              }}
            >
              <CompletedIcon sx={{ fontSize: 80, color: 'rgb(46, 125, 50)', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                All caught up!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You have no pending documents to review
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {pendingDocs.map((item) => (
                <Grid item xs={12} md={6} lg={4} key={item.document.id}>
                  <DocumentCard
                    document={item.document}
                    recipient={item.recipient}
                    onMenuOpen={handleMenuOpen}
                    onView={handleViewDocument}
                    onDownload={handleDownload}
                    token={token}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Completed Tab - 3 Cards Per Row */}
        <TabPanel value={tabValue} index={2}>
          {completedDocs.length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 6, 
                textAlign: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                bgcolor: '#f8fafc'
              }}
            >
              <PendingIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                No completed documents
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Documents you complete will appear here
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {completedDocs.map((item) => (
                <Grid item xs={12} md={6} lg={4} key={item.document.id}>
                  <DocumentCard
                    document={item.document}
                    recipient={item.recipient}
                    onMenuOpen={handleMenuOpen}
                    onView={handleViewDocument}
                    onDownload={handleDownload}
                    token={token}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Document Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          TransitionComponent={Fade}
          PaperProps={{
            elevation: 3,
            sx: { minWidth: 200, borderRadius: 2 }
          }}
        >
          <MenuItem onClick={() => handleViewDocument(selectedDoc?.document.id)}>
            <ListItemIcon><ViewIcon fontSize="small" sx={{ color: 'rgb(46, 125, 50)' }} /></ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => handleDownload(selectedDoc?.document.id, true)}
            disabled={selectedDoc?.document.status !== 'completed'}
          >
            <ListItemIcon><DownloadIcon fontSize="small" sx={{ color: 'rgb(46, 125, 50)' }} /></ListItemIcon>
            <ListItemText>Download Signed Copy</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleDownload(selectedDoc?.document.id, false)}>
            <ListItemIcon><DownloadIcon fontSize="small" sx={{ color: 'rgb(156, 163, 175)' }} /></ListItemIcon>
            <ListItemText>Download Unsigned Copy</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleViewHistory(selectedDoc?.document.id)}>
            <ListItemIcon><HistoryIcon fontSize="small" sx={{ color: 'rgb(2, 136, 209)' }} /></ListItemIcon>
            <ListItemText>View History</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleViewSummary(selectedDoc?.document.id)}>
            <ListItemIcon><AssessmentIcon fontSize="small" sx={{ color: 'rgb(237, 108, 2)' }} /></ListItemIcon>
            <ListItemText>View Summary</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleCopyLink(selectedDoc?.document.id)}>
            <ListItemIcon><CopyIcon fontSize="small" sx={{ color: 'rgb(46, 125, 50)' }} /></ListItemIcon>
            <ListItemText>Copy Link</ListItemText>
          </MenuItem>
        </Menu>

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
      </Container>
    </Box>
  );
};

export default Dashboard;
