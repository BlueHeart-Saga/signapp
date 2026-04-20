import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Menu,
  MenuItem,
  Stack,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Email as EmailIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Description as SummaryIcon,
  Verified as CertificateIcon,
  Block as BlockedIcon,
  Person as PersonIcon,

  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { Description as DocumentIcon } from '@mui/icons-material';

import { useParams } from 'react-router-dom';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

const Completion = () => {
  const { recipientId } = useParams();

  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState('');

  // New states for document info
  const [loading, setLoading] = useState(true);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [signingInfo, setSigningInfo] = useState(null);
  const [allRecipients, setAllRecipients] = useState([]);
  const [isDocumentCompleted, setIsDocumentCompleted] = useState(false);

  // Fetch document and recipient info
  useEffect(() => {
    const fetchDocumentInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch document information');
        }

        const data = await response.json();

        setDocumentInfo(data.document);
        setRecipientInfo(data.recipient);
        setSigningInfo(data.signing_info);

        // Extract recipients from signing_info if available
        if (data.signing_info?.recipients) {
          setAllRecipients(data.signing_info.recipients);
        }

        // Check if document is fully completed
        const isCompleted = data.document?.status === 'completed';
        setIsDocumentCompleted(isCompleted);

      } catch (error) {
        console.error('Error fetching document info:', error);
        setSnackbar({
          open: true,
          msg: 'Failed to load document information',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (recipientId) {
      fetchDocumentInfo();
    }
  }, [recipientId]);

  /* ---------------- DOWNLOAD HELPERS ---------------- */
  const downloadFile = async (url, filename) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const blob = await res.blob();
      const link = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      setSnackbar({
        open: true,
        msg: ` ${filename} downloaded successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Download failed:', error);
      setSnackbar({
        open: true,
        msg: error.message.includes('Document not completed')
          ? 'Document is not fully signed yet. Please wait for all recipients to complete signing.'
          : '❌ Download failed. Please try again.',
        severity: 'error'
      });
    }
  };

  /* ---------------- MAIN DOWNLOAD BUTTON (SIGNED DOCUMENT) ---------------- */
  const handleMainDownload = async () => {

    await downloadFile(
      `${API_BASE_URL}/signing/recipient/${recipientId}/download/signed`,
      `signed_${documentInfo?.filename || 'document'}.pdf`
    );
  };

  /* ---------------- PASSWORD PROTECTED DOWNLOAD ---------------- */
  const handleSignedDownloadWithPassword = async () => {

    if (!downloadPassword || downloadPassword.length < 4) {
      setSnackbar({
        open: true,
        msg: 'Please enter a passkey with at least 4 characters',
        severity: 'warning'
      });
      return;
    }

    try {
      const encodedPasskey = encodeURIComponent(downloadPassword);
      await downloadFile(
        `${API_BASE_URL}/signing/recipient/${recipientId}/download/signed/password?passkey=${encodedPasskey}`,
        `protected_${documentInfo?.filename || 'document'}.pdf`
      );

      setPasswordDialog(false);
      setDownloadPassword('');
    } catch (error) {
      setSnackbar({
        open: true,
        msg: 'Failed to download protected document',
        severity: 'error'
      });
    }
  };

  /* ---------------- ORIGINAL DOWNLOAD ---------------- */
  const handleOriginalDownload = async () => {
    await downloadFile(
      `${API_BASE_URL}/signing/recipient/${recipientId}/download/original`,
      `original_${documentInfo?.filename || 'document'}.pdf`
    );
  };

  /* ---------------- SUMMARY DOWNLOAD ---------------- */
  const handleSummaryDownload = async () => {
    await downloadFile(
      `${API_BASE_URL}/signing/recipient/${recipientId}/download/summary`,
      `summary_${documentInfo?.filename || 'document'}.pdf`
    );
  };

  /* ---------------- CERTIFICATE DOWNLOAD ---------------- */
  const handleCertificateDownload = async () => {

    await downloadFile(
      `${API_BASE_URL}/signing/recipient/${recipientId}/download/certificate`,
      `certificate_${documentInfo?.filename || 'document'}.pdf`
    );
  };

  /* ---------------- PACKAGE DOWNLOAD (ZIP) ---------------- */
  const handlePackageDownload = async () => {

    await downloadFile(
      `${API_BASE_URL}/signing/recipient/${recipientId}/download/package`,
      `SafeSign_Package_${documentInfo?.envelope_id || 'Document'}.zip`
    );
  };

  /* ---------------- EMAIL ---------------- */
  const handleEmail = async () => {

    try {
      await fetch(
        `${API_BASE_URL}/signing/recipient/${recipientId}/email-signed`,
        { method: 'POST' }
      );

      setSnackbar({
        open: true,
        msg: '📧 Signed document has been sent to your email.',
        severity: 'success'
      });
    } catch {
      setSnackbar({
        open: true,
        msg: 'Failed to send email. Please try again.',
        severity: 'error'
      });
    }
  };

  /* ---------------- PRINT ---------------- */
  const handlePrint = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/signing/recipient/${recipientId}/download/signed`
      );

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(iframe);
        }, 1000);
      };
    } catch (err) {
      console.error('Print failed', err);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const getDocumentStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'sent': return 'info';
      case 'voided': return 'error';
      case 'declined': return 'error';
      default: return 'default';
    }
  };

  const getDocumentStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'sent': return 'Sent';
      case 'voided': return 'Voided';
      case 'declined': return 'Declined';
      default: return status;
    }
  };

  const completedRecipients = allRecipients.filter(r => r.status === 'completed');
  const pendingRecipients = allRecipients.filter(r => r.status !== 'completed' && r.status !== 'declined');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'center',
        p: { xs: 1.5, sm: 3 },
        pt: { xs: 8, sm: 3 }
      }}
    >
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
            color: "#0d9488",
            letterSpacing: 0.3,
          }}
        >
          SafeSign
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 800, width: '100%', mt: { xs: 1, sm: 0 } }}>
        {/* Document Status Banner */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 2,
            borderLeft: `4px solid ${documentInfo?.status === 'completed' ? '#4CAF50' :
              documentInfo?.status === 'voided' ? '#f44336' :
                documentInfo?.status === 'declined' ? '#ff9800' : '#2196f3'
              }`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              <DocumentIcon color="primary" sx={{ fontSize: { xs: 28, sm: 40 } }} />
              <Box>
                <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }, wordBreak: 'break-word' }}>
                  {documentInfo?.filename || 'Document'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={getDocumentStatusText(documentInfo?.status)}
                    color={getDocumentStatusColor(documentInfo?.status)}
                    size="small"
                  />
                  {documentInfo?.envelope_id && (
                    <Chip
                      label={`Envelope: ${documentInfo.envelope_id}`}
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {isDocumentCompleted && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckIcon color="success" />
                <Typography variant="body2" color="success.main" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  All signatures completed
                </Typography>
              </Box>
            )}
          </Box>

          {/* Document Details */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                DOCUMENT INFORMATION
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Your Name"
                    secondary={recipientInfo?.name || 'Not provided'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Your Email"
                    secondary={recipientInfo?.email || 'Not provided'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Uploaded"
                    secondary={documentInfo?.uploaded_at ?
                      new Date(documentInfo.uploaded_at).toLocaleDateString() :
                      'Unknown'}
                  />
                </ListItem>
              </List>
            </Box>

            {/* <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                SIGNING PROGRESS
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Total Recipients" 
                    secondary={allRecipients.length} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Completed" 
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {completedRecipients.length} / {allRecipients.length}
                        <Typography variant="caption" color="text.secondary">
                          ({allRecipients.length > 0 ? Math.round((completedRecipients.length / allRecipients.length) * 100) : 0}%)
                        </Typography>
                      </Box>
                    } 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Pending" 
                    secondary={pendingRecipients.length} 
                  />
                </ListItem>
              </List>
            </Box> */}
          </Box>

          {/* Status-specific messages */}
          {documentInfo?.status === 'voided' && (
            <Alert
              severity="error"
              icon={<BlockedIcon />}
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                This document has been voided and is no longer valid for signing.
                {documentInfo.void_reason && ` Reason: ${documentInfo.void_reason}`}
              </Typography>
            </Alert>
          )}

          {documentInfo?.status === 'declined' && (
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                This document has been declined and the signing process has been terminated.
              </Typography>
            </Alert>
          )}

          {!isDocumentCompleted && documentInfo?.status === 'in_progress' && (
            <Alert
              severity="info"
              icon={<InfoIcon />}
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                Waiting for other recipients to sign. You can download the original document,
                but the final signed version will be available once all signers complete.
              </Typography>
            </Alert>
          )}
        </Paper>

        {/* Action Buttons Section */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          {/* <Typography 
            variant="subtitle1" 
            fontWeight={600} 
            gutterBottom
            sx={{ color: '#374151', mb: 3 }}
          >
            Document Actions
          </Typography> */}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
            flexWrap="wrap"
            gap={1}
          >
            <Button
              fullWidth={false}
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={handleEmail}
              sx={{ minWidth: { xs: '100%', sm: 140 } }}
            >
              Email to me
            </Button>

            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ minWidth: { xs: '100%', sm: 110 } }}
            >
              Print
            </Button>

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              endIcon={<ArrowDownIcon />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                minWidth: { xs: '100%', sm: 140 },
                bgcolor: '#0d9488',
                '&:hover': {
                  bgcolor: '#0f766e'
                }
              }}
            >
              Download
            </Button>
          </Stack>

          {/* DROPDOWN MENU */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            PaperProps={{
              elevation: 4,
              sx: { minWidth: 260, mt: 1 }
            }}
          >
            {/* 1. Package (ZIP) */}
            <MenuItem
              onClick={() => { handlePackageDownload(); setAnchorEl(null); }}
            >
              <ListItemIcon>
                <ArchiveIcon fontSize="small" sx={{ color: '#6366f1' }} />
              </ListItemIcon>
              <ListItemText>Download Package (ZIP)</ListItemText>
            </MenuItem>

            {/* 2. Signed PDF */}
            <MenuItem
              onClick={() => { handleMainDownload(); setAnchorEl(null); }}
            >
              <ListItemIcon>
                <CheckIcon fontSize="small" sx={{ color: '#10b981' }} />
              </ListItemIcon>
              <ListItemText>Download Signed PDF</ListItemText>
            </MenuItem>

            {/* 3. Product Pass (Protected) */}
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setPasswordDialog(true);
              }}
            >
              <ListItemIcon>
                <BlockedIcon fontSize="small" sx={{ color: '#f59e0b' }} />
              </ListItemIcon>
              <ListItemText>Download Product Pass (Protected)</ListItemText>
            </MenuItem>

            <Divider />

            {/* 4. Original */}
            <MenuItem
              onClick={() => {
                handleOriginalDownload();
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <DocumentIcon fontSize="small" sx={{ color: '#6b7280' }} />
              </ListItemIcon>
              <ListItemText>Original Document</ListItemText>
            </MenuItem>

            {/* 5. Summary */}
            <MenuItem
              onClick={() => {
                handleSummaryDownload();
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <SummaryIcon fontSize="small" sx={{ color: '#3b82f6' }} />
              </ListItemIcon>
              <ListItemText>Document Summary</ListItemText>
            </MenuItem>

            {/* 6. Certificate */}
            <MenuItem
              onClick={() => {
                handleCertificateDownload();
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <CertificateIcon fontSize="small" sx={{ color: '#8b5cf6' }} />
              </ListItemIcon>
              <ListItemText>Certificate of Completion</ListItemText>
            </MenuItem>
          </Menu>

          {/* Pending Recipients List */}
          {pendingRecipients.length > 0 && (
            <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                WAITING FOR THESE RECIPIENTS:
              </Typography>
              <List dense>
                {pendingRecipients.map((recipient, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={recipient.name || recipient.email}
                      secondary={`Role: ${recipient.role} • Status: ${recipient.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>

        {/* PASSWORD DIALOG */}
        <Dialog
          open={passwordDialog}
          onClose={() => {
            setPasswordDialog(false);
            setDownloadPassword('');
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Set Download Passkey</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              type="password"
              label="Passkey (min. 4 characters)"
              value={downloadPassword}
              onChange={(e) => setDownloadPassword(e.target.value)}
              autoFocus
              margin="dense"
              helperText="This passkey will encrypt the PDF. You'll need it to open the file."
              error={downloadPassword.length > 0 && downloadPassword.length < 4}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setPasswordDialog(false);
              setDownloadPassword('');
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSignedDownloadWithPassword}
              disabled={!downloadPassword || downloadPassword.length < 4}
            >
              Download with Passkey
            </Button>
          </DialogActions>
        </Dialog>

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ width: '100%' }}
          >
            {snackbar.msg}
          </Alert>
        </Snackbar>

        {/* Footer Note */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
            fontSize: '0.75rem'
          }}
        >
          Note: Some options may be disabled until all recipients complete signing.
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mt: 2,
            color: 'text.secondary'
          }}
        >
          If you want to view your previous signed documents,&nbsp;
          <Box
            component="span"
            sx={{
              color: 'primary.main',
              cursor: 'pointer',
              fontWeight: 500,
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => window.open('/recipient/access', '_blank')}
          >
            click here
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};

export default Completion;