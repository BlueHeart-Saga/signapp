// FieldPropertiesPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Grid,
  Divider,
  FormControlLabel,
  Switch,
  Avatar,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
  Button,
  Collapse,
  Alert,
  RadioGroup,
  Radio,
  Checkbox
} from '@mui/material';
import { Tooltip } from '@mui/material';
import {
  Delete as DeleteIcon,
  ColorLens as ColorLensIcon,
  TextFormat as TextFormatIcon,
  BorderAll as BorderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Tune as TuneIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FormatSize as FormatSizeIcon,
  FormatColorText as FormatColorTextIcon,
  FormatColorFill as FormatColorFillIcon,
  LineWeight as LineWeightIcon,
  BorderStyle as BorderStyleIcon,
  Opacity as OpacityIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  Link as LinkIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  ContentCopy as CopyIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const FIELD_TYPES = {
  text: {
    type: 'text',
    label: 'Text Field',
    icon: <TextFormatIcon />,
    color: '#2196F3',
    defaultWidth: 200,
    defaultHeight: 40,
    placeholder: 'Enter text...'
  },
  date: {
    type: 'date',
    label: 'Date Field',
    icon: <ColorLensIcon />,
    color: '#4CAF50',
    defaultWidth: 150,
    defaultHeight: 40,
    placeholder: 'Select date...'
  },
  signature: {
    type: 'signature',
    label: 'Signature',
    icon: <BorderIcon />,
    color: '#F44336',
    defaultWidth: 200,
    defaultHeight: 80,
    placeholder: 'SIGNATURE'
  },
  email: {
    type: 'email',
    label: 'Email Field',
    icon: <ColorLensIcon />,
    color: '#FF9800',
    defaultWidth: 250,
    defaultHeight: 40,
    placeholder: 'email@example.com'
  },
  phone: {
    type: 'phone',
    label: 'Phone Field',
    icon: <ColorLensIcon />,
    color: '#607D8B',
    defaultWidth: 180,
    defaultHeight: 40,
    placeholder: '(123) 456-7890'
  },
  number: {
    type: 'number',
    label: 'Number Field',
    icon: <ColorLensIcon />,
    color: '#795548',
    defaultWidth: 150,
    defaultHeight: 40,
    placeholder: '0'
  },
  textarea: {
    type: 'textarea',
    label: 'Text Area',
    icon: <TextFormatIcon />,
    color: '#2196F3',
    defaultWidth: 300,
    defaultHeight: 100,
    placeholder: 'Enter text here...'
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    icon: <BorderIcon />,
    color: '#9C27B0',
    defaultWidth: 120,
    defaultHeight: 40,
    placeholder: ''
  },
  dropdown: {
    type: 'dropdown',
    label: 'Dropdown',
    icon: <ExpandMoreIcon />,
    color: '#00BCD4',
    defaultWidth: 180,
    defaultHeight: 40,
    placeholder: 'Select option...'
  },
  file: {
    type: 'file',
    label: 'File Upload',
    icon: <ColorLensIcon />,
    color: '#9C27B0',
    defaultWidth: 200,
    defaultHeight: 80,
    placeholder: 'Choose file...'
  }
};

const FieldPropertiesPanel = ({ field, onChange, onDelete }) => {
  const [fieldName, setFieldName] = useState(field?.name || '');
  const [fieldLabel, setFieldLabel] = useState(field?.label || '');
  const [placeholder, setPlaceholder] = useState(field?.placeholder || '');
  const [required, setRequired] = useState(field?.required || false);
  const [options, setOptions] = useState(field?.options?.join(', ') || '');
  const [description, setDescription] = useState(field?.description || '');
  const [locked, setLocked] = useState(field?.locked || false);
  const [visible, setVisible] = useState(field?.visible ?? true);
  
  // Style states
  const [backgroundColor, setBackgroundColor] = useState(field?.style?.backgroundColor || '#FFFFFF');
  const [borderColor, setBorderColor] = useState(field?.style?.borderColor || '#2196F3');
  const [textColor, setTextColor] = useState(field?.style?.textColor || '#000000');
  const [fontSize, setFontSize] = useState(field?.style?.fontSize || 14);
  const [fontFamily, setFontFamily] = useState(field?.style?.fontFamily || 'Arial');
  const [borderWidth, setBorderWidth] = useState(field?.style?.borderWidth || 1);
  const [borderRadius, setBorderRadius] = useState(field?.style?.borderRadius || 4);
  const [borderStyle, setBorderStyle] = useState(field?.style?.borderStyle || 'solid');
  const [padding, setPadding] = useState(field?.style?.padding || 8);
  const [opacity, setOpacity] = useState(field?.style?.opacity || 1);
  
  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    validation: false,
    appearance: false,
    advanced: false
  });

  useEffect(() => {
    if (field) {
      setFieldName(field.name || '');
      setFieldLabel(field.label || '');
      setPlaceholder(field.placeholder || '');
      setRequired(field.required || false);
      setOptions(field.options?.join(', ') || '');
      setDescription(field.description || '');
      setLocked(field.locked || false);
      setVisible(field.visible ?? true);
      
      // Style properties
      setBackgroundColor(field.style?.backgroundColor || '#FFFFFF');
      setBorderColor(field.style?.borderColor || (FIELD_TYPES[field.type]?.color || '#2196F3'));
      setTextColor(field.style?.textColor || '#000000');
      setFontSize(field.style?.fontSize || 14);
      setFontFamily(field.style?.fontFamily || 'Arial');
      setBorderWidth(field.style?.borderWidth || 1);
      setBorderRadius(field.style?.borderRadius || 4);
      setBorderStyle(field.style?.borderStyle || 'solid');
      setPadding(field.style?.padding || 8);
      setOpacity(field.style?.opacity || 1);
    }
  }, [field]);

  const handlePropertyChange = (property, value) => {
    if (field) {
      onChange(field.id, { [property]: value });
    }
  };

  const handleStyleChange = (property, value) => {
    if (field) {
      const updatedStyle = {
        ...field.style,
        [property]: value
      };
      onChange(field.id, { style: updatedStyle });
    }
  };

  const handleOptionsChange = (value) => {
    setOptions(value);
    if (field) {
      const optionsArray = value.split(',').map(opt => opt.trim()).filter(opt => opt);
      onChange(field.id, { options: optionsArray });
    }
  };

  const handleToggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleResetStyle = () => {
    if (field) {
      const fieldType = FIELD_TYPES[field.type] || FIELD_TYPES.text;
      const defaultStyle = {
        backgroundColor: '#FFFFFF',
        borderColor: fieldType.color,
        textColor: '#000000',
        fontSize: 14,
        fontFamily: 'Arial',
        borderWidth: 1,
        borderRadius: 4,
        borderStyle: 'solid',
        padding: 8,
        opacity: 1
      };
      
      // Reset local state
      setBackgroundColor(defaultStyle.backgroundColor);
      setBorderColor(defaultStyle.borderColor);
      setTextColor(defaultStyle.textColor);
      setFontSize(defaultStyle.fontSize);
      setFontFamily(defaultStyle.fontFamily);
      setBorderWidth(defaultStyle.borderWidth);
      setBorderRadius(defaultStyle.borderRadius);
      setBorderStyle(defaultStyle.borderStyle);
      setPadding(defaultStyle.padding);
      setOpacity(defaultStyle.opacity);
      
      // Update field
      onChange(field.id, { style: defaultStyle });
    }
  };

  const handleDuplicate = () => {
    if (field) {
      const duplicatedField = {
        ...field,
        id: `field_${Date.now()}`,
        name: `${field.name}_copy`,
        label: `${field.label} (Copy)`,
        x: field.x + 20,
        y: field.y + 20
      };
      onChange(duplicatedField.id, duplicatedField, true);
    }
  };

  if (!field) {
    return (
      <Paper sx={{ 
        p: 3, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'background.default'
      }}>
        <Box sx={{ textAlign: 'center', maxWidth: 300 }}>
          <ColorLensIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Field Selected
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Click on a field in the canvas to edit its properties
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Chip label="Drag fields from the left panel" variant="outlined" />
            <Chip label="Double-click to edit field content" variant="outlined" />
            <Chip label="Use AI Assistant for smart placement" variant="outlined" />
          </Box>
        </Box>
      </Paper>
    );
  }

  const fieldType = FIELD_TYPES[field.type] || FIELD_TYPES.text;

  return (
    <Paper sx={{ 
      p: 2, 
      height: '100%', 
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'background.paper'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2, 
        pb: 2, 
        borderBottom: 1, 
        borderColor: 'divider' 
      }}>
        <Avatar sx={{ 
          bgcolor: fieldType.color, 
          mr: 2,
          width: 40,
          height: 40
        }}>
          {fieldType.icon}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            {fieldType.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {field.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Duplicate">
            <IconButton size="small" onClick={handleDuplicate}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Lock/Unlock">
            <IconButton 
              size="small" 
              onClick={() => {
                setLocked(!locked);
                handlePropertyChange('locked', !locked);
              }}
            >
              {locked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => onDelete(field.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* General Properties */}
        <Box sx={{ mb: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 1,
              cursor: 'pointer'
            }}
            onClick={() => handleToggleSection('general')}
          >
            <Typography variant="subtitle2" fontWeight="medium">
              <SettingsIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
              General
            </Typography>
            {expandedSections.general ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
          
          <Collapse in={expandedSections.general}>
            <Grid container spacing={1.5}>
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
                  helperText="Used for data binding (snake_case)"
                  disabled={locked}
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
                  disabled={locked}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Placeholder Text"
                  value={placeholder}
                  onChange={(e) => {
                    setPlaceholder(e.target.value);
                    handlePropertyChange('placeholder', e.target.value);
                  }}
                  size="small"
                  disabled={locked}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    handlePropertyChange('description', e.target.value);
                  }}
                  size="small"
                  multiline
                  rows={2}
                  disabled={locked}
                />
              </Grid>

              {field.type === 'dropdown' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Options"
                    value={options}
                    onChange={(e) => handleOptionsChange(e.target.value)}
                    size="small"
                    helperText="Comma-separated list of options"
                    disabled={locked}
                  />
                </Grid>
              )}

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Width"
                  type="number"
                  value={field.width || 0}
                  onChange={(e) => handlePropertyChange('width', parseInt(e.target.value) || 0)}
                  size="small"
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                    readOnly: locked
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Height"
                  type="number"
                  value={field.height || 0}
                  onChange={(e) => handlePropertyChange('height', parseInt(e.target.value) || 0)}
                  size="small"
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                    readOnly: locked
                  }}
                />
              </Grid>
            </Grid>
          </Collapse>
        </Box>

        {/* Validation & Behavior */}
        <Box sx={{ mb: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 1,
              cursor: 'pointer'
            }}
            onClick={() => handleToggleSection('validation')}
          >
            <Typography variant="subtitle2" fontWeight="medium">
              <TuneIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
              Validation & Behavior
            </Typography>
            {expandedSections.validation ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
          
          <Collapse in={expandedSections.validation}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={required}
                      onChange={(e) => {
                        setRequired(e.target.checked);
                        handlePropertyChange('required', e.target.checked);
                      }}
                      disabled={locked}
                    />
                  }
                  label="Required Field"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={visible}
                      onChange={(e) => {
                        setVisible(e.target.checked);
                        handlePropertyChange('visible', e.target.checked);
                      }}
                      disabled={locked}
                    />
                  }
                  label="Visible"
                />
              </Grid>

              {field.type === 'text' || field.type === 'textarea' ? (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Validation Pattern"
                    placeholder="Regular expression"
                    size="small"
                    helperText="Optional regex validation"
                    disabled={locked}
                  />
                </Grid>
              ) : field.type === 'number' ? (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Minimum Value"
                      type="number"
                      size="small"
                      disabled={locked}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Maximum Value"
                      type="number"
                      size="small"
                      disabled={locked}
                    />
                  </Grid>
                </>
              ) : null}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Error Message"
                  placeholder="Custom error message"
                  size="small"
                  disabled={locked}
                />
              </Grid>
            </Grid>
          </Collapse>
        </Box>

        {/* Appearance */}
        <Box sx={{ mb: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 1,
              cursor: 'pointer'
            }}
            onClick={() => handleToggleSection('appearance')}
          >
            <Typography variant="subtitle2" fontWeight="medium">
              <ColorLensIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
              Appearance
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Reset to default">
                <IconButton size="small" onClick={handleResetStyle}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {expandedSections.appearance ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </Box>
          
          <Collapse in={expandedSections.appearance}>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormatColorFillIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption">Background</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    handleStyleChange('backgroundColor', e.target.value);
                  }}
                  size="small"
                  InputProps={{
                    sx: { height: 36 }
                  }}
                  disabled={locked}
                />
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BorderStyleIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption">Border</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="color"
                  value={borderColor}
                  onChange={(e) => {
                    setBorderColor(e.target.value);
                    handleStyleChange('borderColor', e.target.value);
                  }}
                  size="small"
                  InputProps={{
                    sx: { height: 36 }
                  }}
                  disabled={locked}
                />
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormatColorTextIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption">Text</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    handleStyleChange('textColor', e.target.value);
                  }}
                  size="small"
                  InputProps={{
                    sx: { height: 36 }
                  }}
                  disabled={locked}
                />
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <OpacityIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption">Opacity</Typography>
                </Box>
                <Slider
                  value={opacity * 100}
                  onChange={(e, value) => {
                    const newOpacity = value / 100;
                    setOpacity(newOpacity);
                    handleStyleChange('opacity', newOpacity);
                  }}
                  size="small"
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                  disabled={locked}
                />
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormatSizeIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption">Font Size</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={fontSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 14;
                    setFontSize(value);
                    handleStyleChange('fontSize', value);
                  }}
                  size="small"
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                    readOnly: locked
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextFormatIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption">Font Family</Typography>
                </Box>
                <FormControl fullWidth size="small" disabled={locked}>
                  <Select
                    value={fontFamily}
                    onChange={(e) => {
                      setFontFamily(e.target.value);
                      handleStyleChange('fontFamily', e.target.value);
                    }}
                  >
                    <MenuItem value="Arial">Arial</MenuItem>
                    <MenuItem value="Helvetica">Helvetica</MenuItem>
                    <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                    <MenuItem value="Georgia">Georgia</MenuItem>
                    <MenuItem value="Courier New">Courier New</MenuItem>
                    <MenuItem value="Verdana">Verdana</MenuItem>
                    <MenuItem value="Tahoma">Tahoma</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LineWeightIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption">Border Width</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={borderWidth}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setBorderWidth(value);
                    handleStyleChange('borderWidth', value);
                  }}
                  size="small"
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                    readOnly: locked
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BorderIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption">Border Radius</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={borderRadius}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 4;
                    setBorderRadius(value);
                    handleStyleChange('borderRadius', value);
                  }}
                  size="small"
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                    readOnly: locked
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BorderStyleIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption">Border Style</Typography>
                </Box>
                <FormControl fullWidth size="small" disabled={locked}>
                  <Select
                    value={borderStyle}
                    onChange={(e) => {
                      setBorderStyle(e.target.value);
                      handleStyleChange('borderStyle', e.target.value);
                    }}
                  >
                    <MenuItem value="solid">Solid</MenuItem>
                    <MenuItem value="dashed">Dashed</MenuItem>
                    <MenuItem value="dotted">Dotted</MenuItem>
                    <MenuItem value="double">Double</MenuItem>
                    <MenuItem value="none">None</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption">Padding</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={padding}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 8;
                    setPadding(value);
                    handleStyleChange('padding', value);
                  }}
                  size="small"
                  InputProps={{ 
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                    readOnly: locked
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    startIcon={<FormatBoldIcon />}
                    variant={field.style?.fontWeight === 'bold' ? 'contained' : 'outlined'}
                    onClick={() => handleStyleChange('fontWeight', field.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
                    disabled={locked}
                  >
                    Bold
                  </Button>
                  <Button
                    size="small"
                    startIcon={<FormatItalicIcon />}
                    variant={field.style?.fontStyle === 'italic' ? 'contained' : 'outlined'}
                    onClick={() => handleStyleChange('fontStyle', field.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
                    disabled={locked}
                  >
                    Italic
                  </Button>
                  <Button
                    size="small"
                    startIcon={<FormatUnderlinedIcon />}
                    variant={field.style?.textDecoration === 'underline' ? 'contained' : 'outlined'}
                    onClick={() => handleStyleChange('textDecoration', field.style?.textDecoration === 'underline' ? 'none' : 'underline')}
                    disabled={locked}
                  >
                    Underline
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    startIcon={<AlignLeftIcon />}
                    variant={field.style?.textAlign === 'left' ? 'contained' : 'outlined'}
                    onClick={() => handleStyleChange('textAlign', 'left')}
                    disabled={locked}
                  >
                    Left
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AlignCenterIcon />}
                    variant={field.style?.textAlign === 'center' ? 'contained' : 'outlined'}
                    onClick={() => handleStyleChange('textAlign', 'center')}
                    disabled={locked}
                  >
                    Center
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AlignRightIcon />}
                    variant={field.style?.textAlign === 'right' ? 'contained' : 'outlined'}
                    onClick={() => handleStyleChange('textAlign', 'right')}
                    disabled={locked}
                  >
                    Right
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </Box>

        {/* Advanced Settings */}
        <Box sx={{ mb: 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 1,
              cursor: 'pointer'
            }}
            onClick={() => handleToggleSection('advanced')}
          >
            <Typography variant="subtitle2" fontWeight="medium">
              <SettingsIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
              Advanced Settings
            </Typography>
            {expandedSections.advanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
          
          <Collapse in={expandedSections.advanced}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Custom CSS Class"
                  placeholder="my-custom-class"
                  size="small"
                  helperText="Add custom CSS class for styling"
                  disabled={locked}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Data Binding Key"
                  placeholder="field_key"
                  size="small"
                  helperText="Key for data binding in forms"
                  disabled={locked}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tooltip Text"
                  placeholder="Additional information..."
                  size="small"
                  multiline
                  rows={2}
                  disabled={locked}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.readonly || false}
                      onChange={(e) => handlePropertyChange('readonly', e.target.checked)}
                      disabled={locked}
                    />
                  }
                  label="Read Only"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.disabled || false}
                      onChange={(e) => handlePropertyChange('disabled', e.target.checked)}
                      disabled={locked}
                    />
                  }
                  label="Disabled"
                />
              </Grid>
            </Grid>
          </Collapse>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        pt: 2, 
        mt: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="caption" color="text.secondary">
          Position: ({Math.round(field.x || 0)}, {Math.round(field.y || 0)})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const defaultValues = {
                text: 'Default Value',
                number: '0',
                email: 'user@example.com',
                phone: '(123) 456-7890',
                date: new Date().toISOString().split('T')[0]
              };
              
              if (defaultValues[field.type]) {
                handlePropertyChange('defaultValue', defaultValues[field.type]);
              }
            }}
            disabled={locked}
          >
            Set Default
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => {
              // Save field configuration
              alert('Field configuration saved!');
            }}
            disabled={locked}
          >
            Apply
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

// Export the component
export default FieldPropertiesPanel;

// Add the missing import for Tooltip at the top
