// // import React, { useState, useEffect, useRef, useCallback } from 'react';
// // import {
// //   Box, Button, TextField, Typography, MenuItem, Paper, Grid,
// //   Card, CardContent, CardActions, Chip, Tabs, Tab, Dialog,
// //   DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
// //   Stepper, Step, StepLabel, List, ListItem, ListItemText, ListItemIcon,
// //   Fab, useTheme, useMediaQuery, Accordion, AccordionSummary,
// //   AccordionDetails, Switch, FormControlLabel, Autocomplete,
// //   Badge, Avatar, Rating, LinearProgress, CircularProgress,
// //   Snackbar, Alert, FormControl, InputLabel, Select,
// //   Divider, Drawer, AppBar, Toolbar, RadioGroup, Radio, FormLabel
// // } from '@mui/material';
// // import BorderColorIcon from "@mui/icons-material/BorderColor";
// // import {
// //   Download, Save, Edit, Preview, Delete, Add, Folder, Description,
// //   PictureAsPdf, Article, TextFields, SmartToy, CloudUpload, History,
// //   PlayArrow, Code, Visibility, Close, CheckCircle, Error, Warning,
// //   Info, AutoFixHigh, ExpandMore, Tag, Category, Analytics,
// //   ContentCopy, Share, ThumbUp, ThumbDown, Star, StarBorder,
// //   FormatColorText, Today, CheckBox, TextFormat,
// //   DesignServices, Build, TouchApp, AutoMode, Dashboard,
// //   Schema, DataObject, IntegrationInstructions,
// //   Business, Person, LocationOn, Email, Phone, DateRange,
// //   Assignment, Description as DescriptionIcon,
// //   List as ListIcon, Ballot, Feed, Image, CloudDownload
// // } from '@mui/icons-material';
// // import { Rnd } from 'react-rnd';
// // import axios from 'axios';
// // import html2pdf from 'html2pdf.js';
// // import { saveAs } from 'file-saver';
// // import { debounce } from 'lodash';

// // // -----------------------------
// // // Enhanced Tab Panel Component
// // // -----------------------------
// // function TabPanel({ children, value, index, ...other }) {
// //   return (
// //     <div role="tabpanel" hidden={value !== index} {...other}>
// //       {value === index && <Box sx={{ p: { xs: 1, md: 3 } }}>{children}</Box>}
// //     </div>
// //   );
// // }

// // // -----------------------------
// // // Log Icon Component
// // // -----------------------------
// // const LogIcon = ({ type }) => {
// //   switch (type) {
// //     case "success": return <CheckCircle color="success" />;
// //     case "error": return <Error color="error" />;
// //     case "warning": return <Warning color="warning" />;
// //     default: return <Info color="info" />;
// //   }
// // };

// // // -----------------------------
// // // Field Type Icons
// // // -----------------------------
// // const FieldTypeIcon = ({ type }) => {
// //   const icons = {
// //     signature: <BorderColorIcon />,
// //     date: <Today />,
// //     text: <TextFormat />,
// //     address: <LocationOn />,
// //     email: <Email />,
// //     phone: <Phone />,
// //     person: <Person />,
// //     company: <Business />,
// //     checkbox: <CheckBox />,
// //     select: <ListIcon />,
// //     default: <TextFields />
// //   };
// //   return icons[type] || icons.default;
// // };

// // // -----------------------------
// // // HTML to Canvas Elements Parser
// // // -----------------------------
// // const parseHtmlToCanvasElements = (htmlContent) => {
// //   if (!htmlContent) return [];
  
// //   const elements = [];
// //   const tempDiv = document.createElement('div');
// //   tempDiv.innerHTML = htmlContent;
  
// //   let yPosition = 50;
  
// //   // Parse text elements
// //   const textElements = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span');
// //   textElements.forEach((element, index) => {
// //     if (element.textContent.trim()) {
// //       elements.push({
// //         id: `text_${Date.now()}_${index}`,
// //         type: 'text',
// //         text: element.textContent.trim(),
// //         x: 50,
// //         y: yPosition,
// //         width: 500,
// //         height: element.textContent.length > 100 ? 80 : 40,
// //         fontSize: parseInt(window.getComputedStyle(element).fontSize) || 14,
// //         align: 'left',
// //         bold: window.getComputedStyle(element).fontWeight === 'bold',
// //         italic: window.getComputedStyle(element).fontStyle === 'italic',
// //         color: window.getComputedStyle(element).color || '#000000'
// //       });
// //       yPosition += 60;
// //     }
// //   });
  
// //   return elements;
// // };

// // // -----------------------------
// // // Canvas Elements to HTML Converter
// // // -----------------------------
// // const convertCanvasElementsToHtml = (elements) => {
// //   let html = `
// //     <div style="font-family: 'Times New Roman', serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px;">
// //   `;
  
// //   elements.forEach(element => {
// //     if (element.type === 'text' && element.text) {
// //       const style = `
// //         position: absolute; 
// //         left: ${element.x}px; 
// //         top: ${element.y}px; 
// //         width: ${element.width}px; 
// //         font-size: ${element.fontSize}px; 
// //         font-weight: ${element.bold ? 'bold' : 'normal'}; 
// //         font-style: ${element.italic ? 'italic' : 'normal'}; 
// //         color: ${element.color}; 
// //         text-align: ${element.align};
// //         line-height: 1.6;
// //       `;
// //       html += `<p style="${style}">${element.text}</p>`;
// //     } else if (element.type === 'address' && (element.name || element.line1 || element.city)) {
// //       const style = `position: absolute; left: ${element.x}px; top: ${element.y}px; width: ${element.width}px;`;
// //       html += `
// //         <div style="${style}">
// //           <p style="font-weight: bold; margin: 0;">${element.name || ''}</p>
// //           <p style="margin: 0;">${element.line1 || ''}</p>
// //           <p style="margin: 0;">${element.city || ''}</p>
// //         </div>
// //       `;
// //     } else if (element.type === 'date' && element.value) {
// //       const style = `position: absolute; left: ${element.x}px; top: ${element.y}px; width: ${element.width}px;`;
// //       html += `<p style="${style}">${element.value}</p>`;
// //     } else if (element.type === 'signature' && element.src) {
// //       const style = `position: absolute; left: ${element.x}px; top: ${element.y}px; width: ${element.width}px; text-align: center;`;
// //       html += `
// //         <div style="${style}">
// //           <img src="${element.src}" alt="Signature" style="max-width: 100%; height: auto;" />
// //           ${element.showName && element.name ? `<p style="margin-top: 8px; border-top: 1px solid #000; padding-top: 4px;">${element.name}</p>` : ''}
// //         </div>
// //       `;
// //     }
// //   });
  
// //   html += `</div>`;
// //   return html;
// // };

// // // -----------------------------
// // // Document Canvas Area Component
// // // -----------------------------
// // const DocumentCanvasArea = ({ 
// //   width = 800, 
// //   height = 1000, 
// //   elements = [], 
// //   onElementUpdate, 
// //   selectedId, 
// //   onSelect,
// //   isMobile = false,
// //   documentType = "letter"
// // }) => {
// //   const containerRef = useRef(null);

// //   const handleElementUpdate = (id, updates) => {
// //     onElementUpdate(id, updates);
// //   };

// //   const canvasStyle = isMobile ? { 
// //     maxWidth: '100%', 
// //     maxHeight: '70vh',
// //     width: 'auto',
// //     height: 'auto'
// //   } : { 
// //     width, 
// //     height,
// //     background: '#ffffff',
// //     boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
// //   };

// //   const getBackgroundStyle = () => {
// //     if (documentType === 'forms') {
// //       return {
// //         background: 'linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%)',
// //         opacity: 0.3
// //       };
// //     }
// //     return {
// //       background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
// //       opacity: 0.3
// //     };
// //   };

// //   return (
// //     <Box
// //       ref={containerRef}
// //       sx={{
// //         position: 'relative',
// //         border: '1px solid',
// //         borderColor: 'divider',
// //         borderRadius: 2,
// //         overflow: 'hidden',
// //         bgcolor: 'background.paper',
// //         p: 4,
// //         ...canvasStyle
// //       }}
// //     >
// //       {/* Document Background */}
// //       <Box sx={{
// //         position: 'absolute',
// //         top: 0,
// //         left: 0,
// //         right: 0,
// //         bottom: 0,
// //         ...getBackgroundStyle(),
// //         zIndex: 0
// //       }} />
      
// //       {elements
// //         .filter(el => el.type !== 'background')
// //         .map(el => (
// //           <Rnd
// //             key={el.id}
// //             bounds="parent"
// //             size={{ width: el.width, height: el.height }}
// //             position={{ x: el.x, y: el.y }}
// //             onDragStart={() => onSelect(el.id)}
// //             onDragStop={(e, d) => handleElementUpdate(el.id, { x: d.x, y: d.y })}
// //             onResizeStop={(e, direction, ref, delta, position) => {
// //               handleElementUpdate(el.id, {
// //                 width: parseInt(ref.style.width),
// //                 height: parseInt(ref.style.height),
// //                 ...position
// //               });
// //             }}
// //             style={{
// //               zIndex: el.id === selectedId ? 1000 : 100,
// //               border: el.id === selectedId ? '2px solid #1976d2' : '1px solid transparent',
// //               background: el.id === selectedId ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
// //               borderRadius: 1,
// //               cursor: 'move'
// //             }}
// //             disableDragging={isMobile}
// //             enableResizing={!isMobile}
// //           >
// //             <Box sx={{ 
// //               p: 1, 
// //               height: '100%', 
// //               display: 'flex', 
// //               alignItems: el.align || 'left',
// //               justifyContent: el.align || 'left'
// //             }}>
// //               {el.type === 'signature' && el.src && (
// //                 <Box sx={{ textAlign: 'center' }}>
// //                   <img 
// //                     src={el.src} 
// //                     alt="Signature" 
// //                     style={{ 
// //                       maxWidth: '100%', 
// //                       maxHeight: '100%', 
// //                       objectFit: 'contain',
// //                       filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
// //                     }}
// //                   />
// //                   {el.showName && (
// //                     <Typography variant="body2" sx={{ mt: 1, borderTop: '1px solid #000', pt: 0.5 }}>
// //                       {el.name || 'Signature'}
// //                     </Typography>
// //                   )}
// //                 </Box>
// //               )}
              
// //               {el.type === 'text' && (
// //                 <Typography 
// //                   sx={{ 
// //                     fontSize: el.fontSize || 14,
// //                     fontWeight: el.bold ? 'bold' : 'normal',
// //                     fontStyle: el.italic ? 'italic' : 'normal',
// //                     color: el.color || '#000000',
// //                     textAlign: el.align || 'left',
// //                     lineHeight: 1.6,
// //                     fontFamily: el.fontFamily || "'Times New Roman', serif"
// //                   }}
// //                 >
// //                   {el.text}
// //                 </Typography>
// //               )}
              
// //               {el.type === 'address' && (
// //                 <Box sx={{ fontFamily: "'Times New Roman', serif", lineHeight: 1.4 }}>
// //                   <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
// //                     {el.name || ''}
// //                   </Typography>
// //                   <Typography variant="body2">
// //                     {el.line1 || ''}
// //                   </Typography>
// //                   <Typography variant="body2">
// //                     {el.city || ''}
// //                   </Typography>
// //                 </Box>
// //               )}

// //               {el.type === 'date' && (
// //                 <Typography 
// //                   sx={{ 
// //                     fontFamily: "'Times New Roman', serif",
// //                     fontSize: el.fontSize || 14,
// //                     color: el.color || '#000000'
// //                   }}
// //                 >
// //                   {el.value || ''}
// //                 </Typography>
// //               )}

// //               {el.type === 'email' && (
// //                 <Box sx={{ fontFamily: "'Times New Roman', serif" }}>
// //                   <Typography variant="body2" color="text.secondary">
// //                     Email: {el.value || ''}
// //                   </Typography>
// //                 </Box>
// //               )}

// //               {el.type === 'phone' && (
// //                 <Box sx={{ fontFamily: "'Times New Roman', serif" }}>
// //                   <Typography variant="body2" color="text.secondary">
// //                     Phone: {el.value || ''}
// //                   </Typography>
// //                 </Box>
// //               )}
// //             </Box>
// //           </Rnd>
// //         ))}
// //     </Box>
// //   );
// // };

// // // -----------------------------
// // // Signature Modal Component
// // // -----------------------------
// // const SignatureModal = ({ open, onClose, onSave }) => {
// //   const canvasRef = useRef(null);
// //   const [drawing, setDrawing] = useState(false);

// //   useEffect(() => {
// //     if (!open) return;
// //     const canvas = canvasRef.current;
// //     const ctx = canvas.getContext('2d');
// //     ctx.lineJoin = 'round';
// //     ctx.lineCap = 'round';
// //     ctx.lineWidth = 2;
// //     ctx.strokeStyle = '#000000';
// //     ctx.clearRect(0, 0, canvas.width, canvas.height);
// //   }, [open]);

// //   const startDrawing = (e) => {
// //     setDrawing(true);
// //     const canvas = canvasRef.current;
// //     const rect = canvas.getBoundingClientRect();
// //     const ctx = canvas.getContext('2d');
// //     ctx.beginPath();
// //     const x = (e.clientX || e.touches[0].clientX) - rect.left;
// //     const y = (e.clientY || e.touches[0].clientY) - rect.top;
// //     ctx.moveTo(x, y);
// //   };

// //   const draw = (e) => {
// //     if (!drawing) return;
// //     e.preventDefault();
// //     const canvas = canvasRef.current;
// //     const rect = canvas.getBoundingClientRect();
// //     const ctx = canvas.getContext('2d');
// //     const x = (e.clientX || e.touches[0].clientX) - rect.left;
// //     const y = (e.clientY || e.touches[0].clientY) - rect.top;
// //     ctx.lineTo(x, y);
// //     ctx.stroke();
// //   };

// //   const stopDrawing = () => {
// //     setDrawing(false);
// //   };

