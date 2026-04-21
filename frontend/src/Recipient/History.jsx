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
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Avatar,
 
  Tab,
  Tabs,
  Skeleton,
  Pagination,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

import {
  History as HistoryIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  Verified as VerifiedIcon,
  GppGood as OTPIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Timeline as TimelineViewIcon,
  TableChart as TableViewIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, formatDistance, subDays, subMonths } from 'date-fns';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`history-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const History = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const token = localStorage.getItem('recipientToken');

  useEffect(() => {
    if (!token) {
      navigate('/recipient/access');
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch history
      const historyResponse = await axios.get('/api/recipient-history/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(historyResponse.data.history || []);

      // Fetch statistics
      const statsResponse = await axios.get('/api/recipient-history/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching history:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('recipientToken');
        navigate('/recipient/access');
      } else {
        setSnackbar({
          open: true,
          message: 'Error loading history',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      const response = await axios.get(`/api/recipient-history/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: format === 'json' ? 'json' : 'blob'
      });

      if (format === 'json') {
        // Download JSON
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `history_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Download CSV
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `history_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setSnackbar({
        open: true,
        message: 'History exported successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({
        open: true,
        message: 'Error exporting history',
        severity: 'error'
      });
    }
  };

  const getFilteredHistory = () => {
    let filtered = [...history];

    // Filter by action type
    if (actionFilter !== 'all') {
      filtered = filtered.filter(item => item.action_type === actionFilter);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoff;
      switch (dateRange) {
        case '7days':
          cutoff = subDays(now, 7);
          break;
        case '30days':
          cutoff = subDays(now, 30);
          break;
        case '90days':
          cutoff = subDays(now, 90);
          break;
        case '6months':
          cutoff = subMonths(now, 6);
          break;
        case '1year':
          cutoff = subMonths(now, 12);
          break;
        default:
          cutoff = null;
      }
      if (cutoff) {
        filtered = filtered.filter(item => new Date(item.timestamp) >= cutoff);
      }
    }

    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  // Chart data
  const getActivityChartData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const counts = last30Days.map(date => {
      return filteredHistory.filter(item => {
        const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
        return itemDate === date;
      }).length;
    });

    return {
      labels: last30Days.map(date => format(new Date(date), 'MMM d')),
      datasets: [
        {
          label: 'Activities',
          data: counts,
          backgroundColor: 'rgba(13, 148, 136, 0.5)',
          borderColor: '#0f766e',
          borderWidth: 1
        }
      ]
    };
  };

  const getActionTypeChartData = () => {
    const actionCounts = {};
    filteredHistory.forEach(item => {
      actionCounts[item.action_type] = (actionCounts[item.action_type] || 0) + 1;
    });

    const colors = {
      signed: '#4caf50',
      downloaded: '#2196f3',
      viewed: '#ff9800',
      completed: '#9c27b0',
      otp_verified: '#00bcd4',
      terms_accepted: '#8bc34a'
    };

    return {
      labels: Object.keys(actionCounts).map(key => key.replace('_', ' ').toUpperCase()),
      datasets: [
        {
          data: Object.values(actionCounts),
          backgroundColor: Object.keys(actionCounts).map(key => colors[key] || '#0f766e'),
          borderWidth: 1
        }
      ]
    };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rounded" height={400} sx={{ mt: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Document History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track all your document activities
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={() => handleExport('json')}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableViewIcon />}
            onClick={() => handleExport('csv')}
          >
            CSV
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Documents
                </Typography>
                <Typography variant="h3">{stats.total_documents}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h3" color="success.main">
                  {stats.completed_documents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Signatures
                </Typography>
                <Typography variant="h3">{stats.total_signatures || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg. Completion
                </Typography>
                <Typography variant="h3">
                  {stats.average_completion_time_days 
                    ? stats.average_completion_time_days.toFixed(1) 
                    : 'N/A'}
                </Typography>
                <Typography variant="caption">days</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Action Type</InputLabel>
              <Select
                value={actionFilter}
                label="Action Type"
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <MenuItem value="all">All Actions</MenuItem>
                <MenuItem value="signed">Signed</MenuItem>
                <MenuItem value="downloaded">Downloaded</MenuItem>
                <MenuItem value="viewed">Viewed</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="otp_verified">OTP Verified</MenuItem>
                <MenuItem value="terms_accepted">Terms Accepted</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="1year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredHistory.length} of {history.length} activities
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<TimelineViewIcon />} label="Timeline View" />
          <Tab icon={<TableViewIcon />} label="Table View" />
          <Tab icon={<Bar />} label="Analytics" />
        </Tabs>
      </Box>

      {/* Timeline View */}
      <TabPanel value={tabValue} index={0}>
        {filteredHistory.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No history found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters
            </Typography>
          </Paper>
        ) : (
          <Timeline position="alternate">
            {filteredHistory.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((item) => (
              <TimelineItem key={item.id}>
                <TimelineOppositeContent color="text.secondary">
                  {format(new Date(item.timestamp), 'MMM d, yyyy')}
                  <Typography variant="caption" display="block">
                    {format(new Date(item.timestamp), 'h:mm a')}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color={
                    item.action_type === 'signed' ? 'success' :
                    item.action_type === 'downloaded' ? 'info' :
                    item.action_type === 'viewed' ? 'warning' :
                    item.action_type === 'completed' ? 'success' :
                    'primary'
                  }>
                    {item.action_type === 'signed' && <CheckIcon />}
                    {item.action_type === 'downloaded' && <DownloadIcon />}
                    {item.action_type === 'viewed' && <ViewIcon />}
                    {item.action_type === 'completed' && <CheckIcon />}
                    {item.action_type === 'otp_verified' && <VerifiedIcon />}
                    {item.action_type === 'terms_accepted' && <CheckIcon />}
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Paper elevation={3} sx={{ p: 2 }}>
                    <Typography variant="h6" component="span">
                      {item.document_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {item.action}
                    </Typography>
                    {item.sender_name && (
                      <Typography variant="caption" display="block">
                        From: {item.sender_name}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Chip
                        size="small"
                        label={item.document_status}
                        color={
                          item.document_status === 'completed' ? 'success' :
                          item.document_status === 'sent' ? 'warning' :
                          'default'
                        }
                      />
                      {item.envelope_id && (
                        <Chip
                          size="small"
                          label={`ENV: ${item.envelope_id}`}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
        
        {/* Pagination */}
        {filteredHistory.length > rowsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(filteredHistory.length / rowsPerPage)}
              page={page + 1}
              onChange={(e, value) => setPage(value - 1)}
              color="primary"
            />
          </Box>
        )}
      </TabPanel>

      {/* Table View */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Sender</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHistory
                .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                .map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      {format(new Date(item.timestamp), 'MMM d, yyyy')}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {format(new Date(item.timestamp), 'h:mm a')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DocumentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">
                            {item.document_name}
                          </Typography>
                          {item.envelope_id && (
                            <Typography variant="caption" color="text.secondary">
                              {item.envelope_id}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={
                          item.action_type === 'signed' ? <CheckIcon /> :
                          item.action_type === 'downloaded' ? <DownloadIcon /> :
                          item.action_type === 'viewed' ? <ViewIcon /> :
                          <HistoryIcon />
                        }
                        label={item.action}
                        color={
                          item.action_type === 'signed' ? 'success' :
                          item.action_type === 'downloaded' ? 'info' :
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                          {item.sender_name?.charAt(0) || item.sender_email?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">
                          {item.sender_name || item.sender_email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.document_status}
                        color={
                          item.document_status === 'completed' ? 'success' :
                          item.document_status === 'sent' ? 'warning' :
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => navigate(`/recipient/documents/${item.document_id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredHistory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      </TabPanel>

      {/* Analytics View */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Activity (Last 30 Days)
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={getActivityChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Actions by Type
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut
                  data={getActionTypeChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Summary Cards */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Activity Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Most Active Month
                      </Typography>
                      <Typography variant="h6">
                        {stats?.most_active_month || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        First Document
                      </Typography>
                      <Typography variant="h6">
                        {stats?.first_document_date 
                          ? format(new Date(stats.first_document_date), 'MMM d, yyyy')
                          : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Last Document
                      </Typography>
                      <Typography variant="h6">
                        {stats?.last_document_date
                          ? format(new Date(stats.last_document_date), 'MMM d, yyyy')
                          : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Completion Rate
                      </Typography>
                      <Typography variant="h6">
                        {stats?.total_documents
                          ? Math.round((stats.completed_documents / stats.total_documents) * 100)
                          : 0}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Documents by Role */}
          {stats?.documents_by_role && Object.keys(stats.documents_by_role).length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Documents by Role
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(stats.documents_by_role).map(([role, count]) => (
                    <Grid item xs={6} sm={4} md={2} key={role}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">{count}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {role.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default History;
