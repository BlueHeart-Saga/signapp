import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControlLabel,
  Switch,
  Tooltip,
  Avatar,
  Badge,
  Drawer,
  Toolbar,
  AppBar,
  Fab,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Link,
  Fade,
  Zoom,
  Grow,
  CircularProgress,
  Tabs,
  Tab,
  RadioGroup,
  Radio,
  Checkbox,
  Slider,
  Rating,
  AlertTitle,
  useTheme,
  alpha,
  TabContext,
  TabList,
  TabPanel,
  Popover
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  SmartToy as AIIcon,
  AutoFixHigh as AutoFixIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  TextFields as TextFieldsIcon,
  CalendarToday as DateIcon,
  Create as SignatureIcon,
  CheckBox as CheckboxIcon,
  RadioButtonChecked as RadioIcon,
  ArrowDropDown as DropdownIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Numbers as NumberIcon,
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CloudUpload as CloudUploadIcon,
  Assistant as AssistantIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  AttachFile as AttachIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  TextFormat as TextFormatIcon,
  BorderAll as BorderIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Share as ShareIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  ArrowForward as ArrowForwardIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Clear as CloseIcon,
  ViewSidebar as ViewSidebarIcon,
  Dashboard as DashboardIcon,
  ViewModule as ViewModuleIcon,
  ViewStream as ViewStreamIcon,
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  Pause as PauseIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Terminal as TerminalIcon,
  DataObject as DataObjectIcon,
  Functions as FunctionsIcon,
  IntegrationInstructions as IntegrationInstructionsIcon,
  Javascript as JavascriptIcon,
  Html as HtmlIcon,
  Css as CssIcon,
  Api as ApiIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Psychology as PsychologyIcon,
  RocketLaunch as RocketLaunchIcon,
  AutoAwesome as AutoAwesomeIcon,
  Construction as ConstructionIcon,
  Engineering as EngineeringIcon,
  Science as ScienceIcon,
  Biotech as BiotechIcon,
  PsychologyAlt as PsychologyAltIcon,
  EmojiObjects as EmojiObjectsIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Menu as MenuIcon,
  PictureInPicture as PictureInPictureIcon,
  History as HistoryIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  RemoveRedEye as RemoveRedEyeIcon
} from '@mui/icons-material';
import { DndProvider } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DocumentMainLayout from './editor/DocumentMainLayout';
import { useAuth } from '../context/AuthContext';
import SubscriptionExpiredBlock from '../components/SubscriptionExpiredBlock';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

// ============================================
// API Service Layer
// ============================================

class TemplateAPIService {
  static async getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async generateAITemplate(data) {
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/generate`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Generation failed');
    }

    return await response.json();
  }

  static async generateAIWorkflow(data) {
    const response = await fetch(`${API_BASE_URL}/api/ai/workflow/generate`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Workflow generation failed');
    }

    return await response.json();
  }

  static async analyzeDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/analyze-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Analysis failed');
    }

    return await response.json();
  }

  static async suggestSmartFields(templateContent) {
    const formData = new FormData();
    formData.append('template_content', templateContent);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/smart-fields`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    return await response.json();
  }

  static async getTemplateEditMode(templateId) {
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/templates/${templateId}/edit-mode`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch edit mode');
    }

    return await response.text();
  }

  static async getTemplatePreviewMode(templateId) {
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/templates/${templateId}/preview-mode`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch preview mode');
    }

