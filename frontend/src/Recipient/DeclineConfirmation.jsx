import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Alert,
  Box,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const DeclineConfirmation = ({ open, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (reason.trim() === '') {
      setError('Please provide a reason for declining');
      return;
    }
    onConfirm(reason);
    setReason('');
    setError('');
  };

  const handleCancel = () => {
    onCancel();
    setReason('');
    setError('');
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography>Decline Terms & Conditions</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Declining the terms will cancel the signing process. You will not be able to sign the document.
          </Typography>
        </Alert>
        
        <Typography variant="body2" paragraph>
          Please provide a reason for declining the terms and conditions:
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError('');
          }}
          placeholder="Enter your reason for declining..."
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained"
          disabled={!reason.trim()}
        >
          Confirm Decline
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeclineConfirmation;
