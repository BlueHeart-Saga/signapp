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
  Collapse, Fade, Grow, Zoom, AlertTitle, alpha
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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  EmojiObjects as EmojiObjectsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon,
  ArrowBack as BackIcon,
  Close as CloseIcon
} from '@mui/icons-material';

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
}

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
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [promptsDialogOpen, setPromptsDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
        onTemplateGenerated(response.document_id);
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

  const resetGenerator = () => {
    setDescription('');
    setCategory('');
    setTags('');
    setError(null);
    setGeneratedDocId(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      onExited={resetGenerator}
      PaperProps={{
        sx: { borderRadius: '24px', minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AutoAwesomeIcon color="primary" />
            </Box>
            <Typography variant="h6" fontWeight="700">AI Template Assistant</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Describe your document needs, and our professional AI will generate a structured template with intelligent fields.
        </Typography>

        <Box sx={{ position: 'relative' }}>
          <Paper elevation={0} sx={{
            p: '8px',
            borderRadius: '20px',
            border: '1px solid #e0e0e0',
            bgcolor: '#fcfcfc',
            display: 'flex',
            flexDirection: 'column',
            '&:focus-within': {
              borderColor: 'primary.main',
              bgcolor: 'white',
              boxShadow: '0 8px 32px rgba(13, 148, 136, 0.08)'
            }
          }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="How can I help you create a document today?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="standard"
              disabled={loading}
              InputProps={{
                disableUnderline: true,
                sx: {
                  px: 2.5,
                  py: 2,
                  fontSize: '1.1rem',
                  color: '#1a1a1a'
                }
              }}
            />
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 1,
              pb: 1,
              pt: 0.5
            }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Example Prompts">
                  <IconButton
                    size="small"
                    onClick={() => setPromptsDialogOpen(true)}
                  >
                    <EmojiObjectsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Button
                variant="contained"
                onClick={generateTemplate}
                disabled={loading || !description.trim()}
                sx={{
                  borderRadius: '16px',
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 600
                }}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              >
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </Box>
          </Paper>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Category"
              size="small"
              placeholder="e.g. Legal, HR"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              fullWidth
              label="Tags"
              size="small"
              placeholder="e.g. urgent"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      {/* Example Prompts Sub-Dialog */}
      <Dialog
        open={promptsDialogOpen}
        onClose={() => setPromptsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="700">Explore Prompts</Typography>
          <IconButton onClick={() => setPromptsDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {PROMPT_SUGGESTIONS.map((cat) => (
              <Box key={cat.category} sx={{ mb: 2 }}>
                <Typography variant="overline" color="primary" fontWeight="700">{cat.category}</Typography>
                {cat.prompts.slice(0, 3).map((p) => (
                  <ListItem 
                    button 
                    key={p} 
                    onClick={() => {
                      setDescription(`Create a professional ${p.toLowerCase()}`);
                      setPromptsDialogOpen(false);
                    }}
                    sx={{ borderRadius: '8px', mb: 0.5 }}
                  >
                    <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary={p} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </Box>
            ))}
          </List>
        </DialogContent>
      </Dialog>
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
  const navigate = useNavigate();
  
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

  // Categories for filtering - Matched with backend TemplateType enum
  const categories = [
    { value: 'all', label: 'All Templates', count: 0 },
    { value: 'contract', label: 'Contracts', count: 0 },
    { value: 'agreement', label: 'Agreements', count: 0 },
    { value: 'letter', label: 'Letters', count: 0 },
    { value: 'form', label: 'Forms', count: 0 },
    { value: 'invoice', label: 'Invoices', count: 0 },
    { value: 'report', label: 'Reports', count: 0 },
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
      
      // Load user's templates and types from the new AI Builder endpoints
      const [templatesResponse, documentTypesResponse] = await Promise.all([
        axios.get(`${API_URL}/api/ai/templates/user-templates`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/ai/templates/template-types`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      // The new endpoint returns { templates: [], total: X, ... }
      const templatesData = Array.isArray(templatesResponse.data?.templates) 
        ? templatesResponse.data.templates 
        : [];
        
      setTemplates(templatesData);
      setFilteredTemplates(templatesData);
      
      // Map the array of types to a dictionary for easier lookup if needed
      const typesList = Array.isArray(documentTypesResponse.data) ? documentTypesResponse.data : [];
      const typesMap = {};
      typesList.forEach(type => {
        typesMap[type.value] = type;
      });
      setDocumentTypes(typesMap);
      
      // Update category counts
      updateCategoryCounts(templatesData);
      
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
      setFilteredTemplates([]);
      setToast({ 
        open: true, 
        message: 'Failed to load templates from AI Service. Please check your connection.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };


  // Update category counts
  const updateCategoryCounts = (templateList) => {
    const templateArray = Array.isArray(templateList) ? templateList : [];
    
    categories.forEach(cat => {
      if (cat.value === 'all') {
        cat.count = templateArray.length;
      } else {
        cat.count = templateArray.filter(t => t?.template_type === cat.value).length;
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
      filtered = filtered.filter(t => t?.template_type === selectedCategory);
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
  const handleAITemplateGenerated = (documentId) => {
    if (documentId) {
      setToast({
        open: true,
        message: 'AI template generated successfully! Redirecting to editor...',
        type: 'success'
      });
      
      // Close browser and navigate to editor
      setTimeout(() => {
        onClose();
        navigate(`/user/documentbuilder/${documentId}`);
      }, 1500);
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
