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
  const [activeTab, setActiveTab] = useState(0);
  const [textInput, setTextInput] = useState('');
  // const [fontSize, setFontSize] = useState(112); 
  const [fontFamily, setFontFamily] = useState('Ink Free');
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
  const [selectedFontStyle, setSelectedFontStyle] = useState('handwriting'); // New state for font style

  const getDefaultFontSize = () => {
    if (fieldType === 'initials') return 160; // ⬅ bigger like signature
    return 112;
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
        'Ink Free',
        'Fave Script Bold Pro',
        'Bradley Hand ITC',
        'Gabriola',
        'Pristina',
        'Vivaldi',
        'Cochocib Script Latin Pro',
        'Eras Light ITC',
        'Dreaming Outloud Script Pro Regular'
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

  // Color options - black, blue, green, red
  const colors = [
    '#000000', // Black
    '#1976d2', // Blue
    '#2ecc71', // Green
    '#e53935'  // Red
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
      setFontFamily('Ink Free');
    }
  }, [selectedFontStyle, fontFamily]);

  const loadExistingValue = (value) => {
    setIsLoading(true);

    try {
      if (typeof value === 'object') {
        // Handle object values
        if (value.image) {
          setSignaturePreview(value.image);
          loadImageSignature(value.image);
        } else if (value.text !== undefined) {
          setTextInput(value.text);
        } else if (value.value !== undefined) {
          switch (fieldType) {
            case 'textbox':
            case 'initials':
              setTextInput(value.value);
              // Load custom styling if present
              if (value.font_size) setFontSize(value.font_size);
              if (value.font_family) setFontFamily(value.font_family);
              if (value.font_color) setFontColor(value.font_color);
              if (value.width) setFWidth(value.width);
              if (value.height) setFHeight(value.height);
              break;
            case 'mail':
              setEmailInput(value.value);
              break;
            case 'date':
              setSelectedDate(new Date(value.value));
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
              case 'initials':
                const cleanText = value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                setTextInput(cleanText.substring(0, 3));
                break;
              case 'mail':
                setEmailInput(value);
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

  // Initialize canvas for drawing
  useEffect(() => {
    if (!['signature', 'witness_signature', 'initials'].includes(fieldType)) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = width;
    canvas.height = fieldType === 'initials' ? height * 1.2 : height;

    // Set styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    setIsDrawing(true);
    setLastX(x);
    setLastY(y);

    ctx.beginPath();
    ctx.moveTo(x, y);
    saveToHistory();
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const { x, y } = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.lineTo(x, y);
    ctx.stroke();
    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.closePath();
    setIsDrawing(false);
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
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    canvas.width = width;
    canvas.height = fieldType === 'initials' ? height * 1.2 : height;

    const finalFontSize =
      fieldType === 'initials'
        ? Math.min(fontSize * 1.4, 180) // ⬅ boost initials
        : fontSize;



    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = fontColor;
    ctx.font = `${finalFontSize}px "${fontFamily}", cursive`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const lines = textInput.split('\n');
    const lineHeight = fontSize * 1.2;

    // Always center vertically for professional look, consistent with signatures
    const startY = (canvas.height - (lines.length * lineHeight)) / 2 + (fontSize / 2);

    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
    });

    return canvas.toDataURL();
  };

  const drawStampPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas || !stampText) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const padding = 20;

    // Draw stamp shape
    ctx.strokeStyle = stampColor;
    ctx.lineWidth = 3;
    ctx.fillStyle = `${stampColor}20`;

    switch (stampShape) {
      case 'circle':
        const radius = Math.min(canvas.width, canvas.height) / 2 - padding;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'square':
        const squareSize = Math.min(canvas.width, canvas.height) - padding * 2;
        const squareX = centerX - squareSize / 2;
        const squareY = centerY - squareSize / 2;
        ctx.fillRect(squareX, squareY, squareSize, squareSize);
        ctx.strokeRect(squareX, squareY, squareSize, squareSize);
        break;

      case 'rectangular':
        const rectWidth = canvas.width - padding * 2;
        const rectHeight = canvas.height - padding * 2;
        const rectX = padding;
        const rectY = padding;
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        break;
    }

    // Draw stamp text
    ctx.fillStyle = stampColor;
    ctx.font = 'bold 24px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const lines = stampText.split('\n');
    const lineHeight = 28;
    const startY = centerY - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, centerX, startY + (index * lineHeight));
    });

    // Draw date if enabled
    if (showDateOnStamp) {
      const date = new Date().toLocaleDateString();
      ctx.font = '12px Arial';
      ctx.fillText(date, centerX, centerY + (lines.length * lineHeight) / 2 + 20);
    }

    // Draw "APPROVED" text around the stamp
    if (stampShape === 'circle') {
      const radius = Math.min(canvas.width, canvas.height) / 2 - padding + 15;
      const approvedText = "APPROVED";
      const angleStep = (2 * Math.PI) / approvedText.length;

      ctx.save();
      ctx.translate(centerX, centerY);
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
          imageData = canvasRef.current?.toDataURL();
        } else { // Upload tab
          imageData = uploadedImage;
        }

        if (imageData) {
          return {
            image: imageData,
            text: textInput
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

    if (fieldType === 'textbox' || fieldType === 'mail' || fieldType === 'date') {
      return !value.value || value.value.trim() === '';
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
      case 'date':
        // Value-based fields
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
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {fieldType === 'stamp' ? 'Design your stamp below' : `Draw your ${fieldType === 'initials' ? 'initials' : 'signature'} with mouse or touch`}
      </Typography>

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
        {fieldType === 'initials' ? 'Type your initials (1-3 letters)' : 'Type your signature'}
      </Typography>

      <TextField
        fullWidth
        multiline={fieldType !== 'initials'}
        rows={fieldType === 'initials' ? 1 : 2}
        value={textInput}
        onChange={(e) => {
          if (fieldType === 'initials') {
            // Only allow letters for initials, auto-uppercase
            const cleaned = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
            // Limit to 3 characters
            setTextInput(cleaned.substring(0, 3));
          } else {
            setTextInput(e.target.value);
          }
        }}
        placeholder={
          fieldType === 'initials'
            ? 'AB'  // Simple placeholder, no auto-fill
            : FIELD_CONFIG[fieldType]?.placeholder || 'Enter text...'
        }
        sx={{ mb: 2 }}
        inputProps={{
          maxLength: fieldType === 'initials' ? 3 : undefined,
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

      {/* Font Size & Style Controls - Hidden for standard text fields per user request */}
      {!['textbox', 'mail'].includes(fieldType) && (
        <Box sx={{ mb: 2 }}>
          {/* Font Style Selection Dropdown */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Font Style</FormLabel>
                <Select
                  value={selectedFontStyle}
                  onChange={(e) => {
                    setSelectedFontStyle(e.target.value);
                    // Set the first font of the selected style
                    const style = fontStyles.find(s => s.name === e.target.value);
                    if (style && style.fonts.length > 0) {
                      setFontFamily(style.fonts[0]);
                      setFontColor(style.color);
                    }
                  }}
                  size="small"
                >
                  {fontStyles.map(style => (
                    <MenuItem
                      key={style.name}
                      value={style.name}
                      sx={{
                        fontFamily: style.fonts[0],
                        color: style.color,
                        fontWeight: 'bold'
                      }}
                    >
                      {style.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Font Family</FormLabel>
                <Select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  size="small"
                  sx={{
                    fontFamily: `"${fontFamily}", cursive`,
                    '& .MuiSelect-select': {
                      fontFamily: `"${fontFamily}", cursive !important`,
                    }
                  }}
                >
                  {fontStyles.find(s => s.name === selectedFontStyle)?.fonts.map(font => (
                    <MenuItem
                      key={font}
                      value={font}
                      sx={{ fontFamily: `"${font}", cursive` }}
                    >
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Font Size</FormLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={() => setFontSize(Math.max(48, fontSize - 8))}>
                    <ZoomOutIcon />
                  </IconButton>
                  <TextField
                    type="number"
                    value={fontSize}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value);
                      if (val === '') {
                        setFontSize(''); // Allow clearing
                      } else if (!isNaN(val)) {
                        setFontSize(val);
                      }
                    }}
                    onBlur={() => {
                      // Enforce limits on blur
                      const val = parseInt(fontSize);
                      if (isNaN(val) || val < 12) setFontSize(12);
                      if (val > 400) setFontSize(400);
                    }}
                    size="small"
                    sx={{ width: 80 }}
                    inputProps={{ min: 12, max: 400 }}
                  />
                  <IconButton size="small" onClick={() => setFontSize(Math.min(400, (parseInt(fontSize) || 0) + 8))}>
                    <ZoomInIcon />
                  </IconButton>
                </Box>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Color</FormLabel>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {colors.map(color => (
                    <IconButton
                      key={color}
                      size="small"
                      onClick={() => setFontColor(color)}
                      sx={{
                        width: 28,
                        height: 28,
                        backgroundColor: color,
                        border: fontColor === color ? '2px solid #fff' : '1px solid #ccc',
                        boxShadow: fontColor === color ? '0 0 0 2px #1976d2' : 'none',
                        '&:hover': {
                          opacity: 0.9,
                        },
                      }}
                    >
                      {fontColor === color && <CheckIcon sx={{ color: '#fff', fontSize: 16 }} />}
                    </IconButton>
                  ))}
                </Box>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      )}

      <Box
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          p: 3,
          backgroundColor: '#fafafa',
          minHeight: (fieldType === 'textbox' || fieldType === 'mail') ? 100 : (fieldType === 'initials' ? 180 : 120),
          display: 'flex',
          alignItems: (fieldType === 'textbox' || fieldType === 'mail') && textInput ? 'flex-start' : 'center',
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
              fontFamily: (fieldType === 'initials' || fieldType === 'signature' || fieldType === 'witness_signature')
                ? `"${fontFamily}", cursive`
                : 'inherit',
              fontSize: fieldType === 'initials' ? `${(fontSize || 120) * 0.4}px` : `${(fontSize || 24) * 0.8}px`,
              color: fontColor || '#000000',
              textAlign: fieldType === 'textbox' ? 'left' : 'center',
              whiteSpace: 'pre-line',
              fontWeight: fieldType === 'initials' ? 'bold' : 'normal',
              textTransform: fieldType === 'initials' ? 'uppercase' : 'none',
              letterSpacing: fieldType === 'initials' ? (selectedFontStyle === 'handwriting' ? 'normal' : '8px') : 'normal',
              padding: '10px 20px',
              width: fieldType === 'textbox' ? `${fWidth}px` : 'auto',
              minHeight: fieldType === 'textbox' ? `${fHeight}px` : 'auto',
              maxWidth: '100%',
              overflow: 'visible',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              display: 'flex',
              alignItems: (fieldType === 'textbox' || fieldType === 'mail') && textInput ? 'flex-start' : 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {fieldType === 'initials' ? textInput.toUpperCase() : textInput}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {fieldType === 'initials' ? 'Your initials will appear here' : 'Preview will appear here'}
          </Typography>
        )}
      </Box>

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
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {attachmentFile.name}
              </Typography>
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
        onChange={(e) => setEmailInput(e.target.value)}
        placeholder="name@example.com"
        error={!emailValid && emailInput.length > 0}
        helperText={!emailValid && emailInput.length > 0 ? "Please enter a valid email address" : ""}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <MailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
      />

      <Box
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          p: 3,
          backgroundColor: '#fafafa',
          textAlign: 'center',
          mb: 2,
        }}
      >
        <MailIcon sx={{ fontSize: 48, color: emailValid ? '#1a73e8' : '#f44336', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {emailInput || 'No email entered'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {emailValid ? 'Valid email address' : 'Enter a valid email address'}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Your email address will be securely stored and displayed in the document.
      </Alert>
    </Box>
  );

  const renderDateTab = () => (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Select a date
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <DatePicker
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                sx={{ maxWidth: 300 }}
              />
            )}
          />
        </Box>

        <Box
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 3,
            backgroundColor: '#fafafa',
            textAlign: 'center',
            mb: 2,
          }}
        >
          <CalendarIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
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