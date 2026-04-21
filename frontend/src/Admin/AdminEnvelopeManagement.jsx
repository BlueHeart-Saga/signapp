import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, TextField, IconButton, Stack, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Tooltip, CircularProgress, Alert, InputAdornment, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Fade
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Autorenew as RegenerateIcon,
    Description as DocumentIcon,
    Fingerprint as IdIcon,
    Mail as EmailIcon,
    CheckCircle as CompletedIcon,
    Schedule as PendingIcon,
    ContentCopy as CopyIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { downloadDocument, viewDocumentUrl } from '../services/DocumentAPI';
import DocumentViewerModal from '../components/DocumentViewerModal';
import {
    Visibility as ViewIcon,
    GetApp as DownloadIcon
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

export default function AdminEnvelopeManagement() {
    const { token } = useAuth();
    const [envelopes, setEnvelopes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchByValue, setSearchByValue] = useState('');

    // Dialog state
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [customId, setCustomId] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Viewer state
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewUrl, setViewUrl] = useState('');

    const fetchEnvelopes = useCallback(async (searchQuery = '') => {
        setLoading(true);
        try {
            const resp = await fetch(`${API_BASE_URL}/envelope/list?page=${page}&limit=15&search=${searchQuery}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) throw new Error('Failed to fetch envelopes');
            const data = await resp.json();
            setEnvelopes(data.envelopes || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error(err);
            toast.error('Error loading envelope data');
        } finally {
            setLoading(false);
        }
    }, [token, page]);

    useEffect(() => {
        fetchEnvelopes(searchTerm);
    }, [fetchEnvelopes, page, searchTerm]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            fetchEnvelopes(searchByValue);
            setSearchTerm(searchByValue);
            setPage(1);
        }
    };

    const handleRegenerate = async (docId) => {
        setIsRegenerating(true);
        try {
            const resp = await fetch(`${API_BASE_URL}/envelope/regenerate/${docId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                toast.success('Envelope ID randomized successfully');
                fetchEnvelopes(searchTerm);
            } else {
                throw new Error('Regeneration failed');
            }
        } catch (err) {
            toast.error('Failed to regenerate ID');
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleUpdateCustom = async () => {
        if (!customId.trim()) return;
        try {
            const resp = await fetch(`${API_BASE_URL}/envelope/custom/${selectedDoc.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ custom_id: customId })
            });
            if (resp.ok) {
                toast.success('Custom Identity applied');
                setIsEditDialogOpen(false);
                fetchEnvelopes(searchTerm);
            } else {
                const error = await resp.json();
                toast.error(error.detail || 'Failed to apply custom ID');
            }
        } catch (err) {
            toast.error('Operation failed');
        }
    };

    const formatDate = (doc) => {
        const dateStr = doc.created_at || doc.uploaded_at;
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'N/A';
            return format(date, 'PPp');
        } catch (e) {
            return 'N/A';
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('ID copied to clipboard');
    };

    return (
        <Box sx={{ p: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a', mb: 1 }}>
                        Envelope Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage document identities and randomized tracking IDs
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchEnvelopes(searchTerm)}
                    sx={{ bgcolor: '#0f766e', '&:hover': { bgcolor: '#0f766e' } }}
                >
                    Refresh List
                </Button>
            </Stack>

            <Card sx={{ mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 3 }}>
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            placeholder="Search by Safesign ID, Filename or Email..."
                            value={searchByValue}
                            onChange={(e) => setSearchByValue(e.target.value)}
                            onKeyDown={handleSearch}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#0f766e' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ maxWidth: 500 }}
                        />
                        <Button
                            variant="outlined"
                            onClick={() => fetchEnvelopes(searchByValue)}
                            sx={{ color: '#0f766e', borderColor: '#0f766e' }}
                        >
                            Search
                        </Button>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Document Info</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Safesign Identity (Envelope ID)</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Owner</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                            <CircularProgress color="inherit" size={30} sx={{ color: '#0f766e' }} />
                                        </TableCell>
                                    </TableRow>
                                ) : envelopes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                            <Typography color="text.secondary">No envelopes found matching criteria.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    envelopes.map((doc) => (
                                        <TableRow key={doc.id} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <DocumentIcon sx={{ color: '#64748b' }} />
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.filename}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Created {formatDate(doc)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Chip
                                                        icon={<IdIcon sx={{ fontSize: '14px !important' }} />}
                                                        label={doc.envelope_id || 'DEFAULT_MODE'}
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => copyToClipboard(doc.envelope_id)}
                                                        sx={{
                                                            fontFamily: 'monospace',
                                                            cursor: 'pointer',
                                                            bgcolor: doc.envelope_id_custom ? '#f0fdf4' : 'transparent',
                                                            borderColor: doc.envelope_id_custom ? '#86efac' : '#e2e8f0'
                                                        }}
                                                    />
                                                    <Tooltip title="Copy ID">
                                                        <IconButton size="small" onClick={() => copyToClipboard(doc.envelope_id)}>
                                                            <CopyIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={doc.status.toUpperCase()}
                                                    size="small"
                                                    color={doc.status === 'completed' ? 'success' : 'warning'}
                                                    sx={{ fontWeight: 600, fontSize: '10px' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <EmailIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                                    <Typography variant="body2">{doc.owner_email}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <Tooltip title="View Document">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setViewUrl(viewDocumentUrl(doc.id));
                                                                setSelectedDoc(doc);
                                                                setViewerOpen(true);
                                                            }}
                                                            sx={{ color: '#0f766e' }}
                                                        >
                                                            <ViewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Download Signed">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => downloadDocument(doc.id, doc.filename, 'signed')}
                                                            sx={{ color: '#0f766e' }}
                                                        >
                                                            <DownloadIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Randomize ID">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleRegenerate(doc.id)}
                                                            disabled={isRegenerating}
                                                            sx={{ color: '#0f766e' }}
                                                        >
                                                            <RegenerateIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Custom Identity">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedDoc(doc);
                                                                setCustomId(doc.envelope_id);
                                                                setIsEditDialogOpen(true);
                                                            }}
                                                            sx={{ color: '#1e293b' }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                        <Stack direction="row" spacing={1}>
                            <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                            <Typography sx={{ py: 1, px: 2 }}>{page}</Typography>
                            <Button disabled={envelopes.length < 15} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Customize Envelope Identity</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Specify a manual tracking identifier for document: <strong>{selectedDoc?.filename}</strong>
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Custom Safesign ID"
                        value={customId}
                        onChange={(e) => setCustomId(e.target.value)}
                        sx={{ mt: 1 }}
                        placeholder="e.g. SPECIAL-ID-2026"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleUpdateCustom}
                        sx={{ bgcolor: '#0f766e', '&:hover': { bgcolor: '#0f766e' } }}
                    >
                        Apply Changes
                    </Button>
                </DialogActions>
            </Dialog>

            <DocumentViewerModal
                open={viewerOpen}
                onClose={() => setViewerOpen(false)}
                documentId={selectedDoc?.id}
                documentName={selectedDoc?.filename}
                url={viewUrl}
                title={`Reviewing: ${selectedDoc?.filename}`}
            />
        </Box>
    );
}
