// src/components/ai-templates/AITemplateAnalyzer.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  Upload as UploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  InsertDriveFile as FileIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../services/api';

const AITemplateAnalyzer = ({ onAnalyze }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    fields: true,
    clauses: true,
    recommendations: true
  });

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isFileSupported(droppedFile)) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Unsupported file type. Please upload PDF, DOCX, or text files.');
    }
  };

  const isFileSupported = (file) => {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/html'
    ];
    return supportedTypes.includes(file.type) || 
           file.name.endsWith('.pdf') || 
           file.name.endsWith('.docx') || 
           file.name.endsWith('.doc') ||
           file.name.endsWith('.txt') ||
           file.name.endsWith('.html');
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file to analyze');
      return;
    }

    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/ai/templates/analyze-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setAnalysis(response.data);
      onAnalyze?.(response.data);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Analyze Document for Template Creation
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload any document and our AI will analyze it to suggest the best template structure, 
        identify form fields, and provide recommendations.
      </Typography>

      {!analysis ? (
        <>
          {/* Upload Area */}
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: dragOver ? 'primary.main' : 'divider',
              backgroundColor: dragOver ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              mb: 4
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.html"
              style={{ display: 'none' }}
            />
            
            <UploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              {file ? file.name : 'Drag & Drop or Click to Upload'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Supported formats: PDF, DOCX, DOC, TXT, HTML
            </Typography>
            
            {file && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={file.type || 'File'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            )}
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={!file && !error}
            >
              Reset
            </Button>
            
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={!file || uploading}
              startIcon={uploading ? null : <DescriptionIcon />}
              sx={{
                background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                px: 4
              }}
            >
              {uploading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Analyzing...
                </>
              ) : (
                'Analyze Document'
              )}
            </Button>
          </Box>
        </>
      ) : (
        /* Analysis Results */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Summary Card */}
          <Card sx={{ mb: 4, borderLeft: 4, borderLeftColor: 'primary.main' }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    {analysis.document_type?.replace('_', ' ').toUpperCase()} Analysis Complete
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {analysis.summary}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={`${analysis.word_count} words`}
                      size="small"
                      icon={<FileIcon />}
                    />
                    {analysis.page_count && (
                      <Chip
                        label={`${analysis.page_count} pages`}
                        size="small"
                        icon={<DescriptionIcon />}
                      />
                    )}
                    <Chip
                      label={analysis.risk_level}
                      size="small"
                      color={getRiskColor(analysis.risk_level)}
                      icon={<SecurityIcon />}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<LightbulbIcon />}
                    onClick={() => {
                      // Navigate to template generation with analysis data
                      onAnalyze?.(analysis);
                    }}
                  >
                    Create Template from Analysis
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Fields Section */}
          <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <Box 
              sx={{ 
                p: 2, 
                backgroundColor: 'action.hover',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => toggleSection('fields')}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Suggested Fields ({analysis.potential_fields?.length || 0})
              </Typography>
              <IconButton size="small">
                {expandedSections.fields ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.fields}>
              <List sx={{ p: 0 }}>
                {analysis.potential_fields?.map((field, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 3, py: 2 }}>
                      <ListItemIcon>
                        {field.required ? (
                          <CheckCircleIcon color="primary" />
                        ) : (
                          <InfoIcon color="action" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={field.label}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={field.type} 
                              size="small" 
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                            {field.required && (
                              <Chip 
                                label="Required" 
                                size="small" 
                                color="error"
                                variant="outlined"
                              />
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              {field.description || 'Field for data entry'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < analysis.potential_fields.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Collapse>
          </Paper>

          {/* Key Clauses */}
          {analysis.key_clauses?.length > 0 && (
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: 'action.hover',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => toggleSection('clauses')}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Key Clauses ({analysis.key_clauses.length})
                </Typography>
                <IconButton size="small">
                  {expandedSections.clauses ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.clauses}>
                <List sx={{ p: 0 }}>
                  {analysis.key_clauses.map((clause, index) => (
                    <ListItem key={index} sx={{ px: 3, py: 1.5 }}>
                      <ListItemIcon>
                        <StorageIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={clause}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Paper>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: 'action.hover',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => toggleSection('recommendations')}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Recommendations ({analysis.recommendations.length})
                </Typography>
                <IconButton size="small">
                  {expandedSections.recommendations ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.recommendations}>
                <List sx={{ p: 0 }}>
                  {analysis.recommendations.map((recommendation, index) => (
                    <ListItem key={index} sx={{ px: 3, py: 1.5 }}>
                      <ListItemIcon>
                        <LightbulbIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={recommendation}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Paper>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleReset}
            >
              Analyze Another Document
            </Button>
            
            <Button
              variant="contained"
              onClick={() => {
                // Use analysis to generate template
                onAnalyze?.(analysis);
              }}
              sx={{
                background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                px: 4
              }}
            >
              Generate Template from Analysis
            </Button>
          </Box>
        </motion.div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
            Analyzing document structure and content...
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AITemplateAnalyzer;
