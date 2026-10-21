import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  TextField,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  Avatar,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Input,
  InputLabel,
  FormHelperText,
  Chip,
  Switch,
  Slider
} from '@mui/material';
import {
  Undo as UndoIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  Download as DownloadIcon,
  TextFields as TextIcon,
  Draw as DrawIcon,
  CloudUpload as UploadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckBoxIcon,
  ArrowDropDown as DropdownIcon,
  AttachFile as AttachIcon,
  ThumbUp as ApprovalIcon,
  Fingerprint as SignatureIcon,
  Mail as MailIcon,
  LocalOffer as StampIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import api from "../services/api";
import FilenameDisplay from './FilenameDisplay';

// Auto-crop empty margins from signature canvas to match backend PDFEngine bounds perfectly
export const cropCanvas = (canvas) => {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return canvas.toDataURL('image/png');

  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let hasContent = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
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
      return canvas.toDataURL('image/png');
    }

    // Add 4% safety margin (matching backend _crop_and_optimize_signature_image)
    const contentW = maxX - minX + 1;
    const contentH = maxY - minY + 1;
    const padX = Math.max(4, Math.round(contentW * 0.04));
    const padY = Math.max(4, Math.round(contentH * 0.04));

    const finalMinX = Math.max(0, minX - padX);
    const finalMinY = Math.max(0, minY - padY);
    const finalMaxX = Math.min(w - 1, maxX + padX);
    const finalMaxY = Math.min(h - 1, maxY + padY);

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

    return trimmedCanvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Canvas cropping fallback:', err);
    return canvas.toDataURL('image/png');
  }
};

// Calculate dynamic dimensions for text/email fields based on word count & character length
const calculateTextDimensions = (text, baseW, baseH) => {
  if (!text) return { width: baseW || 120, height: baseH || 35 };
  const lines = String(text).split('\n');
  const maxLineLen = Math.max(...lines.map(l => l.length), 0);
  const width = Math.max(baseW || 120, Math.min(650, Math.round(maxLineLen * 8.5 + 24)));
  const height = Math.max(baseH || 35, Math.round(lines.length * 24 + 10));
  return { width, height };
};

const calculateEmailWidth = (email, baseW) => {
  if (!email) return baseW || 140;
  return Math.max(baseW || 140, Math.min(600, Math.round(String(email).length * 8.5 + 24)));
};