// //   const clearCanvas = () => {
// //     const canvas = canvasRef.current;
// //     const ctx = canvas.getContext('2d');
// //     ctx.clearRect(0, 0, canvas.width, canvas.height);
// //   };

// //   const saveSignature = () => {
// //     const canvas = canvasRef.current;
// //     const dataUrl = canvas.toDataURL('image/png');
// //     onSave(dataUrl);
// //     onClose();
// //   };

// //   return (
// //     <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
// //       <DialogTitle>
// //         <Typography variant="h6">Draw Your Signature</Typography>
// //       </DialogTitle>
// //       <DialogContent>
// //         <Box sx={{ textAlign: 'center', p: 2 }}>
// //           <canvas
// //             ref={canvasRef}
// //             width={500}
// //             height={200}
// //             style={{
// //               border: '2px solid #ccc',
// //               borderRadius: 1,
// //               cursor: 'crosshair',
// //               touchAction: 'none',
// //               background: '#f8f9fa'
// //             }}
// //             onMouseDown={startDrawing}
// //             onMouseMove={draw}
// //             onMouseUp={stopDrawing}
// //             onMouseLeave={stopDrawing}
// //             onTouchStart={startDrawing}
// //             onTouchMove={draw}
// //             onTouchEnd={stopDrawing}
// //           />
// //           <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
// //             Draw your signature in the area above
// //           </Typography>
// //         </Box>
// //       </DialogContent>
// //       <DialogActions>
// //         <Button onClick={clearCanvas}>Clear</Button>
// //         <Button onClick={onClose}>Cancel</Button>
// //         <Button onClick={saveSignature} variant="contained">Save Signature</Button>
// //       </DialogActions>
// //     </Dialog>
// //   );
// // };

// // // -----------------------------
// // // Element Inspector Component
// // // -----------------------------
// // const ElementInspector = ({ element, onUpdate, onDelete, isMobile = false, documentType = "letter" }) => {
// //   if (!element) {
// //     return (
// //       <Box sx={{ p: 2, textAlign: 'center' }}>
// //         <Typography color="text.secondary">Select an element to edit</Typography>
// //       </Box>
// //     );
// //   }

// //   const handleUpdate = (field, value) => {
// //     onUpdate({ [field]: value });
// //   };

// //   const renderFieldSpecificControls = () => {
// //     switch (element.type) {
// //       case 'text':
// //         return (
// //           <>
// //             <TextField
// //               fullWidth
// //               label="Text Content"
// //               value={element.text || ''}
// //               onChange={(e) => handleUpdate('text', e.target.value)}
// //               sx={{ mb: 2 }}
// //               multiline
// //               rows={3}
// //             />
            
// //             <FormControl fullWidth sx={{ mb: 2 }}>
// //               <InputLabel>Font Size</InputLabel>
// //               <Select
// //                 value={element.fontSize || 14}
// //                 label="Font Size"
// //                 onChange={(e) => handleUpdate('fontSize', e.target.value)}
// //               >
// //                 {[10, 12, 14, 16, 18, 20, 24, 28, 32].map(size => (
// //                   <MenuItem key={size} value={size}>{size}px</MenuItem>
// //                 ))}
// //               </Select>
// //             </FormControl>

// //             <FormControl fullWidth sx={{ mb: 2 }}>
// //               <InputLabel>Text Align</InputLabel>
// //               <Select
// //                 value={element.align || 'left'}
// //                 label="Text Align"
// //                 onChange={(e) => handleUpdate('align', e.target.value)}
// //               >
// //                 <MenuItem value="left">Left</MenuItem>
// //                 <MenuItem value="center">Center</MenuItem>
// //                 <MenuItem value="right">Right</MenuItem>
// //                 <MenuItem value="justify">Justify</MenuItem>
// //               </Select>
// //             </FormControl>

// //             <FormControlLabel
// //               control={
// //                 <Switch
// //                   checked={!!element.bold}
// //                   onChange={(e) => handleUpdate('bold', e.target.checked)}
// //                 />
// //               }
// //               label="Bold"
// //               sx={{ mb: 1 }}
// //             />
            
// //             <FormControlLabel
// //               control={
// //                 <Switch
// //                   checked={!!element.italic}
// //                   onChange={(e) => handleUpdate('italic', e.target.checked)}
// //                 />
// //               }
// //               label="Italic"
// //               sx={{ mb: 2 }}
// //             />
// //           </>
// //         );

// //       case 'signature':
// //         return (
// //           <>
// //             <TextField
// //               fullWidth
// //               label="Signature Name"
// //               value={element.name || ''}
// //               onChange={(e) => handleUpdate('name', e.target.value)}
// //               sx={{ mb: 2 }}
// //               placeholder="e.g., John Doe"
// //             />
// //             <FormControlLabel
// //               control={
// //                 <Switch
// //                   checked={!!element.showName}
// //                   onChange={(e) => handleUpdate('showName', e.target.checked)}
// //                 />
// //               }
// //               label="Show Name Below Signature"
// //               sx={{ mb: 2 }}
// //             />
// //           </>
// //         );

// //       case 'address':
// //         return (
// //           <>
// //             <TextField
// //               fullWidth
// //               label="Recipient Name"
// //               value={element.name || ''}
// //               onChange={(e) => handleUpdate('name', e.target.value)}
// //               sx={{ mb: 2 }}
// //             />
// //             <TextField
// //               fullWidth
// //               label="Address Line 1"
// //               value={element.line1 || ''}
// //               onChange={(e) => handleUpdate('line1', e.target.value)}
// //               sx={{ mb: 2 }}
// //             />
// //             <TextField
// //               fullWidth
// //               label="City, State ZIP"
// //               value={element.city || ''}
// //               onChange={(e) => handleUpdate('city', e.target.value)}
// //               sx={{ mb: 2 }}
// //             />
// //           </>
// //         );

// //       case 'date':
// //         return (
// //           <TextField
// //             fullWidth
// //             type="date"
// //             label="Date"
// //             value={element.value || ''}
// //             onChange={(e) => handleUpdate('value', e.target.value)}
// //             sx={{ mb: 2 }}
// //           />
// //         );

// //       case 'email':
// //         return (
// //           <TextField
// //             fullWidth
// //             type="email"
// //             label="Email Address"
// //             value={element.value || ''}
// //             onChange={(e) => handleUpdate('value', e.target.value)}
// //             sx={{ mb: 2 }}
// //             placeholder="example@email.com"
// //           />
// //         );

// //       case 'phone':
// //         return (
// //           <TextField
// //             fullWidth
// //             type="tel"
// //             label="Phone Number"
// //             value={element.value || ''}
// //             onChange={(e) => handleUpdate('value', e.target.value)}
// //             sx={{ mb: 2 }}
// //             placeholder="+1 (555) 123-4567"
// //           />
// //         );

// //       default:
// //         return null;
// //     }
// //   };

// //   return (
// //     <Box sx={{ p: 2 }}>
// //       <Typography variant="h6" gutterBottom>
// //         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //           <FieldTypeIcon type={element.type} />
// //           {element.type.charAt(0).toUpperCase() + element.type.slice(1)} Properties
// //         </Box>
// //       </Typography>
      
// //       <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
// //         Drag to reposition, resize as needed
// //       </Typography>

// //       {renderFieldSpecificControls()}

// //       {!isMobile && (
// //         <>
// //           <TextField
// //             fullWidth
// //             type="number"
// //             label="X Position"
// //             value={element.x || 0}
// //             onChange={(e) => handleUpdate('x', parseInt(e.target.value))}
// //             sx={{ mb: 2 }}
// //           />
          
// //           <TextField
// //             fullWidth
// //             type="number"
// //             label="Y Position"
// //             value={element.y || 0}
// //             onChange={(e) => handleUpdate('y', parseInt(e.target.value))}
// //             sx={{ mb: 2 }}
// //           />
          
// //           <TextField
// //             fullWidth
// //             type="number"
// //             label="Width"
// //             value={element.width || 100}
// //             onChange={(e) => handleUpdate('width', parseInt(e.target.value))}
// //             sx={{ mb: 2 }}
// //           />
          
// //           <TextField
// //             fullWidth
// //             type="number"
// //             label="Height"
// //             value={element.height || 40}
// //             onChange={(e) => handleUpdate('height', parseInt(e.target.value))}
// //             sx={{ mb: 2 }}
// //           />
// //         </>
// //       )}

// //       <Button
// //         variant="outlined"
// //         color="error"
// //         onClick={onDelete}
// //         fullWidth
// //         startIcon={<Delete />}
// //       >
// //         Remove Element
// //       </Button>
// //     </Box>
// //   );
// // };

// // // -----------------------------
// // // Document Template Presets
// // // -----------------------------
// // const documentPresets = {
// //   letters: {
// //     'Business Letter': {
// //       elements: [
// //         { id: 'sender-address', type: 'address', name: '', line1: '', city: '', x: 50, y: 50, width: 200, height: 60 },
// //         { id: 'date', type: 'date', value: '', x: 500, y: 50, width: 120, height: 30 },
// //         { id: 'recipient-address', type: 'address', name: '', line1: '', city: '', x: 50, y: 150, width: 200, height: 60 },
// //         { id: 'salutation', type: 'text', text: '', x: 50, y: 250, width: 300, height: 30, fontSize: 14 },
// //         { id: 'body', type: 'text', text: '', x: 50, y: 300, width: 500, height: 200, fontSize: 14, align: 'left' },
// //         { id: 'closing', type: 'text', text: '', x: 50, y: 550, width: 100, height: 30, fontSize: 14 },
// //         { id: 'signature-space', type: 'text', text: '', x: 50, y: 600, width: 200, height: 80, fontSize: 14 }
// //       ]
// //     },
// //     'Offer Letter': {
// //       elements: [
// //         { id: 'company-header', type: 'text', text: '', x: 300, y: 50, width: 200, height: 40, fontSize: 20, bold: true, align: 'center' },
// //         { id: 'date', type: 'date', value: '', x: 600, y: 50, width: 120, height: 30 },
// //         { id: 'candidate-address', type: 'address', name: '', line1: '', city: '', x: 50, y: 120, width: 250, height: 80 },
// //         { id: 'subject', type: 'text', text: '', x: 50, y: 220, width: 400, height: 40, fontSize: 16, bold: true },
// //         { id: 'salutation', type: 'text', text: '', x: 50, y: 280, width: 300, height: 30, fontSize: 14 },
// //         { id: 'body', type: 'text', text: '', x: 50, y: 330, width: 500, height: 300, fontSize: 14, align: 'left' },
// //         { id: 'closing', type: 'text', text: '', x: 50, y: 650, width: 100, height: 30, fontSize: 14 },
// //         { id: 'signature-space', type: 'text', text: '', x: 50, y: 700, width: 200, height: 80, fontSize: 14 },
// //         { id: 'hr-name', type: 'text', text: '', x: 50, y: 790, width: 150, height: 30, fontSize: 12 },
// //         { id: 'hr-title', type: 'text', text: '', x: 50, y: 810, width: 150, height: 30, fontSize: 12 }
// //       ]
// //     }
// //   },
// //   forms: {
// //     'Application Form': {
// //       elements: [
// //         { id: 'form-title', type: 'text', text: 'Application Form', x: 300, y: 50, width: 200, height: 40, fontSize: 20, bold: true, align: 'center' },
// //         { id: 'applicant-name', type: 'text', text: 'Full Name:', x: 50, y: 120, width: 120, height: 30, fontSize: 14 },
// //         { id: 'applicant-name-field', type: 'text', text: '', x: 180, y: 120, width: 300, height: 30, fontSize: 14 },
// //         { id: 'applicant-email', type: 'text', text: 'Email:', x: 50, y: 170, width: 120, height: 30, fontSize: 14 },
// //         { id: 'applicant-email-field', type: 'email', value: '', x: 180, y: 170, width: 300, height: 30, fontSize: 14 },
// //         { id: 'applicant-phone', type: 'text', text: 'Phone:', x: 50, y: 220, width: 120, height: 30, fontSize: 14 },
// //         { id: 'applicant-phone-field', type: 'phone', value: '', x: 180, y: 220, width: 300, height: 30, fontSize: 14 },
// //         { id: 'applicant-address', type: 'address', name: '', line1: '', city: '', x: 50, y: 270, width: 430, height: 80 },
// //         { id: 'signature', type: 'signature', src: '', x: 50, y: 380, width: 200, height: 80, showName: true, name: '' }
// //       ]
// //     }
// //   }
// // };

