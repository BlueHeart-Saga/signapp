// DocumentBuilder.jsx - Complete Rewrite with Role-Based Field Assignment

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCallback } from 'react';
import {
  Box, Container, Paper, Typography, Button, IconButton,
  TextField, Chip, Alert, Snackbar, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, Card, CardContent, Grid, Avatar,
  FormControlLabel, Checkbox, Fab, Toolbar, AppBar,
  List, ListItem, ListItemText, ListItemIcon,
  Slider, CircularProgress, MenuItem, Badge
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Create as SignatureIcon,
  HowToReg as WitnessIcon,
  PersonAdd as PersonAddIcon,
  VerifiedUser as VerifiedIcon,
  ShortText as ShortTextIcon,
  CalendarToday as CalendarIcon,
  SelectAll as SelectAllIcon,
  PersonSearch as PersonSearchIcon,
  DragIndicator as DragIndicatorIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  VisibilityOff as VisibilityOffIcon,
  Preview as PreviewIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckBox as CheckBoxIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  ArrowDropDownCircle as ArrowDropDownCircleIcon,
  AttachFile as AttachFileIcon,
  LocalOffer as StampIcon,
  Email as EmailIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import { GridView, Close, Fullscreen } from '@mui/icons-material';
import Switch from "@mui/material/Switch";
import CloseIcon from "@mui/icons-material/Close";

import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Document, Page } from 'react-pdf';
import { Stage, Layer, Rect, Text, Circle, Group, Line, Transformer } from 'react-konva';
import { useNavigate, useParams } from 'react-router-dom';
// In the imports section, add:
import { ArrowForward } from '@mui/icons-material';
import { FileText } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { pdfjs } from 'react-pdf';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { HistoryService } from '../services/historyService';
import { AutosaveService } from '../services/autosaveService';

import { setPageTitle } from "../utils/pageTitle";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;


// ============================================
// API Service Functions
// ============================================

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';


const BASE_WIDTH = 794;
const BASE_HEIGHT = 1123;



const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
};

// API functions matching backend
// API functions matching backend - FIXED
const documentAPI = {
  getDocument: (documentId) =>
    apiRequest(`/documents/${documentId}`),

  getRecipients: (documentId) =>
    apiRequest(`/recipients/${documentId}`),

  getFields: (documentId) =>
    apiRequest(`/documents/${documentId}/fields`),

  saveFields: (documentId, fields) =>
    // fetch(`${API_BASE_URL}/documents/${documentId}/fields`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   },
    //   body: JSON.stringify(fields)
    // }).then(response => {
    //   if (!response.ok) {
    //     return response.json().then(err => { throw new Error(err.detail || 'Failed to save fields'); });
    //   }
    //   return response.json();
    // }),

    apiRequest(`/documents/${documentId}/fields`),

  sendInvites: (documentId, data) =>
    apiRequest(`/recipients/${documentId}/send-invites`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBuilderPdfUrl: (id) =>
    `${API_BASE_URL}/documents/${id}/builder-pdf?token=${localStorage.getItem('token')}`,

  getOwnerPreviewUrl: (id) =>
    `${API_BASE_URL}/documents/${id}/owner-preview?token=${localStorage.getItem('token')}`,
};



// ============================================
// Role-Based Field Configuration
// ============================================

// Match backend ROLE_FIELD_RULES
const ROLE_FIELD_RULES = {
  signer: 'ALL',
  in_person_signer: ['signature', 'initials', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment', 'mail'],
  witness: ['witness_signature', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment', 'mail'],
  approver: ['approval', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment', 'mail'],
  form_filler: ['date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment', 'mail'],
  viewer: []
};

const UNIVERSAL_FIELDS = ['date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment', 'mail'];

// Color generation function matching backend
const generateRecipientColor = (email) => {
  if (!email) return '#808080';

  // Simple hash function matching backend logic
  const hash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const hashInt = hash(email);

  // Generate pastel colors (matching backend's HSL values)
  const hue = hashInt % 360;
  const saturation = 65 + (hashInt % 15); // 65-80%
  const lightness = 85 + (hashInt % 10);  // 85-95%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Helper function to get recipient color
const getRecipientColor = (recipient) => {
  if (!recipient) return '#808080'; // Default gray

  // If recipient has a direct color property, use it
  if (recipient.color) return recipient.color;

  // If recipient has an email, generate from it
  if (recipient.email) return generateRecipientColor(recipient.email);

  // If recipient has name but no email, generate from name
  if (recipient.name) return generateRecipientColor(recipient.name);

  // If recipient has role, use role-based color
  if (recipient.role && ROLE_BORDER_COLORS[recipient.role]) {
    return ROLE_BORDER_COLORS[recipient.role];
  }

  // Ultimate fallback
  return '#808080';
};



const FIELD_ROLES = {
  signer: {
    id: 'signer',
    name: 'Signer',
    icon: <SignatureIcon />,
    description: 'Must sign the document',
    allowedFields: ['signature', 'initials', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment']
  },
  approver: {
    id: 'approver',
    name: 'Approver',
    icon: <VerifiedIcon />,
    description: 'Approves the document',
    allowedFields: ['approval', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment']
  },
  form_filler: {
    id: 'form_filler',
    name: 'Form Filler',
    icon: <EditIcon />,
    description: 'Can fill form fields',
    allowedFields: ['textbox', 'date', 'checkbox', 'radio', 'dropdown', 'attachment']
  },
  witness: {
    id: 'witness',
    name: 'Witness',
    icon: <WitnessIcon />,
    description: 'Can witness signatures',
    allowedFields: ['witness_signature', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment']
  },
  in_person_signer: {
    id: 'in_person_signer',
    name: 'In-person Signer',
    icon: <PersonAddIcon />,
    description: 'Signs in person',
    allowedFields: ['signature', 'initials', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment']
  },
  viewer: {
    id: 'viewer',
    name: 'Viewer',
    icon: <VisibilityIcon />,
    description: 'Can only view',
    allowedFields: []
  }
};

// Helper function to get role color - now using recipient's color
const getRoleColor = (recipient, roleId) => {
  if (recipient && recipient.color) {
    return recipient.color;
  }

  // Fallback colors based on role
  const fallbackColors = {
    signer: '#2196F3',
    approver: '#009688',
    form_filler: '#4CAF50',
    witness: '#FF9800',
    in_person_signer: '#9C27B0',
    viewer: '#795548'
  };

  return fallbackColors[roleId] || '#0d9488';
};

// Updated color helpers for UI consistency
const ROLE_BG_COLORS = {
  signer: 'rgba(33, 150, 243, 0.05)',
  approver: 'rgba(0, 150, 136, 0.05)',
  form_filler: 'rgba(76, 175, 80, 0.05)',
  witness: 'rgba(255, 152, 0, 0.05)',
  in_person_signer: 'rgba(156, 39, 176, 0.05)',
  viewer: 'rgba(121, 85, 72, 0.05)'
};

const ROLE_BORDER_COLORS = {
  signer: '#2196F3',
  approver: '#009688',
  form_filler: '#4CAF50',
  witness: '#FF9800',
  in_person_signer: '#9C27B0',
  viewer: '#795548'
};

// Full updated FIELD_TYPES with all 12 fields
// Update your FIELD_TYPES configuration
const FIELD_TYPES = {
  signature: {
    label: 'Signature',
    icon: <SignatureIcon />,
    color: '#F44336',
    placeholder: 'Sign here',
    defaultWidth: 180,
    defaultHeight: 60,
    backendType: 'signature',
    allowedFor: ['signer', 'in_person_signer']
  },
  initials: {
    label: 'Initials',
    icon: <EditIcon />,
    color: '#2196F3',
    placeholder: 'Initials',
    defaultWidth: 70,
    defaultHeight: 32,
    backendType: 'initials',
    allowedFor: ['signer', 'in_person_signer']
  },
  date: {
    label: 'Date',
    icon: <CalendarIcon />,
    color: '#3F51B5',
    placeholder: 'MM/DD/YYYY',
    defaultWidth: 120,
    defaultHeight: 32,
    backendType: 'date',
    allowedFor: [] // Universal field
  },
  textbox: {
    label: 'Text Field',
    icon: <ShortTextIcon />,
    color: '#4CAF50',
    placeholder: 'Enter text...',
    defaultWidth: 160,
    defaultHeight: 32,
    backendType: 'textbox',
    allowedFor: [] // Universal field
  },
  checkbox: {
    label: 'Checkbox',
    icon: <CheckBoxIcon />,
    color: '#FF4081',
    placeholder: '□',
    defaultWidth: 24,
    defaultHeight: 24,
    backendType: 'checkbox',
    allowedFor: [] // Universal field
  },
  radio: {
    label: 'Radio',
    icon: <RadioButtonCheckedIcon />,
    color: '#9C27B0',
    placeholder: '○',
    defaultWidth: 24,
    defaultHeight: 24,
    backendType: 'radio',
    allowedFor: [] // Universal field
  },
  dropdown: {
    label: 'Dropdown',
    icon: <ArrowDropDownCircleIcon />,
    color: '#0097A7',
    placeholder: 'Select...',
    defaultWidth: 160,
    defaultHeight: 32,
    backendType: 'dropdown',
    allowedFor: [] // Universal field
  },
  attachment: {
    label: 'File',
    icon: <AttachFileIcon />,
    color: '#795548',
    placeholder: 'Attach file',
    defaultWidth: 140,
    defaultHeight: 32,
    backendType: 'attachment',
    allowedFor: [] // Universal field
  },
  approval: {
    label: 'Approval',
    icon: <VerifiedIcon />,
    color: '#9C27B0',
    placeholder: 'Approved',
    defaultWidth: 120,
    defaultHeight: 32,
    backendType: 'approval',
    allowedFor: ['approver']
  },
  witness_signature: {
    label: 'Witness Signature',
    icon: <WitnessIcon />,
    color: '#FF9800',
    placeholder: 'Witness signature',
    defaultWidth: 180,
    defaultHeight: 60,
    backendType: 'witness_signature',
    allowedFor: ['witness']
  },
  stamp: {
    label: 'Stamp',
    icon: <LocalOfferIcon />,
    color: '#D32F2F',
    placeholder: '[STAMP]',
    defaultWidth: 100,
    defaultHeight: 40,
    backendType: 'stamp',
    allowedFor: [] // Backend only
  },
  mail: {
    label: 'Email',
    icon: <EmailIcon />, // Add this import
    color: '#2196F3',
    placeholder: 'email@example.com',
    defaultWidth: 160,
    defaultHeight: 32,
    backendType: 'mail',
    allowedFor: [] // Universal field
  },

};

const PDF_DPI = 72;
const SCREEN_DPI = 96;
const DPI_RATIO = PDF_DPI / SCREEN_DPI;

// Add this helper function to convert coordinates
const convertScreenToPDF = (screenCoord, canvasWidth, pdfWidth) => {
  return (screenCoord / canvasWidth) * pdfWidth;
};

const convertPDFToScreen = (pdfCoord, pdfWidth, canvasWidth) => {
  return (pdfCoord / pdfWidth) * canvasWidth;
};

// ============================================
// Helper Functions
// ============================================

// Update the validateFieldAssignment function
const validateFieldAssignment = (fieldType, recipientRole) => {
  // Get the rules for this role
  const rules = ROLE_FIELD_RULES[recipientRole];

  // If rules is 'ALL', allow any field type
  if (rules === 'ALL') {
    return true;
  }

  // If rules is an array, check if field type is in the array
  if (Array.isArray(rules)) {
    return rules.includes(fieldType);
  }

  // For viewers or other roles with no rules
  return false;
};

// Also update the getAvailableFieldTypesForRole function
const getAvailableFieldTypesForRole = (role) => {
  return Object.entries(FIELD_TYPES)
    .filter(([type, config]) => {
      // Viewers get no fields
      if (role === 'viewer') return false;

      // Get role rules
      const rules = ROLE_FIELD_RULES[role];

      // If rules is 'ALL', include all field types
      if (rules === 'ALL') return true;

      // If rules is an array, check if field type is in the array
      if (Array.isArray(rules)) {
        return rules.includes(type);
      }

      return false;
    })
    .map(([type, config]) => ({ type, ...config }));
};
const normalizeFieldCoordinates = (field, canvasWidth = 794, canvasHeight = 1123) => {
  // Ensure field has valid coordinates and page number
  return {
    ...field,
    x: Math.max(0, field.x || 50),
    y: Math.max(0, field.y || 50),
    width: Math.max(30, field.width || FIELD_TYPES[field.type]?.defaultWidth || 100),
    height: Math.max(30, field.height || FIELD_TYPES[field.type]?.defaultHeight || 40),
    page: Math.max(0, field.page || 0), // Ensure page is non-negative
    // Store the original canvas dimensions for reference
    canvasWidth: field.canvasWidth || canvasWidth,
    canvasHeight: field.canvasHeight || canvasHeight
  };
};
// ============================================
// Canvas Field Component
// ============================================

const CanvasField = ({
  field,
  isSelected,
  onSelect,
  onDragEnd,
  onTransform,
  scale = 1,
  validationError = false,
  currentPage = 0,
  showAllFields = false,
  pageOffsetY = 0 // Add this prop
}) => {
  const shapeRef = useRef();
  const transformerRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const clickTimer = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const DRAG_THRESHOLD = 5; // pixels

  const handleClick = (e) => {
    // Prevent event bubbling
    e.cancelBubble = true;
    e.evt.preventDefault();

    // If we're dragging, don't register as click
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    // Clear any pending timer
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }

    // Direct select
    onSelect(field.id);
  };

  const handleDragStart = (e) => {
    e.cancelBubble = true;
    isDraggingRef.current = false;
    dragStartPos.current = {
      x: e.target.x(),
      y: e.target.y()
    };
  };

  const handleDragMove = (e) => {
    // If we start moving, set dragging flag
    const currentX = e.target.x();
    const currentY = e.target.y();

    const dx = currentX - dragStartPos.current.x;
    const dy = currentY - dragStartPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2) { // Small threshold to detect movement
      isDraggingRef.current = true;
    }
  };

  const handleDragEnd = (e) => {
    const newX = e.target.x();
    const newY = e.target.y();

    // Convert from Konva scale to real pixels
    const realX = newX / scale;
    const realY = newY / scale;

    // Constrain to canvas boundaries
    const canvasWidth = 794;  // Match your canvas
    const canvasHeight = 1123; // Match your canvas

    const constrainedX = Math.max(0, Math.min(realX, canvasWidth - field.width));
    const constrainedY = Math.max(0, Math.min(realY, canvasHeight - field.height));

    onDragEnd(field.id, Math.round(constrainedX), Math.round(constrainedY));
  };

  const handleTransformEnd = (e) => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    // Prevent negative dimensions and positions
    const newWidth = Math.max(30, node.width() * scaleX);
    const newHeight = Math.max(30, node.height() * scaleY);
    const newX = Math.max(0, node.x());
    const newY = Math.max(0, node.y());

    onTransform(field.id, {
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY
    });
  };

  const fieldType = FIELD_TYPES[field.type] || FIELD_TYPES.textbox;
  const borderColor = validationError ? '#FF0000' : (isSelected ? '#FF4081' : fieldType.color);

  const assignedRecipient = field.assignedRecipient || field.recipientInfo;
  const recipientRole = assignedRecipient?.role;
  const isValidAssignment = recipientRole ? validateFieldAssignment(field.type, recipientRole) : true;

  // Calculate opacity for fields on other pages
  const isOtherPage = field.page !== currentPage;
  // Calculate if field is on current page
  const isCurrentPage = field.page === currentPage;

  // Calculate opacity based on page
  const opacity = showAllFields && !isCurrentPage ? 0.3 : 1;

  // Add page offset to Y position when showing all pages
  const adjustedY = field.y * scale + pageOffsetY;

  // Add page indicator for fields on other pages
  const pageIndicator = showAllFields && isOtherPage ? (
    <Group x={field.width * scale - 30} y={-25 * scale}>
      <Circle
        x={0}
        y={0}
        radius={8}
        fill="#666"
        stroke="#FFFFFF"
        strokeWidth={1}
      />
      <Text
        x={0}
        y={0}
        text={`${field.page + 1}`}
        fontSize={8 * scale}
        fontFamily="Arial"
        fill="#FFFFFF"
        align="center"
        verticalAlign="middle"
      />
    </Group>
  ) : null;

  // Add boundary function to prevent dragging outside canvas
  const dragBoundFunc = useCallback((pos) => {
    // Field dimensions
    const fieldWidth = field.width * scale;
    const fieldHeight = field.height * scale;

    // Stage dimensions (passed from parent or use fixed values)
    const stageWidth = 794 * scale; // Use your canvas width
    const stageHeight = 1123 * scale; // Use your canvas height

    // Constrain to stage boundaries
    const constrainedX = Math.max(0, Math.min(pos.x, stageWidth - fieldWidth));
    const constrainedY = Math.max(0, Math.min(pos.y, stageHeight - fieldHeight));

    return {
      x: constrainedX,
      y: constrainedY
    };
  }, [field.width, field.height, scale]);

  // Update the CanvasField component renderFieldContent function
  const renderFieldContent = () => {
    // Get the field type configuration
    const fieldTypeConfig = FIELD_TYPES[field.type] || FIELD_TYPES.textbox;

    // Safely get recipient color
    const recipientColor = assignedRecipient ? getRecipientColor(assignedRecipient) : fieldTypeConfig.color;
    const borderColor = validationError ? '#FF0000' : (isSelected ? '#FF4081' : recipientColor || fieldTypeConfig.color);

    // Determine if field is for a specific recipient or generic
    const isAssignedToRecipient = Boolean(assignedRecipient);

    // Helper function to add alpha to hex colors using proper hex alpha values
    const addAlphaToHex = (hex, alphaHex) => {
      if (!hex) return '#80808080'; // Return default gray with 50% opacity

      // Remove # if present
      hex = hex.replace('#', '');

      // If hex is 3 characters, expand to 6
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }

      // Ensure hex is 6 characters
      if (hex.length !== 6) {
        hex = '808080'; // Default gray
      }

      // Return 8-character hex with alpha
      return `#${hex}${alphaHex}`;
    };

    // Helper to get fill color with opacity using hex alpha values
    const getFillColor = (baseColor, alphaHex, defaultColor) => {
      if (isAssignedToRecipient && baseColor) {
        return addAlphaToHex(baseColor, alphaHex);
      }
      return defaultColor;
    };

    switch (field.type) {
      case 'signature':
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '1A', '#F8F8F8')} // 1A = 10% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              dash={[4, 4]}
              cornerRadius={6}
            />
            {/* <Text
            x={(field.width * scale) / 2}
            y={(field.height * scale) / 2}
            text={assignedRecipient ? "SIGN" : "✍️"}
            fontSize={assignedRecipient ? 12 * scale : 18 * scale}
            align="center"
            verticalAlign="middle"
            fontStyle={assignedRecipient ? "bold" : "normal"}
            fill={isAssignedToRecipient ? recipientColor : '#000000'}
          /> */}
            {/* <Text
            x={(field.width * scale) / 2}
            y={(field.height * scale) - 15 * scale}
            text={assignedRecipient ? assignedRecipient.name.split(' ')[0] : "Sign here"}
            fontSize={10 * scale}
            fill={isAssignedToRecipient ? recipientColor : '#666666'}
            align="center"
          /> */}
          </Group>
        );

      case 'witness_signature':
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '26', '#FFF3E0')} // 26 = 15% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              dash={[4, 4]}
              cornerRadius={6}
            />
            {/* <Text
            x={(field.width * scale) / 2}
            y={(field.height * scale) / 2}
            text={isAssignedToRecipient ? "WITNESS" : "WITNESS"}
            fontSize={12 * scale}
            align="center"
            verticalAlign="middle"
            fontStyle="bold"
            fill={isAssignedToRecipient ? recipientColor : '#FF9800'}
          />
          {isAssignedToRecipient && (
            <Text
              x={(field.width * scale) / 2}
              y={(field.height * scale) - 15 * scale}
              text={`For: ${assignedRecipient.name.split(' ')[0]}`}
              fontSize={9 * scale}
              fill={recipientColor}
              align="center"
            />
          )} */}
          </Group>
        );

      case 'approval':
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '1A', '#F3E5F5')} // 1A = 10% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              dash={[2, 2]}
              cornerRadius={3}
            />
            {/* <Text
            x={(field.width * scale) / 2}
            y={(field.height * scale) / 2}
            text={isAssignedToRecipient ? "APPROVED" : "APPROVED"}
            fontSize={11 * scale}
            align="center"
            verticalAlign="middle"
            fontStyle="bold"
            fill={isAssignedToRecipient ? recipientColor : '#9C27B0'}
          />
          {isAssignedToRecipient && (
            <Text
              x={(field.width * scale) / 2}
              y={(field.height * scale) - 12 * scale}
              text={`By: ${assignedRecipient.name.split(' ')[0]}`}
              fontSize={8 * scale}
              fill={recipientColor}
              align="center"
            />
          )} */}
          </Group>
        );

      case 'initials':
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '1A', '#F0F8FF')} // 1A = 10% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              dash={[2, 2]}
              cornerRadius={3}
            />
            {/* <Text
            x={(field.width * scale) / 2}
            y={(field.height * scale) / 2}
            text={isAssignedToRecipient ? "INI" : "INI"}
            fontSize={11 * scale}
            align="center"
            verticalAlign="middle"
            fontStyle="bold"
            fill={isAssignedToRecipient ? recipientColor : '#2196F3'}
          /> */}
            {/* {isAssignedToRecipient && (
            <Text
              x={(field.width * scale) / 2}
              y={(field.height * scale) - 12 * scale}
              text={assignedRecipient.name.split(' ')[0]}
              fontSize={8 * scale}
              fill={recipientColor}
              align="center"
            />
          )} */}
          </Group>
        );

      case 'date':
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '14', '#FFFFFF')} // 14 = 8% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              cornerRadius={3}
            />
            {/* <Text
            x={8 * scale}
            y={(field.height * scale) / 2 - 6 * scale}
            text={isAssignedToRecipient ? `${assignedRecipient.name.split(' ')[0]}'s Date` : "MM/DD/YYYY"}
            fontSize={11 * scale}
            fontFamily="Arial"
            fill={isAssignedToRecipient ? recipientColor : '#888888'}
            width={(field.width - 16) * scale}
            align="left"
            verticalAlign="middle"
          /> */}
          </Group>
        );

      case 'checkbox':
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '14', '#FFFFFF')} // 14 = 8% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              cornerRadius={4}
            />
            {/* <Line
            points={[
              8 * scale, field.height * scale / 2,
              12 * scale, field.height * scale - 8 * scale,
              field.width * scale - 8 * scale, 8 * scale
            ]}
            stroke={isAssignedToRecipient ? recipientColor : fieldTypeConfig.color}
            strokeWidth={2}
            visible={field.value === true}
          /> */}
            {/* <Text
            x={field.width * scale + 8 * scale}
            y={field.height * scale / 2}
            text={isAssignedToRecipient ? `${assignedRecipient.name.split(' ')[0]}: ${field.label || "Checkbox"}` : field.label || "Checkbox"}
            fontSize={11 * scale}
            align="left"
            verticalAlign="middle"
            fill={isAssignedToRecipient ? recipientColor : '#333333'}
          /> */}
          </Group>
        );

      case 'radio':
        return (
          <Group>
            <Circle
              x={field.width * scale / 2}
              y={field.height * scale / 2}
              radius={field.width * scale / 2 - 2}
              fill={getFillColor(recipientColor, '14', '#FFFFFF')} // 14 = 8% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
            />
            {/* <Circle
            x={field.width * scale / 2}
            y={field.height * scale / 2}
            radius={field.width * scale / 4}
            fill={isAssignedToRecipient ? recipientColor : fieldTypeConfig.color}
            visible={field.value === true}
          /> */}
            {/* <Text
            x={field.width * scale + 8 * scale}
            y={field.height * scale / 2}
            text={isAssignedToRecipient ? `${assignedRecipient.name.split(' ')[0]}: ${field.label || "Radio"}` : field.label || "Radio"}
            fontSize={11 * scale}
            align="left"
            verticalAlign="middle"
            fill={isAssignedToRecipient ? recipientColor : '#333333'}
          /> */}
          </Group>
        );

      case 'dropdown':
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '14', '#FFFFFF')} // 14 = 8% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              cornerRadius={3}
            />
            {/* <Text
            x={8 * scale}
            y={field.height * scale / 2 - 6 * scale}
            text={isAssignedToRecipient ? `${assignedRecipient.name.split(' ')[0]}: Select...` : field.placeholder || "Select option..."}
            fontSize={11 * scale}
            fontFamily="Arial"
            fill={isAssignedToRecipient ? recipientColor : '#888888'}
            width={(field.width - 16) * scale}
            align="left"
            verticalAlign="middle"
          />
          <Line
            points={[
              field.width * scale - 24 * scale, 12 * scale,
              field.width * scale - 16 * scale, field.height * scale / 2,
              field.width * scale - 24 * scale, field.height * scale - 12 * scale
            ]}
            stroke={isAssignedToRecipient ? recipientColor : '#666666'}
            strokeWidth={1.5}
            fill={isAssignedToRecipient ? recipientColor : '#666666'}
          /> */}
          </Group>
        );

      case 'attachment':
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '1A', '#F5F5F5')} // 1A = 10% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              dash={[2, 2]}
              cornerRadius={6}
            />
            <Group x={16 * scale} y={8 * scale}>
              <Rect
                width={16 * scale}
                height={20 * scale}
                fill={getFillColor(recipientColor, '4D', '#E0E0E0')} // 4D = 30% opacity
                stroke={isAssignedToRecipient ? recipientColor : '#999999'}
                strokeWidth={1}
              />
              <Rect
                x={4 * scale}
                y={-4 * scale}
                width={8 * scale}
                height={4 * scale}
                fill={getFillColor(recipientColor, '4D', '#E0E0E0')} // 4D = 30% opacity
                stroke={isAssignedToRecipient ? recipientColor : '#999999'}
                strokeWidth={1}
              />
            </Group>
            {/* <Text
            x={40 * scale}
            y={field.height * scale / 2}
            text={isAssignedToRecipient ? `${assignedRecipient.name.split(' ')[0]} Upload` : "Upload File"}
            fontSize={11 * scale}
            align="left"
            verticalAlign="middle"
            fill={isAssignedToRecipient ? recipientColor : '#666666'}
          /> */}
          </Group>
        );

      case 'stamp':
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '26', 'rgba(255, 235, 238, 0.7)')} // 26 = 15% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              dash={[3, 3]}
              cornerRadius={8}
            />
            {/* <Text
            x={field.width * scale / 2}
            y={field.height * scale / 2}
            text={isAssignedToRecipient ? `${assignedRecipient.name.split(' ')[0]}'s Stamp` : "OFFICIAL STAMP"}
            fontSize={10 * scale}
            align="center"
            verticalAlign="middle"
            fontStyle="bold"
            fill={isAssignedToRecipient ? recipientColor : '#D32F2F'}
          /> */}
            {/* <Text
            x={field.width * scale / 2}
            y={field.height * scale / 2 + 16 * scale}
            text={isAssignedToRecipient ? "Approved" : "APPROVED"}
            fontSize={8 * scale}
            align="center"
            verticalAlign="middle"
            fontStyle={isAssignedToRecipient ? "normal" : "italic"}
            fill={isAssignedToRecipient ? recipientColor : '#666666'}
          /> */}
          </Group>
        );

      case 'mail':
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '14', '#FFFFFF')} // 14 = 8% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              cornerRadius={3}
            />
            {/* <Text
            x={8 * scale}
            y={(field.height * scale) / 2 - 6 * scale}
            text={isAssignedToRecipient ? `${assignedRecipient.name.split(' ')[0]}: Email` : "✉️ email@example.com"}
            fontSize={11 * scale}
            fontFamily="Arial"
            fill={isAssignedToRecipient ? recipientColor : '#888888'}
            width={(field.width - 16) * scale}
            align="left"
            verticalAlign="middle"
          /> */}
          </Group>
        );

      default: // textbox
        return (
          <Group>
            <Rect
              width={field.width * scale}
              height={field.height * scale}
              fill={getFillColor(recipientColor, '14', '#FFFFFF')} // 14 = 8% opacity
              stroke={validationError ? '#FF0000' : (isAssignedToRecipient ? recipientColor : fieldTypeConfig.color)}
              strokeWidth={validationError ? 2 : 1.5}
              cornerRadius={3}
            />
            {/* <Text
            x={8 * scale}
            y={(field.height * scale) / 2 - 6 * scale}
            text={isAssignedToRecipient ? 
              `${assignedRecipient.name.split(' ')[0]}: ${field.placeholder || fieldTypeConfig.placeholder}` : 
              field.placeholder || fieldTypeConfig.placeholder
            }
            fontSize={11 * scale}
            fontFamily="Arial"
            fill={isAssignedToRecipient ? recipientColor : '#888888'}
            width={(field.width - 16) * scale}
            align="left"
            verticalAlign="middle"
          /> */}
          </Group>
        );
    }
  };



  // Replace the borderColor calculation:
  const recipientColor = assignedRecipient ? getRecipientColor(assignedRecipient) : fieldType.color;


  return (
    <>
      <Group
        ref={shapeRef}
        x={Math.max(0, field.x * scale)}
        y={Math.max(0, adjustedY)} // Use adjusted Y position
        width={Math.max(30, field.width * scale)}
        height={Math.max(30, field.height * scale)}
        draggable={isCurrentPage || showAllFields}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={isCurrentPage || showAllFields ? handleDragEnd : undefined}
        onClick={handleClick}
        onTap={handleClick}
        onTransformEnd={isCurrentPage ? handleTransformEnd : undefined}
        opacity={opacity}
        dragBoundFunc={dragBoundFunc}
      >
        {/* Add page indicator for fields on other pages */}
        {showAllFields && !isCurrentPage && (
          <Group x={field.width * scale - 30} y={-25 * scale}>
            <Circle
              x={0}
              y={0}
              radius={8}
              fill="#666"
              stroke="#FFFFFF"
              strokeWidth={1}
            />
            <Text
              x={0}
              y={0}
              text={`${field.page + 1}`}
              fontSize={8 * scale}
              fontFamily="Arial"
              fill="#FFFFFF"
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )}
        {/* Add this to show which page the field is on */}
        {pageIndicator}

        {renderFieldContent()}

        {/* Field label with error indicator */}
        <Group>
          <Text
            x={5 * scale}
            y={-25 * scale}
            text={`${assignedRecipient ? assignedRecipient.name.split(' ')[0] + ': ' : ''}${field.label || field.name}${field.required ? ' *' : ''}${isOtherPage ? ` (Page ${field.page + 1})` : ''}`}
            fontSize={11 * scale}
            fontFamily="Arial"
            fill={validationError ? '#FF0000' : (isOtherPage ? '#888888' : (assignedRecipient ? recipientColor : '#666666'))}
            width={field.width * scale}
          />
          {validationError && (
            <Text
              x={5 * scale}
              y={-10 * scale}
              text={`Invalid for ${recipientRole}`}
              fontSize={9 * scale}
              fontFamily="Arial"
              fill="#FF0000"
            />
          )}
        </Group>

        {/* Recipient indicator */}
        {assignedRecipient && (
          <Group x={field.width * scale - 40} y={5 * scale}>
            <Circle
              x={0}
              y={0}
              radius={6}
              fill={getRecipientColor(assignedRecipient)}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            <Text
              x={12}
              y={6}
              text={assignedRecipient.name.charAt(0)}
              fontSize={9}
              fontFamily="Arial"
              fill="#FFFFFF"
              fontStyle="bold"
            />
          </Group>
        )}
      </Group>

      {/* Only show transformer for fields on current page in single-page view */}
      {isSelected && (showAllFields || isCurrentPage) && !validationError && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 30 || newBox.height < 30) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={false}
          keepRatio={false}
        />
      )}
    </>
  );
};

