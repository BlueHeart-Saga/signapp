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
  MenuItem,
  Alert,
  Avatar,
  Paper,
  Chip,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Info as InfoIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { FIELD_ROLES, FIELD_TYPES, ROLE_FIELD_RULES, getRecipientColor } from '../../../config/fieldConfig';

const AddRecipientDialog = ({ 
  open, 
  onClose, 
  onAddRecipient, 
  existingRecipients = [],
  documentId,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    email: '',
    signing_order: 1,
    role: 'signer',
    form_fields: [],
    witness_for: ''
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!recipientForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!recipientForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(recipientForm.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (existingRecipients.some(r => r.email.toLowerCase() === recipientForm.email.toLowerCase())) {
      newErrors.email = 'This email is already added';
    }
    
    if (recipientForm.role === 'witness' && !recipientForm.witness_for) {
      newErrors.witness_for = 'Please select a signer to witness';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecipientForm(prev => ({
      ...prev,
      [name]: name === 'signing_order' ? parseInt(value) || 1 : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onAddRecipient(recipientForm);
      
      setRecipientForm({
        name: '',
        email: '',
        signing_order: existingRecipients.length + 1,
        role: 'signer',
        form_fields: [],
        witness_for: ''
      });
      setErrors({});
      
      onClose();
      
    } catch (error) {
      console.error('Error adding recipient:', error);
      setErrors({ submit: error.message || 'Failed to add recipient' });
    } finally {
      setLoading(false);
    }
  };

  const getSigners = () => {
    return existingRecipients.filter(r => 
      r.role === 'signer' || r.role === 'in_person_signer'
    );
  };

  const signers = getSigners();

  const getRolePermissions = (role) => {
    const rules = ROLE_FIELD_RULES[role];
    if (rules === 'ALL') return 'All field types';
    if (Array.isArray(rules)) {
      return rules.map(f => FIELD_TYPES[f]?.label).filter(Boolean).join(', ') || 'None';
    }
    return 'None';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon />
          Add New Recipient
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.submit}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Basic Information
            </Typography>
            
            <TextField
              fullWidth
              label="Full Name *"
              name="name"
              value={recipientForm.name}
              onChange={handleInputChange}
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
              sx={{ mb: 2.5 }}
            />
            
            <TextField
              fullWidth
              label="Email Address *"
              name="email"
              type="email"
              value={recipientForm.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              sx={{ mb: 2.5 }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Role & Settings
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
              <TextField
                select
                fullWidth
                label="Role *"
                name="role"
                value={recipientForm.role}
                onChange={handleInputChange}
                disabled={loading}
              >
                {Object.values(FIELD_ROLES).map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: '#666', fontSize: '0.75rem' }}>
                        {role.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{role.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {role.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                label="Order"
                name="signing_order"
                type="number"
                value={recipientForm.signing_order}
                onChange={handleInputChange}
                disabled={loading}
                inputProps={{ min: 1, max: 100 }}
                sx={{ width: 100 }}
              />
            </Box>
          </Box>

          {recipientForm.role === 'witness' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Witness Assignment
              </Typography>
              
              <TextField
                select
                fullWidth
                label="Witness For *"
                name="witness_for"
                value={recipientForm.witness_for}
                onChange={handleInputChange}
                error={!!errors.witness_for}
                helperText={errors.witness_for || "Select which signer this witness will observe"}
                disabled={loading || signers.length === 0}
              >
                <MenuItem value="">
                  <em>Select a signer</em>
                </MenuItem>
                {signers.map((signer) => (
                  <MenuItem key={signer.id} value={signer.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ 
                        width: 24, 
                        height: 24,
                        bgcolor: getRecipientColor(signer)
                      }}>
                        {signer.name?.charAt(0) || 'S'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{signer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {signer.email}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
              
              {signers.length === 0 && (
                <Alert severity="info" sx={{ mt: 1.5 }}>
                  Add a signer first to assign a witness
                </Alert>
              )}
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Role Permissions
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <InfoIcon sx={{ color: 'primary.main', mt: 0.25 }} />
                <Box>
                  <Typography variant="body2" fontWeight={500} gutterBottom>
                    {FIELD_ROLES[recipientForm.role]?.name} Permissions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {FIELD_ROLES[recipientForm.role]?.description}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    Allowed fields: {getRolePermissions(recipientForm.role)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || disabled}
            startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {loading ? 'Adding...' : 'Add Recipient'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddRecipientDialog;