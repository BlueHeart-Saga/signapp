import React, { useState, useEffect, useRef } from 'react';
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
  const [localName, setLocalName] = useState('');
  const [initialName, setInitialName] = useState('');
  const [error, setError] = useState('');
  const prevOpenRef = useRef(false);

  useEffect(() => {
    // Only initialize when dialog transitions from closed to open
    if (open && !prevOpenRef.current) {
      const clean = (documentName || '').replace(/\.pdf$/i, '').trim();
      setLocalName(clean);
      setInitialName(clean);
      setError('');
    }
    prevOpenRef.current = open;
  }, [open, documentName]);

  const handleChange = (e) => {
    const value = (e.target.value || '').replace(/\.pdf$/i, '').slice(0, 60);
    setLocalName(value);

    if (onDocumentNameChange) {
      onDocumentNameChange(value);
    }

    if (error) setError('');
  };

  const trimmedLocal = localName.trim();
  const isUnchanged = trimmedLocal === initialName;
  const isInvalid = !trimmedLocal;
  const isSubmitDisabled = isInvalid || renaming || isUnchanged;

  const handleSubmit = () => {
    const trimmed = localName.trim();
    if (!trimmed) {
      setError('Document name cannot be empty');
      return;
    }

    if (trimmed.length > 60) {
      setError('Document name cannot exceed 60 characters');
      return;
    }

    if (onRename) {
      onRename(trimmed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitDisabled) {
      e.preventDefault();
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
        bgcolor: '#0f766e', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.75
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Rename Document</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Alert 
          severity="info" 
          sx={{ 
            mt: 1,
            mb: 3,
            '& .MuiAlert-icon': { color: '#0f766e' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <InfoIcon fontSize="small" sx={{ mt: 0.5 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                This will rename the document file. Recipients will see the new name.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                The .pdf extension will be maintained automatically.
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
          onKeyDown={handleKeyDown}
          error={!!error}
          helperText={error || `${localName.length}/60 characters`}
          placeholder="Enter document name"
          disabled={renaming}
          size="medium"
          inputProps={{ maxLength: 60 }}
          InputProps={{
            endAdornment: (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 1, userSelect: 'none' }}>
                .pdf
              </Typography>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#0f766e',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#0f766e',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#0f766e',
            },
          }}
        />
      </DialogContent>
      
      <DialogActions sx={{ p: 2.5, px: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={onClose}
          disabled={renaming}
          sx={{ 
            minWidth: 100,
            color: '#555',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          startIcon={renaming ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <SaveIcon />}
          sx={{ 
            minWidth: 120,
            bgcolor: '#0f766e',
            '&:hover': {
              bgcolor: '#0d655e'
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(15, 118, 110, 0.35)',
              color: 'rgba(255, 255, 255, 0.7)'
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