// // // -----------------------------
// // // Main Enhanced AI Document Generator Component
// // // -----------------------------
// // export default function EnhancedAIDocumentGenerator() {
// //   const theme = useTheme();
// //   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
// //   // State Management
// //   const [activeTab, setActiveTab] = useState(0);
// //   const [documentType, setDocumentType] = useState("letters");
// //   const [templateType, setTemplateType] = useState("Business Letter");
// //   const [placeholders, setPlaceholders] = useState({});
// //   const [placeholderInput, setPlaceholderInput] = useState("");
// //   const [suggestedPlaceholders, setSuggestedPlaceholders] = useState([]);
// //   const [suggestedSections, setSuggestedSections] = useState([]);
// //   const [instructions, setInstructions] = useState("");
// //   const [generatedHtml, setGeneratedHtml] = useState("");
// //   const [loading, setLoading] = useState(false);
// //   const [toast, setToast] = useState({ open: false, message: "", type: "success" });
// //   const [outputFormat, setOutputFormat] = useState("pdf");
// //   const [savedTemplates, setSavedTemplates] = useState([]);
// //   const [previewOpen, setPreviewOpen] = useState(false);
// //   const [executionLog, setExecutionLog] = useState([]);
// //   const [autoSave, setAutoSave] = useState(true);
// //   const [templateName, setTemplateName] = useState("");
// //   const [editMode, setEditMode] = useState(false);
// //   const [currentTemplateId, setCurrentTemplateId] = useState(null);
// //   const [enhancePlaceholders, setEnhancePlaceholders] = useState(true);
// //   const [templateProperties, setTemplateProperties] = useState([]);
// //   const [suggestionsLoading, setSuggestionsLoading] = useState(false);
// //   const [templateStats, setTemplateStats] = useState({});
// //   const [searchQuery, setSearchQuery] = useState("");
// //   const [selectedCategory, setSelectedCategory] = useState("all");
// //   const [documentTypes, setDocumentTypes] = useState({
// //     letters: {
// //       name: "Letters",
// //       icon: "✉️",
// //       description: "Professional correspondence documents",
// //       templates: {
// //         "Business Letter": { icon: "💼", description: "Professional business correspondence" },
// //         "Offer Letter": { icon: "📝", description: "Employment offer documents" },
// //         "Cover Letter": { icon: "📄", description: "Job application cover letters" },
// //         "Recommendation Letter": { icon: "⭐", description: "Professional recommendations" },
// //         "Resignation Letter": { icon: "👋", description: "Employment resignation notices" },
// //         "Personal Letter": { icon: "✉️", description: "Personal correspondence" },
// //         "Thank You Letter": { icon: "🙏", description: "Appreciation and gratitude letters" },
// //         "Appointment Letter": { icon: "📅", description: "Official appointment confirmation" }
// //       }
// //     },
// //     forms: {
// //       name: "Forms",
// //       icon: "📋",
// //       description: "Structured forms and applications",
// //       templates: {
// //         "Application Form": { icon: "📝", description: "General application form" },
// //         "Registration Form": { icon: "📝", description: "Event or service registration" },
// //         "Agreement Form": { icon: "📝", description: "Legal agreement documents" }
// //       }
// //     }
// //   });
  
// //   // Visual Builder States
// //   const [canvasElements, setCanvasElements] = useState([]);
// //   const [selectedElementId, setSelectedElementId] = useState(null);
// //   const [signatureModalOpen, setSignatureModalOpen] = useState(false);
// //   const [showInspector, setShowInspector] = useState(!isMobile);

// //   const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

// //   // Load saved templates on component mount
// //   useEffect(() => {
// //     fetchSavedTemplates();
// //     fetchTemplateStats();
// //     fetchDocumentTypes();
// //   }, []);

// //   // Apply preset when template type or document type changes
// //   useEffect(() => {
// //     const presets = documentPresets[documentType];
// //     if (presets && presets[templateType]) {
// //       setCanvasElements(JSON.parse(JSON.stringify(presets[templateType].elements)));
// //     } else {
// //       setCanvasElements([]);
// //     }
// //   }, [templateType, documentType]);

// //   // Sync HTML with canvas elements when generatedHtml changes
// //   useEffect(() => {
// //     if (generatedHtml && activeTab === 1) {
// //       const parsedElements = parseHtmlToCanvasElements(generatedHtml);
// //       if (parsedElements.length > 0) {
// //         setCanvasElements(prev => [...prev, ...parsedElements]);
// //         addLog("AI content converted to editable elements", "success");
// //       }
// //     }
// //   }, [generatedHtml, activeTab]);

// //   // Sync canvas elements back to HTML when they change
// //   useEffect(() => {
// //     if (canvasElements.length > 0 && activeTab === 2) {
// //       const updatedHtml = convertCanvasElementsToHtml(canvasElements);
// //       setGeneratedHtml(updatedHtml);
// //     }
// //   }, [canvasElements, activeTab]);

// //   // Enhanced auto-save with debouncing
// //   const debouncedSave = useCallback(
// //     debounce((html, name) => {
// //       if (autoSave && html && name) {
// //         handleSaveTemplate();
// //       }
// //     }, 3000),
// //     [autoSave]
// //   );

// //   useEffect(() => {
// //     debouncedSave(generatedHtml, templateName);
// //   }, [generatedHtml, templateName, debouncedSave]);

// //   // Fetch placeholder suggestions when template type changes
// //   useEffect(() => {
// //     if (templateType && enhancePlaceholders) {
// //       fetchPlaceholderSuggestions();
// //     }
// //   }, [templateType, documentType, enhancePlaceholders]);

// //   const addLog = (message, type = "info") => {
// //     setExecutionLog(prev => [...prev.slice(-9), {
// //       id: Date.now(),
// //       message,
// //       type,
// //       timestamp: new Date().toLocaleTimeString()
// //     }]);
// //   };

// //   const fetchSavedTemplates = async () => {
// //     try {
// //       const token = localStorage.getItem('token');
// //       const response = await axios.get(`${API_URL}/templates/my-templates`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //         params: { search: searchQuery, category: selectedCategory !== 'all' ? selectedCategory : undefined }
// //       });
// //       setSavedTemplates(response.data || []);
// //       addLog("Templates loaded successfully", "success");
// //     } catch (error) {
// //       console.error("Error fetching templates:", error);
// //       addLog("Error loading templates", "error");
// //     }
// //   };

// //   const fetchTemplateStats = async () => {
// //     try {
// //       const token = localStorage.getItem('token');
// //       const response = await axios.get(`${API_URL}/templates/collection/stats`, {
// //         headers: { Authorization: `Bearer ${token}` }
// //       });
// //       setTemplateStats(response.data || {});
// //     } catch (error) {
// //       console.error("Error fetching stats:", error);
// //     }
// //   };

// //   const fetchDocumentTypes = async () => {
// //     try {
// //       const token = localStorage.getItem('token');
// //       const response = await axios.get(`${API_URL}/templates/document-types`, {
// //         headers: { Authorization: `Bearer ${token}` }
// //       });
// //       if (response.data && response.data.document_types) {
// //         setDocumentTypes(response.data.document_types);
// //         addLog("Document types loaded from backend", "success");
// //       }
// //     } catch (error) {
// //       console.error("Error fetching document types:", error);
// //       addLog("Using default document types", "info");
// //     }
// //   };

// //   const fetchPlaceholderSuggestions = async () => {
// //     setSuggestionsLoading(true);
// //     try {
// //       const token = localStorage.getItem('token');
// //       const response = await axios.post(`${API_URL}/templates/suggest-placeholders`, {
// //         template_type: templateType,
// //         document_type: documentType
// //       }, {
// //         headers: { Authorization: `Bearer ${token}` }
// //       });
      
// //       const suggestions = response.data.suggestions;
// //       setSuggestedPlaceholders(suggestions.placeholders || []);
// //       setSuggestedSections(suggestions.sections || []);
// //       setTemplateProperties(suggestions.properties || []);
      
// //       // Initialize placeholders with empty values
// //       const emptyPlaceholders = {};
// //       suggestions.placeholders?.forEach(ph => {
// //         emptyPlaceholders[ph.key] = "";
// //       });
// //       setPlaceholders(emptyPlaceholders);
      
// //       addLog("AI suggestions loaded", "success");
// //     } catch (error) {
// //       console.error("Error fetching suggestions:", error);
// //       addLog("Failed to load suggestions", "warning");
// //     }
// //     setSuggestionsLoading(false);
// //   };

// //   const generateTemplate = async () => {
// //     if (!templateType) {
// //       setToast({ open: true, message: "Please select a template type", type: "warning" });
// //       return;
// //     }

// //     setLoading(true);
// //     addLog(`Starting AI ${documentType} generation...`, "info");

// //     try {
// //       const token = localStorage.getItem('token');
// //       const response = await axios.post(`${API_URL}/templates/generate`, {
// //         template_type: templateType,
// //         document_type: documentType,
// //         placeholders: Object.keys(placeholders).reduce((acc, key) => {
// //           acc[key] = ""; // Ensure all placeholders are empty
// //           return acc;
// //         }, {}),
// //         custom_prompt: instructions,
// //         format: outputFormat,
// //         name: templateName,
// //         properties: templateProperties.map(prop => ({
// //           key: prop.key,
// //           value: "",
// //           type: prop.type,
// //           options: prop.options || [],
// //           required: prop.required || false,
// //           description: prop.description || ""
// //         })),
// //         enhance_placeholders: enhancePlaceholders
// //       }, {
// //         headers: { Authorization: `Bearer ${token}` }
// //       });

// //       setGeneratedHtml(response.data.template || response.data.content || "");
// //       setCurrentTemplateId(response.data.id);
// //       setTemplateName(response.data.name || templateName);
      
// //       // Reset placeholders to empty
// //       const emptyPlaceholders = {};
// //       Object.keys(response.data.placeholders || {}).forEach(key => {
// //         emptyPlaceholders[key] = "";
// //       });
// //       setPlaceholders(emptyPlaceholders);
      
// //       addLog(`${documentType.charAt(0).toUpperCase() + documentType.slice(1)} generated successfully`, "success");
// //       setToast({ open: true, message: `${templateType} Generated Successfully!`, type: "success" });
      
// //       setActiveTab(1); // Switch to visual builder tab
      
// //     } catch (err) {
// //       console.error("Error generating template:", err);
// //       addLog("Error generating template", "error");
// //       setToast({ open: true, message: "❌ Error Generating Document!", type: "error" });
// //     }
// //     setLoading(false);
// //   };

// //   const fillDocument = async () => {
// //     if (!currentTemplateId) {
// //       setToast({ open: true, message: "No template loaded", type: "warning" });
// //       return;
// //     }

// //     try {
// //       const token = localStorage.getItem('token');
// //       const response = await axios.post(`${API_URL}/templates/fill-document`, {
// //         template_id: currentTemplateId,
// //         placeholders: placeholders,
// //         format: outputFormat
// //       }, {
// //         headers: { Authorization: `Bearer ${token}` }
// //       });

// //       setGeneratedHtml(response.data.filled_content || "");
// //       addLog("Document filled with provided values", "success");
// //       setToast({ open: true, message: "Document Filled Successfully!", type: "success" });
      
// //     } catch (error) {
// //       console.error("Error filling document:", error);
// //       addLog("Error filling document", "error");
// //       setToast({ open: true, message: "❌ Error Filling Document!", type: "error" });
// //     }
// //   };

// //   const handlePlaceholderChange = (key, value) => {
// //     setPlaceholders(prev => ({
// //       ...prev,
// //       [key]: value
// //     }));
// //   };

// //   const loadTemplate = (template) => {
// //     setGeneratedHtml(template.content || "");
// //     setTemplateName(template.name || "");
// //     setTemplateType(template.template_type || "Business Letter");
// //     setDocumentType(template.document_type || "letters");
// //     setOutputFormat(template.format || "pdf");
// //     setCurrentTemplateId(template.id);
    
// //     // Ensure placeholders are empty
// //     const emptyPlaceholders = {};
// //     if (template.placeholders) {
// //       Object.keys(template.placeholders).forEach(key => {
// //         emptyPlaceholders[key] = "";
// //       });
// //     }
// //     setPlaceholders(emptyPlaceholders);
    
// //     // Parse HTML content to canvas elements
// //     const parsedElements = parseHtmlToCanvasElements(template.content);
// //     setCanvasElements(parsedElements.length > 0 ? parsedElements : (template.canvasElements || []));
// //     setEditMode(true);
// //     setActiveTab(1);
// //     addLog(`Loaded template: ${template.name}`, "success");
// //   };

// //   // Visual Builder Functions
// //   const addTextElement = () => {
// //     const newElement = {
// //       id: `text_${Date.now()}`,
// //       type: 'text',
// //       text: '',
// //       x: 100,
// //       y: 200,
// //       width: 200,
// //       height: 40,
// //       fontSize: 14,
// //       align: 'left'
// //     };
// //     setCanvasElements(prev => [...prev, newElement]);
// //     setSelectedElementId(newElement.id);
// //   };

// //   const addSignatureElement = () => {
// //     setSignatureModalOpen(true);
// //   };

// //   const handleSignatureSave = (signatureDataUrl) => {
// //     const newElement = {
// //       id: `signature_${Date.now()}`,
// //       type: 'signature',
// //       src: signatureDataUrl,
// //       x: 100,
// //       y: 300,
// //       width: 200,
// //       height: 80,
// //       showName: true,
// //       name: ''
// //     };
// //     setCanvasElements(prev => [...prev, newElement]);
// //     setSelectedElementId(newElement.id);
// //   };

// //   const addAddressElement = () => {
// //     const newElement = {
// //       id: `address_${Date.now()}`,
// //       type: 'address',
// //       name: '',
// //       line1: '',
// //       city: '',
// //       x: 50,
// //       y: 100,
// //       width: 200,
// //       height: 80
// //     };
// //     setCanvasElements(prev => [...prev, newElement]);
// //     setSelectedElementId(newElement.id);
// //   };

// //   const addDateElement = () => {
// //     const newElement = {
// //       id: `date_${Date.now()}`,
// //       type: 'date',
// //       value: '',
// //       x: 500,
// //       y: 50,
// //       width: 120,
// //       height: 30
// //     };
// //     setCanvasElements(prev => [...prev, newElement]);
// //     setSelectedElementId(newElement.id);
// //   };

// //   const addEmailElement = () => {
// //     const newElement = {
// //       id: `email_${Date.now()}`,
// //       type: 'email',
// //       value: '',
// //       x: 100,
// //       y: 200,
// //       width: 200,
// //       height: 30
// //     };
// //     setCanvasElements(prev => [...prev, newElement]);
// //     setSelectedElementId(newElement.id);
// //   };

// //   const addPhoneElement = () => {
// //     const newElement = {
// //       id: `phone_${Date.now()}`,
// //       type: 'phone',
// //       value: '',
// //       x: 100,
// //       y: 250,
// //       width: 200,
// //       height: 30
// //     };
// //     setCanvasElements(prev => [...prev, newElement]);
// //     setSelectedElementId(newElement.id);
// //   };

// //   const updateCanvasElement = (elementId, updates) => {
// //     setCanvasElements(prev =>
// //       prev.map(el =>
// //         el.id === elementId ? { ...el, ...updates } : el
// //       )
// //     );
// //   };

// //   const deleteCanvasElement = (elementId) => {
// //     setCanvasElements(prev => prev.filter(el => el.id !== elementId));
// //     if (selectedElementId === elementId) {
// //       setSelectedElementId(null);
// //     }
// //   };