    return await response.text();
  }

  static async getTemplateWithMode(templateId, mode = 'preview') {
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/templates/${templateId}?mode=${mode}`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch template in ${mode} mode`);
    }

    return await response.text();
  }

  static async updateTemplateContent(templateId, content) {
    const formData = new FormData();
    formData.append('content', content);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/templates/${templateId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Update failed');
    }

    return await response.json();
  }

  static async addFieldToTemplate(templateId, fieldData) {
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/templates/${templateId}/fields`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(fieldData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add field');
    }

    return await response.json();
  }

  static async saveTemplate(templateData) {
    const response = await fetch(`${API_BASE_URL}/api/templates`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(templateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Save failed');
    }

    return await response.json();
  }

  static async updateTemplate(templateId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      return await response.json();
    } catch (error) {
      // Try alternative endpoint
      const response = await fetch(`${API_BASE_URL}/api/ai/templates/templates/${templateId}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Update failed');
      }

      return await response.json();
    }
  }

  static async exportTemplate(templateId, format = 'html') {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/templates/export-template/${templateId}?format=${format}`,
        {
          method: 'GET',
          headers: await this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'html') {
        return await response.text();
      } else {
        return await response.json();
      }
    } catch (error) {
      // Try alternative endpoint
      const response = await fetch(
        `${API_BASE_URL}/api/templates/${templateId}/export?format=${format}`,
        {
          method: 'GET',
          headers: await this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'html') {
        return await response.text();
      } else {
        return await response.json();
      }
    }
  }

  static async getTemplateVersions(templateId) {
    const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}/versions`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch versions');
    }

    return await response.json();
  }

  static async restoreTemplateVersion(templateId, versionId) {
    const response = await fetch(
      `${API_BASE_URL}/api/templates/${templateId}/versions/${versionId}/restore`,
      {
        method: 'POST',
        headers: await this.getAuthHeaders()
      }
    );

    if (!response.ok) {
      throw new Error('Failed to restore version');
    }

    return await response.json();
  }

  static async autoSaveTemplate(templateId, content, fields) {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('fields', JSON.stringify(fields));
    formData.append('timestamp', new Date().toISOString());

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/templates/${templateId}/autosave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      console.warn('Auto-save failed');
      return null;
    }

    return await response.json();
  }
  static async autoPositionFields(templateContent, fields) {
    const formData = new FormData();
    formData.append('template_content', templateContent);
    formData.append('fields_data', JSON.stringify(fields));

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/auto-position-fields`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Auto-positioning failed');
    }

    return await response.json();
  }

  static async detectAndPositionPlaceholders(templateContent) {
    const formData = new FormData();
    formData.append('template_content', templateContent);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/ai/templates/detect-and-position-placeholders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Placeholder detection failed');
    }

    return await response.json();
  }
}

// ============================================
// Field Types and Constants
// ============================================

const FIELD_TYPES = {
  text: {
    type: 'text',
    label: 'Text Field',
    icon: <TextFieldsIcon />,
    color: '#2196F3',
    defaultWidth: 200,
    defaultHeight: 40,
    placeholder: 'Enter text...'
  },
  date: {
    type: 'date',
    label: 'Date Field',
    icon: <DateIcon />,
    color: '#4CAF50',
    defaultWidth: 150,
    defaultHeight: 40,
    placeholder: 'Select date...'
  },
  signature: {
    type: 'signature',
    label: 'Signature',
    icon: <SignatureIcon />,
    color: '#F44336',
    defaultWidth: 200,
    defaultHeight: 80,
    placeholder: 'Sign here'
  },
  email: {
    type: 'email',
    label: 'Email Field',
    icon: <EmailIcon />,
    color: '#FF9800',
    defaultWidth: 250,
    defaultHeight: 40,
    placeholder: 'email@example.com'
  },
  phone: {
    type: 'phone',
    label: 'Phone Field',
    icon: <PhoneIcon />,
    color: '#607D8B',
    defaultWidth: 180,
    defaultHeight: 40,
    placeholder: '(123) 456-7890'
  },
  number: {
    type: 'number',
    label: 'Number Field',
    icon: <NumberIcon />,
    color: '#795548',
    defaultWidth: 150,
    defaultHeight: 40,
    placeholder: '0'
  },
  textarea: {
    type: 'textarea',
    label: 'Text Area',
    icon: <AlignLeftIcon />,
    color: '#2196F3',
    defaultWidth: 300,
    defaultHeight: 100,
    placeholder: 'Enter text here...'
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    icon: <CheckboxIcon />,
    color: '#9C27B0',
    defaultWidth: 120,
    defaultHeight: 40,
    placeholder: ''
  },
  dropdown: {
    type: 'dropdown',
    label: 'Dropdown',
    icon: <DropdownIcon />,
    color: '#00BCD4',
    defaultWidth: 180,
    defaultHeight: 40,
    placeholder: 'Select option...'
  }
};

// Helper function to render field components
const getFieldComponent = (fieldType, fieldData, isPreview = false) => {
  const config = FIELD_TYPES[fieldType];

  switch (fieldType) {
    case 'text':
      return (
        <TextField
          placeholder={fieldData.placeholder || config.placeholder}
          variant="outlined"
          size="small"
          fullWidth
          disabled={isPreview}
        />
      );
    case 'email':
      return (
        <TextField
          placeholder={fieldData.placeholder || config.placeholder}
          variant="outlined"
          size="small"
          type="email"
          fullWidth
          disabled={isPreview}
        />
      );
    case 'date':
      return (
        <TextField
          placeholder={fieldData.placeholder || config.placeholder}
          variant="outlined"
          size="small"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          disabled={isPreview}
        />
      );
    case 'textarea':
      return (
        <TextField
          placeholder={fieldData.placeholder || config.placeholder}
          variant="outlined"
          multiline
          rows={3}
          fullWidth
          disabled={isPreview}
        />
      );
    case 'signature':
      return (
        <Paper
          sx={{
            width: '100%',
            height: 80,
            border: '1px dashed #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isPreview ? 'default' : 'pointer'
          }}
        >
          <Typography color="text.secondary">
            {fieldData.placeholder || 'Click to sign'}
          </Typography>
        </Paper>
      );
    case 'dropdown':
      return (
        <Select
          placeholder={fieldData.placeholder || config.placeholder}
          variant="outlined"
          size="small"
          fullWidth
          displayEmpty
          disabled={isPreview}
        >
          <MenuItem value="" disabled>
            {fieldData.placeholder || config.placeholder}
          </MenuItem>
          {(fieldData.options || ['Option 1', 'Option 2', 'Option 3']).map((option, idx) => (
            <MenuItem key={idx} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      );
    case 'checkbox':
      return (
        <FormControlLabel
          control={<Checkbox disabled={isPreview} />}
          label={fieldData.label || 'Checkbox'}
        />
      );
    default:
      return (
        <TextField
          placeholder={fieldData.placeholder || config.placeholder}
          variant="outlined"
          size="small"
          fullWidth
          disabled={isPreview}
        />
      );
  }
};

// ============================================
// Live Preview Component (Small Corner Preview)
// ============================================

const LivePreview = ({ templateContent, fields, open, onClose, position = 'bottom-right' }) => {
  const previewRef = useRef(null);

  const positions = {
    'top-right': { top: 80, right: 20 },
    'top-left': { top: 80, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 }
  };

  if (!open) return null;

  return (
    <Box
      ref={previewRef}
      sx={{
        position: 'fixed',
        ...positions[position],
        width: 300,
        height: 400,
        zIndex: 9999,
        bgcolor: 'white',
        boxShadow: 24,
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{
        p: 1,
        bgcolor: 'primary.main',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="caption" fontWeight="bold">
          Live Preview
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Box sx={{
          transform: 'scale(0.3)',
          transformOrigin: 'top left',
          width: '8.5in',
          minHeight: '11in',
          bgcolor: 'white',
          border: '1px solid #ddd'
        }}>
          <Box sx={{ p: '1in' }}>
            {templateContent ? (
              <Box
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  lineHeight: 1.6
                }}
                dangerouslySetInnerHTML={{ __html: templateContent }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No content yet
              </Typography>
            )}

            {fields.map((field) => (
              <Box
                key={field.id}
                sx={{
                  position: 'absolute',
                  left: (field.position?.x || 0) + 96,
                  top: (field.position?.y || 0) + 96,
                  width: (field.style?.width || FIELD_TYPES[field.type]?.defaultWidth || 200) * 0.3,
                  pointerEvents: 'none'
                }}
              >
                <Paper
                  sx={{
                    p: 0.5,
                    bgcolor: 'white',
                    border: '1px solid #ddd',
                    transform: 'scale(0.3)',
                    transformOrigin: 'top left'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    {field.label || field.name}
                  </Typography>
                  {getFieldComponent(field.type, field, true)}
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================
// AutoSave Manager Hook
// ============================================

const useAutoSave = (templateId, templateContent, fields, onSaveSuccess) => {
  const [isSaving, setIsSaving] = useState(false);
  const lastContentRef = useRef(templateContent);
  const lastFieldsRef = useRef(fields);
  const saveTimeoutRef = useRef(null);

  const autoSave = useCallback(async () => {
    if (!templateId) return;

    const contentChanged = lastContentRef.current !== templateContent;
    const fieldsChanged = JSON.stringify(lastFieldsRef.current) !== JSON.stringify(fields);

    if (!contentChanged && !fieldsChanged) return;

    setIsSaving(true);
    try {
      await TemplateAPIService.autoSaveTemplate(templateId, templateContent, fields);

      lastContentRef.current = templateContent;
      lastFieldsRef.current = JSON.parse(JSON.stringify(fields));

      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.warn('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [templateId, templateContent, fields, onSaveSuccess]);

  useEffect(() => {
    if (!templateId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [templateContent, fields, templateId, autoSave]);

  useEffect(() => {
    if (!templateId) return;

    const interval = setInterval(() => {
      autoSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [templateId, autoSave]);

  return { isSaving };
};

// ============================================
// Document Canvas Component (Edit Mode)
// ============================================

const DocumentCanvas = ({
  mode = 'edit',
  templateId,
  fields = [],
  selectedFieldId,
  onFieldSelect,
  onFieldDelete,
  onFieldMove,
  onFieldAdd,
  onFieldAddFromLibrary,
  templateContent = '',
  onTemplateContentChange,
  showLivePreview,
  onToggleLivePreview
}) => {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState(null);
  const [draggingField, setDraggingField] = useState(null);
  const containerRef = useRef(null);
  const contentEditableRef = useRef(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setScale(1);

  const handleContentChange = () => {
    if (contentEditableRef.current && onTemplateContentChange) {
      const newContent = contentEditableRef.current.innerHTML;
      onTemplateContentChange(newContent);
    }
  };

  const handleDragStart = (e, field) => {
    e.dataTransfer.setData('fieldId', field.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    setDraggingField(field);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggingField(null);
    setDropPosition(null);
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - 96;
    const y = e.clientY - rect.top - 96;

    const fieldType = e.dataTransfer.getData('fieldType');
    if (fieldType && onFieldAddFromLibrary) {
      onFieldAddFromLibrary(fieldType, { x, y });
    }

    const fieldId = e.dataTransfer.getData('fieldId');
    if (fieldId && onFieldMove) {
      onFieldMove(fieldId, { x, y });
    }

    setIsDragging(false);
    setDropPosition(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 96;
    const y = e.clientY - rect.top - 96;

    setDropPosition({ x, y });
  };

  useEffect(() => {
    if (contentEditableRef.current && mode === 'edit') {
      contentEditableRef.current.innerHTML = templateContent || '';
    }
  }, [templateContent, mode]);

  const renderEditMode = () => (
    <>
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: '#f8f9fa',
          position: 'relative'
        }}
        onDrop={handleCanvasDrop}
        onDragOver={handleDragOver}
      >
        {isDragging && dropPosition && (
          <Box
            sx={{
              position: 'absolute',
              left: dropPosition.x + 96,
              top: dropPosition.y + 96,
              width: 150,
              height: 50,
              border: '2px dashed #2196F3',
              backgroundColor: alpha('#2196F3', 0.1),
              pointerEvents: 'none',
              zIndex: 1000,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Typography variant="caption" color="#2196F3">
              Drop here
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: '8.5in',
            minHeight: '11in',
            margin: '2rem auto',
            bgcolor: 'white',
            boxShadow: 3,
            position: 'relative'
          }}
        >
          <Box
            ref={contentEditableRef}
            sx={{
              p: '1in',
              minHeight: '11in',
              outline: 'none',
              cursor: 'text'
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentChange}
            onBlur={handleContentChange}
          >
            {!templateContent && (
              <Typography color="text.secondary">
                Start typing here... Drag fields from the library.
              </Typography>
            )}
          </Box>

          {fields.map((field) => (
            <Box
              key={field.id}
              sx={{
                position: 'absolute',
                left: (field.position?.x || 0) + 96,
                top: (field.position?.y || 0) + 96,
                width: field.style?.width || FIELD_TYPES[field.type]?.defaultWidth || 200,
                zIndex: selectedFieldId === field.id ? 100 : 50,
                cursor: 'move',
                '&:hover': {
                  outline: `2px solid ${alpha(FIELD_TYPES[field.type]?.color || '#2196F3', 0.3)}`
                }
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, field)}
              onDragEnd={handleDragEnd}
              onClick={(e) => {
                e.stopPropagation();
                onFieldSelect(field.id);
              }}
            >
              <Paper
                sx={{
                  p: 1,
                  border: `2px solid ${selectedFieldId === field.id ? FIELD_TYPES[field.type]?.color || '#2196F3' : '#e0e0e0'}`,
                  backgroundColor: selectedFieldId === field.id ? alpha(FIELD_TYPES[field.type]?.color || '#2196F3', 0.1) : 'white',
                  '&:hover': {
                    boxShadow: 2
                  }
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  {field.label || field.name}
                </Typography>
                {getFieldComponent(field.type, field)}
              </Paper>
            </Box>
          ))}

          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `linear-gradient(to right, ${alpha('#000', 0.05)} 1px, transparent 1px),
                               linear-gradient(to bottom, ${alpha('#000', 0.05)} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              pointerEvents: 'none'
            }}
          />
        </Box>
      </Box>
    </>
  );

  const renderPreviewMode = () => (
    <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'white' }}>
      <Box
        sx={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: '8.5in',
          minHeight: '11in',
          margin: '2rem auto',
          bgcolor: 'white',
          boxShadow: 3,
          position: 'relative'
        }}
      >
        <Box sx={{ p: '1in', minHeight: '11in' }}>
          {templateContent ? (
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 1.6
              }}
              dangerouslySetInnerHTML={{ __html: templateContent }}
            />
          ) : (
            <Typography color="text.secondary">
              No content yet
            </Typography>
          )}

          {fields.map((field) => (
            <Box
              key={field.id}
              sx={{
                position: 'absolute',
                left: (field.position?.x || 0) + 96,
                top: (field.position?.y || 0) + 96,
                width: field.style?.width || FIELD_TYPES[field.type]?.defaultWidth || 200,
                pointerEvents: 'none'
              }}
            >
              <Paper sx={{ p: 1, bgcolor: 'white', border: '1px solid #ddd' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  {field.label || field.name}
                </Typography>
                {getFieldComponent(field.type, field, true)}
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton size="small" onClick={handleZoomOut}>
          <ZoomOutIcon />
        </IconButton>
        <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </Typography>
        <IconButton size="small" onClick={handleZoomIn}>
          <ZoomInIcon />
        </IconButton>
        <IconButton size="small" onClick={handleResetZoom}>
          <RefreshIcon />
        </IconButton>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <Tooltip title="Toggle Live Preview">
          <IconButton
            size="small"
            onClick={onToggleLivePreview}
            color={showLivePreview ? 'primary' : 'default'}
          >
            <PictureInPictureIcon />
          </IconButton>
        </Tooltip>

        <Typography variant="body2" color="text.secondary">
          {mode === 'edit' ? 'Edit Mode - Click to edit text, drag to move fields' : 'Preview Mode'}
        </Typography>
      </Box>

      {mode === 'edit' ? renderEditMode() : renderPreviewMode()}
    </Box>
  );
};

// ============================================
// Field Properties Panel
// ============================================

const FieldPropertiesPanel = ({ field, onChange, onDelete }) => {
  const [fieldName, setFieldName] = useState(field?.name || '');
  const [fieldLabel, setFieldLabel] = useState(field?.label || '');
  const [placeholder, setPlaceholder] = useState(field?.placeholder || '');
  const [required, setRequired] = useState(field?.required || false);
  const [options, setOptions] = useState(field?.options?.join(', ') || '');
  const [positionX, setPositionX] = useState(field?.position?.x || 0);
  const [positionY, setPositionY] = useState(field?.position?.y || 0);
  const [width, setWidth] = useState(field?.style?.width || FIELD_TYPES[field?.type]?.defaultWidth || 200);
  const [height, setHeight] = useState(field?.style?.height || FIELD_TYPES[field?.type]?.defaultHeight || 40);

  useEffect(() => {
    if (field) {
      setFieldName(field.name || '');
      setFieldLabel(field.label || '');
      setPlaceholder(field.placeholder || '');
      setRequired(field.required || false);
      setOptions(field.options?.join(', ') || '');
      setPositionX(field.position?.x || 0);
      setPositionY(field.position?.y || 0);
      setWidth(field.style?.width || FIELD_TYPES[field.type]?.defaultWidth || 200);
      setHeight(field.style?.height || FIELD_TYPES[field.type]?.defaultHeight || 40);
    }
  }, [field]);

  const handlePropertyChange = (property, value) => {
    if (field && onChange) {
      onChange(field.id, { [property]: value });
    }
  };

  if (!field) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <DragIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">
            Select a field to edit properties
          </Typography>
        </Box>
      </Paper>
    );
  }

  const fieldConfig = FIELD_TYPES[field.type] || FIELD_TYPES.text;

  return (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: fieldConfig.color, mr: 2 }}>
          {fieldConfig.icon}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">{fieldConfig.label}</Typography>
          <Typography variant="caption" color="text.secondary">
            {field.name}
          </Typography>
        </Box>
        <IconButton onClick={() => onDelete(field.id)} color="error" size="small">
          <DeleteIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Field Name"
            value={fieldName}
            onChange={(e) => {
              setFieldName(e.target.value);
              handlePropertyChange('name', e.target.value);
            }}
            size="small"
            helperText="Used for data binding"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Field Label"
            value={fieldLabel}
            onChange={(e) => {
              setFieldLabel(e.target.value);
              handlePropertyChange('label', e.target.value);
            }}
            size="small"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Placeholder"
            value={placeholder}
            onChange={(e) => {
              setPlaceholder(e.target.value);
              handlePropertyChange('placeholder', e.target.value);
            }}
            size="small"
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Position X"
            type="number"
            value={positionX}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setPositionX(value);
              handlePropertyChange('position', { ...field.position, x: value });
            }}
            size="small"
            InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Position Y"
            type="number"
            value={positionY}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setPositionY(value);
              handlePropertyChange('position', { ...field.position, y: value });
            }}
            size="small"
            InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Width"
            type="number"
            value={width}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 200;
              setWidth(value);
              handlePropertyChange('style', { ...field.style, width: value });
            }}
            size="small"
            InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Height"
            type="number"
            value={height}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 40;
              setHeight(value);
              handlePropertyChange('style', { ...field.style, height: value });
            }}
            size="small"
            InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }}
          />
        </Grid>

        {field.type === 'dropdown' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Options"
              value={options}
              onChange={(e) => {
                const value = e.target.value;
                setOptions(value);
                const optionsArray = value.split(',').map(opt => opt.trim()).filter(opt => opt);
                handlePropertyChange('options', optionsArray);
              }}
              size="small"
              helperText="Comma-separated list of options"
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={required}
                onChange={(e) => {
                  setRequired(e.target.checked);
                  handlePropertyChange('required', e.target.checked);
                }}
              />
            }
            label="Required Field"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

