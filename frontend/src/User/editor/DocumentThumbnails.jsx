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
import {
    Refresh as RefreshIcon,
    ChevronRight as ChevronRightIcon,
    CheckCircle as CheckCircleIcon,
    Help as HelpIcon
} from '@mui/icons-material';

const DocumentThumbnails = ({
    documentId,
    numPages,
    currentPage,
    onPageChange,
    fields = []
}) => {
    const [thumbnails, setThumbnails] = useState({});
    const [loading, setLoading] = useState(false);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

    const fetchThumbnails = async () => {
        if (!documentId) return;

        setLoading(true);
        try {
            const newThumbnails = {};
            // Fetch concurrently to speed up
            const promises = Array.from({ length: numPages }, (_, i) => {
                const pageNum = i + 1;
                const url = `${API_BASE_URL}/documents/${documentId}/pages/${pageNum}/thumbnail?width=150&height=200&token=${localStorage.getItem('token')}`;
                return { pageNum, url };
            });

            // We don't need to actually 'fetch' them here if we use <img> tags directly,
            // but let's pre-verify or just set the URLs
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

    // Calculate fields per page for visual indicator
    const getPageFieldStats = (pageNum) => {
        const pageFields = fields.filter(f => f.page === (pageNum - 1));
        return {
            count: pageFields.length,
            hasFields: pageFields.length > 0
        };
    };

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
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="#0d9488">
                        PAGES
                    </Typography>
                    <Tooltip title="Refresh Thumbnails">
                        <IconButton size="small" onClick={fetchThumbnails} disabled={loading}>
                            <RefreshIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {numPages} Total Pages
                </Typography>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Array.from({ length: numPages }, (_, i) => {
                        const pageNum = i + 1;
                        const isActive = currentPage === i;
                        const pageFields = fields.filter(f => f.page === i);
                        const hasFields = pageFields.length > 0;
                        const thumbUrl = thumbnails[pageNum];

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
                                        width: 140,
                                        height: 190,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        border: isActive ? '3px solid #0d9488' : '1px solid #e5e7eb',
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
                                        <CircularProgress size={20} thickness={3} sx={{ color: '#0d9488' }} />
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
                                            // Mapping coordinates from 794x1123 to 140x190
                                            const left = (f.x / 794) * 100;
                                            const top = (f.y / 1123) * 100;
                                            const width = (f.width / 794) * 100;
                                            const height = (f.height / 1123) * 100;

                                            return (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        position: 'absolute',
                                                        left: `${left}%`,
                                                        top: `${top}%`,
                                                        width: `${Math.max(4, width)}%`,
                                                        height: `${Math.max(4, height)}%`,
                                                        backgroundColor: 'rgba(13, 148, 136, 0.6)',
                                                        border: '1px solid rgba(13, 148, 136, 0.8)',
                                                        borderRadius: '1px',
                                                        animation: 'fadeIn 0.5s ease forwards'
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
                                            bgcolor: isActive ? '#0d9488' : 'rgba(0,0,0,0.6)',
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
                                                bgcolor: '#0d9488',
                                                color: '#fff',
                                                px: 0.8,
                                                py: 0.2,
                                                borderRadius: '4px',
                                                fontSize: '9px',
                                                fontWeight: 800,
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
            </Box>
        </Paper>
    );
};

export default DocumentThumbnails;