// //   const handleSaveTemplate = async () => {
// //     if (!templateName.trim()) {
// //       setToast({ open: true, message: "Please provide a template name", type: "warning" });
// //       return;
// //     }

// //     try {
// //       const token = localStorage.getItem('token');
// //       let response;

// //       // Convert canvas elements to HTML for saving
// //       const finalHtml = convertCanvasElementsToHtml(canvasElements);

// //       const templateData = {
// //         name: templateName,
// //         content: finalHtml,
// //         template_type: templateType,
// //         document_type: documentType,
// //         format: outputFormat,
// //         placeholders: placeholders,
// //         properties: templateProperties.map(prop => ({
// //           key: prop.key,
// //           value: "",
// //           type: prop.type,
// //           options: prop.options || [],
// //           required: prop.required || false,
// //           description: prop.description || ""
// //         })),
// //         isAIgenerated: true,
// //         tags: [templateType.toLowerCase().replace(" ", "_"), documentType],
// //         category: documentType,
// //         canvasElements: canvasElements
// //       };

// //       if (editMode && currentTemplateId) {
// //         response = await axios.put(`${API_URL}/templates/${currentTemplateId}`, templateData, {
// //           headers: { Authorization: `Bearer ${token}` }
// //         });
// //         addLog("Template updated successfully", "success");
// //       } else {
// //         response = await axios.post(`${API_URL}/templates/save`, templateData, {
// //           headers: { Authorization: `Bearer ${token}` }
// //         });
// //         setCurrentTemplateId(response.data.id);
// //         addLog("Template saved successfully", "success");
// //       }

// //       setEditMode(true);
// //       fetchSavedTemplates();
// //       setToast({ open: true, message: "💾 Template Saved Successfully!", type: "success" });
      
// //     } catch (error) {
// //       console.error("Error saving template:", error);
// //       addLog("Error saving template", "error");
// //       setToast({ open: true, message: "❌ Error Saving Template!", type: "error" });
// //     }
// //   };

// //   const downloadPDF = () => {
// //     if (!templateName || !generatedHtml) {
// //       setToast({ open: true, message: "No document to download", type: "warning" });
// //       return;
// //     }

// //     addLog("Generating PDF...", "info");
// //     try {
// //       const element = document.getElementById('pdf-template-content');
// //       if (!element) {
// //         throw new Error("Preview element not found");
// //       }
      
// //       const opt = {
// //         margin: 0.5,
// //         filename: `${templateName.replace(/ /g, "_")}.pdf`,
// //         image: { type: 'jpeg', quality: 0.98 },
// //         html2canvas: { 
// //           scale: 2,
// //           useCORS: true,
// //           logging: false
// //         },
// //         jsPDF: { 
// //           unit: 'in', 
// //           format: 'letter', 
// //           orientation: 'portrait' 
// //         }
// //       };

// //       html2pdf().set(opt).from(element).save();
// //       addLog("PDF downloaded successfully", "success");
// //       setToast({ open: true, message: "📄 PDF Downloaded!", type: "success" });
// //     } catch (error) {
// //       console.error("PDF generation failed:", error);
// //       addLog("PDF generation failed", "error");
// //       setToast({ open: true, message: "❌ PDF Generation Failed!", type: "error" });
// //     }
// //   };

// //   const createNewTemplate = () => {
// //     setGeneratedHtml("");
// //     setTemplateName("");
// //     setDocumentType("letters");
// //     setTemplateType("Business Letter");
// //     setPlaceholders({});
// //     setPlaceholderInput("");
// //     setInstructions("");
// //     const presets = documentPresets.letters;
// //     setCanvasElements(presets && presets['Business Letter'] ? JSON.parse(JSON.stringify(presets['Business Letter'].elements)) : []);
// //     setSelectedElementId(null);
// //     setCurrentTemplateId(null);
// //     setEditMode(false);
// //     setActiveTab(0);
// //     addLog("Started new template", "info");
// //   };

// //   const addCustomPlaceholder = () => {
// //     if (placeholderInput.trim()) {
// //       const key = placeholderInput.trim().toLowerCase().replace(/\s+/g, '_');
// //       setPlaceholders(prev => ({
// //         ...prev,
// //         [key]: ""
// //       }));
// //       setPlaceholderInput("");
// //       addLog(`Added placeholder: ${key}`, "success");
// //     }
// //   };

// //   const syncToHtmlEditor = () => {
// //     const updatedHtml = convertCanvasElementsToHtml(canvasElements);
// //     setGeneratedHtml(updatedHtml);
// //     setActiveTab(2); // Switch to HTML editor
// //     addLog("Canvas elements synced to HTML editor", "success");
// //   };

// //   const selectedElement = canvasElements.find(el => el.id === selectedElementId);

// //   const getDocumentTypeIcon = (type) => {
// //     return documentTypes[type]?.icon || "📄";
// //   };

// //   const getTemplateOptions = () => {
// //     return documentTypes[documentType]?.templates || {};
// //   };

// //   const handleSearch = () => {
// //     fetchSavedTemplates();
// //   };

// //   const handleDownloadTemplate = async (templateId, templateName) => {
// //     try {
// //       const token = localStorage.getItem('token');
// //       const response = await axios.get(`${API_URL}/templates/download/${templateId}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //         responseType: 'blob'
// //       });
      
// //       const url = window.URL.createObjectURL(new Blob([response.data]));
// //       const link = document.createElement('a');
// //       link.href = url;
// //       link.setAttribute('download', `${templateName.replace(/ /g, '_')}.pdf`);
// //       document.body.appendChild(link);
// //       link.click();
// //       link.remove();
      
// //       addLog(`Template ${templateName} downloaded`, "success");
// //       setToast({ open: true, message: "Template Downloaded!", type: "success" });
// //     } catch (error) {
// //       console.error("Error downloading template:", error);
// //       setToast({ open: true, message: "❌ Error Downloading Template!", type: "error" });
// //     }
// //   };

// //   const handleDeleteTemplate = async (templateId) => {
// //     if (!window.confirm("Are you sure you want to delete this template?")) return;
    
// //     try {
// //       const token = localStorage.getItem('token');
// //       await axios.delete(`${API_URL}/templates/${templateId}`, {
// //         headers: { Authorization: `Bearer ${token}` }
// //       });
      
// //       fetchSavedTemplates();
// //       addLog("Template deleted", "success");
// //       setToast({ open: true, message: "Template Deleted!", type: "success" });
// //     } catch (error) {
// //       console.error("Error deleting template:", error);
// //       setToast({ open: true, message: "❌ Error Deleting Template!", type: "error" });
// //     }
// //   };

// //   return (
// //     <Box sx={{ 
// //       maxWidth: 1400, 
// //       mx: "auto", 
// //       p: { xs: 1, md: 3 }, 
// //       bgcolor: 'background.default', 
// //       minHeight: '100vh' 
// //     }}>
// //       {/* Enhanced Header */}
// //       <Box sx={{ mb: 4, textAlign: 'center' }}>
// //         <Typography variant="h3" sx={{ 
// //           fontWeight: "bold", 
// //           mb: 2,
// //           background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
// //           WebkitBackgroundClip: 'text',
// //           WebkitTextFillColor: 'transparent',
// //           fontSize: { xs: '2rem', md: '3rem' }
// //         }}>
// //           🚀 AI Document Generator
// //         </Typography>
// //         <Typography variant="h6" color="text.secondary" sx={{ 
// //           maxWidth: 600, 
// //           mx: 'auto',
// //           fontSize: { xs: '0.9rem', md: '1.1rem' }
// //         }}>
// //           Create professional documents, letters, and forms with AI-powered templates
// //         </Typography>
// //       </Box>

// //       {/* Stats Bar */}
// //       <Grid container spacing={2} sx={{ mb: 3 }}>
// //         <Grid item xs={6} sm={3}>
// //           <Card sx={{ textAlign: 'center', p: 1 }}>
// //             <Typography variant="h6" color="primary">{templateStats.total_templates || 0}</Typography>
// //             <Typography variant="caption">Total Documents</Typography>
// //           </Card>
// //         </Grid>
// //         <Grid item xs={6} sm={3}>
// //           <Card sx={{ textAlign: 'center', p: 1 }}>
// //             <Typography variant="h6" color="success.main">{templateStats.ai_generated_templates || 0}</Typography>
// //             <Typography variant="caption">AI Generated</Typography>
// //           </Card>
// //         </Grid>
// //         <Grid item xs={6} sm={3}>
// //           <Card sx={{ textAlign: 'center', p: 1 }}>
// //             <Typography variant="h6" color="info.main">{Object.keys(templateStats.type_distribution || {}).length}</Typography>
// //             <Typography variant="caption">Document Types</Typography>
// //           </Card>
// //         </Grid>
// //         <Grid item xs={6} sm={3}>
// //           <Card sx={{ textAlign: 'center', p: 1 }}>
// //             <Typography variant="h6" color="warning.main">{savedTemplates.length}</Typography>
// //             <Typography variant="caption">Saved</Typography>
// //           </Card>
// //         </Grid>
// //       </Grid>

// //       {/* Main Content Grid */}
// //       <Grid container spacing={2}>
// //         {/* Left Sidebar - Template Library */}
// //         <Grid item xs={12} lg={3}>
// //           <Paper elevation={2} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
// //             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
// //               <Folder color="primary" sx={{ mr: 1 }} />
// //               <Typography variant="h6">Document Library</Typography>
// //               <Badge badgeContent={savedTemplates.length} color="primary" sx={{ ml: 1 }} />
// //             </Box>
            
// //             <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
// //               <TextField
// //                 fullWidth
// //                 size="small"
// //                 placeholder="Search documents..."
// //                 value={searchQuery}
// //                 onChange={(e) => setSearchQuery(e.target.value)}
// //                 onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
// //               />
// //               <Button variant="contained" size="small" onClick={handleSearch}>
// //                 Search
// //               </Button>
// //             </Box>
            
// //             <FormControl fullWidth size="small" sx={{ mb: 2 }}>
// //               <InputLabel>Category</InputLabel>
// //               <Select
// //                 value={selectedCategory}
// //                 label="Category"
// //                 onChange={(e) => {
// //                   setSelectedCategory(e.target.value);
// //                   setTimeout(() => handleSearch(), 100);
// //                 }}
// //               >
// //                 <MenuItem value="all">All Documents</MenuItem>
// //                 {Object.keys(documentTypes).map(type => (
// //                   <MenuItem key={type} value={type}>
// //                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                       <span>{documentTypes[type]?.icon || "📄"}</span>
// //                       {documentTypes[type]?.name || type}
// //                     </Box>
// //                   </MenuItem>
// //                 ))}
// //               </Select>
// //             </FormControl>

// //             <Button
// //               variant="contained"
// //               startIcon={<Add />}
// //               onClick={createNewTemplate}
// //               fullWidth
// //               sx={{ mb: 2 }}
// //             >
// //               New Document
// //             </Button>

// //             <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
// //               {savedTemplates.map((template) => (
// //                 <ListItem
// //                   key={template.id}
// //                   sx={{
// //                     border: '1px solid',
// //                     borderColor: 'divider',
// //                     borderRadius: 1,
// //                     mb: 1,
// //                     cursor: 'pointer',
// //                     '&:hover': { bgcolor: 'action.hover' }
// //                   }}
// //                   onClick={() => loadTemplate(template)}
// //                   secondaryAction={
// //                     <Box>
// //                       <Tooltip title="Download">
// //                         <IconButton 
// //                           size="small" 
// //                           onClick={(e) => {
// //                             e.stopPropagation();
// //                             handleDownloadTemplate(template.id, template.name);
// //                           }}
// //                         >
// //                           <CloudDownload fontSize="small" />
// //                         </IconButton>
// //                       </Tooltip>
// //                       <Tooltip title="Delete">
// //                         <IconButton 
// //                           size="small" 
// //                           color="error"
// //                           onClick={(e) => {
// //                             e.stopPropagation();
// //                             handleDeleteTemplate(template.id);
// //                           }}
// //                         >
// //                           <Delete fontSize="small" />
// //                         </IconButton>
// //                       </Tooltip>
// //                     </Box>
// //                   }
// //                 >
// //                   <ListItemIcon>
// //                     <Description color="primary" />
// //                   </ListItemIcon>
// //                   <ListItemText
// //                     primary={
// //                       <Typography variant="body2" noWrap>
// //                         {template.name}
// //                       </Typography>
// //                     }
// //                     secondary={
// //                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
// //                         <Chip 
// //                           label={template.template_type} 
// //                           size="small" 
// //                           variant="outlined" 
// //                           sx={{ height: 20, fontSize: '0.6rem' }}
// //                         />
// //                         <Chip 
// //                           label={template.document_type || 'letter'} 
// //                           size="small" 
// //                           color="secondary"
// //                           sx={{ height: 20, fontSize: '0.6rem' }}
// //                         />
// //                       </Box>
// //                     }
// //                   />
// //                 </ListItem>
// //               ))}
// //             </List>

// //             <FormControlLabel
// //               control={
// //                 <Switch
// //                   checked={autoSave}
// //                   onChange={(e) => setAutoSave(e.target.checked)}
// //                   color="success"
// //                 />
// //               }
// //               label="Auto-save"
// //               sx={{ mt: 1 }}
// //             />
// //           </Paper>

// //           {/* Document Types Quick Access */}
// //           <Paper elevation={2} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
// //             <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
// //               Quick Access
// //             </Typography>
// //             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
// //               {Object.entries(documentTypes).map(([key, docType]) => (
// //                 <Button
// //                   key={key}
// //                   variant={documentType === key ? "contained" : "outlined"}
// //                   startIcon={<span>{docType.icon}</span>}
// //                   onClick={() => {
// //                     setDocumentType(key);
// //                     const templates = Object.keys(docType.templates);
// //                     if (templates.length > 0) {
// //                       setTemplateType(templates[0]);
// //                     }
// //                   }}
// //                   sx={{ justifyContent: 'flex-start' }}
// //                 >
// //                   {docType.name}
// //                 </Button>
// //               ))}
// //             </Box>
// //           </Paper>