// ============================================
// Draggable Field Item
// ============================================

const DraggableFieldItem = ({ fieldType, onAddField }) => {
  const config = FIELD_TYPES[fieldType];

  const handleDragStart = (e) => {
    e.dataTransfer.setData('fieldType', fieldType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Paper
      draggable
      onDragStart={handleDragStart}
      onClick={() => onAddField && onAddField(fieldType)}
      sx={{
        p: 2,
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        cursor: 'grab',
        backgroundColor: 'white',
        border: `1px solid ${config.color}`,
        '&:hover': {
          backgroundColor: '#f5f5f5',
          transform: 'translateX(4px)'
        },
        transition: 'all 0.2s ease',
        '&:active': {
          cursor: 'grabbing'
        }
      }}
    >
      <DragIcon sx={{ color: 'action.active' }} />
      <Avatar sx={{ bgcolor: config.color, width: 32, height: 32 }}>
        {config.icon}
      </Avatar>
      <Typography variant="body2">{config.label}</Typography>
    </Paper>
  );
};

// ============================================
// AI Smart Field Suggestions
// ============================================

const AISmartFieldSuggestions = ({ templateContent, onApplySuggestions }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeContent = async () => {
    if (!templateContent?.trim()) {
      setError('Please enter template content first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await TemplateAPIService.suggestSmartFields(templateContent);
      setSuggestions(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AssistantIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">AI Field Suggestions</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Let AI analyze your template and suggest appropriate fields to add.
      </Typography>

      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={20} /> : <PsychologyIcon />}
        onClick={analyzeContent}
        disabled={loading}
        fullWidth
        sx={{ mb: 2 }}
      >
        {loading ? 'Analyzing...' : 'Analyze Template'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {suggestions?.fields?.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Suggested Fields ({suggestions.fields.length})
          </Typography>
          <List dense>
            {suggestions.fields.slice(0, 5).map((field, idx) => (
              <ListItem
                key={idx}
                secondaryAction={
                  <IconButton edge="end" onClick={() => onApplySuggestions(field)}>
                    <AddIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: FIELD_TYPES[field.type]?.color || '#2196F3', width: 24, height: 24 }}>
                    {FIELD_TYPES[field.type]?.icon || <TextFieldsIcon fontSize="small" />}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={field.label}
                  secondary={`${field.type} field`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
};

// ============================================
// Main Template Builder Component
// ============================================

const TemplateBuilder = ({ template, onSave, onBack }) => {
  const [mode, setMode] = useState('edit');
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [fields, setFields] = useState([]);
  const [templateName, setTemplateName] = useState(template?.title || 'Untitled Template');
  const [templateContent, setTemplateContent] = useState(template?.content || '');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [templateId, setTemplateId] = useState(template?.template_id || null);
  const [version, setVersion] = useState(template?.version || 1);
  const [fieldLibraryOpen, setFieldLibraryOpen] = useState(true);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);

  // Initialize fields from template
  useEffect(() => {
    if (template?.fields && Array.isArray(template.fields)) {
      const initializedFields = template.fields.map(field => ({
        ...field,
        id: field.id || `field_${Date.now()}_${Math.random()}`,
        position: field.position || { x: 50, y: 50 },
        style: field.style || {
          width: FIELD_TYPES[field.type]?.defaultWidth || 200,
          height: FIELD_TYPES[field.type]?.defaultHeight || 40
        }
      }));
      setFields(initializedFields);
    }
  }, [template]);

  // Use auto-save
  const { isSaving } = useAutoSave(
    templateId,
    templateContent,
    fields,
    () => {
      setLastSaveTime(new Date());
      setVersion(prev => prev + 0.1);
    }
  );

  const handleFieldSelect = (fieldId) => {
    setSelectedFieldId(fieldId);
  };

  const handleFieldChange = (fieldId, updates) => {
    setFields(prev => prev.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const handleFieldDelete = (fieldId) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
    showSnackbar('Field deleted', 'info');
  };

  const handleAddField = (fieldType, position = { x: 50, y: 50 }) => {
    const fieldConfig = FIELD_TYPES[fieldType];
    const newField = {
      id: `field_${Date.now()}_${Math.random()}`,
      type: fieldType,
      name: `${fieldType}_${fields.length + 1}`,
      label: `${fieldConfig.label} ${fields.length + 1}`,
      placeholder: fieldConfig.placeholder,
      required: false,
      position,
      style: {
        width: fieldConfig.defaultWidth,
        height: fieldConfig.defaultHeight
      }
    };

    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
    showSnackbar(`Added ${fieldConfig.label}`, 'success');
  };

  const handleFieldMove = (fieldId, position) => {
    setFields(prev => prev.map(field =>
      field.id === fieldId ? { ...field, position } : field
    ));
  };

  const handleAddFieldFromLibrary = (fieldType, position) => {
    handleAddField(fieldType, position);
  };

  const handleApplyAISuggestions = (field) => {
    const newField = {
      id: `field_${Date.now()}_${Math.random()}`,
      type: field.type,
      name: field.name || `${field.type}_${fields.length + 1}`,
      label: field.label || `${FIELD_TYPES[field.type]?.label || 'Field'} ${fields.length + 1}`,
      placeholder: field.placeholder || '',
      required: field.required || false,
      position: { x: 50, y: 50 + (fields.length * 60) },
      style: {
        width: FIELD_TYPES[field.type]?.defaultWidth || 200,
        height: FIELD_TYPES[field.type]?.defaultHeight || 40
      }
    };

    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
    showSnackbar('Added field from AI suggestion', 'success');
  };

  const handleAutoPositionFields = async () => {
    try {
      setLoading(true);

      const result = await TemplateAPIService.autoPositionFields(templateContent, fields);

      if (result.fields && result.fields.length > 0) {
        // Update fields with new positions
        const updatedFields = fields.map(field => {
          const positionedField = result.fields.find(f => f.name === field.name);
          if (positionedField) {
            return {
              ...field,
              position: {
                x: positionedField.x_position || field.position?.x || 50,
                y: positionedField.y_position || field.position?.y || 50
              },
              style: {
                ...field.style,
                width: positionedField.width ? positionedField.width * 8 : field.style?.width || 200,
                height: positionedField.height ? positionedField.height * 4 : field.style?.height || 40
              }
            };
          }
          return field;
        });

        setFields(updatedFields);
        showSnackbar(`Auto-positioned ${result.fields.length} fields`, 'success');
      }
    } catch (error) {
      showSnackbar(`Auto-positioning failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectPlaceholders = async () => {
    try {
      setLoading(true);

      const result = await TemplateAPIService.detectAndPositionPlaceholders(templateContent);

      if (result.suggested_fields && result.suggested_fields.length > 0) {
        // Add new fields based on detected placeholders
        const newFields = result.suggested_fields.map(field => ({
          id: `field_${Date.now()}_${Math.random()}`,
          type: field.type || 'text',
          name: field.name,
          label: field.label || field.name.replace('_', ' ').title(),
          placeholder: field.placeholder || '',
          required: field.required !== false,
          position: {
            x: field.x_position || 50,
            y: field.y_position || 50
          },
          style: {
            width: (field.width || 30) * 8,
            height: (field.height || 5) * 4,
            backgroundColor: '#FFFFFF'
          }
        }));

        setFields(prev => [...prev, ...newFields]);
        showSnackbar(`Detected and added ${newFields.length} fields`, 'success');
      }
    } catch (error) {
      showSnackbar(`Placeholder detection failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    try {
      const templateData = {
        title: templateName,
        content: templateContent,
        template_type: template?.template_type || 'contract',
        fields: fields.map(field => ({
          name: field.name,
          label: field.label,
          field_type: field.type,
          required: field.required,
          placeholder: field.placeholder,
          options: field.options,
          style: field.style,
          position: field.position
        }))
      };

      let savedTemplate;

      if (templateId) {
        savedTemplate = await TemplateAPIService.updateTemplate(templateId, templateData);
      } else {
        savedTemplate = await TemplateAPIService.saveTemplate(templateData);
        setTemplateId(savedTemplate._id || savedTemplate.id);
      }

      setVersion(prev => Math.floor(prev) + 1);
      setLastSaveTime(new Date());
      showSnackbar('Template saved successfully!', 'success');
      if (onSave) onSave(savedTemplate);
    } catch (error) {
      showSnackbar(`Save failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!templateId) {
      showSnackbar('Please save the template first', 'warning');
      return;
    }

    try {
      const result = await TemplateAPIService.exportTemplate(templateId, format);

      if (format === 'html') {
        const blob = new Blob([result], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateName}.html`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateName}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      showSnackbar(`Exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      showSnackbar(`Export failed: ${error.message}`, 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '90vh' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton edge="start" sx={{ mr: 2 }} onClick={onBack}>
              <BackIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Template Name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                sx={{ minWidth: 300 }}
              />

              <Tooltip title={`Version ${version.toFixed(1)}`}>
                <Chip
                  label={`v${version.toFixed(1)}`}
                  size="small"
                  variant="outlined"
                  color={isSaving ? "warning" : "default"}
                  icon={isSaving ? <CircularProgress size={16} /> : undefined}
                />
              </Tooltip>

              <Chip label={`${fields.length} fields`} size="small" color="primary" />
              <Chip label={mode === 'edit' ? 'Edit Mode' : 'Preview Mode'}
                color={mode === 'edit' ? 'primary' : 'secondary'} size="small" />

              {lastSaveTime && (
                <Typography variant="caption" color="text.secondary">
                  Last save: {lastSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>

              <Tooltip title="Auto-position Fields">
                <Button
                  variant="outlined"
                  startIcon={<AutoFixIcon />}
                  onClick={handleAutoPositionFields}
                  disabled={fields.length === 0}
                  size="small"
                >
                  Auto-Position
                </Button>
              </Tooltip>

              <Tooltip title="Detect Placeholders">
                <Button
                  variant="outlined"
                  startIcon={<AssistantIcon />}
                  onClick={handleDetectPlaceholders}
                  disabled={!templateContent}
                  size="small"
                >
                  Detect Fields
                </Button>
              </Tooltip>
              <Tooltip title="Version History">
                <IconButton onClick={() => setShowVersions(true)}>
                  <HistoryIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={mode === 'edit' ? 'Switch to Preview' : 'Switch to Edit'}>
                <IconButton
                  onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
                  color={mode === 'edit' ? 'primary' : 'secondary'}
                >
                  {mode === 'edit' ? <PreviewIcon /> : <EditIcon />}
                </IconButton>
              </Tooltip>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('html')}
                sx={{ mr: 1 }}
              >
                Export
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveTemplate}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {fieldLibraryOpen && (
            <Drawer
              variant="persistent"
              open={fieldLibraryOpen}
              sx={{
                width: 280,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: 280,
                  position: 'relative',
                  borderRight: '1px solid #e0e0e0'
                }
              }}
            >
              <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Field Library</Typography>
                <IconButton size="small" onClick={() => setFieldLibraryOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Toolbar>
              <Box sx={{ overflow: 'auto', p: 2, height: '100%' }}>
                <AISmartFieldSuggestions
                  templateContent={templateContent}
                  onApplySuggestions={handleApplyAISuggestions}
                />

                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Basic Fields</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {['text', 'email', 'phone', 'number', 'date', 'textarea'].map(type => (
                      <DraggableFieldItem
                        key={type}
                        fieldType={type}
                        onAddField={handleAddField}
                      />
                    ))}
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Signature Fields</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {['signature'].map(type => (
                      <DraggableFieldItem
                        key={type}
                        fieldType={type}
                        onAddField={handleAddField}
                      />
                    ))}
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Selection Fields</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {['checkbox', 'dropdown'].map(type => (
                      <DraggableFieldItem
                        key={type}
                        fieldType={type}
                        onAddField={handleAddField}
                      />
                    ))}
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Drawer>
          )}

          {!fieldLibraryOpen && (
            <Box sx={{ position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1000 }}>
              <IconButton onClick={() => setFieldLibraryOpen(true)} color="primary">
                <MenuIcon />
              </IconButton>
            </Box>
          )}

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {loading && <LinearProgress />}

            <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
              <Paper sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <DocumentCanvas
                  mode={mode}
                  templateId={templateId}
                  fields={fields}
                  selectedFieldId={selectedFieldId}
                  onFieldSelect={handleFieldSelect}
                  onFieldDelete={handleFieldDelete}
                  onFieldMove={handleFieldMove}
                  onFieldAdd={handleAddField}
                  onFieldAddFromLibrary={handleAddFieldFromLibrary}
                  templateContent={templateContent}
                  onTemplateContentChange={setTemplateContent}
                  showLivePreview={showLivePreview}
                  onToggleLivePreview={() => setShowLivePreview(!showLivePreview)}
                />
              </Paper>
            </Box>
          </Box>

          <Drawer
            variant="permanent"
            anchor="right"
            sx={{
              width: 320,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 320,
                position: 'relative',
                borderLeft: '1px solid #e0e0e0'
              }
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto', height: '100%' }}>
              <FieldPropertiesPanel
                field={selectedField}
                onChange={handleFieldChange}
                onDelete={handleFieldDelete}
              />
            </Box>
          </Drawer>
        </Box>

        {/* Live Preview */}
        <LivePreview
          templateContent={templateContent}
          fields={fields}
          open={showLivePreview}
          onClose={() => setShowLivePreview(false)}
          position="bottom-right"
        />

        {/* Version History Dialog */}
        <Dialog open={showVersions} onClose={() => setShowVersions(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <HistoryIcon />
              <Typography variant="h6">Version History</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <List>
              {versions.map((versionData) => (
                <ListItem
                  key={versionData.id}
                  secondaryAction={
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        // Handle restore version
                        setShowVersions(false);
                      }}
                    >
                      Restore
                    </Button>
                  }
                >
                  <ListItemIcon>
                    <RadioButtonUncheckedIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Version ${versionData.version}`}
                    secondary={new Date(versionData.created_at).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowVersions(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </DndProvider>
  );
};

// ============================================
// Constants and Suggestions
// ============================================

const PROMPT_SUGGESTIONS = [
  {
    category: "Employment & HR", prompts: [
      "Full-time Employment Contract with salary, benefits, and termination clauses.",
      "Mutual Non-Disclosure Agreement (NDA) for business partnership exploration.",
      "Independent Contractor Agreement for a freelance developer with IP clauses.",
      "Job Offer Letter including base salary, stock options, and start date.",
      "Employee Resignation Letter with notice period and hand-over details.",
      "Work for Hire Agreement for creative assets ownership.",
      "Employee Handbook with conduct, leave, and safety policies.",
      "Formal Warning Letter for performance or conduct issues.",
      "Internship Agreement including learning goals and stipend details.",
      "Mutual Separation Agreement with severance package terms."
    ]
  },
  {
    category: "Real Estate & Lease", prompts: [
      "Residential Lease Agreement with security deposit and pet policies.",
      "Commercial Lease Agreement for retail space in a shopping mall.",
      "Property Management Agreement between homeowner and agency.",
      "Sublet Agreement for a residential apartment unit.",
      "Notice to Quit or Eviction Notice for late rent payments.",
      "Quitclaim Deed for property transfer as a family gift.",
      "Residential Rental Application with credit check authorization.",
      "Real Estate Purchase Agreement for a single-family home.",
      "Storage Unit Rental Agreement with liability limitations.",
      "Parking Space Lease Agreement for a dedicated spot."
    ]
  },
  {
    category: "Business & Sales", prompts: [
      "Service Level Agreement (SLA) with uptime and support guarantees.",
      "Sales Agreement for commercial equipment with warranty and delivery.",
      "Loan Agreement between individuals with fixed interest rates.",
      "Consulting Agreement for strategy services and liability terms.",
      "Partnership Agreement describing capital and profit sharing.",
      "Software Licensing Agreement for internal corporate use.",
      "Website Development Agreement with milestones and payments.",
      "Privacy Policy for e-commerce compliant with GDPR and CCPA.",
      "Generic Release of Liability waiver for recreational activities.",
      "Marketing Agency Agreement for social media management.",
      "Board of Directors Resolution for bank account opening.",
      "Power of Attorney for legal and financial matters.",
      "Promissory Note for personal loans with repayment dates.",
      "Equipment Rental Agreement for heavy machinery including insurance.",
      "Joint Venture Agreement for a real estate development project.",
      "Bill of Sale for a motor vehicle including VIN and title.",
      "Cease and Desist letter for copyright infringement.",
      "Vendor Service Agreement for event catering services.",
      "Affidatvid of Residency for legal address verification.",
      "Legal Retainer Agreement for professional accounting services.",
      "Terms of Service agreement for a SaaS product.",
      "Gift Deed for non-consideration property transfer.",
      "Professional Quotation or Proposal for architectural design.",
      "Purchase Order (PO) with itemized lists and delivery terms.",
      "Content License Agreement for professional photography.",
      "Letter of Intent (LOI) for a business acquisition.",
      "Incident Report form for workplace safety emergencies.",
      "Scholarship Application with academic history and essays.",
      "Stock Option Grant Agreement for startup employees.",
      "Logistics and Transport agreement for regular shipping.",
      "Sponsorship Agreement for community events.",
      "Demand Letter for unpaid professional service invoices.",
      "Board Meeting Minutes template with motions and actions."
    ]
  }
];

// ============================================
// AI Template Generator Component (Simplified)
// ============================================

const AITemplateGenerator = ({ onTemplateGenerated, onBack }) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [promptsDialogOpen, setPromptsDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState(null);

  const navigate = useNavigate();

  const generateTemplate = async () => {
    if (!description.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const requestData = {
        prompt: description,
        document_type: 'Contract',
        category: category,
        tags: tags,
        language: 'English',
        country: 'India'
      };

      const response = await TemplateAPIService.generateAIWorkflow(requestData);

      if (response.success && response.document_id) {
        setGeneratedDocId(response.document_id);
        setPreviewDialogOpen(true);
      } else {
        throw new Error(response.message || 'Workflow generation failed');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setError(error.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      px: 3,
      background: 'radial-gradient(circle at 50% 50%, #f8faff 0%, #ffffff 100%)',
      position: 'relative'
    }}>
      {/* Back button positioned floating top-left */}
      <IconButton
        onClick={onBack}
        sx={{
          position: 'absolute',
          top: 24,
          left: 24,
          bgcolor: 'white',
          boxShadow: 1,
          '&:hover': { bgcolor: '#f5f5f5' }
        }}
      >
        <BackIcon />
      </IconButton>

      {/* Hero Section */}
      <Fade in={true} timeout={800}>
        <Box sx={{ mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{
            width: 64,
            height: 64,
            borderRadius: '18px',
            bgcolor: alpha('#0d9488', 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3
          }}>
            <AutoAwesomeIcon sx={{ fontSize: 32, color: '#0d9488' }} />
          </Box>
          <Typography variant="h4" fontWeight="800" sx={{
            color: '#1a1a1a',
            mb: 2,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(45deg, #1a1a1a 30%, #4a4a4a 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI Template Assistant
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', maxWidth: 540, lineHeight: 1.6, fontSize: '1.1rem' }}>
            Transform your document ideas into professional templates instantly.
            Just describe what you need, and I'll handle the rest.
          </Typography>
        </Box>
      </Fade>

      {/* Gemini Style Input Box */}
      <Grow in={true} timeout={1000}>
        <Box sx={{ width: '100%', maxWidth: 760, position: 'relative' }}>
          <Paper elevation={0} sx={{
            p: '8px',
            borderRadius: '28px',
            border: '1px solid #e0e0e0',
            bgcolor: 'white',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            '&:focus-within': {
              borderColor: '#0d9488',
              boxShadow: '0 8px 32px rgba(13, 148, 136, 0.12)',
              transform: 'translateY(-2px)'
            }
          }}>
            <TextField
              fullWidth
              multiline
              rows={Math.max(2, description.split('\n').length)}
              placeholder="How can I help you create a document today?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="standard"
              disabled={loading}
              InputProps={{
                disableUnderline: true,
                sx: {
                  px: 3.5,
                  py: 2.5,
                  fontSize: '1.15rem',
                  color: '#1a1a1a',
                  className: 'no-scrollbar',
                  '& textarea': {
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' }
                  }
                }
              }}
            />
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              pb: 1.5,
              pt: 0.5
            }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {/* <Tooltip title="Coming Soon: Templates Library">
                  <IconButton size="small" sx={{ color: '#666' }}>
                    <DescriptionIcon fontSize="small" />
                  </IconButton>
                </Tooltip> */}
                <Tooltip title="Example Prompts">
                  <IconButton
                    size="small"
                    sx={{ color: '#666' }}
                    onClick={() => setPromptsDialogOpen(true)}
                  >
                    <EmojiObjectsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {loading && (
                  <Typography variant="caption" sx={{ color: '#0d9488', fontWeight: 500 }}>
                    Processing Request...
                  </Typography>
                )}
                <Button
                  variant="contained"
                  onClick={generateTemplate}
                  disabled={loading || !description.trim()}
                  sx={{
                    borderRadius: '22px',
                    px: 4,
                    py: 1.2,
                    bgcolor: '#0d9488',
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
                    '&:hover': {
                      bgcolor: '#0f766e',
                      boxShadow: '0 6px 16px rgba(13, 148, 136, 0.3)'
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#f5f5f5',
                      color: '#999'
                    }
                  }}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon size="small" />}
                >
                  {loading ? 'Thinking...' : 'Generate'}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Metadata Section */}
          <Grow in={true} timeout={1200}>
            <Box sx={{ mt: 3, width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                <TextField
                  fullWidth
                  label="Category (optional)"
                  placeholder="e.g. Legal, HR, Sales"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  variant="outlined"
                  sx={{
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                    '& .MuiInputLabel-root': { color: '#666' }
                  }}
                />
                <TextField
                  fullWidth
                  label="Tags (comma separated)"
                  placeholder="e.g. urgent, confidential"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  variant="outlined"
                  sx={{
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                    '& .MuiInputLabel-root': { color: '#666' }
                  }}
                />
              </Box>
            </Box>
          </Grow>

          {/* Prompt Suggestions */}
          {!description && !loading && (
            <Fade in={true} timeout={1200}>
              <Box sx={{ mt: 4, display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  'Employment Contract',
                  'Non-Disclosure Agreement',
                  'Service Level Agreement',
                  'Rental Agreement'
                ].map((prompt) => (
                  <Chip
                    key={prompt}
                    label={prompt}
                    onClick={() => setDescription(`Create a professional ${prompt.toLowerCase()} template with standard clauses and signature fields.`)}
                    sx={{
                      bgcolor: 'white',
                      border: '1px solid #e0e0e0',
                      '&:hover': { bgcolor: '#f5faff', borderColor: '#0d9488', color: '#0d9488' },
                      transition: 'all 0.2s',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Box>
            </Fade>
          )}
        </Box>
      </Grow>

      {/* Error Alert Overlay */}
      {error && (
        <Zoom in={true}>
          <Alert
            severity="error"
            sx={{
              position: 'fixed',
              bottom: 40,
              borderRadius: 3,
              boxShadow: 3,
              minWidth: 300
            }}
            onClose={() => setError(null)}
          >
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        </Zoom>
      )}

      {/* Document Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '20px', height: '90vh' }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: '1px solid #eee'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              p: 1,
              borderRadius: '10px',
              bgcolor: alpha('#0d9488', 0.1),
              display: 'flex'
            }}>
              <VisibilityIcon sx={{ color: '#0d9488' }} />
            </Box>
            <Typography variant="h6" fontWeight="700">Document Preview</Typography>
          </Box>
          <IconButton onClick={() => setPreviewDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#f4f4f4', overflow: 'hidden' }}>
          {generatedDocId && (
            <iframe
              src={`${API_BASE_URL}/documents/${generatedDocId}/builder-pdf?token=${localStorage.getItem('token')}`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Document Preview"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #eee', bgcolor: 'white' }}>
          <Button
            onClick={() => setPreviewDialogOpen(false)}
            sx={{ color: '#666', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setPreviewDialogOpen(false);
              onTemplateGenerated(generatedDocId);
            }}
            sx={{
              bgcolor: '#0d9488',
              borderRadius: '12px',
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#0f766e' }
            }}
          >
            Continue to Editor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Example Prompts Dialog */}
      <Dialog
        open={promptsDialogOpen}
        onClose={() => setPromptsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, maxHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AutoAwesomeIcon sx={{ color: '#0d9488' }} />
            <Typography variant="h6" fontWeight="700">Explore AI Prompts</Typography>
          </Box>
          <IconButton onClick={() => setPromptsDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: '#fafafa' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Choose a professional prompt below to help our AI generate the perfect template for your needs.
          </Typography>

          <Grid container spacing={3}>
            {PROMPT_SUGGESTIONS.map((category) => (
              <Grid item xs={12} key={category.category}>
                <Typography variant="overline" sx={{ color: '#0d9488', fontWeight: 800, letterSpacing: 1.2 }}>
                  {category.category}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                  {category.prompts.map((prompt) => (
                    <Chip
                      key={prompt}
                      label={prompt}
                      onClick={() => {
                        setDescription(`Create a professional ${prompt.toLowerCase()} including all necessary legal clauses, placeholders, and signature fields.`);
                        setPromptsDialogOpen(false);
                      }}
                      sx={{
                        bgcolor: 'white',
                        border: '1px solid #e0e0e0',
                        py: 2.5,
                        '&:hover': {
                          bgcolor: alpha('#0d9488', 0.04),
                          borderColor: '#0d9488',
                          color: '#0d9488',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #f0f0f0' }}>
          <Button
            onClick={() => setPromptsDialogOpen(false)}
            sx={{ color: '#666', fontWeight: 600 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ============================================
// Main App Component
// ============================================

const TemplateBuilderApp = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('ai-generator');
  const [generatedDocumentId, setGeneratedDocumentId] = useState(null);

  const handleAITemplateGenerated = (documentId) => {
    setGeneratedDocumentId(documentId);
    setCurrentView('builder');
  };

  const handleBackToAI = () => {
    setCurrentView('ai-generator');
    setGeneratedDocumentId(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', bgcolor: '#f8fafc' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', width: '100vw', bgcolor: '#f8fafc', overflow: 'hidden' }}>
      {currentView === 'ai-generator' ? (
        <AITemplateGenerator
          onTemplateGenerated={handleAITemplateGenerated}
          onBack={() => window.history.back()}
        />
      ) : (
        <DocumentMainLayout
          documentId={generatedDocumentId}
          onBack={handleBackToAI}
        />
      )}
    </Box>
  );
};

export default TemplateBuilderApp;