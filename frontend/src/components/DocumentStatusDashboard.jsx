// components/DocumentRecipientsList.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import DocumentRecipientStatus from './RecipientStatusBar';
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

const DocumentRecipientsList = ({ documentId, recipients: initialRecipients }) => {
  const [recipients, setRecipients] = useState(initialRecipients || []);
  const [loading, setLoading] = useState(!initialRecipients);
  const [error, setError] = useState(null);
  const [expandedRecipient, setExpandedRecipient] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed, declined

  useEffect(() => {
    if (!initialRecipients && documentId) {
      fetchRecipients();
    }
  }, [documentId, initialRecipients]);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      setError(null);
      // Replace with your actual API endpoint
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/recipients`);
      if (!response.ok) throw new Error('Failed to fetch recipients');
      const data = await response.json();
      setRecipients(data.recipients || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter recipients based on status
  const filteredRecipients = recipients.filter(recipient => {
    if (filter === 'all') return true;
    if (filter === 'pending') return recipient.status !== 'completed' && recipient.status !== 'declined';
    if (filter === 'completed') return recipient.status === 'completed';
    if (filter === 'declined') return recipient.status === 'declined';
    return true;
  });

  // Sort recipients by signing order
  const sortedRecipients = [...filteredRecipients].sort((a, b) => {
    if (a.signing_order && b.signing_order) {
      return a.signing_order - b.signing_order;
    }
    return 0;
  });

  // Calculate statistics
  const stats = {
    total: recipients.length,
    completed: recipients.filter(r => r.status === 'completed').length,
    pending: recipients.filter(r => r.status !== 'completed' && r.status !== 'declined').length,
    declined: recipients.filter(r => r.status === 'declined').length,
    progress: recipients.length > 0 
      ? Math.round((recipients.filter(r => r.status === 'completed').length / recipients.length) * 100)
      : 0
  };

  const handleToggleDetails = (recipientId) => {
    setExpandedRecipient(expandedRecipient === recipientId ? null : recipientId);
  };

  const handleDownloadReport = async () => {
    try {
      // Implement CSV download functionality
      const csvContent = recipients.map(r => ({
        Name: r.name,
        Email: r.email,
        Role: r.role,
        Status: r.status,
        'Signed At': r.signed_at,
        'Signing Order': r.signing_order
      }));
      
      // Convert to CSV and download
      // ... CSV download implementation
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleIcon sx={{ fontSize: 32, color: '#3B82F6' }} />
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#111827' }}>
                Recipients ({recipients.length})
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Track the signing progress of all recipients
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Download Report">
              <IconButton onClick={handleDownloadReport} sx={{ color: '#6B7280' }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchRecipients} sx={{ color: '#6B7280' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box> */}

        {/* Stats Cards */}
        {/* <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              bgcolor: '#F0F9FF', 
              borderRadius: 2,
              border: '1px solid #E5E7EB'
            }}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#111827' }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Recipients
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              bgcolor: '#F0FDF4', 
              borderRadius: 2,
              border: '1px solid #D1FAE5'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#111827' }}>
                    {stats.completed}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              bgcolor: '#FFFBEB', 
              borderRadius: 2,
              border: '1px solid #FEF3C7'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <ScheduleIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#111827' }}>
                    {stats.pending}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              bgcolor: '#FEF2F2', 
              borderRadius: 2,
              border: '1px solid #FEE2E2'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <WarningIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#111827' }}>
                    {stats.declined}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Declined
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid> */}

        {/* Progress Bar */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Overall Progress
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {stats.progress}% Complete
            </Typography>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={stats.progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                bgcolor: stats.progress === 100 ? '#10B981' : '#3B82F6',
                borderRadius: 4
              }
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              {stats.completed} of {stats.total} completed
            </Typography>
            {stats.progress === 100 && (
              <Chip 
                label="All Signatures Complete" 
                size="small"
                icon={<CheckCircleIcon />}
                sx={{ bgcolor: '#D1FAE5', color: '#065F46' }}
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterIcon sx={{ color: '#6B7280', fontSize: 20 }} />
          <Typography variant="body2" sx={{ color: '#6B7280', mr: 1 }}>
            Filter:
          </Typography>
          {['all', 'pending', 'completed', 'declined'].map((filterOption) => (
            <Chip
              key={filterOption}
              label={filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              onClick={() => setFilter(filterOption)}
              variant={filter === filterOption ? 'filled' : 'outlined'}
              size="small"
              sx={{
                bgcolor: filter === filterOption ? '#3B82F6' : 'transparent',
                color: filter === filterOption ? 'white' : '#6B7280',
                borderColor: '#D1D5DB',
                '&:hover': {
                  bgcolor: filter === filterOption ? '#2563EB' : '#F3F4F6'
                }
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Recipients List */}
      <Box>
        {sortedRecipients.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <PeopleIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
              No recipients found
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {filter === 'all' ? 'No recipients added yet' : `No ${filter} recipients`}
            </Typography>
          </Paper>
        ) : (
          sortedRecipients.map((recipient) => (
            <DocumentRecipientStatus
              key={recipient._id || recipient.id}
              recipient={recipient}
              showDetails={expandedRecipient === (recipient._id || recipient.id)}
              onToggleDetails={handleToggleDetails}
            />
          ))
        )}
      </Box>

      
    </Box>
  );
};

// Helper functions
const calculateAverageTime = (recipients) => {
  const completedRecipients = recipients.filter(r => r.signed_at && r.invited_at);
  if (completedRecipients.length === 0) return 'N/A';
  
  const totalTime = completedRecipients.reduce((sum, r) => {
    const invited = new Date(r.invited_at);
    const signed = new Date(r.signed_at);
    return sum + (signed - invited);
  }, 0);
  
  const avgHours = totalTime / (completedRecipients.length * 3600000);
  return avgHours < 1 
    ? `${Math.round(avgHours * 60)} minutes` 
    : `${Math.round(avgHours)} hours`;
};

const getNextRecipient = (recipients) => {
  return recipients
    .filter(r => r.status !== 'completed' && r.status !== 'declined')
    .sort((a, b) => (a.signing_order || 0) - (b.signing_order || 0))[0];
};

export default DocumentRecipientsList;