// //           {/* Activity Log */}
// //           <Paper elevation={2} sx={{ p: 2, borderRadius: 2, maxHeight: 300, overflow: 'auto' }}>
// //             <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
// //               <History sx={{ mr: 1, fontSize: 20 }} />
// //               Activity Log
// //             </Typography>
// //             <List dense>
// //               {executionLog.map((log) => (
// //                 <ListItem key={log.id} sx={{ px: 0, py: 0.5 }}>
// //                   <ListItemIcon sx={{ minWidth: 32 }}>
// //                     <LogIcon type={log.type} />
// //                   </ListItemIcon>
// //                   <ListItemText
// //                     primary={
// //                       <Typography variant="caption" noWrap>
// //                         {log.message}
// //                       </Typography>
// //                     }
// //                     secondary={
// //                       <Typography variant="caption" color="text.secondary">
// //                         {log.timestamp}
// //                       </Typography>
// //                     }
// //                   />
// //                 </ListItem>
// //               ))}
// //             </List>
// //           </Paper>
// //         </Grid>

// //         {/* Main Content Area */}
// //         <Grid item xs={12} lg={9}>
// //           <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
// //             {/* Enhanced Tabs */}
// //             <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
// //               <Tabs 
// //                 value={activeTab} 
// //                 onChange={(e, newValue) => setActiveTab(newValue)}
// //                 variant={isMobile ? "scrollable" : "standard"}
// //                 scrollButtons="auto"
// //               >
// //                 <Tab icon={<SmartToy />} label="AI Generator" />
// //                 <Tab icon={<DesignServices />} label="Visual Builder" />
// //                 <Tab icon={<Code />} label="HTML Editor" disabled={!generatedHtml} />
// //                 <Tab icon={<Download />} label="Export" disabled={!generatedHtml} />
// //               </Tabs>
// //             </Box>

// //             {/* Tab 1: AI Generator */}
// //             <TabPanel value={activeTab} index={0}>
// //               <Grid container spacing={2}>
// //                 <Grid item xs={12} md={6}>
// //                   <TextField
// //                     fullWidth
// //                     label="Document Title"
// //                     value={templateName}
// //                     onChange={(e) => setTemplateName(e.target.value)}
// //                     placeholder={`e.g., ${templateType} - ${new Date().toLocaleDateString()}`}
// //                     sx={{ mb: 2 }}
// //                   />

// //                   <FormControl fullWidth sx={{ mb: 2 }}>
// //                     <InputLabel>Document Type</InputLabel>
// //                     <Select
// //                       value={documentType}
// //                       label="Document Type"
// //                       onChange={(e) => setDocumentType(e.target.value)}
// //                     >
// //                       {Object.entries(documentTypes).map(([key, docType]) => (
// //                         <MenuItem key={key} value={key}>
// //                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                             <span>{docType.icon}</span>
// //                             <Box>
// //                               <Typography variant="body2">{docType.name}</Typography>
// //                               <Typography variant="caption" color="text.secondary">
// //                                 {docType.description}
// //                               </Typography>
// //                             </Box>
// //                           </Box>
// //                         </MenuItem>
// //                       ))}
// //                     </Select>
// //                   </FormControl>

// //                   <FormControl fullWidth sx={{ mb: 2 }}>
// //                     <InputLabel>Template Type</InputLabel>
// //                     <Select
// //                       value={templateType}
// //                       label="Template Type"
// //                       onChange={(e) => setTemplateType(e.target.value)}
// //                     >
// //                       {Object.entries(getTemplateOptions()).map(([key, template]) => (
// //                         <MenuItem key={key} value={key}>
// //                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                             <span>{template.icon}</span>
// //                             <Box>
// //                               <Typography variant="body2">{key}</Typography>
// //                               <Typography variant="caption" color="text.secondary">
// //                                 {template.description}
// //                               </Typography>
// //                             </Box>
// //                           </Box>
// //                         </MenuItem>
// //                       ))}
// //                     </Select>
// //                   </FormControl>

// //                   <FormControlLabel
// //                     control={
// //                       <Switch
// //                         checked={enhancePlaceholders}
// //                         onChange={(e) => setEnhancePlaceholders(e.target.checked)}
// //                         color="primary"
// //                       />
// //                     }
// //                     label="AI Placeholder Suggestions"
// //                     sx={{ mb: 2 }}
// //                   />

// //                   <Accordion sx={{ mb: 2 }}>
// //                     <AccordionSummary expandIcon={<ExpandMore />}>
// //                       <Typography>Document Details</Typography>
// //                     </AccordionSummary>
// //                     <AccordionDetails>
// //                       {suggestionsLoading ? (
// //                         <Box sx={{ textAlign: 'center', py: 2 }}>
// //                           <CircularProgress size={24} />
// //                           <Typography variant="caption" display="block" sx={{ mt: 1 }}>
// //                             Loading AI suggestions...
// //                           </Typography>
// //                         </Box>
// //                       ) : (
// //                         <>
// //                           {suggestedSections.length > 0 && (
// //                             <Box sx={{ mb: 2 }}>
// //                               <Typography variant="subtitle2" gutterBottom>
// //                                 Document Sections:
// //                               </Typography>
// //                               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
// //                                 {suggestedSections.map((section, index) => (
// //                                   <Chip
// //                                     key={index}
// //                                     label={section.name}
// //                                     size="small"
// //                                     color={section.required ? "primary" : "default"}
// //                                     variant="outlined"
// //                                   />
// //                                 ))}
// //                               </Box>
// //                             </Box>
// //                           )}

// //                           {suggestedPlaceholders.map((ph, index) => (
// //                             <TextField
// //                               key={ph.key}
// //                               fullWidth
// //                               size="small"
// //                               label={ph.description}
// //                               value={placeholders[ph.key] || ""}
// //                               onChange={(e) => handlePlaceholderChange(ph.key, e.target.value)}
// //                               sx={{ mb: 1 }}
// //                               helperText={`${ph.type} • ${ph.required ? 'Required' : 'Optional'}`}
// //                             />
// //                           ))}
                          
// //                           <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
// //                             <TextField
// //                               fullWidth
// //                               size="small"
// //                               label="Add Custom Field"
// //                               value={placeholderInput}
// //                               onChange={(e) => setPlaceholderInput(e.target.value)}
// //                               placeholder="e.g., company_name"
// //                             />
// //                             <Button 
// //                               variant="outlined" 
// //                               onClick={addCustomPlaceholder}
// //                               disabled={!placeholderInput.trim()}
// //                             >
// //                               Add
// //                             </Button>
// //                           </Box>
// //                         </>
// //                       )}
// //                     </AccordionDetails>
// //                   </Accordion>
// //                 </Grid>

// //                 <Grid item xs={12} md={6}>
// //                   <TextField
// //                     fullWidth
// //                     label="AI Instructions"
// //                     placeholder={`Make it professional, include specific details for ${templateType}...`}
// //                     value={instructions}
// //                     onChange={(e) => setInstructions(e.target.value)}
// //                     multiline
// //                     rows={6}
// //                     sx={{ mb: 2 }}
// //                     helperText="Provide specific details for the AI to include in your document"
// //                   />

// //                   <Accordion sx={{ mb: 2 }}>
// //                     <AccordionSummary expandIcon={<ExpandMore />}>
// //                       <Typography>Document Properties</Typography>
// //                     </AccordionSummary>
// //                     <AccordionDetails>
// //                       {templateProperties.map((prop, index) => (
// //                         <TextField
// //                           key={prop.key}
// //                           fullWidth
// //                           size="small"
// //                           label={prop.description}
// //                           sx={{ mb: 1 }}
// //                           helperText={`Type: ${prop.type} • ${prop.required ? 'Required' : 'Optional'}`}
// //                         />
// //                       ))}
// //                     </AccordionDetails>
// //                   </Accordion>

// //                   <FormControl fullWidth sx={{ mb: 2 }}>
// //                     <InputLabel>Output Format</InputLabel>
// //                     <Select
// //                       value={outputFormat}
// //                       label="Output Format"
// //                       onChange={(e) => setOutputFormat(e.target.value)}
// //                     >
// //                       <MenuItem value="pdf">PDF Document</MenuItem>
// //                       <MenuItem value="docx">Word Document</MenuItem>
// //                       <MenuItem value="txt">Plain Text</MenuItem>
// //                     </Select>
// //                   </FormControl>

// //                   <Button
// //                     variant="contained"
// //                     size="large"
// //                     onClick={generateTemplate}
// //                     disabled={loading || !templateType}
// //                     startIcon={loading ? <CircularProgress size={20} /> : <AutoFixHigh />}
// //                     fullWidth
// //                     sx={{ py: 1.5, mb: 1 }}
// //                   >
// //                     {loading ? `Generating ${templateType}...` : `Generate ${templateType}`}
// //                   </Button>

// //                   <Button
// //                     variant="outlined"
// //                     size="large"
// //                     onClick={fillDocument}
// //                     disabled={!currentTemplateId || !Object.values(placeholders).some(val => val.trim())}
// //                     fullWidth
// //                     sx={{ py: 1.5, mb: 2 }}
// //                   >
// //                     Fill Document with Values
// //                   </Button>

// //                   <LinearProgress 
// //                     variant={loading ? "indeterminate" : "determinate"} 
// //                     value={0}
// //                     sx={{ mb: 2 }}
// //                   />
// //                 </Grid>
// //               </Grid>
// //             </TabPanel>

// //             {/* Tab 2: Visual Builder */}
// //             <TabPanel value={activeTab} index={1}>
// //               <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, minHeight: '600px' }}>
// //                 {/* Canvas Area */}
// //                 <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
// //                   <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
// //                     <Button
// //                       variant="outlined"
// //                       startIcon={<TextFormat />}
// //                       onClick={addTextElement}
// //                       size="small"
// //                     >
// //                       Text
// //                     </Button>
// //                     <Button
// //                       variant="outlined"
// //                       startIcon={<BorderColorIcon />}
// //                       onClick={addSignatureElement}
// //                       size="small"
// //                     >
// //                       Signature
// //                     </Button>
// //                     <Button
// //                       variant="outlined"
// //                       startIcon={<LocationOn />}
// //                       onClick={addAddressElement}
// //                       size="small"
// //                     >
// //                       Address
// //                     </Button>
// //                     <Button
// //                       variant="outlined"
// //                       startIcon={<DateRange />}
// //                       onClick={addDateElement}
// //                       size="small"
// //                     >
// //                       Date
// //                     </Button>
// //                     <Button
// //                       variant="outlined"
// //                       startIcon={<Email />}
// //                       onClick={addEmailElement}
// //                       size="small"
// //                     >
// //                       Email
// //                     </Button>
// //                     <Button
// //                       variant="outlined"
// //                       startIcon={<Phone />}
// //                       onClick={addPhoneElement}
// //                       size="small"
// //                     >
// //                       Phone
// //                     </Button>
// //                     <Button
// //                       variant="contained"
// //                       startIcon={<Save />}
// //                       onClick={handleSaveTemplate}
// //                       size="small"
// //                     >
// //                       Save
// //                     </Button>
// //                     <Button
// //                       variant="outlined"
// //                       startIcon={<Code />}
// //                       onClick={syncToHtmlEditor}
// //                       size="small"
// //                     >
// //                       Sync to HTML
// //                     </Button>
// //                   </Box>

// //                   <DocumentCanvasArea
// //                     width={800}
// //                     height={1000}
// //                     elements={canvasElements}
// //                     onElementUpdate={updateCanvasElement}
// //                     selectedId={selectedElementId}
// //                     onSelect={setSelectedElementId}
// //                     isMobile={isMobile}
// //                     documentType={documentType}
// //                   />
// //                 </Box>

// //                 {/* Element Inspector */}
// //                 {showInspector && (
// //                   <Paper sx={{ width: isMobile ? '100%' : 300, maxHeight: '600px', overflow: 'auto' }}>
// //                     <ElementInspector
// //                       element={selectedElement}
// //                       onUpdate={(updates) => updateCanvasElement(selectedElementId, updates)}
// //                       onDelete={() => deleteCanvasElement(selectedElementId)}
// //                       isMobile={isMobile}
// //                       documentType={documentType}
// //                     />
// //                   </Paper>
// //                 )}
// //               </Box>
// //             </TabPanel>

// //             {/* Tab 3: HTML Editor */}
// //             <TabPanel value={activeTab} index={2}>
// //               <Box sx={{ mb: 2 }}>
// //                 <TextField
// //                   fullWidth
// //                   label="Document Title"
// //                   value={templateName}
// //                   onChange={(e) => setTemplateName(e.target.value)}
// //                   sx={{ mb: 2 }}
// //                 />
                
// //                 <TextField
// //                   fullWidth
// //                   multiline
// //                   rows={isMobile ? 12 : 18}
// //                   value={generatedHtml}
// //                   onChange={(e) => setGeneratedHtml(e.target.value)}
// //                   placeholder="Edit your HTML document template here..."
// //                   sx={{
// //                     '& .MuiOutlinedInput-root': {
// //                       fontFamily: 'monospace',
// //                       fontSize: '14px'
// //                     }
// //                   }}
// //                 />
// //               </Box>

// //               <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
// //                 <Button
// //                   variant="contained"
// //                   startIcon={<Save />}
// //                   onClick={handleSaveTemplate}
// //                 >
// //                   {editMode ? "Update Document" : "Save Document"}
// //                 </Button>
// //                 <Button
// //                   variant="outlined"
// //                   startIcon={<Visibility />}
// //                   onClick={() => setPreviewOpen(true)}
// //                 >
// //                   Preview Document
// //                 </Button>
// //                 <Button
// //                   variant="outlined"
// //                   startIcon={<DesignServices />}
// //                   onClick={() => {
// //                     // Parse HTML back to canvas elements
// //                     const parsedElements = parseHtmlToCanvasElements(generatedHtml);
// //                     if (parsedElements.length > 0) {
// //                       setCanvasElements(parsedElements);
// //                       setActiveTab(1);
// //                       addLog("HTML content converted to visual elements", "success");
// //                     }
// //                   }}
// //                 >
// //                   Sync to Visual Builder
// //                 </Button>
// //               </Box>
// //             </TabPanel>

