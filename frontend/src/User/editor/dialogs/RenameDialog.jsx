import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const RenameDialog = ({
  open,
  onClose,
  documentName = '',
  onDocumentNameChange,
  onRename,
  renaming = false
}) => {
  const [localName, setLocalName] = useState(documentName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setLocalName(documentName);
      setError('');
    }
  }, [open, documentName]);

  const handleChange = (e) => {
    const value = e.target.value;
    setLocalName(value);
    
    if (onDocumentNameChange) {
      onDocumentNameChange(value);
    }
    
    if (error) setError('');
  };

  const handleSubmit = () => {
    if (!localName.trim()) {
      setError('Document name cannot be empty');
      return;
    }

    if (localName.length > 255) {
      setError('Document name is too long (max 255 characters)');
      return;
    }

    onRename();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !renaming) {
      handleSubmit();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#0d9488', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          <Typography variant="h6">Rename Document</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            '& .MuiAlert-icon': { color: '#0d9488' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <InfoIcon fontSize="small" sx={{ mt: 0.5 }} />
            <Box>
              <Typography variant="body2">
                This will rename the document file. Recipients will see the new name.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                The .pdf extension will be added automatically if not included.
              </Typography>
            </Box>
          </Box>
        </Alert>
        
        <TextField
          autoFocus
          fullWidth
          label="Document Name"
          value={localName}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          error={!!error}
          helperText={error || "Enter a descriptive name for your document"}
          placeholder="Enter document name"
          disabled={renaming}
          size="medium"
          InputProps={{
            endAdornment: localName && (
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                .pdf
              </Typography>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#0d9488',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#0d9488',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#0d9488',
            },
          }}
        />

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="caption" color="text.secondary">
            {localName.length}/255 characters
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={onClose}
          disabled={renaming}
          sx={{ 
            minWidth: 100,
            color: '#0d9488',
            '&:hover': {
              backgroundColor: 'rgba(13, 148, 136, 0.04)'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={!localName.trim() || renaming || localName === documentName}
          startIcon={renaming ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SaveIcon />}
          sx={{ 
            minWidth: 120,
            bgcolor: '#0d9488',
            '&:hover': {
              bgcolor: '#0f766e'
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(13, 148, 136, 0.3)'
            }
          }}
        >
          {renaming ? 'Renaming...' : 'Rename'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;