import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Button,
  TextField, Chip, Avatar, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select,
  MenuItem, Tabs, Tab, Badge, Rating, LinearProgress, CircularProgress,
  Paper, Divider, Tooltip, Fab, useTheme, useMediaQuery,
  Accordion, AccordionSummary, AccordionDetails, Switch, FormControlLabel,
  Snackbar, Alert, List, ListItem, ListItemIcon, ListItemText,
  InputAdornment, Pagination, CardActionArea, Stepper, Step, StepLabel,
  Collapse
} from '@mui/material';
import {
  Search, FilterList, AutoFixHigh, Download, Edit, Preview,
  Add, Favorite, FavoriteBorder, Share, ContentCopy,
  SmartToy, DesignServices, Code, History, TrendingUp,
  Category, Star, StarBorder, AccessTime, CloudDownload,
  Visibility, Close, CheckCircle, Error, Warning, Info,
  ExpandMore, Sort, ViewModule, ViewList, Refresh,
  PictureAsPdf, Article, TextFields, FolderOpen,
  ThumbUp, ThumbDown, PlayArrow, AutoMode, Business,
  Description, Assignment, Ballot, Feed, ExpandCircleDown
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { debounce } from 'lodash';

// -----------------------------
// Tab Panel Component
// -----------------------------
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// -----------------------------
// Error Display Component
// -----------------------------
const ErrorDisplay = ({ error, onRetry }) => {
  return (
    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
      <Error sx={{ fontSize: 48, mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Connection Error
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {error || 'Unable to connect to the server. Please check if your backend is running.'}
      </Typography>
      <Button variant="contained" onClick={onRetry} startIcon={<Refresh />}>
        Retry Connection
      </Button>
    </Paper>
  );
};

// -----------------------------
// Real-time Template Generation Modal
// -----------------------------
const RealTimeTemplateGenerator = ({ open, onClose, onTemplateGenerated }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [generationStep, setGenerationStep] = useState(0);
  const [templateData, setTemplateData] = useState({
    name: '',
    document_type: 'letters',
    template_type: 'Business Letter',
    description: '',
    instructions: '',
    placeholders: {},
    enhance_placeholders: true,
    format: 'pdf'
  });
  const [loading, setLoading] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);
  const [documentTypes, setDocumentTypes] = useState({});
  const [suggestions, setSuggestions] = useState({ placeholders: [], properties: [], sections: [] });
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

  // Check API status
  const checkApiStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/templates/test`, {
        timeout: 5000
      });
      setApiStatus('online');
      setError(null);
      return true;
    } catch (err) {
      setApiStatus('offline');
      setError('Backend server is not responding. Please make sure your server is running on port 9000.');
      return false;
    }
  };

  // Load document types from backend
  const loadDocumentTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/templates/document-types`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      setDocumentTypes(response.data.document_types || {});
      setError(null);
    } catch (error) {
      console.error('Error loading document types:', error);
      setError('Failed to load document types. Using fallback data.');
      // Fallback to default types
      setDocumentTypes(getFallbackDocumentTypes());
    }
  };

  // Load placeholder suggestions
  const loadPlaceholderSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/templates/suggest-placeholders`, {
        template_type: templateData.template_type,
        document_type: templateData.document_type,
        industry: "",
        custom_requirements: templateData.instructions
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });
      
      if (response.data.suggestions) {
        setSuggestions(response.data.suggestions);
        
        // Initialize placeholders with empty values
        const emptyPlaceholders = {};
        response.data.suggestions.placeholders?.forEach(ph => {
          emptyPlaceholders[ph.key] = "";
        });
        setTemplateData(prev => ({ ...prev, placeholders: emptyPlaceholders }));
      }
      setError(null);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions(getFallbackSuggestions(templateData.template_type, templateData.document_type));
    }
  };

  // Generate template with real backend
  const generateTemplate = async () => {
    setLoading(true);
    setGenerationStep(1);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Convert properties for backend
      const properties = suggestions.properties?.map(prop => ({
        key: prop.key,
        value: "",
        type: prop.type,
        options: prop.options || [],
        required: prop.required || false,
        description: prop.description || ""
      })) || [];

      const requestData = {
        template_type: templateData.template_type,
        document_type: templateData.document_type,
        placeholders: templateData.placeholders,
        custom_prompt: templateData.instructions,
        format: templateData.format,
        name: templateData.name,
        properties: properties,
        enhance_placeholders: templateData.enhance_placeholders
      };

      const response = await axios.post(`${API_URL}/templates/generate`, requestData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      });

      const newTemplate = {
        id: response.data.id,
        name: response.data.name,
        content: response.data.template,
        template_type: response.data.template_type,
        document_type: response.data.document_type,
        format: response.data.format,
        placeholders: response.data.placeholders,
        isAIgenerated: true,
        usage_count: 0,
        rating: "4.5",
        tags: [response.data.template_type.toLowerCase().replace(' ', '_'), response.data.document_type],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preview_html: response.data.preview_html,
        sections: response.data.sections || [],
        suggested_fields: response.data.suggested_fields || []
      };

      setGeneratedTemplate(newTemplate);
      setGenerationStep(2);
      
    } catch (error) {
      console.error('Error generating template:', error);
      setError(
        error.response?.data?.detail || 
        error.message || 
        'Failed to generate template. Please try again.'
      );
      setGenerationStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleUseGeneratedTemplate = () => {
    if (generatedTemplate && onTemplateGenerated) {
      onTemplateGenerated(generatedTemplate);
    }
    onClose();
  };

  const resetGenerator = () => {
    setGenerationStep(0);
    setTemplateData({
      name: '',
      document_type: 'letters',
      template_type: 'Business Letter',
      description: '',
      instructions: '',
      placeholders: {},
      enhance_placeholders: true,
      format: 'pdf'
    });
    setGeneratedTemplate(null);
    setSuggestions({ placeholders: [], properties: [], sections: [] });
    setError(null);
  };

  const handleRetry = () => {
    setError(null);
    checkApiStatus().then(isOnline => {
      if (isOnline) {
        loadDocumentTypes();
      }
    });
  };

  // Fallback data functions
  const getFallbackDocumentTypes = () => ({
    letters: {
      name: "Letters",
      icon: "✉️",
      description: "Professional correspondence documents",
      templates: {
        "Business Letter": { description: "Professional business correspondence", category: "business" },
        "Offer Letter": { description: "Employment offer documents", category: "employment" },
        "Cover Letter": { description: "Job application cover letters", category: "employment" },
        "Recommendation Letter": { description: "Professional recommendations", category: "professional" }
      }
    },
    forms: {
      name: "Forms",
      icon: "📋",
      description: "Structured forms and applications",
      templates: {
        "Application Form": { description: "General application form", category: "application" },
        "Registration Form": { description: "Event or service registration", category: "registration" }
      }
    }
  });

  const getFallbackSuggestions = (templateType, documentType) => ({
    placeholders: [
      { key: "document_title", description: "Document title", type: "text", required: true, default_value: "", section: "header" },
      { key: "date", description: "Document date", type: "date", required: true, default_value: "", section: "header" },
      { key: "content", description: "Main content", type: "text", required: true, default_value: "", section: "body" },
      { key: "signature", description: "Signature", type: "signature", required: true, default_value: "", section: "closing" }
    ],
    properties: [],
    sections: [
      { name: "header", description: "Document header", required: true, order: 1 },
      { name: "body", description: "Main content", required: true, order: 2 },
      { name: "closing", description: "Closing section", required: true, order: 3 }
    ]
  });

  // Load document types when modal opens
  useEffect(() => {
    if (open) {
      checkApiStatus().then(isOnline => {
        if (isOnline) {
          loadDocumentTypes();
        }
      });
    }
  }, [open]);

  // Load suggestions when template type changes
  useEffect(() => {
    if (open && templateData.template_type && templateData.document_type && apiStatus === 'online') {
      loadPlaceholderSuggestions();
    }
  }, [templateData.template_type, templateData.document_type, open, apiStatus]);

  const getDocumentIcon = (docType) => {
    const icons = {
      letters: <Description color="primary" />,
      forms: <Assignment color="secondary" />,
      contracts: <Ballot color="warning" />,
      reports: <Feed color="info" />
    };
    return icons[docType] || <Description />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      onExited={resetGenerator}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoFixHigh color="primary" />
          <Typography variant="h6">AI Template Generator</Typography>
          <Chip 
            label={apiStatus === 'online' ? 'Online' : 'Offline'} 
            color={apiStatus === 'online' ? 'success' : 'error'} 
            size="small" 
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={generationStep} sx={{ mb: 3 }}>
          <Step><StepLabel>Configure</StepLabel></Step>
          <Step><StepLabel>Generate</StepLabel></Step>
          <Step><StepLabel>Complete</StepLabel></Step>
        </Stepper>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              RETRY
            </Button>
          }>
            {error}
          </Alert>
        )}

        {generationStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Template Name"
              value={templateData.name}
              onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Professional Business Letter Template"
              disabled={apiStatus === 'offline'}
            />
            
            <FormControl fullWidth disabled={apiStatus === 'offline'}>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={templateData.document_type}
                label="Document Type"
                onChange={(e) => {
                  const newDocType = e.target.value;
                  const newTemplates = Object.keys(documentTypes[newDocType]?.templates || {});
                  setTemplateData(prev => ({ 
                    ...prev, 
                    document_type: newDocType,
                    template_type: newTemplates[0] || ''
                  }));
                }}
              >
                {Object.entries(documentTypes).map(([key, docType]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getDocumentIcon(key)}
                      <Box>
                        <Typography variant="body2">{docType.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {docType.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={apiStatus === 'offline'}>
              <InputLabel>Template Type</InputLabel>
              <Select
                value={templateData.template_type}
                label="Template Type"
                onChange={(e) => setTemplateData(prev => ({ ...prev, template_type: e.target.value }))}
              >
                {Object.keys(documentTypes[templateData.document_type]?.templates || {}).map((template) => (
                  <MenuItem key={template} value={template}>
                    <Box>
                      <Typography variant="body2">{template}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {documentTypes[templateData.document_type]?.templates[template]?.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Output Format</InputLabel>
              <Select
                value={templateData.format}
                label="Output Format"
                onChange={(e) => setTemplateData(prev => ({ ...prev, format: e.target.value }))}
              >
                <MenuItem value="pdf">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PictureAsPdf />
                    PDF Document
                  </Box>
                </MenuItem>
                <MenuItem value="docx">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Article />
                    Word Document
                  </Box>
                </MenuItem>
                <MenuItem value="txt">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextFields />
                    Plain Text
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="AI Instructions"
              value={templateData.instructions}
              onChange={(e) => setTemplateData(prev => ({ ...prev, instructions: e.target.value }))}
              multiline
              rows={3}
              placeholder="Provide specific instructions for the AI to generate your template..."
              helperText="Be specific about the content, structure, and style you want"
              disabled={apiStatus === 'offline'}
            />

            {/* Placeholder Suggestions */}
            {suggestions.placeholders.length > 0 && (
              <Accordion disabled={apiStatus === 'offline'}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>AI-Suggested Fields ({suggestions.placeholders.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {suggestions.placeholders.map((ph, index) => (
                      <Box key={ph.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {ph.key.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ph.description} • {ph.type} • {ph.required ? 'Required' : 'Optional'}
                          </Typography>
                        </Box>
                        <Chip 
                          label={ph.section} 
                          size="small" 
                          color={ph.required ? "primary" : "default"}
                          variant={ph.required ? "filled" : "outlined"}
                        />
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={templateData.enhance_placeholders}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, enhance_placeholders: e.target.checked }))}
                  color="primary"
                  disabled={apiStatus === 'offline'}
                />
              }
              label="Use AI to enhance placeholders and structure"
            />
          </Box>
        )}

        {generationStep === 1 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {loading ? (
              <>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Generating Your Template...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI is creating a professional {templateData.template_type} template
                </Typography>
                <LinearProgress sx={{ mt: 2 }} />
              </>
            ) : (
              <Typography>Ready to generate...</Typography>
            )}
          </Box>
        )}

        {generationStep === 2 && generatedTemplate && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Template Generated Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your AI-generated "{generatedTemplate.name}" template is ready to use.
            </Typography>
            
            <Card variant="outlined" sx={{ textAlign: 'left', mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{generatedTemplate.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {templateData.document_type} • {templateData.template_type}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  <Chip label={generatedTemplate.document_type} size="small" />
                  <Chip label={generatedTemplate.template_type} size="small" variant="outlined" />
                  <Chip label="AI Generated" size="small" color="primary" />
                  <Chip label={generatedTemplate.format.toUpperCase()} size="small" color="secondary" />
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {Object.keys(generatedTemplate.placeholders || {}).length} placeholders • {generatedTemplate.sections?.length || 0} sections
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {generationStep === 0 && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={generateTemplate}
              disabled={!templateData.name || !templateData.template_type || apiStatus === 'offline'}
              startIcon={<AutoFixHigh />}
            >
              {apiStatus === 'offline' ? 'Server Offline' : 'Generate Template'}
            </Button>
          </>
        )}
        
        {generationStep === 1 && loading && (
          <Button disabled>Generating...</Button>
        )}
        
        {generationStep === 2 && (
          <>
            <Button onClick={resetGenerator}>Create Another</Button>
            <Button variant="contained" onClick={handleUseGeneratedTemplate}>
              Use This Template
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};


// -----------------------------
// Template Card Component
// -----------------------------
const TemplateCard = ({ template, onSelect, onPreview, onEdit, onUse, viewMode = 'grid' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Safe access to template properties with fallbacks
  const templateName = template?.name || 'Unnamed Template';
  const templateDescription = template?.description || 'No description available';
  const isAIgenerated = template?.isAIgenerated || false;
  const documentType = template?.document_type || 'document';
  const templateType = template?.template_type || 'Template';
  const format = template?.format || 'PDF';
  const tags = template?.tags || [];
  const rating = template?.rating || '0';
  const usageCount = template?.usage_count || 0;
  const placeholderCount = Object.keys(template?.placeholders || {}).length;
  const sectionCount = template?.sections?.length || 0;

  const handleUseTemplate = () => {
    if (template && onUse) {
      onUse(template);
    }
  };

  const handlePreview = () => {
    if (template && onPreview) {
      onPreview(template);
    }
  };

  const getDocumentIcon = (docType) => {
    const icons = {
      letters: <Description color="primary" />,
      forms: <Assignment color="secondary" />,
      contracts: <Ballot color="warning" />,
      reports: <Feed color="info" />
    };
    return icons[docType] || <Description />;
  };

  if (viewMode === 'list') {
    return (
      <Card 
        component={motion.div}
        whileHover={{ scale: 1.02 }}
        sx={{ 
          mb: 2, 
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: 2
          }
        }}
      >
        <CardContent sx={{ '&:last-child': { pb: 2 } }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} sm={3} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: isAIgenerated ? 'primary.main' : 'secondary.main',
                    width: 40,
                    height: 40
                  }}
                >
                  {isAIgenerated ? <AutoFixHigh /> : <DesignServices />}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {documentType}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={5} md={6}>
              <Typography variant="h6" noWrap>
                {templateName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {templateType} • {templateDescription}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {tags.length > 3 && (
                  <Chip
                    label={`+${tags.length - 3}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={4} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                    <Typography variant="body2">
                      {rating}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({usageCount})
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {placeholderCount} fields • {sectionCount} sections
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Preview">
                    <IconButton size="small" onClick={handlePreview}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Use Template">
                    <IconButton size="small" onClick={handleUseTemplate} color="primary">
                      <PlayArrow />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  // Grid View
  return (
    <Card 
      component={motion.div}
      whileHover={{ scale: 1.05 }}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 4
        }
      }}
    >
      <CardActionArea onClick={handlePreview} sx={{ flex: 1 }}>
        <CardContent>
          {/* Template Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: isAIgenerated ? 'primary.main' : 'secondary.main',
                width: 48,
                height: 48
              }}
            >
              {isAIgenerated ? <AutoFixHigh /> : <DesignServices />}
            </Avatar>
            
            <Box sx={{ textAlign: 'right' }}>
              <Chip 
                label={isAIgenerated ? 'AI Generated' : 'Manual'} 
                size="small" 
                color={isAIgenerated ? 'primary' : 'secondary'}
                sx={{ mb: 0.5 }}
              />
              <Typography variant="caption" color="text.secondary" display="block">
                {format}
              </Typography>
            </Box>
          </Box>

          {/* Template Title and Description */}
          <Typography variant="h6" gutterBottom noWrap>
            {templateName}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {templateType} • {templateDescription}
          </Typography>

          {/* Template Tags */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {tags.slice(0, 2).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
              />
            ))}
            {tags.length > 2 && (
              <Chip
                label={`+${tags.length - 2}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Template Stats */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getDocumentIcon(documentType)}
              <Typography variant="caption" color="text.secondary">
                {documentType}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star sx={{ fontSize: 16, color: 'warning.main' }} />
              <Typography variant="caption">
                {rating}
              </Typography>
            </Box>
          </Box>

          {/* Template Preview (Placeholder) */}
          <Paper
            variant="outlined"
            sx={{
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default',
              mb: 2
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <PictureAsPdf sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {placeholderCount} fields • {sectionCount} sections
              </Typography>
            </Box>
          </Paper>
        </CardContent>
      </CardActionArea>

      {/* Template Footer */}
      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Used {usageCount} times
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Preview">
            <IconButton size="small" onClick={handlePreview}>
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Use Template">
            <IconButton size="small" onClick={handleUseTemplate} color="primary">
              <PlayArrow />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

// -----------------------------
// Template Preview Modal
// -----------------------------
const TemplatePreviewModal = ({ template, open, onClose, onUse }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Safe access to template properties with fallbacks
  const templateName = template?.name || 'Unnamed Template';
  const templateDescription = template?.description || 'No description available';
  const documentType = template?.document_type || 'document';
  const isAIgenerated = template?.isAIgenerated || false;
  const templateType = template?.template_type || 'Template';
  const usageCount = template?.usage_count || 0;
  const rating = template?.rating || '0';
  const tags = template?.tags || [];
  const content = template?.content || '<p>Template preview content will appear here</p>';
  const placeholders = template?.placeholders || {};
  const sections = template?.sections || [];
  const updatedAt = template?.updated_at || template?.created_at || new Date().toISOString();

  const handleUseTemplate = () => {
    if (template && onUse) {
      onUse(template);
    }
    onClose();
  };

  // Don't render if template is null
  if (!template) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {templateName} - Preview
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Template Preview Content */}
            <Paper
              sx={{
                p: 3,
                minHeight: 400,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'auto'
              }}
            >
              <Box
                sx={{
                  
                  lineHeight: 1.6,
                  maxWidth: 800,
                  margin: '0 auto'
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            {/* Template Details */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Template Details
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Category />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Document Type" 
                      secondary={documentType} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <AutoFixHigh />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Generation Type" 
                      secondary={isAIgenerated ? 'AI Generated' : 'Manual'} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <AccessTime />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Last Updated" 
                      secondary={new Date(updatedAt).toLocaleDateString()} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Usage Count" 
                      secondary={usageCount} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Star />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Rating" 
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={parseFloat(rating) || 0} readOnly size="small" />
                          <Typography variant="body2">
                            ({rating})
                          </Typography>
                        </Box>
                      } 
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Ballot />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Placeholders" 
                      secondary={Object.keys(placeholders).length} 
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Assignment />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Sections" 
                      secondary={sections.length} 
                    />
                  </ListItem>
                </List>

                {/* Template Tags */}
                {tags.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" />
                      ))}
                    </Box>
                  </>
                )}

                {/* Placeholder List */}
                {Object.keys(placeholders).length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Available Fields ({Object.keys(placeholders).length})
                    </Typography>
                    <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                      <List dense>
                        {Object.keys(placeholders).slice(0, 10).map((key, index) => (
                          <ListItem key={key} sx={{ py: 0.5 }}>
                            <ListItemText 
                              primary={key.replace(/_/g, ' ').toUpperCase()}
                              secondary={placeholders[key] || 'Empty field'}
                            />
                          </ListItem>
                        ))}
                        {Object.keys(placeholders).length > 10 && (
                          <ListItem sx={{ py: 0.5 }}>
                            <ListItemText 
                              primary={`... and ${Object.keys(placeholders).length - 10} more fields`}
                              secondary="All fields will be available in the editor"
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </>
                )}
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleUseTemplate}
                  fullWidth
                  size="large"
                >
                  Use This Template
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="outlined" onClick={handleUseTemplate}>
          Use Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// -----------------------------
// Main AI Template Browser Component
// -----------------------------
const AITemplateBrowser = ({ onTemplateSelect, onTemplateUse, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State Management
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
  const [page, setPage] = useState(1);
  const [documentTypes, setDocumentTypes] = useState({});
  const templatesPerPage = 12;

  const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

  // Categories for filtering
  const categories = [
    { value: 'all', label: 'All Templates', count: 0 },
    { value: 'letters', label: 'Letters', count: 0 },
    { value: 'forms', label: 'Forms', count: 0 },
    { value: 'contracts', label: 'Contracts', count: 0 },
    { value: 'reports', label: 'Reports', count: 0 },
    { value: 'ai_generated', label: 'AI Generated', count: 0 },
    { value: 'manual', label: 'Manual', count: 0 }
  ];

  // Sort options
  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'name', label: 'Alphabetical' },
    { value: 'usage', label: 'Most Used' }
  ];

  // Load all templates from backend
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load user's templates
      const [templatesResponse, documentTypesResponse] = await Promise.all([
        axios.get(`${API_URL}/templates/my-templates`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/templates/document-types`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      // Ensure we have an array, even if API returns null/undefined
      const templatesData = Array.isArray(templatesResponse.data) ? templatesResponse.data : [];
      setTemplates(templatesData);
      setFilteredTemplates(templatesData);
      setDocumentTypes(documentTypesResponse.data.document_types || {});
      
      // Update category counts
      updateCategoryCounts(templatesData);
      
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback to sample data
      const sampleTemplates = generateSampleTemplates();
      setTemplates(sampleTemplates);
      setFilteredTemplates(sampleTemplates);
      updateCategoryCounts(sampleTemplates);
    } finally {
      setLoading(false);
    }
  };

  // Generate sample templates for demo
  const generateSampleTemplates = () => {
    return [
      {
        id: '1',
        name: 'Professional Business Letter',
        description: 'Formal business correspondence template with company branding',
        document_type: 'letters',
        template_type: 'Business Letter',
        isAIgenerated: true,
        usage_count: 45,
        rating: '4.8',
        tags: ['business', 'professional', 'corporate'],
        content: '<div>Business Letter Template Content</div>',
        placeholders: { sender_name: '', recipient_name: '', date: '', subject: '', body_content: '' },
        sections: ['header', 'recipient', 'subject', 'body', 'closing'],
        format: 'pdf',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Employment Contract',
        description: 'Comprehensive employment agreement template',
        document_type: 'contracts',
        template_type: 'Employment Contract',
        isAIgenerated: false,
        usage_count: 32,
        rating: '4.6',
        tags: ['legal', 'employment', 'contract'],
        content: '<div>Employment Contract Template Content</div>',
        placeholders: { employee_name: '', employer_name: '', start_date: '', salary: '', position: '' },
        sections: ['parties', 'terms', 'compensation', 'responsibilities'],
        format: 'pdf',
        created_at: '2024-01-10T14:20:00Z',
        updated_at: '2024-01-10T14:20:00Z'
      }
    ];
  };

  // Update category counts
  const updateCategoryCounts = (templateList) => {
    const templateArray = Array.isArray(templateList) ? templateList : [];
    
    categories.forEach(cat => {
      if (cat.value === 'all') {
        cat.count = templateArray.length;
      } else if (cat.value === 'ai_generated') {
        cat.count = templateArray.filter(t => t?.isAIgenerated).length;
      } else if (cat.value === 'manual') {
        cat.count = templateArray.filter(t => t && !t.isAIgenerated).length;
      } else {
        cat.count = templateArray.filter(t => t?.document_type === cat.value).length;
      }
    });
  };

  // Filter and sort templates
  const filterAndSortTemplates = useCallback(() => {
    // Ensure templates is an array
    const templateArray = Array.isArray(templates) ? templates : [];
    
    let filtered = templateArray.filter(template => template != null);

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.template_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'ai_generated') {
        filtered = filtered.filter(t => t.isAIgenerated);
      } else if (selectedCategory === 'manual') {
        filtered = filtered.filter(t => !t.isAIgenerated);
      } else {
        filtered = filtered.filter(t => t.document_type === selectedCategory);
      }
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
        case 'popular':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'rating':
          return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'usage':
          return (b.usage_count || 0) - (a.usage_count || 0);
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
    setPage(1); // Reset to first page when filters change
  }, [templates, searchQuery, selectedCategory, sortBy]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(() => {
      filterAndSortTemplates();
    }, 300),
    [filterAndSortTemplates]
  );

  // Load templates on component mount
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  // Apply filters when dependencies change
  useEffect(() => {
    debouncedSearch();
  }, [searchQuery, selectedCategory, sortBy, templates, debouncedSearch]);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    if (template && onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  // Handle template use
  const handleTemplateUse = (template) => {
    if (template && onTemplateUse) {
      onTemplateUse(template);
    }
    setToast({
      open: true,
      message: `"${template.name}" template selected for editing!`,
      type: 'success'
    });
  };

  // Handle template preview
  const handleTemplatePreview = (template) => {
    if (template) {
      setPreviewTemplate(template);
      setPreviewOpen(true);
    }
  };

  // Handle template edit
  const handleTemplateEdit = (template) => {
    handleTemplateUse(template);
  };

  // Handle AI template generation
  const handleAITemplateGenerated = (template) => {
    if (template) {
      // Add the new template to the beginning of the list
      setTemplates(prev => [template, ...prev]);
      setToast({
        open: true,
        message: 'AI template generated successfully!',
        type: 'success'
      });
      handleTemplateUse(template);
    }
  };

  // Calculate pagination
  const paginatedTemplates = filteredTemplates.slice(
    (page - 1) * templatesPerPage,
    page * templatesPerPage
  );

  const totalPages = Math.ceil(filteredTemplates.length / templatesPerPage);

  // Don't render if not open
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isMobile}
      sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="div">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToy color="primary" />
              AI Template Browser
            </Box>
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header with Search and Controls */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(category => (
                      <MenuItem key={category.value} value={category.value}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{category.label}</span>
                          <Badge badgeContent={category.count} color="primary" sx={{ ml: 1 }} />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {sortOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Tooltip title="Grid View">
                    <IconButton
                      size="small"
                      onClick={() => setViewMode('grid')}
                      color={viewMode === 'grid' ? 'primary' : 'default'}
                    >
                      <ViewModule />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="List View">
                    <IconButton
                      size="small"
                      onClick={() => setViewMode('list')}
                      color={viewMode === 'list' ? 'primary' : 'default'}
                    >
                      <ViewList />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadTemplates}
                  size="small"
                >
                  Refresh
                </Button>

                <Button
                  variant="contained"
                  startIcon={<AutoFixHigh />}
                  onClick={() => setAiGeneratorOpen(true)}
                  size="small"
                >
                  AI Generate
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab 
                icon={<Category />} 
                label={`All Templates (${templates.length})`} 
              />
              <Tab 
                icon={<AutoFixHigh />} 
                label={`AI Generated (${categories.find(c => c.value === 'ai_generated')?.count || 0})`} 
              />
              <Tab 
                icon={<DesignServices />} 
                label={`Manual (${categories.find(c => c.value === 'manual')?.count || 0})`} 
              />
              <Tab icon={<History />} label="Recently Used" />
              <Tab icon={<TrendingUp />} label="Popular" />
            </Tabs>
          </Box>

          {/* Loading State */}
          {loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Loading Templates...
              </Typography>
            </Box>
          )}

          {/* Empty State */}
          {!loading && filteredTemplates.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <FolderOpen sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No templates found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery 
                  ? 'Try adjusting your search criteria' 
                  : 'Get started by creating your first template'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AutoFixHigh />}
                onClick={() => setAiGeneratorOpen(true)}
              >
                Generate AI Template
              </Button>
            </Box>
          )}

          {/* Templates Grid/List */}
          {!loading && filteredTemplates.length > 0 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Showing {paginatedTemplates.length} of {filteredTemplates.length} templates
              </Typography>

              {viewMode === 'grid' ? (
                <Grid container spacing={2}>
                  {paginatedTemplates.map(template => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                      <TemplateCard
                        template={template}
                        onSelect={handleTemplateSelect}
                        onPreview={handleTemplatePreview}
                        onEdit={handleTemplateEdit}
                        onUse={handleTemplateUse}
                        viewMode="grid"
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box>
                  {paginatedTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleTemplateSelect}
                      onPreview={handleTemplatePreview}
                      onEdit={handleTemplateEdit}
                      onUse={handleTemplateUse}
                      viewMode="list"
                    />
                  ))}
                </Box>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          onUse={handleTemplateUse}
        />
      )}

      {/* Real-time AI Template Generator Modal */}
      <RealTimeTemplateGenerator
        open={aiGeneratorOpen}
        onClose={() => setAiGeneratorOpen(false)}
        onTemplateGenerated={handleAITemplateGenerated}
      />

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={toast.type} 
          variant="filled"
          onClose={() => setToast({ ...toast, open: false })}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default AITemplateBrowser;
