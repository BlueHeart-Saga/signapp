// src/pages/AITemplateBuilder.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  AutoAwesome as AutoAwesomeIcon,
  AddCircle as AddCircleIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  FileCopy as CopyIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Article as ArticleIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  Description as FormIcon,
  Mail as MailIcon,
  Note as NoteIcon,
  Summarize as ReportIcon,
  AssignmentTurnedIn as ApplicationIcon,
  Checklist as ChecklistIcon,
  QuestionAnswer as QuestionnaireIcon,
  RateReview as FeedbackIcon,
  Poll as SurveyIcon,
  CardMembership as CertificateIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import AITemplatePromptForm from './AITemplatePromptForm';
import AITemplatePreview from './AITemplatePreview';
import AITemplateAnalyzer from './AITemplateAnalyzer';
import api from '../../services/api';

const AITemplateBuilder = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [templateTypeFilter, setTemplateTypeFilter] = useState('all');

  const templateTypes = [
    { value: 'contract', label: 'Contract', icon: <DescriptionIcon />, color: '#4caf50' },
    { value: 'agreement', label: 'Agreement', icon: <AssignmentIcon />, color: '#2196f3' },
    { value: 'nda', label: 'NDA', icon: <ArticleIcon />, color: '#9c27b0' },
    { value: 'proposal', label: 'Proposal', icon: <DescriptionIcon />, color: '#ff9800' },
    { value: 'invoice', label: 'Invoice', icon: <ReceiptIcon />, color: '#f44336' },
    { value: 'form', label: 'Form', icon: <FormIcon />, color: '#795548' },
    { value: 'letter', label: 'Letter', icon: <MailIcon />, color: '#607d8b' },
    { value: 'resume', label: 'Resume', icon: <DescriptionIcon />, color: '#00bcd4' },
    { value: 'report', label: 'Report', icon: <ReportIcon />, color: '#8bc34a' },
    { value: 'memo', label: 'Memo', icon: <NoteIcon />, color: '#ff5722' },
    { value: 'application', label: 'Application', icon: <ApplicationIcon />, color: '#673ab7' },
    { value: 'receipt', label: 'Receipt', icon: <ReceiptIcon />, color: '#009688' },
    { value: 'quotation', label: 'Quotation', icon: <ReceiptIcon />, color: '#3f51b5' },
    { value: 'order_form', label: 'Order Form', icon: <AssignmentIcon />, color: '#e91e63' },
    { value: 'checklist', label: 'Checklist', icon: <ChecklistIcon />, color: '#ffc107' },
    { value: 'questionnaire', label: 'Questionnaire', icon: <QuestionnaireIcon />, color: '#cddc39' },
    { value: 'feedback_form', label: 'Feedback Form', icon: <FeedbackIcon />, color: '#00bcd4' },
    { value: 'survey', label: 'Survey', icon: <SurveyIcon />, color: '#ff9800' },
    { value: 'certificate', label: 'Certificate', icon: <CertificateIcon />, color: '#4caf50' }
  ];

  const documentStyles = [
    { value: 'modern', label: 'Modern', color: '#2196f3' },
    { value: 'classic', label: 'Classic', color: '#795548' },
    { value: 'formal', label: 'Formal', color: '#3f51b5' },
    { value: 'casual', label: 'Casual', color: '#4caf50' },
    { value: 'legal', label: 'Legal', color: '#f44336' },
    { value: 'business', label: 'Business', color: '#607d8b' },
    { value: 'creative', label: 'Creative', color: '#9c27b0' },
    { value: 'minimal', label: 'Minimal', color: '#00bcd4' }
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'neutral', label: 'Neutral' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai/templates/user-templates');
      setTemplates(response.data.templates || []);
    } catch (err) {
      setError('Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTemplate = async (data) => {
    try {
      setGenerating(true);
      const response = await api.post('/ai/templates/generate', data);
      
      setSnackbar({
        open: true,
        message: 'Template generated successfully!',
        severity: 'success'
      });

      // Add to templates list
      const newTemplate = {
        id: response.data.template_id,
        title: response.data.title,
        template_type: data.template_type,
        created_at: response.data.created_at,
        field_count: response.data.fields.length
      };
      
      setTemplates([newTemplate, ...templates]);
      setSelectedTemplate(newTemplate);
      
      // Open preview
      setPreviewOpen(true);
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to generate template',
        severity: 'error'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleEditTemplate = (template) => {
    navigate(`/ai/templates/${template.id}/edit`);
  };

  const handlePreviewTemplate = async (template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleCloneTemplate = async (template) => {
    try {
      const response = await api.post(`/ai/templates/${template.id}/clone`, {
        new_name: `${template.title} (Copy)`
      });

      setSnackbar({
        open: true,
        message: 'Template cloned successfully',
        severity: 'success'
      });

      loadTemplates();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to clone template',
        severity: 'error'
      });
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.title}"?`)) return;

    try {
      await api.delete(`/ai/templates/templates/${template.id}`);
      
      setSnackbar({
        open: true,
        message: 'Template deleted successfully',
        severity: 'success'
      });

      setTemplates(templates.filter(t => t.id !== template.id));
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete template',
        severity: 'error'
      });
    }
  };

  const handleConvertToDocument = async (template) => {
    try {
      const response = await api.post(`/ai/templates/templates/${template.id}/convert-to-document`, {
        filename: template.title
      });

      setSnackbar({
        open: true,
        message: 'Template converted to document successfully',
        severity: 'success'
      });

      // Navigate to the document
      navigate(`/documents/${response.data.document_id}`);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to convert template',
        severity: 'error'
      });
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = templateTypeFilter === 'all' || template.template_type === templateTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          AI Template Builder
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Generate professional document templates with AI assistance
        </Typography>

        <Tabs 
          value={activeTab} 
          onChange={(e, value) => setActiveTab(value)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          <Tab 
            icon={<SmartToyIcon />} 
            iconPosition="start" 
            label="Generate New" 
          />
          <Tab 
            icon={<DescriptionIcon />} 
            iconPosition="start" 
            label="My Templates" 
          />
          <Tab 
            icon={<CloudUploadIcon />} 
            iconPosition="start" 
            label="Analyze Document" 
          />
        </Tabs>
      </Box>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 0 && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AITemplatePromptForm
              templateTypes={templateTypes}
              documentStyles={documentStyles}
              tones={tones}
              onGenerate={handleGenerateTemplate}
              loading={generating}
            />
          </motion.div>
        )}

        {activeTab === 1 && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Filters */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, opacity: 0.7 }}>
                          🔍
                        </Box>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Filter by Type</InputLabel>
                    <Select
                      value={templateTypeFilter}
                      onChange={(e) => setTemplateTypeFilter(e.target.value)}
                      label="Filter by Type"
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      {templateTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {type.icon}
                            {type.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Templates Grid */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : filteredTemplates.length === 0 ? (
              <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
                <SmartToyIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No templates found
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm || templateTypeFilter !== 'all' 
                    ? 'Try adjusting your search filters'
                    : 'Generate your first AI template to get started'
                  }
                </Typography>
                {!searchTerm && templateTypeFilter === 'all' && (
                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={() => setActiveTab(0)}
                  >
                    Generate First Template
                  </Button>
                )}
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {filteredTemplates.map((template) => {
                  const templateType = templateTypes.find(t => t.value === template.template_type);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                      <motion.div
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      >
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            border: `2px solid ${alpha(templateType?.color || '#2196f3', 0.1)}`,
                            '&:hover': {
                              borderColor: alpha(templateType?.color || '#2196f3', 0.3),
                              boxShadow: 4
                            }
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Box sx={{ 
                                p: 1, 
                                borderRadius: 1,
                                bgcolor: alpha(templateType?.color || '#2196f3', 0.1),
                                color: templateType?.color || '#2196f3',
                                mr: 2
                              }}>
                                {templateType?.icon || <DescriptionIcon />}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {templateType?.label || 'Template'}
                              </Typography>
                            </Box>
                            
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                              {template.title}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {template.description || 'AI-generated document template'}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                              <Chip 
                                label={`${template.field_count || 0} fields`} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                label={template.version ? `v${template.version}` : 'v1'} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                              Created: {new Date(template.created_at).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                          
                          <CardActions sx={{ p: 2, pt: 0 }}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Tooltip title="Preview">
                                <IconButton 
                                  size="small"
                                  onClick={() => handlePreviewTemplate(template)}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Edit">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleEditTemplate(template)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Clone">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleCloneTemplate(template)}
                                >
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Convert to Document">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleConvertToDocument(template)}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <DescriptionIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleDeleteTemplate(template)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardActions>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </motion.div>
        )}

        {activeTab === 2 && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AITemplateAnalyzer onAnalyze={() => setAnalyzeOpen(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="xl"
        fullWidth
        fullScreen={window.innerWidth < 768}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="div">
            {selectedTemplate?.title || 'Template Preview'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedTemplate && (
            <AITemplatePreview
              templateId={selectedTemplate.id}
              mode="preview"
              onClose={() => setPreviewOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AITemplateBuilder;
