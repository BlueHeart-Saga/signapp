import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  Chip,
  IconButton,
  Dialog,
  Divider,
  Badge,
  Tooltip,
  AppBar,
  Toolbar,
  Fab,
  Zoom,
  useMediaQuery,
  useTheme,
  Fade,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  Edit as SignIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Menu as MenuIcon,
  Fingerprint as SignatureIcon,
  TextFields as TextIcon,
  Today as DateIcon,
  ThumbUp as ApprovalIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Refresh as RefreshIcon,
  ArrowDownward as DownIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  PictureAsPdf as PdfIcon,
  Preview as PreviewIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckboxIcon,
  Attachment as AttachmentIcon,
  ArrowDropDown as DropdownIcon,
  WatchLater as PendingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { FaArchive } from "react-icons/fa";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import API_BASE_URL from "../config/api";
import TermsDialog from './TermsDialog';
import DeclineConfirmation from './DeclineConfirmation';

// 🔧 ADDED: Import Enhanced Signature Pad
import { EnhancedSignaturePadModal } from '../components/SignaturePad';

const globalStyles = `
  /* Field button animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes buttonPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(255, 107, 107, 0); }
  }
  
  /* Enhanced field styling */
  .field-overlay {
    transition: all 0.2s ease;
  }
  
  .field-overlay:hover .field-action-button {
    opacity: 1;
    transform: translateY(0);
  }
  
  .field-action-button {
    opacity: 0.9;
    transform: translateY(2px);
    transition: all 0.2s ease;
  }
  
  .field-action-button:hover {
    opacity: 1;
    transform: translateY(0);
    box-shadow: 0 3px 6px rgba(0,0,0,0.16);
  }
  
  /* Required field indicator */
  .required-field::before {
    content: '*';
    color: #FF6B6B;
    position: absolute;
    top: -8px;
    left: -8px;
    font-size: 16px;
    font-weight: bold;
  }
`;

// 🔧 ADDED: Inject global styles
const GlobalStyles = () => {
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = globalStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return null;
};

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
};

// ======================
// 🔧 ADDED: COORDINATE CONVERSION UTILITIES
// ======================

/**
 * Convert PDF coordinates to screen coordinates with high accuracy
 * PDF coordinates: Bottom-left origin, points
 * Screen coordinates: Top-left origin, pixels
 */
const convertPdfToScreenCoordinates = (field, pageDimensions, scale = 1) => {
  if (!pageDimensions || !field) {
    return { left: 0, top: 0, width: 0, height: 0, isValid: false };
  }

  const { pdfWidth, pdfHeight, renderWidth, renderHeight } = pageDimensions;

  // 🔧 CRITICAL: Determine which coordinate system to use
  let pdfX, pdfY, fieldWidth, fieldHeight;

  // Priority 1: Use PDF coordinates (most accurate for PDF rendering)
  if (field.pdf_x !== undefined && field.pdf_y !== undefined) {
    // PDF coordinates are stored with bottom-left origin
    pdfX = field.pdf_x;
    pdfY = field.pdf_y; // This is the BOTTOM coordinate in PDF space
    fieldWidth = field.pdf_width || field.width || 100;
    fieldHeight = field.pdf_height || field.height || 30;

    // ⚠️ IMPORTANT: Convert from PDF bottom-left to screen top-left
    // In PDF: Y increases upward from bottom
    // In screen: Y increases downward from top
    // Formula: screenY = pdfHeight - pdfY - fieldHeight
    const screenY = pdfHeight - pdfY - fieldHeight;

    // Convert PDF points to screen pixels
    const leftPx = (pdfX / pdfWidth) * renderWidth;
    const topPx = (screenY / pdfHeight) * renderHeight;
    const widthPx = (fieldWidth / pdfWidth) * renderWidth;
    const heightPx = (fieldHeight / pdfHeight) * renderHeight;

    // Apply current scale
    return {
      left: leftPx * scale,
      top: topPx * scale,
      width: Math.max(widthPx * scale, 20), // Minimum size for clickability
      height: Math.max(heightPx * scale, 20),
      isValid: true,
      coordinateSource: 'pdf'
    };
  }

  // Priority 2: Use canvas coordinates (from frontend editor)
  else if (field.canvas_x !== undefined && field.canvas_y !== undefined) {
    // Canvas coordinates are already in top-left pixels
    const canvasX = field.canvas_x;
    const canvasY = field.canvas_y;
    const canvasWidth = field.canvas_width || field.width || 100;
    const canvasHeight = field.canvas_height || field.height || 30;

    // We need to know the original canvas dimensions to scale properly
    const canvasPageWidth = field.canvas_page_width || 792; // Default US Letter
    const canvasPageHeight = field.canvas_page_height || 612;

    // Convert canvas pixels to PDF points ratio
    const scaleX = pdfWidth / canvasPageWidth;
    const scaleY = pdfHeight / canvasPageHeight;

    const leftPx = (canvasX * scaleX / pdfWidth) * renderWidth;
    const topPx = (canvasY * scaleY / pdfHeight) * renderHeight;
    const widthPx = (canvasWidth * scaleX / pdfWidth) * renderWidth;
    const heightPx = (canvasHeight * scaleY / pdfHeight) * renderHeight;

    return {
      left: leftPx * scale,
      top: topPx * scale,
      width: Math.max(widthPx * scale, 20),
      height: Math.max(heightPx * scale, 20),
      isValid: true,
      coordinateSource: 'canvas'
    };
  }

  // Priority 3: Fallback to generic coordinates
  else {
    const leftPx = field.x || 0;
    const topPx = field.y || 0;
    const widthPx = field.width || 100;
    const heightPx = field.height || 30;

    return {
      left: leftPx * scale,
      top: topPx * scale,
      width: Math.max(widthPx * scale, 20),
      height: Math.max(heightPx * scale, 20),
      isValid: true,
      coordinateSource: 'generic'
    };
  }
};

/**
 * Debug helper for coordinate issues
 */
