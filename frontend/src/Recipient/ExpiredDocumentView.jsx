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
    History as ExpiredIcon,
    Description as DocumentIcon,
    Warning as WarningIcon,
    Email as EmailIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    Info as InfoIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const ExpiredDocumentView = () => {
    const { recipientId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [documentInfo, setDocumentInfo] = useState(null);
    const [recipientInfo, setRecipientInfo] = useState(null);
    const [expiryDetails, setExpiryDetails] = useState(null);

    useEffect(() => {
        const fetchExpiredDocument = async () => {
            try {
                setLoading(true);
                setError('');

                // Get document and recipient info
                const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch document information');
                }

                const data = await response.json();

                // Check if document is expired
                const isExpired = data.document?.status === 'expired' || data.signing_info?.document_status === 'expired' || data.signing_info?.is_expired;

                if (!isExpired) {
                    // If not expired, redirect to verification page
                    window.location.href = `/verify/${recipientId}`;
                    return;
                }

                setDocumentInfo(data.document);
                setRecipientInfo(data.recipient);

                // Get expiry details
                setExpiryDetails({
                    expired_at: data.document?.expired_at || data.signing_info?.expired_at,
                    expiry_date: data.document?.expiry_date || data.signing_info?.expiry_date,
                });

            } catch (err) {
                console.error('Error fetching expired document:', err);
                setError(`Failed to load expired document: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (recipientId) {
            fetchExpiredDocument();
        }
    }, [recipientId]);

    const handleBackToHome = () => {
        window.location.href = '/';
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#d32f2f' }} />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 8 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
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
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3, borderTop: '6px solid #d32f2f' }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: '50%',
                        bgcolor: '#fee2e2',
                        mb: 2
                    }}>
                        <AccessTimeIcon sx={{ fontSize: 48, color: '#d32f2f' }} />
                    </Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#b91c1c' }}>
                        Link Expired
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                        The signing period for this document has ended. To ensure document security and compliance, expired links are automatically deactivated.
                    </Typography>
                </Box>

                {/* Document Info Card */}
                <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: '#fcfcfc' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DocumentIcon sx={{ mr: 2, color: '#64748b' }} />
                        <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                            {documentInfo?.filename || 'Document'}
                        </Typography>
                        <Chip
                            label="EXPIRED"
                            color="error"
                            size="small"
                            sx={{ fontWeight: 700, borderRadius: 1 }}
                        />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        {/* Document Details */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
                                DOCUMENT DETAILS
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Document ID:</strong> {documentInfo?.id}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Deadline:</strong> {expiryDetails?.expiry_date ? new Date(expiryDetails.expiry_date).toLocaleDateString() : 'Set by owner'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Status:</strong> Expired
                            </Typography>
                        </Box>

                        {/* Recipient Details */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
                                RECIPIENT INFORMATION
                            </Typography>
                            <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ fontSize: 14, mr: 1, color: '#64748b' }} />
                                <strong>Name:</strong> {recipientInfo?.name}
                            </Typography>
                            <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <EmailIcon sx={{ fontSize: 14, mr: 1, color: '#64748b' }} />
                                <strong>Email:</strong> {recipientInfo?.email}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Role:</strong> {recipientInfo?.role || 'Signer'}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Important Notice */}
                <Alert
                    severity="error"
                    sx={{ mb: 4, borderRadius: 2, '& .MuiAlert-icon': { color: '#d32f2f' } }}
                    icon={<WarningIcon />}
                >
                    <Typography variant="body2" fontWeight={500}>
                        Access to this document has been restricted because the deadline passed.
                        The sender must extend the expiration date or send a new document to proceed.
                    </Typography>
                </Alert>

                {/* Next Steps */}
                <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: '#f8fafc' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                        <InfoIcon sx={{ mr: 1, fontSize: 18 }} />
                        HOW TO RESOLVE THIS?
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                        <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#d32f2f' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={<Typography variant="body2" fontWeight={500}>Contact the Sender</Typography>}
                                secondary="Reach out to the person who sent you this document and request a new signature link."
                            />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#d32f2f' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={<Typography variant="body2" fontWeight={500}>Check Your Email</Typography>}
                                secondary="The sender may have already sent a reminder or an updated link to your inbox."
                            />
                        </ListItem>
                    </List>
                </Paper>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => window.location.reload()}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: '#d32f2f',
                            '&:hover': { bgcolor: '#b91c1c' }
                        }}
                    >
                        Try Refreshing Page
                    </Button>

                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleBackToHome}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            color: '#475569',
                            borderColor: '#e2e8f0',
                            fontWeight: 600,
                            '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f1f5f9' }
                        }}
                    >
                        Return to Home
                    </Button>
                </Box>

                {/* Footer info */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Securely powered by Safesign • Document ID: {documentInfo?.id?.substring(0, 8)}...
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default ExpiredDocumentView;
