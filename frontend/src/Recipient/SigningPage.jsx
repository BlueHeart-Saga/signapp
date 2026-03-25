import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  IconButton,
  LinearProgress,
  Snackbar,
  Container,
  Card,
  CardContent,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Grid,
  CardActionArea,
  CardMedia
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ArrowDropDown as ArrowDownIcon,
  ArrowDropUp as ArrowUpIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Fingerprint as SignatureIcon,
  TextFields as TextIcon,
  CalendarToday as DateIcon,
  CheckBox as CheckboxIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  NavigateNext as NextIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  FullscreenExit as FullscreenExitIcon,
  FitScreen as FitScreenIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Pending as PendingIcon,
  Attachment as AttachmentIcon,
  RadioButtonChecked as RadioIcon,
  PictureAsPdf as PdfIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  LocalOffer as StampIcon  // Added missing StampIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';
import { EnhancedSignaturePadModal } from '../components/SignaturePad';

// ======================
// PDF.JS CONFIGURATION
// ======================

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// ======================
// API SERVICE
// ======================

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

const apiService = {
  async fetchRecipientInfo(recipientId) {
    const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}`);
    if (!response.ok) throw new Error('Failed to fetch recipient information');
    return response.json();
  },

  async fetchDocument(recipientId) {
    const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/live-document`);
    if (!response.ok) throw new Error('Failed to fetch document');
    
    return response.blob();
  },

  async fetchFields(recipientId) {
    const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/fields`);
    if (!response.ok) throw new Error('Failed to fetch fields');
    return response.json();
  },

  async saveFieldValue(recipientId, fieldId, fieldValue) {
    console.log('Saving field value:', { recipientId, fieldId, fieldValue });
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/signing/recipient/${recipientId}/fields/${fieldId}/complete`, 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: fieldValue
          })
        }
      );
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        // Try to get the error message from the response
        let errorMessage = 'Failed to save field';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  async completeSigning(recipientId) {
    const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to complete signing');
    return response.json();
  },

  async downloadDocument(recipientId, type = 'current') {
    const endpoint = type === 'signed' ? 'signed-preview' : 'document';
    const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/${endpoint}`);
    if (!response.ok) throw new Error('Failed to download document');
    return response.blob();
  },



  getAuthHeaders() {
    // Get token from localStorage or cookies if you're using JWT
    const token = localStorage.getItem('signing_token') || 
                  new URLSearchParams(window.location.search).get('token') || 
                  sessionStorage.getItem('signing_token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  },
  
  // Update thumbnail fetch functions to include authentication
  async fetchThumbnails(recipientId) {
    const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/thumbnails`, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch thumbnails');
    return response.json();
  },

  async fetchFileThumbnail(recipientId, fileId) {
    const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/files/${fileId}/thumbnail`, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch thumbnail');
    return response.blob();
  },

  async fetchPageThumbnail(recipientId, pageNumber, width = 120, height = 150) {
    // Get token for thumbnail URL
    const token = localStorage.getItem('signing_token') || 
                  new URLSearchParams(window.location.search).get('token') || 
                  sessionStorage.getItem('signing_token');
    
    let url = `${API_BASE_URL}/signing/recipient/${recipientId}/pages/${pageNumber}/thumbnail?width=${width}&height=${height}`;
    
    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch page thumbnail');
    return response.blob();
  },

  async fetchDocumentPreview(recipientId, pageFrom = 1, pageTo = null) {
    const token = localStorage.getItem('signing_token') || 
                  new URLSearchParams(window.location.search).get('token') || 
                  sessionStorage.getItem('signing_token');
    
    let url = `${API_BASE_URL}/signing/recipient/${recipientId}/document-preview?page_from=${pageFrom}`;
    
    if (pageTo) {
      url += `&page_to=${pageTo}`;
    }
    
    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch document preview');
    return response.json();
  },


  async completeSigning(recipientId) {
  const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to complete signing');
  }
  return response.json();
},


// Add this to your apiService object
async triggerCompletedEmails(recipientId) {
  const response = await fetch(
    `${API_BASE_URL}/signing/recipient/${recipientId}/trigger-completed-emails`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to trigger emails');
  }
  return response.json();
},


};


const IMAGE_BASED_FIELDS = new Set([
  'signature',
  'initials',
  'stamp',
  'attachment',
  'witness_signature'
]);

// ======================
// FIELD TYPE CONFIGURATION
// ======================

const FIELD_TYPES = {
  signature: {
    label: 'Signature',
    icon: SignatureIcon,
    color: '#1976d2',
    category: 'signature'
  },
  initials: {
    label: 'Initials',
    icon: EditIcon,
    color: '#4caf50',
    category: 'signature'
  },
  textbox: {
    label: 'Text Field',
    icon: TextIcon,
    color: '#4caf50',
    category: 'form'
  },
  date: {
    label: 'Date',
    icon: DateIcon,
    color: '#ff9800',
    category: 'form'
  },
  checkbox: {
    label: 'Checkbox',
    icon: CheckboxIcon,
    color: '#9c27b0',
    category: 'form'
  },
  witness_signature: {
    label: 'Witness Signature',
    icon: SignatureIcon,
    color: '#f44336',
    category: 'signature'
  },
  stamp: {
    label: 'Stamp',
    icon: StampIcon,
    color: '#e53935',
    category: 'signature'
  },
  approval: {
    label: 'Approval',
    icon: CheckIcon,
    color: '#4caf50',
    category: 'signature'
  },
  dropdown: {
    label: 'Dropdown',
    icon: ArrowDownIcon,
    color: '#ff9800',
    category: 'form'
  },
  radio: {
    label: 'Radio Button',
    icon: RadioIcon,
    color: '#9c27b0',
    category: 'form'
  },
  attachment: {
    label: 'Attachment',
    icon: AttachmentIcon,
    color: '#607d8b',
    category: 'form'
  },
  mail: {
    label: 'Email',
    icon: EmailIcon,
    color: '#1a73e8',
    category: 'form'
  }
};

// ======================
// COORDINATE CONVERSION UTILITIES
// ======================

const convertPDFToScreenCoordinates = (field, pageDimensions) => {
  if (!pageDimensions || !field) return null;

  const { pdfWidth, pdfHeight, renderWidth, renderHeight } = pageDimensions;

  const pdfX = field.pdf_x ?? field.x ?? 0;
  const pdfY = field.pdf_y ?? field.y ?? 0;
  const pdfFieldWidth = field.pdf_width ?? field.width ?? 100;
  const pdfFieldHeight = field.pdf_height ?? field.height ?? 30;

  const scaleX = renderWidth / pdfWidth;
  const scaleY = renderHeight / pdfHeight;

  return {
    x: pdfX * scaleX,
    y: renderHeight - (pdfY + pdfFieldHeight) * scaleY,
    width: Math.max(pdfFieldWidth * scaleX, 20),
    height: Math.max(pdfFieldHeight * scaleY, 20),
    isValid: true
  };
};


// ======================
// FIELD OVERLAY COMPONENT (Simplified - No draft mode)
// ======================

// ======================
// FIELD OVERLAY COMPONENT (Shows completed fields too)
// ======================

const FieldOverlay = React.memo(({ 
  field, 
  screenPosition, 
  isCompleted, 
  onClick,
  recipientColor = 'rgb(13, 148, 136)',
  fieldValues = {}
}) => {
  const fieldConfig = FIELD_TYPES[field.type] || FIELD_TYPES.textbox;
  
  // Check if field is completed
  const completed = field.completed_at || field.is_completed || false;
  const isImageField = IMAGE_BASED_FIELDS.has(field.type);

  
  // Get display value for completed fields
  const getDisplayValue = () => {
    // ===== NOT COMPLETED PLACEHOLDERS =====
  if (!completed) {
    switch (field.type) {
      case "signature":
        return "SIGN HERE";

      case "initials":
        return "INITIAL";

      case "witness_signature":
        return "WITNESS SIGN";

      case "date":
        return "MM/DD/YYYY";

      case "approval":
        return "APPROVE";

      case "checkbox":
        return "☐";

      case "radio":
        return "O";

      case "dropdown":
        return "SELECT";

      case "textbox":
        return "ENTER TEXT";

      case "mail":
        return "EMAIL";

      case "attachment":
        return "UPLOAD FILE";

      case "stamp":
        return "STAMP";

      default:
        return "FILL";
    }
  }
    
    // For completed fields, show the actual value
    const value = field.value || fieldValues[field.id];
    
    if (!value) return 'Completed';
    
    // Extract value from different formats
    let displayValue = '';
    
    if (typeof value === 'object') {
      // Handle object values (e.g., from signature pad)
      if (value.value !== undefined) {
        displayValue = value.value;
      } else if (value.text !== undefined) {
        displayValue = value.text;
      } else if (value.date !== undefined) {
        displayValue = value.date;
      } else if (value.dataUrl !== undefined) {
        // For signature/image fields, show "Signed"
        if (field.type === 'signature' || field.type === 'initials') {
          return '✓ Signed';
        }
        return '✓ Completed';
      }
    } else if (typeof value === 'string') {
      // Handle string values
      if (field.type === 'date') {
        try {
          const date = new Date(value);
          return date.toLocaleDateString();
        } catch {
          return value;
        }
      } else if (field.type === 'signature' || field.type === 'initials') {
        return '✓ Signed';
      } else {
        // Truncate long text
        return value.length > 15 ? value.substring(0, 15) + '...' : value;
      }
    }
    
    return displayValue || '✓ Completed';
  };

  const displayValue = getDisplayValue();

  return (
    <Tooltip
      title={completed 
  ? `Click to edit ${fieldConfig.label.toLowerCase()}` 
  : `Click to ${field.type === 'signature' ? 'sign' : 'fill'}`
}

      arrow
      placement="top"
    >
     <Box
  sx={{
    position: 'absolute',
    left: `${screenPosition.x}px`,
    top: `${screenPosition.y}px`,
    width: `${screenPosition.width}px`,
    height: `${screenPosition.height}px`,

    // ✅ Transparent after complete
    backgroundColor: 'transparent',

    // Border only on hover or when incomplete
    border: completed
      ? '1px solid transparent'
      : `1px solid ${recipientColor}`,

    cursor: 'pointer',
    pointerEvents: 'auto',
    transition: 'all 0.2s ease',

    '&:hover': {
      borderColor: completed ? 'rgb(13, 148, 136)' : recipientColor,
      boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
      backgroundColor: 'transparent'
    },

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 100,
    borderRadius: '2px'
  }}
  onClick={(e) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(field);
  }}
>


        {/* Field content */}
       <Box
  sx={{
    display: completed ? 'none' : 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    fontSize: '9px',
    fontWeight: 500,
    // color: recipientColor,
    color: 'rgb(13, 148, 136)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: '2px',
    pointerEvents: 'none',
    textAlign: 'center'
  }}
>
  {displayValue}
</Box>


        {/* Required indicator for incomplete fields */}
        {!completed && field.required && (
          <Box
            sx={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '4px',
              height: '4px',
              backgroundColor: 'rgb(13, 148, 136)',
              borderRadius: '50%',
              border: '1px solid white'
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
});

FieldOverlay.displayName = 'FieldOverlay';

// ======================
// SINGLE PDF PAGE WITH OVERLAYS (Updated to include completed fields)
// ======================

const PdfPageWithOverlays = React.memo(({
  pageNumber,
  fields,
  pageDimensions,
  onFieldClick,
  recipientColors,
  fieldValues = {}
}) => {

  const pageFields = useMemo(() => 
    fields.filter(field => field.page === pageNumber - 1),
    [fields, pageNumber]
  );

  if (!pageDimensions || pageFields.length === 0) {
    return null;
  }

  return (
    <>
      {pageFields.map((field) => {
        const screenPosition = convertPDFToScreenCoordinates(
          field,
          pageDimensions,
        );

        if (!screenPosition || !screenPosition.isValid) return null;

        return (
          <FieldOverlay
            key={field.id}
            field={field}
            screenPosition={screenPosition}
            isCompleted={field.completed_at || field.is_completed}
            onClick={onFieldClick}
            recipientColor={recipientColors[field.recipient_id] || 'rgb(13, 148, 136)'}
            fieldValues={fieldValues}
          />
        );
      })}
    </>
  );
});

PdfPageWithOverlays.displayName = 'PdfPageWithOverlays';

// ======================
// DOCUMENT PAGE THUMBNAIL COMPONENT (Zoho-style)
// ======================

const DocumentPageThumbnail = React.memo(({ 
  recipientId,
  pageNumber, 
  isActive, 
   documentUrl ,
  onClick,
  hasFields,
  completedFields,
  totalFields,
  thumbnailUrl = null,
  isLoading = false
}) => {
  const [thumbnailSrc, setThumbnailSrc] = useState(null);
  const [error, setError] = useState(false);

  // Load or generate thumbnail
  useEffect(() => {
    let isMounted = true;
    
    const loadThumbnail = async () => {
      if (!thumbnailUrl) {
        // Generate placeholder
        generatePlaceholder();
        return;
      }
      
      // If it's a data URL (placeholder), use it directly
      if (thumbnailUrl.startsWith('data:image')) {
        if (isMounted) {
          setThumbnailSrc(thumbnailUrl);
        }
        return;
      }
      
      // It's a real URL, try to load it
      try {
        setError(false);
        
        // Create image to load thumbnail
        const img = new Image();
        
        img.onload = () => {
          if (isMounted) {
            setThumbnailSrc(thumbnailUrl);
          }
        };
        
        img.onerror = () => {
          if (isMounted) {
            setError(true);
            generatePlaceholder();
          }
        };
        
        // Set crossOrigin for CORS if needed
        if (thumbnailUrl.includes(API_BASE_URL)) {
          img.crossOrigin = 'anonymous';
        }
        
        img.src = thumbnailUrl;
        
      } catch (err) {
        console.error('Failed to load thumbnail:', err);
        if (isMounted) {
          setError(true);
          generatePlaceholder();
        }
      }
    };
    
    const generatePlaceholder = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, 120, 150);
      
      // Page outline
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.strokeRect(5, 5, 110, 140);
      
      // Page number
      ctx.fillStyle = isActive ? 'rgb(13, 148, 136)' : '#666666';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Page ${pageNumber}`, 60, 75);
      
      // "PDF" label
      ctx.fillStyle = '#999999';
      ctx.font = '10px Arial';
      ctx.fillText('PDF', 60, 95);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      if (isMounted) {
        setThumbnailSrc(dataUrl);
      }
    };
    
    loadThumbnail();
    
    return () => {
      isMounted = false;
    };
  }, [thumbnailUrl, pageNumber, isActive]);

  return (
    <Card
      elevation={isActive ? 3 : 1}
      sx={{
        width: '100%',
        mb: 1,
        cursor: 'pointer',
        border: isActive ? '2px solid rgb(13, 148, 136)' : '1px solid #e0e0e0',
        position: 'relative',
        '&:hover': {
          borderColor: 'rgb(13, 148, 136)',
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease',
          boxShadow: isActive ? 3 : 2
        }
      }}
      onClick={onClick}
    >
      <CardActionArea sx={{ height: '100%' }}>
        <Box sx={{ position: 'relative', height: 120 }}>
          {/* Page number badge */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: isActive ? 'rgb(13, 148, 136)1976d2' : 'rgba(0,0,0,0.7)',
              color: 'white',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              zIndex: 2
            }}
          >
            {pageNumber}
          </Box>

          {/* Fields indicator */}
          {hasFields && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: completedFields === totalFields ? '#4CAF50' : '#FF9800',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              {completedFields}/{totalFields}
              {completedFields === totalFields ? '✓' : '○'}
            </Box>
          )}

          {/* Thumbnail image */}
          {isLoading ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5'
              }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : thumbnailSrc ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                bgcolor: '#f5f5f5'
              }}
            >
              <Document file={documentUrl}>
  <Page
    pageNumber={pageNumber}
    width={120}
    renderAnnotationLayer={false}
    renderTextLayer={false}
  />
