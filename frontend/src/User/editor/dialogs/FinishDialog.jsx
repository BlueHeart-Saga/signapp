import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Verified as VerifiedIcon,
  HowToReg as WitnessIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  Close as CloseIcon,

} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

import { FIELD_ROLES, FIELD_TYPES, ROLE_FIELD_RULES, getRecipientColor } from '../../../config/fieldConfig';

const FinishDialog = ({
  open,
  onClose,
  onConfirm,
  fields = [],
  recipients = [],
  invalidFields = [],
  unassignedFields = [],
  saving = false,
  document,
  onRenameClick,
  getFieldValidationError,
  getRecipientColor,
  FIELD_ROLES
}) => {

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'signer': return <PersonIcon fontSize="small" />;
      case 'approver': return <VerifiedIcon fontSize="small" />;
      case 'form_filler': return <EditIcon fontSize="small" />;
      case 'witness': return <WitnessIcon fontSize="small" />;
      case 'in_person_signer': return <PersonIcon fontSize="small" />;
      case 'viewer': return <VisibilityIcon fontSize="small" />;
      default: return <PersonIcon fontSize="small" />;
    }
  };

  const ROLES_WITHOUT_FIELDS = ['viewer', 'approver'];
  const recipientsMissingFields = recipients.filter(recipient => {
    if (ROLES_WITHOUT_FIELDS.includes(recipient.role)) return false;
    const assignedFields = fields.filter(f => f.recipient_id === recipient.id);
    return assignedFields.length === 0;
  });

  const hasIssues = invalidFields.length > 0 || unassignedFields.length > 0 || recipientsMissingFields.length > 0;
  const severity = (invalidFields.length > 0 || recipientsMissingFields.length > 0) ? 'error' : (unassignedFields.length > 0 ? 'warning' : 'success');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{
        bgcolor: hasIssues ? '#f44336' : '#0d9488',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasIssues ? <ErrorIcon /> : <SendIcon />}
          <Typography variant="h6">
            {hasIssues ? 'Validation Issues Found' : 'Ready to Send for Signing'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Status Alert */}
        <Alert
          severity={severity}
          icon={severity === 'error' ? <ErrorIcon /> : severity === 'warning' ? <WarningIcon /> : <CheckCircleIcon />}
          sx={{
            mb: 3,
            '& .MuiAlert-icon': {
              color: severity === 'success' ? '#0d9488' : undefined
            }
          }}
        >
          <Typography variant="subtitle2">
            {invalidFields.length > 0
              ? `${invalidFields.length} incompatible field assignment${invalidFields.length > 1 ? 's' : ''} found`
              : recipientsMissingFields.length > 0
                ? `${recipientsMissingFields.length} recipient${recipientsMissingFields.length > 1 ? 's' : ''} missing required fields`
                : unassignedFields.length > 0
                  ? `${unassignedFields.length} unassigned field${unassignedFields.length > 1 ? 's' : ''}`
                  : 'All fields are properly assigned!'
            }
          </Typography>
        </Alert>

        {/* Document Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#0d9488' }}>
            Document Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#0d9488' }}>{fields.length}</Typography>
                <Typography variant="caption" color="text.secondary">Total Fields</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#0d9488' }}>
                  {fields.filter(f => f.recipient_id).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">Assigned</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color={invalidFields.length > 0 ? "error" : "inherit"}>
                  {invalidFields.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">Invalid</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color={unassignedFields.length > 0 ? "warning" : "inherit"}>
                  {unassignedFields.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">Unassigned</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Recipients Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#0d9488' }}>
            Recipients Summary ({recipients.length})
          </Typography>

          {recipients.length === 0 ? (
            <Alert severity="info" sx={{ '& .MuiAlert-icon': { color: '#0d9488' } }}>
              No recipients added yet. Add recipients before sending.
            </Alert>
          ) : (
            <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
              <List dense>
                {recipients.map((recipient) => {
                  const assignedFields = fields.filter(f => f.recipient_id === recipient.id);
                  const invalid = assignedFields.filter(f => getFieldValidationError(f)).length;
                  const recipientColor = getRecipientColor(recipient);

                  return (
                    <ListItem key={recipient.id} divider>
                      <ListItemIcon>
                        <Avatar sx={{
                          width: 32,
                          height: 32,
                          bgcolor: recipientColor,
                          fontSize: '0.875rem'
                        }}>
                          {getRoleIcon(recipient.role)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {recipient.name}
                            </Typography>
                            <Chip
                              label={FIELD_ROLES[recipient.role]?.name}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.6rem',
                                bgcolor: `${recipientColor}20`,
                                color: recipientColor
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {recipient.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assignedFields.length} field{assignedFields.length !== 1 ? 's' : ''}
                            </Typography>
                            {assignedFields.length === 0 && !ROLES_WITHOUT_FIELDS.includes(recipient.role) && (
                              <Chip
                                label="Fields Required"
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.6rem' }}
                              />
                            )}
                            {invalid > 0 && (
                              <Chip
                                label={`${invalid} invalid`}
                                size="small"
                                color="error"
                                sx={{ height: 18, fontSize: '0.6rem' }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        label={`Order ${recipient.signing_order || 1}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.6rem' }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          )}
        </Box>

        {/* Invalid Fields List */}
        {invalidFields.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#f44336' }}>
              Invalid Field Assignments
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#ffebee' }}>
              <List dense>
                {invalidFields.slice(0, 5).map((field, index) => {
                  const recipient = recipients.find(r => r.id === field.recipient_id);
                  return (
                    <ListItem key={field.id}>
                      <ListItemIcon>
                        <ErrorIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${field.label || field.type} cannot be assigned to ${recipient?.name || 'recipient'}`}
                        secondary={`${FIELD_TYPES[field.type]?.label} is not allowed for ${FIELD_ROLES[recipient?.role]?.name}`}
                      />
                    </ListItem>
                  );
                })}
                {invalidFields.length > 5 && (
                  <ListItem>
                    <ListItemText
                      secondary={`...and ${invalidFields.length - 5} more invalid fields`}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Box>
        )}

        {/* Document Name */}
        <Box sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#0d9488' }}>
              Document Details
            </Typography>
            <Tooltip title="Rename Document">
              <IconButton
                size="small"
                onClick={onRenameClick}
                sx={{
                  color: '#0d9488',
                  '&:hover': {
                    backgroundColor: 'rgba(13, 148, 136, 0.04)'
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="body2">
            <strong>Name:</strong> {document?.filename || 'Untitled Document'}
          </Typography>
          <Typography variant="body2">
            <strong>Pages:</strong> {document?.page_count || 1}
          </Typography>
          <Typography variant="body2">
            <strong>Status:</strong> {document?.status || 'Draft'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          sx={{
            color: '#0d9488',
            '&:hover': {
              backgroundColor: 'rgba(13, 148, 136, 0.04)'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={saving || invalidFields.length > 0 || recipientsMissingFields.length > 0}
          color={(invalidFields.length > 0 || recipientsMissingFields.length > 0) ? "error" : "primary"}
          startIcon={saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SendIcon />}
          sx={invalidFields.length === 0 ? {
            bgcolor: '#0d9488',
            '&:hover': {
              bgcolor: '#0f766e'
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(13, 148, 136, 0.3)'
            }
          } : {}}
        >
          {saving ? 'Sending...' : (invalidFields.length > 0 || recipientsMissingFields.length > 0) ? 'Fix Errors First' : 'Send Invites'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinishDialog;