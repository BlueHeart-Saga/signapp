import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
  Avatar,
  LinearProgress,
  Container,
  Grid,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Badge,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Fade
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as DocumentIcon,
  AccessTime as PendingIcon,
  CheckCircle as CompletedIcon,
  TrendingUp as TrendingIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Create as CreateIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Cloud as CloudIcon,
  Dashboard as DashboardIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Schedule as ScheduleIcon,
  VerifiedUser as VerifiedUserIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as GetAppIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountCircle as AccountCircleIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Analytics as AnalyticsIcon,
  BugReport as BugReportIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

// Stat Card Component
const StatCard = ({ title, value, icon, color, trend, trendValue, subtitle }) => (
  <Card sx={{
    height: '100%',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 3
    }
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <Avatar sx={{ bgcolor: `${color}.light`, width: 48, height: 48 }}>
            {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 24 } })}
          </Avatar>
          {trend && (
            <Chip
              size="small"
              label={trendValue}
              color={trend === 'up' ? 'success' : 'error'}
              icon={trend === 'up' ?
                <ArrowUpwardIcon sx={{ fontSize: 14 }} /> :
                <ArrowDownwardIcon sx={{ fontSize: 14 }} />
              }
              sx={{ height: 24, '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } }}
            />
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Activity Item Component
const ActivityItem = ({ log }) => {
  const getIcon = () => {
    if (log.action?.includes('create')) return <PersonAddIcon fontSize="small" />;
    if (log.action?.includes('update')) return <CreateIcon fontSize="small" />;
    if (log.action?.includes('delete')) return <WarningIcon fontSize="small" />;
    if (log.action?.includes('login')) return <LockIcon fontSize="small" />;
    return <EmailIcon fontSize="small" />;
  };

  const getColor = () => {
    if (log.action?.includes('create')) return 'success';
    if (log.action?.includes('update')) return 'info';
    if (log.action?.includes('delete')) return 'error';
    if (log.action?.includes('login')) return 'warning';
    return 'primary';
  };

  return (
    <ListItem sx={{ px: 2, py: 1.5 }}>
      <ListItemAvatar>
        <Avatar sx={{ width: 36, height: 36, bgcolor: `${getColor()}.light` }}>
          {getIcon()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {log.admin_email?.split('@')[0] || 'System'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {log.action?.replace(/_/g, ' ')}
            </Typography>
            {log.target_email && (
              <Chip
                label={log.target_email.split('@')[0]}
                size="small"
                variant="outlined"
                sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
              />
            )}
          </Box>
        }
        secondary={
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
          </Typography>
        }
      />
    </ListItem>
  );
};

// Document Row Component
const DocumentRow = ({ doc }) => (
  <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{
          width: 36,
          height: 36,
          bgcolor:
            doc.status === 'completed' ? 'success.light' :
              doc.status === 'pending' ? 'warning.light' :
                'info.light'
        }}>
          {doc.status === 'completed' ? <CompletedIcon sx={{ fontSize: 18 }} /> :
            doc.status === 'pending' ? <PendingIcon sx={{ fontSize: 18 }} /> :
              <DocumentIcon sx={{ fontSize: 18 }} />}
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {doc.name || 'Untitled Document'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {doc.id?.slice(-8)}
          </Typography>
        </Box>
      </Box>
    </TableCell>
    <TableCell>
      <Chip
        label={doc.status?.toUpperCase()}
        size="small"
        color={
          doc.status === 'completed' ? 'success' :
            doc.status === 'pending' ? 'warning' :
              'default'
        }
        sx={{ height: 24, '& .MuiChip-label': { px: 1.5, fontSize: '0.75rem', fontWeight: 600 } }}
      />
    </TableCell>
    <TableCell>
      <Typography variant="body2">
        {doc.created_by_name?.split('@')[0] || 'N/A'}
      </Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">
        {doc.recipients?.length || 0} recipient{(doc.recipients?.length || 0) !== 1 ? 's' : ''}
      </Typography>
    </TableCell>
    <TableCell>
      <Tooltip title={format(new Date(doc.created_at), 'PPpp')}>
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
        </Typography>
      </Tooltip>
    </TableCell>
    <TableCell align="right">
      <IconButton size="small" component={Link} to={`/documents/${doc.id}`}>
        <VisibilityIcon fontSize="small" />
      </IconButton>
    </TableCell>
  </TableRow>
);

// User Row Component
const UserRow = ({ user }) => (
  <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: '#f0fdfa', color: '#0f766e', fontSize: '0.875rem' }}>
          {user.email?.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {user.full_name || 'No name provided'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
      </Box>
    </TableCell>
    <TableCell>
      <Chip
        label={user.role?.toUpperCase()}
        size="small"
        color={user.role === 'admin' ? 'error' : 'default'}
        sx={{ height: 24, ...(user.role !== 'admin' && { bgcolor: '#0f766e', color: '#ffffff' }), '& .MuiChip-label': { px: 1.5, fontSize: '0.75rem', fontWeight: 600 } }}
      />
    </TableCell>
    <TableCell>
      <Chip
        label={user.is_active ? 'Active' : 'Inactive'}
        size="small"
        color={user.is_active ? 'success' : 'default'}
        sx={{ height: 24, '& .MuiChip-label': { px: 1.5, fontSize: '0.75rem' } }}
      />
    </TableCell>
    <TableCell>
      <Typography variant="body2">
        {user.organization_name || 'N/A'}
      </Typography>
    </TableCell>
    <TableCell>
      <Tooltip title={format(new Date(user.created_at), 'PPpp')}>
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
        </Typography>
      </Tooltip>
    </TableCell>
    <TableCell align="right">
      <IconButton size="small" component={Link} to={`/admin/users/${user.id}`}>
        <VisibilityIcon fontSize="small" />
      </IconButton>
    </TableCell>
  </TableRow>
);

export default function AdminDashboard() {
  const theme = useTheme();
  const { user: currentUser, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);

  // Fetch functions
  const fetchDashboardSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Unable to load dashboard data');
      setDashboardData({
        timestamp: new Date().toISOString(),
        users: { total: 0, active: 0, new_today: 0, new_week: 0, new_month: 0 },
        documents: { total: 0, pending: 0, completed: 0, draft: 0 },
        templates: { total: 0, used: 0 },
        storage: { used: 0, total: 1024, percentage: 0 }
      });
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users?page=1&limit=5&sort_by=created_at&sort_order=-1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching recent users:', err);
    }
  };

  const fetchRecentDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents?limit=5&sort_by=created_at&sort_order=-1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching recent documents:', err);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/admin-logs?limit=8`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    }
  };

  const loadData = async () => {
    setRefreshing(true);
    setError('');
    try {
      await Promise.all([
        fetchDashboardSummary(),
        fetchRecentUsers(),
        fetchRecentDocuments(),
        fetchActivityLogs()
      ]);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load some data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsClick = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  if (loading && !dashboardData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  const completionRate = Math.round((dashboardData?.documents?.completed || 0) / (dashboardData?.documents?.total || 1) * 100);
  const activeUserRate = Math.round((dashboardData?.users?.active || 0) / (dashboardData?.users?.total || 1) * 100);

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Top Navigation Bar - Full Width */}
      <Paper sx={{
        borderRadius: 0,
        px: 4,
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DashboardIcon sx={{ color: '#0f766e', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                SafeSign Admin
              </Typography>
              <Chip
                label="PRODUCTION"
                size="small"
                sx={{ height: 24, bgcolor: '#0f766e', color: '#ffffff', '& .MuiChip-label': { px: 1.5, fontSize: '0.7rem', fontWeight: 600 } }}
              />
            </Box>

            <TextField
              size="small"
              placeholder="Search users, documents, logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* <Tooltip title="System Status">
              <IconButton size="small">
                <Badge color="success" variant="dot">
                  <StorageIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton size="small" onClick={handleNotificationsClick}>
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton size="small">
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Help">
              <IconButton size="small">
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip> */}

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: '#0f766e' }}>
                {currentUser?.email?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {currentUser?.email?.split('@')[0]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrator
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleMenuClick}>
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Menus */}
      {/* <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Account Settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SecurityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Security</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu> */}

      {/* <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        TransitionComponent={Fade}
        PaperProps={{ sx: { width: 320 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Notifications</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleNotificationsClose}>
          <ListItemIcon>
            <Badge color="error" variant="dot">
              <PersonAddIcon fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary="New user registered"
            secondary="5 minutes ago"
          />
        </MenuItem>
        <MenuItem onClick={handleNotificationsClose}>
          <ListItemIcon>
            <Badge color="warning" variant="dot">
              <DescriptionIcon fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary="Document pending signature"
            secondary="10 minutes ago"
          />
        </MenuItem>
        <MenuItem onClick={handleNotificationsClose}>
          <ListItemIcon>
            <Badge color="success" variant="dot">
              <CheckCircleIcon fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary="Document completed"
            secondary="1 hour ago"
          />
        </MenuItem>
      </Menu> */}

      {/* Main Content - Full Width Container */}
      <Container maxWidth={false} sx={{ py: 3, px: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Dashboard Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Here's what's happening with your platform today.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<GetAppIcon />}
              sx={{ textTransform: 'none', color: '#0f766e', borderColor: '#0f766e', '&:hover': { borderColor: '#0c5e57', bgcolor: '#f0fdfa' } }}
            >
              Export Report
            </Button>
            <Button
              variant="contained"
              size="medium"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ textTransform: 'none', bgcolor: '#0f766e', '&:hover': { bgcolor: '#0c5e57' } }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Stats Grid - Full Width */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={dashboardData?.users?.total || 0}
              icon={<PeopleIcon />}
              color="primary"
              trend="up"
              trendValue={`+${dashboardData?.users?.new_today || 0} today`}
              subtitle={`${dashboardData?.users?.active || 0} active`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Users"
              value={activeUserRate + '%'}
              icon={<VerifiedUserIcon />}
              color="success"
              trend={activeUserRate > 75 ? "up" : "down"}
              trendValue={`${dashboardData?.users?.active || 0}/${dashboardData?.users?.total || 0}`}
              subtitle={`${dashboardData?.users?.new_week || 0} this week`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Documents"
              value={dashboardData?.documents?.total || 0}
              icon={<AssignmentIcon />}
              color="info"
              trend="up"
              trendValue={`${dashboardData?.documents?.completed || 0} completed`}
              subtitle={`${dashboardData?.documents?.pending || 0} pending`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completion Rate"
              value={completionRate + '%'}
              icon={<CompletedIcon />}
              color="warning"
              trend={completionRate > 70 ? "up" : "down"}
              trendValue={`${dashboardData?.documents?.completed || 0} signed`}
              subtitle={`${dashboardData?.documents?.draft || 0} drafts`}
            />
          </Grid>
        </Grid>

        {/* Quick Actions Bar - Full Width */}
        {/* <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="contained"
              size="medium"
              startIcon={<PersonAddIcon />}
              component={Link}
              to="/admin/users/create"
              sx={{ textTransform: 'none' }}
            >
              Add New User
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<CreateIcon />}
              component={Link}
              to="/templates/create"
              sx={{ textTransform: 'none' }}
            >
              Create Template
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<EmailIcon />}
              component={Link}
              to="/documents/create"
              sx={{ textTransform: 'none' }}
            >
              New Document
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<SettingsIcon />}
              component={Link}
              to="/admin/settings"
              sx={{ textTransform: 'none' }}
            >
              System Settings
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<AnalyticsIcon />}
              component={Link}
              to="/admin/analytics"
              sx={{ textTransform: 'none' }}
            >
              Analytics
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<BugReportIcon />}
              component={Link}
              to="/admin/logs"
              sx={{ textTransform: 'none' }}
            >
              System Logs
            </Button>
          </Stack>
        </Paper> */}

        {/* Recent Documents - Full Width */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Recent Documents
              </Typography>
              <Chip
                label={`${recentDocuments.length} documents`}
                size="small"
                variant="outlined"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<FilterListIcon />}
                sx={{ textTransform: 'none', color: '#0f766e' }}
              >
                Filter
              </Button>
              <Button
                size="small"
                variant="contained"
                component={Link}
                to="/documents"
                endIcon={<VisibilityIcon fontSize="small" />}
                sx={{ textTransform: 'none', bgcolor: '#0f766e', '&:hover': { bgcolor: '#0c5e57' } }}
              >
                View All Documents
              </Button>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'transparent', fontWeight: 600, fontSize: '0.85rem' } }}>
                  <TableCell>Document</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Recipients</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentDocuments.slice(0, 5).map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
                {recentDocuments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <DocumentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        No documents yet
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        component={Link}
                        to="/documents/create"
                        sx={{ mt: 2, textTransform: 'none', color: '#0f766e', borderColor: '#0f766e', '&:hover': { borderColor: '#0c5e57', bgcolor: '#f0fdfa' } }}
                      >
                        Create First Document
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Recent Users - Full Width */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                New Users
              </Typography>
              <Chip
                label={`${recentUsers.length} users`}
                size="small"
                variant="outlined"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<FilterListIcon />}
                sx={{ textTransform: 'none', color: '#0f766e' }}
              >
                Filter
              </Button>
              <Button
                size="small"
                variant="contained"
                component={Link}
                to="/admin/users"
                endIcon={<VisibilityIcon fontSize="small" />}
                sx={{ textTransform: 'none', bgcolor: '#0f766e', '&:hover': { bgcolor: '#0c5e57' } }}
              >
                View All Users
              </Button>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'transparent', fontWeight: 600, fontSize: '0.85rem' } }}>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentUsers.slice(0, 5).map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
                {recentUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        No users yet
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        component={Link}
                        to="/admin/users/create"
                        sx={{ mt: 2, textTransform: 'none', color: '#0f766e', borderColor: '#0f766e', '&:hover': { borderColor: '#0c5e57', bgcolor: '#f0fdfa' } }}
                      >
                        Add First User
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Activity Logs and System Status - Full Width Two Columns */}
        {/* <Grid container spacing={2} sx={{ mb: 3 }}> */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  Activity Logs
                </Typography>
                <Chip
                  label={`${activityLogs.length} events`}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Button
                size="small"
                variant="outlined"
                component={Link}
                to="/admin/logs"
                endIcon={<VisibilityIcon fontSize="small" />}
                sx={{ textTransform: 'none', color: '#0f766e', borderColor: '#0f766e', '&:hover': { borderColor: '#0c5e57', bgcolor: '#f0fdfa' } }}
              >
                View All Logs
              </Button>
            </Box>

            <List sx={{ p: 0 }}>
              {activityLogs.slice(0, 6).map((log, index) => (
                <React.Fragment key={index}>
                  <ActivityItem log={log} />
                  {index < Math.min(activityLogs.length, 6) - 1 && <Divider />}
                </React.Fragment>
              ))}
              {activityLogs.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    No activity logs
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>


        {/* </Grid> */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 2 }}>
              System Status
            </Typography>

            <Stack spacing={2.5}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>System Health</Typography>
                  <Chip label="98.5%" size="small" color="success" sx={{ height: 20 }} />
                </Box>
                <LinearProgress variant="determinate" value={98.5} sx={{ height: 6, borderRadius: 3 }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="body2">API Service</Typography>
                </Box>
                <Chip label="Operational" size="small" color="success" sx={{ height: 24 }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="body2">Database</Typography>
                </Box>
                <Chip label="Healthy" size="small" color="success" sx={{ height: 24 }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                  <Typography variant="body2">Storage</Typography>
                </Box>
                <Chip label="85% used" size="small" color="warning" sx={{ height: 24 }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="body2">Cache Service</Typography>
                </Box>
                <Chip label="Operational" size="small" color="success" sx={{ height: 24 }} />
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Quick Stats</Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">Active Sessions</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>247</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">API Calls (24h)</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>12.4k</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">Avg Response Time</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>234ms</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">Error Rate</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>0.02%</Typography>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Storage Usage</Typography>
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">Documents</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>4.2 GB</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={60} sx={{ height: 4, borderRadius: 2 }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">Backups</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>2.8 GB</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={40} sx={{ height: 4, borderRadius: 2 }} />
                </Box>
              </Box>

              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<UpdateIcon />}
                sx={{ textTransform: 'none', color: '#0f766e', borderColor: '#0f766e', '&:hover': { borderColor: '#0c5e57', bgcolor: '#f0fdfa' } }}
              >
                System Update Available
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Performance Metrics - Full Width */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 3 }}>
            Performance Metrics
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">User Growth (This Month)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    +{dashboardData?.users?.new_month || 0}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((dashboardData?.users?.new_month || 0) * 2, 100)}
                  sx={{ height: 8, borderRadius: 4, bgcolor: '#f0fdfa', '& .MuiLinearProgress-bar': { bgcolor: '#0f766e' } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Target: 500</Typography>
                  <Typography variant="caption" color="text.secondary">75% of goal</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">Document Completion Rate</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {completionRate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={completionRate}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="success"
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Target: 85%</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {completionRate > 85 ? 'Exceeding' : 'Below'} target
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">User Engagement</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {activeUserRate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={activeUserRate}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="info"
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Active users</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dashboardData?.users?.active || 0} online
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Footer - Full Width */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Document Signing Platform • Admin Dashboard v2.0 • Last updated: {format(new Date(), 'PPpp')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  © {new Date().getFullYear()} All rights reserved
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Privacy Policy
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Terms of Service
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}