</Document>
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <PdfIcon sx={{ fontSize: 32, color: '#9e9e9e' }} />
              <Typography variant="caption" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          )}

          {/* Error overlay */}
          {error && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.1)',
                zIndex: 1
              }}
            >
              <ErrorIcon color="error" />
            </Box>
          )}

          {/* Active page indicator */}
          {isActive && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: 'rgb(13, 148, 136)',
                zIndex: 2
              }}
            />
          )}
        </Box>

        {/* Page label */}
        <Box sx={{ p: 1, minHeight: 40 }}>
          <Typography variant="caption" fontWeight="medium" align="center" display="block">
            Page {pageNumber}
          </Typography>
          {hasFields && (
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              {completedFields === totalFields ? 'Complete' : `${totalFields - completedFields} remaining`}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
});
DocumentPageThumbnail.displayName = 'DocumentPageThumbnail';
// ======================
// MAIN SIGNING PAGE COMPONENT (Zoho-style)
// ======================

const SigningPage = () => {
  const { recipientId } = useParams();
  const navigate = useNavigate();
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [fields, setFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({}); // Added missing state
  const [activeField, setActiveField] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalValue, setModalValue] = useState(null); // Changed from string to null
  const [textInput, setTextInput] = useState(''); // Added missing state
  const [selectedDate, setSelectedDate] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageDimensions, setPageDimensions] = useState({});
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recipientColors, setRecipientColors] = useState({});
  
