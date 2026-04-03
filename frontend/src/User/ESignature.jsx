import React, { useRef, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Brush,
  TextFields,
  CloudUpload,
  Save,
  Download,
  Delete,
  Refresh,
  Visibility,
  Close,
  Palette,
  FormatSize,
  FontDownload
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const SignatureCanvas = styled('canvas')({
  border: '2px dashed #e0e0e0',
  borderRadius: '8px',
  cursor: 'crosshair',
  backgroundColor: '#ffffff',
  width: '100%',
  height: '300px',
  '&.draw-mode': {
    cursor: 'crosshair',
  },
  '&.preview-mode': {
    cursor: 'default',
    border: '2px solid #4caf50',
  }
});

const ColorOption = styled(Box)(({ color, selected }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  backgroundColor: color,
  cursor: 'pointer',
  border: selected ? '3px solid #1976d2' : '2px solid #e0e0e0',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const SignatureThumbnail = styled(Card)(({ theme, active }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: active ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ESignature = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(3);
  const [mode, setMode] = useState('draw');
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState('Dancing Script');
  const [fontSize, setFontSize] = useState(48);
  const [hasContent, setHasContent] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [activeSignature, setActiveSignature] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showPreview, setShowPreview] = useState(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

  const handwrittenFonts = [
    'Dancing Script', 'Pacifico', 'Great Vibes', 'Sacramento',
    'Alex Brush', 'Allura', 'Mr Dafoe', 'Tangerine', 'Parisienne',
    'Cookie', 'Style Script', 'Cedarville Cursive', 'Homemade Apple',
    'Nothing You Could Do', 'Rock Salt', 'Shadows Into Light', 'Caveat',
    'Kalam', 'Indie Flower', 'Permanent Marker', 'Patrick Hand', 'Handlee'
  ];

  const colorOptions = [
    '#000000', '#e74c3c', '#3498db', '#2ecc71', 
    '#f39c12', '#9b59b6', '#1abc9c', '#34495e',
    '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688'
  ];

  // Initialize canvas with proper dimensions
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef.current;
    if (!container) return;

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const containerWidth = container.clientWidth;
      const containerHeight = 300; // Fixed height for canvas

      // Set canvas dimensions
      canvas.width = containerWidth;
      canvas.height = containerHeight;

      const ctx = canvas.getContext('2d');
      
      // Set initial drawing styles
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#ffffff';
      
      // Clear canvas with white background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      setCanvasInitialized(true);
      console.log('Canvas initialized with dimensions:', canvas.width, 'x', canvas.height);
    });
  }, [penColor, penWidth]);

  // Initialize canvas on mount and when container resizes
  useEffect(() => {
    initializeCanvas();
    loadSavedSignatures();

    // Handle window resize
    const handleResize = () => {
      initializeCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeCanvas]);

  // Re-initialize canvas when mode changes
  useEffect(() => {
    if (canvasInitialized) {
      initializeCanvas();
    }
  }, [mode, canvasInitialized, initializeCanvas]);

  // Update pen settings when they change
  useEffect(() => {
    if (mode === 'draw' && canvasInitialized) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
    }
  }, [penColor, penWidth, mode, canvasInitialized]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const startDrawing = (e) => {
    if (mode !== 'draw' || !canvasInitialized) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    
    // Remove the placeholder by setting hasContent to true
    setHasContent(true);
  };

  const draw = (e) => {
    if (!isDrawing || mode !== 'draw' || !canvasInitialized) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (mode !== 'draw') return;
    setIsDrawing(false);
  };

  // Touch events for mobile devices
  const handleTouchStart = (e) => {
    if (mode !== 'draw' || !canvasInitialized) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasContent(true);
  };

  const handleTouchMove = (e) => {
    if (!isDrawing || mode !== 'draw' || !canvasInitialized) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleTouchEnd = (e) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      showSnackbar('Please select a valid image file (PNG, JPG, JPEG, GIF, BMP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasInitialized) {
          showSnackbar('Canvas not ready. Please try again.', 'error');
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate dimensions to fit canvas while maintaining aspect ratio
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
        setHasContent(true);
        showSnackbar('Image uploaded successfully');
      };
      img.onerror = () => {
        showSnackbar('Error loading image file', 'error');
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      showSnackbar('Error reading file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const applyTypedSignature = () => {
    if (!typedText.trim()) {
      showSnackbar('Please enter some text for your signature', 'error');
      return;
    }

    if (!canvasInitialized) {
      showSnackbar('Canvas not ready. Please try again.', 'error');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = penColor;
    ctx.font = `${fontSize}px ${selectedFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    ctx.fillText(typedText, x, y);
    setHasContent(true);
    showSnackbar('Text signature applied');
  };

  const getCanvasImageData = async () => {
    if (!canvasInitialized) {
      throw new Error('Canvas not initialized');
    }

    const canvas = canvasRef.current;
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        }, 'image/png', 0.9);
      } catch (error) {
        reject(error);
      }
    });
  };

  const saveSignatureToDB = async () => {
    if (!hasContent) {
      showSnackbar('Please create a signature first!', 'error');
      return;
    }

    if (!signatureName.trim()) {
      showSnackbar('Please enter a name for your signature', 'error');
      return;
    }

    if (!canvasInitialized) {
      showSnackbar('Canvas not ready. Please try again.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', signatureName.trim());
      formData.append('signature_type', mode);
      
      if (mode === 'type') {
        formData.append('font', selectedFont);
      }
      
      formData.append('color', penColor);

      if (mode === 'upload' && fileInputRef.current?.files[0]) {
        formData.append('image_file', fileInputRef.current.files[0]);
      } else {
        const blob = await getCanvasImageData();
        formData.append('image_file', blob, `${signatureName.replace(/\s+/g, '_')}.png`);
      }

      const response = await axios.post(`${API_BASE_URL}/api/signatures`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.signature) {
        setSignatureName('');
        setActiveSignature(response.data.signature);
        await loadSavedSignatures();
        showSnackbar('Signature saved successfully!');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      const errorMsg = error.response?.data?.detail || error.message;
      showSnackbar(`Error saving signature: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedSignatures = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/signatures`);
      setSavedSignatures(response.data.signatures || []);
    } catch (error) {
      console.error('Error loading signatures:', error);
      showSnackbar('Error loading signatures', 'error');
    }
  };

  const downloadSignature = async () => {
    if (!hasContent) {
      showSnackbar('Please create a signature first!', 'error');
      return;
    }

    try {
      const blob = await getCanvasImageData();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `signature-${timestamp}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSnackbar('Signature downloaded successfully');
    } catch (error) {
      console.error('Error downloading signature:', error);
      showSnackbar('Error downloading signature', 'error');
    }
  };

  const loadSignature = async (signature) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/signatures/${signature.id}/image`, {
        responseType: 'blob'
      });

      const img = new Image();
      img.onload = () => {
        if (!canvasInitialized) {
          showSnackbar('Canvas not ready. Please try again.', 'error');
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the loaded signature
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasContent(true);
        setActiveSignature(signature);
        setMode(signature.signature_type);
        
        // Update UI based on signature type
        if (signature.signature_type === 'type') {
          setSelectedFont(signature.font || 'Dancing Script');
          setPenColor(signature.color || '#000000');
        } else if (signature.signature_type === 'draw') {
          setPenColor(signature.color || '#000000');
        }
        
        showSnackbar(`Loaded signature: ${signature.name}`);
      };
      img.onerror = () => {
        showSnackbar('Error loading signature image', 'error');
      };
      img.src = URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error loading signature:', error);
      showSnackbar('Error loading signature', 'error');
    }
  };

  const deleteSignature = async (signatureId, signatureName) => {
    if (!window.confirm(`Are you sure you want to delete "${signatureName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/signatures/${signatureId}`);
      await loadSavedSignatures();
      
      if (activeSignature && activeSignature.id === signatureId) {
        clearCanvas();
      }
      
      showSnackbar('Signature deleted successfully');
    } catch (error) {
      console.error('Error deleting signature:', error);
      showSnackbar('Error deleting signature', 'error');
    }
  };

  const clearCanvas = () => {
    if (!canvasInitialized) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setTypedText('');
    setHasContent(false);
    setActiveSignature(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Reset drawing context
    if (mode === 'draw') {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const openPreview = () => {
    setPreviewOpen(true);
  };

  const getPreviewImage = () => {
    if (!hasContent || !canvasInitialized) return null;
    return canvasRef.current.toDataURL('image/png');
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setActiveSignature(null);
    // Reset hasContent when switching to draw mode to show instructions
    if (newMode === 'draw') {
      setHasContent(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Brush sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Digital Signature Pro
          </Typography>
          {!canvasInitialized && (
            <Typography variant="body2" sx={{ color: 'warning.light' }}>
              Initializing...
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Mode Selector */}
        <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
          <Typography variant="h5" gutterBottom>
            Create Signature
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose your preferred method to create a digital signature
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card 
                variant={mode === 'draw' ? 'elevation' : 'outlined'}
                sx={{ 
                  cursor: 'pointer',
                  border: mode === 'draw' ? '2px solid' : '1px solid',
                  borderColor: mode === 'draw' ? 'primary.main' : 'divider'
                }}
                onClick={() => handleModeChange('draw')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Brush sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6">Draw Signature</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Draw your signature freehand
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                variant={mode === 'type' ? 'elevation' : 'outlined'}
                sx={{ 
                  cursor: 'pointer',
                  border: mode === 'type' ? '2px solid' : '1px solid',
                  borderColor: mode === 'type' ? 'primary.main' : 'divider'
                }}
                onClick={() => handleModeChange('type')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <TextFields sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6">Type Signature</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type your name with stylish fonts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                variant={mode === 'upload' ? 'elevation' : 'outlined'}
                sx={{ 
                  cursor: 'pointer',
                  border: mode === 'upload' ? '2px solid' : '1px solid',
                  borderColor: mode === 'upload' ? 'primary.main' : 'divider'
                }}
                onClick={() => handleModeChange('upload')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6">Upload Image</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload an existing signature image
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Canvas Section */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }} elevation={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Signature Canvas {!canvasInitialized && '(Initializing...)'}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showPreview}
                      onChange={(e) => setShowPreview(e.target.checked)}
                      color="primary"
                      disabled={!hasContent}
                    />
                  }
                  label="Show Preview"
                />
              </Box>
              
              <Box ref={containerRef} sx={{ position: 'relative' }}>
                <SignatureCanvas
                  ref={canvasRef}
                  className={`${mode === 'draw' ? 'draw-mode' : ''} ${showPreview ? 'preview-mode' : ''}`}
                  onMouseDown={mode === 'draw' ? startDrawing : undefined}
                  onMouseMove={mode === 'draw' ? draw : undefined}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={mode === 'draw' ? handleTouchStart : undefined}
                  onTouchMove={mode === 'draw' ? handleTouchMove : undefined}
                  onTouchEnd={mode === 'draw' ? handleTouchEnd : undefined}
                />
                
                {/* Only show placeholder when there's no content AND we're in draw mode */}
                {mode === 'draw' && !hasContent && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      color: 'text.secondary',
                      borderRadius: '8px',
                      pointerEvents: 'none', // This is the key fix - allows clicks to pass through
                    }}
                  >
                    {!canvasInitialized ? (
                      <>
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="h6">Initializing Canvas...</Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          ✏️ Draw your signature
                        </Typography>
                        <Typography variant="body2" textAlign="center">
                          Click and drag to start drawing your signature
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
                
                {/* Show different placeholder for other modes when no content */}
                {mode !== 'draw' && !hasContent && canvasInitialized && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      color: 'text.secondary',
                      borderRadius: '8px',
                      pointerEvents: 'none',
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {mode === 'type' ? '🔤 Type your signature' : '📁 Upload signature image'}
                    </Typography>
                    <Typography variant="body2" textAlign="center">
                      {mode === 'type' ? 'Enter text and customize below' : 'Select an image file to upload'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Controls */}
              <Box sx={{ mt: 3 }}>
                {mode === 'draw' && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      <Palette sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Drawing Controls
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" gutterBottom>
                          Pen Color
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {colorOptions.map((color) => (
                            <ColorOption
                              key={color}
                              color={color}
                              selected={penColor === color}
                              onClick={() => setPenColor(color)}
                            />
                          ))}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" gutterBottom>
                          Pen Width: {penWidth}px
                        </Typography>
                        <Slider
                          value={penWidth}
                          onChange={(e, newValue) => setPenWidth(newValue)}
                          min={1}
                          max={20}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                    </Grid>
                  </>
                )}

                {mode === 'type' && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      <FontDownload sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Text Signature
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Signature Text"
                          value={typedText}
                          onChange={(e) => setTypedText(e.target.value)}
                          placeholder="Enter your name or signature text"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Font Style</InputLabel>
                          <Select
                            value={selectedFont}
                            label="Font Style"
                            onChange={(e) => setSelectedFont(e.target.value)}
                          >
                            {handwrittenFonts.map((font) => (
                              <MenuItem key={font} value={font}>
                                {font}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" gutterBottom>
                          <FormatSize sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Font Size: {fontSize}px
                        </Typography>
                        <Slider
                          value={fontSize}
                          onChange={(e, newValue) => setFontSize(newValue)}
                          min={24}
                          max={120}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" gutterBottom>
                          Text Color
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {colorOptions.map((color) => (
                            <ColorOption
                              key={color}
                              color={color}
                              selected={penColor === color}
                              onClick={() => setPenColor(color)}
                            />
                          ))}
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          onClick={applyTypedSignature}
                          disabled={!typedText.trim() || !canvasInitialized}
                          startIcon={<TextFields />}
                        >
                          Apply Text Signature
                        </Button>
                      </Grid>
                    </Grid>
                  </>
                )}

                {mode === 'upload' && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      <CloudUpload sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Upload Signature
                    </Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      sx={{ mr: 2 }}
                      disabled={!canvasInitialized}
                    >
                      Choose Image File
                      <VisuallyHiddenInput
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                      />
                    </Button>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Supported formats: PNG, JPG, JPEG, GIF, BMP • Max size: 10MB
                    </Typography>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Actions & Preview Section */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
              <Typography variant="h6" gutterBottom>
                Save Signature
              </Typography>
              <TextField
                fullWidth
                label="Signature Name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Enter a name for your signature"
                sx={{ mb: 2 }}
              />
              <Grid container spacing={1}>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={clearCanvas}
                    disabled={!hasContent && !activeSignature}
                    startIcon={<Delete />}
                  >
                    Clear
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={downloadSignature}
                    disabled={!hasContent || !canvasInitialized}
                    startIcon={<Download />}
                  >
                    Download
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={saveSignatureToDB}
                    disabled={!hasContent || !signatureName.trim() || isLoading || !canvasInitialized}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Preview Section */}
            {showPreview && hasContent && canvasInitialized && (
              <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
                <Typography variant="h6" gutterBottom>
                  Live Preview
                </Typography>
                <Box
                  sx={{
                    border: '2px solid',
                    borderColor: 'success.main',
                    borderRadius: 1,
                    p: 2,
                    bgcolor: 'background.paper',
                    textAlign: 'center'
                  }}
                >
                  <img
                    src={getPreviewImage()}
                    alt="Signature preview"
                    style={{ maxWidth: '100%', maxHeight: '200px' }}
                  />
                </Box>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={openPreview}
                  startIcon={<Visibility />}
                  sx={{ mt: 2 }}
                >
                  Open Full Preview
                </Button>
              </Paper>
            )}

            {/* Signature Library */}
            <Paper sx={{ p: 3 }} elevation={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Signature Library ({savedSignatures.length})
                </Typography>
                <Tooltip title="Refresh">
                  <IconButton onClick={loadSavedSignatures} size="small">
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>

              {savedSignatures.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  No saved signatures yet. Create and save your first signature!
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {savedSignatures.map((signature) => (
                    <Grid item xs={12} key={signature.id}>
                      <SignatureThumbnail active={activeSignature?.id === signature.id}>
                        <CardContent sx={{ pb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                              component="img"
                              src={`${API_BASE_URL}/api/signatures/${signature.id}/image`}
                              alt={signature.name}
                              sx={{
                                width: 80,
                                height: 40,
                                objectFit: 'contain',
                                cursor: 'pointer'
                              }}
                              onClick={() => loadSignature(signature)}
                            />
                            <Box sx={{ ml: 2, flexGrow: 1 }}>
                              <Typography variant="subtitle2" noWrap>
                                {signature.name}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                <Chip
                                  label={signature.signature_type}
                                  size="small"
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(signature.created_at).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                        <CardActions sx={{ pt: 0 }}>
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => loadSignature(signature)}
                          >
                            Load
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => deleteSignature(signature.id, signature.name)}
                          >
                            Delete
                          </Button>
                        </CardActions>
                      </SignatureThumbnail>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Signature Preview
          <IconButton
            aria-label="close"
            onClick={() => setPreviewOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {hasContent && canvasInitialized && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <img
                src={getPreviewImage()}
                alt="Signature preview"
                style={{ maxWidth: '100%', maxHeight: '400px' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button variant="contained" onClick={downloadSignature}>
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Quick Preview */}
      {hasContent && canvasInitialized && (
        <Fab
          color="primary"
          aria-label="preview"
          onClick={openPreview}
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
        >
          <Visibility />
        </Fab>
      )}
    </Box>
  );
};

export default ESignature;