// src/components/ai-templates/AITemplatePreview.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Paper,
  Grid,
  Chip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem, FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  FormatAlignLeft as FormatAlignLeftIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../services/api';

const AITemplatePreview = ({ templateId, mode = 'preview', onClose }) => {
  const [activeTab, setActiveTab] = useState(mode === 'edit' ? 0 : 1);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [fields, setFields] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [converting, setConverting] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      
      // Load template data
      const templateResponse = await api.get(`/ai/templates/templates/${templateId}`);
      setTemplate(templateResponse.data);

      // Load HTML content based on mode
      const modeEndpoint = activeTab === 0 ? 'edit-mode' : 'preview-mode';
      const htmlResponse = await api.get(`/ai/templates/templates/${templateId}/${modeEndpoint}`);
      setHtmlContent(htmlResponse.data);

      // Load fields if needed
      if (activeTab === 0) {
        const fieldsResponse = await api.get(`/ai/templates/templates/${templateId}/fields`);
        setFields(fieldsResponse.data);
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load template');
      console.error('Error loading template:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [activeTab, templateId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setIframeKey(prev => prev + 1); // Force iframe reload
  };

  const handleEditField = (field) => {
    setSelectedField(field);
    setEditDialogOpen(true);
  };

  const handleSaveField = async (updatedField) => {
    try {
      await api.put(`/ai/templates/templates/${templateId}/fields/${updatedField.id}`, updatedField);
      setEditDialogOpen(false);
      setSelectedField(null);
      loadTemplate(); // Refresh
    } catch (err) {
      console.error('Error updating field:', err);
    }
  };

  const handleConvertToDocument = async () => {
    try {
      setConverting(true);
      const response = await api.post(`/ai/templates/templates/${templateId}/convert-to-document`, {
        filename: template.title
      });

      // Navigate to the new document
      window.open(`/documents/${response.data.document_id}`, '_blank');
    } catch (err) {
      console.error('Error converting template:', err);
    } finally {
      setConverting(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/ai/templates/export-template/${templateId}?format=${format}`, {
        responseType: format === 'json' ? 'json' : 'blob'
      });

      if (format === 'json') {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.title}.json`;
        link.click();
      } else {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.title}.${format}`;
        link.click();
      }
    } catch (err) {
      console.error('Error exporting template:', err);
    }
  };

  const handleNormalize = async () => {
    try {
      await api.post(`/ai/templates/templates/${templateId}/normalize`);
      loadTemplate(); // Refresh
    } catch (err) {
      console.error('Error normalizing template:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <IconButton onClick={onClose}>
              <ArrowBackIcon />
            </IconButton>
          </Grid>
          <Grid item xs>
            <Typography variant="h6" noWrap>
              {template?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {template?.description || 'AI-generated template'}
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={template?.template_type} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`${fields.length} fields`} 
                size="small" 
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Toolbar */}
      <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab 
                icon={<EditIcon />} 
                label="Edit Mode" 
                iconPosition="start"
              />
              <Tab 
                icon={<PreviewIcon />} 
                label="Preview Mode" 
                iconPosition="start"
              />
            </Tabs>
          </Grid>
          <Grid item xs />
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeTab === 0 && (
                <>
                  <Tooltip title="Normalize Field Names">
                    <Button
                      size="small"
                      onClick={handleNormalize}
                      startIcon={<FormatAlignLeftIcon />}
                    >
                      Normalize
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export JSON">
                    <IconButton onClick={() => handleExport('json')}>
                      <CodeIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              
              <Tooltip title="Convert to Document">
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleConvertToDocument}
                  disabled={converting}
                  startIcon={converting ? <CircularProgress size={16} /> : <CloudDownloadIcon />}
                >
                  {converting ? 'Converting...' : 'Use Template'}
                </Button>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      <Box sx={{ flexGrow: 1, position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
        {activeTab === 0 ? (
          // Edit Mode
          <iframe
            key={`edit-${iframeKey}`}
            src={`${process.env.REACT_APP_API_BASE_URL}/ai/templates/templates/${templateId}/edit-mode`}
            title="Template Edit Mode"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'white'
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        ) : (
          // Preview Mode
          <iframe
            key={`preview-${iframeKey}`}
            src={`${process.env.REACT_APP_API_BASE_URL}/ai/templates/templates/${templateId}/preview-mode`}
            title="Template Preview Mode"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'white'
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        )}
      </Box>

      {/* Field List (Edit Mode Only) */}
      {activeTab === 0 && fields.length > 0 && (
        <Paper sx={{ mt: 2, p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Field List
          </Typography>
          <Grid container spacing={1}>
            {fields.map((field) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={field.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                  onClick={() => handleEditField(field)}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    {field.label}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={field.field_type} 
                      size="small" 
                      variant="outlined"
                    />
                    {field.required && (
                      <Chip 
                        label="Required" 
                        size="small" 
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Edit Field Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Field</DialogTitle>
        <DialogContent>
          {selectedField && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Field Name"
                value={selectedField.name}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Field Label"
                value={selectedField.label}
                onChange={(e) => setSelectedField({...selectedField, label: e.target.value})}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={selectedField.field_type}
                  onChange={(e) => setSelectedField({...selectedField, field_type: e.target.value})}
                  label="Field Type"
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="phone">Phone</MenuItem>
                  <MenuItem value="textarea">Text Area</MenuItem>
                  <MenuItem value="signature">Signature</MenuItem>
                  <MenuItem value="initial">Initial</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                  <MenuItem value="dropdown">Dropdown</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedField.required}
                    onChange={(e) => setSelectedField({...selectedField, required: e.target.checked})}
                  />
                }
                label="Required"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => handleSaveField(selectedField)}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AITemplatePreview;