const [thumbnails, setThumbnails] = useState([]);
const [thumbnailUrls, setThumbnailUrls] = useState({});
const [loadingThumbnails, setLoadingThumbnails] = useState(false);
const [thumbnailPageMap, setThumbnailPageMap] = useState({}); 

const [finishDialogOpen, setFinishDialogOpen] = useState(false);
const [finishDialogTitle, setFinishDialogTitle] = useState('');
const [finishDialogMessage, setFinishDialogMessage] = useState('');
const [finishDialogAction, setFinishDialogAction] = useState('');

const documentUrlRef = useRef(null);

  // Refs
  const containerRef = useRef(null);
  const pdfContainerRef = useRef(null);

  // Generate recipient colors
  const generateRecipientColors = (fields) => {
    const colors = [
      'rgb(13, 148, 136)', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
      '#EF476F', '#7209B7', '#3A86FF', '#FB5607', '#8338EC'
    ];
    
    const colorMap = {};
    const recipientIds = [...new Set(fields.map(f => f.recipient_id))];
    
    recipientIds.forEach((recipientId, index) => {
      colorMap[recipientId] = colors[index % colors.length];
    });
    
    return colorMap;
  };

  const refreshLiveDocumentSilently = async () => {
  try {
    const blob = await apiService.fetchDocument(recipientId);

    const newUrl = URL.createObjectURL(blob);

    // Clean up old blob
    if (documentUrlRef.current) {
      URL.revokeObjectURL(documentUrlRef.current);
    }

    documentUrlRef.current = newUrl;
    setDocumentUrl(newUrl); // 🔥 triggers react-pdf re-render

  } catch (err) {
    console.error('Silent document refresh failed:', err);
  }
};


  // Load data on mount
  useEffect(() => {
    if (recipientId) {
      loadData();
    }
  }, [recipientId]);


  // Add this effect to check document status and trigger emails if needed
useEffect(() => {
  const checkAndTriggerEmails = async () => {
    try {
      // Only check if document is completed
      if (documentInfo?.status === 'completed') {
        console.log('Document is completed, checking email status...');
        
        // Check if emails have been sent
        const emailSent = documentInfo?.completed_email_sent;
        
        if (!emailSent) {
          console.log('Emails not sent yet, triggering...');
          
          // Try to trigger email sending
          const result = await apiService.triggerCompletedEmails(recipientId);
          console.log('Email trigger result:', result);
          
          if (result.scheduled) {
            showSnackbar('Completed document emails are being sent to all recipients', 'success');
          } else if (result.already_sent) {
            console.log('Emails already sent at:', result.sent_at);
          }
        } else {
          console.log('Emails already sent at:', documentInfo.completed_email_sent_at);
        }
      }
    } catch (err) {
      console.error('Failed to trigger emails:', err);
      // Don't show error to user as this is a background process
    }
  };

  if (documentInfo) {
    checkAndTriggerEmails();
  }
}, [documentInfo, recipientId]);


  // Add this function to show the confirmation dialog
