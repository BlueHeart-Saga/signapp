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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Description as DocumentIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const DeclinedDocumentView = () => {
  const { recipientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [declineDetails, setDeclineDetails] = useState(null);
  const [allRecipients, setAllRecipients] = useState([]);

  useEffect(() => {
    const fetchDeclinedDocument = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get document and recipient info
        const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch document information');
        }
        
        const data = await response.json();
        
        // Check if document is declined
        if (data.document?.status !== 'declined' && data.signing_info?.document_status !== 'declined') {
          setError('This document is not declined.');
          setLoading(false);
          return;
        }
        
        setDocumentInfo(data.document);
        setRecipientInfo(data.recipient);
        
        // Get decline details
        if (data.recipient?.declined_at) {
          setDeclineDetails({
            declined_at: data.recipient.declined_at,
            declined_by: data.recipient.name,
            decline_reason: data.recipient.decline_reason || 'No reason provided',
            decline_ip: data.recipient.decline_ip,
            is_recipient_declined: true
          });
        } else {
          // Document declined by someone else
          setDeclineDetails({
            is_document_declined: true,
            document_status: data.document?.status
          });
        }
        
        // Try to get all recipients to see who declined
        try {
          const recipientsResponse = await fetch(
            `${API_BASE_URL}/documents/${data.document?.id}/recipients`
          );
          if (recipientsResponse.ok) {
            const recipientsData = await recipientsResponse.json();
            setAllRecipients(recipientsData);
          }
        } catch (err) {
          console.log('Could not fetch all recipients:', err);
        }
        
      } catch (err) {
        console.error('Error fetching declined document:', err);
        setError(`Failed to load declined document: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (recipientId) {
      fetchDeclinedDocument();
    }
  }, [recipientId]);

  const handleViewOriginalDocument = () => {
    // View original document (without signatures)
    window.open(`${API_BASE_URL}/signing/recipient/${recipientId}/download/original`, '_blank');
  };

  const handleDownloadOriginal = () => {
    // Download original document
    const downloadUrl = `${API_BASE_URL}/signing/recipient/${recipientId}/download/original`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `ORIGINAL_${documentInfo?.filename || 'document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const getDeclinedRecipients = () => {
    return allRecipients.filter(r => r.status === 'declined');
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
          <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
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
          <CancelIcon sx={{ fontSize: 64, color: '#ed6c02', mb: 2 }} />
          <Typography variant="h4" fontWeight={600} gutterBottom color="#ed6c02">
            Document Declined
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This document has been declined and the signing process has been terminated.
          </Typography>
        </Box>

        {/* Document Info Card */}
        <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DocumentIcon color="warning" sx={{ mr: 2 }} />
            <Typography variant="h6" fontWeight={600}>
              {documentInfo?.filename || 'Document'}
            </Typography>
            <Chip 
              label="DECLINED" 
              color="warning" 
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
                <strong>Status:</strong> Declined
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
              <Typography variant="body2" gutterBottom>
                <strong>Your Status:</strong> <Chip 
                  label={recipientInfo?.status === 'declined' ? 'You Declined' : 'Pending'} 
                  size="small" 
                  color={recipientInfo?.status === 'declined' ? 'error' : 'default'}
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
          </Box>
          
          {/* Decline Details */}
          {declineDetails && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  DECLINE INFORMATION
                </Typography>
                
                {declineDetails.is_recipient_declined ? (
                  <>
                    <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <ScheduleIcon sx={{ fontSize: 14, mr: 1 }} />
                      <strong>Declined On:</strong> {new Date(declineDetails.declined_at).toLocaleString()}
                    </Typography>
                    {declineDetails.declined_by && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Declined By:</strong> {declineDetails.declined_by}
                      </Typography>
                    )}
                    <Typography variant="body2" gutterBottom>
                      <strong>Reason:</strong> {declineDetails.decline_reason}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2">
                    This document was declined by another signer. The signing process cannot continue.
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Paper>

        {/* Declined Recipients List */}
        {getDeclinedRecipients().length > 0 && (
          <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              DECLINED SIGNERS
            </Typography>
            <List dense>
              {getDeclinedRecipients().map((recipient, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CancelIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={recipient.name}
                    secondary={
                      <>
                        {recipient.email}
                        {recipient.decline_reason && (
                          <> • Reason: {recipient.decline_reason}</>
                        )}
                        {recipient.declined_at && (
                          <> • {new Date(recipient.declined_at).toLocaleDateString()}</>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Important Notice */}
        <Alert 
          severity="warning" 
          sx={{ mb: 4, borderRadius: 2 }}
          icon={<WarningIcon />}
        >
          <Typography variant="body2">
            <strong>Important:</strong> This document has been declined and the signing process is terminated. 
            No further signatures or approvals can be added to this document.
          </Typography>
        </Alert>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Button
            variant="contained"
            color="warning"
            fullWidth
            startIcon={<DocumentIcon />}
            onClick={handleViewOriginalDocument}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            View Original Document
          </Button>
          
          <Button
            variant="outlined"
            color="warning"
            fullWidth
            startIcon={<DownloadIcon />}
            onClick={handleDownloadOriginal}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Download Original
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

        {/* Next Steps */}
        <Paper variant="outlined" sx={{ p: 3, mt: 4, borderRadius: 2, bgcolor: '#fff8e1' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1 }} />
            WHAT HAPPENS NEXT?
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Document Status" 
                secondary="This document is marked as 'declined' and cannot be signed."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Notification" 
                secondary="The document sender has been notified about the decline."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Alternative Options" 
                secondary="If you need to sign this document, contact the sender for a new version."
              />
            </ListItem>
          </List>
        </Paper>
      </Paper>

      {/* Contact Section */}
      <Paper variant="outlined" sx={{ p: 3, mt: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          HAVE QUESTIONS?
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          If you have questions about why this document was declined:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li><Typography variant="body2">Contact the document sender directly</Typography></li>
          <li><Typography variant="body2">Review the decline reason provided above</Typography></li>
          <li><Typography variant="body2">Request clarification if the reason is unclear</Typography></li>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Note: Once a document is declined, it cannot be reactivated. A new document must be sent.
        </Typography>
      </Paper>
    </Container>
  );
};

export default DeclinedDocumentView;
