import React, { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Tooltip
} from "@mui/material";
import {
  Download as DownloadIcon,
  MailOutline,
  VerifiedUserOutlined,
  DescriptionOutlined,
  MoreVert,
  Error as ErrorIcon
} from "@mui/icons-material";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const SummaryHeaderActions = ({ documentId, documentStatus }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [emailDialog, setEmailDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState({ type: null, loading: false });
  const [emailData, setEmailData] = useState({
    recipients: "",
    subject: "",
    body: ""
  });

  const closeMenu = () => setAnchorEl(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const headers = {
      "Accept": "application/pdf"
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    return headers;
  };

  const handleDownload = async (type) => {
    try {
      setLoading({ type, loading: true });
      
      let endpoint = "";
      let defaultFilename = "";
      
      switch(type) {
        case 'signed':
          endpoint = `/documents/${documentId}/download/signed`;
          defaultFilename = "signed_document.pdf";
          break;
        case 'original':
          endpoint = `/documents/${documentId}/download/original`;
          defaultFilename = "original_document.pdf";
          break;
        case 'certificate':
          endpoint = `/documents/${documentId}/download/certificate`;
          defaultFilename = "certificate_of_completion.pdf";
          
          // Check if document is completed before trying to download certificate
          if (documentStatus !== 'completed') {
            setSnackbar({
              open: true,
              message: `Certificate is only available for completed documents. Current status: ${documentStatus}`,
              severity: "warning"
            });
            setLoading({ type: null, loading: false });
            return;
          }
          break;
        default:
          endpoint = `/documents/${documentId}/download`;
          defaultFilename = "document.pdf";
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Download failed: ${errorText}`;
        
        // Special handling for certificate errors
        if (type === 'certificate' && response.status === 400) {
          errorMessage = "Certificate is only available for completed documents. Please ensure all recipients have signed.";
        }
        
        throw new Error(errorMessage);
      }

      // Extract filename from headers or use default
      let filename = defaultFilename;
      const contentDisposition = response.headers.get('Content-Disposition');
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Extract filename from URL if available
      const filenameFromHeader = response.headers.get('X-Filename');
      if (filenameFromHeader) {
        filename = filenameFromHeader;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnackbar({ 
        open: true, 
        message: `${filename} downloaded successfully`, 
        severity: "success" 
      });
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({ 
        open: true, 
        message: error.message || "Download failed. Please try again.", 
        severity: "error" 
      });
    } finally {
      setLoading({ type: null, loading: false });
    }
  };

  const sendEmail = async () => {
    try {
      const payload = {
        recipients: emailData.recipients
          .split(",")
          .filter(email => email.trim())
          .map(email => ({ 
            email: email.trim(), 
            name: email.trim().split('@')[0] 
          })),
        subject: emailData.subject || `Document: ${documentId}`,
        body: emailData.body || "Please find the attached document."
      };

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/documents/${documentId}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.detail || "Email failed");
      }

      setSnackbar({ 
        open: true, 
        message: result.message || "Email sent successfully", 
        severity: "success" 
      });
      setEmailDialog(false);
      // Reset form
      setEmailData({
        recipients: "",
        subject: "",
        body: ""
      });
    } catch (error) {
      console.error('Email error:', error);
      setSnackbar({ 
        open: true, 
        message: error.message || "Email failed. Please check your connection and try again.", 
        severity: "error" 
      });
    }
  };

  // Check if certificate is available
  const isCertificateAvailable = documentStatus === 'completed';

  return (
    <>
      {/* Header icon */}
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVert />
      </IconButton>

      {/* Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem 
          onClick={() => { handleDownload('signed'); closeMenu(); }}
          disabled={loading.type === 'signed'}
        >
          {loading.type === 'signed' ? (
            <CircularProgress size={20} />
          ) : (
            <DownloadIcon fontSize="small" />
          )}
          <span style={{ marginLeft: 10 }}>
            {loading.type === 'signed' ? 'Downloading...' : 'Download Signed Document'}
          </span>
        </MenuItem>

        <MenuItem 
          onClick={() => { handleDownload('original'); closeMenu(); }}
          disabled={loading.type === 'original'}
        >
          {loading.type === 'original' ? (
            <CircularProgress size={20} />
          ) : (
            <DescriptionOutlined fontSize="small" />
          )}
          <span style={{ marginLeft: 10 }}>
            {loading.type === 'original' ? 'Downloading...' : 'Download Original Document'}
          </span>
        </MenuItem>

        <Tooltip 
          title={!isCertificateAvailable ? "Certificate only available for completed documents" : ""}
          placement="left"
        >
          <span>
            <MenuItem 
              onClick={() => { handleDownload('certificate'); closeMenu(); }}
              disabled={loading.type === 'certificate' || !isCertificateAvailable}
              sx={{
                opacity: isCertificateAvailable ? 1 : 0.6,
                cursor: isCertificateAvailable ? 'pointer' : 'not-allowed'
              }}
            >
              {loading.type === 'certificate' ? (
                <CircularProgress size={20} />
              ) : !isCertificateAvailable ? (
                <ErrorIcon fontSize="small" color="disabled" />
              ) : (
                <VerifiedUserOutlined fontSize="small" />
              )}
              <span style={{ marginLeft: 10 }}>
                {loading.type === 'certificate' ? 'Downloading...' : 'Download Certificate'}
              </span>
              {!isCertificateAvailable && (
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#666' }}>
                  (Not available)
                </span>
              )}
            </MenuItem>
          </span>
        </Tooltip>

        <MenuItem onClick={() => { setEmailDialog(true); closeMenu(); }}>
          <MailOutline fontSize="small" />
          <span style={{ marginLeft: 10 }}>Email Document</span>
        </MenuItem>
      </Menu>

      {/* Email dialog */}
      <Dialog open={emailDialog} onClose={() => setEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Email Document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Recipients (comma separated)"
              value={emailData.recipients}
              onChange={(e) => setEmailData({ ...emailData, recipients: e.target.value })}
              placeholder="john@example.com, jane@example.com"
              fullWidth
              required
              helperText="Separate multiple emails with commas"
            />
            <TextField
              label="Subject"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              placeholder="Document for your review"
              fullWidth
            />
            <TextField
              label="Message"
              multiline
              rows={4}
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              placeholder="Please review and sign the attached document."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={sendEmail} 
            disabled={!emailData.recipients.trim()}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

// Default props
SummaryHeaderActions.defaultProps = {
  documentStatus: 'draft'
};

export default SummaryHeaderActions;