const showFinishConfirmation = () => {
  const role = recipientInfo?.role;
  
  if (role === 'viewer') {
    setFinishDialogTitle('Confirm Document View');
    setFinishDialogMessage('I confirm that I have reviewed this document in its entirety. Are you sure you want to mark this document as viewed?');
    setFinishDialogAction('viewed');
  } else if (role === 'approver') {
    setFinishDialogTitle('Confirm Approval');
    setFinishDialogMessage('I confirm that I approve this document. Are you sure you want to approve this document?');
    setFinishDialogAction('approved');
  } else if (role === 'signer') {
    setFinishDialogTitle('Confirm Signing Completion');
    setFinishDialogMessage('You have completed all fields. Are you sure you want to finish signing?');
    setFinishDialogAction('signed');
  }
  
  setFinishDialogOpen(true);
};

// Add this function to handle the actual completion
const handleFinishConfirm = async () => {
  setFinishDialogOpen(false);
  setCompleting(true);
  
  try {
    // Call the manual completion endpoint
    const result = await apiService.completeSigning(recipientId);
    console.log('Completion result:', result);
    
    // Check if document is now completed
    if (result.document_finalized) {
      // Try to trigger email sending
      try {
        await apiService.triggerCompletedEmails(recipientId);
        showSnackbar(
          recipientInfo.role === 'viewer' ? 'Document marked as viewed! Emails are being sent.' :
          recipientInfo.role === 'approver' ? 'Document approved! Emails are being sent.' :
          'Signing completed! Emails are being sent to all recipients.',
          'success'
        );
      } catch (emailErr) {
        console.error('Failed to trigger emails:', emailErr);
        showSnackbar(
          'Document completed but email sending failed. You can trigger emails manually.',
          'warning'
        );
      }
    } else {
      showSnackbar(
        recipientInfo.role === 'viewer' ? 'Document marked as viewed!' :
        recipientInfo.role === 'approver' ? 'Document approved!' :
        'Signing completed!',
        'success'
      );
    }
    
    // Navigate to complete page after a short delay
    setTimeout(() => {
      navigate(`/complete/${recipientId}`);
    }, 1500);
    
  } catch (err) {
    console.error('Completion error:', err);
    showSnackbar(`Failed to complete: ${err.message}`, 'error');
    setCompleting(false);
  }
};




  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);


       // Extract token from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('signing_token', token);
    }

      // Fetch recipient info, document, and fields
      const [recipientData, documentBlob, fieldsData] = await Promise.all([
        apiService.fetchRecipientInfo(recipientId),
        apiService.fetchDocument(recipientId),
        apiService.fetchFields(recipientId)
      ]);

      setRecipientInfo(recipientData.recipient);
      setDocumentInfo(recipientData.document);
      
      const url = URL.createObjectURL(documentBlob);
      setDocumentUrl(url);
      setFields(fieldsData);

      // Generate colors for recipients
      const colors = generateRecipientColors(fieldsData);
      setRecipientColors(colors);

      // Initialize field values
      const initialFieldValues = {};
      fieldsData.forEach(field => {
        if (field.value) {
          initialFieldValues[field.id] = field.value;
        }
      });
      setFieldValues(initialFieldValues);

    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
      showSnackbar('Failed to load document', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Add this function to generate placeholder thumbnails
const generatePlaceholderThumbnails = () => {
  const pageMap = {};
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    // Create a data URL for a placeholder thumbnail
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    
    // Draw placeholder
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 120, 150);
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, 110, 140);
    
    ctx.fillStyle = 'rgb(13, 148, 136)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${pageNum}`, 60, 75);
    
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText('PDF Document', 60, 95);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    pageMap[pageNum] = dataUrl;
  }
  
  setThumbnailPageMap(pageMap);
};

  // Add this function to load thumbnails
const loadThumbnails = async () => {
  try {
    setLoadingThumbnails(true);
    
    if (!recipientInfo?.otp_verified) {
      console.warn('Recipient not OTP verified, cannot load thumbnails');
      setLoadingThumbnails(false);
      return;
    }
    
    // Get token for authentication
    const token = localStorage.getItem('signing_token') || 
                  new URLSearchParams(window.location.search).get('token');
    
    if (!token) {
      console.warn('No authentication token found for thumbnails');
      setLoadingThumbnails(false);
      return;
    }
    
    // Generate thumbnail URLs for each page
    const pageMap = {};
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const baseUrl = `${API_BASE_URL}/signing/recipient/${recipientId}/pages/${pageNum}/thumbnail?width=120&height=150`;
      const url = `${baseUrl}&token=${encodeURIComponent(token)}`;
      pageMap[pageNum] = url;
    }
    
    setThumbnailPageMap(pageMap);
    
    // Preload first few thumbnails
    preloadImportantThumbnails(pageMap);
    
  } catch (error) {
    console.error('Failed to load thumbnails:', error);
    showSnackbar('Could not load thumbnails', 'warning');
    
    // Fallback: Generate placeholder thumbnails
    generatePlaceholderThumbnails();
  } finally {
    setLoadingThumbnails(false);
  }
};

const preloadImportantThumbnails = (pageMap) => {
  const pagesToPreload = [currentPage, currentPage + 1, currentPage + 2];
  
  pagesToPreload.forEach(pageNum => {
    if (pageMap[pageNum] && !pageMap[pageNum].startsWith('data:')) {
      // Only preload real URLs, not data URLs
      const img = new Image();
      img.src = pageMap[pageNum];
      img.onload = () => {
        setThumbnailUrls(prev => ({
          ...prev,
          [pageNum]: pageMap[pageNum]
        }));
      };
      img.onerror = () => {
        console.warn(`Failed to load thumbnail for page ${pageNum}`);
      };
    } else if (pageMap[pageNum]?.startsWith('data:')) {
      // For data URLs, set directly
      setThumbnailUrls(prev => ({
        ...prev,
        [pageNum]: pageMap[pageNum]
      }));
    }
  });
};

// Load thumbnails when document loads
useEffect(() => {
  if (numPages > 0 && recipientId) {
    loadThumbnails();
  }
}, [numPages, recipientId]);

// Clean up thumbnail URLs on unmount
useEffect(() => {
  return () => {
    // Clean up any blob URLs
    Object.values(thumbnailUrls).forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  };
}, [thumbnailUrls]);