// //             {/* Tab 4: Export */}
// //             <TabPanel value={activeTab} index={3}>
// //               <Stepper activeStep={2} sx={{ mb: 4 }}>
// //                 <Step><StepLabel>Document Ready</StepLabel></Step>
// //                 <Step><StepLabel>Review</StepLabel></Step>
// //                 <Step><StepLabel>Export</StepLabel></Step>
// //               </Stepper>

// //               <Grid container spacing={2}>
// //                 <Grid item xs={12} md={6}>
// //                   <Card elevation={2}>
// //                     <CardContent>
// //                       <Typography variant="h6" gutterBottom>
// //                         <Build color="primary" sx={{ mr: 1 }} />
// //                         Final Review
// //                       </Typography>
// //                       <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
// //                         Review your document before exporting. Check all details and formatting.
// //                       </Typography>
// //                       <Button
// //                         variant="outlined"
// //                         startIcon={<Visibility />}
// //                         onClick={() => setPreviewOpen(true)}
// //                         fullWidth
// //                       >
// //                         Preview Document
// //                       </Button>
// //                     </CardContent>
// //                   </Card>
// //                 </Grid>

// //                 <Grid item xs={12} md={6}>
// //                   <Card elevation={2}>
// //                     <CardContent>
// //                       <Typography variant="h6" gutterBottom>
// //                         <Download color="primary" sx={{ mr: 1 }} />
// //                         Export Format
// //                       </Typography>
                      
// //                       <FormControl fullWidth sx={{ mb: 2 }}>
// //                         <InputLabel>Output Format</InputLabel>
// //                         <Select
// //                           value={outputFormat}
// //                           label="Output Format"
// //                           onChange={(e) => setOutputFormat(e.target.value)}
// //                         >
// //                           <MenuItem value="pdf">
// //                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                               <PictureAsPdf />
// //                               PDF Document
// //                             </Box>
// //                           </MenuItem>
// //                           <MenuItem value="docx">
// //                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                               <Article />
// //                               Word Document
// //                             </Box>
// //                           </MenuItem>
// //                           <MenuItem value="txt">
// //                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                               <TextFields />
// //                               Plain Text
// //                             </Box>
// //                           </MenuItem>
// //                         </Select>
// //                       </FormControl>

// //                       <Button
// //                         variant="contained"
// //                         startIcon={<Download />}
// //                         onClick={downloadPDF}
// //                         fullWidth
// //                         sx={{ mb: 1 }}
// //                       >
// //                         Download as {outputFormat.toUpperCase()}
// //                       </Button>
// //                     </CardContent>
// //                   </Card>
// //                 </Grid>
// //               </Grid>
// //             </TabPanel>
// //           </Paper>
// //         </Grid>
// //       </Grid>

// //       {/* Signature Modal */}
// //       <SignatureModal
// //         open={signatureModalOpen}
// //         onClose={() => setSignatureModalOpen(false)}
// //         onSave={handleSignatureSave}
// //       />

// //       {/* Preview Dialog */}
// //       <Dialog
// //         open={previewOpen}
// //         onClose={() => setPreviewOpen(false)}
// //         maxWidth="lg"
// //         fullWidth
// //         fullScreen={isMobile}
// //       >
// //         <DialogTitle>
// //           <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
// //             <Typography variant="h6">{templateType} Preview - {templateName}</Typography>
// //             <IconButton onClick={() => setPreviewOpen(false)}>
// //               <Close />
// //             </IconButton>
// //           </Box>
// //         </DialogTitle>
// //         <DialogContent dividers>
// //           <Box id="pdf-template-content" sx={{ p: 2 }}>
// //             <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
// //           </Box>
// //         </DialogContent>
// //         <DialogActions>
// //           <Button onClick={() => setPreviewOpen(false)}>Close</Button>
// //           <Button variant="contained" onClick={handleSaveTemplate}>
// //             Save Document
// //           </Button>
// //           <Button variant="contained" onClick={downloadPDF}>
// //             Download PDF
// //           </Button>
// //         </DialogActions>
// //       </Dialog>

// //       {/* Toast Notification */}
// //       <Snackbar
// //         open={toast.open}
// //         autoHideDuration={4000}
// //         onClose={() => setToast({ ...toast, open: false })}
// //         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
// //       >
// //         <Alert 
// //           severity={toast.type} 
// //           variant="filled"
// //           onClose={() => setToast({ ...toast, open: false })}
// //         >
// //           {toast.message}
// //         </Alert>
// //       </Snackbar>

// //       {/* Floating Action Button for Mobile */}
// //       {isMobile && (
// //         <Fab
// //           color="primary"
// //           sx={{ position: 'fixed', bottom: 16, right: 16 }}
// //           onClick={handleSaveTemplate}
// //         >
// //           <Save />
// //         </Fab>
// //       )}
// //     </Box>
// //   );
// // }

// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   Box, Button, TextField, Typography, Paper, Grid,
//   Card, CardContent, Chip, IconButton, Tooltip,
//   LinearProgress, CircularProgress, Snackbar, Alert,
//   Select, MenuItem, FormControl, InputLabel, Switch,
//   FormControlLabel, Dialog, DialogTitle, DialogContent,
//   DialogActions, Drawer, Divider, List, ListItem,
//   ListItemIcon, ListItemText, Badge
// } from '@mui/material';
// import {
//   PlayArrow as PlayArrowIcon,
//   SmartToy as AiIcon,
//   Code as CodeIcon,
//   Edit as EditIcon,
//   TextFields as TextFieldsIcon,
//   Email as EmailIcon,
//   Today as DateIcon,
//   BorderColor as SignatureIcon,
//   CheckBox as CheckboxIcon,
//   ArrowDropDown as DropdownIcon,
//   DragIndicator as DragIcon,
//   Visibility as PreviewIcon,
//   Save as SaveIcon,
//   Download as DownloadIcon,
//   Add as AddIcon,
//   Delete as DeleteIcon,
//   Settings as SettingsIcon,
//   ContentCopy as CopyIcon,
//   CloudUpload as UploadIcon,
//   History as HistoryIcon,
//   Folder as FolderIcon,
//   CheckCircle as CheckCircleIcon,
//   Error as ErrorIcon,
//   Warning as WarningIcon,
//   Info as InfoIcon,
//   ChevronRight as ChevronRightIcon,
  
//   DarkMode as DarkModeIcon,
//   LightMode as LightModeIcon
// } from '@mui/icons-material';
// import BorderColorIcon from '@mui/icons-material/BorderColor';
// import Description from '@mui/icons-material/Description';
// import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// import { saveAs } from 'file-saver';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
// import axios from 'axios';
// import '../style/AITemplateGenerator.css';

// // ============================================
// // CONSTANTS & UTILITIES
// // ============================================

// const EXAMPLE_PROMPTS = [
//   "Create an employee onboarding form with name, email, address, and signature field",
//   "Generate a rental agreement template with tenant details, property address, and terms",
//   "Design a freelance contract with scope of work, payment terms, and deliverables",
//   "Create an NDA template with confidentiality clauses and signature sections",
//   "Make an invoice template with company details, itemized charges, and totals"
// ];

// const FIELD_TYPES = [
//   { id: 'text', label: 'Text Field', icon: <TextFieldsIcon />, color: '#4CAF50' },
//   { id: 'email', label: 'Email Field', icon: <EmailIcon />, color: '#2196F3' },
//   { id: 'date', label: 'Date Field', icon: <DateIcon />, color: '#FF9800' },
//   { id: 'signature', label: 'Signature', icon: <SignatureIcon />, color: '#F44336' },
//   { id: 'checkbox', label: 'Checkbox', icon: <CheckboxIcon />, color: '#9C27B0' },
//   { id: 'dropdown', label: 'Dropdown', icon: <DropdownIcon />, color: '#00BCD4' }
// ];

// // ============================================
// // COMPONENTS
// // ============================================

// // Typing Animation Component
// const TypingAnimation = ({ text, speed = 30, onComplete }) => {
//   const [displayText, setDisplayText] = useState('');
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isComplete, setIsComplete] = useState(false);

//   useEffect(() => {
//     if (currentIndex < text.length) {
//       const timeout = setTimeout(() => {
//         setDisplayText(prev => prev + text[currentIndex]);
//         setCurrentIndex(prev => prev + 1);
//       }, speed);
      
//       return () => clearTimeout(timeout);
//     } else if (!isComplete) {
//       setIsComplete(true);
//       if (onComplete) onComplete();
//     }
//   }, [currentIndex, text, speed, isComplete, onComplete]);

//   return (
//     <Box className="typing-animation">
//       <pre className="code-block">
//         {displayText}
//         <span className="cursor">|</span>
//       </pre>
//       {!isComplete && (
//         <Typography variant="caption" color="text.secondary" className="typing-indicator">
//           AI is generating your template...
//         </Typography>
//       )}
//     </Box>
//   );
// };

// // Field Component
// const FieldComponent = ({ field, index, onUpdate, onDelete, isSelected, onSelect }) => {
//   const handleChange = (key, value) => {
//     onUpdate({ [field.id]: { ...field, [key]: value } });
//   };

//   return (
//     <Paper
//       className={`field-item ${isSelected ? 'selected' : ''}`}
//       onClick={() => onSelect(field.id)}
//     >
//       <Box className="field-header">
//         <Box className="field-drag-handle">
//           <DragIcon />
//         </Box>
//         <Box className="field-type-icon" style={{ backgroundColor: field.color }}>
//           {FIELD_TYPES.find(f => f.id === field.type)?.icon}
//         </Box>
//         <Typography className="field-label">{field.label}</Typography>
//         <Box className="field-actions">
//           <Tooltip title="Settings">
//             <IconButton size="small" onClick={(e) => { e.stopPropagation(); }}>
//               <SettingsIcon fontSize="small" />
//             </IconButton>
//           </Tooltip>
//           <Tooltip title="Delete">
//             <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(field.id); }}>
//               <DeleteIcon fontSize="small" />
//             </IconButton>
//           </Tooltip>
//         </Box>
//       </Box>
      
//       <Box className="field-content">
//         {field.type === 'text' && (
//           <TextField
//             fullWidth
//             size="small"
//             placeholder={field.placeholder}
//             value={field.value || ''}
//             onChange={(e) => handleChange('value', e.target.value)}
//           />
//         )}
        
//         {field.type === 'email' && (
//           <TextField
//             fullWidth
//             size="small"
//             type="email"
//             placeholder={field.placeholder}
//             value={field.value || ''}
//             onChange={(e) => handleChange('value', e.target.value)}
//           />
//         )}
        
//         {field.type === 'date' && (
//           <TextField
//             fullWidth
//             size="small"
//             type="date"
//             value={field.value || ''}
//             onChange={(e) => handleChange('value', e.target.value)}
//           />
//         )}
        
//         {field.type === 'signature' && (
//           <Box className="signature-pad">
//             {field.value ? (
//               <img src={field.value} alt="Signature" className="signature-image" />
//             ) : (
//               <Button size="small" variant="outlined" startIcon={<BorderColorIcon />}>
//                 Sign Here
//               </Button>
//             )}
//           </Box>
//         )}
        
//         {field.type === 'checkbox' && (
//           <FormControlLabel
//             control={
//               <Switch
//                 checked={field.value || false}
//                 onChange={(e) => handleChange('value', e.target.checked)}
//               />
//             }
//             label={field.placeholder}
//           />
//         )}
        
//         {field.type === 'dropdown' && (
//           <Select
//             fullWidth
//             size="small"
//             value={field.value || ''}
//             onChange={(e) => handleChange('value', e.target.value)}
//           >
//             {field.options?.map((option, idx) => (
//               <MenuItem key={idx} value={option}>{option}</MenuItem>
//             ))}
//           </Select>
//         )}
//       </Box>
      
//       <Box className="field-properties">
//         <Chip size="small" label={`X: ${field.x}%`} />
//         <Chip size="small" label={`Y: ${field.y}%`} />
//         <Chip size="small" label={`${field.width}×${field.height}`} />
//         {field.required && <Chip size="small" label="Required" color="primary" />}
//       </Box>
//     </Paper>
//   );
// };

// // Field Inspector Sidebar
// const FieldInspector = ({ field, onUpdate }) => {
//   const [inspectorData, setInspectorData] = useState(field);

//   useEffect(() => {
//     setInspectorData(field);
//   }, [field]);

//   const handleChange = (key, value) => {
//     const updated = { ...inspectorData, [key]: value };
//     setInspectorData(updated);
//     onUpdate(updated);
//   };

//   if (!field) {
//     return (
//       <Box className="inspector-empty">
//         <Typography color="text.secondary">Select a field to edit its properties</Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box className="field-inspector">
//       <Typography variant="h6" gutterBottom>Field Properties</Typography>
      
//       <TextField
//         fullWidth
//         label="Label"
//         value={inspectorData.label || ''}
//         onChange={(e) => handleChange('label', e.target.value)}
//         margin="normal"
//         size="small"
//       />
      
//       <TextField
//         fullWidth
//         label="Placeholder"
//         value={inspectorData.placeholder || ''}
//         onChange={(e) => handleChange('placeholder', e.target.value)}
//         margin="normal"
//         size="small"
//       />
      
//       <FormControl fullWidth margin="normal" size="small">
//         <InputLabel>Field Type</InputLabel>
//         <Select
//           value={inspectorData.type}
//           label="Field Type"
//           onChange={(e) => handleChange('type', e.target.value)}
//         >
//           {FIELD_TYPES.map(type => (
//             <MenuItem key={type.id} value={type.id}>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <Box sx={{ color: type.color }}>{type.icon}</Box>
//                 {type.label}
//               </Box>
//             </MenuItem>
//           ))}
//         </Select>
//       </FormControl>
      
