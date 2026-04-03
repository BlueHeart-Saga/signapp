import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
  Assignment as DocumentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  DoNotDisturb as VoidIcon,
  Block as BlockedIcon,
  Close as CloseIcon,
  Description as DocIcon,
} from '@mui/icons-material';
import { useParams } from "react-router-dom";

// Import your existing TermsDialog component
import TermsDialog from './TermsDialog';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

// Success Dialog Component
const SuccessDialog = ({ open, message }) => (
  <Dialog
    open={open}
    maxWidth="xs"
    PaperProps={{
      sx: {
        borderRadius: 3,
        overflow: 'hidden',
        textAlign: 'center',
      }
    }}
  >
    <DialogContent sx={{ py: 6, px: 4 }}>
      {/* Animated Checkmark */}
      <Box sx={{
        position: 'relative',
        width: 80,
        height: 80,
        margin: '0 auto 24px',
      }}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: '#4CAF50',
          animation: 'pulse 1.5s infinite',
        }} />
        <CheckIcon sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 48,
          color: 'white',
          animation: 'bounceIn 0.5s ease-out',
        }} />
      </Box>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#2E7D32' }}>
        Success!
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {message}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} sx={{ color: '#4CAF50' }} />
        <Typography variant="caption" color="text.secondary">
          Redirecting in a moment...
        </Typography>
      </Box>
    </DialogContent>
  </Dialog>
);

