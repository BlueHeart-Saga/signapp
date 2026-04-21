import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Divider,
  Paper,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Error as ErrorIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

const PreviewDialog = ({ open, onClose, documentId, documentName }) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  
  const scrollContainerRef = useRef(null);
  const pageRefs = useRef({});

  useEffect(() => {
    if (open && documentId) {
      loadPreview();
    }
  }, [open, documentId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/documents/${documentId}/owner-preview?token=${token}&t=${Date.now()}`;
      setPdfUrl(url);
      
    } catch (err) {
      console.error('Error loading preview:', err);
      setError('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const handlePdfLoadError = (error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    setLoading(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/download?token=${token}`,
        { method: 'GET' }
      );
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download document');
    }
  };

  // Handle scroll to detect current page
  const handleScroll = () => {
    if (!scrollContainerRef.current || numPages === 0) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Find which page is most visible in the viewport
    let maxVisiblePage = 1;
    let maxVisibleArea = 0;

    Object.keys(pageRefs.current).forEach((pageNum) => {
      const pageElement = pageRefs.current[pageNum];
      if (pageElement) {
        const rect = pageElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const visibleTop = Math.max(rect.top, containerRect.top);
        const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        
        if (visibleHeight > maxVisibleArea) {
          maxVisibleArea = visibleHeight;
          maxVisiblePage = parseInt(pageNum);
        }
      }
    });

    setCurrentPage(maxVisiblePage);
  };

  // Scroll to a specific page
  const scrollToPage = (pageNum) => {
    const pageElement = pageRefs.current[pageNum];
    if (pageElement && scrollContainerRef.current) {
      pageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Add scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && numPages > 0) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [numPages]);

  // Update current page when pages change
  useEffect(() => {
    if (numPages > 0) {
      setCurrentPage(1);
    }
  }, [numPages]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
          width: '90vw',
          maxWidth: '90vw',
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      {/* Header with #0f766e theme */}
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: '#0f766e',
        color: 'white',
        py: 1.5,
        px: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PdfIcon sx={{ fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>Document Preview</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '70vh' 
          }}>
            <CircularProgress sx={{ color: '#0f766e' }} />
          </Box>
        ) : error ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '70vh',
            textAlign: 'center',
            px: 3
          }}>
            <ErrorIcon sx={{ fontSize: 60, color: '#ef4444', mb: 2 }} />
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={loadPreview}
              sx={{ 
                mt: 2,
                borderColor: '#0f766e',
                color: '#0f766e',
                '&:hover': {
                  borderColor: '#0f766e',
                  bgcolor: 'rgba(13, 148, 136, 0.04)'
                }
              }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <>
            {/* Top Toolbar - Zoom Controls */}
            <Paper 
              elevation={2} 
              sx={{ 
                position: 'sticky',
                top: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                p: 1,
                px: 2,
                bgcolor: 'rgba(255,255,255,0.95)',
                borderBottom: '1px solid',
                borderColor: '#e0e0e0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Zoom Out">
                  <IconButton 
                    size="small" 
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    sx={{ 
                      color: '#0f766e',
                      '&:hover': { bgcolor: 'rgba(13, 148, 136, 0.08)' }
                    }}
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center', color: '#374151' }}>
                  {Math.round(zoom * 100)}%
                </Typography>
                
                <Tooltip title="Zoom In">
                  <IconButton 
                    size="small" 
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    sx={{ 
                      color: '#0f766e',
                      '&:hover': { bgcolor: 'rgba(13, 148, 136, 0.08)' }
                    }}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Page Navigation Info - Non-clickable, just showing current page */}
              {numPages > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Page {currentPage} of {numPages}
                  </Typography>
                </Box>
              )}

              <Box sx={{ width: 100 }} /> {/* Spacer for balance */}
            </Paper>

            {/* PDF Viewer - Scrollable with all pages */}
            <Box 
              ref={scrollContainerRef}
              sx={{ 
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 3,
                bgcolor: '#f5f5f5'
              }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={handlePdfLoadSuccess}
                onLoadError={handlePdfLoadError}
                loading={
                  <Box sx={{ py: 8 }}>
                    <CircularProgress sx={{ color: '#0f766e' }} />
                  </Box>
                }
              >
                {Array.from(new Array(numPages), (_, index) => (
  <Box
    key={`page_wrapper_${index + 1}`}
    ref={(el) => (pageRefs.current[index + 1] = el)}
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      mb: 3
    }}
  >

    {/* Header ABOVE page */}
    <Box
      sx={{
        width: Math.min(800, window.innerWidth * 0.7),
        display: "flex",
        justifyContent: "space-between",
        px: 1,
        mb: 0.5,
        fontSize: "0.8rem",
        color: "#555"
      }}
    >
      <Typography variant="caption" fontWeight={600}>
         {documentName || "Document"}
        
      </Typography>

      <Typography variant="caption">
        Page {index + 1}
      </Typography>
    </Box>

    {/* Actual PDF page */}
    <Box
      sx={{
        boxShadow: 3,
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "white"
      }}
    >
      <Page
        pageNumber={index + 1}
        scale={zoom}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        width={Math.min(800, window.innerWidth * 0.7)}
      />
    </Box>

  </Box>
))}
              </Document>
            </Box>

            {/* Page Progress Bar */}
            {/* {numPages > 1 && (
              <Box sx={{ 
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'white',
                borderTop: '1px solid',
                borderColor: '#e0e0e0',
                p: 1,
                px: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: '#6b7280', minWidth: 60 }}>
                    Page {currentPage} of {numPages}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(currentPage / numPages) * 100} 
                    sx={{ 
                      flex: 1, 
                      height: 4, 
                      borderRadius: 2,
                      bgcolor: '#e5e7eb',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#0f766e'
                      }
                    }}
                  />
                </Box>
              </Box>
            )} */}
          </>
        )}
      </DialogContent>
      
      {/* Footer Actions */}
      <DialogActions sx={{ 
        p: 2, 
        px: 3, 
        borderTop: '1px solid', 
        borderColor: '#e0e0e0',
        bgcolor: '#fafafa'
      }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#6b7280',
            '&:hover': { bgcolor: '#f3f4f6' }
          }}
        >
          Close
        </Button>
        <Button 
          variant="contained" 
          onClick={handleDownload}
          startIcon={<DownloadIcon />}
          sx={{ 
            bgcolor: '#0f766e',
            '&:hover': { bgcolor: '#0f766e' }
          }}
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewDialog;