//       <FormControlLabel
//         control={
//           <Switch
//             checked={inspectorData.required || false}
//             onChange={(e) => handleChange('required', e.target.checked)}
//           />
//         }
//         label="Required Field"
//         sx={{ mt: 2 }}
//       />
      
//       {inspectorData.type === 'dropdown' && (
//         <TextField
//           fullWidth
//           label="Options (comma separated)"
//           value={inspectorData.options?.join(', ') || ''}
//           onChange={(e) => handleChange('options', e.target.value.split(',').map(o => o.trim()))}
//           margin="normal"
//           size="small"
//           helperText="Enter options separated by commas"
//         />
//       )}
      
//       <Box sx={{ mt: 3 }}>
//         <Typography variant="subtitle2" gutterBottom>Position & Size</Typography>
//         <Grid container spacing={2}>
//           <Grid item xs={6}>
//             <TextField
//               fullWidth
//               type="number"
//               label="X Position (%)"
//               value={inspectorData.x || 0}
//               onChange={(e) => handleChange('x', parseInt(e.target.value))}
//               size="small"
//               InputProps={{ inputProps: { min: 0, max: 100 } }}
//             />
//           </Grid>
//           <Grid item xs={6}>
//             <TextField
//               fullWidth
//               type="number"
//               label="Y Position (%)"
//               value={inspectorData.y || 0}
//               onChange={(e) => handleChange('y', parseInt(e.target.value))}
//               size="small"
//               InputProps={{ inputProps: { min: 0, max: 100 } }}
//             />
//           </Grid>
//           <Grid item xs={6}>
//             <TextField
//               fullWidth
//               type="number"
//               label="Width (%)"
//               value={inspectorData.width || 20}
//               onChange={(e) => handleChange('width', parseInt(e.target.value))}
//               size="small"
//               InputProps={{ inputProps: { min: 5, max: 100 } }}
//             />
//           </Grid>
//           <Grid item xs={6}>
//             <TextField
//               fullWidth
//               type="number"
//               label="Height (px)"
//               value={inspectorData.height || 40}
//               onChange={(e) => handleChange('height', parseInt(e.target.value))}
//               size="small"
//               InputProps={{ inputProps: { min: 20, max: 200 } }}
//             />
//           </Grid>
//         </Grid>
//       </Box>
      
//       <Box sx={{ mt: 3 }}>
//         <Typography variant="subtitle2" gutterBottom>Validation</Typography>
//         <TextField
//           fullWidth
//           label="Regex Pattern"
//           value={inspectorData.pattern || ''}
//           onChange={(e) => handleChange('pattern', e.target.value)}
//           size="small"
//           placeholder="e.g., ^[A-Za-z]+$"
//           helperText="Optional regex validation"
//         />
//       </Box>
//     </Box>
//   );
// };

// // ============================================
// // MAIN COMPONENT
// // ============================================

// const AITemplateGenerator = () => {
//   // State
//   const [prompt, setPrompt] = useState('');
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [generationStage, setGenerationStage] = useState('idle'); // idle, typing, complete, editor
//   const [generatedCode, setGeneratedCode] = useState('');
//   const [fields, setFields] = useState([]);
//   const [selectedFieldId, setSelectedFieldId] = useState(null);
//   const [isPreviewMode, setIsPreviewMode] = useState(false);
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
//   const [templateName, setTemplateName] = useState('Untitled Template');
//   const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
//   const [savedTemplates, setSavedTemplates] = useState([]);
//   const [isDarkMode, setIsDarkMode] = useState(false);

//   // Refs
//   const previewRef = useRef(null);
//   const typingContainerRef = useRef(null);

//   // Example: Load saved templates from localStorage
//   useEffect(() => {
//     const saved = localStorage.getItem('signapp_templates');
//     if (saved) {
//       try {
//         setSavedTemplates(JSON.parse(saved));
//       } catch (e) {
//         console.error('Error loading templates:', e);
//       }
//     }
//   }, []);

//   // Save templates to localStorage
//   useEffect(() => {
//     if (savedTemplates.length > 0) {
//       localStorage.setItem('signapp_templates', JSON.stringify(savedTemplates));
//     }
//   }, [savedTemplates]);

//   // Handle prompt generation
//   const handleGenerate = async () => {
//     if (!prompt.trim()) {
//       showSnackbar('Please enter a prompt', 'warning');
//       return;
//     }

//     setIsGenerating(true);
//     setGenerationStage('typing');
    
//     try {
//       // Simulate API call
//       const mockCode = generateMockTemplate(prompt);
//       setGeneratedCode(mockCode);
      
//       // Start typing animation
//       setTimeout(() => {
//         setGenerationStage('complete');
//         // Auto-extract fields from generated code
//         const extractedFields = extractFieldsFromCode(mockCode);
//         setFields(extractedFields);
//       }, mockCode.length * 30 + 1000); // Simulate typing time
      
//     } catch (error) {
//       showSnackbar('Error generating template', 'error');
//       setIsGenerating(false);
//       setGenerationStage('idle');
//     }
//   };

//   // Handle field updates
//   const handleFieldUpdate = (updates) => {
//     setFields(prev => prev.map(field => 
//       field.id === Object.keys(updates)[0] ? updates[field.id] : field
//     ));
//   };

//   const handleFieldDelete = (fieldId) => {
//     setFields(prev => prev.filter(f => f.id !== fieldId));
//     if (selectedFieldId === fieldId) {
//       setSelectedFieldId(null);
//     }
//   };

//   const handleAddField = (fieldType) => {
//     const fieldTypeData = FIELD_TYPES.find(f => f.id === fieldType);
//     const newField = {
//       id: `field_${Date.now()}`,
//       type: fieldType,
//       label: `New ${fieldTypeData?.label || 'Field'}`,
//       placeholder: `Enter ${fieldType}`,
//       x: 10,
//       y: fields.length * 10 + 10,
//       width: 20,
//       height: 40,
//       required: false,
//       value: '',
//       color: fieldTypeData?.color || '#666'
//     };
//     setFields([...fields, newField]);
//     setSelectedFieldId(newField.id);
//   };

//   const handleDragEnd = (result) => {
//     if (!result.destination) return;
    
//     const reorderedFields = Array.from(fields);
//     const [removed] = reorderedFields.splice(result.source.index, 1);
//     reorderedFields.splice(result.destination.index, 0, removed);
    
//     // Update positions based on new order
//     const updatedFields = reorderedFields.map((field, index) => ({
//       ...field,
//       y: index * 10 + 10
//     }));
    
//     setFields(updatedFields);
//   };

//   // Save template
//   const handleSaveTemplate = () => {
//     const template = {
//       id: `template_${Date.now()}`,
//       name: templateName,
//       prompt: prompt,
//       fields: fields,
//       html: generatedCode,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };
    
//     const updatedTemplates = [template, ...savedTemplates.filter(t => t.id !== template.id)];
//     setSavedTemplates(updatedTemplates);
//     showSnackbar('Template saved successfully', 'success');
//   };

//   // Download as PDF
//   const handleDownloadPDF = async () => {
//     if (!previewRef.current) return;
    
//     try {
//       const canvas = await html2canvas(previewRef.current);
//       const imgData = canvas.toDataURL('image/png');
//       const pdf = new jsPDF('p', 'mm', 'a4');
//       const imgWidth = 210;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
//       pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
//       pdf.save(`${templateName}.pdf`);
//       showSnackbar('PDF downloaded successfully', 'success');
//     } catch (error) {
//       showSnackbar('Error generating PDF', 'error');
//     }
//   };

//   // Download as HTML
//   const handleDownloadHTML = () => {
//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>${templateName}</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 40px; }
//           .field { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
//           .required::after { content: " *"; color: red; }
//         </style>
//       </head>
//       <body>
//         <h1>${templateName}</h1>
//         ${fields.map(field => `
//           <div class="field">
//             <label class="${field.required ? 'required' : ''}">${field.label}</label>
//             ${renderFieldToHTML(field)}
//           </div>
//         `).join('')}
//       </body>
//       </html>
//     `;
    
//     const blob = new Blob([htmlContent], { type: 'text/html' });
//     saveAs(blob, `${templateName}.html`);
//     showSnackbar('HTML downloaded successfully', 'success');
//   };

//   // Load template from library
//   const handleLoadTemplate = (template) => {
//     setTemplateName(template.name);
//     setPrompt(template.prompt);
//     setFields(template.fields);
//     setGeneratedCode(template.html);
//     setGenerationStage('editor');
//     setShowTemplateLibrary(false);
//     showSnackbar('Template loaded', 'info');
//   };

//   // Helper functions
//   const generateMockTemplate = (promptText) => {
//     return `<!-- Generated by SignApp AI Template Generator -->
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Generated Document Template</title>
//     <style>
//         body {
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
//             max-width: 800px;
//             margin: 0 auto;
//             padding: 40px;
//             line-height: 1.6;
//             color: #333;
//             background: #f8f9fa;
//         }
//         .document-container {
//             background: white;
//             border-radius: 12px;
//             padding: 40px;
//             box-shadow: 0 4px 20px rgba(0,0,0,0.08);
//             position: relative;
//         }
//         .header {
//             text-align: center;
//             margin-bottom: 40px;
//             padding-bottom: 20px;
//             border-bottom: 2px solid #e9ecef;
//         }
//         .field-group {
//             margin: 30px 0;
//         }
//         .field-label {
//             font-weight: 600;
//             margin-bottom: 8px;
//             color: #495057;
//         }
//         .field-input {
//             width: 100%;
//             padding: 12px 16px;
//             border: 1.5px solid #dee2e6;
//             border-radius: 8px;
//             font-size: 16px;
//             transition: border-color 0.2s;
//         }
//         .field-input:focus {
//             outline: none;
//             border-color: #4dabf7;
//             box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.1);
//         }
//         .signature-area {
//             border: 2px dashed #adb5bd;
//             border-radius: 8px;
//             padding: 30px;
//             text-align: center;
//             margin: 40px 0;
//             min-height: 120px;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             background: #f8f9fa;
//         }
//         .footer {
//             margin-top: 60px;
//             padding-top: 20px;
//             border-top: 1px solid #e9ecef;
//             text-align: center;
//             color: #6c757d;
//             font-size: 14px;
//         }
//     </style>
// </head>
// <body>
//     <div class="document-container">
//         <div class="header">
//             <h1 style="color: #2b8a3e; margin: 0 0 10px 0;">${promptText.split(' ').slice(0, 3).join(' ')}</h1>
//             <p style="color: #868e96; margin: 0;">AI-Generated Document Template</p>
//         </div>
        
//         <div class="field-group">
//             <div class="field-label">Document Title</div>
//             <input type="text" class="field-input" placeholder="Enter document title">
//         </div>
        
//         <!-- Generated fields based on prompt -->
//         ${promptText.toLowerCase().includes('name') ? `
//         <div class="field-group">
//             <div class="field-label">Full Name</div>
//             <input type="text" class="field-input" placeholder="Enter your full name" required>
//         </div>
//         ` : ''}
        
//         ${promptText.toLowerCase().includes('email') ? `
//         <div class="field-group">
//             <div class="field-label">Email Address</div>
//             <input type="email" class="field-input" placeholder="Enter your email address" required>
//         </div>
//         ` : ''}
        
//         ${promptText.toLowerCase().includes('address') ? `
//         <div class="field-group">
//             <div class="field-label">Address</div>
//             <textarea class="field-input" placeholder="Enter your address" rows="3"></textarea>
//         </div>
//         ` : ''}
        
//         ${promptText.toLowerCase().includes('signature') ? `
//         <div class="field-group">
//             <div class="field-label">Signature</div>
//             <div class="signature-area">
//                 <p style="color: #868e96; margin: 0;">Click to sign or draw your signature</p>
//             </div>
//         </div>
//         ` : ''}
        
//         <div class="footer">
//             <p>Generated on ${new Date().toLocaleDateString()} | SignApp AI Template Generator</p>
//         </div>
//     </div>
// </body>
// </html>`;
//   };

//   const extractFieldsFromCode = (code) => {
//     const extracted = [];
//     let fieldIndex = 0;
    
//     if (code.includes('Full Name')) {
//       extracted.push({
//         id: `field_${fieldIndex++}`,
//         type: 'text',
//         label: 'Full Name',
//         placeholder: 'Enter your full name',
//         x: 10,
//         y: 20,
//         width: 80,
//         height: 40,
//         required: true,
//         value: '',
//         color: '#4CAF50'
//       });
//     }
    
//     if (code.includes('Email Address')) {
//       extracted.push({
//         id: `field_${fieldIndex++}`,
//         type: 'email',
//         label: 'Email Address',
//         placeholder: 'Enter your email address',
//         x: 10,
//         y: 70,
//         width: 80,
//         height: 40,
//         required: true,
//         value: '',
//         color: '#2196F3'
//       });
//     }
    
//     if (code.includes('Address')) {
//       extracted.push({
//         id: `field_${fieldIndex++}`,
//         type: 'text',
//         label: 'Address',
//         placeholder: 'Enter your address',
//         x: 10,
//         y: 120,
//         width: 80,
//         height: 80,
//         required: false,
//         value: '',
//         color: '#9C27B0'
//       });
//     }
    
//     if (code.includes('Signature')) {
//       extracted.push({
//         id: `field_${fieldIndex++}`,
//         type: 'signature',
//         label: 'Signature',
//         placeholder: 'Sign here',
//         x: 10,
//         y: 210,
//         width: 80,
//         height: 100,
//         required: true,
//         value: '',
//         color: '#F44336'
//       });
//     }
    
//     return extracted;
//   };

//   const renderFieldToHTML = (field) => {
//     switch (field.type) {
//       case 'text':
//         return `<input type="text" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>`;
//       case 'email':
//         return `<input type="email" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>`;
//       case 'date':
//         return `<input type="date" ${field.required ? 'required' : ''}>`;
//       case 'checkbox':
//         return `<input type="checkbox"> ${field.placeholder}`;
//       case 'dropdown':
//         return `<select ${field.required ? 'required' : ''}>
//           ${field.options?.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
//         </select>`;
//       case 'signature':
//         return `<div class="signature-canvas" style="border: 1px solid #ccc; height: ${field.height}px;"></div>`;
//       default:
//         return `<input type="text" placeholder="${field.placeholder}">`;
//     }
//   };

