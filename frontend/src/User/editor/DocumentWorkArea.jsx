import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Button,
  LinearProgress
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { Stage, Layer } from 'react-konva';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import CanvasField from './CanvasField';
import { documentAPI } from '../../services/builder';
import {
  FIELD_TYPES,
  FIELD_ROLES,
  validateFieldAssignment,
  getRecipientColor,
  ROLE_FIELD_RULES
} from '../../config/fieldConfig';

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const BASE_WIDTH = 794;
const BASE_HEIGHT = 1123;
const PAGE_GAP = 20;

const DocumentWorkArea = ({
  documentId,
  documentName,
  fields = [],
  recipients = [],
  selectedFieldId,
  onSelectField,
  onFieldDragEnd,
  onFieldTransform,
  onFieldClick,
  zoomLevel = 0.8,
  onZoomChange,
  showGrid = false,
  onToggleGrid,
  currentPage = 0,
  onPageChange,
  numPages = 1,
  getFieldValidationError,
  invalidFields = [],
  unassignedFields = []
}) => {
  const stageRef = useRef();
  const containerRef = useRef();
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // PDF URL - memoized
  const pdfUrl = useMemo(() => {
    if (!documentId) return null;
    return documentAPI.getBuilderPdfUrl(documentId);
  }, [documentId]);

  // Scaled dimensions
  const scaledWidth = BASE_WIDTH * zoomLevel;
  const scaledHeight = BASE_HEIGHT * zoomLevel;
  const totalHeight = (scaledHeight + PAGE_GAP) * numPages;

  // Handle zoom
  const handleZoomIn = () => {
    onZoomChange?.(Math.min(zoomLevel + 0.1, 2));
  };

  const handleZoomOut = () => {
    onZoomChange?.(Math.max(zoomLevel - 0.1, 0.5));
  };

  const handleFitToScreen = () => {
    onZoomChange?.(0.8);
  };

  // Handle canvas click
  const handleCanvasClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      onSelectField(null);
    }
  }, [onSelectField]);

  // Handle drag and drop
// In DocumentWorkArea.jsx, replace the handleDrop function with this enhanced version:

// In DocumentWorkArea.jsx, replace the handleDrop function with this fixed version:

const handleDrop = useCallback((e) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);

  // Get field type from data transfer
  let fieldType = null;
  
  // Try to get from custom JSON
  try {
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      const parsed = JSON.parse(jsonData);
      fieldType = parsed.type;
    }
  } catch (err) {
    // Ignore JSON parse errors
  }

  // Try plain text
  if (!fieldType) {
    fieldType = e.dataTransfer.getData('text/plain');
  }

  // Try other text formats
  if (!fieldType) {
    const types = e.dataTransfer.types;
    for (let type of types) {
      if (type === 'text/plain' || type === 'text') {
        fieldType = e.dataTransfer.getData(type);
        break;
      }
    }
  }

  // Validate field type
  if (!fieldType || !FIELD_TYPES[fieldType]) {
    console.warn('Invalid or missing field type:', fieldType);
    return;
  }

  const stage = stageRef.current;
  if (!stage) return;

  // Get the container element
  const container = containerRef.current;
  if (!container) return;

  // Get the drop coordinates relative to the viewport
  const dropX = e.clientX;
  const dropY = e.clientY;

  // Get the container's bounding rectangle
  const containerRect = container.getBoundingClientRect();
  
  // Get the stage's position relative to the container
  const stageElement = stage.container();
  const stageRect = stageElement.getBoundingClientRect();

  // Calculate the position relative to the stage (accounting for container scroll)
  const relativeX = (dropX - stageRect.left) / zoomLevel;
  const relativeY = (dropY - stageRect.top + container.scrollTop) / zoomLevel;

  // Calculate which page we're on
  const pageHeight = BASE_HEIGHT + PAGE_GAP; // Use base height, not scaled
  const pageIndex = Math.floor(relativeY / pageHeight);
  const validPage = Math.max(0, Math.min(pageIndex, numPages - 1));
  
  // Calculate position within the page
  const pageY = relativeY - (validPage * pageHeight);
  
  // Ensure coordinates are within page bounds
  const finalX = Math.max(20, Math.min(relativeX, BASE_WIDTH - 100));
  const finalY = Math.max(20, Math.min(pageY, BASE_HEIGHT - 60));

  console.log('Drop calculation:', {
    dropX,
    dropY,
    containerScrollTop: container.scrollTop,
    stageRect: {
      left: stageRect.left,
      top: stageRect.top,
      width: stageRect.width,
      height: stageRect.height
    },
    relativeX,
    relativeY,
    pageHeight,
    pageIndex,
    validPage,
    pageY,
    finalX,
    finalY
  });

  // Dispatch event
  window.dispatchEvent(
    new CustomEvent('canvasDrop', {
      detail: { 
        fieldType, 
        x: finalX, 
        y: finalY,
        page: validPage
      }
    })
  );
}, [zoomLevel, numPages, BASE_HEIGHT, BASE_WIDTH, PAGE_GAP]);

  // In DocumentWorkArea.jsx, update handleDragOver:

