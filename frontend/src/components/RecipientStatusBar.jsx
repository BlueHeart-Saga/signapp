// components/DocumentRecipientStatus.jsx
import React from "react";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Computer as ComputerIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  RemoveRedEye as ViewedIcon,
  Send as InvitedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Grid,
  Paper,
  Stack,
  Divider
} from "@mui/material";

const STATUS_FLOW = ["Invited", "Viewed", "Signed"];
const STATUS_COLORS = {
  invited: "#9CA3AF",
  viewed: "#F59E0B",
  signed: "#10B981",
  completed: "#10B981",
  declined: "#EF4444",
  pending: "#9CA3AF"
};

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
  documentStatus = "sent",
  showDetails = false,
  onToggleDetails = null
}) {
  if (!recipient) return null;

  const {
    _id,
    name,
    email,
    role = "signer",
    status = "pending",
    signing_order,
    signed_at,
    viewed_at,
    invited_at,
    access_device = "Web",
    access_ip,
    access_date,
    terms_accepted,
    terms_accepted_at,
    otp_verified,
    otp_verified_at,
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
    switch (status?.toLowerCase()) {
      case 'invited':
      case 'pending':
        return 0;
      case 'viewed':
      case 'in_progress':
      case 'otp_verified':
        return 1;
      case 'signed':
      case 'completed':
        return 2;
      case 'declined':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = getCurrentStepIndex();
  const isCompleted = status === 'completed' || status === 'signed';
  const isDeclined = status === 'declined';

  // Calculate progress percentage for the status bar
  const getProgressPercentage = () => {
    if (isDeclined) return 0;
    return ((currentStep + 1) / STATUS_FLOW.length) * 100;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 2,
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        bgcolor: isCompleted ? '#F0F9FF' : 'white',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          borderColor: isCompleted ? '#3B82F6' : '#D1D5DB'
        }
      }}
    >
      {/* Main Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        {/* Left Side - All Details */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2.5 }}>
          {/* Avatar & Basic Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
            <Avatar
              sx={{
                bgcolor: ROLE_COLORS[role] || '#6B7280',
                width: 44,
                height: 44,
                fontSize: '1rem'
              }}
            >
              {name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#111827' }}>
                {name || 'Unknown Name'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmailIcon sx={{ fontSize: 14 }} />
                {email || 'No email'}
              </Typography>
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Role & Order */}
          <Box sx={{ minWidth: 120 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={role?.replace('_', ' ') || 'Signer'}
                size="small"
                sx={{
                  bgcolor: ROLE_COLORS[role] || '#6B7280',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  textTransform: 'capitalize'
                }}
              />
              {signing_order && (
                <Chip
                  label={`#${signing_order}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: '#D1D5DB',
                    color: '#6B7280',
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Stack>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Status & Timeline */}
          <Box sx={{ minWidth: 200 }}>
            {isDeclined ? (
              <Box>
                <Chip
                  label="Declined"
                  color="error"
                  size="small"
                  icon={<ScheduleIcon />}
                />
                {decline_reason && (
                  <Typography variant="caption" sx={{ color: '#EF4444', mt: 0.5, display: 'block' }}>
                    Reason: {decline_reason}
                  </Typography>
                )}
              </Box>
            ) : (
              <Stack spacing={0.5}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: isCompleted ? '#10B981' : '#3B82F6',
                  }}
                >
                  {status?.toUpperCase() || 'PENDING'}
                </Typography>
                
                <Stack direction="row" spacing={2}>
                  {invited_at && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                        Invited
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {formatDate(invited_at)?.split(',')[0]}
                      </Typography>
                    </Box>
                  )}
                  
                  {viewed_at && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                        Viewed
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {formatDate(viewed_at)?.split(',')[0]}
                      </Typography>
                    </Box>
                  )}
                  
                  {signed_at && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                        Signed
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {formatDate(signed_at)?.split(',')[0]}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
            )}
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Access Info */}
          <Box sx={{ minWidth: 150 }}>
            {access_device && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <ComputerIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  {access_device}
                </Typography>
              </Box>
            )}
            
            {access_date && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  {new Date(access_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Side - Progress Bar Only */}
        <Box sx={{ minWidth: 270 }}>
          {!isDeclined && (
            <Box sx={{ position: 'relative', height: 36 }}>
              {/* Progress Track */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '30%',
                  left: 0,
                  right: 0,
                  height: 8,
                  bgcolor: '#E5E7EB',
                  transform: 'translateY(-50%)',
                  borderRadius: 2
                }}
              />
              
              {/* Progress Fill */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '30%',
                  left: 0,
                  width: `${getProgressPercentage()}%`,
                  height: 7,
                  bgcolor: isCompleted ? '#10B981' : '#3B82F6',
                  transform: 'translateY(-50%)',
                  borderRadius: 2,
                  transition: 'width 0.5s ease'
                }}
              />
              
              {/* Steps */}
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                {STATUS_FLOW.map((label, index) => {
                  const isActive = index <= currentStep;
                  
                  return (
                    <Box
                      key={label}
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: 60
                      }}
                    >
                      {/* Step Dot */}
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: isActive ? (isCompleted ? '#10B981' : '#3B82F6') : '#E5E7EB',
                          border: `3px solid ${isActive ? (isCompleted ? '#10B981' : '#3B82F6') : '#E5E7EB'}`,
                          position: 'relative',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isActive && (
                          <CheckCircleIcon
                            sx={{
                              fontSize: 14,
                              color: 'white'
                            }}
                          />
                        )}
                      </Box>
                      
                      {/* Step Label */}
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 0.5,
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          color: isActive ? (isCompleted ? '#10B981' : '#3B82F6') : '#9CA3AF',
                          textAlign: 'center'
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>

        {/* Toggle Details Button */}
        {/* {onToggleDetails && (
          <IconButton
            size="small"
            onClick={() => onToggleDetails(_id)}
            sx={{
              color: '#6B7280',
              '&:hover': { bgcolor: '#F3F4F6' }
            }}
          >
            {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )} */}
      </Box>

      {/* Expanded Details Section */}
      {showDetails && (
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E5E7EB' }}>
          <Grid container spacing={3}>
            {/* Left Column - Timeline Details */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 2, fontWeight: 600 }}>
                SIGNING TIMELINE
              </Typography>
              
              <Stack spacing={2}>
                {/* Invited */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: invited_at ? '#3B82F6' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <InvitedIcon sx={{ fontSize: 16, color: invited_at ? 'white' : '#9CA3AF' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Invitation Sent
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                      {invited_at ? formatDate(invited_at) : 'Pending'}
                    </Typography>
                  </Box>
                </Box>

                {/* Viewed */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: viewed_at ? '#F59E0B' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ViewedIcon sx={{ fontSize: 16, color: viewed_at ? 'white' : '#9CA3AF' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Document Viewed
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                      {viewed_at ? formatDate(viewed_at) : 'Not yet viewed'}
                    </Typography>
                  </Box>
                </Box>

                {/* OTP Verified */}
                {otp_verified && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      bgcolor: '#8B5CF6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircleIcon sx={{ fontSize: 16, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        OTP Verified
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {otp_verified_at ? formatDate(otp_verified_at) : 'Verified'}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Terms Accepted */}
                {terms_accepted && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      bgcolor: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircleIcon sx={{ fontSize: 16, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Terms Accepted
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {terms_accepted_at ? formatDate(terms_accepted_at) : 'Accepted'}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Signed/Completed */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: signed_at ? '#10B981' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: signed_at ? 'white' : '#9CA3AF' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Document Signed
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                      {signed_at ? formatDate(signed_at) : 'Pending signature'}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>

            {/* Right Column - Technical Details */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 2, fontWeight: 600 }}>
                ACCESS DETAILS
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F9FAFB' }}>
                <Grid container spacing={2}>
                  {access_ip && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LocationIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                            IP Address
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {access_ip}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  
                  {access_device && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ComputerIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                            Device & Browser
                          </Typography>
                          <Typography variant="body2">
                            {access_device}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Additional Info */}
              {(role === 'viewer' || role === 'approver') && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={role === 'viewer' ? 'View Only' : 'Approval Required'}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: '#D1D5DB',
                      color: '#6B7280'
                    }}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}