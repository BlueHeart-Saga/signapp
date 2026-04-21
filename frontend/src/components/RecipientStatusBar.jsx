// components/RecipientStatusBar.jsx
import React, { useState } from "react";
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  RemoveRedEye as ViewedIcon,
  Send as InvitedIcon,
  Computer as ComputerIcon,
  History as HistoryIcon
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Avatar,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Chip
} from "@mui/material";
import { HiOutlinePaperAirplane } from "react-icons/hi2";

const STATUS_FLOW = ["Mailed", "Viewed", "Signed"];

const ROLE_COLORS = {
  signer: "#3B82F6",
  approver: "#8B5CF6",
  viewer: "#6B7280",
  form_filler: "#EC4899",
  witness: "#F59E0B",
  in_person_signer: "#059669"
};

export default function DocumentRecipientStatus({
  recipient,
  index = 1,
  documentStatus = "sent"
}) {
  const [reminding, setReminding] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  if (!recipient) return null;

  const handleSendReminder = async (recipientId) => {
    try {
      setReminding(true);
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/recipients/${recipientId}/send-reminder`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to send reminder");
      }

      setSnackbar({
        open: true,
        message: "Reminder sent successfully!",
        severity: "success"
      });
    } catch (err) {
      console.error("Reminder error:", err);
      setSnackbar({
        open: true,
        message: "Error sending reminder. Please try again.",
        severity: "error"
      });
    } finally {
      setReminding(false);
    }
  };

  const {
    name,
    email,
    role = "signer",
    status = "pending",
    signed_at,
    viewed_at,
    invited_at,
    access_device = "Web",
    access_ip,
    last_access_at,
    decline_reason
  } = recipient;

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Map status to step index
  const getCurrentStepIndex = () => {
    const s = status?.toLowerCase();
    if (s === 'declined') return -1;
    if (s === 'completed' || s === 'signed') return 2;
    if (s === 'viewed' || s === 'otp_verified') return 1;
    if (s === 'sent' || s === 'invited' || s === 'pending') return 0;
    return 0;
  };

  const currentStep = getCurrentStepIndex();
  const isCompleted = status === 'completed' || status === 'signed';
  const isDeclined = status === 'declined';

  return (
    <Paper
      elevation={1}
      sx={{
        py: 3,
        px: 4,
        mb: 2,
        borderRadius: 3,
        border: '1px solid #f1f5f9',
        bgcolor: 'white',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: '#fff',
          borderColor: '#e2e8f0',
          boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>

        {/* LEFT SIDE: RECIPIENT INFO */}
        <Box sx={{ flex: 1, display: 'flex', gap: 3 }}>
          {/* Index Number */}
          <Typography
            variant="body2"
            sx={{
              color: '#94a3b8',
              fontWeight: 500,
              pt: 0.5,
              minWidth: 20
            }}
          >
            {index}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {/* Name & Role */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" fontWeight={600} sx={{ color: '#1e293b', lineHeight: 1.2 }}>
                {name || 'Unknown Recipient'}
              </Typography>
              <Chip
                label={role.replace(/_/g, ' ')}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  bgcolor: ROLE_COLORS[role] || '#64748b',
                  color: 'white',
                  borderRadius: '4px',
                  px: 0.5,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>

            {/* Email */}
            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
              {email}
            </Typography>

            {/* Access Log Line (Zoho Style) */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Accessed from IP address
                <span style={{ color: '#64748b', fontWeight: 500 }}>{access_ip || 'N/A'}</span>
                using
                <span style={{ color: '#64748b', fontWeight: 500 }}>{access_device || 'Web'}</span>
                at
                <span style={{ color: '#64748b', fontWeight: 500 }}>{formatDate(last_access_at || invited_at || viewed_at)}</span>
              </Typography>
            </Box>

            {isDeclined && decline_reason && (
              <Typography variant="caption" sx={{ color: '#ef4444', mt: 1, fontWeight: 500 }}>
                Declined: {decline_reason}
              </Typography>
            )}
          </Box>
        </Box>

        {/* RIGHT SIDE: STATUS DIAGRAM & ACTIONS */}
        <Box sx={{ minWidth: 280, pt: 1, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {!isDeclined ? (
            <Box sx={{ position: 'relative', flex: 1, mx: 1 }}>
              {/* The Connector Lines */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 10,
                  right: 10,
                  height: 3,
                  bgcolor: '#e2e8f0',
                  zIndex: 1
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 10,
                  width: currentStep === 1 ? 'calc(50% - 10px)' : currentStep === 2 ? 'calc(100% - 20px)' : '0%',
                  height: 3,
                  bgcolor: isCompleted ? '#10b981' : '#3B82F6',
                  zIndex: 2,
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />

              {/* Status Steps */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 3 }}>
                {STATUS_FLOW.map((label, stepIdx) => {
                  const isDone = stepIdx <= currentStep;
                  const stepColor = isDone ? (isCompleted ? '#10b981' : '#3B82F6') : '#cbd5e1';

                  return (
                    <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 65 }}>
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: isDone ? stepColor : 'white',
                          border: `2.5px solid ${stepColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          mb: 1
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: isDone ? '#1e293b' : '#94a3b8',
                          fontWeight: isDone ? 800 : 500,
                          fontSize: '0.75rem',
                          letterSpacing: isDone ? '0.2px' : '0'
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600 }}>
                DECLINED
              </Typography>
            </Box>
          )}

          {/* MANUAL REMINDER BUTTON */}
          {!isCompleted && !isDeclined && documentStatus !== 'completed' && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: -0.5 }}>
              <Tooltip title="Send manual reminder" arrow>
                <IconButton
                  size="medium"
                  onClick={() => handleSendReminder(recipient.id || recipient._id)}
                  disabled={reminding}
                  sx={{
                    color: '#0f766e',
                    border: '1px solid #ccfbf1',
                    bgcolor: '#f0fdfa',
                    '&:hover': {
                      bgcolor: '#ccfbf1',
                      borderColor: '#0f766e'
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#f9fafb',
                      color: '#9ca3af'
                    },
                    transition: 'all 0.2s',
                    width: 36,
                    height: 36
                  }}
                >
                  {reminding ? (
                    <CircularProgress size={18} thickness={5} sx={{ color: '#0f766e' }} />
                  ) : (
                    <HiOutlinePaperAirplane size={18} style={{ transform: 'rotate(-45deg)', marginLeft: '2px', marginBottom: '2px' }} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* SNACKBAR FEEDBACK */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </Paper>
  );
}
