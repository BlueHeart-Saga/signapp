import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    CircularProgress,
    IconButton,
    Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    Refresh as RefreshIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import { FIELD_TYPES, getRecipientColor } from '../../config/fieldConfig';

const DocumentThumbnails = ({
    documentId,
    numPages,
    currentPage,
    onPageChange,
    fields = [],
    recipients = [],
    canvasHeight = 1123,
    files = []
}) => {
    const [thumbnails, setThumbnails] = useState({});
    const [loading, setLoading] = useState(false);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';
    const token = localStorage.getItem('token') || '';

    const fetchThumbnails = async () => {
        if (!documentId) return;

        setLoading(true);
        try {
            const newThumbnails = {};
            const timestamp = Date.now();
            const promises = Array.from({ length: numPages }, (_, i) => {
                const pageNum = i + 1;
                const url = `${API_BASE_URL}/documents/${documentId}/pages/${pageNum}/thumbnail?width=150&height=200&token=${encodeURIComponent(token)}&v=${timestamp}`;
                return { pageNum, url };
            });

            promises.forEach(item => {
                newThumbnails[item.pageNum] = item.url;
            });

            setThumbnails(newThumbnails);
        } catch (error) {
            console.error('Error loading thumbnails:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThumbnails();
    }, [documentId, numPages]);

    return (
        <Paper
            elevation={1}
            sx={{
                width: 180,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#fcfcfc',
                borderLeft: '1px solid #e0e0e0',
                borderRadius: 0,
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <Box sx={{ p: 1.5, borderBottom: '1px solid #eee', bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <DescriptionIcon sx={{ fontSize: 16, color: '#0f766e' }} />
                        <Typography variant="subtitle2" fontWeight={700} color="#0f766e" sx={{ fontSize: '0.8rem' }}>
                            PAGES ({numPages})
                        </Typography>
                    </Box>
                    <Tooltip title="Refresh Thumbnails">
                        <IconButton size="small" onClick={fetchThumbnails} disabled={loading}>
                            <RefreshIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Content List */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
                {loading && Object.keys(thumbnails).length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} sx={{ color: '#0f766e' }} />
                    </Box>
                ) : (
                    <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {Array.from({ length: numPages }, (_, i) => {
                            const pageNum = i + 1;
                            const isActive = currentPage === i;
                            const pageFields = fields.filter(f => f.page === i);
                            const hasFields = pageFields.length > 0;
                            const thumbUrl = thumbnails[pageNum];

                            const thumbWidth = 140;
                            const thumbHeight = Math.round(thumbWidth * ((canvasHeight || 1123) / 794));

                            return (
                                <Box
                                    key={pageNum}
                                    onClick={() => onPageChange(i)}
                                    sx={{
                                        cursor: 'pointer',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                        <Paper
                                            elevation={isActive ? 6 : 1}
                                            sx={{
                                                width: thumbWidth,
                                                height: thumbHeight,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                border: isActive ? '3px solid #0f766e' : '1px solid #e5e7eb',
                                                transition: 'all 0.3s ease',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: '#fff',
                                                boxShadow: isActive ? '0 10px 15px -3px rgba(13, 148, 136, 0.2)' : 'none'
                                            }}
                                        >
                                            {thumbUrl ? (
                                                <Box
                                                    component="img"
                                                    src={thumbUrl}
                                                    alt={`Page ${pageNum}`}
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <CircularProgress size={20} thickness={3} sx={{ color: '#0f766e' }} />
                                            )}

                                            {/* Mini-Map: Fields position tracking */}
                                            <Box sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                pointerEvents: 'none',
                                                zIndex: 2
                                            }}>
                                                {pageFields.map((f, idx) => {
                                                    const left = (f.x / 794) * 100;
                                                    const top = (f.y / canvasHeight) * 100;
                                                    const width = (f.width / 794) * 100;
                                                    const height = (f.height / canvasHeight) * 100;

                                                    const assignedRecipient = f.assignedRecipient ||
                                                        (f.recipient_id ? recipients.find(r => r.id === f.recipient_id) : null);

                                                    const fieldType = FIELD_TYPES[f.type] || FIELD_TYPES.textbox;
                                                    const color = assignedRecipient ? getRecipientColor(assignedRecipient) : fieldType.color;

                                                    return (
                                                        <Box
                                                            key={idx}
                                                            sx={{
                                                                position: 'absolute',
                                                                left: `${left}%`,
                                                                top: `${top}%`,
                                                                width: `${Math.max(4, width)}%`,
                                                                height: `${Math.max(4, height)}%`,
                                                                backgroundColor: alpha(color, 0.15),
                                                                border: `1.2px solid ${color}`,
                                                                borderRadius: '2px',
                                                                zIndex: 3
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </Box>

                                            {/* Floating Page Number & Count */}
                                            <Box sx={{
                                                position: 'absolute',
                                                bottom: 8,
                                                left: 8,
                                                right: 8,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                pointerEvents: 'none'
                                            }}>
                                                <Box sx={{
                                                    bgcolor: isActive ? '#0f766e' : 'rgba(0,0,0,0.6)',
                                                    color: '#fff',
                                                    px: 1,
                                                    py: 0.2,
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    backdropFilter: 'blur(4px)'
                                                }}>
                                                    {pageNum}
                                                </Box>

                                                {hasFields && (
                                                    <Box sx={{
                                                        bgcolor: '#0f766e',
                                                        color: '#fff',
                                                        px: 0.8,
                                                        py: 0.2,
                                                        borderRadius: '4px',
                                                        fontSize: '9px',
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.2
                                                    }}>
                                                        {pageFields.length} <span style={{ opacity: 0.8, fontSize: '8px' }}>F</span>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Paper>
                                    </Box>
                            );
                        })}
                    </List>
                )}
            </Box>
        </Paper>
    );
};

export default DocumentThumbnails;
