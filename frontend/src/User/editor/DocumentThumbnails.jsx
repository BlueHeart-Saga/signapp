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
                        const stats = getPageFieldStats(pageNum);
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
                                    gap: 0.5,
                                    transition: 'transform 0.2s ease',
                                    '&:hover': {
                                        transform: 'scale(1.02)'
                                    }
                                }}
                            >
                                <Paper
                                    elevation={isActive ? 4 : 1}
                                    sx={{
                                        width: 130,
                                        height: 180,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        border: isActive ? '2px solid #0d9488' : '1px solid #e0e0e0',
                                        transition: 'all 0.2s ease',
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: '#fff'
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
                                                objectFit: 'contain'
                                            }}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <CircularProgress size={24} thickness={2} />
                                    )}

                                    {/* Indicators overlay */}
                                    {stats.hasFields && (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            display: 'flex',
                                            gap: 0.5
                                        }}>
                                            <Tooltip title={`${stats.count} fields on this page`}>
                                                <Box sx={{
                                                    bgcolor: '#0d9488',
                                                    color: '#fff',
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    boxShadow: 1
                                                }}>
                                                    {stats.count}
                                                </Box>
                                            </Tooltip>
                                        </Box>
                                    )}
                                </Paper>

                                <Typography
                                    variant="caption"
                                    fontWeight={isActive ? 700 : 500}
                                    color={isActive ? "#0d9488" : "text.secondary"}
                                >
                                    Page {pageNum}
                                </Typography>
                            </Box>
                        );
                    })}
                </List>
            </Box>
        </Paper>
    );
};

export default DocumentThumbnails;