const handleFieldClick = (field) => {
  console.log('Field clicked:', field);
  
  setActiveField(field);
  setModalType(field.type);
  
  // Reset all modal values
  setModalValue(null);
  setSelectedDate(null);
  setTextInput('');
  
  // Load existing value if it exists
  // For dropdown fields, load options
  if (field.type === 'dropdown' && field.dropdown_options) {
    console.log('Dropdown options:', field.dropdown_options);
    // Ensure dropdown options are available for the modal
    // The EnhancedSignaturePad will use these options
  }
  
  // For radio fields, load group and options
  if (field.type === 'radio' && field.dropdown_options) {
    console.log('Radio options:', field.dropdown_options);
  }

  if (field.value) {
    console.log('Existing value:', field.value);
    
    if (field.type === 'date') {
  const raw = field.value?.value || field.value;

  const parsed = new Date(raw);
  setSelectedDate(
    parsed instanceof Date && !isNaN(parsed.getTime())
      ? parsed
      : new Date()
  );
}

    else if (field.type === 'textbox') {
      // For text fields, extract the actual value
      let valueToShow = '';
      if (typeof field.value === 'object' && field.value.value !== undefined) {
        valueToShow = field.value.value;
      } else if (typeof field.value === 'string') {
        valueToShow = field.value;
      } else if (typeof field.value === 'object' && field.value.text !== undefined) {
        valueToShow = field.value.text;
      } else {
        valueToShow = field.value;
      }
      setTextInput(valueToShow);
    }

    else if (field.type === 'dropdown') {
      // Handle dropdown value
      let selectedValue = '';
      if (typeof field.value === 'object') {
        selectedValue = field.value.value || field.value.selected || '';
      } else if (typeof field.value === 'string') {
        selectedValue = field.value;
      }
      setModalValue({ value: selectedValue });
    }
    else if (field.type === 'radio') {
      // Handle radio value
      let selectedValue = '';
      if (typeof field.value === 'object') {
        selectedValue = field.value.value || field.value.selected || '';
      } else if (typeof field.value === 'string') {
        selectedValue = field.value;
      }
      setModalValue({ value: selectedValue });
    }
    else if (field.type === 'initials') {
      // For initials field, pass the entire value object to the modal
      setModalValue(field.value);
    }
    else {
      // For other types, pass the entire value object
      setModalValue(field.value);
    }
  } else {
    // Set defaults based on field type
    if (field.type === 'date') {
      setSelectedDate(new Date());
    }
  }

  // Open modal
  setModalOpen(true);
};

