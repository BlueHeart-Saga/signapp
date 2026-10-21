import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Chip,
  Avatar,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FilenameDisplay from '../../../components/FilenameDisplay';

const SuccessDialog = ({ 
  open, 
  onClose, 
  onNavigateToDashboard,
  onNavigateToDocuments,
  documentName = '',
  recipientCount = 0,
  autoRedirectSeconds = 2
}) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(autoRedirectSeconds);

  useEffect(() => {
    if (!open) return;
    setCountdown(autoRedirectSeconds);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onNavigateToDashboard) {
            onNavigateToDashboard();
          } else {
            window.location.href = '/user/dashboard';
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, autoRedirectSeconds, onNavigateToDashboard]);

  const handleGoToDashboard = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else {
      window.location.href = '/user/dashboard';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#0f766e', 
        color: 'white',
        textAlign: 'center',
        py: 3
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              animation: 'pulse 1.5s ease-in-out'
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h5" fontWeight={600}>
            Invites Sent Successfully!
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, pb: 3 }}>
        {/* Success Message */}
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          Your document has been sent to {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} for signing.
        </Typography>

        {documentName && (
          <Box sx={{ display: 'flex', border: 'none', justifyContent: 'center', mb: 3 }}>
            <Chip 
              label={<FilenameDisplay filename={documentName} maxLength={32} as="span" />}
              variant="outlined"
              color="success"
              icon={<DescriptionIcon />}
              sx={{ 
                px: 2,
                color: '#0f766e',
                borderColor: '#0f766e',
                '& .MuiChip-icon': { color: '#0f766e' },
                '& .MuiChip-label': { fontWeight: 500 }
              }}
            />
          </Box>
        )}

        {/* Stats Summary */}
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: '#f8f9fa',
            borderRadius: 2
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar sx={{ 
                  bgcolor: '#0f766e', 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 1
                }}>
                  <EmailIcon />
                </Avatar>
                <Typography variant="h6" sx={{ color: '#0f766e' }}>
                  {recipientCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Recipients
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar sx={{ 
                  bgcolor: '#0f766e', 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 1
                }}>
                  <CheckCircleIcon />
                </Avatar>
                <Typography variant="h6" sx={{ color: '#0f766e' }}>
                  Sent
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Next Steps */}
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#0f766e' },
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Typography variant="body2" fontWeight={500} gutterBottom>
            What happens next?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Recipients will receive email notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • You can track signing progress from your dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • All signers will receive the signed copy upon completion
          </Typography>
        </Alert>

        {/* Auto Redirect Progress Banner */}
        <Box 
          sx={{ 
            mt: 2,
            p: 2,
            bgcolor: '#f0fdf4',
            borderRadius: 2,
            border: '1px solid #bbf7d0',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 600, mb: 1 }}>
            Automatically redirecting to Dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={autoRedirectSeconds > 0 ? Math.min(100, Math.max(0, ((autoRedirectSeconds - countdown) / autoRedirectSeconds) * 100)) : 100}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: '#dcfce7',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#16a34a',
                borderRadius: 3,
                transition: 'transform 0.9s linear'
              }
            }}
          />
        </Box>
      </DialogContent>

      {/* <DialogActions sx={{ 
        p: 3, 
        pt: 2,
        borderTop: 1,
        borderColor: 'divider',
        justifyContent: 'center',
        gap: 2
      }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ 
            minWidth: 120,
            color: '#0f766e',
            borderColor: '#0f766e',
            '&:hover': {
              borderColor: '#0f766e',
              backgroundColor: 'rgba(13, 148, 136, 0.04)'
            }
          }}
        >
          Stay Here
        </Button>
        
        <Button
          variant="contained"
          onClick={handleGoToDashboard}
          startIcon={<DashboardIcon />}
          sx={{ 
            minWidth: 170,
            bgcolor: '#0f766e',
            '&:hover': {
              bgcolor: '#0d655e'
            }
          }}
        >
          Go to Dashboard ({countdown}s)
        </Button>
        
        <Button
          variant="contained"
          onClick={onNavigateToDocuments}
          startIcon={<DescriptionIcon />}
          sx={{ 
            minWidth: 150,
            bgcolor: '#0f766e',
            '&:hover': {
              bgcolor: '#0f766e'
            }
          }}
        >
          My Documents
        </Button>
      </DialogActions> */}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Dialog>
  );
};

export default SuccessDialog;
