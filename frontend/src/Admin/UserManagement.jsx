import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Avatar, List, ListItem, ListItemText, ListItemIcon,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Email as EmailIcon,
  PersonAdd as AddUserIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  LockReset as ResetPasswordIcon,
  PersonRemove as DeactivateIcon,
  PersonAdd as ActivateIcon,
  BarChart as StatsIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import {
  // ... existing imports
  Close as CloseIcon,
  Timeline as TimelineIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Person as PersonIcon,
  AssignmentInd as AssignmentIndIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Calculate as CalculateIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  CalendarMonth as CalendarMonthIcon,
  History as HistoryIcon,
  Create as CreateIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  Cloud as CloudIcon,

} from '@mui/icons-material';
// Add this to your imports at the top
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

const UserManagement = () => {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter states
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [searchOrg, setSearchOrg] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState(-1);

  // Dialog states
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [deactivateDialog, setDeactivateDialog] = useState(false);
  const [activateDialog, setActivateDialog] = useState(false);
  const [statsDialog, setStatsDialog] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    organization_name: '',
    email_verified: true,
    is_active: true
  });

  const [editUser, setEditUser] = useState({
    full_name: '',
    role: '',
    organization_name: '',
    is_active: true,
    email_verified: true
  });

  const [newPassword, setNewPassword] = useState('');

  // Stats states
  const [stats, setStats] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Menu state
  const [actionMenu, setActionMenu] = useState(null);
  const [menuUserId, setMenuUserId] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // API Headers
  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, [token]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  // Format time ago function (add this with your other format functions)
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };


  // Format role
  const formatRole = (role) => {
    const roles = {
      admin: { label: 'Admin', color: 'error' },
      user: { label: 'User', color: 'primary' },
      recipient: { label: 'Recipient', color: 'success' }
    };
    return roles[role] || { label: role, color: 'default' };
  };

  // API Functions

  // Fetch all users with filters
  const fetchUsers = useCallback(async (pageNum = page) => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters
      const params = new URLSearchParams({
        page: pageNum + 1, // Convert 0-indexed to 1-indexed
        limit: rowsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (searchEmail) params.append('email', searchEmail);
      if (searchName) params.append('full_name', searchName);
      if (searchRole) params.append('role', searchRole);
      if (searchOrg) params.append('organization_name', searchOrg);
      if (activeFilter !== '') params.append('is_active', activeFilter);
      if (dateFrom) params.append('date_from', dateFrom.toISOString());
      if (dateTo) params.append('date_to', dateTo.toISOString());

      const response = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalUsers(data.pagination?.total_users || 0);
      setTotalPages(data.pagination?.total_pages || 0);

    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchEmail, searchName, searchRole, searchOrg, activeFilter, dateFrom, dateTo, sortBy, sortOrder, getHeaders]);

  // Fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch user details');

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  // Create new user
  const createUser = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create user');
      }

      const data = await response.json();
      setSuccess('User created successfully');
      fetchUsers();
      setCreateDialog(false);
      resetNewUserForm();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update user
  const updateUser = async (userId, userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user');
      }

      const data = await response.json();
      setSuccess('User updated successfully');
      fetchUsers();
      setEditDialog(false);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete user (soft delete)
  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete user');
      }

      setSuccess('User deleted successfully');
      fetchUsers();
      setDeleteDialog(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Reset password
  const resetPassword = async (userId, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password?new_password=${encodeURIComponent(newPassword)}`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reset password');
      }

      setSuccess('Password reset successfully');
      setResetPasswordDialog(false);
      setNewPassword('');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Activate user
  const activateUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to activate user');
      }

      setSuccess('User activated successfully');
      fetchUsers();
      setActivateDialog(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Deactivate user
  const deactivateUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/deactivate`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to deactivate user');
      }

      setSuccess('User deactivated successfully');
      fetchUsers();
      setDeactivateDialog(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats/users`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch statistics');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch activity statistics
  const fetchActivityStats = async (days = 7) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats/activity?days=${days}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch activity statistics');

      const data = await response.json();
      setActivityStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch dashboard summary
  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/summary`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard statistics');

      const data = await response.json();
      setDashboardStats(data);
    } catch (err) {
      setError(err.message);
    }
  }, [API_BASE_URL]);

  // Export users to CSV
  const exportUsersCSV = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/export/csv`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to export users');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Users exported successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch admin logs
  const fetchAdminLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/admin-logs?limit=50`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch admin logs');

      const data = await response.json();
      return data.logs || [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  // Reset new user form
  const resetNewUserForm = () => {
    setNewUser({
      email: '',
      password: '',
      full_name: '',
      role: 'user',
      organization_name: '',
      email_verified: true,
      is_active: true
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchEmail('');
    setSearchName('');
    setSearchRole('');
    setSearchOrg('');
    setDateFrom(null);
    setDateTo(null);
    setActiveFilter('');
    setSortBy('created_at');
    setSortOrder(-1);
    setPage(0);
  };

  // Handle view user
  const handleViewUser = async (userId) => {
    const userData = await fetchUserDetails(userId);
    if (userData) {
      setSelectedUser(userData);
      setViewDialog(true);
    }
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUser({
      full_name: user.full_name || '',
      role: user.role || 'user',
      organization_name: user.organization_name || '',
      is_active: user.is_active || false,
      email_verified: user.email_verified || false
    });
    setEditDialog(true);
  };

  // Handle delete user
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteDialog(true);
  };

  // Handle reset password
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setResetPasswordDialog(true);
  };

  // Handle activate user
  const handleActivateUser = (user) => {
    setSelectedUser(user);
    setActivateDialog(true);
  };

  // Handle deactivate user
  const handleDeactivateUser = (user) => {
    setSelectedUser(user);
    setDeactivateDialog(true);
  };

  // Handle action menu
  const handleMenuOpen = (event, userId) => {
    setActionMenu(event.currentTarget);
    setMenuUserId(userId);
  };

  const handleMenuClose = () => {
    setActionMenu(null);
    setMenuUserId(null);
  };

  // Handle create user submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser);
    } catch (err) {
      // Error is already set
    }
  };

  // Handle edit user submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(selectedUser.id, editUser);
    } catch (err) {
      // Error is already set
    }
  };

  // Handle reset password submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(selectedUser.id, newPassword);
    } catch (err) {
      // Error is already set
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Initialize data
  useEffect(() => {
    fetchUsers();
    fetchDashboardStats();
  }, [fetchUsers, fetchDashboardStats]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchUsers(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setPage(0);
    fetchUsers(0);
  };

  // Clear filters
  const handleClearFilters = () => {
    resetFilters();
    fetchUsers(0);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 1 ? -1 : 1);
    } else {
      setSortBy(field);
      setSortOrder(-1);
    }
    fetchUsers(page);
  };

  // View stats
  const handleViewStats = async () => {
    await Promise.all([
      fetchUserStats(),
      fetchActivityStats()
    ]);
    setStatsDialog(true);
  };

  // Format number
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  // Render user status chip
  const renderStatusChip = (user) => {
    if (!user.is_active) {
      return <Chip label="Inactive" color="error" size="small" />;
    }
    if (!user.email_verified) {
      return <Chip label="Unverified" color="warning" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  // Render document stats
  const renderDocumentStats = (user) => {
    return (
      <Tooltip title={`Created: ${user.documents_created || 0}, Signed: ${user.documents_signed || 0}`}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Badge
            badgeContent={user.documents_created || 0}
            color="primary"
            sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
          >
            <ArrowIcon fontSize="small" />
          </Badge>
          {user.role === 'recipient' && (
            <Badge
              badgeContent={user.documents_signed || 0}
              color="success"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
            >
              <CheckIcon fontSize="small" />
            </Badge>
          )}
        </Box>
      </Tooltip>
    );
  };

  // Dashboard Statistics Card
  const StatCard = ({ title, value, icon, color, change }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {formatNumber(value)}
            </Typography>
            {change && (
              <Typography
                variant="body2"
                sx={{
                  color: change > 0 ? 'success.main' : 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {change > 0 ? <UpIcon fontSize="small" /> : <DownIcon fontSize="small" />}
                {Math.abs(change)}%
              </Typography>
            )}
          </Box>
          <Box sx={{ color: color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Main render
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage all users, view statistics, and perform administrative actions
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Users" />
            <Tab label="Dashboard" />
            <Tab label="Admin Logs" />
          </Tabs>
        </Box>

        {/* Content based on active tab */}
        {activeTab === 0 ? (
          <>
            {/* Quick Stats */}
            {dashboardStats && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Users"
                    value={dashboardStats.users?.total || 0}
                    icon={<PersonAddIcon />}
                    color="primary.main"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Active Users"
                    value={dashboardStats.users?.active || 0}
                    icon={<CheckIcon />}
                    color="success.main"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="New Today"
                    value={dashboardStats.users?.new_today || 0}
                    icon={<EmailIcon />}
                    color="info.main"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Documents"
                    value={dashboardStats.documents?.total || 0}
                    icon={<StatsIcon />}
                    color="warning.main"
                  />
                </Grid>
              </Grid>
            )}

            {/* Action Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      startIcon={<AddUserIcon />}
                      onClick={() => setCreateDialog(true)}
                    >
                      Add User
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={exportUsersCSV}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<StatsIcon />}
                      onClick={handleViewStats}
                    >
                      View Stats
                    </Button>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <TextField
                      size="small"
                      placeholder="Search email..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon fontSize="small" />
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleApplyFilters}
                      startIcon={<FilterIcon />}
                    >
                      Apply Filters
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      startIcon={<RefreshIcon />}
                    >
                      Clear
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* Advanced Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Advanced Filters
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={searchRole}
                      label="Role"
                      onChange={(e) => setSearchRole(e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="recipient">Recipient</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Organization"
                    value={searchOrg}
                    onChange={(e) => setSearchOrg(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={activeFilter}
                      label="Status"
                      onChange={(e) => setActiveFilter(e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="true">Active</MenuItem>
                      <MenuItem value="false">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="From Date"
                    value={dateFrom}
                    onChange={setDateFrom}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="To Date"
                    value={dateTo}
                    onChange={setDateTo}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Users Table */}
            <Paper>
              {loading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => handleSort('email')}
                              endIcon={
                                sortBy === 'email' && (
                                  sortOrder === 1 ? <UpIcon fontSize="small" /> : <DownIcon fontSize="small" />
                                )
                              }
                            >
                              Email
                            </Button>
                          </TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => handleSort('role')}
                              endIcon={
                                sortBy === 'role' && (
                                  sortOrder === 1 ? <UpIcon fontSize="small" /> : <DownIcon fontSize="small" />
                                )
                              }
                            >
                              Role
                            </Button>
                          </TableCell>
                          <TableCell>Organization</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Documents</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => handleSort('created_at')}
                              endIcon={
                                sortBy === 'created_at' && (
                                  sortOrder === 1 ? <UpIcon fontSize="small" /> : <DownIcon fontSize="small" />
                                )
                              }
                            >
                              Created
                            </Button>
                          </TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} align="center">
                              <Typography color="textSecondary">
                                No users found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                    {user.email.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2">
                                      {user.email}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {user.id}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>{user.full_name || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={formatRole(user.role).label}
                                  color={formatRole(user.role).color}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{user.organization_name || 'N/A'}</TableCell>
                              <TableCell>
                                {renderStatusChip(user)}
                              </TableCell>
                              <TableCell>
                                {renderDocumentStats(user)}
                              </TableCell>
                              <TableCell>
                                {formatDate(user.created_at)}
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuOpen(e, user.id)}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                                <Menu
                                  anchorEl={actionMenu}
                                  open={Boolean(actionMenu && menuUserId === user.id)}
                                  onClose={handleMenuClose}
                                >
                                  <MenuItem onClick={() => {
                                    handleViewUser(user.id);
                                    handleMenuClose();
                                  }}>
                                    <ViewIcon fontSize="small" sx={{ mr: 1 }} />
                                    View Details
                                  </MenuItem>
                                  <MenuItem onClick={() => {
                                    handleEditUser(user);
                                    handleMenuClose();
                                  }}>
                                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                    Edit User
                                  </MenuItem>
                                  <MenuItem onClick={() => {
                                    handleResetPassword(user);
                                    handleMenuClose();
                                  }}>
                                    <ResetPasswordIcon fontSize="small" sx={{ mr: 1 }} />
                                    Reset Password
                                  </MenuItem>
                                  <Divider />
                                  {user.is_active ? (
                                    <MenuItem onClick={() => {
                                      handleDeactivateUser(user);
                                      handleMenuClose();
                                    }}>
                                      <DeactivateIcon fontSize="small" sx={{ mr: 1 }} />
                                      Deactivate
                                    </MenuItem>
                                  ) : (
                                    <MenuItem onClick={() => {
                                      handleActivateUser(user);
                                      handleMenuClose();
                                    }}>
                                      <ActivateIcon fontSize="small" sx={{ mr: 1 }} />
                                      Activate
                                    </MenuItem>
                                  )}
                                  <MenuItem
                                    onClick={() => {
                                      handleDeleteUser(user);
                                      handleMenuClose();
                                    }}
                                    sx={{ color: 'error.main' }}
                                  >
                                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                                    Delete
                                  </MenuItem>
                                </Menu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </>
              )}
            </Paper>
          </>
        ) : activeTab === 1 ? (
          // Dashboard Tab - Fixed Section
          <Box sx={{ mt: 4 }}>
            {dashboardStats ? (
              <Stack spacing={4}>

                {/* Recent Users & Activity Section */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
                  {/* Recent Users Card */}
                  <Paper sx={{
                    p: 4,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    flex: 1
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                      <Typography variant="h4" sx={{
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <PeopleIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                        Recent Users
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        component={Link}
                        to="/admin/users"
                        size="large"
                      >
                        View All
                      </Button>
                    </Box>

                    {dashboardStats.recent_users?.length === 0 ? (
                      <Box sx={{
                        textAlign: 'center',
                        py: 8,
                        border: 2,
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'grey.50'
                      }}>
                        <PeopleIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          No Recent Users
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                          New user registrations will appear here
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={3}>
                        {dashboardStats.recent_users?.slice(0, 5).map((user) => (
                          <Card key={user.id} sx={{
                            borderRadius: 2,
                            borderLeft: 4,
                            borderColor: user.role === 'admin' ? 'error.main' :
                              user.role === 'user' ? 'primary.main' :
                                'success.main',
                            '&:hover': {
                              transform: 'translateX(4px)',
                              boxShadow: 3,
                              transition: 'all 0.3s ease'
                            }
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Avatar sx={{
                                  width: 56,
                                  height: 56,
                                  bgcolor: user.role === 'admin' ? 'error.main' :
                                    user.role === 'user' ? 'primary.main' :
                                      'success.main',
                                  fontSize: '1.25rem',
                                  fontWeight: 600
                                }}>
                                  {user.email?.charAt(0).toUpperCase()}
                                </Avatar>

                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                      {user.full_name || user.email}
                                    </Typography>
                                    <Chip
                                      label={formatRole(user.role).label}
                                      size="medium"
                                      color={
                                        user.role === 'admin' ? 'error' :
                                          user.role === 'user' ? 'primary' :
                                            'success'
                                      }
                                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                    />
                                  </Box>

                                  <Typography variant="body1" color="textSecondary" gutterBottom>
                                    {user.email}
                                  </Typography>

                                  <Box sx={{
                                    display: 'flex',
                                    gap: 3,
                                    mt: 2,
                                    flexWrap: 'wrap'
                                  }}>
                                    <Box>
                                      <Typography variant="caption" color="textSecondary" display="block">
                                        Registered
                                      </Typography>
                                      <Typography variant="body2" fontWeight={500}>
                                        {formatDate(user.created_at)}
                                      </Typography>
                                    </Box>

                                    {user.organization_name && (
                                      <Box>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                          Organization
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                          {user.organization_name}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>

                                <IconButton
                                  component={Link}
                                  to={`/admin/users/${user.id}`}
                                  sx={{
                                    color: 'primary.main',
                                    '&:hover': { bgcolor: 'primary.light' }
                                  }}
                                  title="View User Details"
                                >
                                  <ArrowForwardIcon />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Paper>

                  {/* Recent Activity Card */}
                  <Paper sx={{
                    p: 4,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    flex: 1
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                      <Typography variant="h4" sx={{
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <HistoryIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                        Recent Activity
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        component={Link}
                        to="/admin/logs"
                        size="large"
                      >
                        View All
                      </Button>
                    </Box>

                    {dashboardStats.recent_activity?.length === 0 ? (
                      <Box sx={{
                        textAlign: 'center',
                        py: 8,
                        border: 2,
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'grey.50'
                      }}>
                        <HistoryIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          No Recent Activity
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                          Admin activities will appear here
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={3}>
                        {dashboardStats.recent_activity?.slice(0, 5).map((activity, index) => (
                          <Card key={index} sx={{
                            borderRadius: 2,
                            '&:hover': {
                              transform: 'translateX(4px)',
                              boxShadow: 3,
                              transition: 'all 0.3s ease'
                            }
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                                <Avatar sx={{
                                  width: 48,
                                  height: 48,
                                  bgcolor:
                                    activity.action?.includes('create') ? 'success.light' :
                                      activity.action?.includes('update') ? 'info.light' :
                                        activity.action?.includes('delete') ? 'error.light' :
                                          'primary.light',
                                  color:
                                    activity.action?.includes('create') ? 'success.dark' :
                                      activity.action?.includes('update') ? 'info.dark' :
                                        activity.action?.includes('delete') ? 'error.dark' :
                                          'primary.dark'
                                }}>
                                  {activity.action?.includes('create') && <PersonAddIcon />}
                                  {activity.action?.includes('update') && <CreateIcon />}
                                  {activity.action?.includes('delete') && <WarningIcon />}
                                  {activity.action?.includes('login') && <LockIcon />}
                                  {!activity.action && <EmailIcon />}
                                </Avatar>

                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                      {activity.action ? activity.action.replace(/_/g, ' ').toUpperCase() : 'ACTIVITY'}
                                    </Typography>
                                    <Chip
                                      label={formatTimeAgo(activity.created_at)}
                                      size="small"
                                      sx={{ fontWeight: 500 }}
                                    />
                                  </Box>

                                  <Typography variant="body1" color="textSecondary" gutterBottom>
                                    <strong>{activity.admin_email || 'System'}</strong>
                                    {activity.target_email && (
                                      <>
                                        {' performed action on '}
                                        <strong>{activity.target_email}</strong>
                                      </>
                                    )}
                                  </Typography>

                                  <Box sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: 'grey.50',
                                    borderRadius: 1
                                  }}>
                                    <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                      Timestamp
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                      {formatDate(activity.created_at)}
                                    </Typography>
                                  </Box>

                                  {activity.details && (
                                    <Box sx={{
                                      mt: 2,
                                      p: 2,
                                      bgcolor: 'primary.light',
                                      borderRadius: 1
                                    }}>
                                      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                        Details
                                      </Typography>
                                      <Typography variant="body2" sx={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem'
                                      }}>
                                        {JSON.stringify(activity.details, null, 2)}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Box>
              </Stack>
            ) : (
              <Paper sx={{
                p: 8,
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: 'background.paper',
                boxShadow: 2
              }}>
                <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Loading System Data...
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Please wait while we fetch the latest information
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          // Admin Logs Tab
          <AdminLogsComponent />
        )}

        {/* Dialogs */}
        {/* View User Dialog */}
        <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>User Details</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                  <Typography>{selectedUser.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Full Name</Typography>
                  <Typography>{selectedUser.full_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Role</Typography>
                  <Typography>{formatRole(selectedUser.role).label}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Organization</Typography>
                  <Typography>{selectedUser.organization_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Box sx={{ mt: 1 }}>
                    {renderStatusChip(selectedUser)}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Documents</Typography>
                  <Typography>
                    Created: {selectedUser.documents_created || 0},
                    Signed: {selectedUser.documents_signed || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="textSecondary">Timeline</Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Created: {formatDate(selectedUser.created_at)}
                    </Typography>
                    <Typography variant="body2">
                      Last Updated: {formatDate(selectedUser.updated_at) || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Last Login: {formatDate(selectedUser.last_login_at) || 'N/A'}
                    </Typography>
                    {selectedUser.last_signed_at && (
                      <Typography variant="body2">
                        Last Signed: {formatDate(selectedUser.last_signed_at)}
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={createDialog} onClose={() => setCreateDialog(false)}>
          <DialogTitle>Create New User</DialogTitle>
          <form onSubmit={handleCreateSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    helperText="Minimum 6 characters"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Full Name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={newUser.role}
                      label="Role"
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="recipient">Recipient</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Organization"
                    value={newUser.organization_name}
                    onChange={(e) => setNewUser({ ...newUser, organization_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Email Verified</InputLabel>
                    <Select
                      value={newUser.email_verified}
                      label="Email Verified"
                      onChange={(e) => setNewUser({ ...newUser, email_verified: e.target.value })}
                    >
                      <MenuItem value={true}>Yes</MenuItem>
                      <MenuItem value={false}>No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Active</InputLabel>
                    <Select
                      value={newUser.is_active}
                      label="Active"
                      onChange={(e) => setNewUser({ ...newUser, is_active: e.target.value })}
                    >
                      <MenuItem value={true}>Yes</MenuItem>
                      <MenuItem value={false}>No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Create User</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
          <DialogTitle>Edit User</DialogTitle>
          <form onSubmit={handleEditSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={editUser.full_name}
                    onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={editUser.role}
                      label="Role"
                      onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="recipient">Recipient</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Organization"
                    value={editUser.organization_name}
                    onChange={(e) => setEditUser({ ...editUser, organization_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Active</InputLabel>
                    <Select
                      value={editUser.is_active}
                      label="Active"
                      onChange={(e) => setEditUser({ ...editUser, is_active: e.target.value })}
                    >
                      <MenuItem value={true}>Yes</MenuItem>
                      <MenuItem value={false}>No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Email Verified</InputLabel>
                    <Select
                      value={editUser.email_verified}
                      label="Email Verified"
                      onChange={(e) => setEditUser({ ...editUser, email_verified: e.target.value })}
                    >
                      <MenuItem value={true}>Yes</MenuItem>
                      <MenuItem value={false}>No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Save Changes</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone. The user will be marked as inactive and their data will be anonymized.
            </Alert>
            <Typography>
              Are you sure you want to delete user <strong>{selectedUser?.email}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button
              onClick={() => deleteUser(selectedUser?.id)}
              variant="contained"
              color="error"
            >
              Delete User
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)}>
          <DialogTitle>Reset Password</DialogTitle>
          <form onSubmit={handleResetPasswordSubmit}>
            <DialogContent>
              <Typography gutterBottom>
                Reset password for <strong>{selectedUser?.email}</strong>
              </Typography>
              <TextField
                autoFocus
                fullWidth
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Minimum 6 characters"
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setResetPasswordDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                Reset Password
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Deactivate Dialog */}
        <Dialog open={deactivateDialog} onClose={() => setDeactivateDialog(false)}>
          <DialogTitle>Deactivate User</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              The user will not be able to log in until reactivated.
            </Alert>
            <Typography>
              Deactivate user <strong>{selectedUser?.email}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeactivateDialog(false)}>Cancel</Button>
            <Button
              onClick={() => deactivateUser(selectedUser?.id)}
              variant="contained"
              color="warning"
            >
              Deactivate
            </Button>
          </DialogActions>
        </Dialog>

        {/* Activate Dialog */}
        <Dialog open={activateDialog} onClose={() => setActivateDialog(false)}>
          <DialogTitle>Activate User</DialogTitle>
          <DialogContent>
            <Typography>
              Activate user <strong>{selectedUser?.email}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActivateDialog(false)}>Cancel</Button>
            <Button
              onClick={() => activateUser(selectedUser?.id)}
              variant="contained"
              color="success"
            >
              Activate
            </Button>
          </DialogActions>
        </Dialog>

        {/* Statistics Dialog */}
        {/* Statistics Dialog */}
        <Dialog
          open={statsDialog}
          onClose={() => setStatsDialog(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{
            bgcolor: 'primary.main',
            color: 'white',
            py: 3,
            px: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TimelineIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Platform Statistics
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Comprehensive overview of user metrics and growth trends
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setStatsDialog(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            {stats ? (
              <Box sx={{ p: 4 }}>
                {/* Header Summary */}
                <Paper sx={{
                  p: 4,
                  mb: 4,
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.dark' }}>
                    Platform Overview
                  </Typography>
                  <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 3 }}>
                    {Object.entries(stats.summary || {})
                      .filter(([key]) => !['users_by_role'].includes(key))
                      .map(([key, value]) => (
                        <Box key={key} sx={{ flex: '1 1 200px' }}>
                          <Card sx={{
                            borderRadius: 2,
                            borderLeft: 4,
                            borderColor: 'primary.main',
                            height: '100%'
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <Typography variant="h3" sx={{
                                fontWeight: 700,
                                color: 'primary.main',
                                mb: 1
                              }}>
                                {typeof value === 'number' ? formatNumber(value) : value}
                              </Typography>
                              <Typography variant="body1" sx={{
                                color: 'text.secondary',
                                textTransform: 'capitalize',
                                fontWeight: 500
                              }}>
                                {key.replace(/_/g, ' ')}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Box>
                      ))}
                  </Stack>
                </Paper>

                {/* Main Content */}
                <Stack spacing={4}>
                  {/* Users by Role Section */}
                  <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 2 }}>
                    <Typography variant="h5" gutterBottom sx={{
                      fontWeight: 700,
                      mb: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <PeopleIcon sx={{ color: 'primary.main' }} />
                      User Distribution by Role
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {/* Progress Bars */}
                      <Box sx={{ flex: '1 1 300px' }}>
                        <Stack spacing={3}>
                          {Object.entries(stats.summary?.users_by_role || {}).map(([role, count]) => {
                            const percentage = (count / stats.summary?.total_users) * 100;
                            return (
                              <Box key={role} sx={{ mb: 2 }}>
                                <Box sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 1.5
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{
                                      width: 40,
                                      height: 40,
                                      bgcolor:
                                        role === 'admin' ? 'error.main' :
                                          role === 'user' ? 'primary.main' :
                                            'success.main'
                                    }}>
                                      {role === 'admin' && <AdminPanelSettingsIcon />}
                                      {role === 'user' && <PersonIcon />}
                                      {role === 'recipient' && <AssignmentIndIcon />}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {formatRole(role).label}
                                      </Typography>
                                      <Typography variant="body2" color="textSecondary">
                                        {count} users
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    {percentage.toFixed(1)}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={percentage}
                                  sx={{
                                    height: 12,
                                    borderRadius: 6,
                                    backgroundColor: 'grey.200'
                                  }}
                                  color={
                                    role === 'admin' ? 'error' :
                                      role === 'user' ? 'primary' :
                                        'success'
                                  }
                                />
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>

                      {/* Pie Chart Visualization */}
                      <Box sx={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Paper sx={{
                          p: 4,
                          borderRadius: 3,
                          textAlign: 'center',
                          bgcolor: 'grey.50',
                          width: '100%',
                          maxWidth: 400
                        }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                            Distribution Chart
                          </Typography>
                          <Box sx={{
                            position: 'relative',
                            height: 200,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {/* Simple pie chart visualization using circles */}
                            <Box sx={{
                              position: 'relative',
                              width: 180,
                              height: 180
                            }}>
                              {(() => {
                                const roles = Object.entries(stats.summary?.users_by_role || {});
                                const total = roles.reduce((sum, [, count]) => sum + count, 0);
                                let currentAngle = 0;

                                return roles.map(([role, count], index) => {
                                  const percentage = (count / total) * 100;
                                  const angle = (percentage / 100) * 360;
                                  const radius = 80;

                                  // Create a segment using border
                                  const segmentStyle = {
                                    position: 'absolute',
                                    width: radius * 2,
                                    height: radius * 2,
                                    borderRadius: '50%',
                                    border: `${radius}px solid transparent`,
                                    borderTopColor:
                                      role === 'admin' ? 'error.main' :
                                        role === 'user' ? 'primary.main' :
                                          'success.main',
                                    transform: `rotate(${currentAngle}deg)`,
                                    clipPath: `inset(0 0 ${100 - percentage}% 0)`
                                  };

                                  currentAngle += angle;

                                  return (
                                    <Box key={role} sx={segmentStyle} />
                                  );
                                });
                              })()}

                              {/* Center circle */}
                              <Box sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                bgcolor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 2
                              }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {stats.summary?.total_users}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Legend */}
                          <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
                            {Object.entries(stats.summary?.users_by_role || {}).map(([role, count]) => (
                              <Box key={role} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor:
                                    role === 'admin' ? 'error.main' :
                                      role === 'user' ? 'primary.main' :
                                        'success.main'
                                }} />
                                <Typography variant="body2">
                                  {formatRole(role).label}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Paper>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Monthly Growth Section */}
                  <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 2 }}>
                    <Typography variant="h5" gutterBottom sx={{
                      fontWeight: 700,
                      mb: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <TrendingUpIcon sx={{ color: 'primary.main' }} />
                      Monthly User Growth
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                      {/* Growth Data Table */}
                      <Box sx={{ flex: 1 }}>
                        <Paper sx={{
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}>
                          <Box sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            py: 2,
                            px: 3
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Monthly Registration Data
                            </Typography>
                          </Box>
                          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                            <List sx={{ p: 0 }}>
                              {(stats.trends?.monthly_growth || []).map((item, index) => (
                                <React.Fragment key={item.month}>
                                  <ListItem sx={{
                                    py: 2.5,
                                    px: 3,
                                    '&:hover': { bgcolor: 'action.hover' }
                                  }}>
                                    <ListItemIcon sx={{ minWidth: 48 }}>
                                      <Avatar sx={{
                                        bgcolor: index % 2 === 0 ? 'primary.light' : 'secondary.light',
                                        color: index % 2 === 0 ? 'primary.dark' : 'secondary.dark'
                                      }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                          {index + 1}
                                        </Typography>
                                      </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                          {item.month}
                                        </Typography>
                                      }
                                      secondary={
                                        <Typography variant="body2" color="textSecondary">
                                          {format(new Date(item.month + '-01'), 'MMMM yyyy')}
                                        </Typography>
                                      }
                                    />
                                    <Box sx={{ textAlign: 'right' }}>
                                      <Typography variant="h4" sx={{
                                        fontWeight: 700,
                                        color: item.new_users > 0 ? 'success.main' : 'error.main'
                                      }}>
                                        +{item.new_users}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        New Users
                                      </Typography>
                                    </Box>
                                  </ListItem>
                                  {index < (stats.trends?.monthly_growth?.length || 0) - 1 && (
                                    <Divider />
                                  )}
                                </React.Fragment>
                              ))}
                            </List>
                          </Box>
                        </Paper>
                      </Box>

                      {/* Growth Chart */}
                      <Box sx={{ flex: 1, minWidth: 300 }}>
                        <Paper sx={{
                          p: 4,
                          borderRadius: 2,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                            Growth Visualization
                          </Typography>

                          {/* Simple bar chart */}
                          <Box sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: 2,
                            height: 300,
                            py: 3
                          }}>
                            {(stats.trends?.monthly_growth || []).slice(-6).map((item, index) => {
                              const maxUsers = Math.max(...(stats.trends?.monthly_growth || []).map(m => m.new_users));
                              const heightPercentage = (item.new_users / maxUsers) * 100;

                              return (
                                <Box key={item.month} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Tooltip title={`${item.new_users} new users in ${item.month}`}>
                                    <Box
                                      sx={{
                                        width: '80%',
                                        height: `${Math.max(heightPercentage, 10)}%`,
                                        bgcolor: item.new_users > 0 ? 'primary.main' : 'error.main',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                          transform: 'scale(1.05)',
                                          bgcolor: item.new_users > 0 ? 'primary.dark' : 'error.dark'
                                        }
                                      }}
                                    />
                                  </Tooltip>
                                  <Typography variant="caption" sx={{
                                    mt: 1,
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                  }}>
                                    {item.month.split('-')[1]}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {format(new Date(item.month + '-01'), 'MMM')}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>

                          {/* Summary */}
                          <Box sx={{
                            mt: 4,
                            p: 3,
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Total Growth (12 months)
                              </Typography>
                              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {stats.trends?.monthly_growth?.reduce((sum, item) => sum + item.new_users, 0) || 0}
                              </Typography>
                            </Box>
                            <Chip
                              label={`Avg: ${Math.round(
                                (stats.trends?.monthly_growth?.reduce((sum, item) => sum + item.new_users, 0) || 0) /
                                (stats.trends?.monthly_growth?.length || 1)
                              )}/month`}
                              color="primary"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Paper>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Additional Metrics Section */}
                  <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 2 }}>
                    <Typography variant="h5" gutterBottom sx={{
                      fontWeight: 700,
                      mb: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <AnalyticsIcon sx={{ color: 'primary.main' }} />
                      Performance Insights
                    </Typography>

                    <Grid container spacing={3}>
                      {/* Key Metrics */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%', borderRadius: 2 }}>
                          <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SpeedIcon /> Key Ratios
                              </Box>
                            </Typography>

                            <Stack spacing={3}>
                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Active User Ratio
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                                    {stats.summary?.active_users && stats.summary?.total_users
                                      ? `${((stats.summary.active_users / stats.summary.total_users) * 100).toFixed(1)}%`
                                      : '0%'
                                    }
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={stats.summary?.active_users && stats.summary?.total_users
                                    ? (stats.summary.active_users / stats.summary.total_users) * 100
                                    : 0
                                  }
                                  sx={{ height: 8, borderRadius: 4 }}
                                  color="success"
                                />
                              </Box>

                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Verified Email Rate
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'info.main' }}>
                                    {stats.summary?.verified_users && stats.summary?.total_users
                                      ? `${((stats.summary.verified_users / stats.summary.total_users) * 100).toFixed(1)}%`
                                      : '0%'
                                    }
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={stats.summary?.verified_users && stats.summary?.total_users
                                    ? (stats.summary.verified_users / stats.summary.total_users) * 100
                                    : 0
                                  }
                                  sx={{ height: 8, borderRadius: 4 }}
                                  color="info"
                                />
                              </Box>

                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Recipient Engagement
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                    {stats.summary?.recipients_with_signatures && stats.summary?.users_by_role?.recipient
                                      ? `${((stats.summary.recipients_with_signatures / stats.summary.users_by_role.recipient) * 100).toFixed(1)}%`
                                      : '0%'
                                    }
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={stats.summary?.recipients_with_signatures && stats.summary?.users_by_role?.recipient
                                    ? (stats.summary.recipients_with_signatures / stats.summary.users_by_role.recipient) * 100
                                    : 0
                                  }
                                  sx={{ height: 8, borderRadius: 4 }}
                                  color="warning"
                                />
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Average Metrics */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%', borderRadius: 2 }}>
                          <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalculateIcon /> Average Metrics
                              </Box>
                            </Typography>

                            <Stack spacing={3}>
                              <Paper sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: 'primary.light',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <AssignmentTurnedInIcon />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" color="textSecondary">
                                    Avg Signatures per Recipient
                                  </Typography>
                                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {stats.summary?.average_signatures_per_recipient?.toFixed(1) || '0.0'}
                                  </Typography>
                                </Box>
                              </Paper>

                              <Paper sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: 'success.light',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}>
                                <Avatar sx={{ bgcolor: 'success.main' }}>
                                  <PersonAddIcon />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" color="textSecondary">
                                    New Users (7 days)
                                  </Typography>
                                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {stats.summary?.new_users_last_7_days || 0}
                                  </Typography>
                                </Box>
                              </Paper>

                              <Paper sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: 'info.light',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}>
                                <Avatar sx={{ bgcolor: 'info.main' }}>
                                  <CalendarMonthIcon />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" color="textSecondary">
                                    New Users (30 days)
                                  </Typography>
                                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {stats.summary?.new_users_last_30_days || 0}
                                  </Typography>
                                </Box>
                              </Paper>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Paper>
                </Stack>
              </Box>
            ) : (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 400,
                p: 4
              }}>
                <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
                <Typography variant="h6" color="textSecondary">
                  Loading Statistics...
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{
            px: 4,
            py: 3,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Button
              onClick={() => setStatsDialog(false)}
              variant="outlined"
              sx={{ mr: 2 }}
            >
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                // Add export functionality here
                console.log('Export statistics');
              }}
            >
              Export Report
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success">
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

// Separate component for Admin Logs
const AdminLogsComponent = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };


  const fetchLogs = useCallback(async () => {
  try {
    setLoading(true);
    const response = await fetch(`${API_BASE_URL}/admin/admin-logs?limit=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch logs');

    const data = await response.json();
    setLogs(data.logs || []);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [API_BASE_URL, token]);

useEffect(() => {
  fetchLogs();
}, [fetchLogs]);

return (
  <Paper>
    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h6">Admin Activity Logs</Typography>
      <Button startIcon={<RefreshIcon />} onClick={fetchLogs}>
        Refresh
      </Button>
    </Box>
    {loading ? (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    ) : (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Chip
                    label={log.action?.replace('_', ' ')}
                    size="small"
                    color={
                      log.action?.includes('delete') ? 'error' :
                        log.action?.includes('create') ? 'success' :
                          log.action?.includes('update') ? 'info' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{log.admin_email}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {log.admin_id?.slice(-8)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{log.target_email}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {log.target_user_id?.slice(-8)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {log.changes && (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {JSON.stringify(log.changes, null, 2)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {formatDate(log.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Paper>
);
};

export default UserManagement;