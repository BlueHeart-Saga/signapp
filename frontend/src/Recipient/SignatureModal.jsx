import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  TextField,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Create as DrawIcon,
  TextFields as TypeIcon,
  Upload as UploadIcon,
  Redo as RedoIcon,
  Undo as UndoIcon,
  Delete as ClearIcon,
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';

const SignatureModal = ({
  open,
  onClose,
  onSave,
  fieldType,
  fieldLabel,
  existingValue,
}) => {
  const [tab, setTab] = useState(0);
  const [typedSignature, setTypedSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const sigCanvasRef = useRef(null);
  
  // Reset when opening
  useEffect(() => {
    if (open) {
      setTypedSignature('');
      setError('');
      if (existingValue && typeof existingValue === 'string') {
        if (existingValue.startsWith('data:image')) {
          // Image signature
          setTab(0);
        } else {
          // Typed signature
          setTab(1);
          setTypedSignature(existingValue);
        }
      }
    }
  }, [open, existingValue]);

  const handleClear = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  const handleUndo = () => {
    if (sigCanvasRef.current) {
      const data = sigCanvasRef.current.toData();
      if (data && data.length > 0) {
        sigCanvasRef.current.fromData(data.slice(0, -1));
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      let signatureData;
      
      if (tab === 0) {
        // Drawn signature
        if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
          throw new Error('Please draw your signature first');
        }
        
        signatureData = sigCanvasRef.current.toDataURL('image/png');
        
      } else if (tab === 1) {
        // Typed signature
        if (!typedSignature.trim()) {
          throw new Error('Please enter your signature');
        }
        
        // Create canvas for typed signature
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 150;
        
        // Draw background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw signature text
        ctx.font = 'bold 40px "Great Vibes", cursive, "Dancing Script", "Brush Script MT"';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
        
        signatureData = canvas.toDataURL('image/png');
        
      } else if (tab === 2) {
        // Upload signature (simplified)
        throw new Error('Upload feature not implemented in this example');
      }

      // Save signature
      await onSave(signatureData);
      onClose();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFieldTitle = () => {
    if (fieldType === 'signature') return 'Signature';
    if (fieldType === 'initials') return 'Initials';
    if (fieldType === 'date') return 'Date';
    if (fieldType === 'text') return 'Text Field';
    return 'Field';
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
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Add {getFieldTitle()}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {fieldLabel || 'Required field'}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Tabs 
          value={tab} 
          onChange={(e, val) => setTab(val)}
          sx={{ mb: 2 }}
        >
          <Tab icon={<DrawIcon />} label="Draw" />
          <Tab icon={<TypeIcon />} label="Type" />
          <Tab icon={<UploadIcon />} label="Upload" disabled />
        </Tabs>
        
        <Divider sx={{ mb: 3 }} />
        
        {tab === 0 && (
          <Box>
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 1,
                height: 200,
                bgcolor: '#fafafa',
                position: 'relative',
                mb: 2,
              }}
            >
              <SignatureCanvas
                ref={sigCanvasRef}
                canvasProps={{
                  className: 'signature-canvas',
                  style: {
                    width: '100%',
                    height: '100%',
                    borderRadius: '4px',
                  }
                }}
                backgroundColor="rgba(255, 255, 255, 0)"
              />
              {(!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#999',
                    textAlign: 'center',
                  }}
                >
                  <DrawIcon sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2">
                    Draw your signature here
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<UndoIcon />}
                onClick={handleUndo}
                size="small"
              >
                Undo
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClear}
                size="small"
                color="error"
              >
                Clear
              </Button>
            </Box>
          </Box>
        )}
        
        {tab === 1 && (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              placeholder="Type your signature here"
              sx={{ mb: 2 }}
              inputProps={{
                style: { 
                  fontSize: '24px',
                  fontFamily: '"Great Vibes", cursive, "Dancing Script", "Brush Script MT"',
                  textAlign: 'center'
                }
              }}
            />
            
            <Box sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 1, 
              p: 3,
              bgcolor: '#fafafa',
              textAlign: 'center',
              minHeight: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: '"Great Vibes", cursive',
                  opacity: typedSignature ? 1 : 0.3
                }}
              >
                {typedSignature || 'Preview will appear here'}
              </Typography>
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Tip: Use cursive fonts for a more natural look
            </Typography>
          </Box>
        )}
        
        {tab === 2 && (
          <Box textAlign="center" py={4}>
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Upload signature image (PNG, JPG)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Feature coming soon
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save Signature'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignatureModal;