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
    Divider,
    Avatar,
    List,
    ListItemText,
    ListItemIcon,
    AppBar,
    Toolbar,
    Grid,
    Menu,
    MenuItem,
    DialogContentText,
    Table,
    ToggleButtonGroup,
    ToggleButton,
    Skeleton
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import {
    CheckCircle as CheckIcon,
    ArrowDropDown as ArrowDownIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    Fullscreen as FullscreenIcon,
    Download as DownloadIcon,
    Fingerprint as SignatureIcon,
    TextFields as TextIcon,
    CalendarToday as DateIcon,
    CheckBox as CheckboxIcon,
    Edit as EditIcon,
    Close as CloseIcon,
    FullscreenExit as FullscreenExitIcon,
    FitScreen as FitScreenIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    History as HistoryIcon,
    Preview as PreviewIcon,
    Refresh as RefreshIcon,
    Warning as WarningIcon,
    Attachment as AttachmentIcon,
    RadioButtonChecked as RadioIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    LocalOffer as StampIcon,  // Added missing StampIcon
    MoreVert as MoreVertIcon,
    Print as PrintIcon,
    Block as BlockIcon,
    SkipNext as SkipNextIcon,
    AutoFixHigh as AutoFixHighIcon,
    AssignmentInd as AssignmentIndIcon,
    Timer as PostponeIcon,
    ContentCopy as ContentCopyIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    CloudDownload as CloudDownloadIcon,
    Description as DescriptionIcon,
    Folder as FolderIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { EnhancedSignaturePadModal } from '../components/SignaturePad';
import FilenameDisplay from '../components/FilenameDisplay';

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
        const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/live-document?t=${Date.now()}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to fetch document');

        return response.blob();
    },

    async fetchFields(recipientId) {
        const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/fields`);
        if (!response.ok) throw new Error('Failed to fetch fields');
        return response.json();
    },

    async saveFieldValue(recipientId, fieldId, fieldValue, coords = null) {
        console.log('Saving field value:', { recipientId, fieldId, fieldValue, coords });

        try {
            const body = {
                value: fieldValue,
                ...(coords || {})
            };

            const response = await fetch(
                `${API_BASE_URL}/signing/recipient/${recipientId}/fields/${fieldId}/complete`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
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
    async resizeField(recipientId, fieldId, coords) {
        console.log('Resizing field:', { recipientId, fieldId, coords });
        try {
            const response = await fetch(
                `${API_BASE_URL}/signing/recipient/${recipientId}/fields/${fieldId}/resize`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(coords || {})
                }
            );

            if (!response.ok) {
                let errorMessage = 'Failed to update field size';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                } catch (e) {
                    const errorText = await response.text();
                    if (errorText) errorMessage = errorText;
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('Resize API error:', error);
            throw error;
        }
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

        let url = `${API_BASE_URL}/signing/recipient/${recipientId}/pages/${pageNumber}/thumbnail?width=${width}&height=${height}&v=${Date.now()}`;

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
// FIELD SORTING & READING ORDER UTILITIES
// ======================

const getFieldReadingRank = (f) => {
    const page = f.page ?? 0;
    let topOffset = 0;
    if (f.pdf_y !== undefined) {
        // PDF coordinates have origin at bottom, so higher Y is higher on page
        topOffset = Math.max(0, 800 - f.pdf_y);
    } else if (f.canvas_y !== undefined) {
        topOffset = f.canvas_y;
    } else if (f.y !== undefined) {
        topOffset = f.y;
    }
    const leftOffset = f.pdf_x ?? f.canvas_x ?? f.x ?? 0;
    return page * 1000000 + topOffset * 1000 + leftOffset;
};

const sortFieldsByReadingOrder = (fieldsList) => {
    return [...fieldsList].sort((a, b) => getFieldReadingRank(a) - getFieldReadingRank(b));
};

const getIncompleteFields = (fieldsList, values = {}) => {
    return sortFieldsByReadingOrder(fieldsList).filter(f => {
        const isDone = f.completed_at || f.is_completed || !!values[f.id];
        return !isDone;
    });
};

const findNextPendingField = (fieldsList, currentFieldId = null, values = {}) => {
    const incomplete = getIncompleteFields(fieldsList, values);
    if (incomplete.length === 0) return null;

    if (!currentFieldId) return incomplete[0];

    const currentField = fieldsList.find(f => f.id === currentFieldId);
    if (!currentField) return incomplete[0];

    const currentRank = getFieldReadingRank(currentField);
    const nextAfter = incomplete.find(f => getFieldReadingRank(f) > currentRank && f.id !== currentFieldId);
    if (nextAfter) return nextAfter;

    const firstRemaining = incomplete.find(f => f.id !== currentFieldId);
    return firstRemaining || null;
};

// Helper to trim empty transparent margins around signature/initial strokes
// to match backend PDFEngine bounds perfectly and ensure consistent sizing
const cropSignatureDataUrl = (dataUrl) => {
    return new Promise((resolve) => {
        if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
            resolve(dataUrl);
            return;
        }
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const imgData = ctx.getImageData(0, 0, img.width, img.height);
                const data = imgData.data;
                let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
                let hasContent = false;

                for (let y = 0; y < img.height; y++) {
                    for (let x = 0; x < img.width; x++) {
                        const i = (y * img.width + x) * 4;
                        const alpha = data[i + 3];
                        if (alpha > 15) {
                            const r = data[i], g = data[i + 1], b = data[i + 2];
                            if (!(r > 245 && g > 245 && b > 245)) {
                                hasContent = true;
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }
                }

                if (!hasContent) {
                    resolve(dataUrl);
                    return;
                }

                const contentW = maxX - minX + 1;
                const contentH = maxY - minY + 1;
                const padX = Math.max(4, Math.round(contentW * 0.04));
                const padY = Math.max(4, Math.round(contentH * 0.04));

                const finalMinX = Math.max(0, minX - padX);
                const finalMinY = Math.max(0, minY - padY);
                const finalMaxX = Math.min(img.width - 1, maxX + padX);
                const finalMaxY = Math.min(img.height - 1, maxY + padY);

                const finalW = finalMaxX - finalMinX + 1;
                const finalH = finalMaxY - finalMinY + 1;

                const trimmedCanvas = document.createElement('canvas');
                trimmedCanvas.width = finalW;
                trimmedCanvas.height = finalH;
                const trimmedCtx = trimmedCanvas.getContext('2d');

                trimmedCtx.drawImage(
                    canvas,
                    finalMinX, finalMinY, finalW, finalH,
                    0, 0, finalW, finalH
                );

                resolve(trimmedCanvas.toDataURL('image/png'));
            } catch (e) {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
};

// ======================
// FIELD OVERLAY COMPONENT (With Next & Pending Highlights)
// ======================

const FieldOverlay = React.memo(({
    field,
    screenPosition,
    pageDimensions,
    isCompleted,
    isNextField = false,
    onClick,
    onUpdateCoords,
    recipientColor = 'rgb(13, 148, 136)',
    isRecipientCompleted,
    fieldValues = {}
}) => {
    const elementRef = useRef(null);
    const isResizingRef = useRef(false);
    const [isResizing, setIsResizing] = useState(false);
    const fieldConfig = FIELD_TYPES[field.type] || FIELD_TYPES.textbox;

    // Check if field is completed
    const completed = isCompleted || !!fieldValues[field.id] || field.completed_at || field.is_completed || false;
    const isSignatureField = ['signature', 'initials', 'stamp', 'witness_signature'].includes(field.type);
    const isTextFormField = ['textbox', 'mail', 'date', 'dropdown', 'radio'].includes(field.type);
    
    // Can only resize if the entire recipient signing process is not yet completed (signature, text & mail fields)
    const canMoveAndResize = !isRecipientCompleted && (isSignatureField || field.type === 'textbox' || field.type === 'mail');

    // Helper to convert screen coordinates back to PDF points
    const convertScreenToPDFCoordinates = useCallback((x, y, w, h, dimensions) => {
        if (!dimensions) return { pdf_x: 0, pdf_y: 0, pdf_width: 100, pdf_height: 30 };
        const { pdfWidth, pdfHeight, renderWidth, renderHeight } = dimensions;
        const scaleX = renderWidth / pdfWidth;
        const scaleY = renderHeight / pdfHeight;
        return {
            pdf_x: x / scaleX,
            pdf_y: (renderHeight - y - h) / scaleY,
            pdf_width: w / scaleX,
            pdf_height: h / scaleY
        };
    }, []);

    // Helper to calculate min and max resize boundaries based on field type and text length
    const getFieldResizeBounds = useCallback((fieldObj, startXPos, startYPos) => {
        const renderWidth = pageDimensions?.renderWidth || 800;
        const renderHeight = pageDimensions?.renderHeight || 1100;
        const maxWidthOnPage = Math.max(60, renderWidth - startXPos - 8);
        const maxHeightOnPage = Math.max(20, renderHeight - startYPos - 8);

        const val = fieldValues[fieldObj.id] || fieldObj.value;
        let textVal = '';
        if (typeof val === 'string') {
            textVal = val;
        } else if (val && typeof val === 'object') {
            textVal = val.value || val.text || val.email || '';
        }

        if (fieldObj.type === 'mail') {
            const measuredText = String(textVal).trim() || 'ENTER EMAIL';
            // Minimum width strictly based on text length (~8.5px per char + 22px padding)
            const minW = Math.max(90, Math.min(maxWidthOnPage, Math.round(measuredText.length * 8.5 + 22)));
            // Maximum width: restricted for email (max 35 chars) to 380px or page boundary
            const maxW = Math.min(maxWidthOnPage, Math.max(minW + 30, 380));
            const minH = 26;
            const maxH = Math.min(maxHeightOnPage, 45);
            return { minW, maxW, minH, maxH };
        }

        if (fieldObj.type === 'textbox') {
            const measuredText = String(textVal).trim() || 'ENTER TEXT';
            const lines = measuredText.split('\n');
            const maxLineLen = Math.max(...lines.map(l => l.length), 0);
            // Minimum width strictly based on longest text line (~8.5px per char + 22px padding)
            const minW = Math.max(90, Math.min(maxWidthOnPage, Math.round(maxLineLen * 8.5 + 22)));
            // Maximum width: restricted for text (max 60 chars) to 520px or page boundary
            const maxW = Math.min(maxWidthOnPage, Math.max(minW + 40, 520));

            const lineCount = Math.max(1, lines.length);
            const minH = Math.max(26, Math.min(maxHeightOnPage, lineCount * 22 + 8));
            const maxH = lineCount > 1
                ? Math.min(maxHeightOnPage, Math.max(minH + 40, 200))
                : Math.min(maxHeightOnPage, 60);

            return { minW, maxW, minH, maxH };
        }

        if (fieldObj.type === 'initials') {
            return {
                minW: 40,
                maxW: Math.min(maxWidthOnPage, 160),
                minH: 22,
                maxH: Math.min(maxHeightOnPage, 90)
            };
        }

        // Signature & stamp fields
        return {
            minW: 60,
            maxW: Math.min(maxWidthOnPage, 500),
            minH: 25,
            maxH: Math.min(maxHeightOnPage, 220)
        };
    }, [pageDimensions, fieldValues]);

    // Resize handlers (No drag positioning, only resizing width and height)
    const handleResizeMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        isResizingRef.current = true;
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = elementRef.current ? elementRef.current.offsetWidth : screenPosition.width;
        const startHeight = elementRef.current ? elementRef.current.offsetHeight : screenPosition.height;
        const startLeft = screenPosition.x;
        const startTop = screenPosition.y;

        const bounds = getFieldResizeBounds(field, startLeft, startTop);
        let resized = false;

        const handleMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                resized = true;
            }

            let newWidth = startWidth + dx;
            let newHeight = startHeight + dy;

            newWidth = Math.max(bounds.minW, Math.min(newWidth, bounds.maxW));
            newHeight = Math.max(bounds.minH, Math.min(newHeight, bounds.maxH));

            if (elementRef.current) {
                elementRef.current.style.width = `${newWidth}px`;
                elementRef.current.style.height = `${newHeight}px`;
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            setIsResizing(false);
            setTimeout(() => {
                isResizingRef.current = false;
            }, 100);

            if (resized && elementRef.current) {
                let width = parseFloat(elementRef.current.style.width) || elementRef.current.offsetWidth;
                let height = parseFloat(elementRef.current.style.height) || elementRef.current.offsetHeight;

                width = Math.max(bounds.minW, Math.min(width, bounds.maxW));
                height = Math.max(bounds.minH, Math.min(height, bounds.maxH));

                // Clear inline styles so React state controls cleanly
                elementRef.current.style.width = '';
                elementRef.current.style.height = '';

                const newPdfCoords = convertScreenToPDFCoordinates(
                    startLeft,
                    startTop,
                    width,
                    height,
                    pageDimensions
                );

                if (onUpdateCoords) {
                    onUpdateCoords(field.id, {
                        ...newPdfCoords,
                        x: startLeft,
                        y: startTop,
                        canvas_x: startLeft,
                        canvas_y: startTop,
                        width: width,
                        height: height,
                        canvas_width: pageDimensions.renderWidth,
                        canvas_height: pageDimensions.renderHeight,
                        page_width: pageDimensions.pdfWidth,
                        page_height: pageDimensions.pdfHeight
                    });
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];

        e.stopPropagation();
        if (e.cancelable) e.preventDefault();

        isResizingRef.current = true;
        setIsResizing(true);

        const startX = touch.clientX;
        const startY = touch.clientY;
        const startWidth = elementRef.current ? elementRef.current.offsetWidth : screenPosition.width;
        const startHeight = elementRef.current ? elementRef.current.offsetHeight : screenPosition.height;
        const startLeft = screenPosition.x;
        const startTop = screenPosition.y;

        const bounds = getFieldResizeBounds(field, startLeft, startTop);
        let resized = false;

        const handleTouchMove = (moveEvent) => {
            if (moveEvent.touches.length !== 1) return;
            const moveTouch = moveEvent.touches[0];
            const dx = moveTouch.clientX - startX;
            const dy = moveTouch.clientY - startY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                resized = true;
                if (moveEvent.cancelable) moveEvent.preventDefault();
            }

            let newWidth = startWidth + dx;
            let newHeight = startHeight + dy;

            newWidth = Math.max(bounds.minW, Math.min(newWidth, bounds.maxW));
            newHeight = Math.max(bounds.minH, Math.min(newHeight, bounds.maxH));

            if (elementRef.current) {
                elementRef.current.style.width = `${newWidth}px`;
                elementRef.current.style.height = `${newHeight}px`;
            }
        };

        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);

            setIsResizing(false);
            setTimeout(() => {
                isResizingRef.current = false;
            }, 100);

            if (resized && elementRef.current) {
                let width = parseFloat(elementRef.current.style.width) || elementRef.current.offsetWidth;
                let height = parseFloat(elementRef.current.style.height) || elementRef.current.offsetHeight;

                width = Math.max(bounds.minW, Math.min(width, bounds.maxW));
                height = Math.max(bounds.minH, Math.min(height, bounds.maxH));

                // Clear inline styles so React state controls cleanly
                elementRef.current.style.width = '';
                elementRef.current.style.height = '';

                const newPdfCoords = convertScreenToPDFCoordinates(
                    startLeft,
                    startTop,
                    width,
                    height,
                    pageDimensions
                );

                if (onUpdateCoords) {
                    onUpdateCoords(field.id, {
                        ...newPdfCoords,
                        x: startLeft,
                        y: startTop,
                        canvas_x: startLeft,
                        canvas_y: startTop,
                        width: width,
                        height: height,
                        canvas_width: pageDimensions.renderWidth,
                        canvas_height: pageDimensions.renderHeight,
                        page_width: pageDimensions.pdfWidth,
                        page_height: pageDimensions.pdfHeight
                    });
                }
            }
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    // Helper to get signature image data if completed
    const getSignatureImage = useCallback(() => {
        const val = fieldValues[field.id] || field.value;
        if (!val) return null;
        if (typeof val === 'string') {
            if (val.startsWith('data:image')) return val;
            return null;
        }
        if (typeof val === 'object') {
            if (val.image && typeof val.image === 'string' && val.image.startsWith('data:image')) return val.image;
            if (val.data && typeof val.data === 'string' && val.data.startsWith('data:image')) return val.data;
            if (val.value) {
                if (typeof val.value === 'string' && val.value.startsWith('data:image')) {
                    return val.value;
                }
                if (typeof val.value === 'object') {
                    if (val.value.image && typeof val.value.image === 'string' && val.value.image.startsWith('data:image')) return val.value.image;
                    if (val.value.data && typeof val.value.data === 'string' && val.value.data.startsWith('data:image')) return val.value.data;
                }
            }
        }
        return null;
    }, [fieldValues, field.id, field.value]);

    const rawSigImage = isSignatureField && completed ? getSignatureImage() : null;
    const [croppedSigImage, setCroppedSigImage] = useState(rawSigImage);

    useEffect(() => {
        let isMounted = true;
        if (rawSigImage && typeof rawSigImage === 'string' && rawSigImage.startsWith('data:image')) {
            cropSignatureDataUrl(rawSigImage).then(cropped => {
                if (isMounted) {
                    setCroppedSigImage(cropped);
                }
            });
        } else {
            setCroppedSigImage(rawSigImage);
        }
        return () => { isMounted = false; };
    }, [rawSigImage]);

    // Helper to extract text information for typed signatures
    const getSignatureTextInfo = useCallback(() => {
        if (!isSignatureField || !completed) return null;
        if (field.type === 'stamp') return null;
        const val = fieldValues[field.id] || field.value;
        if (!val) return null;

        let text = null;
        let fontFamily = 'Dancing Script';
        let fontColor = '#000000';
        let isTyped = false;

        if (typeof val === 'object') {
            if (val.signature_type === 'type' || val.type === 'type' || (!val.image && val.text)) {
                text = val.text || val.value;
                isTyped = true;
                fontFamily = val.font_family || 'Dancing Script';
                fontColor = val.font_color || '#000000';
            }
        } else if (typeof val === 'string' && !val.startsWith('data:image')) {
            text = val;
            isTyped = true;
        }

        if (isTyped && text) {
            return { text: String(text), fontFamily, fontColor };
        }
        return null;
    }, [isSignatureField, completed, fieldValues, field.id, field.value]);

    const sigTextInfo = getSignatureTextInfo();

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

        // For completed fields:
        if (completed) {
            // Text-based form fields (email, date, textbox, dropdown, radio) are already stamped and displayed on the PDF document.
            // Do not show duplicate wrapped text inside the button; keep it transparent so document values show cleanly.
            if (isTextFormField) {
                return "";
            }

            if (field.type === 'stamp') {
                return "";
            }

            const val = fieldValues[field.id] || field.value;
            if (!val) return "";
            if (typeof val === 'string') {
                if (val.startsWith('data:image')) return ""; // rendered by croppedSigImage
                return val;
            }
            if (typeof val === 'object') {
                if (val.image) return ""; // rendered by croppedSigImage
                if (val.value !== undefined) {
                    if (field.type === 'checkbox' || field.type === 'approval') {
                        return val.value ? "✓" : "";
                    }
                    if (typeof val.value === 'string' && val.value.startsWith('data:image')) return "";
                    return String(val.value);
                }
                if (val.text) return String(val.text);
            }
            return "";
        }

        return "";
    };

    const displayValue = getDisplayValue();

    // Calculate font size & font styling matching real backend PDFEngine values
    let fieldFontSize = '11px';
    let fieldFontFamily = 'inherit';
    let fieldFontColor = completed ? '#000000' : 'rgb(13, 148, 136)';

    if (completed) {
        if (sigTextInfo) {
            // Typed signature / initials in PDFEngine: min(30, rect.height * 0.72)
            const calculatedSize = Math.min(32, Math.max(14, Math.round(screenPosition.height * 0.72)));
            fieldFontSize = `${calculatedSize}px`;
            fieldFontFamily = sigTextInfo.fontFamily 
                ? `${sigTextInfo.fontFamily}, 'Dancing Script', cursive, sans-serif`
                : "'Dancing Script', cursive, sans-serif";
            fieldFontColor = sigTextInfo.fontColor || '#000000';
        } else if (field.type === 'checkbox' || field.type === 'approval') {
            fieldFontSize = `${Math.min(26, Math.max(16, Math.round(screenPosition.height * 0.78)))}px`;
            fieldFontFamily = 'Arial, sans-serif';
        } else if (field.type === 'textbox' || field.type === 'mail' || field.type === 'date') {
            // PDFEngine text fields use min(font_size, rect.height * 0.8) -> ~12-16px
            const calculatedSize = Math.min(18, Math.max(12, Math.round(screenPosition.height * 0.60)));
            fieldFontSize = `${calculatedSize}px`;
            fieldFontFamily = 'Helvetica, Arial, sans-serif';
            fieldFontColor = (field.type === 'attachment') ? '#2563eb' : '#000000';
        } else {
            const calculatedSize = Math.min(18, Math.max(12, Math.round(screenPosition.height * 0.55)));
            fieldFontSize = `${calculatedSize}px`;
        }
    } else {
        fieldFontSize = (field.type === 'textbox' || field.type === 'mail') ? '11px' : '9px';
        fieldFontFamily = 'inherit';
        fieldFontColor = 'rgb(13, 148, 136)';
    }

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
                ref={elementRef}
                id={`field-overlay-${field.id}`}
                sx={{
                    position: 'absolute',
                    left: `${screenPosition.x}px`,
                    top: `${screenPosition.y}px`,
                    width: `${screenPosition.width}px`,
                    height: `${screenPosition.height}px`,
                    boxSizing: 'border-box',
                    backgroundColor: (completed && !isTextFormField) ? '#ffffff' : (isResizing ? 'white' : 'transparent'),

                    // Border only on hover or when incomplete/resizing
                    border: completed
                        ? (isResizing ? '1px dashed rgb(13, 148, 136)' : '1px solid transparent')
                        : `1px solid ${recipientColor}`,
                    borderStyle: canMoveAndResize ? 'dashed' : 'solid',

                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    transition: isResizing ? 'none' : 'border 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',

                    '&:hover': {
                        borderColor: completed ? 'rgb(13, 148, 136)' : recipientColor,
                        boxShadow: '0 0 0 2px rgba(13, 148, 136, 0.2)',
                        backgroundColor: (completed && !isTextFormField) ? '#ffffff' : (isResizing ? 'white' : 'rgba(13, 148, 136, 0.04)')
                    },

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    zIndex: isResizing ? 120 : 100,
                    borderRadius: '2px',
                    userSelect: 'none'
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (isResizingRef.current) {
                        return;
                    }
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
                        fontSize: fieldFontSize,
                        fontFamily: fieldFontFamily,
                        fontWeight: (sigTextInfo || !completed) ? 500 : 400,
                        color: fieldFontColor,
                        textDecoration: (completed && field.type === 'attachment') ? 'underline' : 'none',
                        backgroundColor: 'transparent',
                        borderRadius: '2px',
                        pointerEvents: 'none',
                        textAlign: 'center',
                        whiteSpace: (field.type === 'textbox' || field.type === 'mail') ? 'pre-wrap' : 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        padding: (croppedSigImage || sigTextInfo) ? '0px' : (field.type === 'textbox' ? '2px' : '1px'),
                        lineHeight: 1.15
                    }}
                >
                    {croppedSigImage ? (
                        <img 
                            src={croppedSigImage} 
                            alt="Signature" 
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain',
                                pointerEvents: 'none',
                                display: 'block'
                            }} 
                        />
                    ) : (sigTextInfo ? sigTextInfo.text : (completed && field.type === "stamp" ? "" : displayValue))}
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

                {/* Resize handle */}
                {canMoveAndResize && (
                    <Box
                        className="resize-handle"
                        sx={{
                            position: 'absolute',
                            right: 0,
                            bottom: 0,
                            width: '12px',
                            height: '12px',
                            cursor: 'se-resize',
                            zIndex: 110,
                            background: 'linear-gradient(135deg, transparent 40%, rgba(0, 0, 0, 0.3) 40%)',
                            borderBottomRightRadius: '2px',
                            '&:hover': {
                                background: 'linear-gradient(135deg, transparent 40%, rgb(13, 148, 136) 40%)'
                            }
                        }}
                        onMouseDown={handleResizeMouseDown}
                        onTouchStart={handleResizeTouchStart}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                    />
                )}
            </Box>
        </Tooltip>
    );
});

FieldOverlay.displayName = 'FieldOverlay';

// ======================
// ELEGANT DOCUMENT PAGE SKELETON
// ======================

const PageSkeleton = React.memo(({ width, height, pageNum, totalPages }) => {
    return (
        <Box
            sx={{
                width: width ? `${width}px` : '100%',
                height: height ? `${height}px` : '800px',
                minHeight: height ? `${height}px` : '800px',
                bgcolor: '#ffffff',
                p: { xs: 3, sm: 6 },
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
        >
            {/* Document Header Skeleton */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Skeleton variant="rounded" width={34} height={34} sx={{ bgcolor: 'rgba(13, 148, 136, 0.08)' }} />
                    <Box>
                        <Skeleton variant="text" width={140} height={20} animation="wave" />
                        <Skeleton variant="text" width={90} height={14} animation="wave" />
                    </Box>
                </Box>
                <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 1 }} animation="wave" />
            </Box>

            <Divider sx={{ mb: 4, opacity: 0.6 }} />

            {/* Document Title / Subheading Skeleton */}
            <Skeleton variant="text" width="55%" height={30} sx={{ mb: 1.5 }} animation="wave" />
            <Skeleton variant="text" width="35%" height={18} sx={{ mb: 4 }} animation="wave" />

            {/* Simulated Paragraph 1 */}
            <Box sx={{ mb: 3 }}>
                <Skeleton variant="text" width="98%" height={18} animation="wave" />
                <Skeleton variant="text" width="94%" height={18} animation="wave" />
                <Skeleton variant="text" width="96%" height={18} animation="wave" />
                <Skeleton variant="text" width="85%" height={18} animation="wave" />
                <Skeleton variant="text" width="60%" height={18} animation="wave" />
            </Box>

            {/* Simulated Paragraph 2 */}
            <Box sx={{ mb: 3 }}>
                <Skeleton variant="text" width="95%" height={18} animation="wave" />
                <Skeleton variant="text" width="92%" height={18} animation="wave" />
                <Skeleton variant="text" width="97%" height={18} animation="wave" />
                <Skeleton variant="text" width="70%" height={18} animation="wave" />
            </Box>

            {/* Simulated Paragraph 3 */}
            <Box sx={{ mb: 3 }}>
                <Skeleton variant="text" width="99%" height={18} animation="wave" />
                <Skeleton variant="text" width="91%" height={18} animation="wave" />
                <Skeleton variant="text" width="88%" height={18} animation="wave" />
                <Skeleton variant="text" width="50%" height={18} animation="wave" />
            </Box>

            {/* Simulated Paragraph 4 */}
            <Box sx={{ mb: 3 }}>
                <Skeleton variant="text" width="96%" height={18} animation="wave" />
                <Skeleton variant="text" width="93%" height={18} animation="wave" />
                <Skeleton variant="text" width="65%" height={18} animation="wave" />
            </Box>

            {/* Bottom Footer Skeleton */}
            <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px dashed #e2e8f0' }}>
                <Skeleton variant="text" width={110} height={16} animation="wave" />
                <Skeleton variant="text" width={50} height={16} animation="wave" />
            </Box>
        </Box>
    );
});
PageSkeleton.displayName = 'PageSkeleton';

// ======================
// SINGLE PDF PAGE WITH OVERLAYS (Updated to include completed fields & next field highlighting)
// ======================

const PdfPageWithOverlays = React.memo(({
    pageNumber,
    fields,
    pageDimensions,
    onFieldClick,
    onUpdateCoords,
    recipientColors,
    isRecipientCompleted,
    fieldValues = {},
    nextFieldId = null
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
                        pageDimensions={pageDimensions}
                        isCompleted={field.completed_at || field.is_completed || !!fieldValues[field.id]}
                        isNextField={field.id === nextFieldId}
                        onClick={onFieldClick}
                        onUpdateCoords={onUpdateCoords}
                        recipientColor={recipientColors[field.recipient_id] || 'rgb(13, 148, 136)'}
                        isRecipientCompleted={isRecipientCompleted}
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
    isLoading = false,
    fieldValues = {},
    pageDimensions = null,
    nextFieldId = null
}) => {
    const [pageMeta, setPageMeta] = useState(null);

    const handlePageLoad = useCallback((page) => {
        setPageMeta({
            width: page.originalWidth || page.width,
            height: page.originalHeight || page.height
        });
    }, []);

    // Exact page dimensions in PDF points
    const pdfW = pageDimensions?.pdfWidth || pageMeta?.width || 612;
    const pdfH = pageDimensions?.pdfHeight || pageMeta?.height || 792;
    const aspectRatio = pdfH / pdfW;

    const thumbWidth = 140;
    const thumbHeight = Math.max(80, Math.round(thumbWidth * aspectRatio));

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
                    width: thumbWidth,
                    height: thumbHeight,
                    position: 'relative',
                    overflow: 'hidden',
                    border: isActive ? '3px solid #0f766e' : '1px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                    borderRadius: '10px',
                    bgcolor: '#fff',
                    boxShadow: isActive ? '0 10px 15px -3px rgba(13, 148, 136, 0.2)' : 'none'
                }}
            >
                {/* Thumbnail Background (PDF Page) */}
                <Box
                    sx={{
                        width: thumbWidth,
                        height: thumbHeight,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bgcolor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {documentUrl ? (
                        <Document
                            file={documentUrl}
                            loading={
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                    <CircularProgress size={20} thickness={3} sx={{ color: '#0f766e' }} />
                                </Box>
                            }
                        >
                            <Page
                                pageNumber={pageNumber}
                                width={thumbWidth}
                                onLoadSuccess={handlePageLoad}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                loading={
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: thumbWidth, height: thumbHeight, bgcolor: '#ffffff' }}>
                                        <CircularProgress size={18} thickness={3} sx={{ color: '#0f766e' }} />
                                    </Box>
                                }
                            />
                        </Document>
                    ) : thumbnailUrl ? (
                        <Box
                            component="img"
                            src={thumbnailUrl}
                            alt={`Page ${pageNumber}`}
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
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
                        width: `${thumbWidth}px`,
                        height: `${thumbHeight}px`,
                        pointerEvents: 'none',
                        zIndex: 3,
                        overflow: 'hidden'
                    }}
                >
                    {fields
                        .filter((f) => f.page === pageNumber - 1)
                        .map((f, idx) => {
                            // Extract coordinates matching convertPDFToScreenCoordinates
                            const pdfX = f.pdf_x ?? f.x ?? 0;
                            const pdfY = f.pdf_y ?? f.y ?? 0;
                            const pdfFieldWidth = f.pdf_width ?? f.width ?? 100;
                            const pdfFieldHeight = f.pdf_height ?? f.height ?? 30;

                            // Convert to percentages (0 to 100%)
                            const left = (pdfX / pdfW) * 100;
                            // Y axis: in PDF points, origin is bottom-left, top is pdfH - (pdfY + pdfFieldHeight)
                            const top = ((pdfH - (pdfY + pdfFieldHeight)) / pdfH) * 100;
                            const width = (pdfFieldWidth / pdfW) * 100;
                            const height = (pdfFieldHeight / pdfH) * 100;

                            const isDone = f.completed_at || f.is_completed || !!fieldValues[f.id];
                            const isNext = f.id === nextFieldId;
                            const color = recipientColors[f.recipient_id] || '#0f766e';

                            return (
                                <Box
                                    key={f.id || idx}
                                    sx={{
                                        position: 'absolute',
                                        left: `${Math.max(0, Math.min(100 - Math.min(width, 100), left))}%`,
                                        top: `${Math.max(0, Math.min(100 - Math.min(height, 100), top))}%`,
                                        width: `${Math.max(3.5, Math.min(100, width))}%`,
                                        height: `${Math.max(3, Math.min(100, height))}%`,
                                        backgroundColor: isDone
                                            ? 'rgba(156, 163, 175, 0.45)'
                                            : (isNext ? `${color}55` : `${color}33`),
                                        border: isNext
                                            ? `1.5px solid ${color}`
                                            : `0.8px solid ${isDone ? '#9ca3af' : color}`,
                                        borderRadius: '1.5px',
                                        boxShadow: isNext ? `0 0 0 1px ${color}, 0 0 4px ${color}88` : 'none',
                                        boxSizing: 'border-box',
                                        zIndex: isNext ? 3 : 2,
                                        transition: 'all 0.25s ease'
                                    }}
                                />
                            );
                        })}
                </Box>

                {/* Floating Badges */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 6,
                        left: 6,
                        right: 6,
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
                            px: 0.9,
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
                                fontWeight: 600,
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
    const [nextFieldId, setNextFieldId] = useState(null); // Active target field to highlight & auto-scroll
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [, setModalValue] = useState(null); // Changed from string to null
    const [, setTextInput] = useState(''); // Added missing state
    const [selectedDate, setSelectedDate] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [pageDimensions, setPageDimensions] = useState({});
    const [renderedPages, setRenderedPages] = useState({});
    const [, setSaving] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [recipientColors, setRecipientColors] = useState({});
    const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);

    const [thumbnailUrls, setThumbnailUrls] = useState({});
    const [loadingThumbnails, setLoadingThumbnails] = useState(false);
    const [thumbnailPageMap, setThumbnailPageMap] = useState({});

    const [finishDialogOpen, setFinishDialogOpen] = useState(false);
    const [finishDialogTitle, setFinishDialogTitle] = useState('');
    const [finishDialogMessage, setFinishDialogMessage] = useState('');
    const [, setFinishDialogAction] = useState('');

    const documentUrlRef = useRef(null);

    // Refs
    const containerRef = useRef(null);
    const pdfContainerRef = useRef(null);

    // Auto-scroll helper: smoothly scroll to a target field and center it in the viewport
    const scrollToField = useCallback((targetField, behavior = 'smooth') => {
        if (!targetField) return;
        setNextFieldId(targetField.id);
        const targetPage = (targetField.page || 0) + 1;
        setCurrentPage(targetPage);

        // Allow layout to render / page dimensions to settle
        setTimeout(() => {
            const el = document.getElementById(`field-overlay-${targetField.id}`);
            if (el) {
                el.scrollIntoView({ behavior, block: 'center', inline: 'center' });
            } else {
                const pageEl = document.getElementById(`page-${targetPage}`);
                if (pageEl) {
                    pageEl.scrollIntoView({ behavior, block: 'start' });
                }
            }
        }, 150);
    }, []);

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
    const [isFinished, setIsFinished] = useState(false);

    const isDocumentOrRecipientCompleted = Boolean(
        recipientInfo?.status === 'completed' ||
        documentInfo?.status === 'completed' ||
        isFinished
    );

    // Generate recipient colors
    const generateRecipientColors = useCallback((fields) => {
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
    }, []);

    const refreshLiveDocumentSilently = useCallback(async () => {
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
    }, [recipientId]);

    // Reset page rendered tracking whenever documentUrl changes
    useEffect(() => {
        setRenderedPages({});
    }, [documentUrl]);

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
        setIsFinished(true);

        try {
            // Call the manual completion endpoint
            const result = await apiService.completeSigning(recipientId);
            setRecipientInfo(prev => ({ ...prev, status: 'completed' }));
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




    const loadData = useCallback(async () => {
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

            // Automatically find and highlight the first pending field in reading order
            const initialNext = findNextPendingField(fieldsData, null, initialFieldValues);
            if (initialNext) {
                setNextFieldId(initialNext.id);
            }

        } catch (err) {
            console.error('Failed to load data:', err);
            setError(err.message);
            showSnackbar('Failed to load document', 'error');
        } finally {
            setLoading(false);
        }
    }, [recipientId, generateRecipientColors]);

    // Load data on mount
    useEffect(() => {
        if (recipientId) {
            loadData();
        }
    }, [recipientId, loadData]);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    // Add this function to generate placeholder thumbnails
    const generatePlaceholderThumbnails = useCallback(() => {
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
    }, [numPages]);

    // Add this function to load thumbnails
    const preloadImportantThumbnails = useCallback((pageMap) => {
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
    }, [currentPage]);

    // Add this function to load thumbnails
    const loadThumbnails = useCallback(async () => {
        try {
            setLoadingThumbnails(true);

            if (!recipientInfo?.otp_verified) {
                console.warn('Recipient not OTP verified, cannot load thumbnails');
                setLoadingThumbnails(false);
                return;
            }

            // Get token for authentication
            const token = localStorage.getItem('signing_token') ||
                sessionStorage.getItem('signing_token') ||
                localStorage.getItem('token') ||
                sessionStorage.getItem('token') ||
                new URLSearchParams(window.location.search).get('token');

            if (!token) {
                console.warn('No authentication token found for thumbnails');
                setLoadingThumbnails(false);
                return;
            }

            // Generate thumbnail URLs for each page with cache busting
            const pageMap = {};
            const timestamp = Date.now();

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const baseUrl = `${API_BASE_URL}/signing/recipient/${recipientId}/pages/${pageNum}/thumbnail?width=120&height=150&t=${timestamp}`;
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
    }, [recipientId, numPages, recipientInfo?.otp_verified, preloadImportantThumbnails, generatePlaceholderThumbnails]);

    const handleUpdateFieldCoords = useCallback(async (fieldId, updatedCoords) => {
        // 1. Immediately update fields state synchronously so UI resizes in real-time
        setFields(prev => prev.map(f => {
            if (f.id === fieldId) {
                return {
                    ...f,
                    ...updatedCoords
                };
            }
            return f;
        }));

        // 2. Also keep activeField synced if activeField matches
        setActiveField(prev => {
            if (prev && prev.id === fieldId) {
                return {
                    ...prev,
                    ...updatedCoords
                };
            }
            return prev;
        });

        // 3. Immediately persist size change to backend API for signature and initial fields!
        try {
            const result = await apiService.resizeField(recipientId, fieldId, updatedCoords);
            if (result?.field) {
                // Update with server verified coordinates and retain field id
                setFields(prev => prev.map(f => {
                    if (f.id === fieldId) {
                        return {
                            ...f,
                            ...result.field,
                            id: fieldId
                        };
                    }
                    return f;
                }));
            }
            showSnackbar('Size updated successfully', 'success');

            // 🎯 Refresh live document and thumbnails so changes appear immediately without page refresh
            await refreshLiveDocumentSilently();
            loadThumbnails();

        } catch (err) {
            console.warn('Dedicated resizeField endpoint failed, checking fallback:', err);
            // Fallback for completed fields: saveFieldValue
            const currentField = fields.find(f => f.id === fieldId);
            const isCompleted = currentField?.completed_at || currentField?.is_completed || !!fieldValues[fieldId];
            if (isCompleted) {
                const valueToSave = fieldValues[fieldId] || currentField?.value;
                if (valueToSave) {
                    try {
                        await apiService.saveFieldValue(
                            recipientId,
                            fieldId,
                            valueToSave,
                            updatedCoords
                        );
                        showSnackbar('Size updated successfully', 'success');

                        // 🎯 Refresh live document and thumbnails so changes appear immediately without page refresh
                        await refreshLiveDocumentSilently();
                        loadThumbnails();

                    } catch (saveErr) {
                        console.error('Fallback saveFieldValue failed:', saveErr);
                        showSnackbar('Failed to update signature size: ' + saveErr.message, 'error');
                    }
                }
            } else {
                showSnackbar('Failed to update size: ' + err.message, 'error');
            }
        }
    }, [fields, fieldValues, recipientId, refreshLiveDocumentSilently, loadThumbnails]);

    // Load thumbnails when document loads
    useEffect(() => {
        if (numPages > 0 && recipientId) {
            loadThumbnails();
        }
    }, [numPages, recipientId, loadThumbnails]);

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

        const freshestField = fields.find(f => f.id === field.id) || field;
        setNextFieldId(freshestField.id);
        setActiveField(freshestField);
        setModalType(freshestField.type);

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
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(
                    parsed instanceof Date && !isNaN(parsed.getTime()) && parsed >= today
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

    // Smart navigation helper to jump to next incomplete field or open it
    const handleNavigateToNextField = useCallback((openModalIfAlreadyFocused = false) => {
        const incomplete = getIncompleteFields(fields, fieldValues);
        if (incomplete.length === 0) {
            showSnackbar('All fields are completed! You can now finish.', 'success');
            showFinishConfirmation();
            return;
        }

        let targetField = null;
        if (nextFieldId) {
            const currentTarget = incomplete.find(f => f.id === nextFieldId);
            if (currentTarget && openModalIfAlreadyFocused) {
                handleFieldClick(currentTarget);
                return;
            }

            const currentIndex = incomplete.findIndex(f => f.id === nextFieldId);
            if (currentIndex !== -1 && currentIndex + 1 < incomplete.length) {
                targetField = incomplete[currentIndex + 1];
            } else {
                targetField = incomplete[0];
            }
        } else {
            targetField = incomplete[0];
        }

        if (!targetField) {
            targetField = incomplete[0];
        }

        setNextFieldId(targetField.id);
        scrollToField(targetField);

        const typeLabel = FIELD_TYPES[targetField.type]?.label || targetField.type;
        const pageNum = (targetField.page || 0) + 1;
        showSnackbar(`Navigated to Page ${pageNum}: ${typeLabel} (${incomplete.length} remaining)`, 'info');
    }, [fields, fieldValues, nextFieldId, scrollToField, showSnackbar, showFinishConfirmation]);

    const handleActionsMenuOpen = (event) => {
        setActionsAnchor(event.currentTarget);
    };

    const handleActionsMenuClose = () => {
        setActionsAnchor(null);
    };

    const handleAutofillAllFields = async () => {
        handleActionsMenuClose();

        // Find all incomplete fields sorted by natural document reading order
        const incompleteFields = getIncompleteFields(fields, fieldValues);

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
        if (isDocumentOrRecipientCompleted) {
            showSnackbar('This document has already been completed, so it cannot be declined.', 'warning');
            return;
        }
        setDeclineDialogOpen(true);
    };

    const handleConfirmDecline = async () => {
        if (isDocumentOrRecipientCompleted) {
            showSnackbar('This document has already been completed, so it cannot be declined.', 'warning');
            setDeclineDialogOpen(false);
            return;
        }
        try {
            setCompleting(true);
            const response = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/decline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: declineReason })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                const detail = errData?.detail || '';
                if (detail.toLowerCase().includes('completed') || detail.toLowerCase().includes('not active') || response.status === 400) {
                    throw new Error(detail || 'This document has already been completed, so it cannot be declined.');
                }
                throw new Error(detail || 'Failed to decline document');
            }

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
        if (isDocumentOrRecipientCompleted) {
            showSnackbar('This document has already been completed, so it cannot be skipped.', 'info');
            return;
        }
        setSkipDialogOpen(true);
    };

    const handleAssignToSomeoneElse = () => {
        handleActionsMenuClose();
        if (isDocumentOrRecipientCompleted) {
            showSnackbar('This document has already been completed, so you cannot assign it to someone else.', 'warning');
            return;
        }
        setAssignDialogOpen(true);
    };

    const handleConfirmAssign = async () => {
        if (isDocumentOrRecipientCompleted) {
            showSnackbar('This document has already been completed, so you cannot assign it to someone else.', 'warning');
            setAssignDialogOpen(false);
            return;
        }
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

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                const detail = errData?.detail || '';
                if (detail.toLowerCase().includes('completed') || detail.toLowerCase().includes('not active') || detail.toLowerCase().includes('delegate') || response.status === 400) {
                    throw new Error(detail || 'This document has already been completed, so you cannot assign or delegate it to someone else.');
                }
                throw new Error(detail || 'Failed to assign document');
            }

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
            if (modalType === 'textbox') {
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
                let dateVal = valueFromModal?.value || selectedDate;
                if (dateVal instanceof Date) {
                    dateVal = dateVal.toISOString().split('T')[0];
                } else if (typeof dateVal === 'string' && dateVal.includes('T')) {
                    dateVal = dateVal.split('T')[0];
                }
                const todayStr = new Date().toISOString().split('T')[0];
                if (!dateVal || dateVal < todayStr) {
                    dateVal = todayStr;
                }
                valueToSave = { value: dateVal };
            }

            else if (valueFromModal) {
                // Signature pad fields
                if (modalType === 'signature' || modalType === 'witness_signature' || modalType === 'initials') {
                    if (valueFromModal && (valueFromModal.image || valueFromModal.text)) {
                        let finalImage = valueFromModal.image;
                        if (finalImage && typeof finalImage === 'string' && finalImage.startsWith('data:image')) {
                            finalImage = await cropSignatureDataUrl(finalImage);
                        }
                        valueToSave = {
                            ...valueFromModal,
                            image: finalImage,
                            text: valueFromModal.text || '',
                            signature_type: valueFromModal.signature_type || (valueFromModal.text ? 'type' : 'draw'),
                            font_family: valueFromModal.font_family,
                            font_size: valueFromModal.font_size,
                            font_color: valueFromModal.font_color
                        };
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

            // Get coordinates if available
            const activePageNum = activeField.page + 1;
            const activePageDimensions = pageDimensions[activePageNum];
            const freshestActiveField = fields.find(f => f.id === activeField.id) || activeField;

            // Auto-adjust field width and height if content length/words increased
            let fieldWidthToUse = freshestActiveField.width;
            let fieldHeightToUse = freshestActiveField.height;

            if (valueFromModal?.width && valueFromModal.width > fieldWidthToUse) {
                fieldWidthToUse = valueFromModal.width;
            } else if (modalType === 'textbox' || modalType === 'mail') {
                const textVal = String(valueToSave?.value || valueToSave?.text || '');
                if (textVal) {
                    const lines = textVal.split('\n');
                    const maxLineLen = Math.max(...lines.map(l => l.length), 0);
                    const estimatedWidth = Math.max(fieldWidthToUse || 120, maxLineLen * 8.5 + 24);
                    if (estimatedWidth > fieldWidthToUse) {
                        fieldWidthToUse = estimatedWidth;
                    }
                    if (lines.length > 1) {
                        const estimatedHeight = Math.max(fieldHeightToUse || 35, lines.length * 24 + 10);
                        if (estimatedHeight > fieldHeightToUse) {
                            fieldHeightToUse = estimatedHeight;
                        }
                    }
                }
            }

            if (valueFromModal?.height && valueFromModal.height > fieldHeightToUse) {
                fieldHeightToUse = valueFromModal.height;
            }

            // Ensure field width stays comfortably within page bounds
            if (activePageDimensions) {
                const maxX = activePageDimensions.renderWidth - 10;
                const fieldLeft = freshestActiveField.canvas_x ?? freshestActiveField.x ?? 0;
                if (fieldLeft + fieldWidthToUse > maxX) {
                    fieldWidthToUse = Math.max(freshestActiveField.width, maxX - fieldLeft);
                }
            }

            const coords = activePageDimensions ? {
                x: freshestActiveField.canvas_x ?? freshestActiveField.x,
                y: freshestActiveField.canvas_y ?? freshestActiveField.y,
                width: fieldWidthToUse,
                height: fieldHeightToUse,
                canvas_width: freshestActiveField.canvas_width ?? activePageDimensions.renderWidth,
                canvas_height: freshestActiveField.canvas_height ?? activePageDimensions.renderHeight,
                page_width: activePageDimensions.pdfWidth,
                page_height: activePageDimensions.pdfHeight
            } : null;

            // Make the API call
            const result = await apiService.saveFieldValue(
                recipientId,
                activeField.id,
                valueToSave,
                coords
            );

            console.log('Save successful:', result);

            // Update local state
            const updatedFields = fields.map(f =>
                f.id === activeField.id
                    ? {
                        ...f,
                        ...result.field, // Use updated coordinates and dimensions from server
                        width: fieldWidthToUse,
                        height: fieldHeightToUse,
                        value: valueToSave,
                        completed_at: result.field?.completed_at || new Date().toISOString(),
                        is_completed: true
                    }
                    : f
            );
            setFields(updatedFields);

            const updatedFieldValues = {
                ...fieldValues,
                [activeField.id]: valueToSave
            };
            setFieldValues(updatedFieldValues);

            // Silently update live PDF document & thumbnails in background
            refreshLiveDocumentSilently();
            loadThumbnails();

            showSnackbar(
                `${FIELD_TYPES[modalType]?.label || modalType} saved successfully`,
                'success'
            );

            setModalValue(null);
            setSelectedDate(null);
            setTextInput('');

            let workingFields = updatedFields;
            let workingValues = updatedFieldValues;

            // Explicit allowlist of field types supported by Intelligent Bulk-Autofill & QuickSign:
            // Only Signature, Initials, Stamp, Email, and Date are permitted.
            // All other field types (Textbox, Approval, Radio, Dropdown, Checkbox) are strictly disabled
            // from bulk-autofill and require individual user interaction.
            const BULK_AUTOFILL_ALLOWED_TYPES = new Set([
                'signature',
                'witness_signature',
                'initials',
                'stamp',
                'mail',
                'email',
                'date'
            ]);

            let matchingCategoryLabel = '';
            let otherMatchingFields = [];

            if (BULK_AUTOFILL_ALLOWED_TYPES.has(modalType)) {
                // Ensure only eligible, uncompleted fields assigned to current signer are matched
                const isEligibleField = (f) => {
                    const isSameField = f.id === activeField.id;
                    const isAlreadyDone = f.completed_at || f.is_completed || !!workingValues[f.id];
                    const isAssignedToSigner = !f.recipient_id || String(f.recipient_id) === String(recipientId);
                    return !isSameField && !isAlreadyDone && isAssignedToSigner;
                };

                if (modalType === 'mail' || modalType === 'email') {
                    matchingCategoryLabel = 'email';
                    otherMatchingFields = updatedFields.filter(f =>
                        isEligibleField(f) && (f.type === 'mail' || f.type === 'email')
                    );
                } else if (modalType === 'date') {
                    matchingCategoryLabel = 'date';
                    otherMatchingFields = updatedFields.filter(f =>
                        isEligibleField(f) && f.type === 'date'
                    );
                } else if (modalType === 'signature' || modalType === 'witness_signature') {
                    matchingCategoryLabel = 'signature';
                    otherMatchingFields = updatedFields.filter(f =>
                        isEligibleField(f) && (f.type === 'signature' || f.type === 'witness_signature')
                    );
                } else if (modalType === 'initials') {
                    matchingCategoryLabel = 'initials';
                    otherMatchingFields = updatedFields.filter(f =>
                        isEligibleField(f) && f.type === 'initials'
                    );
                } else if (modalType === 'stamp') {
                    matchingCategoryLabel = 'stamp';
                    otherMatchingFields = updatedFields.filter(f =>
                        isEligibleField(f) && f.type === 'stamp'
                    );
                }
            }

            if (otherMatchingFields.length > 0) {
                showSnackbar(`Autofilling ${otherMatchingFields.length} other ${matchingCategoryLabel} field(s)...`, 'info');

                try {
                    await Promise.all(otherMatchingFields.map(field =>
                        apiService.saveFieldValue(recipientId, field.id, valueToSave)
                    ));

                    // Update local fields state for bulk fill
                    const bulkIds = new Set(otherMatchingFields.map(f => f.id));
                    workingFields = updatedFields.map(f => {
                        if (bulkIds.has(f.id)) {
                            return {
                                ...f,
                                value: valueToSave,
                                completed_at: new Date().toISOString(),
                                is_completed: true
                            };
                        }
                        return f;
                    });
                    setFields(workingFields);

                    workingValues = { ...workingValues };
                    bulkIds.forEach(id => { workingValues[id] = valueToSave; });
                    setFieldValues(workingValues);

                    // Silently refresh live document to stamp newly filled fields
                    refreshLiveDocumentSilently();
                } catch (bulkErr) {
                    console.error('Bulk autofill error:', bulkErr);
                }
            }

            if (isQuickSignMode) {
                // Find the next field to sign (after potential bulk fill)
                const nextIncomplete = findNextPendingField(workingFields, activeField.id, workingValues);

                if (nextIncomplete) {
                    setNextFieldId(nextIncomplete.id);
                    scrollToField(nextIncomplete);
                    showSnackbar(`Moving to next field: ${FIELD_TYPES[nextIncomplete.type]?.label || nextIncomplete.type}...`, 'info');
                    setTimeout(() => handleFieldClick(nextIncomplete), 600);
                } else {
                    setNextFieldId(null);
                    setIsQuickSignMode(false);
                    showSnackbar('Great! All fields have been completed.', 'success');
                    setTimeout(() => showFinishConfirmation(), 800);
                }
            } else {
                // Regular signing mode (Standard flow)
                const nextIncomplete = findNextPendingField(workingFields, activeField.id, workingValues);

                if (nextIncomplete) {
                    setNextFieldId(nextIncomplete.id);
                    const remainingIncomplete = getIncompleteFields(workingFields, workingValues);
                    const nextLabel = FIELD_TYPES[nextIncomplete.type]?.label || nextIncomplete.type;
                    const nextPg = (nextIncomplete.page || 0) + 1;

                    // Smooth auto scroll to center the next field
                    setTimeout(() => {
                        scrollToField(nextIncomplete);
                    }, 150);

                    showSnackbar(
                        `Next field: ${nextLabel} on Page ${nextPg} (${remainingIncomplete.length} remaining)`,
                        'info'
                    );
                } else {
                    // All fields complete
                    setNextFieldId(null);
                    showSnackbar('Awesome! All fields have been completed.', 'success');
                    setTimeout(() => showFinishConfirmation(), 800);
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
            if (!field.completed_at && !field.is_completed && !fieldValues[field.id]) {
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

    const handleDownloadSubfile = async (file) => {
        try {
            const token = localStorage.getItem('signing_token') ||
                new URLSearchParams(window.location.search).get('token') ||
                sessionStorage.getItem('signing_token');
            const res = await fetch(`${API_BASE_URL}/signing/recipient/${recipientId}/files/${file.id}/download-signed${token ? `?token=${encodeURIComponent(token)}` : ''}`);
            if (!res.ok) throw new Error('Failed to download individual file');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `signed_${file.filename}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showSnackbar(`${file.filename} downloaded successfully`, 'success');
        } catch (err) {
            console.error('Download subfile error:', err);
            showSnackbar(`Failed to download ${file.filename}`, 'error');
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

        // Safety fallback: ensure overlays reveal even if onRenderSuccess is delayed
        setTimeout(() => {
            setRenderedPages(prev => ({
                ...prev,
                [pageNumber]: true
            }));
        }, 800);
    };

    const handlePageRenderSuccess = useCallback((pageNumber) => {
        setRenderedPages(prev => ({
            ...prev,
            [pageNumber]: true
        }));
    }, []);


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
        const completedFields = pageFields.filter(f => f.completed_at || f.is_completed || !!fieldValues[f.id]).length;
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
        const completedRequired = requiredFields.filter(f => f.completed_at || f.is_completed || !!fieldValues[f.id]).length;
        const allFields = fields.length;
        const allCompleted = fields.filter(f => f.completed_at || f.is_completed || !!fieldValues[f.id]).length;

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
    }, [fields, recipientInfo, fieldValues]);

    // Get incomplete fields for current page
    const currentPageIncompleteFields = useMemo(() =>
        fields.filter(f => f.page === currentPage - 1 && !f.completed_at && !f.is_completed && !fieldValues[f.id]),
        [fields, currentPage, fieldValues]
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
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', position: 'relative' }}>
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

                            <FilenameDisplay
                                filename={documentInfo?.filename}
                                sx={{ display: { xs: 'none', sm: 'inline-flex' }, maxWidth: { sm: 160, md: 260 }, fontSize: '0.875rem', color: 'text.secondary' }}
                            />

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

                            {/* Dedicated Quick Sign Button - Prominent single place */}
                            {!progress.allRequiredCompleted && fields.some(f => !f.completed_at && !f.is_completed && !fieldValues[f.id]) && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleAutofillAllFields}
                                    startIcon={<AutoFixHighIcon sx={{ fontSize: 16 }} />}
                                    sx={{
                                        background: 'linear-gradient(135deg, #0d9488 0%, #086b70 100%)',
                                        color: '#ffffff',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        px: { xs: 1.2, sm: 1.8 },
                                        py: 0.55,
                                        borderRadius: '7px',
                                        boxShadow: '0 2px 8px rgba(13, 148, 136, 0.28)',
                                        minWidth: 'auto',
                                        whiteSpace: 'nowrap',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #0f766e 0%, #065458 100%)',
                                            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.38)',
                                            transform: 'translateY(-1px)'
                                        }
                                    }}
                                >
                                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Quick Sign</Box>
                                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Quick</Box>
                                    <Box
                                        component="span"
                                        sx={{
                                            ml: 0.8,
                                            px: 0.75,
                                            py: 0.1,
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            borderRadius: '10px',
                                            bgcolor: 'rgba(255, 255, 255, 0.25)',
                                            color: '#ffffff',
                                            lineHeight: 1.3
                                        }}
                                    >
                                        {fields.filter(f => !f.completed_at && !f.is_completed && !fieldValues[f.id]).length}
                                    </Box>
                                </Button>
                            )}

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
                                        sx={{
                                            minWidth: { xs: 80, sm: 110 },
                                            backgroundColor: progress.allRequiredCompleted ? 'rgb(13, 148, 136)' : '#64748b',
                                            display: { xs: 'none', sm: 'inline-flex' },
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '0.82rem',
                                            borderRadius: '7px',
                                            '&:hover': {
                                                backgroundColor: progress.allRequiredCompleted ? '#0b8278' : '#475569'
                                            }
                                        }}
                                        onClick={() => {
                                            if (recipientInfo?.status === 'completed') {
                                                navigate(`/complete/${recipientId}`);
                                            } else {
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

                            {/* More Actions Dropdown - Hidden when document/recipient is completed or finishing */}
                            {!isDocumentOrRecipientCompleted && !completing && (
                                <>
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
                                            <ListItemText primary="Decline to sign" secondary="Reject the document" />
                                        </MenuItem>

                                        <MenuItem onClick={handleSkipSigning}>
                                            <ListItemIcon><SkipNextIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Skip for now" secondary="Decide later" />
                                        </MenuItem>
                                    </Menu>
                                </>
                            )}
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
                    {/* Left sidebar - Document pages preview */}
                    <Paper
                        elevation={1}
                        sx={{
                            width: 180,
                            p: 1.5,
                            overflow: 'auto',
                            borderRadius: 0,
                            borderRight: '1px solid #e0e0e0',
                            display: { xs: 'none', md: 'block' }
                        }}
                    >
                        <Box sx={{ mb: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'rgb(13, 148, 136)', mb: 1 }}>
                                Pages ({numPages})
                            </Typography>

                            <Box sx={{ mb: 1.5, p: 1, bgcolor: '#f8f9fa', borderRadius: 1 }}>
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

                        {/* Thumbnail Pages List */}
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
                                            pageDimensions={pageDimensions[pageNum]}
                                            nextFieldId={nextFieldId}
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
                                            fieldValues={fieldValues}
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
                                                    color: 'rgb(13, 148, 136)',
                                                    fontWeight: 600
                                                }}
                                                onClick={() => {
                                                    const pageIncomplete = fields.filter(
                                                        f => f.page === pageNum - 1 && !f.completed_at && !f.is_completed && !fieldValues[f.id]
                                                    );
                                                    if (pageIncomplete.length > 0) {
                                                        const sorted = sortFieldsByReadingOrder(pageIncomplete);
                                                        setNextFieldId(sorted[0].id);
                                                        scrollToField(sorted[0]);
                                                    } else {
                                                        const el = document.getElementById(`page-${pageNum}`);
                                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        setCurrentPage(pageNum);
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
                                {progress.totalFields > 0 && !progress.allRequiredCompleted && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        endIcon={<NavigateNextIcon />}
                                        onClick={() => handleNavigateToNextField(true)}
                                        sx={{
                                            bgcolor: 'rgb(13, 148, 136)',
                                            color: 'white',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            fontSize: '0.8rem',
                                            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
                                            '&:hover': { bgcolor: 'rgb(11, 130, 120)' }
                                        }}
                                    >
                                        Next Field ({progress.totalFields - progress.completedFields})
                                    </Button>
                                )}

                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={(e) => {
                                        if (documentInfo?.files && documentInfo.files.length > 1) {
                                            setDownloadMenuAnchor(e.currentTarget);
                                        } else {
                                            handleDownload('current');
                                        }
                                    }}
                                    endIcon={documentInfo?.files && documentInfo.files.length > 1 ? <ArrowDownIcon /> : null}
                                    startIcon={<DownloadIcon />}
                                    sx={{ color: 'rgb(13, 148, 136)', borderColor: 'rgb(13, 148, 136)' }}
                                >
                                    Download
                                </Button>

                                <Menu
                                    anchorEl={downloadMenuAnchor}
                                    open={Boolean(downloadMenuAnchor)}
                                    onClose={() => setDownloadMenuAnchor(null)}
                                    PaperProps={{ sx: { minWidth: 240, borderRadius: 1.5, mt: 1 } }}
                                >
                                    <MenuItem onClick={() => { setDownloadMenuAnchor(null); handleDownload('current'); }}>
                                        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Combined Document (All Pages)" />
                                    </MenuItem>
                                    {documentInfo?.files && documentInfo.files.length > 1 && [
                                        <Divider key="div" sx={{ my: 0.5 }} />,
                                        <Box key="header" sx={{ px: 2, py: 0.5 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                                                Individual Documents
                                            </Typography>
                                        </Box>,
                                        ...documentInfo.files.map(file => (
                                            <MenuItem key={file.id} onClick={() => { setDownloadMenuAnchor(null); handleDownloadSubfile(file); }}>
                                                <ListItemIcon><DescriptionIcon fontSize="small" sx={{ color: 'rgb(13, 148, 136)' }} /></ListItemIcon>
                                                <ListItemText
                                                    primary={<FilenameDisplay filename={file.filename} maxLength={28} />}
                                                    secondary={file.page_range}
                                                    primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                                                />
                                            </MenuItem>
                                        ))
                                    ]}
                                </Menu>
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
                                        const isCurrentNext = field.id === nextFieldId;
                                        return (
                                            <Chip
                                                key={field.id}
                                                label={field.label || fieldConfig.label}
                                                size="small"
                                                onClick={() => {
                                                    setNextFieldId(field.id);
                                                    scrollToField(field);
                                                    handleFieldClick(field);
                                                }}
                                                icon={React.createElement(fieldConfig.icon, { fontSize: 'small' })}
                                                sx={{
                                                    cursor: 'pointer',
                                                    fontWeight: isCurrentNext ? 700 : 500,
                                                    bgcolor: isCurrentNext ? 'rgb(13, 148, 136)' : 'white',
                                                    color: isCurrentNext ? 'white' : 'rgb(13, 148, 136)',
                                                    borderColor: 'rgb(13, 148, 136)',
                                                    boxShadow: isCurrentNext ? '0 2px 6px rgba(13, 148, 136, 0.3)' : 'none',
                                                    '&:hover': {
                                                        bgcolor: isCurrentNext ? 'rgb(11, 130, 120)' : 'rgba(13, 148, 136, 0.08)'
                                                    }
                                                }}
                                                variant={isCurrentNext ? 'filled' : 'outlined'}
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
                                p: 2,
                                '& .react-pdf__Page__loading': {
                                    display: 'none !important'
                                },
                                '& .react-pdf__Page': {
                                    display: 'block',
                                    position: 'relative',
                                    backgroundColor: '#ffffff'
                                },
                                '& .react-pdf__Page__canvas': {
                                    display: 'block !important',
                                    margin: '0 auto',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                                }
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
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                                                <Paper
                                                    elevation={3}
                                                    sx={{
                                                        width: { xs: '100%', sm: 612 * zoom },
                                                        maxWidth: '100%',
                                                        borderRadius: 1,
                                                        overflow: 'hidden',
                                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                                                    }}
                                                >
                                                    <PageSkeleton width={612 * zoom} height={792 * zoom} pageNum={1} />
                                                </Paper>
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
                                            const dims = pageDimensions[pageNum] || pageDimensions[1];
                                            const targetWidth = dims?.renderWidth ? dims.renderWidth : (612 * zoom);
                                            const targetHeight = dims?.renderHeight ? dims.renderHeight : (792 * zoom);
                                            const isRendered = !!renderedPages[pageNum];

                                            return (
                                                <Box
                                                    key={pageNum}
                                                    id={`page-${pageNum}`}
                                                    sx={{
                                                        position: 'relative',
                                                        mb: 4,
                                                        width: targetWidth ? `${targetWidth}px` : 'auto',
                                                        minHeight: targetHeight ? `${targetHeight}px` : '800px',
                                                        maxWidth: '100%',
                                                        bgcolor: '#ffffff',
                                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                        borderRadius: '4px',
                                                        overflow: 'hidden',
                                                        scrollMarginTop: '80px' // important for scrolling from thumbnails
                                                    }}
                                                >
                                                    {/* Realistic Skeleton placeholder until this page canvas finishes rendering */}
                                                    {!isRendered && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                zIndex: 1
                                                            }}
                                                        >
                                                            <PageSkeleton
                                                                width={targetWidth}
                                                                height={targetHeight}
                                                                pageNum={pageNum}
                                                                totalPages={numPages}
                                                            />
                                                        </Box>
                                                    )}

                                                    <Page
                                                        pageNumber={pageNum}
                                                        scale={zoom}
                                                        renderAnnotationLayer={false}
                                                        renderTextLayer={true}
                                                        onLoadSuccess={(page) => handlePageLoadSuccess(page, pageNum)}
                                                        onRenderSuccess={() => handlePageRenderSuccess(pageNum)}
                                                        loading={
                                                            <PageSkeleton
                                                                width={targetWidth}
                                                                height={targetHeight}
                                                                pageNum={pageNum}
                                                                totalPages={numPages}
                                                            />
                                                        }
                                                    />

                                                    {/* Field overlays: Only visible once page canvas is rendered to avoid floating fields */}
                                                    {pageDimensions[pageNum] && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                opacity: isRendered ? 1 : 0,
                                                                transition: 'opacity 0.25s ease-in-out',
                                                                pointerEvents: isRendered ? 'auto' : 'none',
                                                                zIndex: 2
                                                            }}
                                                        >
                                                            <PdfPageWithOverlays
                                                                pageNumber={pageNum}
                                                                fields={fields}
                                                                pageDimensions={pageDimensions[pageNum]}
                                                                onFieldClick={handleFieldClick}
                                                                onUpdateCoords={handleUpdateFieldCoords}
                                                                recipientColors={recipientColors}
                                                                isRecipientCompleted={recipientInfo?.status === 'completed' || !!recipientInfo?.completed_at}
                                                                fieldValues={fieldValues}
                                                                nextFieldId={nextFieldId}
                                                            />
                                                        </Box>
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
                    fieldWidth={activeField?.width || activeField?.pdf_width || 120}
                    fieldHeight={activeField?.height || activeField?.pdf_height || 35}
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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                                    <Typography variant="body2" fontWeight="medium" sx={{ flexShrink: 0 }}>Filename:</Typography>
                                    <FilenameDisplay filename={documentInfo?.filename} sx={{ maxWidth: '65%', fontSize: '0.875rem' }} />
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
                                            <Box sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
                                                <Typography sx={{ minWidth: 140, color: 'text.secondary', fontSize: '0.9rem', flexShrink: 0 }}>Document name</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '0.9rem', mr: 0.5, flexShrink: 0 }}>:</Typography>
                                                    <FilenameDisplay filename={historyData.document.filename} sx={{ fontWeight: 500, fontSize: '0.9rem' }} />
                                                </Box>
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