const handleModalSave = async (valueFromModal = null) => {
  if (!activeField) return;

  try {
    setSaving(true);
    
    let valueToSave = null;

    console.log('handleModalSave called with:', { 
      activeField: activeField.id,
      modalType,
      valueFromModal 
    });

    // Process based on field type
    if (modalType === 'initials') {
      // INITIALS FIELD - Should be image-based
      if (valueFromModal && valueFromModal.image) {
        valueToSave = { image: valueFromModal.image };
      } else {
        throw new Error('Please create or upload initials');
      }
    }
    else if (modalType === 'textbox') {
  if (
    !valueFromModal ||
    typeof valueFromModal.value !== 'string'
  ) {
    throw new Error('Invalid textbox value');
  }

  valueToSave = {
    value: valueFromModal.value.trim()
  };
}

    else if (modalType === 'date') {
  let dateObj = selectedDate;

  // 🛡 normalize string → Date
  if (typeof dateObj === 'string') {
    dateObj = new Date(dateObj);
  }

  // 🛡 fallback if invalid
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  else if (modalType === 'date') {
  valueToSave = valueFromModal; // already { value: 'YYYY-MM-DD' }
}
}

    else if (valueFromModal) {
      // Signature pad fields
      if (modalType === 'signature' || modalType === 'witness_signature') {
        // Image-based signatures
        if (valueFromModal.image) {
          valueToSave = { image: valueFromModal.image };
        } else {
          throw new Error('No signature image created');
        }
      }
      else if (modalType === 'stamp') {
        // Stamp fields
        if (valueFromModal.image) {
          valueToSave = {
            image: valueFromModal.image,
            text: valueFromModal.text || '',
            color: valueFromModal.color || '#e53935'
          };
        } else {
          throw new Error('No stamp created');
        }
      }
      else if (modalType === 'checkbox' || modalType === 'approval') {
        // Boolean fields
        valueToSave = { value: valueFromModal.value || false };
      }
      else if (modalType === 'radio' || modalType === 'dropdown') {
        // Selection fields
        valueToSave = { value: valueFromModal.value || '' };
      }
      else if (modalType === 'mail') {
        // Email fields
        valueToSave = { value: valueFromModal.value || '' };
      }
    }

    if (!valueToSave) {
      throw new Error('No value to save');
    }

    console.log('Saving field with payload:', {
      fieldId: activeField.id,
      fieldType: modalType,
      valueToSave
    });

    // Make the API call
    const result = await apiService.saveFieldValue(
      recipientId,
      activeField.id,
      valueToSave
    );

    console.log('Save successful:', result);

    // Update local state
    setFields(prev =>
      prev.map(f =>
        f.id === activeField.id
          ? {
              ...f,
              value: valueToSave,
              completed_at: new Date().toISOString(),
              is_completed: true
            }
          : f
      )
    );

    setFieldValues(prev => ({
      ...prev,
      [activeField.id]: valueToSave
    }));

    // 🔥 silently refresh PDF with signed content
refreshLiveDocumentSilently();

    showSnackbar(
      `${FIELD_TYPES[modalType]?.label || modalType} saved successfully`,
      'success'
    );

    setModalOpen(false);
    setActiveField(null);
    setModalValue(null);
    setSelectedDate(null);
    setTextInput('');

    const nextPage = findNextPageWithIncompleteFields(fields, currentPage);
    if (nextPage && nextPage !== currentPage) {
      setTimeout(() => setCurrentPage(nextPage), 300);
    }

  } catch (err) {
    console.error('Save error details:', {
      message: err.message,
      stack: err.stack,
      fieldId: activeField?.id,
      fieldType: modalType
    });
    showSnackbar(` ${err.message}`, 'error');
  } finally {
    setSaving(false);
  }
};

  const findNextPageWithIncompleteFields = (fieldsList, currentPageNum) => {
    // Find pages that have incomplete fields
    const pagesWithIncompleteFields = new Set();
    
    fieldsList.forEach(field => {
      if (!field.completed_at) {
        pagesWithIncompleteFields.add(field.page + 1); // Convert to 1-based page number
      }
    });
    
    // Sort page numbers
    const sortedPages = Array.from(pagesWithIncompleteFields).sort((a, b) => a - b);
    
    // Find the next page after current page
    for (let page of sortedPages) {
      if (page > currentPageNum) {
        return page;
      }
    }
    
    // If no next page, return the first page with incomplete fields
    return sortedPages.length > 0 ? sortedPages[0] : null;
  };

  const handleCompleteSigning = async () => {
    try {
      setCompleting(true);
      
      // Check if all required fields are completed
      const requiredFields = fields.filter(f => f.required);
      const incompleteRequired = requiredFields.filter(f => !f.completed_at);
      
      if (incompleteRequired.length > 0) {
        throw new Error(`Please complete ${incompleteRequired.length} required field(s) before finishing`);
      }
      
      await apiService.completeSigning(recipientId);
      showSnackbar('Document signed successfully!', 'success');
      
      setTimeout(() => {
        window.location.href = `/signing/complete/${recipientId}`;
      }, 2000);
    } catch (err) {
      console.error('Complete signing error:', err);
      showSnackbar(`Failed to complete signing: ${err.message}`, 'error');
    } finally {
      setCompleting(false);
    }
  };

  const handleDownload = async (type = 'current') => {
    try {
      const blob = await apiService.downloadDocument(recipientId, type);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentInfo?.filename?.replace('.pdf', '') || 'document'}_${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSnackbar('Document downloaded successfully', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showSnackbar('Failed to download document', 'error');
    }
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const fitToScreen = () => {
    setZoom(1);
  };

  const toggleFullscreen = () => {
    if (!pdfContainerRef.current) return;
    
    if (!isFullscreen) {
      if (pdfContainerRef.current.requestFullscreen) {
        pdfContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

 const handlePageLoadSuccess = (page, pageNumber) => {
  const viewport = page.getViewport({ scale: 1 });

  setPageDimensions(prev => ({
    ...prev,
    [pageNumber]: {
      pdfWidth: viewport.width,
      pdfHeight: viewport.height,
      renderWidth: page.width,   // already includes zoom
      renderHeight: page.height  // already includes zoom
    }
  }));
};


  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      signer: 'Signer',
      approver: 'Approver',
      viewer: 'Viewer',
      witness: 'Witness',
      form_filler: 'Form Filler',
      in_person_signer: 'In-Person Signer'
    };
    return roleMap[role] || role;
  };

  // Calculate progress for each page
  const getPageFieldStats = (pageNum) => {
    const pageFields = fields.filter(f => f.page === pageNum - 1);
    const completedFields = pageFields.filter(f => f.completed_at).length;
    const totalFields = pageFields.length;
    
    return {
      hasFields: totalFields > 0,
      completedFields,
      totalFields,
      allCompleted: totalFields > 0 && completedFields === totalFields
    };
  };

  // Calculate overall progress
// Update the progress calculation to handle viewers/approvers
const progress = useMemo(() => {
  const role = recipientInfo?.role;
  
  // For viewers and approvers, we don't check field completion
  if (role === 'viewer' || role === 'approver') {
    const hasCompleted = recipientInfo?.status === 'completed';
    return {
      allRequiredCompleted: hasCompleted,
      // Always show finish button for viewers/approvers
      showFinishButton: true,
      completionStatus: hasCompleted ? 'Completed' : 'Pending'
    };
  }
  
  // For other roles, check field completion
  const requiredFields = fields.filter(f => f.required);
  const completedRequired = requiredFields.filter(f => f.completed_at).length;
  const allFields = fields.length;
  const allCompleted = fields.filter(f => f.completed_at).length;
  
  return {
    totalRequired: requiredFields.length,
    completedRequired,
    totalFields: allFields,
    completedFields: allCompleted,
    percentage: requiredFields.length ? (completedRequired / requiredFields.length) * 100 : 0,
    allRequiredCompleted: requiredFields.length === completedRequired,
    showFinishButton: requiredFields.length === completedRequired
  };
}, [fields, recipientInfo]);

  // Get incomplete fields for current page
  const currentPageIncompleteFields = useMemo(() => 
    fields.filter(f => f.page === currentPage - 1 && !f.completed_at),
    [fields, currentPage]
  );

  // Get next page with incomplete fields
  const nextPageWithFields = findNextPageWithIncompleteFields(fields, currentPage);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadData}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!recipientInfo) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Invalid or missing signing link.
        </Alert>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        {/* Header - Simplified */}
        <AppBar position="sticky" elevation={1} color="default" sx={{ bgcolor: 'white' }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="600">
                    {recipientInfo.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleDisplayName(recipientInfo.role)}
                  </Typography>
                </Box>
              </Box> */}

              {/* In the header */}
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Avatar 
      sx={{ 
        bgcolor: 
          recipientInfo.role === 'viewer' ? 'rgb(13, 148, 136)' :
          recipientInfo.role === 'approver' ? '#4caf50' : 'rgb(13, 148, 136)',
        width: 32, 
        height: 32 
      }}
    >
      {recipientInfo.role === 'viewer' ? <PreviewIcon /> :
       recipientInfo.role === 'approver' ? <CheckIcon /> :
       <PersonIcon />}
    </Avatar>
    <Box>
      <Typography variant="subtitle1" fontWeight="600">
        {recipientInfo.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {getRoleDisplayName(recipientInfo.role)}
        {recipientInfo.role === 'viewer' && ' - Review Only'}
        {/* {recipientInfo.role === 'approver' && ' - Approval Required'} */}
      </Typography>
    </Box>
  </Box>
  
  <Divider orientation="vertical" flexItem />
  
  {recipientInfo.role === 'viewer' && (
    <Chip 
      label="View Only" 
      size="small" 
      color="info" 
      variant="outlined"
      icon={<PreviewIcon />}
    />
  )}
  
  {recipientInfo.role === 'approver' && (
    <Chip 
      label="Approval Required" 
      size="small" 
      color="success" 
      variant="outlined"
      icon={<CheckIcon />}
    />
  )}
  {recipientInfo?.status === 'completed' && (
  <Chip 
    label="Completed" 
    size="small" 
    color="success" 
    variant="filled"
    icon={<CheckIcon />}
    onClick={() => navigate(`/complete/${recipientId}`)}
    sx={{ cursor: 'pointer' }}
  />
)}
</Box>
              
              <Divider orientation="vertical" flexItem />
              
              <Typography variant="body2" color="text.secondary">
                {documentInfo?.filename}
              </Typography>
              
              <Chip 
                label={`${progress.completedFields}/${progress.totalFields} fields`}
                color={progress.allRequiredCompleted ? "success" : "default"}
                size="small"
                variant="outlined"
              />
            </Box>

            
            
            {/* In the header toolbar where the finish button is */}
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  {/* {progress.allRequiredCompleted && (
    <Button
      variant="contained"
      size="small"
      color={
        recipientInfo.role === 'viewer' ? 'primary' :
        recipientInfo.role === 'approver' ? 'success' : 'primary'
      }
      sx={{ minWidth: 120 }}
      onClick={showFinishConfirmation}
      disabled={completing}
      startIcon={
        recipientInfo.role === 'viewer' ? <PreviewIcon /> :
        recipientInfo.role === 'approver' ? <CheckIcon /> :
        null
      }
    >
      {completing ? (
        <CircularProgress size={16} color="inherit" />
      ) : (
        recipientInfo.role === 'viewer' ? 'Mark as Viewed' :
        recipientInfo.role === 'approver' ? 'Approve' :
        'Finish'
      )}
    </Button>
  )} */}
  {/* Update the finish button rendering */}
{/* Update the finish button rendering */}

{documentInfo?.status === 'completed' ? (
    <>
      {/* Document is completed - show completion info */}
      <Chip 
        label="Completed" 
        color="success" 
        variant="filled"
        icon={<CheckIcon />}
        onClick={() => navigate(`/complete/${recipientId}`)}
        sx={{ cursor: 'pointer' }}
      />
      
      {/* Option to trigger emails again if needed */}
      <Button
        variant="outlined"
        size="small"
        onClick={async () => {
          try {
            await apiService.triggerCompletedEmails(recipientId);
            showSnackbar('Emails triggered successfully', 'success');
          } catch (err) {
            showSnackbar(`Failed to trigger emails: ${err.message}`, 'error');
          }
        }}
      >
        Resend Emails
      </Button>
    </>
  ) : (
(progress.showFinishButton || recipientInfo?.role === 'viewer' || recipientInfo?.role === 'approver') && (
  <Button
    variant="contained"
    size="small"
    color={
      recipientInfo.role === 'viewer' ? 'rgb(13, 148, 136)' :
      recipientInfo.role === 'approver' ? 'success' : 'primary'
    }
    sx={{ minWidth: 120, backgroundColor: 'rgb(13, 148, 136)' }}
    onClick={() => {
      // If already completed, navigate to completion page
      if (recipientInfo?.status === 'completed') {
        navigate(`/complete/${recipientId}`);
      } else {
        // Otherwise show confirmation dialog
        showFinishConfirmation();
      }
    }}
    disabled={completing}
    startIcon={
      recipientInfo.role === 'viewer' ? <PreviewIcon /> :
      recipientInfo.role === 'approver' ? <CheckIcon /> :
      null
    }
  >
    {completing ? (
      <CircularProgress size={16} color="inherit" />
    ) : recipientInfo?.status === 'completed' ? (
      'View Completion'
    ) : recipientInfo.role === 'viewer' ? (
      'Mark as Viewed'
    ) : recipientInfo.role === 'approver' ? (
      'Approve'
    ) : (
      'Finish'
    )}
  </Button>
   )
)}
</Box>



          </Toolbar>
        </AppBar>

        {/* Main content - Zoho-style layout */}
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
          {/* Left sidebar - Document pages preview (Zoho-style) */}

<Paper 
  elevation={1} 
  sx={{ 
    width: 180,  // Slightly wider for better thumbnails
    p: 1.5, 
    overflow: 'auto',
    borderRadius: 0,
    borderRight: '1px solid #e0e0e0',
    display: { xs: 'none', md: 'block' }
  }}
>
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'rgb(13, 148, 136)', mb: 1 }}>
      Document Pages
    </Typography>
    
    <Box sx={{ mb: 2, p: 1, bgcolor: '#f8f9fa', borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        Total: {numPages} pages
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        Fields: {progress.completedFields}/{progress.totalFields}
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={progress.percentage} 
        sx={{ mt: 1, height: 4, borderRadius: 2 }}
      />
    </Box>
  </Box>
  
  <List disablePadding>
    {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => {
      const stats = getPageFieldStats(pageNum);
      const thumbnailUrl = thumbnailPageMap[pageNum];
      
      return (
        <Box key={pageNum} sx={{ mb: 1.5 }}>
          <DocumentPageThumbnail
            pageNumber={pageNum}
            documentUrl={documentUrl}
            isActive={currentPage === pageNum}
            onClick={() => {
  const el = document.getElementById(`page-${pageNum}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  setCurrentPage(pageNum);
}}
            hasFields={stats.hasFields}
            completedFields={stats.completedFields}
            totalFields={stats.totalFields}
            thumbnailUrl={thumbnailUrl}
            isLoading={loadingThumbnails && !thumbnailUrl}
          />
          
          {/* Quick navigation buttons for pages with fields */}
          {stats.hasFields && !stats.allCompleted && (
            <Button
              fullWidth
              size="small"
              variant="text"
              sx={{ 
                mt: 0.5,
                fontSize: '0.7rem',
                py: 0.2,
                minHeight: 'auto',
                color: 'rgb(13, 148, 136)'
              }}
              onClick={() => {
                setCurrentPage(pageNum);
                // Scroll to top of page viewer
                if (containerRef.current) {
                  containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              {stats.completedFields > 0 ? `Complete ${stats.totalFields - stats.completedFields} more` : 'Start filling'}
            </Button>
          )}
        </Box>
      );
    })}
  </List>
  
  {/* Thumbnail refresh button */}
  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0',  }}>
    <Button
      fullWidth
      size="small"
      variant="outlined"
      
      startIcon={<RefreshIcon />}
      onClick={loadThumbnails}
      disabled={loadingThumbnails}
      sx={{ fontSize: '0.75rem', color: 'rgb(13, 148, 136)' }}
    >
      {loadingThumbnails ? 'Loading...' : 'Refresh Thumbnails'}
    </Button>
  </Box>
</Paper>

          {/* Main PDF Viewer Area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Viewer controls */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 1, 
                mb: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'transparent'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Page navigation */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton 
                    size="small" 
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                  
                  <Typography variant="body2" sx={{ minWidth: 100, textAlign: 'center' }}>
                    Page {currentPage} of {numPages}
                  </Typography>
                  
                  <IconButton 
                    size="small" 
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    <NavigateNextIcon />
                  </IconButton>
                </Box>
                
                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />
                
                {/* Zoom controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton size="small" onClick={() => handleZoom(-0.1)} title="Zoom Out">
                    <ZoomOutIcon />
                  </IconButton>
                  <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center' }}>
                    {Math.round(zoom * 100)}%
                  </Typography>
                  <IconButton size="small" onClick={() => handleZoom(0.1)} title="Zoom In">
                    <ZoomInIcon />
                  </IconButton>
                  <IconButton size="small" onClick={fitToScreen} title="Fit to Screen">
                    <FitScreenIcon />
                  </IconButton>
                  <IconButton size="small" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </IconButton>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Next field button */}
                {currentPageIncompleteFields.length === 0 && nextPageWithFields && (
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<NavigateNextIcon />}
                    onClick={() => setCurrentPage(nextPageWithFields)}
                  >
                    Next Page with Fields
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleDownload('current')}
                  startIcon={<DownloadIcon />}
                  sx={{ color: 'rgb(13, 148, 136)', borderColor: 'rgb(13, 148, 136)' }}
                >
                  Download
                </Button>
              </Box>
            </Paper>

            {/* Current page field summary */}
            {currentPageIncompleteFields.length > 0 && (
              <Paper 
                elevation={1} 
                sx={{ 
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: '#FFF8E1'
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon fontSize="small" color="warning" />
                  {currentPageIncompleteFields.length} field(s) to complete on this page
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {currentPageIncompleteFields.map(field => {
                    const fieldConfig = FIELD_TYPES[field.type] || FIELD_TYPES.textbox;
                    return (
                      <Chip
                        key={field.id}
                        label={field.label || fieldConfig.label}
                        size="small"
                        onClick={() => handleFieldClick(field)}
                        icon={React.createElement(fieldConfig.icon, { fontSize: 'small' })}
                        color="rgb(13, 148, 136)"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              </Paper>
            )}

            {/* PDF Container - Single Page Only */}
            <Paper 
              ref={containerRef}
              elevation={1} 
              sx={{ 
                flex: 1, 
                position: 'relative',
                overflow: 'auto',
                borderRadius: 2,
                bgcolor: '#e0e0e0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                p: 2
              }}
            >
              {documentUrl && (
                <Box
                  ref={pdfContainerRef}
                  sx={{ 
                    position: 'relative',
                    maxWidth: '100%'
                  }}
                >
                  <Document
                    file={documentUrl}
                    onLoadSuccess={handleDocumentLoadSuccess}
                    loading={
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                      </Box>
                    }
                    error={
                      <Alert severity="error">
                        Failed to load PDF document
                      </Alert>
                    }
                  >
                    {/* Render only the current page */}
                    {/* <Box
                      sx={{
                        position: 'relative',
                        width: pageDimensions[currentPage]?.renderWidth 
                          ? pageDimensions[currentPage].renderWidth * zoom 
                          : 'auto'
                      }}
                    >
                      <Page
                        pageNumber={currentPage}
                        scale={zoom}
                        renderAnnotationLayer={false}
                        renderTextLayer={true}
                        onLoadSuccess={(page) => handlePageLoadSuccess(page, currentPage)}
                      />*/}

                      {/* Field overlays for current page only */}
                      {/* {pageDimensions[currentPage] && (
                        <PdfPageWithOverlays
                          pageNumber={currentPage}
                          
                          fields={fields}
                          pageDimensions={pageDimensions[currentPage]}
                          onFieldClick={handleFieldClick}
                          recipientColors={recipientColors}
                          fieldValues={fieldValues}
                        />
                      )}
                    </Box>  */}

                    {Array.from({ length: numPages }, (_, index) => {
  const pageNum = index + 1;

  return (
    <Box
      key={pageNum}
      id={`page-${pageNum}`}
      sx={{
        position: 'relative',
        mb: 4,
        scrollMarginTop: '80px' // important for scrolling from thumbnails
      }}
    >
      <Page
        pageNumber={pageNum}
        scale={zoom}
        renderAnnotationLayer={false}
        renderTextLayer={true}
        onLoadSuccess={(page) => handlePageLoadSuccess(page, pageNum)}
      />

      {pageDimensions[pageNum] && (
        <PdfPageWithOverlays
          pageNumber={pageNum}
          fields={fields}
          pageDimensions={pageDimensions[pageNum]}
          onFieldClick={handleFieldClick}
          recipientColors={recipientColors}
          fieldValues={fieldValues}
        />
      )}
    </Box>
  );
})}

                  </Document>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>

        {/* Mobile bottom navigation */}
        <Box sx={{ 
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'white',
          borderTop: 1,
          borderColor: 'divider',
          p: 1,
          zIndex: 1000,
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          <IconButton 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
            disabled={currentPage <= 1}
            size="large"
          >
            <NavigateBeforeIcon />
          </IconButton>
          
          <Typography variant="caption" fontWeight="medium">
            Page {currentPage} of {numPages}
          </Typography>
          
          <IconButton 
            onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))} 
            disabled={currentPage >= numPages}
            size="large"
          >
            <NavigateNextIcon />
          </IconButton>
        </Box>

        {/* Enhanced Signature Pad Modal */}
        
<EnhancedSignaturePadModal
  open={modalOpen}
  onSave={(value, saveMode) => {
    console.log('Signature pad saved:', {
      field: activeField?.id,
      fieldType: modalType,
      valueType: typeof value,
      saveMode: saveMode
    });
    
    handleModalSave(value);
    
    setModalOpen(false);
    setActiveField(null);
    setModalValue(null);
  }}
  onClose={() => {
    setModalOpen(false);
    setActiveField(null);
    setModalValue(null);
    setSelectedDate(null);
    setTextInput('');
  }}
  existingSignature={activeField?.value}
  recipientData={recipientInfo}
  fieldType={modalType}
  fieldLabel={activeField?.label || FIELD_TYPES[modalType]?.label || 'Field'}
  // Pass field options for dropdown and radio fields
  fieldOptions={
    (modalType === 'dropdown' || modalType === 'radio') && activeField?.dropdown_options
      ? activeField.dropdown_options
      : []
  }
/>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

{/* Finish Confirmation Dialog */}
<Dialog
  open={finishDialogOpen}
  onClose={() => setFinishDialogOpen(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle sx={{ bgcolor: 'rgb(13, 148, 136)', color: 'white' }}>
    {finishDialogTitle}
  </DialogTitle>
  <DialogContent sx={{ pt: 3 }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {recipientInfo?.role === 'viewer' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PreviewIcon color="rgb(13, 148, 136)" />
          <Typography variant="body1" fontWeight="medium">
            Viewer Confirmation
          </Typography>
        </Box>
      )}
      
      {recipientInfo?.role === 'approver' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CheckIcon color="success" />
          <Typography variant="body1" fontWeight="medium">
            Approval Confirmation
          </Typography>
        </Box>
      )}
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
        {finishDialogMessage}
      </Typography>
      
      {/* Additional info for viewers */}
      {recipientInfo?.role === 'viewer' && (
        <Alert severity="info" sx={{ width: '100%' }}>
          <Typography variant="caption">
            <strong>Note:</strong> As a viewer, you acknowledge that you have reviewed the document. 
            This action will mark your viewing as complete.
          </Typography>
        </Alert>
      )}
      
      {/* Additional info for approvers */}
      {recipientInfo?.role === 'approver' && (
        <Alert severity="warning" sx={{ width: '100%' }}>
          <Typography variant="caption">
            <strong>Important:</strong> By approving, you confirm that you have reviewed and agree with the document contents.
          </Typography>
        </Alert>
      )}
    </Box>
  </DialogContent>
  <DialogActions sx={{ p: 2 }}>
    <Button 
      onClick={() => setFinishDialogOpen(false)}
      variant="outlined"
      disabled={completing}
    >
      Cancel
    </Button>
    <Button 
      onClick={handleFinishConfirm}
      variant="contained"
      color={
        recipientInfo?.role === 'viewer' ? 'rgb(13, 148, 136)' :
        recipientInfo?.role === 'approver' ? 'success' : 'primary'
      }
      disabled={completing}
      startIcon={completing ? <CircularProgress size={16} /> : null}
    >
      {completing ? 'Processing...' : 'Confirm'}
    </Button>
  </DialogActions>
</Dialog>




      </Box>
    </LocalizationProvider>
  );
};

export default SigningPage;