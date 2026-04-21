// src/components/ai-templates/AITemplatePromptForm.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  Slider,
  RadioGroup,
  Radio,
  Stack
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  HelpOutline as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FormatColorText as FormatColorTextIcon,
  Style as StyleIcon,
  Translate as TranslateIcon,
  Tag as TagIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AITemplatePromptForm = ({ templateTypes, documentStyles, tones, onGenerate, loading }) => {
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState('contract');
  const [documentStyle, setDocumentStyle] = useState('modern');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('en');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [includeClauses, setIncludeClauses] = useState([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [temperature, setTemperature] = useState(0.3);
  const [length, setLength] = useState('medium');
  const [examples, setExamples] = useState([]);
  const [validationError, setValidationError] = useState('');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' }
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short (1-2 pages)', icon: '📄' },
    { value: 'medium', label: 'Medium (3-5 pages)', icon: '📑' },
    { value: 'long', label: 'Long (5+ pages)', icon: '📚' }
  ];

  const predefinedClauses = [
    'Confidentiality',
    'Non-compete',
    'Termination',
    'Payment terms',
    'Liability limitation',
    'Dispute resolution',
    'Intellectual property',
    'Warranties',
    'Indemnification',
    'Force majeure'
  ];

  const examplePrompts = [
    {
      title: 'Employment Contract',
      prompt: 'Create an employment contract for a software engineer with 3 months probation period, remote work options, and standard benefits package.'
    },
    {
      title: 'Rental Agreement',
      prompt: 'Generate a residential rental agreement for a 2-bedroom apartment with pet policy, security deposit, and maintenance responsibilities.'
    },
    {
      title: 'NDA Agreement',
      prompt: 'Create a mutual non-disclosure agreement for two companies collaborating on a software development project.'
    },
    {
      title: 'Service Agreement',
      prompt: 'Generate a service agreement for web development services with milestone payments, deliverables, and intellectual property transfer.'
    }
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddClause = (clause) => {
    if (!includeClauses.includes(clause)) {
      setIncludeClauses([...includeClauses, clause]);
    }
  };

  const handleRemoveClause = (clauseToRemove) => {
    setIncludeClauses(includeClauses.filter(clause => clause !== clauseToRemove));
  };

  const handleUseExample = (prompt) => {
    setDescription(prompt);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setValidationError('Please describe what you want to generate');
      return;
    }

    if (description.trim().length < 10) {
      setValidationError('Description should be at least 10 characters');
      return;
    }

    setValidationError('');

    const data = {
      description: description.trim(),
      template_type: templateType,
      document_style: documentStyle,
      language,
      tone,
      tags: tags.length > 0 ? tags : undefined,
      include_clauses: includeClauses.length > 0 ? includeClauses : undefined,
      custom_instructions: customInstructions.trim() || undefined,
      fields_to_extract: undefined // Can be added later
    };

    onGenerate(data);
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: { xs: 2, md: 4 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <form onSubmit={handleSubmit}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Generate AI Template
        </Typography>

        {/* Main Description */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
            Describe your document needs
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the document you want to create. Be specific about:
• Type of document needed
• Parties involved
• Key terms and conditions
• Special requirements
• Format and style preferences"
            variant="outlined"
            error={!!validationError}
            helperText={validationError}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'white'
              }
            }}
          />
        </Box>

        {/* Example Prompts */}
        <Collapse in={!description.trim()}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Need inspiration? Try one of these examples:
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {examplePrompts.map((example, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => handleUseExample(example.prompt)}
                  >
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                      {example.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      {example.prompt.length > 100 
                        ? `${example.prompt.substring(0, 100)}...` 
                        : example.prompt
                      }
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>

        {/* Basic Settings */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                label="Document Type"
              >
                {templateTypes.map((type) => (
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

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Document Style</InputLabel>
              <Select
                value={documentStyle}
                onChange={(e) => setDocumentStyle(e.target.value)}
                label="Document Style"
              >
                {documentStyles.map((style) => (
                  <MenuItem key={style.value} value={style.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={style.label} 
                        size="small" 
                        sx={{ 
                          backgroundColor: style.color,
                          color: 'white',
                          mr: 1
                        }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                label="Language"
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tone</InputLabel>
              <Select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                label="Tone"
              >
                {tones.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Tags */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
            Tags (optional)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              placeholder="Add a tag..."
              sx={{ flexGrow: 1 }}
            />
            <Button 
              size="small" 
              onClick={handleAddTag}
              variant="outlined"
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Advanced Options */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            endIcon={<TuneIcon />}
            onClick={() => setAdvancedOpen(!advancedOpen)}
            sx={{ mb: 2 }}
          >
            Advanced Options
          </Button>

          <Collapse in={advancedOpen}>
            <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
              {/* Custom Instructions */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                  Custom Instructions
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Any specific requirements, formatting preferences, or special instructions..."
                  size="small"
                />
              </Box>

              {/* Predefined Clauses */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                  Include Standard Clauses
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {predefinedClauses.map((clause) => (
                    <Chip
                      key={clause}
                      label={clause}
                      onClick={() => handleAddClause(clause)}
                      onDelete={includeClauses.includes(clause) ? () => handleRemoveClause(clause) : null}
                      color={includeClauses.includes(clause) ? 'primary' : 'default'}
                      variant={includeClauses.includes(clause) ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>

              {/* Length Preference */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                  Document Length
                </Typography>
                <RadioGroup
                  row
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                >
                  {lengthOptions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{option.icon}</Typography>
                          <Typography variant="body2">{option.label}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </RadioGroup>
              </Box>

              {/* Creativity Level */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                  Creativity Level (Temperature)
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={temperature}
                    onChange={(e, value) => setTemperature(value)}
                    min={0}
                    max={1}
                    step={0.1}
                    marks={[
                      { value: 0, label: 'Precise' },
                      { value: 0.5, label: 'Balanced' },
                      { value: 1, label: 'Creative' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => value.toFixed(1)}
                  />
                </Box>
              </Box>
            </Paper>
          </Collapse>
        </Box>

        {/* Generate Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !description.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
              sx={{
                px: 6,
                py: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {loading ? 'Generating...' : 'Generate Template'}
            </Button>
          </motion.div>
        </Box>
      </form>
    </Paper>
  );
};

export default AITemplatePromptForm;