const OTPVerificationPage = () => {
  const { recipientId } = useParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(true);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [emailMasked, setEmailMasked] = useState('');

  // Add recipient and document info state
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [signingInfo, setSigningInfo] = useState(null);
  const [requiresTerms, setRequiresTerms] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // New states for popups
  const [voidedDialogOpen, setVoidedDialogOpen] = useState(false);
  const [declinedTermsDialogOpen, setDeclinedTermsDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [documentVoided, setDocumentVoided] = useState(false);
  const [documentDeclined, setDocumentDeclined] = useState(false);

  // Fetch signing info first to check if terms need to be accepted
  useEffect(() => {
    const fetchSigningInfo = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch signing info: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Fetched signing data:', data);


        // 🔴 DOCUMENT VOIDED - Navigate to voided view page immediately
        if (data.document?.is_voided || data.signing_info?.is_voided) {
          setDocumentVoided(true);
          // Navigate to voided view page
          window.location.href = `/sign/${recipientId}/voided`;
          return;
        }

        /// 🟡 DOCUMENT DECLINED (by ANY recipient)
        if (data.document?.status === 'declined' || data.signing_info?.document_status === 'declined') {
          setDocumentDeclined(true);
          // Navigate to declined view page
          window.location.href = `/sign/${recipientId}/declined`;
          return;
        }

        // 🟠 RECIPIENT DECLINED (this specific recipient declined terms)
        if (data.signing_info?.terms_status === 'declined') {
          setDeclinedTermsDialogOpen(true);
          return;
        }

        // Check data structure and set states accordingly
        if (data.recipient) {
          setRecipientInfo(data.recipient);
        } else if (data) {
          // If data doesn't have nested recipient property, assume it's the recipient info
          setRecipientInfo(data);
        }

        if (data.document) {
          setDocumentInfo(data.document);
        }

        if (data.signing_info) {
          setSigningInfo(data.signing_info);
          setRequiresTerms(data.signing_info.requires_terms || false);

          // Check if terms are already accepted
          if (data.signing_info.terms_status === 'accepted') {
            setTermsAccepted(true);
          }

          // Check if terms were declined - show popup instead of redirect
          if (data.signing_info.terms_status === 'declined') {
            setDeclinedTermsDialogOpen(true);
            return;
          }
        }

        // 🔴 DOCUMENT VOIDED
        if (data.document?.is_voided || data.signing_info?.is_voided) {
          setDocumentVoided(true);
          setVoidedDialogOpen(true);
          return; // ⛔ stop OTP flow
        }

        // 🟠 DOCUMENT DECLINED
        if (data.signing_info?.status === 'declined') {
          setDocumentDeclined(true);
          return; // ⛔ stop OTP flow
        }

        // Check if OTP is already verified
        if (data.recipient?.otp_verified) {
          setOtpVerified(true);

          const termsRequired = data.signing_info?.requires_terms || false;
          const termsAcceptedNow = data.signing_info?.terms_status === 'accepted';

          // If OTP already verified and terms accepted
          if (!termsRequired || (termsRequired && termsAcceptedNow)) {
            // Show success message first
            setSuccessMessage('✅ Your identity is verified and terms are accepted! Redirecting to signing page...');
            setSuccessDialogOpen(true);

            // Then navigate after showing success message
            setTimeout(() => {
              window.location.href = `/sign/${recipientId}`;
            }, 2500);
          } else if (termsRequired && !termsAcceptedNow) {
            // OTP verified but terms not accepted, show terms dialog
            setTermsDialogOpen(true);
          }
        }

        // Check if document is voided - show popup instead of redirect
        if (data.document?.is_voided || data.signing_info?.is_voided) {
          setVoidedDialogOpen(true);
          return;
        }

      } catch (err) {
        console.error('Error fetching signing info:', err);
        setError(`Failed to load document information: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (recipientId) {
      fetchSigningInfo();
    }
  }, [recipientId]);

  // Update email mask when recipient info is loaded
  useEffect(() => {
    if (recipientInfo?.email) {
      const email = recipientInfo.email;
      const [localPart, domain] = email.split('@');
      if (localPart && domain) {
        const maskedLocal = localPart.length > 2
          ? localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1)
          : '**';
        setEmailMasked(`${maskedLocal}@${domain}`);
      }
    }
  }, [recipientInfo]);

  // Handle resend timer
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (attempts >= 3) {
      setError('Too many failed attempts. Please request a new OTP.');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: otp.trim(),
          recipient_id: recipientId
        }),
      });

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'OTP verification failed');
      }

      if (data.verified) {
        setOtpVerified(true);
        setSuccess('OTP verified successfully!');

        // Check if we need to show terms dialog
        if (requiresTerms && !termsAccepted) {
          setTermsDialogOpen(true);
        } else {
          // Show success message before redirecting
          setSuccessMessage('✅ Identity verified successfully! Redirecting to signing page...');
          setSuccessDialogOpen(true);

          // Proceed to signing page after showing success
          setTimeout(() => {
            window.location.href = `/sign/${recipientId}`;
          }, 2500);
        }
      } else {
        setAttempts(prev => prev + 1);
        const remaining = 3 - attempts - 1;
        setError(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient_id: recipientId }),
      });

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to resend OTP');
      }

      setSuccess('New OTP sent to your email');
      setResendTimer(60); // 60 seconds cooldown
      setAttempts(0);
      setOtp(''); // Clear OTP field

      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Network error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleAcceptTerms = async (always = false) => {
    try {
      setOtpLoading(true);

      // Check if terms were previously declined to use the correct endpoint
      const isReacceptance = signingInfo?.terms_status === 'declined';
      const endpoint = `${API_BASE_URL}/signing/recipient/${recipientId}/${isReacceptance ? 'reaccept-terms' : 'accept-terms'
        }`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted: true,
          accepted_at: new Date().toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          accept_always: always
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTermsAccepted(true);
        setTermsDialogOpen(false);

        // Show success message before redirecting
        const message = isReacceptance
          ? '✅ Terms re-accepted successfully! Redirecting to signing page...'
          : '✅ Terms accepted successfully! Redirecting to signing page...';

        setSuccessMessage(message);
        setSuccessDialogOpen(true);

        // Redirect to signing page after showing success
        setTimeout(() => {
          window.location.href = `/sign/${recipientId}`;
        }, 2500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to accept terms');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDeclineTerms = async (reason) => {
    try {
      setOtpLoading(true);
      const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/decline-terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          declined: true,
          decline_reason: reason || 'No reason provided',
          declined_at: new Date().toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        })
      });

      if (response.ok) {
        setTermsDialogOpen(false);
        setTermsAccepted(false);
        setError('You have declined the terms and conditions. Signing process cancelled.');

        setTimeout(() => {
          window.location.href = `/sign/${recipientId}/terms-declined`;
        }, 3000);
      } else {
        throw new Error('Failed to decline terms');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const getRoleDisplay = (role) => {
    const roles = {
      signer: 'Signer',
      approver: 'Approver',
      viewer: 'Viewer',
      form_filler: 'Form Filler',
      witness: 'Witness',
      in_person_signer: 'In-Person Signer',
    };
    return roles[role] || role;
  };

  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!recipientId) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">
          Invalid or missing signing link.
        </Alert>
      </Container>
    );
  }

  if (documentVoided) {
    return null; // dialog handles UI
  }

  if (documentDeclined) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 64, color: '#ed6c02', mb: 2 }} />

          <Typography variant="h5" fontWeight={600} gutterBottom>
            Document Declined
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This document has already been declined.
            Signing is no longer possible.
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#fff8e1' }}>
            <Typography variant="body2">
              <strong>Document:</strong> {documentInfo?.filename}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong>{' '}
              <Chip label="DECLINED" color="warning" size="small" sx={{ ml: 1 }} />
            </Typography>
          </Paper>

          <Button
            variant="contained"
            color="warning"
            fullWidth
            sx={{ textTransform: 'none', fontWeight: 600 }}
            onClick={() =>
              window.location.href = `/sign/${recipientId}/declined`
            }
          >
            View Declined Document
          </Button>
        </Paper>
      </Container>
    );
  }


  // Show error state if fetching failed
  if (!loading && error && !recipientInfo) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box textAlign="center" mb={4}>
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight="600">
              Unable to Load Document
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      {/* CSS Animations */}
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
            }
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
            }
            100% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
            }
          }
          
          @keyframes bounceIn {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 0;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.2);
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .success-animation {
            animation: fadeInUp 0.5s ease-out;
          }
        
          @keyframes pulse {
            0% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
            }
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
            }
            100% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
            }
          }
          
          @keyframes bounceIn {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 0;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.2);
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          
          .success-animation {
            animation: fadeInUp 0.5s ease-out;
          }
          
          .shake {
            animation: shake 0.5s ease-in-out;
          }
          
          .otp-box {
            transition: all 0.2s ease;
          }
          
          .otp-box:focus-within {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
        `}
      </style>

      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Stepper activeStep={0} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Verify Identity</StepLabel>
          </Step>
          {requiresTerms && (
            <Step>
              <StepLabel>Accept Terms</StepLabel>
            </Step>
          )}
          <Step>
            <StepLabel>Review & Sign</StepLabel>
          </Step>
          <Step>
            <StepLabel>Complete</StepLabel>
          </Step>
        </Stepper>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box textAlign="center" mb={4}>
            <VerifiedIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight="600">
              {requiresTerms ? 'Verify Identity & Accept Terms' : 'Verify Your Identity'}
            </Typography>
            {/* <Typography variant="body2" color="text.secondary">
              {requiresTerms 
                ? 'Enter verification code and accept terms to proceed'
                : 'Enter the verification code sent to your email'}
            </Typography> */}
          </Box>

          {/* Document & Recipient Info Card */}
          <Card variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DocumentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" fontWeight="600">
                  {documentInfo?.name || documentInfo?.filename || 'Document'}
                </Typography>
                {termsAccepted && (
                  <Chip
                    icon={<CheckIcon />}
                    label="Terms Accepted"
                    color="success"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    <PersonIcon sx={{ fontSize: 12, mr: 0.5 }} />
                    Recipient
                  </Typography>
                  <Typography variant="body2">{recipientInfo?.name || 'Unknown'}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    <EmailIcon sx={{ fontSize: 12, mr: 0.5 }} />
                    Email
                  </Typography>
                  <Typography variant="body2">{recipientInfo?.email || 'Not provided'}</Typography>
                </Box>

                {/* <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Role
                  </Typography>
                  <Chip 
                    label={getRoleDisplay(recipientInfo?.role || 'viewer')} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    <ScheduleIcon sx={{ fontSize: 12, mr: 0.5 }} />
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {documentInfo?.created_at 
                      ? new Date(documentInfo.created_at).toLocaleDateString() 
                      : 'Unknown date'}
                  </Typography>
                </Box> */}
              </Box>

              {/* Signing order info */}
              {/* {signingInfo && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Signing Order: #{signingInfo.current_order || 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed: {signingInfo.completed_recipients || 0}/{signingInfo.total_recipients || 1}
                    </Typography>
                  </Box>
                </>
              )} */}
            </CardContent>
          </Card>

          {/* OTP Input */}
          {/* Professional OTP Input Section */}
          <Box sx={{ maxWidth: 400, mx: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <LockIcon sx={{ fontSize: 16, mr: 1 }} />
              Enter 6-Digit Verification Code
            </Typography>

            {/* OTP Input Boxes */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1.5,
              mb: 4,
              position: 'relative',
              cursor: 'text'
            }}
              onClick={() => {
                document.getElementById('otp-hidden-input')?.focus();
              }}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Paper
                  key={index}
                  elevation={1}
                  className="otp-box"
                  sx={{
                    width: 56,
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: otp[index] ? 'primary.main' : 'grey.300',
                    backgroundColor: '#fff',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: otp[index] ? 'primary.dark' : 'text.primary',
                      letterSpacing: 0,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {otp[index] || ''}
                  </Typography>

                  {/* Cursor animation for active field */}
                  {index === otp.length && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        width: 20,
                        height: 2,
                        backgroundColor: 'primary.main',
                        animation: 'blink 1s infinite',
                        '@keyframes blink': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0 }
                        }
                      }}
                    />
                  )}

                  {/* Underline effect */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      backgroundColor: 'primary.main',
                      transform: otp[index] ? 'scaleX(1)' : 'scaleX(0)',
                      transition: 'transform 0.3s ease',
                      transformOrigin: 'center'
                    }}
                  />
                </Paper>
              ))}
            </Box>

            {/* Hidden input for keyboard entry */}
            <TextField
              id="otp-hidden-input"
              autoFocus
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
                setError('');
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData
                  .getData('text')
                  .replace(/\D/g, '')
                  .slice(0, 6);
                setOtp(pasted);
              }}
              inputProps={{ maxLength: 6 }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 0,          // ✅ KEY FIX
                opacity: 0,
                pointerEvents: 'none' // prevents layout & clicks
              }}
            />


            {/* Helper text */}
            {/* <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'block', 
                textAlign: 'center', 
                mb: 3,
                fontSize: '0.75rem'
              }}
            >
              Code sent to {emailMasked || recipientInfo?.email}
            </Typography> */}

            {/* Attempts Counter */}
            {attempts > 0 && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                animation: attempts > 2 ? 'shake 0.5s ease-in-out' : 'none'
              }}>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 500 }}>
                  <ErrorIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  {attempts} failed attempt{attempts !== 1 ? 's' : ''}
                  {attempts >= 2 && ' - One more attempt before lockout'}
                </Typography>
              </Box>
            )}

            {/* Error/Success Messages */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  animation: 'fadeInUp 0.3s ease-out',
                  '& .MuiAlert-icon': {
                    animation: attempts > 2 ? 'shake 0.5s ease-in-out' : 'none'
                  }
                }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 2,
                  animation: 'fadeInUp 0.5s ease-out',
                  borderLeft: '4px solid #2E7D32',
                  backgroundColor: '#f0f9f0',
                  '& .MuiAlert-icon': {
                    color: '#2E7D32',
                    animation: 'pulse 2s infinite'
                  }
                }}
                onClose={() => setSuccess('')}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {success}
                </Typography>
              </Alert>
            )}

            {/* OTP Verification Status */}
            {otpVerified && (
              <Alert
                severity="success"
                sx={{
                  mb: 2,
                  animation: 'fadeInUp 0.5s ease-out'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Identity verified successfully!
                    {requiresTerms && !termsAccepted && ' Please accept the terms to continue.'}
                  </Typography>
                </Box>
              </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              {!otpVerified ? (
                <Button
                  variant="contained"
                  onClick={handleVerifyOTP}
                  disabled={!otp || otp.length !== 6 || otpLoading}
                  fullWidth
                  size="large"
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      backgroundColor: 'grey.300',
                      color: 'grey.500'
                    }
                  }}
                >
                  {otpLoading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    `Verify ${otp.length === 6 ? `Code: ${otp}` : 'Identity'}`
                  )}
                </Button>
              ) : requiresTerms && !termsAccepted ? (
                <Button
                  variant="contained"
                  onClick={() => setTermsDialogOpen(true)}
                  fullWidth
                  size="large"
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  View & Accept Terms
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => window.location.href = `/sign/${recipientId}`}
                  fullWidth
                  size="large"
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Proceed to Signing
                </Button>
              )}

              {!otpVerified && (
                <Button
                  variant="outlined"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || otpLoading}
                  fullWidth
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderRadius: 2,
                    height: 44,
                    textTransform: 'none',
                    fontWeight: 500,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2
                    }
                  }}
                >
                  {resendTimer > 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      Resend in {resendTimer}s
                    </Box>
                  ) : (
                    'Resend Verification Code'
                  )}
                </Button>
              )}
            </Box>

            {/* Security Note */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 3,
                display: 'block',
                textAlign: 'center',
                fontSize: '0.75rem',
                lineHeight: 1.5
              }}
            >
              <LockIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
              For security, this code expires in 24 hours and can only be used once
            </Typography>

            {/* Keyboard Shortcuts Hint */}
            {/* <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                mt: 1, 
                display: 'block', 
                textAlign: 'center',
                fontSize: '0.7rem'
              }}
            >
              Tip: You can paste (Ctrl+V) the code or type digits
            </Typography> */}

            {/* Terms Note */}
            {/* {requiresTerms && !termsAccepted && (
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2,
                  '& .MuiAlert-icon': {
                    alignItems: 'center'
                  }
                }}
              >
                <Typography variant="caption">
                  After verification, you will need to accept the terms and conditions before proceeding to sign the document.
                </Typography>
              </Alert>
            )} */}
          </Box>
        </Paper>
      </Container>

      {/* Terms Dialog */}
      <TermsDialog
        open={termsDialogOpen}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
        recipientInfo={recipientInfo}
        documentInfo={documentInfo}
        signingInfo={signingInfo}
        required={true}
      />

      {/* Document Voided Popup */}
      <Dialog
        open={voidedDialogOpen}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: '#f44336',
          color: 'white',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <VoidIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Document Voided
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <VoidIcon sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              This Document Has Been Voided
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The document "{documentInfo?.filename}" is no longer available for signing as it has been voided by the sender or administrator.
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#fff5f5', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 500, color: '#d32f2f' }}>
                VOIDED DOCUMENT DETAILS
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Document:</strong> {documentInfo?.filename || 'Untitled'}
                </Typography>
                <Typography variant="body2">
                  <strong>Recipient:</strong> {recipientInfo?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {recipientInfo?.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> <Chip label="VOIDED" size="small" color="error" sx={{ ml: 1 }} />
                </Typography>
              </Box>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Button
              variant="outlined"
              onClick={() => window.close()}
              fullWidth
              startIcon={<CloseIcon />}
            >
              Close Window
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => window.location.href = `/sign/${recipientId}/voided`}
              fullWidth
              startIcon={<DocIcon />}
            >
              View Void Details
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Terms Already Declined Popup */}
      <Dialog
        open={declinedTermsDialogOpen}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: '#ff9800',
          color: 'white',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BlockedIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Terms Previously Declined
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <BlockedIcon sx={{ fontSize: 64, color: '#ff9800', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              You Previously Declined Terms
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You have previously declined the terms and conditions for signing "{documentInfo?.filename}". To proceed with signing, you must re-accept the terms.
            </Typography>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Declining terms prevents you from signing this document. If you wish to proceed, you must accept the updated terms.
              </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff8e1', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 500, color: '#ed6c02' }}>
                SIGNING STATUS
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Document:</strong> {documentInfo?.filename || 'Untitled'}
                </Typography>
                <Typography variant="body2">
                  <strong>Recipient:</strong> {recipientInfo?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Terms Status:</strong> <Chip label="DECLINED" size="small" color="warning" sx={{ ml: 1 }} />
                </Typography>
              </Box>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Button
              variant="outlined"
              onClick={() => window.close()}
              fullWidth
              startIcon={<CloseIcon />}
            >
              Close Window
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                setDeclinedTermsDialogOpen(false);
                setTermsDialogOpen(true);
              }}
              fullWidth
              startIcon={<CheckIcon />}
            >
              Review & Accept Terms
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Professional Success Dialog */}
      <SuccessDialog
        open={successDialogOpen}
        message={successMessage}
      />
    </>
  );
};

export default OTPVerificationPage;