// ============================================
// Field Library - Redesigned with Top-Bottom Layout
// ============================================

const FieldLibrary = ({ onAddField, recipients = [], onSelectRecipient, selectedRecipientId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRoles, setExpandedRoles] = useState({});

  const handleDragStart = (e, fieldType) => {
    e.dataTransfer.setData('fieldType', fieldType);
    e.dataTransfer.effectAllowed = 'copy';
  };



  // Group recipients by role
  const recipientsByRole = useMemo(() => {
    const groups = {};
    recipients.forEach(recipient => {
      if (!groups[recipient.role]) {
        groups[recipient.role] = [];
      }
      groups[recipient.role].push(recipient);
    });

    // Sort roles by priority order
    const roleOrder = ['signer', 'in_person_signer', 'approver', 'form_filler', 'witness', 'viewer'];
    const sortedGroups = {};
    roleOrder.forEach(role => {
      if (groups[role]) {
        sortedGroups[role] = groups[role];
      }
    });

    // Add any remaining roles not in the order
    Object.keys(groups).forEach(role => {
      if (!sortedGroups[role]) {
        sortedGroups[role] = groups[role];
      }
    });

    return sortedGroups;
  }, [recipients]);

  // Filter recipients by search
  const filteredRecipients = useMemo(() => {
    if (!searchTerm) return recipients;

    return recipients.filter(recipient =>
      recipient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      FIELD_ROLES[recipient.role]?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipients, searchTerm]);

  // Get selected recipient


  // Get selected recipient color
  const selectedRecipient = useMemo(() => {
    return recipients.find(r => r.id === selectedRecipientId);
  }, [recipients, selectedRecipientId]);



  // Get available fields for selected recipient
  const availableFields = useMemo(() => {
    if (!selectedRecipient) {
      // If no recipient selected, show fields grouped by role
      const allFields = {};
      Object.keys(FIELD_ROLES).forEach(role => {
        const fieldsForRole = getAvailableFieldTypesForRole(role);
        if (fieldsForRole.length > 0) {
          allFields[role] = {
            roleInfo: FIELD_ROLES[role],
            fields: fieldsForRole
          };
        }
      });
      return allFields;
    }

    // If recipient selected, show only fields for that role
    return {
      [selectedRecipient.role]: {
        roleInfo: FIELD_ROLES[selectedRecipient.role],
        fields: getAvailableFieldTypesForRole(selectedRecipient.role)
      }
    };
  }, [selectedRecipient]);

  // Toggle role expansion
  const toggleRoleExpansion = (role) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  // Helper function to get recipient color
  const getRecipientColor = (recipient) => {
    return recipient?.color || '#808080'; // Default gray if no color
  };



  return (
    <Paper sx={{
      height: '100%',
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: '1px solid',
      borderColor: 'divider',
      // minWidth: 350 
    }}>
      {/* Header */}
      {/* <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: '1.1rem' }}>
          Field Library
        </Typography> */}

      {/* Search bar */}
      {/* <TextField
          fullWidth
          size="small"
          placeholder="Search recipients by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <PersonIcon sx={{ mr: 1, color: 'action.active', fontSize: 20 }} />
            ),
            sx: { 
              borderRadius: 2,
              backgroundColor: 'grey.50',
              '&:hover': {
                backgroundColor: 'grey.100'
              }
            }
          }}
          sx={{ mb: 2 }}
        /> */}

      {/* Selected recipient info */}
      {/* {selectedRecipient && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            p: 1.5,
            bgcolor: ROLE_BG_COLORS[selectedRecipient.role] || 'grey.50',
            borderRadius: 1.5,
            border: `2px solid ${ROLE_BORDER_COLORS[selectedRecipient.role] || '#6b7280'}`,
            position: 'relative',
            overflow: 'hidden'
          }}> */}
      {/* Decorative left border */}
      {/* <Box sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              bgcolor: ROLE_BORDER_COLORS[selectedRecipient.role] || '#6b7280'
            }} />
            
            <Avatar sx={{ 
              bgcolor: ROLE_BORDER_COLORS[selectedRecipient.role] || '#6b7280', 
              width: 36, 
              height: 36,
              fontSize: '1rem',
              fontWeight: 600,
              ml: 0.5
            }}>
              {selectedRecipient.name?.charAt(0) || 'R'}
            </Avatar>
            <Box sx={{ flex: 1, ml: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {selectedRecipient.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={FIELD_ROLES[selectedRecipient.role]?.name}
                  size="small"
                  sx={{ 
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    backgroundColor: `${ROLE_BORDER_COLORS[selectedRecipient.role]}20`,
                    color: ROLE_BORDER_COLORS[selectedRecipient.role],
                    borderColor: ROLE_BORDER_COLORS[selectedRecipient.role]
                  }}
                />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {selectedRecipient.email}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              size="small" 
              onClick={() => onSelectRecipient && onSelectRecipient(null)}
              sx={{ 
                p: 0.75,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )} */}

      {/* {!selectedRecipient && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            p: 1.5,
            bgcolor: 'grey.50',
            borderRadius: 1.5,
            border: '1px dashed',
            borderColor: 'divider'
          }}>
            <InfoIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
            <Typography variant="caption" color="text.secondary">
              Select a recipient to view available fields
            </Typography>
          </Box>
        )}
      </Box> */}

      {/* Main content area - Top-Bottom layout */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top section: All recipients list */}
        <Box sx={{
          flex: 1,
          minHeight: '40%',
          maxHeight: '60%',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Recipients header */}
          <Box sx={{
            p: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="subtitle2" fontWeight={600}>
              All Recipients ({filteredRecipients.length})
            </Typography>
            <Chip
              label={`${recipients.length} total`}
              size="small"
              variant="outlined"
              sx={{ height: 24, fontSize: '0.75rem' }}
            />
          </Box>

          {/* Grouped recipients list */}
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            // Hide scrollbar
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#e0e0e0',
              borderRadius: 3
            }
          }}>
            {Object.entries(recipientsByRole).map(([role, roleRecipients]) => {
              const roleInfo = FIELD_ROLES[role];
              const filtered = roleRecipients.filter(r =>
                filteredRecipients.some(fr => fr.id === r.id)
              );

              if (filtered.length === 0) return null;

              const isExpanded = expandedRoles[role] !== false; // Default to expanded

              return (
                <Box key={role} sx={{ mb: 2 }}>
                  {/* Role header with toggle */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: selectedRecipient && selectedRecipient.role === role ?
                        `${getRecipientColor(selectedRecipient)}10` :
                        (ROLE_BG_COLORS[role] || 'grey.50'),
                      borderLeft: `4px solid ${selectedRecipient && selectedRecipient.role === role ?
                        getRecipientColor(selectedRecipient) :
                        (ROLE_BORDER_COLORS[role] || '#6b7280')}`,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: selectedRecipient && selectedRecipient.role === role ?
                          `${getRecipientColor(selectedRecipient)}15` :
                          (ROLE_BG_COLORS[role] ? ROLE_BG_COLORS[role].replace('0.05', '0.08') : 'grey.100')
                      }
                    }}
                    onClick={() => toggleRoleExpansion(role)}
                  >
                    <Avatar sx={{
                      bgcolor: selectedRecipient && selectedRecipient.role === role ?
                        getRecipientColor(selectedRecipient) :
                        (ROLE_BORDER_COLORS[role] || '#6b7280'),
                      width: 28,
                      height: 28,
                      fontSize: '0.75rem'
                    }}>
                      {roleInfo?.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {roleInfo?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {filtered.length} recipient{filtered.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`${getAvailableFieldTypesForRole(role).length} fields`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: 'rgba(255,255,255,0.8)'
                        }}
                      />
                      {isExpanded ? (
                        <ArrowBackIcon sx={{
                          transform: 'rotate(-90deg)',
                          fontSize: 18,
                          color: 'text.secondary'
                        }} />
                      ) : (
                        <ArrowBackIcon sx={{
                          transform: 'rotate(90deg)',
                          fontSize: 18,
                          color: 'text.secondary'
                        }} />
                      )}
                    </Box>
                  </Box>

                  {/* Recipients in this role (collapsible) */}
                  {isExpanded && (
                    <Box sx={{ pl: 2 }}>
                      {filtered.map((recipient) => {
                        const isSelected = selectedRecipientId === recipient.id;
                        const fieldCount = 0; // You might want to calculate this

                        const recipientColor = getRecipientColor(recipient);
                        return (
                          <Box
                            key={recipient.id}
                            onClick={() => onSelectRecipient && onSelectRecipient(recipient.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: 1.5,
                              mb: 0.5,
                              borderRadius: 1,
                              width: '100%',
                              bgcolor: isSelected ?
                                `${recipientColor}15` : 'transparent', // Use recipient color with opacity
                              border: isSelected ?
                                `0.2px solid ${recipientColor}` : '0.1px solid transparent',
                              borderLeft: `3px solid ${isSelected ? recipientColor : 'transparent'}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              position: 'relative',
                              '&:hover': {
                                bgcolor: isSelected ?
                                  `${recipientColor}25` : 'grey.50',
                                transform: isSelected ? 'none' : 'translateX(2px)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                              }
                            }}
                          >
                            <Avatar sx={{
                              width: 32,
                              height: 32,
                              fontSize: '0.875rem',
                              bgcolor: getRecipientColor(recipient),
                              color: isSelected ? '#ffffff' : 'text.primary',
                              fontWeight: isSelected ? 600 : 400
                            }}>
                              {recipient.name?.charAt(0) || 'R'}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="body2"
                                fontWeight={isSelected ? 600 : 400}
                                noWrap
                              >
                                {recipient.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                sx={{
                                  fontSize: '0.75rem',
                                  opacity: isSelected ? 0.8 : 0.6
                                }}
                              >
                                {recipient.email}
                              </Typography>
                            </Box>
                            {fieldCount > 0 && (
                              <Chip
                                label={fieldCount}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  minWidth: 24,
                                  backgroundColor: `${getRecipientColor(recipient)}20`,  // 20% opacity of recipient color
                                  color: getRecipientColor(recipient),
                                  borderColor: getRecipientColor(recipient)
                                }}
                              />
                            )}
                            {isSelected && (
                              <CheckCircleIcon
                                sx={{
                                  fontSize: 18,
                                  color: getRecipientColor(recipient)
                                }}
                              />
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              );
            })}

            {filteredRecipients.length === 0 && (
              <Box sx={{
                textAlign: 'center',
                py: 6,
                color: 'text.secondary'
              }}>
                <PersonSearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                <Typography variant="body1" gutterBottom>
                  No recipients found
                </Typography>
                {searchTerm ? (
                  <Typography variant="caption">
                    No recipients match "{searchTerm}"
                  </Typography>
                ) : (
                  <Typography variant="caption">
                    Add recipients to get started
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Bottom section: Available fields */}
        {selectedRecipient && (
          <Box sx={{
            flex: 1,
            minHeight: '40%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Fields header */}
            <Box sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'grey.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {selectedRecipient ?
                    `Available Fields for ${selectedRecipient.name}` :
                    'Available Fields by Role'
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedRecipient ?
                    `Drag fields to assign to ${selectedRecipient.name}` :
                    'Select a recipient to assign fields'
                  }
                </Typography>
              </Box>
              {selectedRecipient && (
                <Chip
                  label={FIELD_ROLES[selectedRecipient.role]?.name}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: `${ROLE_BORDER_COLORS[selectedRecipient.role]}20`,
                    color: ROLE_BORDER_COLORS[selectedRecipient.role],
                    fontWeight: 600,
                    borderRadius: 1
                  }}
                />
              )}
            </Box>

            {/* Available fields content - Single column layout */}
            <Box sx={{
              flex: 1,
              overflow: 'auto',
              // Hide scrollbar for cleaner look
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {Object.keys(availableFields).length > 0 ? (
                <Box sx={{ p: 0 }}>
                  {Object.entries(availableFields).map(([role, { roleInfo, fields }]) => (
                    <Box key={role} sx={{ mb: 2 }}>
                      {/* Role header - only show when no recipient selected */}
                      {!selectedRecipient && (
                        <Box sx={{
                          p: 2,
                          bgcolor: 'background.paper',
                          borderBottom: 1,
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}>
                          <Avatar sx={{
                            bgcolor: ROLE_BORDER_COLORS[role] || '#6b7280',
                            width: 28,
                            height: 28,
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {roleInfo?.icon}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {roleInfo?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fields.length} field{fields.length !== 1 ? 's' : ''} available
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Fields list - single column */}
                      {/* // In the FieldLibrary component, update the fields rendering section: */}

                      {/* Fields list - compact 2 columns grid */}
                      <Box sx={{
                        p: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 1,
                        '@media (max-width: 1200px)': {
                          gridTemplateColumns: '1fr'
                        }
                      }}>
                        {fields.map((field) => {
                          // Get the selected recipient if available
                          const selectedRecipient = recipients.find(r => r.id === selectedRecipientId);
                          const recipientColor = selectedRecipient ? getRecipientColor(selectedRecipient) : field.color;

                          return (
                            <Card
                              key={field.type}
                              sx={{
                                cursor: 'grab',
                                border: 1,
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                                display: 'flex',
                                alignItems: 'center',
                                p: 1,
                                borderRadius: 1,
                                transition: 'all 0.2s',
                                minHeight: 40, // Even more compact
                                position: 'relative', // For pseudo-element
                                overflow: 'hidden', // To contain the left border
                                // NEW: Reduce icon size
                                '& .MuiAvatar-root': {
                                  // Reduced from 28
                                  fontSize: '0.65rem', // Reduced font size
                                  '& svg': {
                                    fontSize: '0.85rem', // Reduce icon size inside Avatar
                                  }
                                },

                                '&:hover': {
                                  bgcolor: selectedRecipient ? `${recipientColor}08` : `${field.color}08`,
                                  transform: 'translateY(-2px)',
                                  borderColor: selectedRecipient ? recipientColor : field.color,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                },
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: 3,
                                  bgcolor: selectedRecipient ? recipientColor : field.color,
                                  opacity: selectedRecipient ? 0.9 : 0.7
                                }
                              }}
                              draggable
                              onDragStart={(e) => handleDragStart(e, field.type)}
                            >
                              {/* Icon with recipient color */}
                              <Avatar sx={{
                                bgcolor: selectedRecipient ? recipientColor : field.color,
                                width: 25,
                                height: 25,
                                fontSize: '0.75rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                mr: 1,
                                transition: 'all 0.2s'
                              }}>
                                {field.icon}
                              </Avatar>

                              {/* Field info - compact */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    mb: 0.25,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: 'block',
                                    lineHeight: 1.2,
                                    color: selectedRecipient ? 'text.primary' : 'inherit'
                                  }}
                                >
                                  {field.label}
                                </Typography>
                              </Box>

                              {/* Drag icon with recipient color */}
                              <DragIndicatorIcon sx={{
                                color: selectedRecipient ? recipientColor : 'action.active',
                                fontSize: 14,
                                opacity: 0.7,
                                ml: 0.5
                              }} />
                            </Card>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                  px: 2,
                  textAlign: 'center'
                }}>
                  {selectedRecipient ? (
                    <>
                      <InfoIcon sx={{
                        fontSize: 48,
                        mb: 2,
                        color: 'action.disabled'
                      }} />
                      <Typography variant="body1" gutterBottom sx={{ mb: 1 }}>
                        No fields available for {selectedRecipient.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {FIELD_ROLES[selectedRecipient.role]?.description}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <SelectAllIcon sx={{
                        fontSize: 48,
                        mb: 2,
                        color: 'action.disabled'
                      }} />
                      <Typography variant="body1" gutterBottom sx={{ mb: 1 }}>
                        Select a recipient to view available fields
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 280 }}>
                        Fields are role-specific. Click on a recipient above to see what they can sign.
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}
        {/* Show message when no recipient is selected */}
        {!selectedRecipient && (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            textAlign: 'center',
            color: 'text.secondary',
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <SelectAllIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
            <Typography variant="body1" gutterBottom>
              Select a recipient to view available fields
            </Typography>
            <Typography variant="caption">
              Click on a recipient above to see what fields they can use
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};




// ============================================
// Field Properties Panel - Enhanced with Recipient Selection Matching Field Library
// ============================================

// ============================================
// Enhanced Field Properties Panel with Field-Specific Settings
// ============================================

const FieldPropertiesPanel = ({
  field,
  onChange,
  onDelete,
  recipients = [],
  numPages = 1,
  onDuplicate,
  selectedRecipientId,
  onSelectRecipient
}) => {
  const [localField, setLocalField] = useState(field || {});
  const [validationError, setValidationError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRoles, setExpandedRoles] = useState({});
  const [currentPage, setCurrentPage] = useState(field?.page || 0);

  // State for field-specific settings
  const [fieldSettings, setFieldSettings] = useState({
    // Radio button settings
    groupName: field?.group_name || `group_${Date.now()}`,

    // Dropdown settings
    dropdownOptions: field?.dropdown_options || [],
    newOption: '',

    // General settings
    placeholder: field?.placeholder || '',
    required: field?.required || false,
    label: field?.label || '',

    // Email validation (for mail fields)
    emailValidation: field?.email_validation || true,

    // Font size
    fontSize: field?.font_size || 12,

    // Checkbox/radio initial state
    checked: field?.checked || false
  });

  // Effect to initialize field-specific settings when field changes
  useEffect(() => {
    if (field) {
      // Update local field state
      const shouldUpdate =
        localField.recipient_id !== field.recipient_id ||
        localField.type !== field.type;

      if (shouldUpdate) {
        setLocalField({ ...field });
        validateAssignment(field.recipient_id, field.type);
      }

      // Initialize field-specific settings
      const settings = {
        groupName: field.group_name || `group_${Date.now()}`,
        dropdownOptions: field.dropdown_options || [],
        newOption: '',
        placeholder: field.placeholder || '',
        required: field.required || false,
        label: field.label || '',
        emailValidation: field.email_validation !== false,
        fontSize: field.font_size || 12,
        checked: field.checked || false
      };

      setFieldSettings(settings);

      // Auto-open right sidebar for radio/dropdown fields
      if (field.type === 'radio' || field.type === 'dropdown') {
        // You might want to trigger the parent's sidebar open here
        // This would require passing a callback from parent
      }
    }
  }, [field]);

  const validateAssignment = (recipientId, fieldType) => {
    if (!recipientId) {
      setValidationError('');
      return true;
    }

    const recipient = recipients.find(r => r.id === recipientId);
    if (!recipient) {
      setValidationError('Recipient not found');
      return false;
    }

    const isValid = validateFieldAssignment(fieldType, recipient.role);
    if (!isValid) {
      const allowedFields = (() => {
        const rules = ROLE_FIELD_RULES[recipient.role];
        if (rules === 'ALL') {
          return Object.keys(FIELD_TYPES);
        } else if (Array.isArray(rules)) {
          return rules;
        } else {
          return [];
        }
      })();
      const allowedNames = allowedFields.map(f => FIELD_TYPES[f]?.label).filter(Boolean);
      setValidationError(
        `${FIELD_ROLES[recipient.role]?.name} cannot have ${FIELD_TYPES[fieldType]?.label}. Allowed: ${allowedNames.join(', ')}`
      );
    } else {
      setValidationError('');
    }

    return isValid;
  };

  const handleChange = (key, value) => {
    const updated = { ...localField, [key]: value };
    setLocalField(updated);

    if (key === 'page') {
      const pageValue = parseInt(value);
      const boundedPage = Math.max(0, Math.min(pageValue, numPages - 1));
      updated.page = boundedPage;
      setCurrentPage(boundedPage);
    }

    if (key === 'recipient_id' || key === 'type') {
      validateAssignment(
        key === 'recipient_id' ? value : updated.recipient_id,
        key === 'type' ? value : updated.type
      );
    }

    if (onChange) {
      onChange(field.id, updated);
    }
  };

  // Handle field-specific setting changes
  const handleSettingChange = (setting, value) => {
    const newSettings = { ...fieldSettings, [setting]: value };
    setFieldSettings(newSettings);

    // Build the complete update object for the field
    const fieldUpdate = {};

    switch (setting) {
      case 'groupName':
        fieldUpdate.group_name = value;
        break;

      case 'dropdownOptions':
        fieldUpdate.dropdown_options = value;
        break;

      case 'placeholder':
        fieldUpdate.placeholder = value;
        break;

      case 'required':
        fieldUpdate.required = Boolean(value);
        break;

      case 'label':
        fieldUpdate.label = value;
        break;

      case 'emailValidation':
        fieldUpdate.email_validation = Boolean(value);
        break;

      case 'fontSize':
        fieldUpdate.font_size = Number(value);
        break;

      case 'checked':
        fieldUpdate.checked = Boolean(value);
        break;

      default:
        console.warn('Unknown setting:', setting);
        return; // or break
    }


    handleChange(Object.keys(fieldUpdate)[0], Object.values(fieldUpdate)[0]);
  };

  // Handle adding new dropdown option
  const handleAddDropdownOption = () => {
    if (fieldSettings.newOption.trim() === '') return;

    const newOptions = [...fieldSettings.dropdownOptions, fieldSettings.newOption.trim()];
    handleSettingChange('dropdownOptions', newOptions);
    handleSettingChange('newOption', '');
  };

  // Handle removing dropdown option
  const handleRemoveDropdownOption = (index) => {
    const newOptions = fieldSettings.dropdownOptions.filter((_, i) => i !== index);
    handleSettingChange('dropdownOptions', newOptions);
  };

  // Handle reordering dropdown options
  const handleReorderDropdownOption = (fromIndex, toIndex) => {
    const newOptions = [...fieldSettings.dropdownOptions];
    const [removed] = newOptions.splice(fromIndex, 1);
    newOptions.splice(toIndex, 0, removed);
    handleSettingChange('dropdownOptions', newOptions);
  };

  // Get filtered recipients
  const getFilteredRecipients = () => {
    if (!localField.type) return recipients;

    return recipients.filter(recipient =>
      validateFieldAssignment(localField.type, recipient.role)
    );
  };

  // Group recipients by role for display
  const recipientsByRole = useMemo(() => {
    const groups = {};
    const filtered = getFilteredRecipients();

    filtered.forEach(recipient => {
      if (!groups[recipient.role]) {
        groups[recipient.role] = [];
      }
      groups[recipient.role].push(recipient);
    });

    const roleOrder = ['signer', 'in_person_signer', 'approver', 'form_filler', 'witness', 'viewer'];
    const sortedGroups = {};
    roleOrder.forEach(role => {
      if (groups[role]) {
        sortedGroups[role] = groups[role];
      }
    });

    Object.keys(groups).forEach(role => {
      if (!sortedGroups[role]) {
        sortedGroups[role] = groups[role];
      }
    });

    return sortedGroups;
  }, [recipients, localField.type]);

  // Filter recipients by search
  const filteredRecipients = useMemo(() => {
    if (!searchTerm) return getFilteredRecipients();

    return getFilteredRecipients().filter(recipient =>
      recipient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      FIELD_ROLES[recipient.role]?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, localField.type]);

  // Toggle role expansion
  const toggleRoleExpansion = (role) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const handleSelectRecipientInPanel = (recipientId) => {
    handleChange('recipient_id', recipientId);

    if (onSelectRecipient) {
      onSelectRecipient(recipientId);
    }
  };

  const handleClearRecipient = () => {
    handleChange('recipient_id', null);
    if (onSelectRecipient) {
      onSelectRecipient(null);
    }
  };

  if (!field) {
    return (
      <Paper sx={{ height: '100%', borderRadius: 2, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <EditIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          Select a field to edit properties
        </Typography>
      </Paper>
    );
  }

  const fieldType = FIELD_TYPES[field.type] || FIELD_TYPES.textbox;
  const currentRecipient = recipients.find(r => r.id === localField.recipient_id);
  const isValid = !validationError;

  return (
    <Paper sx={{
      height: '100%',
      borderRadius: 2,
      overflow: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      }
    }}>
      <Box sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar sx={{ bgcolor: fieldType.color, width: 32, height: 32 }}>
            {fieldType.icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {field.label || field.name || fieldType.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fieldType.label}
            </Typography>
          </Box>
          {!isValid && (
            <Tooltip title={validationError}>
              <ErrorIcon sx={{ color: '#FF0000' }} />
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Validation Alert */}
        {!isValid && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            icon={<ErrorIcon />}
          >
            {validationError}
          </Alert>
        )}

        {/* Field Label */}
        <TextField
          fullWidth
          size="small"
          label="Field Label"
          value={fieldSettings.label}
          onChange={(e) => handleSettingChange('label', e.target.value)}
          sx={{ mb: 2 }}
          placeholder="Enter field label..."
        />

        {/* Field-Specific Settings Section */}
        {(field.type === 'radio' || field.type === 'dropdown' ||
          field.type === 'mail' || field.type === 'checkbox') && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: fieldType.color
              }}>
                <SettingsIcon fontSize="small" />
                {fieldType.label} Settings
              </Typography>

              {/* Radio Button Settings */}
              {field.type === 'radio' && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Group Name"
                    value={fieldSettings.groupName}
                    onChange={(e) => handleSettingChange('groupName', e.target.value)}
                    helperText="Radio buttons with the same group name will be mutually exclusive"
                    sx={{ mb: 1.5 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={fieldSettings.checked}
                        onChange={(e) => handleSettingChange('checked', e.target.checked)}
                      />
                    }
                    label="Initially checked"
                    sx={{ mb: 1 }}
                  />
                  <Alert severity="info" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                    Tip: Give all radio buttons in a group the same Group Name
                  </Alert>
                </Box>
              )}

              {/* Dropdown Settings */}
              {field.type === 'dropdown' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Dropdown Options
                  </Typography>

                  {/* Add new option */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add new option..."
                      value={fieldSettings.newOption}
                      onChange={(e) => handleSettingChange('newOption', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddDropdownOption()}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleAddDropdownOption}
                      disabled={!fieldSettings.newOption.trim()}
                    >
                      Add
                    </Button>
                  </Box>

                  {/* Options list */}
                  {fieldSettings.dropdownOptions.length > 0 ? (
                    <Paper variant="outlined" sx={{ maxHeight: 150, overflow: 'auto', mb: 1.5 }}>
                      <List dense>
                        {fieldSettings.dropdownOptions.map((option, index) => (
                          <ListItem
                            key={index}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleRemoveDropdownOption(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            }
                            sx={{
                              py: 0.5,
                              borderBottom: index < fieldSettings.dropdownOptions.length - 1 ? 1 : 0,
                              borderColor: 'divider'
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <DragIndicatorIcon sx={{ color: 'action.active' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2">
                                  {option}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  ) : (
                    <Alert severity="warning" sx={{ mb: 1.5 }}>
                      No options added. Add at least one option.
                    </Alert>
                  )}

                  {/* Options count */}
                  <Typography variant="caption" color="text.secondary">
                    {fieldSettings.dropdownOptions.length} option(s)
                  </Typography>
                </Box>
              )}

              {/* Mail Field Settings */}
              {field.type === 'mail' && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Placeholder Email"
                    value={fieldSettings.placeholder}
                    onChange={(e) => handleSettingChange('placeholder', e.target.value)}
                    placeholder="example@domain.com"
                    sx={{ mb: 1.5 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={fieldSettings.emailValidation}
                        onChange={(e) => handleSettingChange('emailValidation', e.target.checked)}
                      />
                    }
                    label="Validate email format"
                  />
                </Box>
              )}

              {/* Checkbox Settings */}
              {field.type === 'checkbox' && (
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={fieldSettings.checked}
                        onChange={(e) => handleSettingChange('checked', e.target.checked)}
                      />
                    }
                    label="Initially checked"
                  />
                </Box>
              )}

              {/* Text Field Settings */}
              {(field.type === 'textbox' || field.type === 'date') && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Placeholder Text"
                    value={fieldSettings.placeholder}
                    onChange={(e) => handleSettingChange('placeholder', e.target.value)}
                    placeholder={field.type === 'date' ? "MM/DD/YYYY" : "Enter text..."}
                    sx={{ mb: 1.5 }}
                  />
                </Box>
              )}

              {/* Font Size for all text-based fields */}
              {(field.type === 'textbox' || field.type === 'date' ||
                field.type === 'mail' || field.type === 'dropdown') && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Font Size
                    </Typography>
                    <Slider
                      size="small"
                      value={fieldSettings.fontSize}
                      onChange={(_, value) => handleSettingChange('fontSize', value)}
                      min={8}
                      max={24}
                      step={1}
                      marks={[
                        { value: 8, label: '8' },
                        { value: 12, label: '12' },
                        { value: 16, label: '16' },
                        { value: 20, label: '20' },
                        { value: 24, label: '24' }
                      ]}
                      valueLabelDisplay="auto"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                )}
            </Box>
          )}

        {/* Assign to Recipient Section */}
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Assign to Recipient
        </Typography>

        {/* Current Recipient Display (if assigned) */}
        {currentRecipient && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            mb: 2,
            bgcolor: `${getRecipientColor(currentRecipient)}10`,
            borderRadius: 1.5,
            border: `1px solid ${getRecipientColor(currentRecipient)}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              bgcolor: getRecipientColor(currentRecipient)
            }} />

            <Avatar sx={{
              bgcolor: getRecipientColor(currentRecipient),
              width: 36,
              height: 36,
              fontSize: '1rem',
              fontWeight: 600,
              ml: 0.5
            }}>
              {currentRecipient.name?.charAt(0) || 'R'}
            </Avatar>
            <Box sx={{ flex: 1, ml: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {currentRecipient.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={FIELD_ROLES[currentRecipient.role]?.name}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    backgroundColor: `${getRecipientColor(currentRecipient)}20`,
                    color: getRecipientColor(currentRecipient),
                    borderColor: getRecipientColor(currentRecipient)
                  }}
                />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {currentRecipient.email}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={handleClearRecipient}
              sx={{
                p: 0.75,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Recipient Search and Selection */}
        {!currentRecipient && (
          <>
            <TextField
              fullWidth
              size="small"
              placeholder="Search compatible recipients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <PersonIcon sx={{ mr: 1, color: 'action.active', fontSize: 20 }} />
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: 'grey.50',
                  '&:hover': {
                    backgroundColor: 'grey.100'
                  },
                  mb: 2
                }
              }}
            />

            {/* Compatible Recipients List */}
            <Box sx={{
              maxHeight: 200,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              p: 1,
              mb: 2,
              bgcolor: 'background.paper'
            }}>
              {Object.keys(recipientsByRole).length > 0 ? (
                Object.entries(recipientsByRole).map(([role, roleRecipients]) => {
                  const roleInfo = FIELD_ROLES[role];
                  const filtered = roleRecipients.filter(r =>
                    filteredRecipients.some(fr => fr.id === r.id)
                  );

                  if (filtered.length === 0) return null;

                  const isExpanded = expandedRoles[role] !== false;

                  return (
                    <Box key={role} sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: ROLE_BG_COLORS[role] || 'grey.50',
                          borderLeft: `4px solid ${ROLE_BORDER_COLORS[role] || '#6b7280'}`,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: ROLE_BG_COLORS[role] ?
                              ROLE_BG_COLORS[role].replace('0.05', '0.08') :
                              'grey.100'
                          }
                        }}
                        onClick={() => toggleRoleExpansion(role)}
                      >
                        <Avatar sx={{
                          bgcolor: ROLE_BORDER_COLORS[role] || '#6b7280',
                          width: 24,
                          height: 24,
                          fontSize: '0.75rem'
                        }}>
                          {roleInfo?.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {roleInfo?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {filtered.length} recipient{filtered.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        {isExpanded ? (
                          <ArrowBackIcon sx={{
                            transform: 'rotate(-90deg)',
                            fontSize: 18,
                            color: 'text.secondary'
                          }} />
                        ) : (
                          <ArrowBackIcon sx={{
                            transform: 'rotate(90deg)',
                            fontSize: 18,
                            color: 'text.secondary'
                          }} />
                        )}
                      </Box>

                      {isExpanded && (
                        <Box sx={{ pl: 1 }}>
                          {filtered.map((recipient) => {
                            const isSelected = localField.recipient_id === recipient.id;
                            const recipientColor = getRecipientColor(recipient);

                            return (
                              <Box
                                key={recipient.id}
                                onClick={() => handleSelectRecipientInPanel(recipient.id)}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  p: 1.5,
                                  mb: 0.5,
                                  borderRadius: 1,
                                  bgcolor: isSelected ? `${recipientColor}10` : 'transparent',
                                  borderLeft: `3px solid ${isSelected ? recipientColor : 'transparent'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  position: 'relative',
                                  '&:hover': {
                                    bgcolor: isSelected ? `${recipientColor}20` : 'grey.50',
                                    transform: 'translateX(2px)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                  }
                                }}
                              >
                                <Avatar sx={{
                                  width: 32,
                                  height: 32,
                                  fontSize: '0.875rem',
                                  bgcolor: recipientColor,
                                  color: '#ffffff',
                                  fontWeight: isSelected ? 600 : 400
                                }}>
                                  {recipient.name?.charAt(0) || 'R'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="body2"
                                    fontWeight={isSelected ? 600 : 400}
                                    noWrap
                                  >
                                    {recipient.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                    sx={{
                                      fontSize: '0.75rem',
                                      opacity: isSelected ? 0.8 : 0.6
                                    }}
                                  >
                                    {recipient.email}
                                  </Typography>
                                </Box>
                                {isSelected && (
                                  <CheckCircleIcon
                                    sx={{
                                      fontSize: 18,
                                      color: recipientColor
                                    }}
                                  />
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  );
                })
              ) : (
                <Box sx={{
                  textAlign: 'center',
                  py: 3,
                  color: 'text.secondary'
                }}>
                  <PersonSearchIcon sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2">
                    No compatible recipients found
                  </Typography>
                  <Typography variant="caption">
                    This field type is not compatible with any recipients' roles
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Compatibility Info */}
            <Alert
              severity="info"
              icon={<InfoIcon />}
              sx={{ mb: 2 }}
            >
              <Typography variant="caption">
                This {fieldType.label.toLowerCase()} field is compatible with:{' '}
                {(FIELD_TYPES[field.type]?.allowedFor || []).map(role =>
                  FIELD_ROLES[role]?.name
                ).filter(Boolean).join(', ') || 'all roles'}
              </Typography>
            </Alert>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Layout Properties */}
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Position & Size
        </Typography>

        <Grid container spacing={1}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="X Position"
              value={localField.x || 0}
              onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Y Position"
              value={localField.y || 0}
              onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Width"
              value={localField.width || fieldType.defaultWidth}
              onChange={(e) => handleChange('width', parseInt(e.target.value) || fieldType.defaultWidth)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Height"
              value={localField.height || fieldType.defaultHeight}
              onChange={(e) => handleChange('height', parseInt(e.target.value) || fieldType.defaultHeight)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              size="small"
              label="Page"
              value={currentPage}
              onChange={(e) => {
                const newPage = parseInt(e.target.value);
                setCurrentPage(newPage);
                handleChange('page', newPage);
              }}
            >
              {Array.from({ length: numPages }, (_, i) => (
                <MenuItem key={i} value={i}>
                  Page {i + 1}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Required Field Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={fieldSettings.required}
              onChange={(e) => handleSettingChange('required', e.target.checked)}
            />
          }
          label="Required Field"
          sx={{ mb: 2 }}
        />

        {/* Action Buttons */}
        <Box sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => onDelete && onDelete(field.id)}
          >
            Delete Field
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => onDuplicate && onDuplicate(field.id)}
            sx={{ mt: 1 }}
          >
            Duplicate Field
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

// ============================================
// Recipients Panel with Field Statistics
// ============================================

const RecipientsPanel = ({ recipients = [], fields = [], onAddRecipientClick }) => {
  const getRecipientStats = (recipientId) => {
    const assignedFields = fields.filter(f => f.recipient_id === recipientId);
    const validFields = assignedFields.filter(f => {
      const recipient = recipients.find(r => r.id === recipientId);
      return recipient ? validateFieldAssignment(f.type, recipient.role) : false;
    });

    return {
      total: assignedFields.length,
      valid: validFields.length,
      invalid: assignedFields.length - validFields.length
    };
  };

  if (!recipients || recipients.length === 0) {
    return (
      <Paper sx={{ height: '100%', borderRadius: 2, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <PersonIcon sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary" gutterBottom>
          No recipients assigned
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={onAddRecipientClick}
          sx={{ mt: 1 }}
        >
          Add First Recipient
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Recipients ({recipients.length})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Drag compatible fields to recipients
          </Typography>
        </Box>
        {/* <IconButton 
          size="small" 
          
          disabled={document?.status === 'sent'}
          onClick={onAddRecipientClick}
          title="Add Recipient"
        >
          <PersonAddIcon fontSize="small" />
        </IconButton> */}
      </Box>

      <Box sx={{
        flex: 1, overflow: 'auto', p: 2, scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE and Edge
        '&::-webkit-scrollbar': {
          display: 'none',
        }
      }}>
        <List dense>
          {recipients.map((recipient) => {
            const roleInfo = FIELD_ROLES[recipient.role];
            const stats = getRecipientStats(recipient.id);
            const hasInvalid = stats.invalid > 0;

            return (
              <Card
                key={recipient.id}
                variant="outlined"
                sx={{
                  mb: 1,
                  borderColor: hasInvalid ? '#FF000040' : 'divider'
                }}
              >
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{
                      bgcolor: getRecipientColor(recipient),
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem'
                    }}>
                      {recipient.name?.charAt(0) || 'R'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">
                        {recipient.name || `Recipient`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {recipient.email}
                      </Typography>
                    </Box>
                    <Chip
                      label={roleInfo?.name}
                      size="small"
                      sx={{
                        backgroundColor: `${getRecipientColor(recipient)}20`,
                        color: getRecipientColor(recipient),
                        height: 20,
                        fontSize: '0.65rem'
                      }}
                    />
                  </Box>

                  {/* Field Stats */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: 1
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Badge
                        badgeContent={stats.total}
                        color={hasInvalid ? "error" : "primary"}
                        showZero
                      >
                        <Typography variant="caption" color="text.secondary">
                          Fields
                        </Typography>
                      </Badge>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {hasInvalid && (
                        <Tooltip title={`${stats.invalid} incompatible fields`}>
                          <ErrorIcon sx={{ fontSize: 14, color: '#FF0000' }} />
                        </Tooltip>
                      )}
                      {stats.valid > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {stats.valid} valid
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Allowed Fields */}
                  {/* Allowed Fields */}
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Allowed: {(() => {
                        const rules = ROLE_FIELD_RULES[recipient.role];
                        if (rules === 'ALL') {
                          return 'All field types';
                        } else if (Array.isArray(rules)) {
                          return rules.map(f => FIELD_TYPES[f]?.label).filter(Boolean).join(', ') || 'None';
                        } else {
                          return 'None';
                        }
                      })()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
};

// ============================================
// Validation Summary Component
// ============================================

const ValidationSummary = ({ fields, recipients }) => {
  const invalidFields = fields.filter(field => {
    if (!field.recipient_id) return false;
    const recipient = recipients.find(r => r.id === field.recipient_id);
    if (!recipient) return false;
    return !validateFieldAssignment(field.type, recipient.role);
  });

  const unassignedFields = fields.filter(field => !field.recipient_id);

  if (invalidFields.length === 0 && unassignedFields.length === 0) {
    return null;
  }

  return (
    <Alert
      severity={invalidFields.length > 0 ? "error" : "warning"}
      sx={{ mb: 2 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Validation Issues
          </Typography>
          <Typography variant="body2">
            {invalidFields.length > 0 && (
              <>
                {invalidFields.length} incompatible field assignment{invalidFields.length > 1 ? 's' : ''}
                {unassignedFields.length > 0 ? ' • ' : ''}
              </>
            )}
            {unassignedFields.length > 0 && (
              <>{unassignedFields.length} unassigned field{unassignedFields.length > 1 ? 's' : ''}</>
            )}
          </Typography>
        </Box>
        <Box>
          {invalidFields.length > 0 && (
            <Chip
              label={`${invalidFields.length} invalid`}
              color="error"
              size="small"
              sx={{ mr: 1 }}
            />
          )}
          {unassignedFields.length > 0 && (
            <Chip
              label={`${unassignedFields.length} unassigned`}
              color="warning"
              size="small"
            />
          )}
        </Box>
      </Box>
    </Alert>
  );
};

// ============================================
// Add Recipient Dialog Component
// ============================================

const AddRecipientDialog = ({
  open,
  onClose,
  onAddRecipient,
  existingRecipients = [],
  documentId
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);

  const [recipientForm, setRecipientForm] = useState({
    name: '',
    email: '',
    signing_order: 1,
    role: 'signer',
    form_fields: [],
    witness_for: ''
  });

  // Load roles on mount
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const roles = [
        { id: 'signer', name: 'Signer', description: 'Must sign the document' },
        { id: 'approver', name: 'Approver', description: 'Approves the document' },
        { id: 'form_filler', name: 'Form Filler', description: 'Can fill form fields' },
        { id: 'witness', name: 'Witness', description: 'Can witness signatures' },
        { id: 'in_person_signer', name: 'In-person Signer', description: 'Signs in person' },
        { id: 'viewer', name: 'Viewer', description: 'Can only view' }
      ];
      setAvailableRoles(roles);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!recipientForm.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!recipientForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(recipientForm.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (existingRecipients.some(r => r.email.toLowerCase() === recipientForm.email.toLowerCase())) {
      newErrors.email = 'This email is already added as a recipient';
    }

    if (recipientForm.role === 'witness' && !recipientForm.witness_for) {
      newErrors.witness_for = 'Please select a signer to witness';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecipientForm(prev => ({
      ...prev,
      [name]: name === 'signing_order' ? parseInt(value) || 1 : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const recipientData = {
        name: recipientForm.name.trim(),
        email: recipientForm.email.trim(),
        signing_order: recipientForm.signing_order,
        role: recipientForm.role,
        form_fields: recipientForm.form_fields,
        witness_for: recipientForm.witness_for || null
      };

      await onAddRecipient(recipientData);

      setRecipientForm({
        name: '',
        email: '',
        signing_order: existingRecipients.length + 1,
        role: 'signer',
        form_fields: [],
        witness_for: ''
      });
      setErrors({});

      onClose();

    } catch (error) {
      console.error('Error adding recipient:', error);
      setErrors({ submit: error.message || 'Failed to add recipient' });
    } finally {
      setLoading(false);
    }
  };

  const getSigners = () => {
    return existingRecipients.filter(r =>
      r.role === 'signer' || r.role === 'in_person_signer'
    );
  };

  const signers = getSigners();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon />
          Add New Recipient
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {/* Error Alert */}
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.submit}
            </Alert>
          )}

          {/* Basic Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
              Basic Information
            </Typography>

            {/* Name Field */}
            <Box sx={{ mb: 2.5 }}>
              <TextField
                fullWidth
                label="Full Name *"
                name="name"
                value={recipientForm.name}
                onChange={handleInputChange}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="John Doe"
                disabled={loading}
                size="medium"
              />
            </Box>

            {/* Email Field */}
            <Box sx={{ mb: 2.5 }}>
              <TextField
                fullWidth
                label="Email Address *"
                name="email"
                type="email"
                value={recipientForm.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                placeholder="john.doe@example.com"
                disabled={loading}
                size="medium"
              />
            </Box>
          </Box>

          {/* Role & Settings Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
              Role & Settings
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
              {/* Role Selection */}
              <Box sx={{ flex: 1 }}>
                <TextField
                  select
                  fullWidth
                  label="Role *"
                  name="role"
                  value={recipientForm.role}
                  onChange={handleInputChange}
                  disabled={loading}
                  size="medium"
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* <Avatar sx={{ 
                          width: 24, 
                          height: 24,
                          bgcolor: FIELD_ROLES[role.id]?.color || '#666',
                          fontSize: '0.75rem'
                        }}>
                          {FIELD_ROLES[role.id]?.icon || <PersonIcon />}
                        </Avatar> */}
                        <Box>
                          <Typography variant="body2">{role.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Signing Order */}
              <Box sx={{ width: 140 }}>
                <TextField
                  fullWidth
                  label="Order"
                  name="signing_order"
                  type="number"
                  value={recipientForm.signing_order}
                  onChange={handleInputChange}
                  disabled={loading}
                  inputProps={{ min: 1, max: 100 }}
                  helperText="Signing order"
                  size="medium"
                />
              </Box>
            </Box>
          </Box>

          {/* Role-Specific Fields */}
          {recipientForm.role === 'witness' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                Witness Assignment
              </Typography>

              <Box sx={{ mb: 2.5 }}>
                <TextField
                  select
                  fullWidth
                  label="Witness For *"
                  name="witness_for"
                  value={recipientForm.witness_for}
                  onChange={handleInputChange}
                  error={!!errors.witness_for}
                  helperText={errors.witness_for || "Select which signer this witness will observe"}
                  disabled={loading || signers.length === 0}
                  size="medium"
                >
                  <MenuItem value="">
                    <em>Select a signer to witness</em>
                  </MenuItem>
                  {signers.map((signer) => (
                    <MenuItem key={signer.id} value={signer.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{
                          width: 24,
                          height: 24,
                          bgcolor: getRecipientColor(signer),
                          fontSize: '0.75rem'
                        }}>
                          {signer.name?.charAt(0) || 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{signer.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {signer.email}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                {signers.length === 0 && (
                  <Alert severity="info" sx={{ mt: 1.5 }}>
                    <Typography variant="body2">
                      No signers available. Add a signer first to assign a witness.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Box>
          )}

          {recipientForm.role === 'form_filler' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                Form Field Permissions
              </Typography>

              <Box sx={{ mb: 2.5 }}>
                <TextField
                  fullWidth
                  label="Form Fields (Optional)"
                  name="form_fields"
                  value={recipientForm.form_fields.join(', ')}
                  onChange={(e) => setRecipientForm(prev => ({
                    ...prev,
                    form_fields: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                  }))}
                  placeholder="name, address, phone number"
                  disabled={loading}
                  helperText="Specify which form fields this person can fill (separate with commas)"
                  multiline
                  rows={2}
                  size="medium"
                />
              </Box>
            </Box>
          )}

          {/* Permissions Summary */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 1.5 }}>
              Role Permissions
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <InfoIcon sx={{ color: 'primary.main', mt: 0.25 }} />
                <Box>
                  <Typography variant="body2" fontWeight={500} gutterBottom>
                    {FIELD_ROLES[recipientForm.role]?.name || 'Recipient'} Permissions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {availableRoles.find(r => r.id === recipientForm.role)?.description}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                    {(() => {
                      const rules = ROLE_FIELD_RULES[recipientForm.role];
                      let allowedFields = [];

                      if (rules === 'ALL') {
                        allowedFields = Object.values(FIELD_TYPES).slice(0, 6);
                      } else if (Array.isArray(rules)) {
                        allowedFields = rules
                          .map(f => FIELD_TYPES[f])
                          .filter(Boolean)
                          .slice(0, 6);
                      }

                      return allowedFields.map((field, index) => (
                        <Chip
                          key={index}
                          label={field.label}
                          size="small"
                          sx={{
                            backgroundColor: `${field.color}15`,
                            color: field.color,
                            borderColor: `${field.color}30`,
                            fontSize: '0.75rem',
                            height: 28
                          }}
                        />
                      ));
                    })()}

                    {(() => {
                      const rules = ROLE_FIELD_RULES[recipientForm.role];
                      if (rules === 'ALL') {
                        return (
                          <Chip
                            label="+ All field types"
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem', height: 28 }}
                          />
                        );
                      }
                      return null;
                    })()}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            // disabled={loading}
            disabled={loading || document?.status === 'sent'}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{ minWidth: 140 }}
          >
            {loading ? 'Adding...' : 'Add Recipient'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
// ============================================
// Preview Dialog Component
// ============================================

const PreviewDialog = ({ open, onClose, documentId }) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open && documentId) {
      loadPreview();
    }
  }, [open, documentId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError('');

      // Get the preview URL
      const previewUrl = documentAPI.getOwnerPreviewUrl(documentId);
      setPdfUrl(previewUrl);

      // You can add additional API calls here if needed

    } catch (err) {
      console.error('Error loading preview:', err);
      setError('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, numPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={false}
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
          width: '90vw',
          maxWidth: '90vw'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Document Preview
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, position: 'relative', backgroundColor: '#f5f5f5' }}>
        {loading ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '70vh'
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '70vh',
            textAlign: 'center'
          }}>
            <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={loadPreview}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <>
            {/* Preview Controls */}
            <Paper
              elevation={1}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1
              }}
            >
              <Tooltip title="Zoom Out">
                <IconButton
                  size="small"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </Typography>

              <Tooltip title="Zoom In">
                <IconButton
                  size="small"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem />

              <Tooltip title="Reset Zoom">
                <IconButton size="small" onClick={handleResetZoom}>
                  <PreviewIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {numPages > 1 && (
                <>
                  <Divider orientation="vertical" flexItem />
                  <Tooltip title="Previous Page">
                    <IconButton
                      size="small"
                      onClick={handlePrevPage}
                      disabled={currentPage <= 1}
                    >
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Typography variant="body2">
                    Page {currentPage} of {numPages}
                  </Typography>

                  <Tooltip title="Next Page">
                    <IconButton
                      size="small"
                      onClick={handleNextPage}
                      disabled={currentPage >= numPages}
                    >
                      <ArrowForward fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Paper>

            {/* PDF Viewer */}
            {pdfUrl && (
              <Document file={pdfUrl}>
                <Box>
                  {Array.from({ length: numPages }).map((_, i) => (
                    <Page key={`page-${i}`} pageNumber={i + 1} />
                  ))}
                </Box>
              </Document>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
        >
          Continue Editing
        </Button>
      </DialogActions>
    </Dialog>
  );
};


// Success Dialog Component
// Success Dialog Component with Professional Tick Animation
const SuccessDialog = ({
  open,
  onClose,
  onNavigateToDashboard,
  onNavigateToDocuments,
  documentName = '',
  recipientCount = 0
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        timeout: { enter: 300, exit: 200 }
      }}
    >
      <DialogContent sx={{
        p: 4,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {/* Enhanced Success Icon with Animation */}
        <Box sx={{
          position: 'relative',
          width: 100,
          height: 100,
          mb: 4,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: 'success.light',
            opacity: 0.3,
            animation: 'pulse 1.5s ease-out infinite'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 0,
            height: 0,
            borderRadius: '50%',
            backgroundColor: 'success.light',
            animation: 'expand 0.6s ease-out forwards',
            animationDelay: '0.1s'
          }
        }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              top: '8%',
              margin: 'auto',
              borderRadius: '50%',
              bgcolor: 'success.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 2,
              animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)',
              '& svg': {
                animation: 'checkmarkDraw 0.8s ease-out forwards',
                animationDelay: '0.3s',
                strokeDasharray: 50,
                strokeDashoffset: 50,
                transformOrigin: 'center'
              }
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 48,
                color: 'rgb(218 233 219)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
            />
          </Box>

          {/* Additional sparkle effect */}
          <Box sx={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: 'white',
            opacity: 0,
            animation: 'sparkle 1s ease-out forwards',
            animationDelay: '0.6s',
            boxShadow: '0 0 8px white',
            zIndex: 3
          }} />
        </Box>

        {/* Success Title with fade-in animation */}
        <Box sx={{ animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.4s' }}>
          <Typography
            variant="h5"
            gutterBottom
            fontWeight={600}
            sx={{
              opacity: 0,
              transform: 'translateY(20px)',
              animation: 'fadeInUp 0.5s ease-out forwards',
              animationDelay: '0.4s'
            }}
          >
            Invites Sent Successfully!
          </Typography>
        </Box>

        {/* Success Message */}
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{
            opacity: 0,
            transform: 'translateY(20px)',
            animation: 'fadeInUp 0.5s ease-out forwards',
            animationDelay: '0.5s'
          }}
        >
          Your document has been sent to {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} for signing.
        </Typography>

        {documentName && (
          <Chip
            label={documentName}
            variant="outlined"
            sx={{
              mb: 2,
              opacity: 0,
              transform: 'scale(0.8)',
              animation: 'scaleIn 0.4s ease-out forwards',
              animationDelay: '0.6s'
            }}
          />
        )}

        {/* Stats Summary */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            width: '100%',
            opacity: 0,
            transform: 'translateY(20px)',
            animation: 'fadeInUp 0.5s ease-out forwards',
            animationDelay: '0.7s'
          }}
        >
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Recipients
              </Typography>
              <Typography variant="h6" color="primary">
                {recipientCount}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleIcon fontSize="small" color="success" />
                <Typography variant="h6" color="success.main">
                  Sent
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Next Steps Info */}
        <Alert
          severity="info"
          icon={<InfoIcon />}
          sx={{
            mb: 3,
            width: '100%',
            opacity: 0,
            animation: 'fadeIn 0.5s ease-out forwards',
            animationDelay: '0.9s'
          }}
        >
          <Typography variant="body2">
            Recipients will receive email notifications to sign the document.
            You can track progress from the dashboard.
          </Typography>
        </Alert>

        {/* Define animations */}
        <style jsx global>{`
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(0.8);
              opacity: 0.5;
            }
            70% {
              transform: translate(-50%, -50%) scale(1.1);
              opacity: 0.3;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.3;
            }
          }
          
          @keyframes expand {
            0% {
              width: 0;
              height: 0;
              opacity: 0.8;
            }
            100% {
              width: 120px;
              height: 120px;
              opacity: 0;
            }
          }
          
          @keyframes scaleIn {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            70% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes checkmarkDraw {
            0% {
              stroke-dashoffset: 50;
              transform: scale(0.8);
            }
            70% {
              stroke-dashoffset: 0;
              transform: scale(1.1);
            }
            100% {
              stroke-dashoffset: 0;
              transform: scale(1);
            }
          }
          
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
          
          @keyframes sparkle {
            0% {
              opacity: 0;
              transform: scale(0);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
            100% {
              opacity: 0;
              transform: scale(0);
            }
          }
        `}</style>
      </DialogContent>

      <DialogActions sx={{
        p: 3,
        pt: 0,
        justifyContent: 'center',
        gap: 2,
        '& > *': {
          opacity: 0,
          animation: 'fadeIn 0.5s ease-out forwards'
        },
        '& > *:nth-of-type(1)': { animationDelay: '1s' },
        '& > *:nth-of-type(2)': { animationDelay: '1.1s' },
        '& > *:nth-of-type(3)': { animationDelay: '1.2s' }
      }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ minWidth: 120 }}
        >
          Stay Here
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={onNavigateToDashboard}
          startIcon={<VerifiedIcon />}
          sx={{ minWidth: 150 }}
        >
          Go to Dashboard
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={onNavigateToDocuments}
          startIcon={<VisibilityIcon />}
          sx={{ minWidth: 150 }}
        >
          My Documents
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================
// AutoSaveIndicator Component (new)
// ============================================

const AutoSaveIndicator = ({
  enabled,
  onToggle,
  status = {},
  onForceSave
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Toggle Button */}
      <Tooltip title={enabled ? "Auto-save enabled" : "Auto-save disabled"}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              color="success"
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              Auto-save
            </Typography>
          }
          sx={{ m: 0, mr: 1 }}
        />
      </Tooltip>

      {/* Status Indicator */}
      {enabled && (
        <>
          {status.isSaving ? (
            <Tooltip title="Auto-saving...">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={12} />
                <Typography variant="caption" color="text.secondary">
                  Saving...
                </Typography>
              </Box>
            </Tooltip>
          ) : status.lastSaved ? (
            <Tooltip title={`Last saved: ${new Date(status.lastSaved).toLocaleTimeString()}`}>
              <Chip
                label="Saved"
                size="small"
                color="success"
                variant="outlined"
                icon={<CheckCircleIcon fontSize="small" />}
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Tooltip>
          ) : null}

          {status.hasUnsavedChanges && !status.isSaving && (
            <Tooltip title="Unsaved changes">
              <Chip
                label="Unsaved"
                size="small"
                color="warning"
                variant="outlined"
                icon={<ErrorIcon fontSize="small" />}
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Tooltip>
          )}

          {/* Force Save Button */}
          {status.hasUnsavedChanges && (
            <Tooltip title="Save now">
              <IconButton
                size="small"
                onClick={onForceSave}
                disabled={status.isSaving}
                sx={{
                  p: 0.5,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      )}
    </Box>
  );
};

// ============================================
// Main Document Builder Component
// ============================================

const DocumentBuilder = () => {
  const navigate = useNavigate();
  const { documentId } = useParams();

  const [document, setDocument] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0.8);
  const [showGrid, setShowGrid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState(1);
  const [addRecipientDialogOpen, setAddRecipientDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false);
  // const [showAllPages, setShowAllPages] = useState(false);
  // const pdfUrl = documentAPI.getBuilderPdfUrl(documentId);
  // const [pdfUrl, setPdfUrl] = useState('');
  // const [pdfVersion, setPdfVersion] = useState(0);

  // Add rename states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');

  // Use useMemo for pdfUrl to prevent unnecessary changes
  // Generate pdfUrl with version for cache busting
  //  const getPdfUrl = useCallback(() => {
  //   if (!documentId) return '';
  //   const baseUrl = documentAPI.getBuilderPdfUrl(documentId);
  //   return `${baseUrl}&timestamp=${Date.now()}`;
  // }, [documentId]);


  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  // Add these new state variables:
  const [historyService] = useState(() => new HistoryService(100)); // 100 history states
  const [autosaveService, setAutosaveService] = useState(null);
  const [undoRedoInfo, setUndoRedoInfo] = useState({ canUndo: false, canRedo: false });
  const [autoSaveStatus, setAutoSaveStatus] = useState({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false
  });
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [saveVersion, setSaveVersion] = useState(0);


  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);


  useEffect(() => {
    setPageTitle(
      "Edit Document",
      "Edit and prepare your document for signing using SafeSign’s builder."
    );
  }, []);

  // Add this useEffect in your DocumentBuilder component
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.ctrlKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            setCurrentPage(prev => Math.max(0, prev - 1));
            break;
          case 'ArrowRight':
            e.preventDefault();
            setCurrentPage(prev => Math.min(numPages - 1, prev + 1));
            break;
          case 'Home':
            e.preventDefault();
            setCurrentPage(0);
            break;
          case 'End':
            e.preventDefault();
            setCurrentPage(numPages - 1);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  useEffect(() => {
    if (selectedFieldId) {
      const selectedField = fields.find(f => f.id === selectedFieldId);
      if (selectedField && (selectedField.type === 'radio' || selectedField.type === 'dropdown')) {
        setRightSidebarExpanded(true);
      }
    }
  }, [selectedFieldId, fields]);

  // Simple Page Navigation Component
  const PageNavigation = ({
    currentPage,
    numPages,
    onPageChange,
    onToggleAllPages,
    showAllPages
  }) => (
    <Paper
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 1.5,
        gap: 2,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 2,
        width: 'fit-content',
        mx: 'auto',
        mb: 2
      }}
    >
      {/* All Pages Toggle */}
      <Tooltip title={showAllPages ? "Show single page" : "Show all pages"}>
        <IconButton
          size="small"
          onClick={onToggleAllPages}
          color={showAllPages ? "primary" : "default"}
        >
          {showAllPages ? <GridView /> : <Fullscreen />}
        </IconButton>
      </Tooltip>
      {/* <IconButton 
  onClick={() => setShowAllPages(!showAllPages)}
  color={showAllPages ? "primary" : "default"}
>
  {showAllPages ? <GridView /> : <Fullscreen />}
</IconButton> */}

      {/* Page Navigation */}
      {!showAllPages && (
        <>
          <Tooltip title="First page">
            <IconButton
              size="small"
              onClick={() => onPageChange(0)}
              disabled={currentPage === 0}
            >
              <ChevronLeftIcon />
              <ChevronLeftIcon sx={{ ml: -1 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Previous page">
            <IconButton
              size="small"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2
          }}>
            <TextField
              select
              size="small"
              value={currentPage}
              onChange={(e) => onPageChange(parseInt(e.target.value))}
              sx={{
                width: 80,
                '& .MuiSelect-select': { py: 0.75 }
              }}
            >
              {Array.from({ length: numPages }, (_, i) => (
                <MenuItem key={i} value={i}>
                  Page {i + 1}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" color="text.secondary">
              of {numPages}
            </Typography>
          </Box>

          <Tooltip title="Next page">
            <IconButton
              size="small"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= numPages - 1}
            >
              <ArrowForward />
            </IconButton>
          </Tooltip>

          <Tooltip title="Last page">
            <IconButton
              size="small"
              onClick={() => onPageChange(numPages - 1)}
              disabled={currentPage >= numPages - 1}
            >
              <ArrowForward />
              <ArrowForward sx={{ ml: -1 }} />
            </IconButton>
          </Tooltip>
        </>
      )}

      {/* Page Info */}
      <Chip
        label={`${numPages} page${numPages !== 1 ? 's' : ''}`}
        size="small"
        variant="outlined"
        color="primary"
      />
    </Paper>
  );

  // Add rename function
  const handleRenameDocument = async () => {
    if (!newDocumentName.trim() || !documentId) {
      showSnackbar('Please enter a valid document name', 'error');
      return;
    }

    try {
      setRenaming(true);

      // Add .pdf extension if not present
      const filename = newDocumentName.trim().endsWith('.pdf')
        ? newDocumentName.trim()
        : `${newDocumentName.trim()}.pdf`;

      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ filename })
      });

      if (!response.ok) {
        throw new Error('Failed to rename document');
      }

      // Update local document state
      setDocument(prev => prev ? { ...prev, filename } : null);

      // Close dialog and show success
      setRenameDialogOpen(false);
      setNewDocumentName('');
      showSnackbar('Document renamed successfully!', 'success');

    } catch (error) {
      console.error('Error renaming document:', error);
      showSnackbar('Failed to rename document', 'error');
    } finally {
      setRenaming(false);
    }
  };

  // Initialize newDocumentName when document loads
  useEffect(() => {
    if (document) {
      // Remove .pdf extension for editing
      const displayName = document.filename?.replace(/\.pdf$/i, '') || 'Untitled';
      setNewDocumentName(displayName);
    }
  }, [document]);


  // Replace the existing handleSelectRecipient with this:
  const handleSelectRecipient = (recipientId) => {
    setSelectedRecipientId(recipientId);

    // If there's a selected field, update its recipient too
    if (selectedFieldId) {
      const selectedField = fields.find(f => f.id === selectedFieldId);
      if (selectedField) {
        // Check if the field type is compatible with the selected recipient
        const recipient = recipients.find(r => r.id === recipientId);
        if (recipient && validateFieldAssignment(selectedField.type, recipient.role)) {
          handleFieldChange(selectedFieldId, { recipient_id: recipientId });
        } else if (!recipientId) {
          // Clear recipient if null/undefined
          handleFieldChange(selectedFieldId, { recipient_id: null });
        }
      }
    }
  };




  // Toggle function
  const toggleRightSidebar = () => {
    setRightSidebarExpanded(!rightSidebarExpanded);
  };

  // Debug counter
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`DocumentBuilder rendered ${renderCount.current} times`);
  });

  // Fetch document data - ADD showSnackbar dependency
  useEffect(() => {
    // Update the fetchDocumentData function
    // Update the fetchDocumentData function
    const fetchDocumentData = async () => {
      try {
        setLoading(true);

        if (!documentId) {
          throw new Error('No document ID provided');
        }

        // Fetch all data in parallel if possible
        const [docData, recipientsData, fieldsData] = await Promise.all([
          documentAPI.getDocument(documentId),
          documentAPI.getRecipients(documentId),
          documentAPI.getFields(documentId)
        ]);

        // Single state update
        setDocument(docData);
        setNumPages(docData.page_count || 1);
        setRecipients(recipientsData);

        // Process fields once
        const fieldsWithRecipientInfo = fieldsData.map(field => {
          const recipient = recipientsData.find(r => r.id === field.recipient_id);

          return {
            id: field.id,
            name: `field_${field.type}_${field.id}`,
            type: field.type,
            label: field.label || field.type.charAt(0).toUpperCase() + field.type.slice(1),
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            page: field.page || 0,
            required: field.required || false,
            recipient_id: field.recipient_id,
            recipientInfo: recipient,
            assignedRecipient: recipient
          };
        });

        setFields(fieldsWithRecipientInfo);

      } catch (error) {
        console.error('Error fetching document data:', error);
        showSnackbar(`Failed to load document: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [documentId, showSnackbar]);

  // Manual save with versioning - UPDATED
  const handleSaveFields = async () => {
    // -------------------- GUARDS --------------------
    if (!documentId) {
      showSnackbar('No document selected', 'error');
      return;
    }

    if (saving) return;

    try {
      setSaving(true);
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));

      // -------------------- PDF & CANVAS CONSTANTS --------------------
      // PDF page size (Letter: points)
      const PDF_PAGE_WIDTH = 612;   // 8.5 * 72
      const PDF_PAGE_HEIGHT = 792;  // 11 * 72

      // Frontend canvas size
      const CANVAS_WIDTH = 794;
      const CANVAS_HEIGHT = 1123;

      // Scale ratios: Canvas → PDF
      const scaleX = PDF_PAGE_WIDTH / CANVAS_WIDTH;
      const scaleY = PDF_PAGE_HEIGHT / CANVAS_HEIGHT;

      // -------------------- BUILD PAYLOAD --------------------
      const payload = fields.map(field => {
        // Ensure backend page index (0-based)
        const backendPage = Math.max(
          0,
          Math.min(field.page ?? 0, (numPages ?? 1) - 1)
        );

        console.log(
          `Saving field: type=${field.type}, page=${backendPage} (0-indexed)`
        );

        // Stored canvas dimensions (fallback to defaults)
        const fieldPageWidth = field.pageWidth ?? CANVAS_WIDTH;
        const fieldPageHeight = field.pageHeight ?? CANVAS_HEIGHT;

        // Scale if field was created on a different canvas size
        const xScale = CANVAS_WIDTH / fieldPageWidth;
        const yScale = CANVAS_HEIGHT / fieldPageHeight;

        // Normalize canvas coordinates
        const normalizedX = (field.x ?? 50) * xScale;
        const normalizedY = (field.y ?? 50) * yScale;
        const normalizedWidth = (field.width ?? 100) * xScale;
        const normalizedHeight = (field.height ?? 40) * yScale;

        // Convert to PDF coordinates
        const pdfX = normalizedX * scaleX;
        const pdfY =
          normalizedY * scaleY + backendPage * PDF_PAGE_HEIGHT;
        const pdfWidth = normalizedWidth * scaleX;
        const pdfHeight = normalizedHeight * scaleY;

        // -------------------- BASE FIELD PAYLOAD --------------------
        const basePayload = {
          id: field.isNew ? undefined : field.id,
          page: backendPage,

          // Canvas coordinates
          x: normalizedX,
          y: normalizedY,
          width: normalizedWidth,
          height: normalizedHeight,

          // PDF coordinates
          pdf_x: pdfX,
          pdf_y: pdfY,
          pdf_width: pdfWidth,
          pdf_height: pdfHeight,

          // Reference dimensions
          page_width: PDF_PAGE_WIDTH,
          page_height: PDF_PAGE_HEIGHT,
          canvas_width: CANVAS_WIDTH,
          canvas_height: CANVAS_HEIGHT,

          // Common field properties
          type: field.type,
          recipient_id: field.recipient_id ?? null,
          required: Boolean(field.required),
          label: field.label ?? '',
          placeholder: field.placeholder ?? ''
        };

        // -------------------- TYPE-SPECIFIC EXTENSIONS --------------------
        if (field.type === 'dropdown') {
          basePayload.dropdown_options =
            field.dropdown_options?.length
              ? field.dropdown_options
              : ['Option 1', 'Option 2', 'Option 3'];
        }

        if (field.type === 'radio') {
          basePayload.group_name =
            field.group_name ?? `group_${Date.now()}`;
        }

        if (field.type === 'mail') {
          basePayload.email_validation =
            field.email_validation !== false;
        }

        if (field.type === 'checkbox') {
          basePayload.checked = Boolean(field.checked);
        }

        return basePayload;
      });

      console.log(
        'Saving fields with page info:',
        payload.map(f => ({
          page: f.page,
          type: f.type,
          pdf_y: f.pdf_y,
          page_height: f.page_height
        }))
      );

      // -------------------- API CALL --------------------
      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/fields`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save fields');
      }

      const result = await response.json();

      // -------------------- SYNC BACKEND → FRONTEND --------------------
      const updatedFields = fields.map(field => {
        const matched = result.fields?.find(sf => {
          const pageMatch = sf.page === (field.page ?? 0);
          const typeMatch = sf.type === field.type;
          const positionMatch =
            Math.abs(sf.x - (field.x ?? 0)) < 20 &&
            Math.abs(sf.y - (field.y ?? 0)) < 20;

          return pageMatch && typeMatch && positionMatch;
        });

        return {
          ...field,
          isNew: false,
          id: matched?.id ?? field.id,
          x: matched?.x ?? field.x,
          y: matched?.y ?? field.y,
          page: matched?.page ?? field.page
        };
      });

      setFields(updatedFields);
      historyService.push(updatedFields);
      updateUndoRedoInfo();

      setAutoSaveStatus({
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false
      });

      showSnackbar(
        `Saved ${result.count} fields across ${new Set(updatedFields.map(f => f.page)).size
        } pages`,
        'success'
      );

      console.log('📤 Final saved fields:');
      updatedFields.forEach((f, i) => {
        console.log(`Field ${i}: page=${f.page}, type=${f.type}`);
      });

      return result;
    } catch (err) {
      console.error('Error saving fields:', err);

      if (err.message?.includes('locked')) {
        showSnackbar(
          'Document is locked. Fields cannot be modified after sending.',
          'error'
        );
        setDocument(prev =>
          prev ? { ...prev, status: 'sent' } : null
        );
      } else {
        showSnackbar(err.message || 'Failed to save fields', 'error');
      }

      throw err;
    } finally {
      setSaving(false);
    }
  };



  // Memoize expensive calculations
  const getFieldValidationError = useCallback(
    (field) => {
      if (!field || !field.recipient_id) return false;
      if (!Array.isArray(recipients)) return false;

      const recipient = recipients.find(r => r.id === field.recipient_id);
      if (!recipient) return true;

      return !validateFieldAssignment(field.type, recipient.role);
    },
    [recipients]
  );


  // Add this effect to your DocumentBuilder component
  useEffect(() => {
    // Check for fields with unreasonable sizes
    const hasInvalidSizes = fields.some(field => {
      const defaultWidth = FIELD_TYPES[field.type]?.defaultWidth || 100;
      const defaultHeight = FIELD_TYPES[field.type]?.defaultHeight || 40;

      return field.width > defaultWidth * 5 || field.height > defaultHeight * 5;
    });

    if (hasInvalidSizes) {
      // Reset oversized fields
      const correctedFields = fields.map(field => {
        const defaultWidth = FIELD_TYPES[field.type]?.defaultWidth || 100;
        const defaultHeight = FIELD_TYPES[field.type]?.defaultHeight || 40;

        // If field is way too large, reset to reasonable size
        if (field.width > defaultWidth * 5) {
          return {
            ...field,
            width: defaultWidth * 1.5, // 150% of default
            height: defaultHeight * 1.5
          };
        }
        return field;
      });

      if (JSON.stringify(correctedFields) !== JSON.stringify(fields)) {
        setFields(correctedFields);
      }
    }
  }, [fields]);



  // Add function to handle adding recipients
  const handleAddRecipient = async (recipientData) => {
    try {
      // Simulate API call to add recipient
      const response = await fetch(`${API_BASE_URL}/recipients/${documentId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipients: [recipientData]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add recipient');
      }

      const result = await response.json();

      // Add new recipient to the list
      const newRecipient = {
        id: result.recipients?.[0]?.id || Date.now().toString(),
        ...recipientData,
        added_at: new Date().toISOString()
      };

      setRecipients(prev => [...prev, newRecipient]);
      showSnackbar('Recipient added successfully!', 'success');

      return newRecipient;

    } catch (error) {
      console.error('Error adding recipient:', error);
      throw error;
    }
  };

  // Manual save with versioning

  // const handleSaveFields = async () => {
  //   if (!documentId) {
  //     showSnackbar('No document selected', 'error');
  //     return;
  //   }

  //   if (saving) return;

  //   try {
  //     setSaving(true);
  //     setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));

  //     // Standard PDF page dimensions (Letter size)
  //     const PDF_PAGE_WIDTH = 612;   // 8.5 inches * 72 points/inch = 612 points
  //     const PDF_PAGE_HEIGHT = 792;  // 11 inches * 72 points/inch = 792 points

  //     // Your Konva canvas dimensions (what users see)
  //     const CANVAS_WIDTH = 794;     // Canvas width in pixels
  //     const CANVAS_HEIGHT = 1123;   // Canvas height in pixels

  //     // Build payload matching backend expectations
  //     const payload = fields.map(f => {
  //       // Ensure field has valid coordinates
  //       const fieldX = f.x ?? 50;
  //       const fieldY = f.y ?? 50;
  //       const fieldWidth = f.width ?? FIELD_TYPES[f.type]?.defaultWidth ?? 200;
  //       const fieldHeight = f.height ?? FIELD_TYPES[f.type]?.defaultHeight ?? 40;

  //       // Calculate scaling ratio between canvas and PDF
  //       const scaleX = PDF_PAGE_WIDTH / CANVAS_WIDTH;
  //       const scaleY = PDF_PAGE_HEIGHT / CANVAS_HEIGHT;

  //       // Convert canvas pixels to PDF points
  //       const pdfX = fieldX * scaleX;
  //       const pdfY = fieldY * scaleY;
  //       const pdfWidth = fieldWidth * scaleX;
  //       const pdfHeight = fieldHeight * scaleY;

  //       return {
  //         id: f.isNew ? undefined : f.id,
  //         page: f.page ?? 0,

  //         // Send ORIGINAL canvas coordinates (frontend)
  //         x: fieldX,      // Canvas pixels
  //         y: fieldY,      // Canvas pixels
  //         width: fieldWidth,
  //         height: fieldHeight,

  //         // REQUIRED for backend conversion
  //         page_width: PDF_PAGE_WIDTH,
  //         page_height: PDF_PAGE_HEIGHT,
  //         canvas_width: CANVAS_WIDTH,
  //         canvas_height: CANVAS_HEIGHT,

  //         // Field properties
  //         type: f.type,
  //         recipient_id: f.recipient_id ?? null,
  //         required: Boolean(f.required),

  //         // Optional properties
  //         label: f.label || '',
  //         placeholder: f.placeholder || '',
  //         font_size: f.font_size || 12
  //       };
  //     });

  //     console.log('Saving fields payload:', JSON.stringify(payload, null, 2));

  //     const response = await fetch(`${API_BASE_URL}/documents/${documentId}/fields`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${localStorage.getItem('token')}`
  //       },
  //       body: JSON.stringify(payload)
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.detail || 'Failed to save fields');
  //     }

  //     const result = await response.json();

  //     // Update fields with backend IDs
  //     const savedFields = fields.map(f => {
  //       const savedField = result.fields?.find(sf => 
  //         sf.recipient_id === f.recipient_id && 
  //         sf.type === f.type &&
  //         Math.abs(sf.canvas_x - (f.x || 0)) < 10 &&
  //         Math.abs(sf.canvas_y - (f.y || 0)) < 10
  //       );

  //       return {
  //         ...f,
  //         isNew: false,
  //         id: savedField?.id || f.id
  //       };
  //     });

  //     setFields(savedFields);
  //     historyService.push(savedFields);
  //     updateUndoRedoInfo();

  //     setSaveVersion(prev => prev + 1);
  //     setAutoSaveStatus({
  //       lastSaved: new Date(),
  //       isSaving: false,
  //       hasUnsavedChanges: false
  //     });

  //     showSnackbar(`Saved ${result.count} fields successfully`, 'success');

  //     // Force PDF reload ONLY after manual save
  //     const newPdfUrl = documentAPI.getBuilderPdfUrl(documentId) + `&v=${Date.now()}`;

  //     return result;

  //   } catch (err) {
  //     console.error('Error saving fields:', err);
  //     showSnackbar(err.message || 'Failed to save fields', 'error');
  //     throw err;
  //   } finally {
  //     setSaving(false);
  //   }
  // };







  // Update the AutosaveService initialization to respect the toggle
  useEffect(() => {
    const service = new AutosaveService(
      documentId,
      async (fields) => {
        // Only save if auto-save is enabled
        if (!autoSaveEnabled) {
          console.log('Auto-save skipped (disabled)');
          return fields;
        }

        // Convert to backend format
        const payload = fields.map(field => ({
          id: field.isNew ? undefined : field.id,
          page: field.page ?? 0,
          x: field.x ?? 0,
          y: field.y ?? 0,
          width: field.width ?? FIELD_TYPES[field.type]?.defaultWidth ?? 200,
          height: field.height ?? FIELD_TYPES[field.type]?.defaultHeight ?? 40,
          type: field.type,
          recipient_id: field.recipient_id ?? null,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required ?? false
        }));

        await documentAPI.saveFields(documentId, payload);

        // Mark fields as saved
        return fields.map(f => ({ ...f, isNew: false }));
      },
      {
        debounceTime: 5000, // Increase to 5 seconds to reduce frequency
        maxRetries: 3,
        enabled: autoSaveEnabled,
        silent: true // Add silent mode to not trigger UI updates
      }
    );

    setAutosaveService(service);

    // Listen to autosave events
    const handleAutosaveSuccess = () => {
      setAutoSaveStatus(prev => ({
        ...prev,
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false
      }));
      showSnackbar('Auto-saved successfully', 'success');
    };

    const handleAutosaveRetry = (e) => {
      setAutoSaveStatus(prev => ({
        ...prev,
        isSaving: true
      }));
      showSnackbar(`Auto-save retrying (${e.detail.retryCount}/3)...`, 'warning');
    };

    const handleAutosaveFailed = () => {
      setAutoSaveStatus(prev => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: true
      }));
      showSnackbar('Auto-save failed. Please save manually.', 'error');
    };

    window.addEventListener('autosave:success', handleAutosaveSuccess);
    window.addEventListener('autosave:retry', handleAutosaveRetry);
    window.addEventListener('autosave:failed', handleAutosaveFailed);

    return () => {
      window.removeEventListener('autosave:success', handleAutosaveSuccess);
      window.removeEventListener('autosave:retry', handleAutosaveRetry);
      window.removeEventListener('autosave:failed', handleAutosaveFailed);
      service.cancel();
    };
  }, [documentId, showSnackbar, autoSaveEnabled]);

  // Initialize history when fields load
  useEffect(() => {
    if (fields.length > 0 && historyService.present === null) {
      historyService.push(fields);
      updateUndoRedoInfo();
    }
  }, [fields, historyService]);

  // Auto-save when fields change
  useEffect(() => {
    if (!autosaveService || fields.length === 0 || !autoSaveEnabled) return;

    const hasChanges = autosaveService.hasUnsavedChanges(fields);

    if (hasChanges) {
      setAutoSaveStatus(prev => ({
        ...prev,
        hasUnsavedChanges: true,
        isSaving: true
      }));

      autosaveService.scheduleSave(fields);
    }
  }, [fields, autosaveService, autoSaveEnabled]);


  // Add force save function
  const handleForceSave = async () => {
    if (!autosaveService || fields.length === 0) return;

    try {
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));
      await autosaveService.forceSave(fields);
      showSnackbar('Saved successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to save. Please try manual save.', 'error');
    }
  };

  // Add toggle handler
  const handleToggleAutoSave = (enabled) => {
    setAutoSaveEnabled(enabled);

    if (enabled) {
      showSnackbar('Auto-save enabled', 'info');

      // Trigger save if there are unsaved changes
      if (autoSaveStatus.hasUnsavedChanges) {
        handleForceSave();
      }
    } else {
      showSnackbar('Auto-save disabled', 'warning');
    }
  };

  // Update undo/redo info
  const updateUndoRedoInfo = () => {
    setUndoRedoInfo(historyService.getHistoryInfo());
  };

  // Undo function
  const undo = useCallback(() => {
    if (!historyService.canUndo()) return;

    const previousState = historyService.undo();
    setFields(previousState);
    updateUndoRedoInfo();

    // Deselect field if it no longer exists
    if (selectedFieldId && !previousState.find(f => f.id === selectedFieldId)) {
      setSelectedFieldId(null);
    }

    showSnackbar('Undo successful', 'info');
  }, [historyService, selectedFieldId, showSnackbar]);

  // Redo function
  const redo = useCallback(() => {
    if (!historyService.canRedo()) return;

    const nextState = historyService.redo();
    setFields(nextState);
    updateUndoRedoInfo();

    showSnackbar('Redo successful', 'info');
  }, [historyService, showSnackbar]);

  // Wrap field operations to track history
  const commitFieldChange = useCallback((newFields) => {
    historyService.push(newFields);
    setFields(newFields);
    updateUndoRedoInfo();
  }, [historyService]);




  // Handle canvas drop events

  const handleAddField = useCallback((fieldType, x, y, page = currentPage) => {
    const fieldConfig = FIELD_TYPES[fieldType];

    // Ensure page is valid
    const targetPage = Math.max(0, Math.min(page, numPages - 1));
    console.log(`Adding field: type=${fieldType}, targetPage=${targetPage} (0-indexed), currentPage=${currentPage}, totalPages=${numPages}`);

    // Get proper page dimensions
    const pageWidth = 794;  // Your canvas width
    const pageHeight = 1123; // Your canvas height

    // Constrain to page boundaries
    const fieldWidth = fieldConfig.defaultWidth || 100;
    const fieldHeight = fieldConfig.defaultHeight || 40;

    const constrainedX = Math.max(20, Math.min(x, pageWidth - fieldWidth - 20));
    const constrainedY = Math.max(20, Math.min(y, pageHeight - fieldHeight - 20));

    // Find compatible recipient
    let selectedRecipient = null;

    if (selectedRecipientId) {
      const recipient = recipients.find(r => r.id === selectedRecipientId);
      if (recipient && validateFieldAssignment(fieldType, recipient.role)) {
        selectedRecipient = recipient;
      }
    }

    // If no selected recipient or invalid selection, find first compatible
    if (!selectedRecipient) {
      selectedRecipient = recipients.find(recipient =>
        validateFieldAssignment(fieldType, recipient.role)
      );
    }

    const newField = normalizeFieldCoordinates({
      id: uuidv4(),
      name: `${fieldType}_${fields.length + 1}`,
      type: fieldType,
      label: `${fieldConfig.label} ${fields.length + 1}`,
      placeholder: fieldConfig.placeholder,
      x: Math.round(constrainedX),
      y: Math.round(constrainedY),
      width: fieldWidth,
      height: fieldHeight,
      page: targetPage, // Store as 0-indexed
      required: false,
      recipient_id: selectedRecipient?.id || null,
      assignedRecipient: selectedRecipient,
      isNew: true,
      pageWidth: pageWidth,
      pageHeight: pageHeight,

      // 🔴 FIX: Ensure dropdown fields have options
      ...(fieldType === 'dropdown' && {
        dropdown_options: ['Option 1', 'Option 2', 'Option 3']
      }),
      ...(fieldType === 'radio' && { group_name: `group_${Date.now()}` }),
      ...(fieldType === 'mail' && { placeholder: 'email@example.com' })
    });

    const newFields = [...fields, newField];
    commitFieldChange(newFields);
    setSelectedFieldId(newField.id);

    // Auto-open right sidebar for radio/dropdown fields
    if (fieldType === 'radio' || fieldType === 'dropdown') {
      setRightSidebarExpanded(true);
    }

    // Switch to the page where field was added
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
    }
  }, [recipients, fields, currentPage, commitFieldChange, selectedRecipientId, numPages]);// Added selectedRecipientId dependency

  const handleFieldChange = useCallback((fieldId, updates) => {
    const updatedRecipient = updates.recipient_id ?
      recipients.find(r => r.id === updates.recipient_id) :
      undefined;

    const newFields = fields.map(field =>
      field.id === fieldId ? {
        ...field,
        ...updates,
        assignedRecipient: updatedRecipient || field.assignedRecipient
      } : field
    );

    commitFieldChange(newFields);
  }, [fields, recipients, commitFieldChange]);

  const handleFieldDelete = useCallback((fieldId) => {
    const newFields = fields.filter(field => field.id !== fieldId);
    commitFieldChange(newFields);

    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [fields, selectedFieldId, commitFieldChange]);

  const handleFieldDragEnd = useCallback((fieldId, newX, newY) => {
    const newFields = fields.map(field => {
      if (field.id === fieldId) {
        // Get current field's page dimensions
        const pageWidth = field.pageWidth || 794;
        const pageHeight = field.pageHeight || 1123;
        const fieldWidth = field.width || FIELD_TYPES[field.type]?.defaultWidth || 100;
        const fieldHeight = field.height || FIELD_TYPES[field.type]?.defaultHeight || 40;

        // Constrain to page boundaries
        const constrainedX = Math.max(0, Math.min(newX, pageWidth - fieldWidth));
        const constrainedY = Math.max(0, Math.min(newY, pageHeight - fieldHeight));

        return normalizeFieldCoordinates({
          ...field,
          x: Math.round(constrainedX),
          y: Math.round(constrainedY),
          page: field.page, // Keep same page when dragging
          pageWidth: pageWidth,
          pageHeight: pageHeight
        });
      }
      return field;
    });
    commitFieldChange(newFields);
  }, [fields, commitFieldChange]);

  const handleFieldTransform = useCallback((fieldId, updates) => {
    const newFields = fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    commitFieldChange(newFields);
  }, [fields, commitFieldChange]);





  // Keyboard shortcuts
  // Update the keyboard handler in DocumentBuilder to prevent negative positions:
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (selectedFieldId) {
        const selectedField = fields.find(f => f.id === selectedFieldId);
        if (selectedField) {
          const moveAmount = e.shiftKey ? 10 : 1;

          // Get current position
          let newX = selectedField.x;
          let newY = selectedField.y;

          switch (e.key) {
            case 'ArrowUp':
              e.preventDefault();
              newY = Math.max(0, selectedField.y - moveAmount);
              break;
            case 'ArrowDown':
              e.preventDefault();
              newY = Math.min(1123 - selectedField.height, selectedField.y + moveAmount);
              break;
            case 'ArrowLeft':
              e.preventDefault();
              newX = Math.max(0, selectedField.x - moveAmount);
              break;
            case 'ArrowRight':
              e.preventDefault();
              newX = Math.min(794 - selectedField.width, selectedField.x + moveAmount);
              break;
          }

          // Only update if position changed
          if (newX !== selectedField.x || newY !== selectedField.y) {
            handleFieldDragEnd(selectedFieldId, newX, newY);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, fields, handleFieldDragEnd]);


  // Handle navigation with unsaved changes warning
  const handleNavigateWithCheck = useCallback((path) => {
    if (autoSaveStatus.hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedChangesDialog(true);
    } else {
      navigate(path);
    }
  }, [autoSaveStatus.hasUnsavedChanges, navigate]);

  const handleForceSaveAndNavigate = async () => {
    try {
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));
      await autosaveService.forceSave(fields);
      navigate(pendingNavigation);
    } catch (error) {
      showSnackbar('Failed to save. Please try again.', 'error');
    } finally {
      setShowUnsavedChangesDialog(false);
      setPendingNavigation(null);
    }
  };



  // Handle canvas drop events - FIXED with useCallback
  // Update the event listener
  useEffect(() => {
    const handleCanvasDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const { fieldType, x, y, page } = e.detail;
      handleAddField(fieldType, x, y, page);
    };

    window.addEventListener('canvasDrop', handleCanvasDrop);

    return () => {
      window.removeEventListener('canvasDrop', handleCanvasDrop);
    };
  }, [handleAddField]);// Add handleAddField as dependency

  // Handle canvas actions - memoized
  const handleCanvasAction = useCallback((action) => {
    switch (action.type) {
      case 'zoom':
        setZoomLevel(prev => Math.max(0.5, Math.min(2, prev + action.value)));
        break;
      case 'toggleGrid':
        setShowGrid(prev => !prev); // Use functional update
        break;
      case 'reset':
        setZoomLevel(0.8);
        break;
      default:
        break;
    }
  }, []);






  // Handle finish and send
  const handleFinishAndSend = async () => {
    if (!documentId) {
      showSnackbar('No document selected', 'error');
      return;
    }

    // Validate before sending
    const invalidFields = fields.filter(field => {
      if (!field.recipient_id) return true; // Unassigned fields
      const recipient = recipients.find(r => r.id === field.recipient_id);
      if (!recipient) return true;
      return !validateFieldAssignment(field.type, recipient.role);
    });

    if (invalidFields.length > 0) {
      showSnackbar(
        `Cannot send: ${invalidFields.length} field(s) need attention`,
        'error'
      );
      setFinishDialogOpen(true);
      return;
    }

    const unassignedFields = fields.filter(f => !f.recipient_id);
    if (unassignedFields.length > 0) {
      showSnackbar(
        `${unassignedFields.length} field(s) are not assigned to recipients`,
        'warning'
      );
    }

    setFinishDialogOpen(true);
  };


  // Navigation handlers for success dialog
  const handleNavigateToDashboard = () => {
    navigate('/user/dashboard');
    setSuccessDialogOpen(false);
  };

  const handleNavigateToDocuments = () => {
    navigate('/user/documents');
    setSuccessDialogOpen(false);
  };

  const handleStayOnPage = () => {
    setSuccessDialogOpen(false);
    // Optionally refresh data or show additional info
  };

  // Actually send invites
  // Actually send invites
  const sendInvites = async () => {
    try {
      setSaving(true);

      // First save fields
      await handleSaveFields();

      // Send invites to all recipients
      const recipientIds = recipients.map(r => r.id);

      if (recipientIds.length === 0) {
        showSnackbar('Please add recipients first', 'warning');
        return;
      }

      await documentAPI.sendInvites(documentId, {
        recipient_ids: recipientIds,
        message: "Please review and sign the document"
      });

      // Show success message
      showSnackbar('Invites sent successfully!', 'success');
      setFinishDialogOpen(false);

      // Show success dialog after a short delay
      setTimeout(() => {
        setSuccessDialogOpen(true);
      }, 500);

    } catch (error) {
      console.error('Error sending invites:', error);
      showSnackbar(`Failed to send invites: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };




  // Add history state
  const [history, setHistory] = useState({
    past: [],
    present: fields,
    future: []
  });


  const commitChange = (newFields) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newFields,
      future: [] // clear redo stack
    }));
  };

  const addField = (field) => {
    commitChange([...fields, field]);
  };

  const updateField = (id, updates) => {
    commitChange(
      fields.map(f => f.id === id ? { ...f, ...updates } : f)
    );
  };

  const deleteField = (id) => {
    commitChange(fields.filter(f => f.id !== id));
  };




  // Create history functions
  // const undo = () => {
  //   setHistory(prev => {
  //     if (prev.past.length === 0) return prev;

  //     const previous = prev.past[prev.past.length - 1];
  //     const newPast = prev.past.slice(0, -1);

  //     return {
  //       past: newPast,
  //       present: previous,
  //       future: [prev.present, ...prev.future]
  //     };
  //   });
  // };


  // const redo = () => {
  //   setHistory(prev => {
  //     if (prev.future.length === 0) return prev;

  //     const next = prev.future[0];
  //     const newFuture = prev.future.slice(1);

  //     return {
  //       past: [...prev.past, prev.present],
  //       present: next,
  //       future: newFuture
  //     };
  //   });
  // };



  // Update on field changes
  const updateFields = (newFields) => {
    setHistory({
      past: [...history.past, fields],
      present: newFields,
      future: []
    });
    setFields(newFields);
  };



  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore typing inside inputs / textareas
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // SAVE
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFields();
        return;
      }

      // UNDO / REDO
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      // DELETE FIELD (Delete / Backspace)
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedFieldId
      ) {
        e.preventDefault();
        handleFieldDelete(selectedFieldId);
        return;
      }

      // OPTIONAL: Ctrl / Cmd + D delete
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === 'd' &&
        selectedFieldId
      ) {
        e.preventDefault();
        handleFieldDelete(selectedFieldId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedFieldId,
    handleSaveFields,
    handleFieldDelete,
    undo,
    redo
  ]);

  // Filter fields for current page



  const currentPageFields = useMemo(() =>
    fields.filter(f => f.page === currentPage),
    [fields, currentPage]
  );

  // Add page navigation component:
  const PageNavigator = ({ numPages, currentPage, onPageChange }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography>
        Page {currentPage + 1} of {numPages}
      </Typography>
      <IconButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === numPages - 1}
      >
        <ArrowForward />
      </IconButton>
    </Box>
  );


  // Add handler in DocumentBuilder
  const handleDuplicateField = useCallback((fieldId) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) return;

    const newField = {
      ...fieldToDuplicate,
      id: uuidv4(),
      isNew: true, // Mark as new
      x: fieldToDuplicate.x + 20,
      y: fieldToDuplicate.y + 20,
      label: `${fieldToDuplicate.label} (Copy)`
    };

    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, [fields]);





  // ============================================
  // Document Canvas Component (Updated)
  // ============================================
  // ============================================
  // Optimized Document Canvas Component with Single PDF Load
  // ============================================

  const DocumentCanvas = React.memo(({
    documentId,
    fields = [],
    selectedFieldId,
    onSelectField,
    onFieldDragEnd,
    onFieldTransform,
    scale = 1,
    onCanvasClick,
    showGrid = true,
    getFieldValidationError,
    currentPage = 0,
    numPages = 1,
    onPageChange
  }) => {
    const stageRef = useRef();
    const containerRef = useRef();
    const [pdfLoaded, setPdfLoaded] = useState(false);
    const [pdfError, setPdfError] = useState(null);

    // SINGLE PDF URL - loaded only once
    const pdfUrl = useMemo(() => {
      if (!documentId) return null;
      const url = documentAPI.getBuilderPdfUrl(documentId);
      console.log('PDF URL generated once:', url);
      return url;
    }, [documentId]);

    // Calculate dimensions
    const scaledWidth = BASE_WIDTH * scale;
    const scaledHeight = BASE_HEIGHT * scale;
    const pageGap = 20;

    // Handle canvas click
    const handleCanvasClick = useCallback((e) => {
      if (e.target === e.target.getStage()) {
        onSelectField(null);
      }
    }, [onSelectField]);

    // Handle drag and drop
    const handleDrop = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();

      const fieldType = e.dataTransfer.getData('fieldType');
      if (!fieldType) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Calculate which page was clicked on
      const pageHeight = scaledHeight + pageGap;
      const dropY = pointerPosition.y;
      const targetPage = Math.floor(dropY / pageHeight);

      // Ensure target page is within bounds
      const validPage = Math.max(0, Math.min(targetPage, numPages - 1));

      // Adjust Y position relative to the page
      let relativeY = (dropY - (validPage * pageHeight)) / scale;
      relativeY = Math.max(0, Math.min(relativeY, BASE_HEIGHT));

      // Adjust X position
      let relativeX = pointerPosition.x / scale;
      relativeX = Math.max(0, Math.min(relativeX, BASE_WIDTH));

      // Dispatch event with page info
      window.dispatchEvent(
        new CustomEvent('canvasDrop', {
          detail: {
            fieldType,
            x: relativeX,
            y: relativeY,
            page: validPage
          }
        })
      );
    }, [scale, numPages, scaledHeight, pageGap]);

    const handleDragOver = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    }, []);

    // Setup event listeners
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.addEventListener('drop', handleDrop);
      container.addEventListener('dragover', handleDragOver);

      return () => {
        container.removeEventListener('drop', handleDrop);
        container.removeEventListener('dragover', handleDragOver);
      };
    }, [handleDrop, handleDragOver]);

    // Handle PDF load success
    const handlePdfLoadSuccess = useCallback(() => {
      setPdfLoaded(true);
      setPdfError(null);
    }, []);

    const handlePdfLoadError = useCallback((error) => {
      console.error('PDF load error:', error);
      setPdfError('Failed to load PDF document');
      setPdfLoaded(false);
    }, []);

    // Memoize PDF pages rendering - Now inside single Document wrapper
    const renderPdfPages = useMemo(() => {
      if (!pdfUrl) {
        return (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: `${pageGap}px`,
            padding: `${pageGap}px 0`
          }}>
            {Array.from({ length: numPages }, (_, pageIndex) => (
              <Paper
                key={`page-placeholder-${pageIndex}`}
                sx={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  backgroundColor: '#f5f5f5',
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
            <Button
              variant="outlined"
              onClick={() => {
                setPdfError(null);
                setPdfLoaded(false);
              }}
            >
              Retry Loading
            </Button>
          </Box>
        );
      }

      // SINGLE DOCUMENT WRAPPER with multiple pages inside
      return (
        <Document
          file={pdfUrl}
          // onLoadSuccess={handlePdfLoadSuccess}
          // onLoadError={handlePdfLoadError}
          loading={
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}>
              {/* <CircularProgress /> */}
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
          options={{
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`
          }}
        >
          {/* Multiple pages inside single Document */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: `${pageGap}px`,
            padding: `${pageGap}px 0`
          }}>
            {Array.from({ length: numPages }, (_, pageIndex) => {
              const pdfPageNumber = pageIndex + 1;
              const isCurrentPage = pageIndex === currentPage;

              return (
                <Box
                  key={`page-${pageIndex}`}
                  sx={{
                    width: `${scaledWidth}px`,
                    height: `${scaledHeight}px`,
                    position: 'relative',
                    backgroundColor: 'white',
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: 3,
                    // border: isCurrentPage ? '3px solid #1976d2' : '1px solid #e0e0e0',
                    transition: 'border 0.2s ease',
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  <Page
                    pageNumber={pdfPageNumber}
                    scale={scale}
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

                  {/* Page label */}
                  {/* <Box sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: isCurrentPage ? '#1976d2' : 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  fontWeight: isCurrentPage ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  zIndex: 2
                }}>
                  {isCurrentPage && (
                    <VisibilityIcon fontSize="small" />
                  )}
                  Page {pageIndex + 1}
                </Box> */}
                </Box>
              );
            })}
          </Box>
        </Document>
      );
    }, [
      pdfUrl,
      pdfError,
      numPages,
      currentPage,
      scaledWidth,
      scaledHeight,
      pageGap,
      scale,
      // handlePdfLoadSuccess,
      // handlePdfLoadError
    ]);

    // Memoize Konva stage rendering
    const renderKonvaStage = useMemo(() => {
      return (
        <Stage
          ref={stageRef}
          width={scaledWidth}
          height={(scaledHeight + pageGap) * numPages}
          onClick={handleCanvasClick}
          onTap={handleCanvasClick}
          style={{
            cursor: 'default',
            backgroundColor: 'transparent',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }}
        >
          <Layer>
            {fields.map((field) => {
              const validationError = getFieldValidationError ? getFieldValidationError(field) : false;

              // Calculate Y offset for each page
              const pageOffsetY = field.page * (scaledHeight + pageGap) + (pageGap / 2);

              return (
                <MemoizedCanvasField
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onSelect={onSelectField}
                  onDragEnd={onFieldDragEnd}
                  onTransform={onFieldTransform}
                  scale={scale}
                  validationError={validationError}
                  currentPage={currentPage}
                  showAllFields={true}
                  pageOffsetY={pageOffsetY}
                />
              );
            })}
          </Layer>
        </Stage>
      );
    }, [
      fields,
      scaledWidth,
      scaledHeight,
      pageGap,
      numPages,
      handleCanvasClick,
      selectedFieldId,
      onSelectField,
      onFieldDragEnd,
      onFieldTransform,
      scale,
      getFieldValidationError,
      currentPage
    ]);

    // Handle scroll to update current page
    const handleScroll = useCallback(() => {
      if (!containerRef.current) return;

      const scrollTop = containerRef.current.scrollTop;
      const pageHeight = scaledHeight + pageGap;
      const viewportMiddlePage = Math.floor((scrollTop + (containerRef.current.clientHeight / 2)) / pageHeight);

      const newCurrentPage = Math.max(0, Math.min(viewportMiddlePage, numPages - 1));

      if (newCurrentPage !== currentPage) {
        onPageChange(newCurrentPage);
      }
    }, [scaledHeight, pageGap, numPages, currentPage, onPageChange]);

    // Add scroll listener
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let scrollTimer;
      const debouncedHandleScroll = () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          handleScroll();
        }, 100);
      };

      container.addEventListener('scroll', debouncedHandleScroll);
      return () => {
        container.removeEventListener('scroll', debouncedHandleScroll);
        clearTimeout(scrollTimer);
      };
    }, [handleScroll]);

    // Maintain scroll position when fields change
    const previousFieldsRef = useRef(fields);
    useEffect(() => {
      if (previousFieldsRef.current.length !== fields.length) {
        if (containerRef.current) {
          const scrollPos = containerRef.current.scrollTop;
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = scrollPos;
            }
          });
        }
      }
      previousFieldsRef.current = fields;
    }, [fields]);

    return (
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          position: 'relative',
          border: '1px solid #e0e0e0',
          scrollBehavior: 'smooth'
        }}
      >
        {/* Canvas Controls */}
        {/* <Box sx={{ 
        position: 'sticky', 
        top: 16, 
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10, 
        display: 'flex', 
        gap: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 1,
        borderRadius: 1,
        boxShadow: 3,
        width: 'fit-content',
        marginBottom: 1
      }}>
        <Tooltip title="Zoom Out">
          <IconButton 
            size="small" 
            onClick={() => onCanvasClick?.({ type: 'zoom', value: -0.1 })}
            disabled={scale <= 0.5}
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Typography variant="body2" sx={{ 
          minWidth: 40, 
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center'
        }}>
          {Math.round(scale * 100)}%
        </Typography>
        
        <Tooltip title="Zoom In">
          <IconButton 
            size="small" 
            onClick={() => onCanvasClick?.({ type: 'zoom', value: 0.1 })}
            disabled={scale >= 2}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem />
        
        <Tooltip title={showGrid ? "Hide Grid" : "Show Grid"}>
          <IconButton 
            size="small" 
            onClick={() => onCanvasClick?.({ type: 'toggleGrid' })}
          >
            {showGrid ? <GridOnIcon fontSize="small" /> : <GridOffIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Reset View">
          <IconButton 
            size="small" 
            onClick={() => onCanvasClick?.({ type: 'reset' })}
          >
            <PreviewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box> */}

        {/* Main content area */}
        <Box sx={{
          position: 'relative',
          width: '100%',
          minHeight: (scaledHeight + pageGap) * numPages,
          height: 'auto',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {/* Single PDF Document with all pages inside */}
          {renderPdfPages}

          {/* Konva Overlay for fields */}
          {renderKonvaStage}
        </Box>
      </Box>
    );
  });

  // Memoize CanvasField components
  const MemoizedCanvasField = React.memo(CanvasField);


  // Get validation info for a field
  //   const getFieldValidationError = (field) => {
  //   if (!field.recipient_id) return false;
  //   const recipient = recipients.find(r => r.id === field.recipient_id);
  //   if (!recipient) return true;
  //   return !validateFieldAssignment(field.type, recipient.role);
  // };



  const selectedField = fields.find(f => f.id === selectedFieldId);
  const invalidFields = fields.filter(getFieldValidationError);
  const unassignedFields = fields.filter(f => !f.recipient_id);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!document) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Document not found. Please select a document first.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/user/documents')}
          startIcon={<ArrowBackIcon />}
        >
          Back to Documents
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Progress bar */}
      {/* Progress bar with save indicator */}
      <Box
        sx={{
          px: 2,
          py: 0.5,
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 2
        }}
      >

        {/* <Stepper activeStep={1} sx={{ flexGrow: 1,width: '70%' }}>
            <Step>
              <StepLabel>Upload Document</StepLabel>
            </Step>
            <Step>
              <StepLabel>Add Fields</StepLabel>
            </Step>
            <Step>
              <StepLabel>Send for Signing</StepLabel>
            </Step>
          </Stepper> */}

        {/* Save status indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          {autoSaveStatus.isSaving ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CircularProgress size={12} />
              <Typography variant="caption" color="text.secondary">
                Auto-saving...
              </Typography>
            </Box>
          ) : autoSaveStatus.lastSaved ? (
            <Typography variant="caption" color="text.secondary">
              Last auto-save: {new Date(autoSaveStatus.lastSaved).toLocaleTimeString()}
            </Typography>
          ) : null}
        </Box>
      </Box>

      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/user/documents')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" noWrap>
                {document.filename || 'Untitled Document'}
              </Typography>
              {/* Save indicator */}
              {autoSaveStatus.isSaving && (
                <CircularProgress size={16} sx={{ ml: 1 }} />
              )}

              {autoSaveStatus.lastSaved && !autoSaveStatus.isSaving && (
                <Tooltip title={`Last saved: ${new Date(autoSaveStatus.lastSaved).toLocaleTimeString()}`}>
                  <Chip
                    label="Saved"
                    size="small"
                    color="success"
                    variant="outlined"
                    icon={<CheckCircleIcon fontSize="small" />}
                  />
                </Tooltip>
              )}

              {autoSaveStatus.hasUnsavedChanges && (
                <Chip
                  label="Unsaved changes"
                  size="small"
                  color="warning"
                  variant="outlined"
                  icon={<ErrorIcon fontSize="small" />}
                />
              )}
            </Box>




            <Typography variant="caption" color="text.secondary">
              Role-Based Field Assignment • {recipients.length} Recipients
            </Typography>
          </Box>
          {/* Add edit icon button for renaming */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8
            }
          }}
            onClick={() => setRenameDialogOpen(true)}
          >

            <IconButton
              size="small"
              sx={{
                ml: 0.5,
                p: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.04)'
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setRenameDialogOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

            <AutoSaveIndicator
              enabled={autoSaveEnabled}
              onToggle={handleToggleAutoSave}
              status={autoSaveStatus}
              onForceSave={handleForceSave}
            />

            {/* Undo/Redo buttons */}
            <Tooltip title="Undo (Ctrl+Z)">
              <IconButton
                size="small"
                onClick={undo}
                disabled={!undoRedoInfo.canUndo}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Redo (Ctrl+Y)">
              <IconButton
                size="small"
                onClick={redo}
                disabled={!undoRedoInfo.canRedo}
              >
                <ArrowForward />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            {/* <Chip
              label={`${fields.length} fields`}
              size="small"
              variant="outlined"
              color={invalidFields.length > 0 ? "error" : "default"}
            /> */}


            <Chip
              label={`${fields.length} fields`}
              size="small"
              variant="outlined"
              color={invalidFields.length > 0 ? "error" : "default"}
            />
            {invalidFields.length > 0 && (
              <Chip
                label={`${invalidFields.length} invalid`}
                size="small"
                color="error"
                variant="filled"
              />
            )}



            {/* Add Recipient Button */}
            {/* <Button
              variant="outlined"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddRecipientDialogOpen(true)}
            >
              Add Recipient
            </Button> */}

            {/* Updated Preview Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => setPreviewDialogOpen(true)}
            >
              Preview
            </Button>


            <Button
              variant="outlined"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSaveFields}
              disabled={saving || invalidFields.length > 0 || document?.status === 'sent'}
              title={document?.status === 'sent' ? "Document is locked after sending" : ""}
            >
              {saving ? 'Saving...' : document?.status === 'sent' ? 'Locked' : 'Save Fields'}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SendIcon />}
              onClick={handleFinishAndSend}
              disabled={saving || invalidFields.length > 0 || document?.status === 'sent'}
              color={invalidFields.length > 0 ? "warning" : "primary"}
            >
              Finish & Send
            </Button>
          </Box>
        </Toolbar>

      </AppBar>




      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', p: 2, position: 'relative' }}>
        {/* Left sidebar - Field library */}
        <Box sx={{
          width: { md: 250, lg: 400 }, // Responsive widths
          pr: 2,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <FieldLibrary
            onAddField={(fieldType) => {
              handleAddField(fieldType, 100, 100);
            }}
            recipients={recipients}
            selectedRecipientId={selectedRecipientId}
            onSelectRecipient={handleSelectRecipient}
          />
        </Box>

        {/* Center - Canvas with expandable area */}
        <Box sx={{
          flex: 1,

          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-right 0.3s ease'
        }}>


          {/* Page Navigation */}
          {/* {numPages > 1 && (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        py: 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider'
      }}> */}

          {/* {numPages > 1 && (
        <PageNavigation
            currentPage={currentPage}
            numPages={numPages}
            onPageChange={(pageIndex) => setCurrentPage(pageIndex)} // pageIndex is 0-indexed
            // onPageChange={setCurrentPage}
            onToggleAllPages={() => setShowAllPages(!showAllPages)}
            showAllPages={showAllPages}
          />
        )} */}

          {/* Validation Summary */}
          <ValidationSummary fields={fields} recipients={recipients} />

          {/* Canvas - FULL WIDTH with expansion */}
          {/* Canvas - Always shows all pages */}
          <Paper sx={{
            flex: 1,
            position: 'relative',
            p: 0,
            overflow: 'hidden',
            display: 'flex',
            mr: rightSidebarExpanded ? 2 : 0,
            transition: 'margin-right 0.3s ease'
          }}>
            <Box sx={{
              flex: 1,
              position: 'relative',
              width: '100%',
              height: '100%'
            }}>
              <DocumentCanvas
                documentId={documentId}
                fields={fields}
                recipients={recipients}
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
                onFieldDragEnd={handleFieldDragEnd}
                onFieldTransform={handleFieldTransform}
                scale={zoomLevel}
                onCanvasClick={handleCanvasAction}
                showGrid={showGrid}
                getFieldValidationError={getFieldValidationError}
                currentPage={currentPage}
                // pdfUrl={getPdfUrl()}
                onPageChange={setCurrentPage}
                numPages={numPages}
              />
            </Box>
          </Paper>
        </Box>

        {/* Right sidebar toggle button - Fixed position */}
        <Box sx={{
          position: 'absolute',
          right: rightSidebarExpanded ? 368 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          transition: 'right 0.3s ease'
        }}>
          <IconButton
            onClick={toggleRightSidebar}
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

        {/* Right sidebar - Properties & Recipients */}
        <Box sx={{
          width: rightSidebarExpanded ? 360 : 0,
          pl: rightSidebarExpanded ? 2 : 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          opacity: rightSidebarExpanded ? 1 : 0,
          visibility: rightSidebarExpanded ? 'visible' : 'hidden'
        }}>
          {/* Properties Panel */}
          {rightSidebarExpanded && (
            <Paper sx={{
              flex: 1,
              borderRadius: 2,
              overflow: 'hidden',
              animation: rightSidebarExpanded ? 'fadeInRight 0.3s ease' : 'none'
            }}>
              <FieldPropertiesPanel
                field={selectedField}
                recipients={recipients}
                onChange={handleFieldChange}
                onDelete={handleFieldDelete}
                onDuplicate={handleDuplicateField}
                numPages={numPages}
                selectedRecipientId={selectedRecipientId}
                onSelectRecipient={handleSelectRecipient}
              />
            </Paper>
          )}

          {/* Recipients Panel */}
          {rightSidebarExpanded && (
            <Paper sx={{
              height: '40%',
              minHeight: 200,
              borderRadius: 2,
              overflow: 'hidden',
              animation: rightSidebarExpanded ? 'fadeInRight 0.3s ease 0.1s' : 'none'
            }}>
              <RecipientsPanel
                recipients={recipients}
                fields={fields}
                disabled={saving || invalidFields.length > 0 || document?.status === 'sent'}
                onAddRecipientClick={() => setAddRecipientDialogOpen(true)}
              />
            </Paper>
          )}
        </Box>
      </Box>

      {/* Finish Dialog */}
      <Dialog open={finishDialogOpen} onClose={() => setFinishDialogOpen(false)} maxWidth="md">
        <DialogTitle>Ready to Send for Signing</DialogTitle>
        <DialogContent>
          <Alert
            severity={invalidFields.length > 0 ? "error" : (unassignedFields.length > 0 ? "warning" : "success")}
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2">
              {invalidFields.length > 0
                ? `${invalidFields.length} incompatible assignments found`
                : unassignedFields.length > 0
                  ? `${unassignedFields.length} unassigned fields`
                  : 'All fields are properly assigned!'
              }
            </Typography>
          </Alert>

          {/* Document Summary */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Document Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{fields.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Total Fields</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {fields.filter(f => f.recipient_id).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Assigned Fields</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color={invalidFields.length > 0 ? "error" : "inherit"}>
                    {invalidFields.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Invalid Assignments</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color={unassignedFields.length > 0 ? "warning" : "inherit"}>
                    {unassignedFields.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Unassigned Fields</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Recipients Summary */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Recipients Summary ({recipients.length})
            </Typography>
            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
              {recipients.map((recipient) => {
                const assignedFields = fields.filter(f => f.recipient_id === recipient.id);
                const invalid = assignedFields.filter(f => getFieldValidationError(f)).length;

                return (
                  // In the FinishDialog recipients list
                  <ListItem key={recipient.id} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Avatar sx={{
                        width: 24,
                        height: 24,
                        bgcolor: getRecipientColor(recipient),
                        fontSize: '0.75rem',
                        color: '#ffffff'
                      }}>
                        {recipient.name?.charAt(0) || 'R'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={recipient.name || `Recipient`}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption">
                            {recipient.email}
                          </Typography>
                          <Chip
                            label={FIELD_ROLES[recipient.role]?.name}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              backgroundColor: `${getRecipientColor(recipient)}20`,
                              color: getRecipientColor(recipient),
                              borderColor: getRecipientColor(recipient)
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {assignedFields.length} field(s)
                            {invalid > 0 && ` (${invalid} invalid)`}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>

          {/* Role Permissions Summary */}
          {/* <Box>
  <Typography variant="subtitle2" gutterBottom>
    Role-Based Permissions
  </Typography>

  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    {Object.values(FIELD_ROLES).map((role) => (
      <Card
        key={role.id}
        variant="outlined"
        sx={{
          p: 1.5,
          width: "100%",
        }}
      >
        <Typography variant="caption" fontWeight={600}>
          {role.name}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
        >
          {role.allowedFields?.map(f => FIELD_TYPES[f]?.label).join(", ") || "No fields"}
        </Typography>
      </Card>
    ))}
  </Box>
</Box> */}

          {/* Add rename button section */}
          <Box sx={{ mt: 3, mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Document Details
              </Typography>
              <Button
                size="small"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setFinishDialogOpen(false);
                  setTimeout(() => setRenameDialogOpen(true), 300);
                }}
                sx={{ textTransform: 'none' }}
              >
                Rename Document
              </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
              <FileText sx={{ color: 'text.secondary' }} />
              <Typography variant="body2">
                Current name: <strong>{document?.filename || 'Untitled Document'}</strong>
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary">
              Click "Rename Document" to change the filename before sending
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>

          <Button onClick={() => setFinishDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={sendInvites}
            variant="contained"
            disabled={saving || invalidFields.length > 0}
            color={invalidFields.length > 0 ? "error" : "primary"}
          >
            {saving ? 'Sending...' : invalidFields.length > 0 ? 'Fix Errors First' : 'Send Invites'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* // Add page navigation UI
{numPages > 1 && (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1, bgcolor: 'background.paper' }}>
    <PageNavigator 
      numPages={numPages} 
      currentPage={currentPage} 
      onPageChange={setCurrentPage} 
    />
  </Box>
)} */}

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        documentId={documentId}
      />

      {/* Add Recipient Dialog */}
      <AddRecipientDialog
        open={addRecipientDialogOpen}
        onClose={() => setAddRecipientDialogOpen(false)}
        onAddRecipient={handleAddRecipient}
        existingRecipients={recipients}
        documentId={documentId}
        disabled={saving || invalidFields.length > 0 || document?.status === 'sent'}
      />

      {/* Floating Action Button for Adding Recipients */}
      {/* <Fab
  color="primary"
  aria-label="add recipient"
  onClick={() => setAddRecipientDialogOpen(true)}
  sx={{
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 1000,
    display: { xs: 'flex', md: 'none' } // Show only on mobile
  }}
>
  <PersonAddIcon />
</Fab> */}

      {/* Desktop Button Group */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Fab
          size="medium"
          color="primary"
          aria-label="add recipient"
          disabled={saving || invalidFields.length > 0 || document?.status === 'sent'}
          onClick={() => setAddRecipientDialogOpen(true)}
          sx={{
            boxShadow: 3,
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: 6
            },
            transition: 'all 0.2s'
          }}
        >
          <PersonAddIcon />
        </Fab>
        {/* <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
    Add Recipient
  </Typography> */}
      </Box>



      {/* Success Dialog */}
      <SuccessDialog
        open={successDialogOpen}
        onClose={handleStayOnPage}
        onNavigateToDashboard={handleNavigateToDashboard}
        onNavigateToDocuments={handleNavigateToDocuments}
        documentName={document?.filename}
        recipientCount={recipients.length}
      />


      {/* Add Unsaved Changes Dialog */}
      <Dialog open={showUnsavedChangesDialog} onClose={() => setShowUnsavedChangesDialog(false)}>
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have unsaved changes that will be lost if you leave this page.
          </Alert>
          <Typography variant="body2">
            Do you want to save your changes before leaving?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowUnsavedChangesDialog(false);
            setPendingNavigation(null);
          }}>
            Cancel
          </Button>
          <Button onClick={() => {
            setShowUnsavedChangesDialog(false);
            navigate(pendingNavigation);
          }} color="warning">
            Leave Without Saving
          </Button>
          <Button
            onClick={handleForceSaveAndNavigate}
            variant="contained"
            disabled={autoSaveStatus.isSaving}
          >
            {autoSaveStatus.isSaving ? 'Saving...' : 'Save & Leave'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Rename Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Rename Document
          </Box>
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              This will rename the document file. Recipients will see the new name.
            </Typography>
          </Alert>

          <TextField
            autoFocus
            fullWidth
            label="Document Name"
            value={newDocumentName}
            onChange={(e) => setNewDocumentName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newDocumentName.trim()) {
                handleRenameDocument();
              }
            }}
            placeholder="Enter document name"
            helperText=".pdf extension will be added automatically"
            disabled={renaming}
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setRenameDialogOpen(false)}
            disabled={renaming}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRenameDocument}
            disabled={!newDocumentName.trim() || renaming}
            startIcon={renaming ? <CircularProgress size={20} /> : null}
          >
            {renaming ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogActions>
      </Dialog>





    </Box>


  );
};

export default DocumentBuilder;