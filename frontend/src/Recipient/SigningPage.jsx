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
    CardMedia,
    Menu,
    MenuItem,
    DialogContentText,
    Table
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
    LocalOffer as StampIcon,  // Added missing StampIcon
    MoreVert as MoreVertIcon,
    Print as PrintIcon,
    Block as BlockIcon,
    ForwardToInbox as ForwardToInboxIcon,
    SkipNext as SkipNextIcon,
    AutoFixHigh as AutoFixHighIcon,
    AssignmentInd as AssignmentIndIcon,
    Info as InfoIcon,
    HelpOutline as HelpOutlineIcon,
    Timer as PostponeIcon,
    ContentCopy as ContentCopyIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    CloudDownload as CloudDownloadIcon
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
    const completed = isCompleted || !!fieldValues[field.id] || field.completed_at || field.is_completed || false;
    const isImageField = IMAGE_BASED_FIELDS.has(field.type);


    // Get display value for completed fields
    const getDisplayValue = () => {
        // For completed fields, we usually want to show the value in the overlay 
        // to give immediate feedback, unless it's already perfectly rendered on the PDF background.
        // We will remove the early return "" to allow the actual values to flow through.

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
                    return "○";

                case "dropdown":
                    return "CHOOSE ONE";

                case "textbox":
                    return "ENTER TEXT";

                case "mail":
                    return "ENTER EMAIL";

                case "attachment":
                    return "UPLOAD FILE";

                case "stamp":
                    return "STAMP";

                default:
                    return "FILL";
            }
        }

        // For completed fields, return empty string per user request.
        // The background PDF will be refreshed to show the actual value.
        if (completed) {
            return "";
        }

        return "";
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
                    boxSizing: 'border-box',
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        fontSize: field.type === 'textbox' ? '11px' : '9px',
                        fontWeight: 500,
                        color: (completed && field.type === 'attachment') ? '#2563eb' : (completed ? '#000' : 'rgb(13, 148, 136)'),
                        textDecoration: (completed && field.type === 'attachment') ? 'underline' : 'none',
                        backgroundColor: 'transparent',
                        borderRadius: '2px',
                        pointerEvents: 'none',
                        textAlign: 'center',
                        whiteSpace: (field.type === 'textbox' || field.type === 'mail') ? 'pre-wrap' : 'nowrap',
                        alignItems: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        padding: '2px',
                        lineHeight: 1.1
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
                        isCompleted={field.completed_at || field.is_completed || !!fieldValues[field.id]}
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
    documentUrl,
    onClick,
    hasFields,
    completedFields,
    totalFields,
    fields = [],
    recipientColors = {},
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
                generatePlaceholder();
                return;
            }

            if (thumbnailUrl.startsWith('data:image')) {
                if (isMounted) setThumbnailSrc(thumbnailUrl);
                return;
            }

            try {
                setError(false);
                const img = new Image();
                img.onload = () => { if (isMounted) setThumbnailSrc(thumbnailUrl); };
                img.onerror = () => { if (isMounted) { setError(true); generatePlaceholder(); } };
                if (thumbnailUrl.includes(API_BASE_URL)) img.crossOrigin = 'anonymous';
                img.src = thumbnailUrl;
            } catch (err) {
                console.error('Failed to load thumbnail:', err);
                if (isMounted) { setError(true); generatePlaceholder(); }
            }
        };

        const generatePlaceholder = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 140;
            canvas.height = 190;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fcfcfc';
            ctx.fillRect(0, 0, 140, 190);
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.strokeRect(5, 5, 130, 180);
            const dataUrl = canvas.toDataURL('image/png');
            if (isMounted) setThumbnailSrc(dataUrl);
        };

        loadThumbnail();
        return () => { isMounted = false; };
    }, [thumbnailUrl, pageNumber, isActive]);

    return (
        <Box
            onClick={onClick}
            sx={{
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                mb: 2.5,
                '&:hover': { transform: 'translateY(-2px)' }
            }}
        >
            <Paper
                elevation={isActive ? 6 : 1}
                sx={{
                    width: 140,
                    height: 190,
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
                {/* Thumbnail Background (PDF Page) */}
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#fff',
                        position: 'relative'
                    }}
                >
                    {documentUrl ? (
                        <Document file={documentUrl}>
                            <Page
                                pageNumber={pageNumber}
                                width={140}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                            />
                        </Document>
                    ) : (
                        <CircularProgress size={20} thickness={3} sx={{ color: '#0f766e' }} />
                    )}
                </Box>

                {/* Mini-Map: Fields position tracking (Editor-style) */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 3,
                        overflow: 'hidden'
                    }}
                >
                    {fields
                        .filter((f) => f.page === pageNumber - 1)
                        .map((f, idx) => {
                            // Standard PDF Dimensions (SafeSign uses 612x792 points as standard)
                            const PDF_W = 612;
                            const PDF_H = 792;

                            // Extract values, prioritizing pdf_ properties which are absolute
                            const x = f.pdf_x ?? f.x ?? 0;
                            const y = f.pdf_y ?? f.y ?? 0;
                            const w = f.pdf_width ?? f.width ?? 100;
                            const h = f.pdf_height ?? f.height ?? 30;

                            // Calculate percentages relative to PDF units
                            const left = (x / PDF_W) * 100;
                            let top = (y / PDF_H) * 100;

                            // Invert Y if it's a PDF coordinate (bottom-up origin)
                            if (f.pdf_y !== undefined) {
                                top = 100 - ((y + h) / PDF_H * 100);
                            }

                            const width = (w / PDF_W) * 100;
                            const height = (h / PDF_H) * 100;

                            const isDone = f.completed_at || f.is_completed;
                            const color = recipientColors[f.recipient_id] || '#0f766e';

                            return (
                                <Box
                                    key={f.id || idx}
                                    sx={{
                                        position: 'absolute',
                                        left: `${Math.max(0, Math.min(100, left))}%`,
                                        top: `${Math.max(0, Math.min(100, top))}%`,
                                        width: `${Math.max(4, width)}%`,
                                        height: `${Math.max(4, height)}%`,
                                        backgroundColor: isDone ? 'rgba(156, 163, 175, 0.4)' : `${color}33`,
                                        border: `0.5px solid ${isDone ? '#9ca3af' : color}`,
                                        borderRadius: '0.5px',
                                        zIndex: 2,
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            );
                        })}
                </Box>

                {/* Floating Badges */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        right: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pointerEvents: 'none',
                        zIndex: 4
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: isActive ? '#0f766e' : 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            px: 1,
                            py: 0.2,
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backdropFilter: 'blur(4px)',
                            border: isActive ? '1px solid rgba(255,255,255,0.3)' : 'none'
                        }}
                    >
                        {pageNumber}
                    </Box>

                    {hasFields && (
                        <Box
                            sx={{
                                bgcolor: completedFields === totalFields ? '#0f766e' : '#fff',
                                color: completedFields === totalFields ? '#fff' : '#0f766e',
                                border: `1px solid ${completedFields === totalFields ? '#0f766e' : '#e5e7eb'}`,
                                px: 0.8,
                                py: 0.2,
                                borderRadius: '4px',
                                fontSize: '9px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.2,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {completedFields === totalFields ? <CheckIcon sx={{ fontSize: 10 }} /> : `${completedFields}/${totalFields}`}
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
});

DocumentPageThumbnail.displayName = 'DocumentPageThumbnail';

// ======================
// MAIN SIGNING PAGE COMPONENT (Zoho-style)

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

    // More Actions menu state
    const [actionsAnchor, setActionsAnchor] = useState(null);
    const [isQuickSignMode, setIsQuickSignMode] = useState(false);

    // New action dialogs
    const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
    const [skipDialogOpen, setSkipDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignEmail, setAssignEmail] = useState('');
    const [assignName, setAssignName] = useState('');
    const [assignReason, setAssignReason] = useState('');
    // New action dialogs
    const [declineReason, setDeclineReason] = useState('');
    // Document History state
    const [historyData, setHistoryData] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

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
        const totalCount = fields.length;

        if (role === 'viewer') {
            setFinishDialogTitle('Confirm Document Review');
            setFinishDialogMessage('I confirm that I have reviewed this document in its entirety. Marking as viewed will notify the sender.');
            setFinishDialogAction('viewed');
        } else if (role === 'approver') {
            setFinishDialogTitle('Confirm Approval');
            setFinishDialogMessage('By clicking confirm, you acknowledge that you have reviewed and approve the document content.');
            setFinishDialogAction('approved');
        } else if (role === 'witness') {
            setFinishDialogTitle('Finalize Witnessing');
            setFinishDialogMessage('You have completed the witnessing process. Proceed to finalize your witness signatures?');
            setFinishDialogAction('signed');
        } else if (role === 'form_filler') {
            setFinishDialogTitle('Submit Form Information');
            setFinishDialogMessage(`You have filled all ${totalCount} form fields. Are you ready to submit your information?`);
            setFinishDialogAction('signed');
        } else {
            setFinishDialogTitle('Finalize Signing');
            setFinishDialogMessage('You have completed all required fields. Ready to finalize your legally binding signatures?');
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

            // 1. Fetch recipient info first to check for terminal states
            const recipientData = await apiService.fetchRecipientInfo(recipientId);
            setRecipientInfo(recipientData.recipient);
            setDocumentInfo(recipientData.document);

            const signingInfo = recipientData.signing_info;
            if (signingInfo) {
                // 🔐 SECURITY CHECK: Prevent OTP/Terms bypass
                if (signingInfo.requires_otp || (signingInfo.requires_terms && signingInfo.terms_status !== 'accepted')) {
                    console.warn('Identity verification or terms acceptance required. Redirecting...');
                    window.location.href = `/verify/${recipientId}`;
                    return;
                }

                // Handle terminal document/recipient states early
                if (signingInfo.terms_status === 'declined' || signingInfo.document_status === 'declined' || recipientData.recipient?.status === 'declined') {
                    window.location.href = `/sign/${recipientId}/declined`;
                    return;
                }

                if (signingInfo.document_status === 'expired') {
                    window.location.href = `/sign/${recipientId}/expired`;
                    return;
                }

                if (signingInfo.document_status === 'voided' || signingInfo.is_voided) {
                    window.location.href = `/sign/${recipientId}/voided`;
                    return;
                }
            }

            // 2. Fetch document and fields in parallel only if state is active
            const [documentBlob, fieldsData] = await Promise.all([
                apiService.fetchDocument(recipientId),
                apiService.fetchFields(recipientId)
            ]);


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

    const handleActionsMenuOpen = (event) => {
        setActionsAnchor(event.currentTarget);
    };

    const handleActionsMenuClose = () => {
        setActionsAnchor(null);
    };

    const handleAutofillAllFields = async () => {
        handleActionsMenuClose();

        // Find all incomplete fields (not just signatures)
        const incompleteFields = fields.filter(f => !f.completed_at);

        if (incompleteFields.length === 0) {
            showSnackbar('All fields are already completed', 'info');
            return;
        }

        // Set quick sign mode flag and open the first incomplete field
        setIsQuickSignMode(true);
        handleFieldClick(incompleteFields[0]);
    };

    const handleDeclineDocument = async () => {
        handleActionsMenuClose();
        setDeclineDialogOpen(true);
    };

    const handleConfirmDecline = async () => {
        try {
            setCompleting(true);
            // API call to decline document (should be implemented in backend)
            const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/decline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: declineReason })
            });

            if (!response.ok) throw new Error('Failed to decline document');

            showSnackbar('Document declined successfully', 'info');
            setDeclineDialogOpen(false);
            navigate(`/sign/${recipientId}/declined`);
        } catch (err) {
            showSnackbar(err.message, 'error');
        } finally {
            setCompleting(false);
        }
    };

    const handleSkipSigning = () => {
        handleActionsMenuClose();
        setSkipDialogOpen(true);
    };

    const handleAssignToSomeoneElse = () => {
        handleActionsMenuClose();
        setAssignDialogOpen(true);
    };

    const handleConfirmAssign = async () => {
        try {
            setCompleting(true);
            const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/assign-to-others`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_email: assignEmail,
                    new_name: assignName,
                    reason: assignReason
                })
            });

            if (!response.ok) throw new Error('Failed to assign document');

            showSnackbar(`Document assigned to ${assignEmail}`, 'success');
            setAssignDialogOpen(false);
            // Wait a moment then close or redirect
            setTimeout(() => {
                window.location.href = '/recipient/home';
            }, 1500);
        } catch (err) {
            showSnackbar(err.message, 'error');
        } finally {
            setCompleting(false);
        }
    };

    const handleOpenHistory = async () => {
        handleActionsMenuClose();
        setHistoryDialogOpen(true);
        setLoadingHistory(true);
        try {
            const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/history`);
            if (!response.ok) throw new Error('Failed to fetch history');
            const data = await response.json();
            setHistoryData(data);
        } catch (err) {
            showSnackbar('Error loading history', 'error');
        } finally {
            setLoadingHistory(false);
        }
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
                    ...valueFromModal,
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
                    valueToSave = {
                        ...valueFromModal,
                        value: valueFromModal.value || ''
                    };
                }
                else if (modalType === 'mail') {
                    // Email fields
                    valueToSave = {
                        ...valueFromModal,
                        value: valueFromModal.value || ''
                    };
                }
                else if (modalType === 'attachment') {
                    // Attachment fields - support base64 upload
                    if (valueFromModal && valueFromModal.data) {
                        valueToSave = {
                            ...valueFromModal,
                            value: valueFromModal.filename || 'Attached File'
                        };
                    } else {
                        throw new Error('Please upload a file first');
                    }
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
                            ...result.field, // Use updated coordinates and dimensions from server
                            value: valueToSave,
                            completed_at: result.field?.completed_at || new Date().toISOString(),
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

            setModalValue(null);
            setSelectedDate(null);
            setTextInput('');

            // 🔥 CONTINUOUS SIGNING / AUTOFILL LOGIC
            if (isQuickSignMode) {
                let remainingFields = [];

                // 1. Signature bulk-autofill logic (if applicable)
                if (modalType === 'signature' || modalType === 'initials' || modalType === 'stamp') {
                    const otherFields = fields.filter(f =>
                        !f.completed_at &&
                        f.id !== activeField.id &&
                        f.type === modalType
                    );

                    if (otherFields.length > 0) {
                        showSnackbar(`Autofilling ${otherFields.length} other signature field(s)...`, 'info');

                        await Promise.all(otherFields.map(field =>
                            apiService.saveFieldValue(recipientId, field.id, valueToSave)
                        ));

                        // Update local fields state for bulk fill
                        const bulkIds = new Set(otherFields.map(f => f.id));
                        setFields(prev => prev.map(f => {
                            if (bulkIds.has(f.id)) {
                                return {
                                    ...f,
                                    value: valueToSave,
                                    completed_at: new Date().toISOString(),
                                    is_completed: true
                                };
                            }
                            return f;
                        }));

                        setFieldValues(prev => {
                            const newValues = { ...prev };
                            bulkIds.forEach(id => { newValues[id] = valueToSave; });
                            return newValues;
                        });
                    }
                }

                // 2. Find the next field to sign (after potential bulk fill)
                // We re-query the current state of completion
                setFields(latestFields => {
                    const nextIncomplete = latestFields.find(f => !f.completed_at && f.id !== activeField.id);

                    if (nextIncomplete) {
                        showSnackbar(`Moving to next field: ${FIELD_TYPES[nextIncomplete.type]?.label || nextIncomplete.type}...`, 'info');
                        setTimeout(() => handleFieldClick(nextIncomplete), 600);
                    } else {
                        setIsQuickSignMode(false);
                        showSnackbar('Great! All fields have been completed.', 'success');
                        setTimeout(() => showFinishConfirmation(), 800);
                    }
                    return latestFields;
                });
            } else {
                // Not in quick sign mode - just move page if needed
                const nextPage = findNextPageWithIncompleteFields(fields, currentPage);
                if (nextPage && nextPage !== currentPage) {
                    setTimeout(() => setCurrentPage(nextPage), 300);
                }
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
            // Don't auto-reset isQuickSignMode here, it's handled in the success block
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
        // Treat signatures, initials, and stamps as required by default if not specified
        const requiredFields = fields.filter(f => f.required !== false && (f.required === true || ['signature', 'initials', 'stamp'].includes(f.type)));
        const completedRequired = requiredFields.filter(f => f.completed_at).length;
        const allFields = fields.length;
        const allCompleted = fields.filter(f => f.completed_at).length;

        const allRequiredCompleted = requiredFields.length > 0
            ? (requiredFields.length === completedRequired)
            : (allFields > 0 ? (allFields === allCompleted) : recipientInfo?.status === 'completed');

        return {
            totalRequired: requiredFields.length,
            completedRequired,
            totalFields: allFields,
            completedFields: allCompleted,
            percentage: requiredFields.length ? (completedRequired / requiredFields.length) * 100 : 0,
            allRequiredCompleted,
            showFinishButton: allRequiredCompleted
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
                    <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 2 } }}>
                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, overflow: 'hidden' }}>
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
                                            width: { xs: 28, sm: 32 },
                                            height: { xs: 28, sm: 32 }
                                        }}
                                    >
                                        {recipientInfo.role === 'viewer' ? <PreviewIcon /> :
                                            recipientInfo.role === 'approver' ? <CheckIcon /> :
                                                <PersonIcon />}
                                    </Avatar>
                                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        <Typography variant="subtitle1" fontWeight="600" sx={{ fontSize: { sm: '0.875rem', md: '1rem' } }}>
                                            {recipientInfo.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {getRoleDisplayName(recipientInfo.role)}
                                            {recipientInfo.role === 'viewer' && ' - Review Only'}
                                            {/* {recipientInfo.role === 'approver' && ' - Approval Required'} */}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'flex' } }} />

                                {recipientInfo.role === 'viewer' && (
                                    <Chip
                                        label="View Only"
                                        size="small"
                                        color="info"
                                        variant="outlined"
                                        icon={<PreviewIcon />}
                                        sx={{ display: { xs: 'none', md: 'flex' } }}
                                    />
                                )}

                                {recipientInfo.role === 'approver' && (
                                    <Chip
                                        label="Approval Required"
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        icon={<CheckIcon />}
                                        sx={{ display: { xs: 'none', md: 'flex' } }}
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

                            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'flex' } }} />

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                                sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: { sm: 120, md: 240 } }}
                            >
                                {documentInfo?.filename}
                            </Typography>

                            <Chip
                                label={`${progress.completedFields}/${progress.totalFields}`}
                                color={progress.allRequiredCompleted ? "success" : "default"}
                                size="small"
                                variant="outlined"
                                title={`${progress.completedFields}/${progress.totalFields} fields`}
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
                                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
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
                                        // color={
                                        //   recipientInfo.role === 'viewer' ? 'rgb(13, 148, 136)' :
                                        //   recipientInfo.role === 'approver' ? 'success' : 'primary'
                                        // }
                                        sx={{ minWidth: { xs: 80, sm: 120 }, backgroundColor: 'rgb(13, 148, 136)', display: { xs: 'none', sm: 'inline-flex' } }}
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

                            {/* More Actions Dropdown */}
                            <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                onClick={handleActionsMenuOpen}
                                endIcon={<ExpandMoreIcon sx={{ fontSize: 18, display: { xs: 'none', sm: 'block' } }} />}
                                sx={{
                                    textTransform: 'none',
                                    borderColor: '#e0e0e0',
                                    color: '#555',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    px: { xs: 1, sm: 1.5 },
                                    minWidth: 'auto',
                                    '&:hover': { bgcolor: '#f9f9f9', borderColor: '#d0d0d0' }
                                }}
                            >
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>More actions</Box>
                                <MoreVertIcon sx={{ fontSize: 20, display: { xs: 'block', sm: 'none' } }} />
                            </Button>

                            {/* Standalone Quick Sign Button for accessibility */}
                            {/* Standalone Quick Sign Button for accessibility */}
                            {!progress.allRequiredCompleted && fields.filter(f => !f.completed_at).length > 0 && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleAutofillAllFields}
                                    startIcon={<AutoFixHighIcon sx={{ fontSize: 16 }} />}
                                    sx={{
                                        color: 'rgb(13, 148, 136)',
                                        borderColor: 'rgba(13, 148, 136, 0.5)',
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        fontSize: '0.8rem',
                                        px: 1.2,
                                        minWidth: 'auto',
                                        display: { xs: 'none', md: 'inline-flex' },
                                        '&:hover': { borderColor: 'rgb(11, 130, 120)', bgcolor: 'rgba(13, 148, 136, 0.05)' }
                                    }}
                                >
                                    Quick Sign ({fields.filter(f => !f.completed_at).length})
                                </Button>
                            )}
                            <Menu
                                anchorEl={actionsAnchor}
                                open={Boolean(actionsAnchor)}
                                onClose={handleActionsMenuClose}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                PaperProps={{
                                    elevation: 3,
                                    sx: { mt: 1, minWidth: 220, borderRadius: 1.5 }
                                }}
                            >
                                {!progress.allRequiredCompleted && (
                                    <MenuItem onClick={handleAutofillAllFields} sx={{ py: 1.5 }}>
                                        <ListItemIcon><AutoFixHighIcon fontSize="small" sx={{ color: 'rgb(13, 148, 136)' }} /></ListItemIcon>
                                        <ListItemText
                                            primary="Quick Sign Wizard"
                                            secondary="Complete all fields one by one automatically"
                                            primaryTypographyProps={{ fontWeight: 'bold' }}
                                        />
                                    </MenuItem>
                                )}

                                <MenuItem onClick={handleAssignToSomeoneElse}>
                                    <ListItemIcon><AssignmentIndIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Assign to someone else" secondary="Delegate this document" />
                                </MenuItem>

                                <MenuItem onClick={() => { handleActionsMenuClose(); handleDownload('current'); }}>
                                    <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Print and physically sign" secondary="Offline completion" />
                                </MenuItem>

                                <Divider sx={{ my: 0.5 }} />

                                <MenuItem onClick={handleOpenHistory}>
                                    <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Document History" secondary="View audit logs" />
                                </MenuItem>

                                <MenuItem onClick={handleDeclineDocument} sx={{ color: 'error.main' }}>
                                    <ListItemIcon><BlockIcon fontSize="small" color="error" /></ListItemIcon>
                                    <ListItemText primary="Decline" secondary="Reject the document" />
                                </MenuItem>

                                <MenuItem onClick={handleSkipSigning}>
                                    <ListItemIcon><SkipNextIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Skip for now" secondary="Decide later" />
                                </MenuItem>
                            </Menu>
                        </Box>



                    </Toolbar>
                </AppBar>

                {/* Mobile floating Finish button (visible only on xs/sm) */}
                {documentInfo?.status !== 'completed' &&
                    (progress.showFinishButton || recipientInfo?.role === 'viewer' || recipientInfo?.role === 'approver') && (
                        <Box sx={{
                            display: { xs: 'flex', sm: 'none' },
                            position: 'fixed',
                            bottom: 16,
                            right: 16,
                            zIndex: 1200
                        }}>
                            <Button
                                variant="contained"
                                size="medium"
                                onClick={() => {
                                    if (recipientInfo?.status === 'completed') {
                                        navigate(`/complete/${recipientId}`);
                                    } else {
                                        showFinishConfirmation();
                                    }
                                }}
                                disabled={completing}
                                sx={{
                                    bgcolor: 'rgb(13, 148, 136)',
                                    borderRadius: '24px',
                                    px: 3,
                                    py: 1,
                                    fontWeight: 700,
                                    boxShadow: '0 4px 16px rgba(13,148,136,0.4)',
                                    '&:hover': { bgcolor: 'rgb(11, 120, 110)' }
                                }}
                            >
                                {completing ? <CircularProgress size={18} color="inherit" /> :
                                    recipientInfo.role === 'viewer' ? 'Mark Viewed' :
                                        recipientInfo.role === 'approver' ? 'Approve' : 'Finish'}
                            </Button>
                        </Box>
                    )}

                {/* Main content - Zoho-style layout */}
                <Box sx={{ display: 'flex', height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' } }}>
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
                                            fields={fields}
                                            recipientColors={recipientColors}
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
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0', }}>
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
                    fieldWidth={activeField?.pdf_width || activeField?.width || 100}
                    fieldHeight={activeField?.pdf_height || activeField?.height || 40}
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

                {/* Finish Confirmation Dialog - Enterprise Grade UI */}
                <Dialog
                    open={finishDialogOpen}
                    onClose={() => setFinishDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 2, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }
                    }}
                >
                    <DialogTitle sx={{
                        bgcolor: 'rgb(13, 148, 136)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 2.5
                    }}>
                        {recipientInfo?.role === 'viewer' ? <PreviewIcon /> :
                            recipientInfo?.role === 'approver' ? <CheckCircleIcon /> :
                                recipientInfo?.role === 'witness' ? <HistoryIcon /> :
                                    <SignatureIcon />}
                        <Typography variant="h6" fontWeight="bold">
                            {finishDialogTitle}
                        </Typography>
                    </DialogTitle>

                    <DialogContent sx={{ pt: 4, pb: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Hero Message */}
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" color="text.primary" gutterBottom>
                                    Great job! You're almost done.
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {finishDialogMessage}
                                </Typography>
                            </Box>

                            {/* Details Summary Card */}
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9fafb', borderStyle: 'dashed' }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Document Details
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">Filename:</Typography>
                                    <Typography variant="body2">{documentInfo?.filename}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight="medium">Your Role:</Typography>
                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{recipientInfo?.role}</Typography>
                                </Box>
                            </Paper>

                            {/* What Happens Next Section */}
                            <Box>
                                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                    What happens next?
                                </Typography>
                                <List dense sx={{ pl: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                                        <Box sx={{ mt: 0.5, p: 0.5, borderRadius: '50%', bgcolor: 'rgba(13, 148, 136, 0.1)', color: 'rgb(13, 148, 136)', display: 'flex' }}>
                                            <CheckIcon sx={{ fontSize: 14 }} />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            The sender and other recipients will be notified of your completion.
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        <Box sx={{ mt: 0.5, p: 0.5, borderRadius: '50%', bgcolor: 'rgba(13, 148, 136, 0.1)', color: 'rgb(13, 148, 136)', display: 'flex' }}>
                                            <CloudDownloadIcon sx={{ fontSize: 14 }} />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            You will receive a copy of the fully executed document via email once everyone has signed.
                                        </Typography>
                                    </Box>
                                </List>
                            </Box>

                            {/* Legal Footnote for signing roles */}
                            {['signer', 'witness', 'form_filler'].includes(recipientInfo?.role) && (
                                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', display: 'block', mt: 1 }}>
                                    By clicking 'Confirm', you agree that your electronic signature is as legally binding as a handwritten signature.
                                </Typography>
                            )}
                        </Box>
                    </DialogContent>

                    <DialogActions sx={{ p: 3, gap: 1 }}>
                        <Button
                            onClick={() => setFinishDialogOpen(false)}
                            variant="text"
                            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
                            disabled={completing}
                        >
                            Review Again
                        </Button>
                        <Button
                            onClick={handleFinishConfirm}
                            variant="contained"
                            disabled={completing}
                            sx={{
                                px: 4,
                                py: 1,
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                backgroundColor: 'rgb(13, 148, 136)',
                                '&:hover': {
                                    backgroundColor: 'rgb(11, 130, 120)',
                                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                                }
                            }}
                            startIcon={completing ? <CircularProgress size={18} color="inherit" /> : null}
                        >
                            {completing ? 'Processing...' : 'Confirm & Finish'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Decline Document Dialog */}
                <Dialog open={declineDialogOpen} onClose={() => setDeclineDialogOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle>Decline Document</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            Are you sure you want to decline signing this document? The owner will be notified.
                        </DialogContentText>
                        <TextField
                            autoFocus
                            label="Reason for declining"
                            fullWidth
                            multiline
                            rows={3}
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Optional: Provide a reason for the sender"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeclineDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmDecline} color="error" variant="contained" disabled={completing}>
                            Decline
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Skip Signing Dialog */}
                <Dialog open={skipDialogOpen} onClose={() => setSkipDialogOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                        <PostponeIcon sx={{ fontSize: 48, color: 'rgb(13, 148, 136)', mb: 1 }} />
                        <Typography variant="h6" display="block">Skip for Now?</Typography>
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            That's perfectly fine! You can take your time to review the document and return whenever you're ready to take action.
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            Would you like to complete this later?
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                        <Button onClick={() => setSkipDialogOpen(false)} variant="outlined">
                            No, Stay here
                        </Button>
                        <Button
                            onClick={() => {
                                setSkipDialogOpen(false);
                                showSnackbar('You can return anytime via the original link.', 'info');
                                setTimeout(() => navigate('/recipient/home'), 1500);
                            }}
                            variant="contained"
                            sx={{ bgcolor: 'rgb(13, 148, 136)', '&:hover': { bgcolor: 'rgb(11, 130, 120)' } }}
                        >
                            Yes, Leave Now
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Assign to Others Dialog */}
                <Dialog
                    open={assignDialogOpen}
                    onClose={() => setAssignDialogOpen(false)}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 2 } }}
                >
                    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold">Assign to someone else</Typography>
                        <IconButton onClick={() => setAssignDialogOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <Divider />
                    <DialogContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                            {/* Email Field */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography sx={{ minWidth: 80, color: '#555', fontWeight: 500, fontSize: '0.9rem' }}>Email:</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Email"
                                    value={assignEmail}
                                    onChange={(e) => setAssignEmail(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1,
                                            '& fieldset': { borderColor: '#e0e0e0' },
                                            '&:hover fieldset': { borderColor: 'rgb(13, 148, 136)' }
                                        }
                                    }}
                                />
                            </Box>

                            {/* Name Field */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography sx={{ minWidth: 80, color: '#555', fontWeight: 500, fontSize: '0.9rem' }}>Name:</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Name"
                                    value={assignName}
                                    onChange={(e) => setAssignName(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1,
                                            '& fieldset': { borderColor: '#e0e0e0' }
                                        }
                                    }}
                                />
                            </Box>

                            {/* Reason Field */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Typography sx={{ minWidth: 80, color: '#555', fontWeight: 500, fontSize: '0.9rem', pt: 1 }}>Reason:</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Enter the reason"
                                    value={assignReason}
                                    onChange={(e) => setAssignReason(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1,
                                            '& fieldset': { borderColor: '#e0e0e0' }
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, pb: 3, gap: 1, justifyContent: 'flex-end', px: 3 }}>
                        <Button
                            onClick={() => setAssignDialogOpen(false)}
                            variant="outlined"
                            sx={{
                                px: 3,
                                borderRadius: 1.5,
                                borderColor: '#e0e0e0',
                                color: '#333',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                '&:hover': { borderColor: '#ccc', bgcolor: '#f9f9f9' }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmAssign}
                            variant="contained"
                            disabled={!assignEmail || !assignName || completing}
                            sx={{
                                px: 3,
                                borderRadius: 1.5,
                                bgcolor: 'rgb(13, 148, 136)',
                                '&:hover': { bgcolor: 'rgb(11, 130, 120)' },
                                textTransform: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            {completing ? <CircularProgress size={20} color="inherit" /> : 'Assign to someone else'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Document History Dialog - High Fidelity */}
                <Dialog
                    open={historyDialogOpen}
                    onClose={() => setHistoryDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 2 } }}
                >
                    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold">Document history</Typography>
                        <IconButton onClick={() => setHistoryDialogOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <Divider />
                    <DialogContent sx={{ p: 4 }}>
                        {loadingHistory ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                        ) : historyData ? (
                            <Box>
                                {/* 1. Document details */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#444' }}>
                                        Document details
                                    </Typography>
                                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                                        <Grid item xs={12} md={7}>
                                            <Box sx={{ display: 'flex', mb: 1 }}>
                                                <Typography sx={{ minWidth: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Document ID</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                                        : {historyData.document.envelope_id || historyData.document.id.substring(0, 8).toUpperCase() + '...'}
                                                    </Typography>
                                                    <IconButton size="small" onClick={() => {
                                                        navigator.clipboard.writeText(historyData.document.id);
                                                        showSnackbar('Document ID copied!', 'success');
                                                    }}>
                                                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', mb: 1 }}>
                                                <Typography sx={{ minWidth: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Document name</Typography>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>: {historyData.document.filename}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', mb: 1 }}>
                                                <Typography sx={{ minWidth: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Sender</Typography>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                                    : {historyData.document.owner.name} &lt;{historyData.document.owner.email}&gt;
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex' }}>
                                                <Typography sx={{ minWidth: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Organization name</Typography>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>: {historyData.document.owner.organization}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={5}>
                                            <Box sx={{ display: 'flex', mb: 1 }}>
                                                <Typography sx={{ minWidth: 100, color: 'text.secondary', fontSize: '0.9rem' }}>Created on</Typography>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                                    : {historyData.document.created_at ? format(new Date(historyData.document.created_at), 'MMM dd, yyyy | hh:mm a') : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', mb: 1 }}>
                                                <Typography sx={{ minWidth: 100, color: 'text.secondary', fontSize: '0.9rem' }}>Sent on</Typography>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                                    : {historyData.document.sent_at ? format(new Date(historyData.document.sent_at), 'MMM dd, yyyy | hh:mm a') : 'N/A'}
                                                    {historyData.document.status === 'sent' && <Typography component="span" sx={{ color: 'warning.main', ml: 1, fontSize: '0.8rem' }}>&lt;Active&gt;</Typography>}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex' }}>
                                                <Typography sx={{ minWidth: 100, color: 'text.secondary', fontSize: '0.9rem' }}>Time zone</Typography>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>: {historyData.document.time_zone}</Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* 2. Recipients */}
                                <Box sx={{ mb: 4 }}>
                                    <Box
                                        onClick={() => {/* Toggle accordion if needed */ }}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            cursor: 'pointer',
                                            mb: 2
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#444' }}>Recipients</Typography>
                                        <ArrowDownIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Box sx={{ pl: 2 }}>
                                        {historyData.recipients.map((rec) => (
                                            <Box key={rec.id || rec.index} sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', pt: 0.2 }}>{rec.index}</Typography>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{rec.name} &lt;{rec.email}&gt;</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {rec.received_at ? `Received on ${format(new Date(rec.received_at), 'MMM dd, yyyy | hh:mm a')}` : ''}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Typography variant="caption" sx={{
                                                    textTransform: 'capitalize',
                                                    color: rec.status === 'completed' ? 'success.main' : 'warning.main',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {rec.status === 'completed' ? 'Signed' : 'Needs to sign'}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>

                                {/* 3. Activities */}
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#444', mb: 2 }}>
                                        Activities
                                    </Typography>
                                    <Table sx={{ border: '1px solid #efefef' }}>
                                        <Box component="thead" sx={{ bgcolor: '#fbfbfb' }}>
                                            <Box component="tr">
                                                {['TIME OF ACTIVITY', 'PERFORMED BY', 'ACTION', 'ACTIVITY'].map(header => (
                                                    <Box key={header} component="th" sx={{
                                                        p: 1.5,
                                                        textAlign: 'left',
                                                        fontSize: '0.75rem',
                                                        color: 'text.secondary',
                                                        borderBottom: '1px solid #efefef',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {header}
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                        <Box component="tbody">
                                            {historyData.activities.map((act, i) => (
                                                <Box key={i} component="tr" sx={{ '&:hover': { bgcolor: '#fcfcfc' } }}>
                                                    <Box component="td" sx={{ p: 1.5, fontSize: '0.85rem', borderBottom: '1px solid #f5f5f5', minWidth: 160 }}>
                                                        {act.timestamp ? format(new Date(act.timestamp), 'MMM dd, yyyy | hh:mm a') : 'N/A'}
                                                    </Box>
                                                    <Box component="td" sx={{ p: 1.5, fontSize: '0.85rem', borderBottom: '1px solid #f5f5f5' }}>
                                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{act.performed_by.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">{act.performed_by.email}</Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">[{act.performed_by.ip}]</Typography>
                                                    </Box>
                                                    <Box component="td" sx={{ p: 1.5, borderBottom: '1px solid #f5f5f5' }}>
                                                        <Chip
                                                            size="small"
                                                            label={act.action}
                                                            sx={{
                                                                height: 24,
                                                                fontSize: '0.7rem',
                                                                fontWeight: 'bold',
                                                                bgcolor: 'white',
                                                                border: '1px solid #90caf9',
                                                                color: '#1976d2',
                                                                '&::before': {
                                                                    content: '""',
                                                                    display: 'inline-block',
                                                                    width: 6,
                                                                    height: 6,
                                                                    borderRadius: '50%',
                                                                    bgcolor: '#1976d2',
                                                                    mr: 1
                                                                }
                                                            }}
                                                        />
                                                    </Box>
                                                    <Box component="td" sx={{ p: 1.5, fontSize: '0.85rem', borderBottom: '1px solid #f5f5f5', color: '#555' }}>
                                                        {act.activity}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Table>
                                </Box>
                            </Box>
                        ) : (
                            <Typography align="center" sx={{ py: 4 }} color="text.secondary">No history available</Typography>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button
                            onClick={() => setHistoryDialogOpen(false)}
                            variant="contained"
                            sx={{
                                bgcolor: 'rgb(13, 148, 136)',
                                '&:hover': { bgcolor: 'rgb(11, 130, 120)' },
                                px: 4,
                                textTransform: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </LocalizationProvider>
    );
};

export default SigningPage;