// Enhanced signature pad that supports all field types
const EnhancedSignaturePad = ({
  onSave,
  onClose,
  existingSignature = null,
  recipientData = {},
  fieldType = 'signature',
  fieldLabel = '',
  fieldOptions = [],
  fieldWidth = 100,
  fieldHeight = 40,
  height = 300,
  width = 700
}) => {
  const [fWidth, setFWidth] = useState(fieldWidth || 150);
  const [fHeight, setFHeight] = useState(fieldHeight || 40);
  const canvasRef = useRef(null);
  const textCanvasRef = useRef(null);
  const stampCanvasRef = useRef(null);
  const pointsRef = useRef([]);
  const [activeTab, setActiveTab] = useState(0);
  const [textInput, setTextInput] = useState('');
  // const [fontSize, setFontSize] = useState(112); 
  const [fontFamily, setFontFamily] = useState('Dancing Script');
  const [fontColor, setFontColor] = useState('#000000');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('');
  const [dropdownValue, setDropdownValue] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentData, setAttachmentData] = useState(null);
  const [approvalValue, setApprovalValue] = useState(false);
  const [initialsInput, setInitialsInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [stampText, setStampText] = useState('');
  const [stampColor, setStampColor] = useState('#e53935');
  const [stampShape, setStampShape] = useState('circle');
  const [showDateOnStamp, setShowDateOnStamp] = useState(true);
  const [emailValid, setEmailValid] = useState(true);
  const [currentValue, setCurrentValue] = useState(null); // Track current value
  const [selectedFontStyle, setSelectedFontStyle] = useState('all'); // Filter for signature font styles: all, handwriting, formal, modern

  const getDefaultFontSize = () => {
    if (fieldType === 'initials') return 160; // ⬅ bigger like signature
    return 160;
  };

  const [fontSize, setFontSize] = useState(getDefaultFontSize());

  // Field type specific configurations
  const FIELD_CONFIG = {
    signature: {
      label: 'Signature',
      placeholder: 'Type your name',
      icon: SignatureIcon,
      color: '#1976d2',
      tabs: ['type', 'draw', 'upload'], // Changed order with type as default
      defaultTab: 0 // Type tab as default
    },
    initials: {
      label: 'Initials',
      placeholder: 'Enter your initials',
      icon: SignatureIcon,
      color: '#4caf50',
      tabs: ['type', 'draw', 'upload'], // Changed order with type as default
      defaultTab: 0 // Type tab as default
    },
    date: {
      label: 'Date',
      placeholder: 'Select date',
      icon: CalendarIcon,
      color: '#ff9800',
      tabs: ['calendar'],
      defaultTab: 0
    },
    textbox: {
      label: 'Text',
      placeholder: 'Enter text',
      icon: TextIcon,
      color: '#2196f3',
      tabs: ['text'],
      defaultTab: 0
    },
    checkbox: {
      label: 'Checkbox',
      placeholder: 'Check here',
      icon: CheckBoxIcon,
      color: '#9c27b0',
      tabs: ['checkbox'],
      defaultTab: 0
    },
    radio: {
      label: 'Radio',
      placeholder: 'Select option',
      icon: RadioIcon,
      color: '#673ab7',
      tabs: ['radio'],
      defaultTab: 0,
      category: 'form',
      component: 'radio'
    },
    dropdown: {
      label: 'Dropdown',
      placeholder: 'Choose option',
      icon: DropdownIcon,
      color: '#009688',
      category: 'form',
      component: 'dropdown',
      tabs: ['dropdown'],
      defaultTab: 0
    },
    attachment: {
      label: 'Attachment',
      placeholder: 'Attach file',
      icon: AttachIcon,
      color: '#795548',
      tabs: ['upload'],
      defaultTab: 0
    },
    approval: {
      label: 'Approval',
      placeholder: 'Approve document',
      icon: ApprovalIcon,
      color: '#4caf50',
      tabs: ['approval'],
      defaultTab: 0
    },
    witness_signature: {
      label: 'Witness Signature',
      placeholder: 'Type witness name',
      icon: SignatureIcon,
      color: '#ff5722',
      tabs: ['type', 'draw', 'upload'], // Changed order with type as default
      defaultTab: 0 // Type tab as default
    },
    stamp: {
      label: 'Stamp',
      placeholder: 'Create stamp',
      icon: StampIcon,
      color: '#e53935',
      tabs: ['create', 'upload'],
      defaultTab: 0
    },
    mail: {
      label: 'Email',
      placeholder: 'Enter email address',
      icon: MailIcon,
      color: '#1a73e8',
      tabs: ['email'],
      defaultTab: 0
    }
  };

  // Available fonts for text signatures - updated with full-width view
  const fontStyles = [
    {
      name: 'handwriting',
      label: 'Handwriting',
      fonts: [
        'Dancing Script',
        'Pacifico',
        'Great Vibes',
        'Sacramento',
        'Alex Brush',
        'Allura',
        'Caveat',
        'Satisfy',
        'Yellowtail',
        'Cedarville Cursive'
      ],
      color: '#000000'
    },
    {
      name: 'formal',
      label: 'Formal',
      fonts: [
        'Arial',
        'Times New Roman',
        'Georgia',
        'Courier New',
        'Calibri',
        'Verdana'
      ],
      color: '#1976d2'
    },
    {
      name: 'modern',
      label: 'Modern',
      fonts: [
        'Roboto',
        'Open Sans',
        'Montserrat',
        'Lato',
        'Poppins',
        'Raleway'
      ],
      color: '#2ecc71'
    }
  ];

  // Available signature fonts with categorized metadata for direct live preview
  const allSignatureFonts = useMemo(() => [
    // Handwriting / Cursive styles
    { family: 'Dancing Script', label: 'Dancing Script', category: 'handwriting' },
    { family: 'Great Vibes', label: 'Great Vibes', category: 'handwriting' },
    { family: 'Pacifico', label: 'Pacifico', category: 'handwriting' },
    { family: 'Caveat', label: 'Caveat', category: 'handwriting' },
    { family: 'Satisfy', label: 'Satisfy', category: 'handwriting' },
    { family: 'Sacramento', label: 'Sacramento', category: 'handwriting' },
    { family: 'Alex Brush', label: 'Alex Brush', category: 'handwriting' },
    { family: 'Allura', label: 'Allura', category: 'handwriting' },
    { family: 'Yellowtail', label: 'Yellowtail', category: 'handwriting' },
    { family: 'Parisienne', label: 'Parisienne', category: 'handwriting' },
    { family: 'Kaushan Script', label: 'Kaushan Script', category: 'handwriting' },
    { family: 'Cedarville Cursive', label: 'Cedarville Cursive', category: 'handwriting' },
    { family: 'Homemade Apple', label: 'Homemade Apple', category: 'handwriting' },
    { family: 'Shadows Into Light', label: 'Shadows Into Light', category: 'handwriting' },
    { family: 'Kalam', label: 'Kalam', category: 'handwriting' },
    // Formal styles
    { family: 'Times New Roman', label: 'Times New Roman', category: 'formal' },
    { family: 'Georgia', label: 'Georgia', category: 'formal' },
    { family: 'Courier New', label: 'Courier New', category: 'formal' },
    { family: 'Arial', label: 'Arial', category: 'formal' },
    // Modern styles
    { family: 'Montserrat', label: 'Montserrat', category: 'modern' },
    { family: 'Poppins', label: 'Poppins', category: 'modern' },
    { family: 'Roboto', label: 'Roboto', category: 'modern' }
  ], []);

  const filteredFonts = useMemo(() => {
    if (selectedFontStyle === 'all') {
      return allSignatureFonts;
    }
    return allSignatureFonts.filter(f => f.category === selectedFontStyle);
  }, [allSignatureFonts, selectedFontStyle]);

  // Color options - black, blue, navy, red
  const colors = [
    '#000000', // Classic Black
    '#002fa7', // Royal Blue
    '#0f2c59', // Navy Blue
    '#d32f2f'  // Deep Red
  ];

  const stampColors = [
    '#e53935', '#d32f2f', '#c62828',
    '#1976d2', '#1565c0', '#0d47a1',
    '#388e3c', '#2e7d32', '#1b5e20',
    '#f57c00', '#ef6c00', '#e65100',
    '#7b1fa2', '#6a1b9a', '#4a148c',
  ];

  const stampShapes = [
    { value: 'circle', label: 'Circle', icon: '○' },
    { value: 'square', label: 'Square', icon: '□' },
    { value: 'rectangular', label: 'Rectangular', icon: '▭' }
  ];

  const dropdownOptions = useMemo(() => {
    if (fieldOptions && fieldOptions.length > 0) {
      return fieldOptions;
    }
    // Default options as fallback
    return ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Other'];
  }, [fieldOptions]);

  // Also update radioOptions to use fieldOptions
  const radioOptions = useMemo(() => {
    if (fieldOptions && fieldOptions.length > 0) {
      return fieldOptions;
    }
    // Default options as fallback
    return ['Yes', 'No', 'Maybe', 'Not Applicable'];
  }, [fieldOptions]);

  // Initialize based on field type
  useEffect(() => {
    const config = FIELD_CONFIG[fieldType] || FIELD_CONFIG.signature;
    setActiveTab(config.defaultTab);

    // Auto-fill signature with recipient name if available
    if (fieldType === 'signature' && recipientData?.name) {
      setTextInput(recipientData.name);
    } else if (fieldType === 'initials' && recipientData?.name) {
      // Generate initials from name
      const initials = recipientData.name
        .split(' ')
        .filter(part => part.length > 0)
        .map(part => part[0])
        .join('')
        .toUpperCase();
      setTextInput(initials);
    }

    // Load existing value if provided
    if (existingSignature) {
      loadExistingValue(existingSignature);
    } else {
      // Set initial value based on field type
      switch (fieldType) {
        case 'date':
          setSelectedDate(new Date());
          break;
        case 'mail':
          setEmailInput(recipientData.email || '');
          break;
        case 'stamp':
          setStampText(recipientData.name ?
            `APPROVED\n${recipientData.name.toUpperCase()}` : 'APPROVED');
          break;
        default:
          if (fieldType === 'radio' && radioOptions.includes('Yes')) {
            setRadioValue('Yes');
          }
          break;
      }
    }

    // Set standard defaults for text/mail fields to avoid handwriting fonts
    if (['textbox', 'mail'].includes(fieldType)) {
      setFontFamily('Arial');
      setFontSize(14);
      setFontColor('#000000');
    }
  }, [fieldType, existingSignature, recipientData]);

  // Update font style based on selection
  useEffect(() => {
    if (selectedFontStyle === 'handwriting' && fontFamily === 'Arial') {
      setFontFamily('Dancing Script');
    }
  }, [selectedFontStyle, fontFamily]);

  const loadExistingValue = (value) => {
    setIsLoading(true);

    try {
      if (typeof value === 'object') {
        // Handle object values
        if (value.signature_type === 'type' || (value.text && !value.image)) {
          setActiveTab(0);
          setTextInput(value.text || '');
          if (value.font_family) setFontFamily(value.font_family);
          if (value.font_color) setFontColor(value.font_color);
          if (value.font_size) setFontSize(value.font_size);
        } else if (value.image) {
          if (value.signature_type === 'upload') {
            setActiveTab(2);
            setUploadedImage(value.image);
            setSignaturePreview(value.image);
          } else {
            setActiveTab(1);
            setSignaturePreview(value.image);
            loadImageSignature(value.image);
          }
        } else if (value.text !== undefined) {
          setActiveTab(0);
          setTextInput(value.text);
        } else if (value.value !== undefined) {
          switch (fieldType) {
            case 'textbox':
              setTextInput(value.value || '');
              if (value.font_size) setFontSize(value.font_size);
              if (value.font_family) setFontFamily(value.font_family);
              if (value.font_color) setFontColor(value.font_color);
              const tDims = calculateTextDimensions(value.value, value.width || fieldWidth, value.height || fieldHeight);
              setFWidth(tDims.width);
              setFHeight(tDims.height);
              break;
            case 'initials':
              setTextInput(value.value || '');
              if (value.font_size) setFontSize(value.font_size);
              if (value.font_family) setFontFamily(value.font_family);
              if (value.font_color) setFontColor(value.font_color);
              if (value.width) setFWidth(value.width);
              if (value.height) setFHeight(value.height);
              break;
            case 'mail':
              setEmailInput(value.value || '');
              const mW = calculateEmailWidth(value.value, value.width || fieldWidth);
              setFWidth(mW);
              break;
            case 'date':
              if (value.value) {
                const parsedDate = new Date(value.value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (!isNaN(parsedDate.getTime()) && parsedDate >= today) {
                  setSelectedDate(parsedDate);
                } else {
                  setSelectedDate(new Date());
                }
              } else {
                setSelectedDate(new Date());
              }
              break;
            case 'checkbox':
              setCheckboxValue(Boolean(value.value));
              break;
            case 'radio':
              setRadioValue(value.value);
              break;
            case 'dropdown':
              setDropdownValue(value.value);
              break;
            case 'approval':
              setApprovalValue(Boolean(value.value));
              break;
            case 'stamp':
              if (value.text) {
                setStampText(value.text);
              }
              if (value.color) {
                setStampColor(value.color);
              }
              if (value.image) {
                setUploadedImage(value.image);
              }
              break;
          }
        } else if (value.initials) {
          setTextInput(value.initials);
        }
      } else if (typeof value === 'string') {
        // Handle string values
        if (value.startsWith('data:image')) {
          setSignaturePreview(value);
          loadImageSignature(value);
        } else {
          // Check if it's an email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (fieldType === 'mail' && emailRegex.test(value)) {
            setEmailInput(value);
          } else {
            switch (fieldType) {
              case 'textbox':
                setTextInput(value);
                const strDims = calculateTextDimensions(value, fieldWidth, fieldHeight);
                setFWidth(strDims.width);
                setFHeight(strDims.height);
                break;
              case 'initials':
                const cleanText = value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                setTextInput(cleanText.substring(0, 3));
                break;
              case 'mail':
                setEmailInput(value);
                const strEmailW = calculateEmailWidth(value, fieldWidth);
                setFWidth(strEmailW);
                break;
              case 'date':
                try {
                  setSelectedDate(new Date(value));
                } catch {
                  setSelectedDate(new Date());
                }
                break;
              case 'checkbox':
                setCheckboxValue(value === 'true' || value === 'checked' || value === '✓');
                break;
              case 'radio':
                setRadioValue(value);
                break;
              case 'dropdown':
                setDropdownValue(value);
                break;
              case 'approval':
                setApprovalValue(value === 'true' || value === 'approved' || value === '✓');
                break;
              case 'stamp':
                setStampText(value);
                break;
            }
          }
        }
      } else if (typeof value === 'boolean') {
        // Handle boolean values
        switch (fieldType) {
          case 'checkbox':
          case 'approval':
            setCheckboxValue(value);
            setApprovalValue(value);
            break;
        }
      }
    } catch (error) {
      console.error('Error loading existing value:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadImageSignature = (imageData) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw existing signature
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Save to history
      const newImageData = canvas.toDataURL();
      setHistory([newImageData]);
      setCurrentStep(0);
    };
    img.src = imageData;
  };

  // Initialize canvas for drawing or stamp preview
  useEffect(() => {
    if (!['signature', 'witness_signature', 'initials', 'stamp'].includes(fieldType)) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleFactor = 4;

    // Set canvas internal pixel resolution scaled up by 4x for ultra-crisp output
    canvas.width = (width || 700) * scaleFactor;
    canvas.height = (fieldType === 'initials' ? height * 1.2 : (height || 300)) * scaleFactor;

    if (fieldType === 'stamp') {
      drawStampPreview();
      return;
    }

    // Set styles for drawing
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = fontColor || '#000000';
      ctx.lineWidth = 0.8 * scaleFactor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [width, height, fieldType]);

  // Validate email
  useEffect(() => {
    if (fieldType === 'mail' && emailInput) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValid(emailRegex.test(emailInput));
    }
  }, [emailInput, fieldType]);

  // Update current value whenever inputs change
  useEffect(() => {
    const value = getCurrentValue();
    setCurrentValue(value);
  }, [
    textInput, uploadedImage, selectedDate, checkboxValue,
    radioValue, dropdownValue, approvalValue, emailInput,
    stampText, activeTab, canvasRef.current, fieldType
  ]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const scaleFactor = 4;

    ctx.strokeStyle = fontColor || '#000000';
    ctx.lineWidth = 0.8 * scaleFactor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setIsDrawing(true);
    pointsRef.current = [{ x, y }];

    ctx.beginPath();
    ctx.moveTo(x, y);
    saveToHistory();
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const { x, y } = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const scaleFactor = 4;

    const points = pointsRef.current;
    points.push({ x, y });

    // Compute speed/distance
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Compute dynamic width (thicker for slow movement, thinner for fast movement)
    const maxStroke = 1.0 * scaleFactor;
    const minStroke = 0.6 * scaleFactor;
    const targetLineWidth = Math.max(minStroke, maxStroke - (distance * 0.02));

    ctx.strokeStyle = fontColor || '#000000';
    ctx.lineWidth = (ctx.lineWidth || maxStroke) * 0.6 + targetLineWidth * 0.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const len = points.length;
    if (len >= 2) {
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      
      ctx.beginPath();
      if (len === 2) {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(midX, midY);
      } else {
        const p0 = points[len - 3];
        const prevMidX = (p0.x + p1.x) / 2;
        const prevMidY = (p0.y + p1.y) / 2;
        ctx.moveTo(prevMidX, prevMidY);
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.closePath();
    setIsDrawing(false);
    pointsRef.current = [];
    saveToHistory();
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL();
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(imageData);

    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    saveToHistory();
    setCurrentValue(null);
  };

  const undo = () => {
    if (currentStep <= 0) {
      clearCanvas();
      return;
    }

    const newStep = currentStep - 1;
    setCurrentStep(newStep);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = history[newStep];
  };

  const redo = () => {
    if (currentStep >= history.length - 1) return;

    const newStep = currentStep + 1;
    setCurrentStep(newStep);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = history[newStep];
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (PNG, JPG, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadError('');
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxWidth = width;
        const maxHeight = height;
        let newWidth = img.width;
        let newHeight = img.height;

        if (newWidth > maxWidth) {
          const ratio = maxWidth / newWidth;
          newWidth = maxWidth;
          newHeight = newHeight * ratio;
        }

        if (newHeight > maxHeight) {
          const ratio = maxHeight / newHeight;
          newHeight = maxHeight;
          newWidth = newWidth * ratio;
        }

        canvas.width = maxWidth;
        canvas.height = maxHeight;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const x = (maxWidth - newWidth) / 2;
        const y = (maxHeight - newHeight) / 2;
        ctx.drawImage(img, x, y, newWidth, newHeight);

        const signatureData = canvas.toDataURL();
        setUploadedImage(signatureData);
        setSignaturePreview(signatureData);
        setIsLoading(false);
      };
      img.onerror = () => {
        setUploadError('Failed to load image');
        setIsLoading(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setAttachmentFile(file);
    setUploadError('');

    // Read file as data URL for saving
    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachmentData(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const generateTextSignature = () => {
    const canvas = textCanvasRef.current;
    if (!canvas || !textInput.trim()) return '';

    const ctx = canvas.getContext('2d');
    const scaleFactor = 4;
    
    // Check required width at minimum font size of 10px to avoid clipping
    const minFontSize = 10;
    const paddingX = 20 * scaleFactor;
    ctx.font = `${minFontSize * scaleFactor}px "${fontFamily}", cursive`;
    const minWidthNeeded = ctx.measureText(textInput).width + paddingX;
    const defaultWidth = width * scaleFactor;

    canvas.width = Math.max(defaultWidth, minWidthNeeded);
    canvas.height = (fieldType === 'initials' ? height * 1.2 : height) * scaleFactor;

    const maxTextWidth = canvas.width - paddingX;

    let currentFontSize = fieldType === 'initials'
      ? Math.min(fontSize * 1.4, 180) // ⬅ boost initials
      : fontSize;

    ctx.font = `${currentFontSize * scaleFactor}px "${fontFamily}", cursive`;
    while (currentFontSize > minFontSize && ctx.measureText(textInput).width > maxTextWidth) {
      currentFontSize -= 0.5;
      ctx.font = `${currentFontSize * scaleFactor}px "${fontFamily}", cursive`;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = fontColor;
    ctx.font = `${currentFontSize * scaleFactor}px "${fontFamily}", cursive`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const startY = canvas.height / 2;
    const startX = canvas.width / 2; // Center alignment offset

    ctx.fillText(textInput, startX, startY);

    return cropCanvas(canvas);
  };

  const drawStampPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas || !stampText) return;

    try {
      const scaleFactor = 4;
      const targetW = Math.max((width || 700), 400) * scaleFactor;
      const targetH = Math.max((height || 300), 200) * scaleFactor;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const minDim = Math.min(canvas.width, canvas.height);
      const padding = Math.min(20 * scaleFactor, minDim * 0.2);

      // Draw stamp shape
      ctx.strokeStyle = stampColor;
      ctx.lineWidth = 3 * scaleFactor;
      ctx.fillStyle = `${stampColor}20`;

      switch (stampShape) {
        case 'circle': {
          const rawRadius = minDim / 2 - padding;
          const radius = Math.max(10 * scaleFactor, rawRadius);
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'square': {
          const squareSize = Math.max(20 * scaleFactor, minDim - padding * 2);
          const squareX = centerX - squareSize / 2;
          const squareY = centerY - squareSize / 2;
          ctx.fillRect(squareX, squareY, squareSize, squareSize);
          ctx.strokeRect(squareX, squareY, squareSize, squareSize);
          break;
        }

        case 'rectangular': {
          const rectWidth = Math.max(40 * scaleFactor, canvas.width - padding * 2);
          const rectHeight = Math.max(20 * scaleFactor, canvas.height - padding * 2);
          const rectX = centerX - rectWidth / 2;
          const rectY = centerY - rectHeight / 2;
          ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
          ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
          break;
        }
        default:
          break;
      }

      // Draw stamp text
      ctx.fillStyle = stampColor;
      ctx.font = `bold ${Math.max(14, Math.round(24 * scaleFactor))}px Arial`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      const lines = stampText.split('\n');
      const lineHeight = Math.max(16, Math.round(28 * scaleFactor));
      const startY = centerY - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, centerX, startY + (index * lineHeight));
      });

      // Draw date if enabled
      if (showDateOnStamp) {
        const date = new Date().toLocaleDateString();
        ctx.font = `${Math.max(10, Math.round(12 * scaleFactor))}px Arial`;
        ctx.fillText(date, centerX, centerY + (lines.length * lineHeight) / 2 + 20 * scaleFactor);
      }

      // Draw "APPROVED" text around the stamp
      if (stampShape === 'circle') {
        const rawRadius = minDim / 2 - padding;
        const baseRadius = Math.max(10 * scaleFactor, rawRadius);
        const radius = Math.max(baseRadius + 5 * scaleFactor, Math.min(baseRadius + 15 * scaleFactor, minDim / 2 - 2 * scaleFactor));
        const approvedText = "APPROVED";
        const angleStep = (2 * Math.PI) / approvedText.length;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.font = `bold ${Math.max(8, Math.round(10 * scaleFactor))}px Arial`;
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'center';

        for (let i = 0; i < approvedText.length; i++) {
          const angle = i * angleStep;
          ctx.save();
          ctx.rotate(angle);
          ctx.translate(0, -radius);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(approvedText[i], 0, 0);
          ctx.restore();
        }
        ctx.restore();
      }
    } catch (err) {
      console.error('Failed to draw stamp preview:', err);
    }
  };

  // Get current value based on field type and active tab
  const getCurrentValue = () => {
    switch (fieldType) {
      case 'signature':
      case 'initials':
      case 'witness_signature':
        let imageData = null;
        if (activeTab === 0) { // Type tab
          imageData = generateTextSignature();
        } else if (activeTab === 1) { // Draw tab
          imageData = canvasRef.current ? cropCanvas(canvasRef.current) : null;
        } else { // Upload tab
          imageData = uploadedImage;
        }

        if (imageData) {
          return {
            image: imageData,
            text: activeTab === 0 ? textInput : undefined,
            signature_type: activeTab === 0 ? 'type' : (activeTab === 1 ? 'draw' : 'upload'),
            font_family: fontFamily,
            font_color: fontColor,
            font_size: fontSize
          };
        }
        return null;

      case 'stamp':
        let stampImage = null;
        if (activeTab === 0) {
          drawStampPreview();
          stampImage = canvasRef.current?.toDataURL();
        } else {
          stampImage = uploadedImage;
        }

        if (stampImage) {
          return {
            image: stampImage,
            text: stampText,
            color: stampColor
          };
        }
        return null;

      case 'date':
        return {
          value: selectedDate
            ? selectedDate.toISOString().split('T')[0]
            : null,
        };

      case 'textbox':
        return { value: textInput.trim() };

      case 'mail':
        return { value: emailInput.trim() };

      case 'checkbox':
      case 'approval':
        return { value: fieldType === 'checkbox' ? checkboxValue : approvalValue };

      case 'radio':
        return { value: radioValue };

      case 'dropdown':
        return { value: dropdownValue };

      case 'attachment':
        return {
          filename: attachmentFile?.name,
          size: attachmentFile?.size,
          data: attachmentData,
          type: attachmentFile?.type
        };

      default:
        return null;
    }
  };

  const isSaveDisabled = () => {
    const value = getCurrentValue();
    if (!value) return true;

    if (fieldType === 'signature' || fieldType === 'initials' || fieldType === 'witness_signature' || fieldType === 'stamp') {
      return !value.image;
    }

    if (fieldType === 'textbox' || fieldType === 'mail') {
      return !value.value || value.value.trim() === '';
    }

    if (fieldType === 'date') {
      if (!value.value || value.value.trim() === '') return true;
      const todayStr = new Date().toISOString().split('T')[0];
      if (value.value < todayStr) return true;
      return false;
    }

    if (fieldType === 'radio' || fieldType === 'dropdown') {
      return !value.value;
    }

    if (fieldType === 'checkbox' || fieldType === 'approval') {
      return value.value === false;
    }

    if (fieldType === 'attachment') {
      return !value.filename;
    }

    return true;
  };

  const handleSave = () => {
    const value = getCurrentValue();
    if (!value) {
      alert('Please create a signature first');
      return;
    }

    // Prepare payload based on field type
    let payload = null;

    switch (fieldType) {
      case 'signature':
      case 'initials':
      case 'witness_signature':
      case 'stamp':
        // Image-based fields
        if (!value.image) {
          alert('Please create or upload an image');
          return;
        }
        payload = { image: value.image };
        // Add text for signature fields
        if (fieldType === 'signature' || fieldType === 'witness_signature' || fieldType === 'initials') {
          if (value.text) payload.text = value.text;
          if (value.signature_type) payload.signature_type = value.signature_type;
          if (value.signature_type === 'type') {
            payload.font_family = fontFamily;
            payload.font_size = fontSize;
            payload.font_color = fontColor;
          }
        }
        // Add additional properties for stamp
        if (fieldType === 'stamp') {
          if (value.text) payload.text = value.text;
          if (value.color) payload.color = value.color;
        }
        break;

      case 'checkbox':
      case 'approval':
        // Boolean fields
        payload = { value: value.value };
        break;

      case 'radio':
      case 'dropdown':
        // Locked dimensions for professional look
        payload = {
          value: value.value || '',
          font_size: fontSize,
          font_family: fontFamily,
          font_color: fontColor
        };
        break;

      case 'textbox':
        // Value-based fields with adjustable length (as per previous model)
        payload = {
          value: value.value || '',
          font_size: fontSize,
          font_family: fontFamily,
          font_color: fontColor,
          width: fWidth,
          height: fHeight
        };
        break;
      case 'mail':
        payload = { 
          value: value.value || '',
          width: fWidth,
          height: fHeight
        };
        break;

      case 'date':
        if (value.value) {
          const todayStr = new Date().toISOString().split('T')[0];
          if (value.value < todayStr) {
            alert('Cannot select a past date. Please select today or a future date.');
            return;
          }
        }
        payload = { value: value.value || '' };
        break;

      case 'attachment':
        // Attachment fields
        if (!value.filename) {
          alert('Please upload a file');
          return;
        }
        payload = {
          filename: value.filename,
          size: value.size,
          data: value.data,
          type: value.type
        };
        break;

      default:
        console.error('Unknown field type:', fieldType);
        return;
    }

    console.log('Saving payload:', { fieldType, payload });
    onSave(payload, 'complete');
  };

  const handleModalSave = (value, mode) => {
    if (!value || typeof value !== 'object') {
      console.error('Invalid save payload:', value);
      return;
    }

    if (value.value && typeof value.value === 'object' && 'value' in value.value) {
      console.error('Nested value detected, blocking save:', value);
      return;
    }

    onSave(value, mode);

    if (mode === 'complete') {
      onClose();
    }
  };

  const getPreviewValue = () => {
    const value = getCurrentValue();
    if (!value) return 'Empty';

    // Image-based
    if (value.image) {
      return (
        <img
          src={value.image}
          alt="Preview"
          style={{ maxWidth: '100%', maxHeight: 60 }}
        />
      );
    }

    // Value-based
    if (typeof value.value === 'boolean') {
      return value.value ? '✓' : '☐';
    }

    if (typeof value.value === 'string') {
      return value.value || 'Empty';
    }

    return 'Empty';
  };

  const renderDrawTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {fieldType === 'stamp' ? 'Design your stamp below' : `Draw your ${fieldType === 'initials' ? 'initials' : 'signature'} with mouse or touch`}
        </Typography>
        
        {fieldType !== 'stamp' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
              Color:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {colors.map(color => (
                <IconButton
                  key={color}
                  size="small"
                  onClick={() => setFontColor(color)}
                  sx={{
                    width: 22,
                    height: 22,
                    backgroundColor: color,
                    border: fontColor === color ? '2px solid #fff' : '1px solid #ccc',
                    boxShadow: fontColor === color ? '0 0 0 2px #1976d2' : 'none',
                    '&:hover': {
                      opacity: 0.9,
                    },
                  }}
                >
                  {fontColor === color && <CheckIcon sx={{ color: '#fff', fontSize: 12 }} />}
                </IconButton>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          border: '1px dashed #bdbdbd',
          borderRadius: 1,
          backgroundColor: '#fafafa',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'none',
          mb: 2,
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={fieldType === 'stamp' ? null : startDrawing}
          onMouseMove={fieldType === 'stamp' ? null : draw}
          onMouseUp={fieldType === 'stamp' ? null : stopDrawing}
          onMouseLeave={fieldType === 'stamp' ? null : stopDrawing}
          onTouchStart={fieldType === 'stamp' ? null : (e) => {
            e.preventDefault();
            startDrawing(e.touches[0]);
          }}
          onTouchMove={fieldType === 'stamp' ? null : (e) => {
            e.preventDefault();
            draw(e.touches[0]);
          }}
          onTouchEnd={fieldType === 'stamp' ? null : (e) => {
            e.preventDefault();
            stopDrawing();
          }}
          style={{
            display: 'block',
            cursor: fieldType === 'stamp' ? 'default' : 'crosshair',
            width: '100%',
            height: `${height}px`,
          }}
        />

        {fieldType !== 'stamp' && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              opacity: 0.3,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: FIELD_CONFIG[fieldType]?.color || '#1976d2',
                transform: 'translateY(-50%)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '75%',
                left: 0,
                right: 0,
                height: '1px',
                borderTop: `2px dotted ${FIELD_CONFIG[fieldType]?.color || '#1976d2'}`,
                transform: 'translateY(-50%)',
              }}
            />
          </Box>
        )}
      </Box>

      {fieldType !== 'stamp' && (
        <Grid container spacing={1} justifyContent="center">
          <Grid item>
            <IconButton
              color="primary"
              onClick={undo}
              disabled={currentStep <= 0}
              title="Undo"
              size="small"
            >
              <UndoIcon />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton
              color="primary"
              onClick={redo}
              disabled={currentStep >= history.length - 1}
              title="Redo"
              size="small"
            >
              <ResetIcon />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton
              color="error"
              onClick={clearCanvas}
              title="Clear"
              size="small"
            >
              <ClearIcon />
            </IconButton>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderTextTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {fieldType === 'initials' ? 'Type your initials (1-3 letters)' : (fieldType === 'textbox' ? 'Enter text content' : 'Type your signature')}
      </Typography>

      <TextField
        fullWidth
        multiline={!['initials'].includes(fieldType)}
        rows={['initials'].includes(fieldType) ? 1 : (fieldType === 'textbox' ? 4 : 2)}
        value={textInput}
        onChange={(e) => {
          if (fieldType === 'initials') {
            // Only allow letters for initials, auto-uppercase
            const cleaned = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
            setTextInput(cleaned.substring(0, 3));
          } else if (fieldType === 'textbox') {
            // Enforce maximum 60 character limit and adjust field dimensions dynamically
            const val = e.target.value.substring(0, 60);
            setTextInput(val);
            const dims = calculateTextDimensions(val, fieldWidth, fieldHeight);
            setFWidth(dims.width);
            setFHeight(dims.height);
          } else {
            // Limit to 36 characters for signatures/stamps
            setTextInput(e.target.value.substring(0, 36));
          }
        }}
        placeholder={
          fieldType === 'initials'
            ? 'AB'
            : fieldType === 'textbox'
              ? 'Enter text (max 60 characters)...'
              : FIELD_CONFIG[fieldType]?.placeholder || 'Enter text...'
        }
        helperText={
          fieldType === 'textbox'
            ? `${textInput.length}/60 characters • ${textInput.trim() ? textInput.trim().split(/\s+/).length : 0} words (Width: ${fWidth}px)`
            : undefined
        }
        sx={{ mb: 2 }}
        inputProps={{
          maxLength: fieldType === 'initials' ? 3 : (fieldType === 'textbox' ? 60 : 36),
          style: {
            textTransform: fieldType === 'initials' ? 'uppercase' : 'none',
            fontSize: fieldType === 'initials' ? '32px' : 'inherit',
            fontWeight: fieldType === 'initials' ? 'bold' : 'normal',
            letterSpacing: fieldType === 'initials' ? '4px' : 'normal',
            textAlign: fieldType === 'initials' ? 'center' : 'left',
            fontFamily: fieldType === 'initials' ? 'Arial, sans-serif' : 'inherit'
          }
        }}
      />

      {fieldType === 'initials' && textInput && (
        <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {textInput.length === 1 ? 'Single initial' :
              textInput.length === 2 ? 'Two initials (recommended)' :
                'Three initials'} - Ready to save
          </Typography>
        </Box>
      )}

      {fieldType === 'initials' && !textInput && (
        <Box sx={{ mb: 2, p: 1, bgcolor: '#fff3cd', borderRadius: 1, border: '1px solid #ffeaa7' }}>
          <Typography variant="caption" color="text.secondary">
            💡 Tip: Usually 2-3 letters from your first and last name (e.g., "JD" for John Doe)
          </Typography>
        </Box>
      )}

      {/* Signature Font Styles Direct Preview - Hidden for standard text fields */}
      {!['textbox', 'mail'].includes(fieldType) ? (
        <Box sx={{ mb: 2 }}>
          {/* Header Bar: Filter Chips & Ink Palette */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
              flexWrap: 'wrap',
              gap: 1.5,
              p: 1.5,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Filter Category Chips */}
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mr: 0.5, letterSpacing: '0.05em' }}>
                STYLE:
              </Typography>
              {[
                { id: 'all', label: `All (${allSignatureFonts.length})` },
                { id: 'handwriting', label: `Handwriting (${allSignatureFonts.filter(f => f.category === 'handwriting').length})` },
                { id: 'formal', label: `Formal (${allSignatureFonts.filter(f => f.category === 'formal').length})` },
                { id: 'modern', label: `Modern (${allSignatureFonts.filter(f => f.category === 'modern').length})` }
              ].map(cat => (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  size="small"
                  onClick={() => setSelectedFontStyle(cat.id)}
                  sx={{
                    fontWeight: selectedFontStyle === cat.id ? 700 : 500,
                    fontSize: '0.75rem',
                    bgcolor: selectedFontStyle === cat.id ? 'rgb(13, 148, 136)' : '#ffffff',
                    color: selectedFontStyle === cat.id ? '#ffffff' : '#334155',
                    border: '1px solid',
                    borderColor: selectedFontStyle === cat.id ? 'rgb(13, 148, 136)' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: selectedFontStyle === cat.id ? 'rgb(11, 130, 120)' : '#f1f5f9'
                    }
                  }}
                />
              ))}
            </Box>

            {/* Controls: Size & Ink Color Palette */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {/* Font Size Adjustment */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mr: 0.5, letterSpacing: '0.05em' }}>
                  SIZE:
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setFontSize(prev => Math.max(48, (parseInt(prev) || 120) - 12))}
                  sx={{ p: 0.5, border: '1px solid #cbd5e1', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}
                  title="Smaller font size"
                >
                  <ZoomOutIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                  {fontSize || 120}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setFontSize(prev => Math.min(300, (parseInt(prev) || 120) + 12))}
                  sx={{ p: 0.5, border: '1px solid #cbd5e1', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}
                  title="Larger font size"
                >
                  <ZoomInIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              {/* Ink Color Selector */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', letterSpacing: '0.05em' }}>
                  INK:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {colors.map(color => (
                    <IconButton
                      key={color}
                      size="small"
                      onClick={() => setFontColor(color)}
                      sx={{
                        width: 26,
                        height: 26,
                        backgroundColor: color,
                        border: fontColor === color ? '2px solid #fff' : '1px solid #cbd5e1',
                        boxShadow: fontColor === color ? '0 0 0 2px rgb(13, 148, 136)' : 'none',
                        '&:hover': { opacity: 0.9 }
                      }}
                    >
                      {fontColor === color && <CheckIcon sx={{ color: '#fff', fontSize: 14 }} />}
                    </IconButton>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Direct Live Preview Full-Width Signature List (Image 2 style) */}
          <Box
            sx={{
              maxHeight: '350px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              bgcolor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: '#f8fafc' },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(13, 148, 136, 0.3)',
                borderRadius: '4px'
              }
            }}
          >
            {filteredFonts.map((font, idx) => {
              const isSelected = fontFamily === font.family;
              const displayText = textInput.trim()
                ? (fieldType === 'initials' ? textInput.toUpperCase() : textInput)
                : (fieldType === 'initials'
                    ? (recipientData?.name ? recipientData.name.split(' ').map(n => n[0]).join('').substring(0, 3).toUpperCase() : 'JD')
                    : (recipientData?.name || 'Your Signature'));

              return (
                <Box
                  key={font.family}
                  onClick={() => {
                    setFontFamily(font.family);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    minHeight: fieldType === 'initials' ? 62 : 68,
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    bgcolor: isSelected ? 'rgba(13, 148, 136, 0.11)' : '#ffffff',
                    borderBottom: idx === filteredFonts.length - 1 ? 'none' : '1px solid #edf2f7',
                    transition: 'background-color 0.15s ease',
                    userSelect: 'none',
                    '&:hover': {
                      bgcolor: isSelected ? 'rgba(13, 148, 136, 0.16)' : '#f8fafc'
                    }
                  }}
                >
                  {/* Left checkmark column */}
                  <Box
                    sx={{
                      width: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isSelected && (
                      <CheckIcon
                        sx={{
                          color: 'rgb(13, 148, 136)',
                          fontSize: 26
                        }}
                      />
                    )}
                  </Box>

                  {/* Pure Signature Text Preview (Full Width, No font names) */}
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      overflow: 'hidden',
                      pr: 3
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: `"${font.family}", cursive, sans-serif`,
                        fontSize: fieldType === 'initials' ? '36px' : '30px',
                        color: fontColor || '#000000',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        maxWidth: '100%',
                        opacity: textInput.trim() ? 1 : 0.45,
                        fontWeight: fieldType === 'initials' ? 600 : 'normal',
                        letterSpacing: fieldType === 'initials' && font.category !== 'handwriting' ? '6px' : 'normal',
                        transition: 'color 0.15s ease'
                      }}
                    >
                      {displayText}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : (
        /* Textbox Preview for non-signature text fields */
        <Box
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 3,
            backgroundColor: '#fafafa',
            minHeight: 100,
            display: 'flex',
            alignItems: textInput ? 'flex-start' : 'center',
            justifyContent: 'center',
            mb: 2,
            width: '100%',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {textInput ? (
            <Box
              sx={{
                fontFamily: 'inherit',
                fontSize: '14px',
                color: '#000000',
                textAlign: 'left',
                whiteSpace: 'pre-line',
                padding: '10px 20px',
                width: `${fWidth}px`,
                minHeight: `${fHeight}px`,
                maxWidth: '100%',
                overflow: 'visible',
                wordBreak: 'break-word',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {textInput}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Preview will appear here
            </Typography>
          )}
        </Box>
      )}

      <canvas ref={textCanvasRef} style={{ display: 'none' }} />
    </Box>
  );

  const renderUploadTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {fieldType === 'attachment' ? 'Upload a file' :
          fieldType === 'stamp' ? 'Upload a stamp image (PNG, JPG, SVG)' :
            `Upload a ${fieldType === 'initials' ? 'initials' : 'signature'} image (PNG, JPG, SVG)`}
      </Typography>

      <Box
        sx={{
          border: '2px dashed #bdbdbd',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          backgroundColor: '#fafafa',
          cursor: 'pointer',
          mb: 2,
          '&:hover': {
            borderColor: FIELD_CONFIG[fieldType]?.color || 'primary.main',
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
          },
        }}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <input
          id="file-upload"
          type="file"
          accept={fieldType === 'attachment' ? '*' : 'image/*'}
          onChange={fieldType === 'attachment' ? handleFileUpload : handleImageUpload}
          style={{ display: 'none' }}
        />

        {isLoading ? (
          <CircularProgress size={40} sx={{ color: 'rgb(13, 148, 136)' }} />
        ) : fieldType === 'attachment' ? (
          attachmentFile ? (
            <Box sx={{ py: 2 }}>
              <Box sx={{
                display: 'inline-flex',
                p: 2,
                bgcolor: '#f0fdf4',
                borderRadius: '50%',
                mb: 2,
                border: '1px solid #bbf7d0'
              }}>
                <AttachIcon sx={{ fontSize: 40, color: '#166534' }} />
              </Box>
              <Box sx={{ maxWidth: '85%', mx: 'auto', mb: 0.5 }}>
                <FilenameDisplay
                  filename={attachmentFile.name}
                  sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem', justifyContent: 'center' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {(attachmentFile.size / 1024).toFixed(2)} KB • Ready to attach
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('file-upload').click();
                  }}
                  startIcon={<RefreshIcon />}
                  sx={{ borderRadius: '6px', textTransform: 'none' }}
                >
                  Change File
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttachmentFile(null);
                    setAttachmentData(null);
                  }}
                  sx={{ borderRadius: '6px', textTransform: 'none' }}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Box sx={{
                display: 'inline-flex',
                p: 2,
                bgcolor: '#f1f5f9',
                borderRadius: '50%',
                mb: 2,
                color: '#64748b'
              }}>
                <UploadIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Click or drag file to upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Support for all common document and image types
              </Typography>
              <Typography variant="caption" sx={{ mt: 2, display: 'block', color: '#94a3b8' }}>
                Maximum file size: 10MB
              </Typography>
            </>
          )
        ) : uploadedImage ? (
          <Box>
            <img
              src={uploadedImage}
              alt="Uploaded"
              style={{
                maxWidth: '100%',
                maxHeight: '150px',
                objectFit: 'contain',
              }}
            />
            <Button
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={(e) => {
                e.stopPropagation();
                setUploadedImage(null);
              }}
              sx={{ mt: 1 }}
            >
              Remove Image
            </Button>
          </Box>
        ) : (
          <>
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              Click to upload {fieldType === 'stamp' ? 'stamp image' : fieldType === 'initials' ? 'initials image' : 'image'}
            </Typography>
            <Typography variant="caption" color="text-secondary">
              {fieldType === 'attachment' ? 'All file types' : 'PNG, JPG, SVG'} • Max 5MB
            </Typography>
          </>
        )}
      </Box>

      {fieldType === 'attachment' ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload supporting documents or files related to this document.
        </Alert>
      ) : fieldType === 'stamp' ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          For best results, use a transparent PNG image of your stamp on a white background.
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          For best results, use a transparent PNG image on a white background.
        </Alert>
      )}
    </Box>
  );

  const renderStampCreateTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Customize your stamp
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={stampText}
            onChange={(e) => {
              setStampText(e.target.value);
              drawStampPreview();
            }}
            placeholder="Enter stamp text (e.g., APPROVED, PAID, CONFIDENTIAL)"
            sx={{ mb: 2 }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Stamp Color</FormLabel>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {stampColors.map(color => (
                <IconButton
                  key={color}
                  size="small"
                  onClick={() => {
                    setStampColor(color);
                    drawStampPreview();
                  }}
                  sx={{
                    width: 28,
                    height: 28,
                    backgroundColor: color,
                    border: stampColor === color ? '2px solid #000' : '1px solid #ccc',
                    '&:hover': {
                      opacity: 0.9,
                    },
                  }}
                >
                  {stampColor === color && <CheckIcon sx={{ color: '#fff', fontSize: 16 }} />}
                </IconButton>
              ))}
            </Box>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Stamp Shape</FormLabel>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {stampShapes.map(shape => (
                <Chip
                  key={shape.value}
                  label={shape.label}
                  icon={<span style={{ fontSize: '18px' }}>{shape.icon}</span>}
                  onClick={() => {
                    setStampShape(shape.value);
                    drawStampPreview();
                  }}
                  variant={stampShape === shape.value ? 'filled' : 'outlined'}
                  sx={{
                    backgroundColor: stampShape === shape.value ? stampColor : 'transparent',
                    color: stampShape === shape.value ? '#fff' : 'inherit',
                    borderColor: stampShape === shape.value ? stampColor : '#ccc',
                  }}
                />
              ))}
            </Box>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={showDateOnStamp}
                onChange={(e) => {
                  setShowDateOnStamp(e.target.checked);
                  drawStampPreview();
                }}
                color="primary"
              />
            }
            label="Include current date on stamp"
          />
        </Grid>
      </Grid>

      <Box
        sx={{
          border: '1px dashed #bdbdbd',
          borderRadius: 1,
          backgroundColor: '#fafafa',
          position: 'relative',
          overflow: 'hidden',
          mb: 2,
        }}
      >
        <canvas
          ref={canvasRef}
          width={(width || 700) * 4}
          height={(height || 300) * 4}
          style={{
            display: 'block',
            width: '100%',
            height: `${height}px`,
          }}
        />
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Your stamp will be displayed in the document with the selected design.
      </Alert>
    </Box>
  );

  const renderMailTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Enter your email address
      </Typography>

      <TextField
        fullWidth
        type="email"
        value={emailInput}
        onChange={(e) => {
          const val = e.target.value.substring(0, 35);
          setEmailInput(val);
          const w = calculateEmailWidth(val, fieldWidth);
          setFWidth(w);
        }}
        placeholder="name@example.com"
        error={!emailValid && emailInput.length > 0}
        helperText={
          !emailValid && emailInput.length > 0 
            ? "Please enter a valid email address" 
            : `${emailInput.length}/35 characters (Width: ${fWidth}px)`
        }
        sx={{ mb: 2 }}
        inputProps={{
          maxLength: 35
        }}
        InputProps={{
          startAdornment: <MailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
      />

      <Box
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          p: 2,
          backgroundColor: '#fafafa',
          textAlign: 'center',
          mb: 2,
        }}
      >
        <MailIcon sx={{ fontSize: 40, color: emailValid ? '#1a73e8' : '#f44336', mb: 1 }} />
        <Typography variant="body1" sx={{ fontWeight: 600, wordBreak: 'break-all' }} gutterBottom>
          {emailInput || 'No email entered'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {emailValid ? `Valid email address • Adjusted width: ${fWidth}px` : 'Enter a valid email address'}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Your email address will be securely stored and displayed in the document.
      </Alert>
    </Box>
  );

  const renderDateTab = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Select a date
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <DatePicker
              value={selectedDate}
              disablePast
              minDate={today}
              onChange={(newDate) => {
                if (newDate) {
                  const checkDate = new Date(newDate);
                  checkDate.setHours(0, 0, 0, 0);
                  if (checkDate < today) {
                    setSelectedDate(today);
                    return;
                  }
                }
                setSelectedDate(newDate);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { maxWidth: 300 },
                  inputProps: {
                    min: todayStr
                  }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  inputProps={{
                    ...params.inputProps,
                    min: todayStr
                  }}
                  sx={{ maxWidth: 300 }}
                />
              )}
            />
          </Box>

          <Alert severity="info" sx={{ mb: 2, maxWidth: 360, mx: 'auto', textAlign: 'left', py: 0.5 }}>
            Past dates cannot be selected.
          </Alert>

          <Box
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              p: 2.5,
              backgroundColor: '#fafafa',
              textAlign: 'center',
              mb: 2,
            }}
          >
            <CalendarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              {selectedDate ? selectedDate.toLocaleDateString() : 'No date selected'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Selected date will appear in the document
            </Typography>
          </Box>
        </Box>
      </LocalizationProvider>
    );
  };

  const renderCheckboxTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Check the box to confirm
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={checkboxValue}
              onChange={(e) => setCheckboxValue(e.target.checked)}
              color="primary"
              sx={{ transform: 'scale(2)', mr: 3 }}
            />
          }
          label={
            <Typography variant="h6">
              {checkboxValue ? 'Checked ✓' : 'Click to check'}
            </Typography>
          }
        />
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        This checkbox will appear as {checkboxValue ? 'checked (✓)' : 'unchecked (☐)'} in the document.
      </Alert>
    </Box>
  );

  const renderRadioTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {radioOptions && radioOptions.length > 0
          ? 'Select an option'
          : 'No options available'}
      </Typography>

      <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
        <RadioGroup
          value={radioValue}
          onChange={(e) => setRadioValue(e.target.value)}
          sx={{ gap: 2 }}
        >
          {radioOptions.map((option) => (
            <Paper
              key={option}
              elevation={radioValue === option ? 2 : 0}
              sx={{
                p: 2,
                border: `2px solid ${radioValue === option ? FIELD_CONFIG[fieldType]?.color : '#e0e0e0'}`,
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  borderColor: FIELD_CONFIG[fieldType]?.color,
                },
              }}
              onClick={() => setRadioValue(option)}
            >
              <FormControlLabel
                value={option}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{option}</Typography>
                    {option === 'Yes' && <Typography variant="caption" color="text.secondary">(filled circle ●)</Typography>}
                    {option === 'No' && <Typography variant="caption" color="text.secondary">(empty circle ○)</Typography>}
                    {option.toLowerCase().includes('maybe') && <Typography variant="caption" color="text.secondary">(dash -)</Typography>}
                    {(option.toLowerCase().includes('not applicable') || option.toLowerCase() === 'n/a' || option.toLowerCase() === 'na') &&
                      <Typography variant="caption" color="text.secondary">(cross X)</Typography>}
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
            </Paper>
          ))}
        </RadioGroup>
      </FormControl>

      {!radioOptions.length && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No options configured for this radio field.
        </Alert>
      )}
    </Box>
  );

  const renderDropdownTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {fieldOptions && fieldOptions.length > 0
          ? 'Choose an option from the dropdown'
          : 'No options available'}
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <Select
          value={dropdownValue}
          onChange={(e) => setDropdownValue(e.target.value)}
          displayEmpty
          sx={{
            fontSize: '1.1rem',
            py: 1,
          }}
          disabled={!dropdownOptions.length}
        >
          <MenuItem value="" disabled>
            <em>Select an option...</em>
          </MenuItem>
          {dropdownOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {dropdownValue && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Selected: <strong>{dropdownValue}</strong>
        </Alert>
      )}

      {!dropdownOptions.length && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No options configured for this dropdown field.
        </Alert>
      )}
    </Box>
  );

  const renderApprovalTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Approve this document
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Button
          variant={approvalValue ? "contained" : "outlined"}
          color="success"
          size="large"
          onClick={() => setApprovalValue(!approvalValue)}
          startIcon={approvalValue ? <CheckIcon /> : <ApprovalIcon />}
          sx={{
            py: 2,
            px: 4,
            fontSize: '1.2rem',
            borderRadius: 2,
            minWidth: 200,
          }}
        >
          {approvalValue ? 'Approved ✓' : 'Click to Approve'}
        </Button>
      </Box>

      {approvalValue && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Document Approved
          </Typography>
          <Typography variant="body2">
            By: {recipientData.name || 'Signer'} • Date: {new Date().toLocaleDateString()}
          </Typography>
        </Alert>
      )}
    </Box>
  );

  const renderContent = () => {
    const config = FIELD_CONFIG[fieldType] || FIELD_CONFIG.signature;
    const tabs = config.tabs || [];

    if (tabs.length > 1) {
      // Multiple tabs (signature, witness signature, initials, stamp)
      return (
        <>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={tab}
                icon={
                  tab === 'draw' ? <DrawIcon /> :
                    tab === 'type' ? <TextIcon /> :
                      tab === 'upload' ? <UploadIcon /> :
                        tab === 'create' ? <StampIcon /> :
                          null
                }
                label={
                  tab === 'draw' ? 'Draw' :
                    tab === 'type' ? 'Type' :
                      tab === 'upload' ? 'Upload' :
                        tab === 'create' ? 'Create' : tab
                }
              />
            ))}
          </Tabs>

          {tabs[activeTab] === 'draw' && renderDrawTab()}
          {tabs[activeTab] === 'type' && renderTextTab()}
          {tabs[activeTab] === 'upload' && renderUploadTab()}
          {tabs[activeTab] === 'create' && renderStampCreateTab()}
        </>
      );
    } else if (tabs.length === 1) {
      // Single tab for other field types
      const tabType = tabs[0];
      switch (tabType) {
        case 'calendar':
          return renderDateTab();
        case 'checkbox':
          return renderCheckboxTab();
        case 'radio':
          return renderRadioTab();
        case 'dropdown':
          return renderDropdownTab();
        case 'upload':
          return renderUploadTab();
        case 'approval':
          return renderApprovalTab();
        case 'email':
          return renderMailTab();
        case 'text':
        default:
          return renderTextTab();
      }
    } else {
      return renderTextTab();
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, margin: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, border: `2px solid ${FIELD_CONFIG[fieldType]?.color || '#e0e0e0'}`, borderRadius: 2 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError('')}>
            {uploadError}
          </Alert>
        )}

        {renderContent()}

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              variant="outlined"
              onClick={() => {
                switch (fieldType) {
                  case 'signature':
                  case 'witness_signature':
                  case 'initials':
                    clearCanvas();
                    setTextInput('');
                    setUploadedImage(null);
                    break;
                  case 'textbox':
                    setTextInput('');
                    break;
                  case 'date':
                    setSelectedDate(null);
                    break;
                  case 'checkbox':
                    setCheckboxValue(false);
                    break;
                  case 'radio':
                    setRadioValue('');
                    break;
                  case 'dropdown':
                    setDropdownValue('');
                    break;
                  case 'attachment':
                    setAttachmentFile(null);
                    break;
                  case 'approval':
                    setApprovalValue(false);
                    break;
                  case 'mail':
                    setEmailInput('');
                    break;
                  case 'stamp':
                    setStampText('');
                    setUploadedImage(null);
                    break;
                }
                setCurrentValue(null);
              }}
              startIcon={<ClearIcon />}
              fullWidth
              size="large"
            >
              Clear
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<SaveIcon />}
              disabled={isSaveDisabled()}
              fullWidth
              size="large"
            >
              Save
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

