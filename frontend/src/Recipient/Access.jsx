import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  Stack,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Email as EmailIcon,
  VpnKey as KeyIcon,
  CheckCircle as CheckIcon,
  Description as DocumentIcon,
  ArrowForward as ArrowForwardIcon,
  Dashboard as DashboardIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';


const Access = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState([]);

  const steps = ['Enter Email', 'Verify OTP', 'Access Documents'];


  useEffect(() => {
    const savedStep = localStorage.getItem('recipientStep');
    const savedEmail = localStorage.getItem('recipientEmail');
    const savedDocs = localStorage.getItem('recipientDocuments');

    if (savedEmail) setEmail(savedEmail);

    if (savedDocs) {
      try {
        setDocuments(JSON.parse(savedDocs));
      } catch {
        localStorage.removeItem('recipientDocuments');
      }
    }

    if (savedStep) {
      setActiveStep(Number(savedStep));
    }
  }, []);


  useEffect(() => {
    if (activeStep === 2 && documents.length === 0) {
      const savedDocs = localStorage.getItem('recipientDocuments');

      if (!savedDocs) {
        setActiveStep(0); // reset only if truly invalid
      }
    }
  }, [activeStep, documents]);


  const handleRequestOTP = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/api/recipient/request-otp', { email });
      setActiveStep(1);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error requesting OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/recipient-docs/access', {
        email,
        otp
      });

      setDocuments(response.data.documents);
      setActiveStep(2);

      localStorage.setItem('recipientStep', '2');
      localStorage.setItem('recipientEmail', email);

      /*  ADD THIS */
      localStorage.setItem(
        'recipientDocuments',
        JSON.stringify(response.data.documents)
      );


      // Store the first token for now
      if (response.data.documents.length > 0) {
        localStorage.setItem('recipientToken', response.data.documents[0].access_token);
        localStorage.setItem('recipientEmail', email);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessDocument = (doc) => {
    // Store token for this document
    localStorage.setItem('recipientToken', doc.access_token);
    navigate(`/recipient/documents/${doc.document.id}`);
  };

  const handleViewAll = () => {
    // Store email for dashboard context
    localStorage.setItem('recipientEmail', email);
    navigate('/recipient/dashboard');
  };

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

  const getRoleLabel = (role) => {
    return role.replace('_', ' ').toUpperCase();
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      display: 'flex',
      alignItems: { xs: 'flex-start', sm: 'center' },
      py: { xs: 2, sm: 4 },
      px: { xs: 1, sm: 2 }
    }}>
      <>
        <Box
          sx={{
            position: "fixed",
            top: { xs: 10, sm: 20 },
            left: { xs: 12, sm: 20 },
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
          }}
          onClick={() => window.location.href = "/"}
        >
          <img
            src={`${API_BASE_URL}/branding/logo/file`}
            alt="Logo"
            style={{
              height: 'clamp(28px, 5vw, 45px)',
              objectFit: "contain",
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: { xs: 18, sm: 24, md: 30 },
              fontWeight: 700,
              color: "#0f766e",
              letterSpacing: 0.3,
            }}
          >
            SafeSign
          </Typography>
        </Box>
        <Container maxWidth="md" sx={{ pt: { xs: 7, sm: 8 } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 5 },
              borderRadius: { xs: 2, sm: 3 },
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper'
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: { xs: 2.5, sm: 4 } }}>
              <Avatar
                sx={{
                  width: { xs: 56, sm: 80 },
                  height: { xs: 56, sm: 80 },
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'rgb(46, 125, 50)',
                  mx: 'auto',
                  mb: { xs: 1.5, sm: 2 }
                }}
              >
                <DocumentIcon sx={{ fontSize: { xs: 28, sm: 40 } }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1.4rem', sm: '2rem', md: '2.125rem' } }}>
                Access Your Documents
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, px: { xs: 1, sm: 0 } }}>
                Enter your email to receive a one-time password and access your documents
              </Typography>
            </Box>

            {/* Stepper */}
            <Stepper
              activeStep={activeStep}
              sx={{
                mb: 4,
                '& .MuiStepLabel-root .Mui-completed': {
                  color: 'rgb(46, 125, 50)'
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: 'rgb(46, 125, 50)'
                }
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        display: { xs: 'none', sm: 'block' }
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Error Alert */}
            {error && (
              <Fade in={!!error}>
                <Alert
                  severity="error"
                  sx={{ mb: 3 }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {/* Step 1: Email */}
            {activeStep === 0 && (
              <Box>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ mb: 3 }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRequestOTP();
                    }
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleRequestOTP}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    bgcolor: 'rgb(46, 125, 50)',
                    '&:hover': {
                      bgcolor: 'rgb(27, 94, 32)'
                    }
                  }}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </Box>
            )}

            {/* Step 2: OTP */}
            {activeStep === 1 && (
              <Box>
                <TextField
                  fullWidth
                  label="One-Time Password"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  InputProps={{
                    startAdornment: <KeyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ mb: 3 }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyOTP();
                    }
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    bgcolor: 'rgb(46, 125, 50)',
                    '&:hover': {
                      bgcolor: 'rgb(27, 94, 32)'
                    }
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Access'}
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  sx={{ mt: 2 }}
                  onClick={() => setActiveStep(0)}
                >
                  Back to Email
                </Button>
              </Box>
            )}

            {/* Step 3: Documents */}
            {activeStep === 2 && (
              <Box>
                <Alert
                  severity="success"
                  sx={{
                    mb: 4,
                    bgcolor: 'rgba(46, 125, 50, 0.1)',
                    color: 'rgb(46, 125, 50)',
                    '& .MuiAlert-icon': {
                      color: 'rgb(46, 125, 50)'
                    }
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Access granted! You have {documents.length} document{documents.length !== 1 ? 's' : ''} available.
                  </Typography>
                </Alert>

                {/* Dashboard Navigation Button - Prominently Displayed */}
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={handleViewAll}
                  sx={{
                    py: 2,
                    borderWidth: 2,
                    borderColor: 'rgb(46, 125, 50)',
                    color: 'rgb(46, 125, 50)',
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: 'rgb(27, 94, 32)',
                      bgcolor: 'rgba(46, 125, 50, 0.04)'
                    }
                  }}
                >
                  <DashboardIcon sx={{ mr: 2 }} />
                  Go to Full Dashboard
                  <ArrowForwardIcon sx={{ ml: 2 }} />
                </Button>

                {/* Document List */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {documents.map((item) => (
                    <Card
                      key={item.document.id}
                      variant="outlined"
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: theme.shadows[4],
                          borderColor: 'transparent'
                        }
                      }}
                    >
                      <CardContent>
                        <Grid container spacing={1.5} alignItems="flex-start" justifyContent="space-between">


                          <Grid item xs>
                            <Grid item>
                              <Avatar
                                variant="rounded"
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: 'rgb(46, 125, 50)',
                                  width: 56,
                                  height: 56
                                }}
                              >
                                <DocumentIcon />
                              </Avatar>
                            </Grid>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {item.document.name}
                            </Typography>

                            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {item.document.sender_name || item.document.sender_email}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TimeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {format(new Date(item.document.created_at), 'MMM d, yyyy')}
                                </Typography>
                              </Box>
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Chip
                                size="small"
                                label={item.document.status.toUpperCase()}
                                sx={{
                                  bgcolor: getStatusBgColor(item.document.status),
                                  color: getStatusColor(item.document.status),
                                  fontWeight: 500,
                                  fontSize: '0.7rem'
                                }}
                              />
                              <Chip
                                size="small"
                                label={getRoleLabel(item.recipient.role)}
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Stack>
                          </Grid>

                          <Grid item xs={12} sm="auto">
                            <Tooltip title="View Document">
                              <Button
                                fullWidth
                                variant="contained"
                                onClick={() => handleAccessDocument(item)}
                                sx={{
                                  px: { xs: 2, sm: 3 },
                                  py: 1,
                                  bgcolor: 'rgb(46, 125, 50)',
                                  '&:hover': {
                                    bgcolor: 'rgb(27, 94, 32)'
                                  }
                                }}
                              >
                                <VisibilityIcon sx={{ mr: 1 }} />
                                View
                              </Button>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>

                <Divider sx={{ my: 3 }}>
                  <Chip
                    label="More Options"
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  />
                </Divider>

                {/* Dashboard Navigation Button - Prominently Displayed */}
                {/* <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleViewAll}
                sx={{
                  py: 2,
                  borderWidth: 2,
                  borderColor: 'rgb(46, 125, 50)',
                  color: 'rgb(46, 125, 50)',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: 'rgb(27, 94, 32)',
                    bgcolor: 'rgba(46, 125, 50, 0.04)'
                  }
                }}
              >
                <DashboardIcon sx={{ mr: 2 }} />
                Go to Full Dashboard
                <ArrowForwardIcon sx={{ ml: 2 }} />
              </Button> */}

                {/* Secondary Options */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={() => {
                      localStorage.removeItem('recipientStep');
                      localStorage.removeItem('recipientEmail');
                      localStorage.removeItem('recipientToken'); // important
                      localStorage.removeItem('recipientDocuments');
                      setActiveStep(0);
                      setOtp('');
                      setDocuments([]);
                      setError('');
                    }}

                    sx={{ color: 'text.secondary' }}
                  >
                    Access with different email
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Container>
      </>
    </Box>
  );
};

export default Access;