//   const showSnackbar = (message, severity) => {
//     setSnackbar({ open: true, message, severity });
//   };

//   const selectedField = fields.find(f => f.id === selectedFieldId);

//   return (
//     <Box className={`ai-template-generator ${isDarkMode ? 'dark-mode' : ''}`}>
//       {/* Header */}
//       <Box className="header">
//         <Box className="header-content">
//           <Box className="header-left">
//             <AiIcon className="header-icon" />
//             <Typography variant="h5" className="header-title">
//               AI Document Template Generator
//             </Typography>
//           </Box>
//           <Box className="header-right">
//             <Tooltip title="Template Library">
//               <IconButton onClick={() => setShowTemplateLibrary(true)}>
//                 <FolderIcon />
//                 {savedTemplates.length > 0 && (
//                   <Badge badgeContent={savedTemplates.length} color="primary" />
//                 )}
//               </IconButton>
//             </Tooltip>
//             <Tooltip title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
//               <IconButton onClick={() => setIsDarkMode(!isDarkMode)}>
//                 {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
//               </IconButton>
//             </Tooltip>
//           </Box>
//         </Box>
//       </Box>

//       <Box className="main-container">
//         {/* Left Panel - Prompt Input */}
//         <Paper className="left-panel" elevation={0}>
//           <Typography variant="h6" className="panel-title">
//             <AiIcon className="panel-icon" /> AI Prompt
//           </Typography>
          
//           <TextField
//             fullWidth
//             multiline
//             rows={6}
//             placeholder="Describe the template you want to create...
// Example: 'Create an employee onboarding form with name, email, address, and signature field'"
//             value={prompt}
//             onChange={(e) => setPrompt(e.target.value)}
//             className="prompt-input"
//             InputProps={{
//               style: { fontSize: '14px', lineHeight: '1.6' }
//             }}
//           />
          
//           <Box className="example-prompts">
//             <Typography variant="caption" color="text.secondary" gutterBottom>
//               Try these examples:
//             </Typography>
//             <Box className="prompt-chips">
//               {EXAMPLE_PROMPTS.map((example, idx) => (
//                 <Chip
//                   key={idx}
//                   label={example}
//                   size="small"
//                   onClick={() => setPrompt(example)}
//                   className="prompt-chip"
//                 />
//               ))}
//             </Box>
//           </Box>
          
//           <Button
//             variant="contained"
//             fullWidth
//             startIcon={<PlayArrowIcon />}
//             onClick={handleGenerate}
//             disabled={isGenerating || !prompt.trim()}
//             className="generate-btn"
//             size="large"
//           >
//             {isGenerating ? 'Generating...' : 'Generate Template'}
//           </Button>
          
//           <TextField
//             fullWidth
//             label="Template Name"
//             value={templateName}
//             onChange={(e) => setTemplateName(e.target.value)}
//             margin="normal"
//             size="small"
//           />
//         </Paper>

//         {/* Right Panel - Dynamic Content */}
//         <Box className="right-panel">
//           {generationStage === 'idle' && (
//             <Paper className="welcome-card" elevation={0}>
//               <AiIcon className="welcome-icon" />
//               <Typography variant="h6" gutterBottom>
//                 Welcome to AI Template Generator
//               </Typography>
//               <Typography color="text.secondary" align="center">
//                 Enter a prompt on the left to generate a document template.
//                 The AI will create HTML code and extract editable fields for you.
//               </Typography>
//             </Paper>
//           )}
          
//           {generationStage === 'typing' && (
//             <Paper className="typing-container" elevation={0}>
//               <Box className="typing-header">
//                 <CodeIcon className="code-icon" />
//                 <Typography variant="h6">AI is generating your template...</Typography>
//               </Box>
//               <TypingAnimation
//                 text={generatedCode}
//                 speed={10}
//                 onComplete={() => {
//                   setTimeout(() => setGenerationStage('complete'), 1000);
//                 }}
//               />
//             </Paper>
//           )}
          
//           {generationStage === 'complete' && (
//             <Paper className="transition-card" elevation={0}>
//               <CheckCircleIcon className="success-icon" />
//               <Typography variant="h6" gutterBottom>
//                 Template Generated Successfully!
//               </Typography>
//               <Typography color="text.secondary" gutterBottom>
//                 Extracted {fields.length} editable fields from the generated template.
//               </Typography>
//               <Button
//                 variant="contained"
//                 startIcon={<EditIcon />}
//                 onClick={() => setGenerationStage('editor')}
//                 className="edit-btn"
//               >
//                 Open Template Editor
//               </Button>
//             </Paper>
//           )}
          
//           {generationStage === 'editor' && (
//             <Box className="editor-container">
//               {/* Editor Header */}
//               <Paper className="editor-header" elevation={1}>
//                 <Box className="editor-header-content">
//                   <Box className="editor-title">
//                     <Typography variant="h6">Template Editor</Typography>
//                     <Chip label={`${fields.length} fields`} size="small" color="primary" />
//                   </Box>
//                   <Box className="editor-actions">
//                     <FormControlLabel
//                       control={
//                         <Switch
//                           checked={isPreviewMode}
//                           onChange={(e) => setIsPreviewMode(e.target.checked)}
//                         />
//                       }
//                       label="Preview Mode"
//                     />
//                     <Tooltip title="Save Template">
//                       <IconButton onClick={handleSaveTemplate}>
//                         <SaveIcon />
//                       </IconButton>
//                     </Tooltip>
//                     <Tooltip title="Download as PDF">
//                       <IconButton onClick={handleDownloadPDF}>
//                         <DownloadIcon />
//                       </IconButton>
//                     </Tooltip>
//                     <Tooltip title="Download as HTML">
//                       <IconButton onClick={handleDownloadHTML}>
//                         <CodeIcon />
//                       </IconButton>
//                     </Tooltip>
//                   </Box>
//                 </Box>
//               </Paper>
              
//               {/* Editor Body */}
//               <Grid container spacing={2} className="editor-body">
//                 {/* Fields Palette */}
//                 <Grid item xs={12} md={3}>
//                   <Paper className="fields-palette" elevation={0}>
//                     <Typography variant="subtitle1" gutterBottom>
//                       Add Fields
//                     </Typography>
//                     <Box className="field-types-grid">
//                       {FIELD_TYPES.map(fieldType => (
//                         <Tooltip key={fieldType.id} title={fieldType.label}>
//                           <Paper
//                             className="field-type-card"
//                             onClick={() => handleAddField(fieldType.id)}
//                           >
//                             <Box className="field-type-icon" style={{ color: fieldType.color }}>
//                               {fieldType.icon}
//                             </Box>
//                             <Typography variant="caption" className="field-type-label">
//                               {fieldType.label}
//                             </Typography>
//                           </Paper>
//                         </Tooltip>
//                       ))}
//                     </Box>
                    
//                     <Divider sx={{ my: 2 }} />
                    
//                     <Typography variant="subtitle1" gutterBottom>
//                       Fields List ({fields.length})
//                     </Typography>
//                     {fields.length === 0 ? (
//                       <Typography color="text.secondary" variant="body2" align="center">
//                         No fields added yet
//                       </Typography>
//                     ) : (
//                       <DragDropContext onDragEnd={handleDragEnd}>
//                         <Droppable droppableId="fields-list">
//                           {(provided) => (
//                             <List
//                               ref={provided.innerRef}
//                               {...provided.droppableProps}
//                               dense
//                             >
//                               {fields.map((field, index) => (
//                                 <Draggable
//                                   key={field.id}
//                                   draggableId={field.id}
//                                   index={index}
//                                 >
//                                   {(provided) => (
//                                     <ListItem
//                                       ref={provided.innerRef}
//                                       {...provided.draggableProps}
//                                       {...provided.dragHandleProps}
//                                       className={`field-list-item ${selectedFieldId === field.id ? 'selected' : ''}`}
//                                       onClick={() => setSelectedFieldId(field.id)}
//                                       secondaryAction={
//                                         <IconButton
//                                           edge="end"
//                                           size="small"
//                                           onClick={(e) => {
//                                             e.stopPropagation();
//                                             handleFieldDelete(field.id);
//                                           }}
//                                         >
//                                           <DeleteIcon fontSize="small" />
//                                         </IconButton>
//                                       }
//                                     >
//                                       <ListItemIcon>
//                                         <DragIcon />
//                                       </ListItemIcon>
//                                       <ListItemText
//                                         primary={field.label}
//                                         secondary={field.type}
//                                       />
//                                     </ListItem>
//                                   )}
//                                 </Draggable>
//                               ))}
//                               {provided.placeholder}
//                             </List>
//                           )}
//                         </Droppable>
//                       </DragDropContext>
//                     )}
//                   </Paper>
//                 </Grid>
                
//                 {/* Preview Canvas */}
//                 <Grid item xs={12} md={6}>
//                   <Paper className="preview-canvas" elevation={0}>
//                     <Box className="preview-header">
//                       <Typography variant="subtitle1">Template Preview</Typography>
//                       <Chip label={templateName} size="small" />
//                     </Box>
                    
//                     <Box
//                       ref={previewRef}
//                       className="template-preview"
//                       style={{ pointerEvents: isPreviewMode ? 'none' : 'auto' }}
//                     >
//                       {/* Render preview based on fields */}
//                       <Box className="document-preview">
//                         <Box className="preview-header-area">
//                           <Typography variant="h4" className="preview-title">
//                             {templateName}
//                           </Typography>
//                           <Typography color="text.secondary" variant="body2">
//                             Generated by SignApp AI Template Generator
//                           </Typography>
//                         </Box>
                        
//                         {fields.map(field => (
//                           <Box
//                             key={field.id}
//                             className="preview-field"
//                             style={{
//                               position: 'absolute',
//                               left: `${field.x}%`,
//                               top: `${field.y}px`,
//                               width: `${field.width}%`,
//                               height: `${field.height}px`,
//                               border: selectedFieldId === field.id ? '2px solid #1976d2' : '1px solid #ddd',
//                               backgroundColor: selectedFieldId === field.id ? 'rgba(25, 118, 210, 0.05)' : 'white'
//                             }}
//                             onClick={() => setSelectedFieldId(field.id)}
//                           >
//                             <Typography variant="caption" className="field-preview-label">
//                               {field.label}
//                               {field.required && <span className="required-star"> *</span>}
//                             </Typography>
//                             {renderFieldPreview(field)}
//                           </Box>
//                         ))}
//                       </Box>
//                     </Box>
//                   </Paper>
//                 </Grid>
                
//                 {/* Field Inspector */}
//                 <Grid item xs={12} md={3}>
//                   <Paper className="inspector-panel" elevation={0}>
//                     <FieldInspector
//                       field={selectedField}
//                       onUpdate={handleFieldUpdate}
//                     />
//                   </Paper>
//                 </Grid>
//               </Grid>
//             </Box>
//           )}
//         </Box>
//       </Box>

//       {/* Template Library Drawer */}
//       <Drawer
//         anchor="right"
//         open={showTemplateLibrary}
//         onClose={() => setShowTemplateLibrary(false)}
//       >
//         <Box className="library-drawer" sx={{ width: 350 }}>
//           <DialogTitle>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <FolderIcon />
//               <Typography variant="h6">Template Library</Typography>
//               <Chip label={savedTemplates.length} size="small" color="primary" />
//             </Box>
//           </DialogTitle>
//           <DialogContent>
//             {savedTemplates.length === 0 ? (
//               <Box sx={{ textAlign: 'center', py: 4 }}>
//                 <FolderIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
//                 <Typography color="text.secondary">No saved templates yet</Typography>
//               </Box>
//             ) : (
//               <List>
//                 {savedTemplates.map(template => (
//                   <ListItem
//                     key={template.id}
//                     className="library-item"
//                     onClick={() => handleLoadTemplate(template)}
//                     secondaryAction={
//                       <IconButton edge="end" size="small">
//                         <ChevronRightIcon />
//                       </IconButton>
//                     }
//                   >
//                     <ListItemIcon>
//                       <Description />
//                     </ListItemIcon>
//                     <ListItemText
//                       primary={template.name}
//                       secondary={
//                         <>
//                           <Typography variant="caption" display="block">
//                             {new Date(template.createdAt).toLocaleDateString()}
//                           </Typography>
//                           <Typography variant="caption" display="block">
//                             {template.fields?.length || 0} fields
//                           </Typography>
//                         </>
//                       }
//                     />
//                   </ListItem>
//                 ))}
//               </List>
//             )}
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setShowTemplateLibrary(false)}>Close</Button>
//           </DialogActions>
//         </Box>
//       </Drawer>

//       {/* Snackbar */}
//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={4000}
//         onClose={() => setSnackbar({ ...snackbar, open: false })}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//       >
//         <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// const renderFieldPreview = (field) => {
//   switch (field.type) {
//     case 'text':
//     case 'email':
//       return (
//         <input
//           type={field.type}
//           placeholder={field.placeholder}
//           className="preview-input"
//           readOnly
//         />
//       );
//     case 'date':
//       return <input type="date" className="preview-input" readOnly />;
//     case 'checkbox':
//       return (
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <input type="checkbox" readOnly />
//           <Typography variant="caption" sx={{ ml: 1 }}>{field.placeholder}</Typography>
//         </Box>
//       );
//     case 'dropdown':
//       return (
//         <select className="preview-select" disabled>
//           <option>{field.placeholder}</option>
//         </select>
//       );
//     case 'signature':
//       return (
//         <Box className="preview-signature">
//           <SignatureIcon />
//           <Typography variant="caption">Signature Area</Typography>
//         </Box>
//       );
//     default:
//       return <input type="text" className="preview-input" readOnly />;
//   }
// };

// export default AITemplateGenerator;