const handleDragOver = useCallback((e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Check if dragging a valid field type
  const types = e.dataTransfer.types;
  const hasValidType = Array.from(types).some(type => 
    type === 'text/plain' || type === 'application/json' || type === 'text'
  );
  
  if (hasValidType) {
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
    
    // Optional: Add visual feedback
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = 'rgba(25, 118, 210, 0.05)';
    }
  }
}, []);

const handleDragLeave = useCallback(() => {
  setIsDragging(false);
  // Remove visual feedback
  if (containerRef.current) {
    containerRef.current.style.backgroundColor = '';
  }
}, []);

useEffect(() => {
  const handleDebugDrop = (e) => {
    console.log('Drop event received:', e.detail);
  };

  window.addEventListener('canvasDrop', handleDebugDrop);
  return () => window.removeEventListener('canvasDrop', handleDebugDrop);
}, []);

  // const handleDragLeave = useCallback(() => {
  //   setIsDragging(false);
  // }, []);

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragleave', handleDragLeave);

    return () => {
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('dragleave', handleDragLeave);
    };
  }, [handleDrop, handleDragOver, handleDragLeave]);

  // Handle scroll to update current page
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const pageHeight = scaledHeight + PAGE_GAP;
    const viewportMiddlePage = Math.floor((scrollTop + (containerRef.current.clientHeight / 2)) / pageHeight);
    
    const newCurrentPage = Math.max(0, Math.min(viewportMiddlePage, numPages - 1));
    
    if (newCurrentPage !== currentPage) {
      onPageChange(newCurrentPage);
    }
  }, [scaledHeight, numPages, currentPage, onPageChange]);

  // Add scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimer;
    const debouncedHandleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(handleScroll, 100);
    };

    container.addEventListener('scroll', debouncedHandleScroll);
    return () => {
      container.removeEventListener('scroll', debouncedHandleScroll);
      clearTimeout(scrollTimer);
    };
  }, [handleScroll]);

  // Scroll to current page when changed programmatically
  useEffect(() => {
    if (!containerRef.current) return;
    
    const scrollTop = currentPage * (scaledHeight + PAGE_GAP);
    containerRef.current.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  }, [currentPage, scaledHeight]);

  // Handle PDF load
  const handlePdfLoadSuccess = useCallback(() => {
    setPdfLoaded(true);
    setPdfError(null);
  }, []);

  const handlePdfLoadError = useCallback((error) => {
    console.error('PDF load error:', error);
    setPdfError('Failed to load PDF document');
    setPdfLoaded(false);
  }, []);

  // Render PDF pages
  const renderPdfPages = useMemo(() => {
    if (!pdfUrl) {
      return (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `${PAGE_GAP}px`,
          padding: `${PAGE_GAP}px 0`
        }}>
          {Array.from({ length: numPages }, (_, pageIndex) => (
            <Paper
              key={`placeholder-${pageIndex}`}
              sx={{
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CircularProgress />
            </Paper>
          ))}
        </Box>
      );
    }

    if (pdfError) {
      return (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2,
          p: 3
        }}>
          <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
          <Typography color="error" align="center">
            {pdfError}
          </Typography>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      );
    }

    return (
      <Document
        file={pdfUrl}
        onLoadSuccess={handlePdfLoadSuccess}
        onLoadError={handlePdfLoadError}
        loading={
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: `${PAGE_GAP}px`,
            padding: `${PAGE_GAP}px 0`
          }}>
            {Array.from({ length: numPages }, (_, pageIndex) => (
              <Paper
                key={`loading-${pageIndex}`}
                sx={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                
                <CircularProgress />
              </Paper>
            ))}
          </Box>
        }
        error={
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 2,
            p: 3
          }}>
            <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
            <Typography color="error" align="center">
              Failed to load PDF
            </Typography>
          </Box>
        }
      >
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `${PAGE_GAP}px`,
          padding: `${PAGE_GAP}px 0`
        }}>
          {Array.from({ length: numPages }, (_, pageIndex) => {
            const pdfPageNumber = pageIndex + 1;
            const isCurrentPage = pageIndex === currentPage;
            
            return (
                <Box
  key={`page-wrapper-${pageIndex}`}
  sx={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  }}
>

  {/* Header OUTSIDE the page */}
  <Box
    sx={{
      width: `${scaledWidth}px`,
      display: "flex",
      justifyContent: "space-between",
      px: 1,
      mb: 0.5,
      fontSize: "0.8rem",
      color: "#555"
    }}
  >
    <Typography variant="caption" fontWeight={500}>
      {documentName || "Untitled Document"}
    </Typography>

    <Typography variant="caption">
      Page {pdfPageNumber}
    </Typography>
  </Box>
              <Paper
                key={`page-${pageIndex}`}
                elevation={isCurrentPage ? 3 : 1}
                sx={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  position: 'relative',
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: isCurrentPage ? '.4px solid #292f2da6' : '1px solid #e0e0e0',
                  transition: 'border 0.2s ease'
                }}
              >
                
               
                <Page
                  pageNumber={pdfPageNumber}
                  scale={zoomLevel}
                  width={BASE_WIDTH}
                  height={BASE_HEIGHT}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <CircularProgress size={24} />
                    </Box>
                  }
                />
                
                
                {/* Page Number Badge */}
                {/* <Box sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: isCurrentPage ? '#1976d2' : 'rgba(0,0,0,0.6)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontWeight: isCurrentPage ? 600 : 400,
                  zIndex: 2
                }}>
                  Page {pdfPageNumber}
                </Box> */}
              </Paper>
              </Box>
            );
          })}
        </Box>
      </Document>
    );
  }, [pdfUrl, pdfError, numPages, scaledWidth, scaledHeight, zoomLevel, currentPage, handlePdfLoadSuccess, handlePdfLoadError]);

  // Render Konva overlay
  const renderKonvaStage = useMemo(() => {
    return (
      <Stage
        ref={stageRef}
        width={scaledWidth}
        height={totalHeight}
        onClick={handleCanvasClick}
        onTap={handleCanvasClick}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'auto'
        }}
      >
        <Layer>
          {fields.map((field) => {
            const validationError = getFieldValidationError ? getFieldValidationError(field) : false;
            
            // Calculate Y offset for each page
            const pageOffsetY = field.page * (scaledHeight + PAGE_GAP) + (PAGE_GAP / 2);

            return (
              <CanvasField
                key={field.id}
                field={field}
                isSelected={selectedFieldId === field.id}
                onSelect={onSelectField}
                onDragEnd={onFieldDragEnd}
                onTransform={onFieldTransform}
                scale={zoomLevel}
                validationError={validationError}
                currentPage={currentPage}
                showAllFields={true}
                pageOffsetY={pageOffsetY}
                recipients={recipients}
              />
            );
          })}
        </Layer>
      </Stage>
    );
  }, [fields, scaledWidth, totalHeight, handleCanvasClick, selectedFieldId, onSelectField, onFieldDragEnd, onFieldTransform, zoomLevel, getFieldValidationError, currentPage, recipients]);

  return (
    <Box sx={{ 
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative'
    }}>
      {/* Toolbar */}
      <Paper sx={{ 
        p: 1, 
        mb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Page Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton 
              size="small" 
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 0}
            >
              <NavigateBeforeIcon />
            </IconButton>
            
            <Typography variant="body2" sx={{ minWidth: 100, textAlign: 'center' }}>
              Page {currentPage + 1} of {numPages}
            </Typography>
            
            <IconButton 
              size="small" 
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= numPages - 1}
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />
          
          {/* Zoom Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={handleZoomIn} disabled={zoomLevel >= 2}>
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fit to Screen">
              <IconButton size="small" onClick={handleFitToScreen}>
                <FitScreenIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />
          
          {/* Grid Toggle */}
          <Tooltip title={showGrid ? "Hide Grid" : "Show Grid"}>
            <IconButton size="small" onClick={onToggleGrid}>
              {showGrid ? <GridOnIcon /> : <GridOffIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Field Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {invalidFields.length > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${invalidFields.length} invalid`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
          {unassignedFields.length > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${unassignedFields.length} unassigned`}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          {invalidFields.length === 0 && unassignedFields.length === 0 && fields.length > 0 && (
            <Chip
              icon={<CheckCircleIcon />}
              label="All fields valid"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
      </Paper>

      {/* Validation Summary */}
      {(invalidFields.length > 0 || unassignedFields.length > 0) && (
        <Alert 
          severity={invalidFields.length > 0 ? "error" : "warning"}
          sx={{ mb: 1 }}
          icon={invalidFields.length > 0 ? <ErrorIcon /> : <WarningIcon />}
        >
          <Typography variant="body2">
            {invalidFields.length > 0 && (
              <>{invalidFields.length} incompatible field assignment{invalidFields.length > 1 ? 's' : ''}</>
            )}
            {invalidFields.length > 0 && unassignedFields.length > 0 && ' • '}
            {unassignedFields.length > 0 && (
              <>{unassignedFields.length} unassigned field{unassignedFields.length > 1 ? 's' : ''}</>
            )}
          </Typography>
        </Alert>
      )}

      {/* PDF Container */}
      <Paper
        ref={containerRef}
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          bgcolor: '#e0e0e0',
          borderRadius: 1,
        //   border: isDragging ? '2px dashed #1976d2' : '1px solid #e0e0e0',
          transition: 'border 0.2s ease',
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: 4
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: 4,
            '&:hover': {
              background: '#666'
            }
          }
        }}
      >
        {/* PDF Content */}
        <Box sx={{ 
          position: 'relative',
          minHeight: totalHeight,
          display: 'flex',
          justifyContent: 'center'
        }}>
          {renderPdfPages}
          {renderKonvaStage}
        </Box>

        
      </Paper>

      {/* Page Progress */}
      {/* <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Page {currentPage + 1} of {numPages}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={((currentPage + 1) / numPages) * 100} 
          sx={{ flex: 1, height: 4, borderRadius: 2 }}
        />
      </Box> */}
    </Box>
  );
};

export default DocumentWorkArea;