const debugFieldCoordinates = (field, screenPos, pageNum, pageDimensions) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📐 Field ${field.id} (Page ${pageNum}):`, {
      type: field.type,
      label: field.label,
      page: field.page,
      pdfCoords: {
        x: field.pdf_x,
        y: field.pdf_y,
        width: field.pdf_width,
        height: field.pdf_height
      },
      canvasCoords: {
        x: field.canvas_x,
        y: field.canvas_y,
        width: field.canvas_width,
        height: field.canvas_height
      },
      genericCoords: {
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height
      },
      pageDimensions: pageDimensions,
      screenPosition: screenPos,
      conversionSource: screenPos.coordinateSource
    });
  }
};

/**
 * Generate consistent colors for recipients
 */
const generateRecipientColors = (fields = []) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
    '#EF476F', '#7209B7', '#3A86FF', '#FB5607', '#8338EC',
    '#3A86FF', '#FF006E', '#8338EC', '#FB5607', '#FFBE0B'
  ];

  const colorMap = {};
  const recipientIds = [...new Set(fields.map(f => f.recipient_id))];

  recipientIds.forEach((recipientId, index) => {
    colorMap[recipientId] = colors[index % colors.length];
  });

  return colorMap;
};

// 🔧 ADDED: Field Action Button Component (Zoho-style)
const FieldActionButton = React.memo(({
  field,
  isCompleted,
  hasValue,
  onClick,
  recipientColor
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine button text and icon based on field status and type
  const getButtonConfig = () => {
    if (isCompleted) {
      return {
        text: 'Completed',
        icon: <CheckIcon sx={{ fontSize: '12px' }} />,
        backgroundColor: '#4CAF50',
        color: 'white',
        hoverBackgroundColor: '#45a049',
      };
    }

    if (hasValue) {
      return {
        text: field.type === 'signature' || field.type === 'initials' || field.type === 'witness_signature' ? 'Re-sign' : 'Edit',
        icon: <SignIcon sx={{ fontSize: '12px' }} />,
        backgroundColor: '#2196F3',
        color: 'white',
        hoverBackgroundColor: '#1976D2',
      };
    }

    // Default pending state
    return {
      text: field.type === 'signature' ? 'Sign' :
        field.type === 'initials' ? 'Initials' :
          field.type === 'date' ? 'Select Date' :
            field.type === 'checkbox' ? 'Check' :
              field.type === 'approval' ? 'Approve' :
                'Fill',
      icon: field.type === 'signature' || field.type === 'initials' || field.type === 'witness_signature' ?
        <SignatureIcon sx={{ fontSize: '12px' }} /> :
        field.type === 'date' ? <DateIcon sx={{ fontSize: '12px' }} /> :
          field.type === 'checkbox' ? <CheckboxIcon sx={{ fontSize: '12px' }} /> :
            field.type === 'approval' ? <ApprovalIcon sx={{ fontSize: '12px' }} /> :
              <TextIcon sx={{ fontSize: '12px' }} />,
      backgroundColor: recipientColor || '#FF9800',
      color: 'white',
      hoverBackgroundColor: recipientColor ? `${recipientColor}CC` : '#F57C00',
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 4,
        right: 4,
        zIndex: 250, // Above field overlay
      }}
    >
      <Button
        variant="contained"
        size="extra-small"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick(field);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isCompleted}
        sx={{
          minWidth: 'auto',
          padding: '2px 8px',
          fontSize: '9px',
          fontWeight: 'bold',
          lineHeight: 1.2,
          borderRadius: '12px',
          backgroundColor: buttonConfig.backgroundColor,
          color: buttonConfig.color,
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          boxShadow: isHovered && !isCompleted ? '0 2px 4px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.1)',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: buttonConfig.hoverBackgroundColor,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&.Mui-disabled': {
            backgroundColor: '#E0E0E0',
            color: '#757575',
          },
          // Small size adjustments
          '.MuiButton-startIcon': {
            marginRight: '2px',
            marginLeft: 0,
          },
          '.MuiSvgIcon-root': {
            fontSize: '10px',
          }
        }}
        startIcon={buttonConfig.icon}
      >
        {buttonConfig.text}
      </Button>

      {/* Quick action tooltip on hover */}
      {isHovered && !isCompleted && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            mb: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'normal',
            whiteSpace: 'nowrap',
            zIndex: 300,
            animation: 'fadeIn 0.2s ease',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '100%',
              right: 8,
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor: 'rgba(0, 0, 0, 0.85) transparent transparent transparent',
            }
          }}
        >
          {field.type === 'signature' ? 'Click to sign' :
            field.type === 'initials' ? 'Click to add initials' :
              field.type === 'date' ? 'Click to select date' :
                field.type === 'checkbox' ? 'Click to check/uncheck' :
                  field.type === 'approval' ? 'Click to approve' :
                    'Click to fill this field'}
        </Box>
      )}
    </Box>
  );
});

FieldActionButton.displayName = 'FieldActionButton';
// ======================
// 🔧 ADDED: ENHANCED FIELD OVERLAY COMPONENT (Zoho-Style)
// ======================

const EnhancedFieldOverlay = React.memo(({
  field,
  screenPosition,
  isCompleted = false,
  hasValue = false,
  isClickable = true,
  onClick,
  recipientColor = '#FF6B6B',
  fieldTypeConfig,
}) => {
  // Determine visual state based on field status
  const getVisualState = () => {
    if (isCompleted) {
      return {
        border: '2px solid #4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.08)',
        hintText: '✓ Completed',
        icon: <CheckIcon sx={{ fontSize: '12px', color: '#4CAF50' }} />,
        cursor: 'default',
        textColor: '#4CAF50',
        showHint: true
      };
    }

    if (hasValue) {
      return {
        border: '2px dashed #2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.05)',
        hintText: 'Draft - Click to edit',
        icon: <SignIcon sx={{ fontSize: '12px', color: '#2196F3' }} />,
        cursor: 'pointer',
        textColor: '#2196F3',
        showHint: true
      };
    }

    // Pending field (not completed, no value)
    return {
      border: '2px dashed #FF9800',
      backgroundColor: 'rgba(255, 152, 0, 0.05)',
      hintText: field.type === 'signature' ? 'CLICK TO SIGN' :
        field.type === 'initials' ? 'CLICK FOR INITIALS' :
          field.type === 'date' ? 'CLICK FOR DATE' :
            'CLICK TO FILL',
      icon: <span style={{ fontSize: '14px' }}>👆</span>,
      cursor: 'pointer',
      textColor: '#FF9800',
      showHint: true
    };
  };

  const visualState = getVisualState();
  const fieldLabel = field.label || fieldTypeConfig?.label || field.type.replace('_', ' ').toUpperCase();

  return (
    <Box
      data-field-id={field.id}
      data-field-type={field.type}
      data-field-page={field.page}
      data-field-status={isCompleted ? 'completed' : hasValue ? 'draft' : 'pending'}
      sx={{
        // 🔧 CRITICAL: Absolute positioning based on converted coordinates
        position: 'absolute',
        left: `${screenPosition.left}px`,
        top: `${screenPosition.top}px`,
        width: `${screenPosition.width}px`,
        height: `${screenPosition.height}px`,

        // ⚠️ IMPORTANT: High z-index to sit above PDF canvas
        zIndex: 200,

        // Visual styling
        border: visualState.border,
        backgroundColor: visualState.backgroundColor,
        borderRadius: '2px',
        cursor: isClickable ? visualState.cursor : 'default',

        // Zoho-style hover effects
        '&:hover': isClickable ? {
          backgroundColor: 'rgba(255, 152, 0, 0.12)',
          boxShadow: '0 0 0 2px rgba(255, 152, 0, 0.25)',
          transform: 'scale(1.01)',
          zIndex: 201, // Raise on hover
        } : {},

        // Smooth transitions
        transition: 'all 0.15s ease-in-out',

        // 🔧 Pointer events control
        pointerEvents: isClickable ? 'auto' : 'none',

        // Animation for pending fields
        animation: !isCompleted && !hasValue ? 'pulse 2s infinite' : 'none',

        // Prevent text selection
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',

        // Ensure overlay doesn't affect PDF text layer
        mixBlendMode: 'normal',

        // Ensure field content is clickable
        '& *': {
          pointerEvents: 'auto',
        }
      }}
      onClick={(e) => {
        if (isClickable) {
          // 🔧 CRITICAL: Stop event propagation to prevent PDF click-through
          e.stopPropagation();
          e.preventDefault();

          console.log(`🎯 Field clicked via overlay:`, {
            fieldId: field.id,
            fieldType: field.type,
            page: field.page,
            coordinates: screenPosition
          });

          onClick(field);

          // Visual feedback
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.5)';
          setTimeout(() => {
            if (e.currentTarget) {
              e.currentTarget.style.boxShadow = '';
            }
          }, 300);
        }
      }}
      onMouseDown={(e) => {
        // Prevent text selection when clicking
        if (isClickable) {
          e.preventDefault();
        }
      }}
    >
      {/* Field Label (Zoho-style floating label) */}
      {fieldLabel && (
        <Box
          className="field-label"
          sx={{
            position: 'absolute',
            top: -22,
            left: -1,
            fontSize: '9px',
            fontWeight: 'bold',
            color: recipientColor,
            backgroundColor: 'white',
            padding: '1px 6px',
            borderRadius: '3px',
            border: `1px solid ${recipientColor}`,
            whiteSpace: 'nowrap',
            zIndex: 202,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'auto',
          }}
        >
          {fieldLabel}
          {field.required && ' *'}
        </Box>
      )}

      {/* Field Content Area */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          textAlign: 'center',
          overflow: 'hidden',
          position: 'relative',
          pointerEvents: 'auto', // Let button handle clicks
        }}
      >
        {/* Icon/Indicator */}
        <Box sx={{ mb: 0.5, pointerEvents: 'auto' }}>
          {visualState.icon}
        </Box>

        {/* Hint Text */}
        {visualState.showHint && (
          <Typography
            sx={{
              fontSize: '8px',
              fontWeight: 'bold',
              color: visualState.textColor,
              lineHeight: 1.2,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              pointerEvents: 'auto',
            }}
          >
            {visualState.hintText}
          </Typography>
        )}

        {/* 🔧 ADDED: Action Button for quick access */}
        <Box sx={{ pointerEvents: 'auto' }}>
          <FieldActionButton
            field={field}
            isCompleted={isCompleted}
            hasValue={hasValue}
            onClick={onClick}
            recipientColor={recipientColor}
          />
        </Box>

        {/* Recipient Indicator */}
        {!isCompleted && field.recipient_name && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              left: 4,
              fontSize: '8px',
              color: recipientColor,
              fontWeight: 'bold',
              backgroundColor: 'rgba(255,255,255,0.8)',
              padding: '1px 3px',
              borderRadius: '2px',
              border: `1px solid ${recipientColor}`,
              pointerEvents: 'none',
            }}
          >
            {field.recipient_name.charAt(0)}
          </Box>
        )}

        {/* Completed Checkmark (Zoho-style) */}
        {isCompleted && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: '#4CAF50',
              borderRadius: '50%',
              width: 14,
              height: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}
          >
            <CheckIcon sx={{ fontSize: '9px', color: 'white' }} />
          </Box>
        )}

        {/* Required Field Indicator */}
        {field.required && !isCompleted && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              left: 4,
              width: 6,
              height: 6,
              backgroundColor: '#FF6B6B',
              borderRadius: '50%',
              animation: 'pulse 1.5s infinite',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>
    </Box>
  );
});

EnhancedFieldOverlay.displayName = 'EnhancedFieldOverlay';

// ======================
// 🔧 ADDED: PAGE OVERLAY CONTAINER (Optimized for performance)
// ======================

const PageOverlayContainer = React.memo(({
  pageNum,
  fields = [],
  pageDimensions,
  scale = 1,
  onFieldClick,
  fieldValues = {},
  completedFields = {},
  mode = 'edit',
  recipientColors = {},
  fieldTypesConfig = {},
}) => {
  // Filter fields for this specific page
  const pageFields = useMemo(() =>
    fields.filter(field => field.page === pageNum),
    [fields, pageNum]
  );


  // Early return if no fields or invalid state
  if (!pageDimensions || pageFields.length === 0 || mode !== 'edit') {
    return null;
  }

  if (!pageDimensions) {
    console.warn(`⚠️ Overlay NOT rendered (no pageDimensions) → Page ${pageNum}`);
    return null;
  }

  if (pageFields.length === 0) {
    console.warn(`⚠️ Overlay NOT rendered (no fields) → Page ${pageNum}`);
    return null;
  }

  if (mode !== 'edit') {
    console.warn(`⚠️ Overlay NOT rendered (mode=${mode}) → Page ${pageNum}`);
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        // ⚠️ IMPORTANT: Container has no pointer events, children control their own
        pointerEvents: 'none',
        // Ensure proper stacking
        zIndex: 100,
        // Prevent any interaction with PDF underneath
        isolation: 'isolate',
      }}
    >
      {pageFields.map((field) => {
        const fieldId = field.id;
        const isCompleted = completedFields[fieldId] || false;
        const hasValue = fieldValues[fieldId] !== undefined &&
          fieldValues[fieldId] !== null &&
          fieldValues[fieldId] !== '';
        const isClickable = !isCompleted && mode === 'edit';

        // Convert coordinates
        const screenPosition = convertPdfToScreenCoordinates(field, pageDimensions, scale);

        // Debug in development
        if (process.env.NODE_ENV === 'development' && screenPosition.isValid) {
          debugFieldCoordinates(field, screenPosition, pageNum, pageDimensions);
        }

        // Skip invalid positions
        if (!screenPosition.isValid) {
          return null;
        }

        return (
          <EnhancedFieldOverlay
            key={`field-${fieldId}-${pageNum}`}
            field={field}
            screenPosition={screenPosition}
            isCompleted={isCompleted}
            hasValue={hasValue}
            isClickable={isClickable}
            onClick={onFieldClick}
            recipientColor={recipientColors[field.recipient_id] || '#666666'}
            fieldTypeConfig={fieldTypesConfig[field.type]}
          />
        );
      })}
    </Box>
  );
});

PageOverlayContainer.displayName = 'PageOverlayContainer';

// ======================
// 🔧 UPDATED: PDF PAGE WITH OVERLAY (Enhanced for Zoho UX)
// ======================

const PdfPageWithOverlay = React.memo(({
  pageNum,
  scale,
  documentUrl,
  fields = [],
  onFieldClick,
  fieldValues = {},
  completedFields = {},
  showFields = true,
  mode = 'edit',
  onPageLoadSuccess,
  recipientColors = {},
}) => {
  const [pageDimensions, setPageDimensions] = useState(null);
  const pageRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle page load to get accurate dimensions
  const handlePageLoadSuccess = useCallback((page) => {
    const viewport = page.getViewport({ scale: 1 });

    const dimensions = {
      pdfWidth: viewport.width,
      pdfHeight: viewport.height,
      renderWidth: page.width,
      renderHeight: page.height,
      scale: page.scale,
      viewport: viewport,
    };

    setPageDimensions(dimensions);
    onPageLoadSuccess?.(page, pageNum);

    // Log for debugging
    console.log(`📄 Page ${pageNum} loaded:`, {
      pdfSize: `${dimensions.pdfWidth.toFixed(1)}x${dimensions.pdfHeight.toFixed(1)} pt`,
      renderSize: `${dimensions.renderWidth.toFixed(0)}x${dimensions.renderHeight.toFixed(0)} px`,
      scale: dimensions.scale,
      fieldsOnPage: fields.filter(f => f.page === pageNum).length
    });
    console.groupCollapsed(`📄 PDF PAGE READY → Page ${pageNum}`);
    console.log('PDF Size (pt):', {
      width: viewport.width,
      height: viewport.height,
    });
    console.log('Rendered Size (px):', {
      width: page.width,
      height: page.height,
    });
    console.log('Scale:', page.scale);
    console.log(
      'Fields on this page:',
      fields.filter(f => f.page === pageNum).length
    );
    console.groupEnd();

  }, [pageNum, onPageLoadSuccess, fields]);

  // 🔧 ADDED: Fallback click handler for PDF canvas (if overlay fails)
  const handleCanvasClick = useCallback((e) => {
    if (mode !== 'edit' || !pageDimensions || fields.length === 0) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Find clicked field on this page
    const pageFields = fields.filter(field => field.page === pageNum);

    for (const field of pageFields) {
      const isCompleted = completedFields[field.id] || false;
      if (isCompleted) continue;

      const screenPos = convertPdfToScreenCoordinates(field, pageDimensions, scale);

      if (!screenPos.isValid) continue;

      // Check if click is within field bounds
      const isInX = clickX >= screenPos.left && clickX <= screenPos.left + screenPos.width;
      const isInY = clickY >= screenPos.top && clickY <= screenPos.top + screenPos.height;

      if (isInX && isInY) {
        console.log(`🎯 Field ${field.id} clicked via canvas fallback`);
        e.stopPropagation();
        e.preventDefault();
        onFieldClick(field);
        return;
      }
    }
  }, [pageNum, fields, completedFields, onFieldClick, pageDimensions, mode, scale]);

  return (
    <Box
      ref={pageRef}
      data-page-number={pageNum}
      sx={{
        position: 'relative',
        marginBottom: '24px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.97)',
        borderRadius: 1,
        cursor: 'default',
        // Ensure proper stacking context
        isolation: 'isolate',
      }}
    >
      {/* PDF Canvas Layer */}
      <Box
        ref={canvasRef}
        sx={{
          position: 'relative',
          zIndex: 1, // PDF at lowest z-index
          cursor: 'default',
        }}
        onClick={handleCanvasClick}
      >
        <Page
          pageNumber={pageNum}
          scale={scale}
          renderAnnotationLayer={false}
          renderTextLayer={true}
          onLoadSuccess={handlePageLoadSuccess}
          canvasRef={canvasRef}
        />
      </Box>

      {/* 🔧 ADDED: Field Overlay Layer (Zoho-style) */}
      {pageDimensions && showFields && mode === 'edit' && (
        <PageOverlayContainer
          pageNum={pageNum}
          fields={fields}
          pageDimensions={pageDimensions}
          scale={scale}
          onFieldClick={onFieldClick}
          fieldValues={fieldValues}
          completedFields={completedFields}
          mode={mode}
          recipientColors={recipientColors}
          fieldTypesConfig={FIELD_TYPES}
        />
      )}

      {/* Debug overlay (development only) */}
      {process.env.NODE_ENV === 'development' && pageDimensions && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '1px dashed rgba(255, 0, 0, 0.3)',
            pointerEvents: 'none',
            zIndex: 300,
          }}
        >
          <Typography
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              fontSize: '10px',
              color: 'red',
              backgroundColor: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid red',
            }}
          >
            Page {pageNum} | Scale: {scale.toFixed(2)}x
          </Typography>
        </Box>
      )}
    </Box>
  );
});

PdfPageWithOverlay.displayName = 'PdfPageWithOverlay';

// ======================
// FIELD TYPES CONFIGURATION (Keep existing)
// ======================

const FIELD_TYPES = {
  signature: {
    label: 'Signature',
    placeholder: 'Tap to sign',
    defaultWidth: 180,
    defaultHeight: 60,
    icon: SignatureIcon,
    color: '#1976d2',
    emoji: '✍️',
    category: 'signature'
  },
  initials: {
    label: 'Initials',
    placeholder: 'Tap for initials',
    defaultWidth: 70,
    defaultHeight: 32,
    icon: SignatureIcon,
    color: '#1976d2',
    emoji: '📝',
    category: 'signature'
  },
  date: {
    label: 'Date',
    placeholder: 'Select date',
    defaultWidth: 120,
    defaultHeight: 32,
    icon: DateIcon,
    color: '#4caf50',
    emoji: '📅',
    category: 'form'
  },
  textbox: {
    label: 'Text Field',
    placeholder: 'Enter text',
    defaultWidth: 160,
    defaultHeight: 32,
    icon: TextIcon,
    color: '#2196f3',
    emoji: '📋',
    category: 'form'
  },
  checkbox: {
    label: 'Checkbox',
    placeholder: 'Check here',
    defaultWidth: 32,
    defaultHeight: 32,
    icon: CheckboxIcon,
    color: '#9c27b0',
    emoji: '☐',
    category: 'form'
  },
  radio: {
    label: 'Radio Button',
    placeholder: 'Select option',
    defaultWidth: 32,
    defaultHeight: 32,
    icon: RadioIcon,
    color: '#9c27b0',
    emoji: '○',
    category: 'form'
  },
  dropdown: {
    label: 'Dropdown',
    placeholder: 'Choose option',
    defaultWidth: 120,
    defaultHeight: 32,
    icon: DropdownIcon,
    color: '#ff9800',
    emoji: '▼',
    category: 'form'
  },
  attachment: {
    label: 'Attachment',
    placeholder: 'Attach file',
    defaultWidth: 120,
    defaultHeight: 32,
    icon: AttachmentIcon,
    color: '#795548',
    emoji: '📎',
    category: 'form'
  },
  approval: {
    label: 'Approval',
    placeholder: 'Tap to approve',
    defaultWidth: 120,
    defaultHeight: 32,
    icon: ApprovalIcon,
    color: '#4caf50',
    emoji: '👍',
    category: 'signature'
  },
  witness_signature: {
    label: 'Witness Signature',
    placeholder: 'Witness sign here',
    defaultWidth: 180,
    defaultHeight: 60,
    icon: SignatureIcon,
    color: '#ff9800',
    emoji: '👁️',
    category: 'signature'
  },
  stamp: {
    label: 'Stamp',
    placeholder: 'Apply stamp',
    defaultWidth: 100,
    defaultHeight: 100,
    icon: SignatureIcon,
    color: '#f44336',
    emoji: '🖋️',
    category: 'signature'
  },
  mail: {
    label: 'Email',
    placeholder: 'Enter email',
    defaultWidth: 160,
    defaultHeight: 32,
    icon: TextIcon,
    color: '#2196f3',
    emoji: '📧',
    category: 'form'
  },
};

// ======================
// UTILITY FUNCTIONS (Keep existing)
// ======================

const getFieldDisplayName = (type) => {
  return FIELD_TYPES[type]?.label || type;
};

const getFieldIcon = (type) => {
  const IconComponent = FIELD_TYPES[type]?.icon || SignIcon;
  return <IconComponent />;
};

const getFieldColor = (type) => {
  return FIELD_TYPES[type]?.color || '#1976d2';
};

const getFieldEmoji = (type) => {
  return FIELD_TYPES[type]?.emoji || '📋';
};

const getFieldPlaceholder = (field) => {
  const fieldType = FIELD_TYPES[field.type];

  if (field.placeholder) return field.placeholder;
  if (field.label) return `Enter ${field.label.toLowerCase()}`;

  return fieldType?.placeholder || `Enter ${getFieldDisplayName(field.type).toLowerCase()}`;
};

// ======================
// MAIN COMPONENT - RecipientSigningPage (Enhanced)
// ======================

const RecipientSigningPage = () => {
  // 🔧 KEEP ALL EXISTING STATE VARIABLES
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [signingInfo, setSigningInfo] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [signatureFields, setSignatureFields] = useState([]);
  const [documentUrl, setDocumentUrl] = useState('');
  const [signedPreviewUrl, setSignedPreviewUrl] = useState('');
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [completedFields, setCompletedFields] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageDimensions, setPageDimensions] = useState({});
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(true);
  const [previewMode, setPreviewMode] = useState('fields');
  const [showFields, setShowFields] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [numPagesLoaded, setNumPagesLoaded] = useState(0);

  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // 🔧 ADDED: Recipient colors for visual identification
  const [recipientColors, setRecipientColors] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pdfContainerRef = useRef(null);
  const pdfScrollContainerRef = useRef(null);
  const pageRefs = useRef({});
  const observerRef = useRef(null);

  const steps = ['Verify OTP', 'View & Sign Document', 'Completion'];

  // Extract recipient ID from URL
  const recipientId = window.location.pathname.split('/').pop();

  // ======================
  // 🔧 ENHANCED: Field Click Handler (Zoho-style)
  // ======================

  const handleFieldClick = useCallback((field) => {
    console.log('🎯 Field clicked (Zoho-style):', {
      id: field.id,
      type: field.type,
      label: field.label || getFieldDisplayName(field.type),
      page: field.page,
      coordinates: {
        pdf_x: field.pdf_x,
        pdf_y: field.pdf_y,
        canvas_x: field.canvas_x,
        canvas_y: field.canvas_y
      },
      recipient: field.recipient_name
    });

    // Set selected field
    setSelectedField(field);

    // Scroll to the page
    const pageNum = field.page;
    setActivePage(pageNum);

    // Smooth scroll to the page
    setTimeout(() => {
      const pageElement = document.querySelector(`[data-page-number="${pageNum}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Open signature dialog immediately (Zoho-style)
    setSignDialogOpen(true);

    // Visual feedback
    const fieldElement = document.querySelector(`[data-field-id="${field.id}"]`);
    if (fieldElement) {
      fieldElement.style.transform = 'scale(1.05)';
      fieldElement.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.5)';
      setTimeout(() => {
        if (fieldElement) {
          fieldElement.style.transform = '';
          fieldElement.style.boxShadow = '';
        }
      }, 300);
    }
  }, []);

  // 🔧 ADDED: Enhanced signature save handler
  const handleSignatureSave = useCallback((signatureData) => {
    if (selectedField) {
      const field = selectedField;
      let valueToSave;

      // Handle different field types
      if (field.type === 'signature' || field.type === 'initials' || field.type === 'witness_signature') {
        let imageData;
        if (typeof signatureData === 'string') {
          imageData = signatureData;
        } else if (typeof signatureData === 'object' && signatureData.image) {
          imageData = signatureData.image;
        } else {
          imageData = signatureData;
        }

        valueToSave = {
          image: imageData,
          page: field.page,
          pdf_x: field.pdf_x,
          pdf_y: field.pdf_y,
          pdf_width: field.pdf_width,
          pdf_height: field.pdf_height,
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          timestamp: new Date().toISOString(),
          ip_address: 'captured',
          user_agent: navigator.userAgent
        };
      } else if (field.type === 'checkbox' || field.type === 'approval') {
        valueToSave = Boolean(signatureData);
      } else if (field.type === 'date') {
        valueToSave = signatureData;
      } else {
        valueToSave = signatureData;
      }

      // Update field value
      setFieldValues(prev => ({
        ...prev,
        [field.id]: valueToSave
      }));

      // Show success message
      setSuccess(`${getFieldDisplayName(field.type)} saved as draft!`);
      setTimeout(() => setSuccess(''), 3000);

      // Auto-close dialog after brief delay
      setTimeout(() => {
        setSignDialogOpen(false);
        setSelectedField(null);
      }, 500);
    }
  }, [selectedField]);

  // ======================
  // API FUNCTIONS (Keep existing with enhancements)
  // ======================

  const fetchRecipientInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recipient information');
      }

      const data = await response.json();
      setRecipientInfo(data.recipient);
      setDocumentInfo(data.document);
      setSigningInfo(data.signing_info);

      // Update local terms occupancy state
      if (data.recipient.terms_accepted) {
        setTermsAccepted(true);
        if (data.recipient.terms_auto_accepted) {
          setSuccess('Terms & conditions auto-accepted based on your preferences.');
          setTimeout(() => setSuccess(''), 5000);
        }
      }

      // Check terms status
      if (data.signing_info?.requires_terms) {
        setTermsDialogOpen(true);
        return;
      }

      if (data.signing_info?.terms_status === 'declined') {
        setCurrentStep(2);
        setError('You have declined the terms and conditions.');
        return;
      }

      // If terms accepted, check OTP
      if (data.recipient.otp_verified && data.recipient.terms_accepted) {
        setCurrentStep(1);
        await fetchSignatureFields();
        await loadDocument();
      } else {
        // If OTP not verified, stay at step 0
        setCurrentStep(0);

        // Ensure terms dialog stays open if needed
        if (data.signing_info?.requires_terms) {
          setTermsDialogOpen(true);
        }
      }

      if (data.recipient.status === 'completed') {
        setCurrentStep(2);
        setSuccess('Document signing already completed.');
      }

    } catch (err) {
      setError(err.message || 'Failed to load signing page');
    } finally {
      setLoading(false);
    }
  };

  const fetchSignatureFields = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/fields`);

      if (!response.ok) {
        if (recipientInfo?.role === 'viewer') {
          setSignatureFields([]);
          return;
        }
        throw new Error('Failed to fetch signature fields');
      }

      const fields = await response.json();
      console.log('📋 Loaded signature fields:', fields.length, 'fields');

      // 🔧 ADDED: Generate recipient colors
      const colors = generateRecipientColors(fields);
      setRecipientColors(colors);

      setSignatureFields(fields);

      const initialValues = {};
      const completed = {};
      fields.forEach(field => {
        if (field.value) {
          // Handle different field types
          if (field.type === 'signature' || field.type === 'initials' || field.type === 'witness_signature') {
            // Handle image signatures
            if (typeof field.value === 'object' && field.value.image) {
              initialValues[field.id] = {
                image: field.value.image,
                ...field.value.coordinates
              };
            } else if (typeof field.value === 'string' && field.value.startsWith('data:image')) {
              initialValues[field.id] = {
                image: field.value,
                page: field.page,
                pdf_x: field.pdf_x,
                pdf_y: field.pdf_y,
                pdf_width: field.pdf_width,
                pdf_height: field.pdf_height,
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height,
              };
            } else {
              initialValues[field.id] = field.value;
            }
          } else if (field.type === 'checkbox' || field.type === 'approval') {
            initialValues[field.id] = Boolean(field.value);
          } else if (field.type === 'date') {
            try {
              initialValues[field.id] = new Date(field.value).toISOString().split('T')[0];
            } catch {
              initialValues[field.id] = field.value;
            }
          } else {
            initialValues[field.id] = field.value;
          }
        } else {
          initialValues[field.id] = '';
        }

        if (field.completed_at) {
          completed[field.id] = true;
        }
      });
      setFieldValues(initialValues);
      setCompletedFields(completed);

    } catch (err) {
      if (recipientInfo?.role !== 'viewer') {
        console.error('Failed to load fields:', err);
        setError('Failed to load signature fields');
      }
    }
  };

  const loadDocument = async () => {
    try {
      setPdfLoading(true);

      const queryParams = new URLSearchParams({
        show_fields: 'true',
        include_signatures: 'true',
        preview_type: 'all',
        render_type: 'values',
        use_recipient_colors: 'true',
        show_envelope_header: 'true'
      });

      const response = await fetch(
        `${API_BASE_URL}/signing/recipient/${recipientId}/live-document?${queryParams}`
      );

      if (!response.ok) {
        console.warn('Live document endpoint failed, falling back to regular document');
        return await loadRegularDocument();
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }

      setDocumentUrl(url);
      console.log('Live document loaded with envelope header');

    } catch (err) {
      console.error('Failed to load live document:', err);
      setError(`Failed to load document: ${err.message}`);

      try {
        await loadRegularDocument();
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const loadRegularDocument = async () => {
    try {
      const queryParams = new URLSearchParams({
        show_fields: 'true',
        include_signatures: 'true',
        preview_type: 'all',
        render_type: 'values',
        use_recipient_colors: 'true',
        show_envelope_header: 'true'
      });

      const response = await fetch(
        `${API_BASE_URL}/signing/recipient/${recipientId}/document?${queryParams}`
      );

      if (!response.ok) throw new Error('Failed to load document');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }

      setDocumentUrl(url);
    } catch (err) {
      throw err;
    }
  };

  const loadSignedPreview = async () => {
    try {
      setPdfLoading(true);

      const fieldData = signatureFields.map(f => {
        const value = fieldValues[f.id];
        return {
          id: f.id,
          page: f.page,
          type: f.type,
          value: value || null,
          x: f.x || f.pdf_x,
          y: f.y || f.pdf_y,
          width: f.width || f.pdf_width,
          height: f.height || f.pdf_height,
          pdf_x: f.pdf_x,
          pdf_y: f.pdf_y,
          pdf_width: f.pdf_width,
          pdf_height: f.pdf_height,
          canvas_x: f.canvas_x,
          canvas_y: f.canvas_y,
        };
      });

      const queryParams = new URLSearchParams({
        include_audit_trail: 'true',
        include_all_fields: 'true',
        show_envelope_header: 'true'
      });

      const response = await fetch(
        `${API_BASE_URL}/signing/recipient/${recipientId}/signed-preview?${queryParams}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            fields: fieldData,
            include_signatures: true
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load signed preview');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setSignedPreviewUrl(url);
      setPreviewMode('signed');

      console.log('Signed preview loaded with envelope header');

    } catch (err) {
      console.error('Failed to load signed preview:', err);
      setPreviewMode('fields');
      setError('Could not load signed preview. Using edit mode instead.');
    } finally {
      setPdfLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'OTP verification failed');
      }

      const data = await response.json();
      if (data.verified) {
        setOtpVerified(true);
        await fetchSignatureFields();
        await loadDocument();
        setCurrentStep(1);
        setSuccess('Identity verified successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkTermsAcceptance = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/terms-status`);
        if (response.ok) {
          const data = await response.json();
          if (data.terms_accepted) {
            setTermsAccepted(true);
          } else {
            setTermsDialogOpen(true);
          }

          if (data.terms_declined) {
            setCurrentStep(2);
            setError('You have declined the terms and conditions.');
          }
        }
      } catch (err) {
        console.error('Error checking terms status:', err);
        setTermsDialogOpen(true);
      }
    };

    if (recipientInfo && !recipientInfo.terms_accepted) {
      checkTermsAcceptance();
    }
  }, [recipientInfo]);

  const acceptTerms = async (acceptAlways = false) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/accept-terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted: true,
          accept_always: acceptAlways,
          accepted_at: new Date().toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        })
      });

      if (response.ok) {
        setTermsAccepted(true);
        setTermsDialogOpen(false);
        setSuccess('Terms accepted successfully');

        if (recipientInfo?.otp_verified) {
          setCurrentStep(1);
        }
      } else {
        throw new Error('Failed to accept terms');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const declineTerms = async (reason) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/decline-terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          declined: true,
          decline_reason: reason,
          declined_at: new Date().toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        })
      });

      if (response.ok) {
        setTermsDialogOpen(false);
        setTermsAccepted(false);
        setCurrentStep(2);
        setError('You have declined the terms and conditions. Signing process cancelled.');

        setTimeout(() => {
          window.close();
        }, 5000);
      } else {
        throw new Error('Failed to decline terms');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeField = async (fieldId) => {
    try {
      setLoading(true);
      setError('');

      const fieldValue = fieldValues[fieldId];
      const field = signatureFields.find(f => f.id === fieldId);

      if (!fieldValue) {
        throw new Error('Please fill in the field before completing');
      }

      let valueData = {};

      if (field.type === 'signature' || field.type === 'initials' || field.type === 'witness_signature') {
        let imageData;
        if (typeof fieldValue === 'string') {
          imageData = fieldValue;
        } else if (typeof fieldValue === 'object' && fieldValue.image) {
          imageData = fieldValue.image;
        } else {
          throw new Error('Invalid signature format');
        }

        valueData = {
          value: {
            image: imageData,
            coordinates: {
              page: field.page,
              x: field.x || field.pdf_x,
              y: field.y || field.pdf_y,
              width: field.width || field.pdf_width,
              height: field.height || field.pdf_height,
              pdf_x: field.pdf_x,
              pdf_y: field.pdf_y,
            }
          }
        };
      } else if (field.type === 'date') {
        valueData = {
          value: new Date(fieldValue).toISOString()
        };
      } else if (field.type === 'checkbox' || field.type === 'approval') {
        valueData = {
          value: fieldValue ? 'true' : 'false'
        };
      } else {
        valueData = {
          value: fieldValue
        };
      }

      const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/fields/${fieldId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete field');
      }

      const result = await response.json();
      console.log('Field completion result:', result);

      setCompletedFields(prev => ({ ...prev, [fieldId]: true }));
      setSignDialogOpen(false);
      setSelectedField(null);

      setSuccess(`Field "${getFieldDisplayName(field.type)}" completed successfully!`);
      setTimeout(() => setSuccess(''), 3000);

      if (documentUrl && otpVerified) {
        await loadDocument();
      }

      const allCompleted = signatureFields.every(f => completedFields[f.id] || f.id === fieldId);
      if (allCompleted && signatureFields.length > 0) {
        setTimeout(() => {
          setCurrentStep(2);
          setSuccess('All fields completed! Signing process finished.');
        }, 1000);
      }

    } catch (err) {
      console.error('Error completing field:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeSigning = async () => {
    try {
      setLoading(true);
      setError('');

      if (recipientInfo?.role === 'viewer' && signatureFields.length === 0) {
        const res = await fetch(
          `${API_BASE_URL}/signing/recipient/${recipientId}/viewer-complete`,
          {
            method: "POST",
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Failed to complete viewer review");
        }

        setRecipientInfo(prev => ({
          ...prev,
          status: 'completed',
          viewer_at: new Date().toISOString()
        }));
        setCurrentStep(2);
        setSuccess("Document review completed successfully!");
      } else {
        const incompleteFields = signatureFields.filter(field =>
          !completedFields[field.id] && !fieldValues[field.id]
        );

        if (incompleteFields.length > 0) {
          throw new Error('Please complete all required fields before finishing');
        }

        for (const field of signatureFields) {
          if (fieldValues[field.id] && !completedFields[field.id]) {
            await completeField(field.id);
          }
        }

        // Final completion call to mark the recipient as 'completed' in database
        // and trigger automatic document finalization if this is the last recipient.
        const completeRes = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!completeRes.ok) {
          const errorData = await completeRes.json();
          throw new Error(errorData.detail || 'Failed to finalize document signing');
        }

        const completeData = await completeRes.json();

        // Refresh local recipient info if status changed
        if (completeData.recipient_status === 'completed') {
          setRecipientInfo(prev => ({ ...prev, status: 'completed' }));
        }

        setCurrentStep(2);
        setSuccess("Document signing completed successfully!");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/resend-otp`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to resend OTP');
      }

      setSuccess('New OTP has been sent to your email');
      setTimeout(() => setSuccess(''), 5000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (type = 'current') => {
    try {
      let url;
      let filename;

      if (type === 'signed' && signedPreviewUrl) {
        url = signedPreviewUrl;
        filename = `${documentInfo?.filename?.split('.')[0] || 'document'}_signed.pdf`;
      } else if (type === 'package') {
        const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/download/package`);
        if (!response.ok) throw new Error('Document package (ZIP) is not yet available. Please wait for overall completion.');

        const blob = await response.blob();
        url = URL.createObjectURL(blob);
        filename = `${documentInfo?.filename?.split('.')[0] || 'document'}_package.zip`;
      } else {
        // Use the dedicated signed download endpoint for better rendering
        const endpoint = recipientInfo?.status === 'completed'
          ? `/signing/recipient/${recipientId}/download/signed`
          : `/signing/recipient/${recipientId}/document`;

        const response = await fetch(`${API_BASE_URL}${endpoint}`);

        if (!response.ok) {
          throw new Error('Failed to download document');
        }

        const blob = await response.blob();
        url = window.URL.createObjectURL(blob);
        filename = documentInfo?.filename || 'document.pdf';
        if (recipientInfo?.status === 'completed' && !filename.startsWith('signed_')) {
          filename = `signed_${filename}`;
        }
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.message);
    }
  };

  // ======================
  // EVENT HANDLERS (Enhanced)
  // ======================

  useEffect(() => {
    if (selectedField && !signDialogOpen) {
      setSignDialogOpen(true);
    }
  }, [selectedField]);

  const handlePageLoadSuccess = useCallback((page, pageNum) => {
    const viewport = page.getViewport({ scale: 1.0 });

    const pdfWidth = viewport.width;
    const pdfHeight = viewport.height;
    const renderWidth = page.width;
    const renderHeight = page.height;

    console.log(`📄 Page ${pageNum} dimensions:`, {
      pdfWidth: pdfWidth.toFixed(1),
      pdfHeight: pdfHeight.toFixed(1),
      renderWidth: renderWidth.toFixed(0),
      renderHeight: renderHeight.toFixed(0),
      scale: page.scale
    });

    setPageDimensions(prev => ({
      ...prev,
      [pageNum]: {
        pdfWidth,
        pdfHeight,
        renderWidth,
        renderHeight,
        scale: page.scale
      }
    }));

    setNumPagesLoaded(prev => {
      const newCount = prev + 1;
      if (newCount === numPages) {
        console.log('All pages loaded');
      }
      return newCount;
    });
  }, [numPages]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setNumPagesLoaded(0);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF document');
    setPdfLoading(false);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const fitToScreen = () => setScale(1.0);

  const toggleFullscreen = () => {
    if (!pdfContainerRef.current) return;

    if (!isFullscreen) {
      if (pdfContainerRef.current.requestFullscreen) {
        pdfContainerRef.current.requestFullscreen();
      } else if (pdfContainerRef.current.webkitRequestFullscreen) {
        pdfContainerRef.current.webkitRequestFullscreen();
      } else if (pdfContainerRef.current.msRequestFullscreen) {
        pdfContainerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const togglePreviewMode = () => {
    if (previewMode === 'fields') {
      loadSignedPreview();
    } else {
      setPreviewMode('fields');
    }
  };

  // ======================
  // EFFECTS
  // ======================

  useEffect(() => {
    fetchRecipientInfo();
    return () => {
      if (documentUrl) URL.revokeObjectURL(documentUrl);
      if (signedPreviewUrl) URL.revokeObjectURL(signedPreviewUrl);
    };
  }, [recipientId]);

  useEffect(() => {
    if (currentStep === 1 && otpVerified && !documentUrl) {
      loadDocument();
    }
  }, [currentStep, otpVerified]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile, currentStep]);

  // ======================
  // COMPUTED VALUES
  // ======================

  const getRoleDisplayName = (role) => {
    if (!role) return 'Unknown Role';
    if (typeof role === "object" && role.value) {
      role = role.value;
    }
    role = String(role).toLowerCase();

    const names = {
      signer: 'Signer',
      approver: 'Approver',
      viewer: 'Viewer',
      witness: 'Witness',
      form_filler: 'Form Filler',
      in_person_signer: 'In-Person Signer'
    };

    return names[role] || 'Unknown Role';
  };

  const pendingFieldsCount = signatureFields.filter(f => !completedFields[f.id] && !fieldValues[f.id]).length;
  const completedFieldsCount = signatureFields.filter(f => completedFields[f.id]).length;
  const draftedFieldsCount = signatureFields.filter(f => !completedFields[f.id] && fieldValues[f.id]).length;

  // ======================
  // RENDER
  // ======================

  if (loading && !recipientInfo) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !recipientInfo) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchRecipientInfo}>Retry</Button>
      </Container>
    );
  }

  if (!recipientInfo) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Unable to load signing information.</Alert>
      </Container>
    );
  }

  return (
    <>
      <GlobalStyles />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <style>
          {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes pulseRing {
            0% { transform: scale(0.95); opacity: 0.7; }
            70% { transform: scale(1.1); opacity: 0; }
            100% { opacity: 0; }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-5px); }
            60% { transform: translateY(-3px); }
          }
          
          @keyframes fadeInRight {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          /* Zoho-style field animations */
          .field-highlight {
            animation: pulse 0.5s ease-in-out;
          }
          
          .field-completed {
            opacity: 0.7;
            cursor: not-allowed !important;
          }
          
          .field-pending {
            animation: pulse 2s infinite;
          }
        `}
        </style>

        {/* Header */}
        <AppBar position="sticky" elevation={1} color="default" sx={{ bgcolor: 'white', zIndex: 1200 }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" color="primary">
                Document {recipientInfo.role === 'viewer' ? 'Review' : 'Signing'} Portal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {documentInfo?.filename}
              </Typography>
              <Chip
                label={getRoleDisplayName(recipientInfo?.role)}
                color="primary"
                size="small"
                variant="outlined"
              />

              {/* Terms Acceptance Status Chip */}
              {recipientInfo && (
                <Chip
                  label={termsAccepted ? "Terms Accepted" : "Terms Pending"}
                  color={termsAccepted ? "success" : "warning"}
                  size="small"
                  icon={termsAccepted ? <CheckIcon /> : <WarningIcon />}
                  variant="filled"
                />
              )}
              {currentStep === 1 && termsAccepted && (
                <Chip
                  label={previewMode === 'signed' ? 'Signed Preview' : 'Edit Mode'}
                  color={previewMode === 'signed' ? 'success' : 'primary'}
                  size="small"
                  variant="filled"
                  icon={previewMode === 'signed' ? <PreviewIcon /> : <SignIcon />}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge badgeContent={pendingFieldsCount} color="error">
                <IconButton
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  sx={{ display: { xs: 'flex', lg: 'none' } }}
                >
                  <MenuIcon />
                </IconButton>
              </Badge>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Stepper */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 0, position: 'sticky', top: 0, zIndex: 1100 }}>
          <Container maxWidth="xl">
            <Stepper activeStep={currentStep} sx={{ mb: 1, overflowX: 'auto' }}>
              {steps.map((label) => (
                <Step key={label} sx={{ minWidth: 100 }}>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: { xs: '0.75rem', sm: '0.9rem' } } }}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 1 }} onClose={() => setSuccess('')}>{success}</Alert>}
          </Container>
        </Paper>

        {/* Step 0: OTP Verification */}
        {currentStep === 0 && (
          <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
              <Box textAlign="center" mb={3}>
                <VerifiedIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>Verify Your Identity</Typography>
                <Typography variant="body2" color="text.secondary">
                  Enter the OTP sent to your email
                </Typography>
              </Box>

              <Box sx={{ maxWidth: 300, mx: 'auto' }}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Signing Details</Typography>
                    <Typography variant="body2"><strong>Name:</strong> {recipientInfo.name}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {recipientInfo.email}</Typography>
                    <Typography variant="body2"><strong>Role:</strong> {getRoleDisplayName(recipientInfo?.role)}</Typography>
                    <Typography variant="body2"><strong>Document:</strong> {documentInfo?.filename}</Typography>
                  </CardContent>
                </Card>

                <TextField
                  fullWidth
                  label="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  margin="normal"
                  placeholder="6-digit code"
                  inputProps={{ maxLength: 6 }}
                />

                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button
                    variant="contained"
                    onClick={verifyOtp}
                    disabled={!otp || otp.length !== 6 || loading}
                    fullWidth
                    size="large"
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
                  </Button>

                  <Button
                    variant="text"
                    onClick={resendOtp}
                    disabled={loading}
                    startIcon={<RefreshIcon />}
                    fullWidth
                  >
                    Resend OTP
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Container>
        )}

        {/* Step 1: Signing Interface */}
        {currentStep === 1 && (
          <Box sx={{
            display: 'flex',
            height: 'calc(100vh - 140px)',
            position: 'relative',
          }}>
            {/* Main PDF Viewer */}
            <Box
              ref={pdfContainerRef}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                mr: rightSidebarExpanded ? 2 : 0,
                transition: 'margin-right 0.3s ease'
              }}
            >
              {/* Toolbar */}
              <Paper
                elevation={1}
                sx={{
                  m: 2,
                  mb: 1,
                  p: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: 1,
                  zIndex: 1000,
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ minWidth: 80 }}>
                    Page {activePage} of {numPages || '?'}
                  </Typography>

                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton size="small" onClick={zoomOut} title="Zoom Out">
                      <ZoomOutIcon />
                    </IconButton>
                    <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
                      {Math.round(scale * 100)}%
                    </Typography>
                    <IconButton size="small" onClick={zoomIn} title="Zoom In">
                      <ZoomInIcon />
                    </IconButton>
                    <IconButton size="small" onClick={fitToScreen} title="Fit to Screen">
                      <FitScreenIcon />
                    </IconButton>
                    <IconButton size="small" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                      {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    </IconButton>
                  </Box>

                  {previewMode === 'fields' && signatureFields.length > 0 && (
                    <>
                      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showFields}
                            onChange={(e) => setShowFields(e.target.checked)}
                            size="small"
                            color="primary"
                          />
                        }
                        label="Show Fields"
                        sx={{ m: 0 }}
                      />
                    </>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <IconButton
                    onClick={loadDocument}
                    title="Refresh Live Document"
                    disabled={pdfLoading}
                    size="small"
                  >
                    {pdfLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  </IconButton>

                  <Button
                    variant={previewMode === 'signed' ? 'contained' : 'outlined'}
                    color={previewMode === 'signed' ? 'success' : 'primary'}
                    onClick={togglePreviewMode}
                    startIcon={previewMode === 'signed' ? <ViewIcon /> : <PreviewIcon />}
                    size="small"
                    disabled={pdfLoading || !documentUrl}
                  >
                    {previewMode === 'signed' ? 'Back to Edit' : 'Preview Signed'}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => downloadDocument(previewMode === 'signed' ? 'signed' : 'current')}
                    startIcon={<DownloadIcon />}
                    size="small"
                  >
                    Download
                  </Button>

                  <Button
                    variant="contained"
                    onClick={completeSigning}
                    disabled={loading || (signatureFields.length > 0 && pendingFieldsCount > 0)}
                    size="small"
                    sx={{ minWidth: 140 }}
                  >
                    {loading ? <CircularProgress size={20} /> :
                      recipientInfo.role === 'viewer' ? 'Complete Review' : 'Complete Signing'}
                  </Button>
                </Box>
              </Paper>

              {/* PDF Container */}
              <Box
                ref={pdfScrollContainerRef}
                sx={{
                  flex: 1,
                  position: 'relative',
                  overflow: 'auto',
                  m: 2,
                  mt: 0,
                  bgcolor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  '&::-webkit-scrollbar': { width: 8 },
                  '&::-webkit-scrollbar-track': { backgroundColor: '#f1f1f1' },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#888', borderRadius: 4 },
                  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#555' },
                }}
              >
                {pdfLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (previewMode === 'signed' ? signedPreviewUrl : documentUrl) && (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 2,
                  }}>
                    <Document
                      file={previewMode === 'signed' ? signedPreviewUrl : documentUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={<CircularProgress />}
                      noData="No PDF file specified"
                    >
                      {Array.from(new Array(numPages), (el, index) => {
                        const pageNum = index + 1;
                        return (
                          <PdfPageWithOverlay
                            key={`page-${pageNum}`}
                            pageNum={pageNum}
                            scale={scale}
                            documentUrl={previewMode === 'signed' ? signedPreviewUrl : documentUrl}
                            fields={signatureFields}
                            onFieldClick={handleFieldClick}
                            fieldValues={fieldValues}
                            completedFields={completedFields}
                            showFields={showFields && previewMode === 'fields'}
                            mode={previewMode === 'signed' ? 'view' : 'edit'}
                            onPageLoadSuccess={handlePageLoadSuccess}
                            recipientColors={recipientColors}
                          />
                        );
                      })}
                    </Document>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Sidebar Toggle */}
            <Box sx={{
              position: 'absolute',
              right: rightSidebarExpanded ? 320 : 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1000,
              transition: 'right 0.3s ease'
            }}>
              <IconButton
                onClick={() => setRightSidebarExpanded(!rightSidebarExpanded)}
                sx={{
                  backgroundColor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRight: 0,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  boxShadow: 2,
                  '&:hover': {
                    backgroundColor: 'grey.100',
                    transform: 'translateX(-2px)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                {rightSidebarExpanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Box>

            {/* Right Sidebar */}
            <Box sx={{
              width: rightSidebarExpanded ? 320 : 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              opacity: rightSidebarExpanded ? 1 : 0,
              visibility: rightSidebarExpanded ? 'visible' : 'hidden',
            }}>
              {rightSidebarExpanded && (
                <Fade in={rightSidebarExpanded}>
                  <Paper
                    elevation={1}
                    sx={{
                      height: '100%',
                      m: 2,
                      ml: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SignIcon />
                          Signing Status
                        </Typography>
                        {isMobile && (
                          <IconButton onClick={() => setSidebarOpen(false)} size="small">
                            <CloseIcon />
                          </IconButton>
                        )}
                      </Box>

                      <Tabs
                        value={activeTab}
                        onChange={(e, val) => setActiveTab(val)}
                        sx={{ mb: 2 }}
                      >
                        <Tab icon={<AssignmentIcon />} label="Fields" />
                        <Tab icon={<HistoryIcon />} label="Progress" />
                      </Tabs>

                      {activeTab === 0 ? (
                        <>
                          {/* Progress Summary */}
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {completedFieldsCount} signed
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {draftedFieldsCount} drafted
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {pendingFieldsCount} pending
                              </Typography>
                            </Box>
                            <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 1, height: 6 }}>
                              <Box
                                sx={{
                                  width: `${signatureFields.length > 0 ? (completedFieldsCount / signatureFields.length) * 100 : 0}%`,
                                  bgcolor: '#4caf50',
                                  height: '100%',
                                  borderRadius: 1
                                }}
                              />
                              <Box
                                sx={{
                                  width: `${signatureFields.length > 0 ? (draftedFieldsCount / signatureFields.length) * 100 : 0}%`,
                                  bgcolor: '#2196f3',
                                  height: '100%',
                                  borderRadius: 1,
                                  marginLeft: `${signatureFields.length > 0 ? (completedFieldsCount / signatureFields.length) * 100 : 0}%`,
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Fields List */}
                          {signatureFields.length > 0 ? (
                            <>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                Fields to Complete:
                              </Typography>
                              <Box sx={{ flex: 1, overflow: 'auto' }}>
                                <List dense disablePadding>
                                  {signatureFields.map((field) => {
                                    const isCompleted = completedFields[field.id];
                                    const hasValue = !!fieldValues[field.id];
                                    const isRequired = field.required;

                                    return (
                                      <ListItem key={field.id} disablePadding>
                                        <ListItemButton
                                          disabled={isCompleted || previewMode === 'signed'}
                                          onClick={() => {
                                            if (!isCompleted && previewMode === 'fields') {
                                              handleFieldClick(field);
                                              const pageRef = pageRefs.current[field.page];
                                              if (pageRef) {
                                                pageRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                              }
                                            }
                                          }}
                                          sx={{
                                            borderRadius: 1,
                                            mb: 0.5,
                                            border: '1px solid',
                                            borderColor: isCompleted
                                              ? '#4caf50'
                                              : hasValue
                                                ? '#2196f3'
                                                : 'transparent',
                                            backgroundColor: isCompleted
                                              ? 'rgba(76,175,80,0.05)'
                                              : hasValue
                                                ? 'rgba(33,150,243,0.05)'
                                                : 'transparent',
                                            '&:hover:not(.Mui-disabled)': {
                                              backgroundColor: isCompleted
                                                ? 'rgba(76,175,80,0.1)'
                                                : hasValue
                                                  ? 'rgba(33,150,243,0.1)'
                                                  : 'rgba(0,0,0,0.04)',
                                            }
                                          }}
                                        >
                                          <ListItemIcon sx={{ minWidth: 36 }}>
                                            {getFieldIcon(field.type)}
                                          </ListItemIcon>

                                          <ListItemText
                                            primary={
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography component="span" variant="body2">
                                                  {getFieldDisplayName(field.type)}
                                                </Typography>

                                                {isCompleted && <CheckIcon color="success" fontSize="small" />}
                                                {!isCompleted && hasValue && <Chip label="Draft" size="small" />}
                                                {!isCompleted && isRequired && <WarningIcon color="warning" fontSize="small" />}
                                              </Box>
                                            }
                                            secondary={
                                              <Typography component="span" variant="caption">
                                                Page {field.page}
                                              </Typography>
                                            }
                                            primaryTypographyProps={{ component: 'div' }}
                                            secondaryTypographyProps={{ component: 'div' }}
                                          />

                                          {!isCompleted && previewMode !== 'signed' && (
                                            <Button
                                              size="small"
                                              variant={hasValue ? "contained" : "outlined"}
                                              color={hasValue ? "warning" : "primary"}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleFieldClick(field);
                                              }}
                                              sx={{ minWidth: 60, height: 28 }}
                                            >
                                              {hasValue ? 'Edit' : 'Sign'}
                                            </Button>
                                          )}
                                        </ListItemButton>
                                      </ListItem>
                                    );
                                  })}
                                </List>
                              </Box>
                            </>
                          ) : recipientInfo.role === 'viewer' ? (
                            <Box sx={{ textAlign: 'center', py: 4, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <ViewIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, mx: 'auto' }} />
                              <Typography variant="body1" color="text.secondary">
                                No signature fields required for review
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                              No signature fields assigned to you
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" gutterBottom>Document Progress</Typography>
                              <Typography variant="h4" color="primary">
                                {Math.round((completedFieldsCount / Math.max(signatureFields.length, 1)) * 100)}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {completedFieldsCount} of {signatureFields.length} fields completed
                              </Typography>
                            </CardContent>
                          </Card>

                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" gutterBottom>Signing Information</Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption">Role:</Typography>
                                  <Typography variant="caption">{getRoleDisplayName(recipientInfo?.role)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption">Status:</Typography>
                                  <Chip
                                    label={recipientInfo?.status || 'pending'}
                                    size="small"
                                    color={
                                      recipientInfo?.status === 'completed' ? 'success' :
                                        recipientInfo?.status === 'in_progress' ? 'warning' : 'default'
                                    }
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption">OTP Verified:</Typography>
                                  <Chip
                                    label={otpVerified ? 'Yes' : 'No'}
                                    size="small"
                                    color={otpVerified ? 'success' : 'error'}
                                  />
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      )}

                      {/* Completion Button */}
                      <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e0e0e0' }}>
                        <Button
                          variant="contained"
                          onClick={completeSigning}
                          disabled={loading || (signatureFields.length > 0 && pendingFieldsCount > 0) || previewMode === 'signed'}
                          fullWidth
                          size="medium"
                        >
                          {loading ? <CircularProgress size={24} /> :
                            recipientInfo.role === 'viewer' ? 'Complete Review' : 'Complete Signing'}
                        </Button>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                          {previewMode === 'signed' ? 'Switch to edit mode to sign' :
                            pendingFieldsCount > 0
                              ? `${pendingFieldsCount} required field(s) remaining`
                              : signatureFields.length > 0 ? 'All fields completed' : 'Ready to complete'}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Fade>
              )}
            </Box>
          </Box>
        )}

        {/* Step 2: Completion with Terms Declined */}
        {currentStep === 2 && recipientInfo?.terms_declined && (
          <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
              <Box textAlign="center">
                <CloseIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom color="error">
                  Signing Process Declined
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  You have declined the terms and conditions. The signing process has been cancelled.
                </Typography>

                <Card variant="outlined" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Decline Details</Typography>
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      <Box>
                        <Typography variant="body2"><strong>Document:</strong></Typography>
                        <Typography>{documentInfo?.filename}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2"><strong>Reason:</strong></Typography>
                        <Typography color="error">
                          {recipientInfo.terms_decline_reason || 'No reason provided'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2"><strong>Declined at:</strong></Typography>
                        <Typography>
                          {new Date(recipientInfo.terms_declined_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <Button
                  variant="contained"
                  onClick={() => window.close()}
                  startIcon={<CloseIcon />}
                  size="large"
                >
                  Close Window
                </Button>
              </Box>
            </Paper>
          </Container>
        )}

        {/* Step 2: Normal Completion */}
        {currentStep === 2 && !recipientInfo?.terms_declined && (
          <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
              <Box textAlign="center">
                <VerifiedIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  {recipientInfo.role === 'viewer' ? 'Review Complete!' : 'Signing Complete!'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {recipientInfo.role === 'viewer'
                    ? 'Thank you for reviewing the document.'
                    : 'Thank you for signing the document.'}
                </Typography>

                <Card variant="outlined" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Summary</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="body2"><strong>Document:</strong></Typography>
                        <Typography>{documentInfo?.filename}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2"><strong>Role:</strong></Typography>
                        <Typography>{getRoleDisplayName(recipientInfo?.role)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2"><strong>Name:</strong></Typography>
                        <Typography>{recipientInfo.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2"><strong>Completed:</strong></Typography>
                        <Typography>{new Date().toLocaleString()}</Typography>
                      </Box>
                      {signatureFields.length > 0 && (
                        <Box sx={{ gridColumn: '1 / -1' }}>
                          <Typography variant="body2"><strong>Fields Completed:</strong></Typography>
                          <Typography>{completedFieldsCount} of {signatureFields.length}</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={() => downloadDocument('current')}
                    startIcon={<DownloadIcon />}
                    size="large"
                  >
                    Download Document
                  </Button>

                  {/* 📦 ADDED: ZIP Package Download Button */}
                  <Button
                    variant="contained"
                    onClick={() => downloadDocument('package')}
                    startIcon={<FaArchive />}
                    size="large"
                    color="secondary"
                    disabled={documentInfo?.status !== 'completed'}
                    title={documentInfo?.status !== 'completed' ? "Full package available once all signers are finished" : "Download ZIP package"}
                  >
                    Download Package (ZIP)
                  </Button>

                  {signedPreviewUrl && (
                    <Button
                      variant="contained"
                      onClick={() => downloadDocument('signed')}
                      startIcon={<PdfIcon />}
                      size="large"
                      color="success"
                    >
                      Download Signed PDF
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={() => window.close()}
                    startIcon={<CloseIcon />}
                    size="large"
                  >
                    Close Window
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Container>
        )}

        {/* 🔧 ADDED: Enhanced Signature Dialog */}
        <EnhancedSignaturePadModal
          open={signDialogOpen}
          onSave={handleSignatureSave}
          onClose={() => {
            setSignDialogOpen(false);
            setSelectedField(null);
          }}
          existingSignature={selectedField ? fieldValues[selectedField.id] : null}
          recipientData={recipientInfo}
          fieldType={selectedField?.type || 'signature'}
          fieldLabel={selectedField ? getFieldDisplayName(selectedField.type) : ''}
        />

        <TermsDialog
          open={termsDialogOpen}
          onAccept={acceptTerms}
          onDecline={declineTerms}
          recipientInfo={recipientInfo}
          documentInfo={documentInfo}
          required={true}
        />
      </Box>


    </>
  );
};

export default RecipientSigningPage;