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
import { Stage, Layer, Line, Rect } from 'react-konva';
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
const PAGE_HEADER_HEIGHT = 30; // Height of the per-page header in base units

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
  zoomLevel = 1.0,
  onZoomChange,
  showGrid = false,
  onToggleGrid,
  currentPage = 0,
  onPageChange,
  numPages = 1,
  getFieldValidationError,
  invalidFields = [],
  unassignedFields = [],
  canvasHeight = 1123,
  onPdfLoaded
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
  const baseHeight = canvasHeight || BASE_HEIGHT;
  const scaledWidth = (BASE_WIDTH) * zoomLevel;
  const scaledHeight = (baseHeight) * zoomLevel;
  const scaledHeaderHeight = PAGE_HEADER_HEIGHT * zoomLevel;

  // Total height including pages, headers, and gaps between them
  // (Header + Page) * numPages + Gap * (numPages - 1)
  const totalHeight = (scaledHeight + scaledHeaderHeight) * numPages + (PAGE_GAP * (numPages - 1));

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

    const scrollTop = container.scrollTop;

    // 1. Calculate base relative position from stage top
    // Stage starts at (0, 0) which is at the top of the very first page header.
    const relativeX = (dropX - stageRect.left) / zoomLevel;
    const relativeY = (dropY - stageRect.top) / zoomLevel;

    // identitfy current canvas dimensions
    const baseHeight = canvasHeight || BASE_HEIGHT;
    // 2. Identify which page we are on
    // Total block height for one page = Header + Page + (Fixed Screen Gap / Zoom)
    const basePageGap = PAGE_GAP / zoomLevel;
    const basePageBlockHeight = baseHeight + PAGE_HEADER_HEIGHT + basePageGap;

    const pageIndex = Math.floor(relativeY / basePageBlockHeight);
    const validPage = Math.max(0, Math.min(pageIndex, numPages - 1));

    // 3. Normalize Y to the specific page content area
    // Remove cumulative heights of previous pages and the current page's header
    const pageY = relativeY - (validPage * basePageBlockHeight) - PAGE_HEADER_HEIGHT;

    // 4. Center the field on drop point (base dimensions are type-specific)
    const fieldConfig = FIELD_TYPES[fieldType] || { defaultWidth: 160, defaultHeight: 32 };
    const fWidth = fieldConfig.defaultWidth || 160;
    const fHeight = fieldConfig.defaultHeight || 32;

    const cleanX = Math.round(Math.max(0, Math.min(relativeX - (fWidth / 2), BASE_WIDTH - fWidth)));
    const cleanY = Math.round(
      Math.max(0, Math.min(pageY - (fHeight / 2), baseHeight - fHeight))
    );

    // Dispatch event with clean, page-relative coordinates
    window.dispatchEvent(
      new CustomEvent('canvasDrop', {
        detail: {
          fieldType,
          x: cleanX,
          y: cleanY,
          page: validPage
        }
      })
    );
  }, [zoomLevel, numPages, canvasHeight, BASE_WIDTH, PAGE_GAP]);

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
    // Full block height on screen = Header + Page + Gap
    const pageBlockHeight = scaledHeight + scaledHeaderHeight + PAGE_GAP;
    const viewportMiddlePage = Math.floor((scrollTop + (containerRef.current.clientHeight / 2)) / pageBlockHeight);

    const newCurrentPage = Math.max(0, Math.min(viewportMiddlePage, numPages - 1));

    if (newCurrentPage !== currentPage) {
      onPageChange(newCurrentPage);
    }
  }, [scaledHeight, scaledHeaderHeight, numPages, currentPage, onPageChange]);

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

    const pageBlockHeight = scaledHeight + scaledHeaderHeight + PAGE_GAP;
    const scrollTop = currentPage * pageBlockHeight;
    containerRef.current.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  }, [currentPage, scaledHeight, scaledHeaderHeight]);

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        }
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `${PAGE_GAP}px`,
          py: 0
        }}>
          {Array.from({ length: numPages }, (_, pageIndex) => {
            const pdfPageNumber = pageIndex + 1;
            const isCurrentPage = pageIndex === currentPage;

            // Simple virtualization: Render pages that are near the current viewport
            // This prevents the browser from being overwhelmed by dozens of canvases
            const isNearVisible = Math.abs(pageIndex - currentPage) <= 2;

            return (
              <Box
                key={`page-wrapper-${pageIndex}`}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: 'relative'
                }}
              >
                {/* Simple Professional Page Header */}
                <Box sx={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeaderHeight}px`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  pb: 1,
                  bgcolor: 'transparent'
                }}>
                  <Typography variant="caption" sx={{ color: '#070707ff', fontWeight: 500, fontSize: `${11 * zoomLevel}px` }}>
                    {documentName || 'Untitled Document'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#191a1bff', fontWeight: 600, fontSize: `${11 * zoomLevel}px`, letterSpacing: '0.5px' }}>
                    PAGE {pdfPageNumber} OF {numPages}
                  </Typography>
                </Box>

                <Paper
                  key={`page-${pageIndex}`}
                  elevation={0}
                  sx={{
                    width: `${scaledWidth}px`,
                    minHeight: `${scaledHeight}px`,
                    position: 'relative',
                    borderRadius: 0,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    bgcolor: '#f8fafc', // Light background for unrendered pages
                    boxShadow: isCurrentPage ? '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isNearVisible ? (
                    <Page
                      pageNumber={pdfPageNumber}
                      width={scaledWidth}
                      onLoadSuccess={(page) => {
                        if (pageIndex === 0) {
                          const calculatedHeight = (BASE_WIDTH / page.originalWidth) * page.originalHeight;
                          // Pass both the canvas height (pixels) and the raw PDF dimensions (points)
                          onPdfLoaded?.(calculatedHeight, page.originalWidth, page.originalHeight);
                        }
                      }}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={<CircularProgress size={24} />}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, opacity: 0.3 }}>
                      <CircularProgress size={20} thickness={2} />
                      <Typography variant="caption">Loading Page {pdfPageNumber}...</Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            );
          })}
        </Box>
      </Document>
    );
  }, [pdfUrl, pdfError, numPages, scaledWidth, scaledHeight, zoomLevel, currentPage, handlePdfLoadSuccess, handlePdfLoadError]);

  // Render Grid Layer
  const renderGridLayer = useMemo(() => {
    if (!showGrid) return null;

    // Higher density professional grid (20px gap)
    const gridGap = 20 * zoomLevel;
    const lines = [];

    // Vertical lines
    for (let x = 0; x <= scaledWidth; x += gridGap) {
      const isMajor = Math.round(x / gridGap) % 5 === 0;
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, totalHeight]}
          stroke="#000000"
          strokeWidth={isMajor ? 0.7 : 0.3}
          opacity={isMajor ? 0.08 : 0.04}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= totalHeight; y += gridGap) {
      const isMajor = Math.round(y / gridGap) % 5 === 0;
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, scaledWidth, y]}
          stroke="#000000"
          strokeWidth={isMajor ? 0.7 : 0.3}
          opacity={isMajor ? 0.08 : 0.04}
          listening={false}
        />
      );
    }

    return (
      <Layer listening={false}>
        {lines}
      </Layer>
    );
  }, [showGrid, scaledWidth, totalHeight, zoomLevel]);

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
        {renderGridLayer}
        <Layer>
          {fields
            .filter(field => {
              // Virtualize Konva objects: Only render fields on or near the current page
              // This keeps the Stage lightweight and responsive
              return Math.abs(field.page - currentPage) <= 1;
            })
            .map((field) => {
              const validationError = getFieldValidationError ? getFieldValidationError(field) : false;

              // Calculate Y offset: Each page n is preceded by n * (page + header + gap) plus this page's own header
              const pageOffsetY =
                field.page * (scaledHeight + scaledHeaderHeight + PAGE_GAP) +
                scaledHeaderHeight;

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
                  canvasHeight={baseHeight}
                />
              );
            })}
        </Layer>
      </Stage>
    );
  }, [fields, scaledWidth, totalHeight, handleCanvasClick, selectedFieldId, onSelectField, onFieldDragEnd, onFieldTransform, zoomLevel, getFieldValidationError, currentPage, recipients, renderGridLayer, scaledHeight]);

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
        id="joyride-work-area"
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          bgcolor: '#ffffffff',
          borderRadius: 0,
          border: 'none',
          transition: 'all 0.2s ease',
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