// Modal wrapper component
export const EnhancedSignaturePadModal = ({
  open,
  onSave,
  onClose,
  existingSignature = null,
  recipientData = {},
  fieldType = 'signature',
  fieldLabel = '',
  fieldOptions = [],
  fieldWidth = 100,
  fieldHeight = 40
}) => {
  const handleModalSave = (value, mode) => {
    if (!value) {
      console.error('No value to save');
      return;
    }

    console.log(`Saving ${mode} value:`, {
      fieldType,
      value: typeof value === 'string' ? value.substring(0, 50) + '...' : value,
      mode
    });

    onSave(value, mode);

    if (mode === 'complete') {
      onClose();
    }
  };

  const getModalTitle = () => {
    switch (fieldType) {
      case 'signature': return 'Add Signature';
      case 'initials': return 'Add Initials';
      case 'date': return 'Select Date';
      case 'approval': return 'Approve Document';
      case 'mail': return 'Enter Email Address';
      case 'stamp': return 'Create Stamp';
      case 'attachment': return 'Attach File';
      case 'witness_signature': return 'Add Witness Signature';
      default: return `Complete ${fieldLabel || fieldType}`;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh', overflow: 'auto' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {getModalTitle()}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <EnhancedSignaturePad
          onSave={handleModalSave}
          onClose={onClose}
          existingSignature={existingSignature}
          recipientData={recipientData}
          fieldType={fieldType}
          fieldLabel={fieldLabel}
          fieldOptions={fieldOptions}
          fieldWidth={fieldWidth}
          fieldHeight={fieldHeight}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedSignaturePad;
