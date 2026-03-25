import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Button,
  Divider,
  Link,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Description as DocumentIcon,
  Block as BlockedIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const VoidedDocumentView = () => {
  const { recipientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [voidDetails, setVoidDetails] = useState(null);

  useEffect(() => {
    const fetchVoidedDocument = async () => {
      try {
        setLoading(true);
        setError('');
        
        // First, get voided document status
        const statusResponse = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/voided-status`);
        
        if (!statusResponse.ok) {
          throw new Error('Failed to fetch voided document status');
        }
        
        const statusData = await statusResponse.json();
        
        if (!statusData.is_voided) {
          setError('This document is not voided.');
          setLoading(false);
          return;
        }
        
        setDocumentInfo(statusData.document);
        setRecipientInfo(statusData.recipient);
        
        // Extract voiding details
        setVoidDetails({
          voided_at: statusData.document.voided_at,
          voided_by: statusData.document.voided_by,
          void_reason: statusData.document.void_reason,
        });
        
      } catch (err) {
        console.error('Error fetching voided document:', err);
        setError(`Failed to load voided document: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (recipientId) {
      fetchVoidedDocument();
    }
  }, [recipientId]);

  const handleDownloadVoided = () => {
  // Use the dedicated download endpoint
  const downloadUrl = `${API_BASE_URL}/signing/recipient/${recipientId}/download/voided`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `VOIDED_${documentInfo?.filename || 'document'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Add a view inline handler:
const handleViewVoidedDocument = () => {
  // Open voided document in new tab for viewing
  window.open(`${API_BASE_URL}/signing/recipient/${recipientId}/view-voided`, '_blank');
};

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Error Loading Document
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button variant="outlined" onClick={handleBackToHome}>
            Back to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <BlockedIcon sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
          <Typography variant="h4" fontWeight={600} gutterBottom color="#f44336">
            Document Voided
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This document has been voided and is no longer valid for signing.
          </Typography>
        </Box>

        {/* Document Info Card */}
        <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DocumentIcon color="error" sx={{ mr: 2 }} />
            <Typography variant="h6" fontWeight={600}>
              {documentInfo?.filename || 'Document'}
            </Typography>
            <Chip 
              label="VOIDED" 
              color="error" 
              size="small" 
              sx={{ ml: 2, fontWeight: 600 }}
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Document Details */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                DOCUMENT DETAILS
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Document ID:</strong> {documentInfo?.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong> Voided
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Original Size:</strong> {documentInfo?.size ? `${(documentInfo.size / 1024).toFixed(2)} KB` : 'Unknown'}
              </Typography>
            </Box>
            
            {/* Recipient Details */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                YOUR INFORMATION
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ fontSize: 14, mr: 1 }} />
                <strong>Name:</strong> {recipientInfo?.name}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ fontSize: 14, mr: 1 }} />
                <strong>Email:</strong> {recipientInfo?.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Role:</strong> {recipientInfo?.role || 'Signer'}
              </Typography>
            </Box>
          </Box>
          
          {/* Voiding Details */}
          {voidDetails && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  VOIDING INFORMATION
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Voided On:</strong> {new Date(voidDetails.voided_at).toLocaleString()}
                </Typography>
                {voidDetails.voided_by && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Voided By:</strong> {voidDetails.voided_by}
                  </Typography>
                )}
                {voidDetails.void_reason && (
                  <Typography variant="body2">
                    <strong>Reason:</strong> {voidDetails.void_reason}
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Paper>

        {/* Important Notice */}
        <Alert 
          severity="warning" 
          sx={{ mb: 4, borderRadius: 2 }}
          icon={<BlockedIcon />}
        >
          <Typography variant="body2">
            <strong>Important:</strong> This document has been legally voided and should not be used for any official purposes. 
            Any signatures or approvals made on this document are no longer valid.
          </Typography>
        </Alert>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            fullWidth
            startIcon={<DocumentIcon />}
            onClick={handleViewVoidedDocument}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            View Voided Document
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={<DownloadIcon />}
            onClick={handleDownloadVoided}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Download Voided Copy
          </Button>
          
          <Button
            variant="outlined"
            fullWidth
            onClick={handleBackToHome}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Back to Home
          </Button>
        </Box>

        {/* Footer Note */}
        <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Note:</strong> You can view the voided document with "VOIDED" watermark across all pages. 
            If you have questions about why this document was voided, please contact the document sender.
          </Typography>
        </Box>
      </Paper>

      {/* Support Section */}
      <Paper variant="outlined" sx={{ p: 3, mt: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          NEED HELP?
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          If you need assistance or have questions about this voided document:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li><Typography variant="body2">Contact the document sender at their provided email address</Typography></li>
          <li><Typography variant="body2">Check your email for any notifications about this document</Typography></li>
          <li><Typography variant="body2">Request a new, valid document if needed</Typography></li>
        </Box>
        <Typography variant="caption" color="text.secondary">
          This is an automated message. For legal inquiries, consult with the appropriate authorities.
        </Typography>
      </Paper>
    </Container>
  );
};

export default VoidedDocumentView;