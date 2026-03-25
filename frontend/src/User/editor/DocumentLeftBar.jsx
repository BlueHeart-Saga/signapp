import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Chip,
  Avatar,
  IconButton,
  Card,
  Tooltip,
  InputAdornment,
  Button,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Search as SearchIcon,
  DragIndicator as DragIndicatorIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  PersonAdd as PersonAddIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { FIELD_TYPES, FIELD_ROLES, getRecipientColor, ROLE_FIELD_RULES } from '../../config/fieldConfig';

// Professional field cards with clean names
const FIELD_CARDS = [
  { type: 'signature', label: 'Signature', color: '#E74C3C' },
  { type: 'initials', label: 'Initial', color: '#3498DB' },
  { type: 'date', label: 'Date', color: '#F39C12' },
  { type: 'textbox', label: 'Text', color: '#2ECC71' },
  { type: 'stamp', label: 'Stamp', color: '#E67E22' },
  { type: 'mail', label: 'Email', color: '#1ABC9C' },
//   { type: 'company', label: 'Company', color: '#9B59B6' },
//   { type: 'job_title', label: 'Job title', color: '#34495E' },
//   { type: 'full_name', label: 'Full name', color: '#E67E22' },
  { type: 'dropdown', label: 'Dropdown', color: '#16A085' },
//   { type: 'image', label: 'Image', color: '#8E44AD' },
  { type: 'checkbox', label: 'Checkbox', color: '#27AE60' },
  { type: 'radio', label: 'Radio', color: '#D35400' },
  { type: 'attachment', label: 'Attachment', color: '#7F8C8D' },
  { type: 'approval', label: 'Approval', color: '#2C3E50' },
  { type: 'witness_signature', label: 'Witness', color: '#C0392B' }
];

// Group fields by category
const FIELD_CATEGORIES = {
  signature: { name: 'Signature Fields', fields: ['signature', 'initials', 'stamp', 'witness_signature'] },
  form: { name: 'Form Fields', fields: ['date', 'textbox', 'mail','approval', 'company', 'job_title', 'full_name', 'dropdown', 'image', 'checkbox', 'radio', 'attachment'] }
};

const DocumentLeftBar = ({ 
  onAddField, 
  recipients = [], 
  selectedRecipientId, 
  onSelectRecipient,
  onAddRecipientClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRoles, setExpandedRoles] = useState({});

  // Handle drag start
  const handleDragStart = (e, fieldType, fieldLabel, fieldColor) => {
    e.dataTransfer.setData('text/plain', fieldType);
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      type: fieldType,
      label: fieldLabel,
      color: fieldColor,
      source: 'field-library'
    }));
    
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create custom drag preview
    const dragPreview = document.createElement('div');
    dragPreview.innerHTML = `
      <div style="
        padding: 8px 16px;
        background: ${fieldColor};
        color: white;
        border-radius: 4px;
        font-family: 'Roboto', sans-serif;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      ">
        Add ${fieldLabel}
      </div>
    `;
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-100px';
    dragPreview.style.left = '-100px';
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 10, 10);
    setTimeout(() => document.body.removeChild(dragPreview), 0);
  };

  // Filter fields based on recipient role
  const getAvailableFieldsForRole = (role) => {
    if (role === 'viewer') return [];
    
    const rules = ROLE_FIELD_RULES[role];
    if (rules === 'ALL') {
      return FIELD_CARDS;
    }
    if (Array.isArray(rules)) {
      return FIELD_CARDS.filter(card => rules.includes(card.type));
    }
    return [];
  };

  const selectedRecipient = useMemo(() => {
    return recipients.find(r => r.id === selectedRecipientId);
  }, [recipients, selectedRecipientId]);

  const availableFields = useMemo(() => {
    if (!selectedRecipient) {
      // Return all fields grouped by category
      const signatureFields = FIELD_CARDS.filter(card => 
        FIELD_CATEGORIES.signature.fields.includes(card.type)
      );
      const formFields = FIELD_CARDS.filter(card => 
        FIELD_CATEGORIES.form.fields.includes(card.type)
      );
      return {
        signature: signatureFields,
        form: formFields
      };
    }
    
    // Filter by role when recipient selected
    const roleFields = getAvailableFieldsForRole(selectedRecipient.role);
    return {
      signature: roleFields.filter(card => 
        FIELD_CATEGORIES.signature.fields.includes(card.type)
      ),
      form: roleFields.filter(card => 
        FIELD_CATEGORIES.form.fields.includes(card.type)
      )
    };
  }, [selectedRecipient]);

  // Group recipients by role
  const recipientsByRole = useMemo(() => {
    const groups = {};
    recipients.forEach(recipient => {
      if (!groups[recipient.role]) {
        groups[recipient.role] = [];
      }
      groups[recipient.role].push(recipient);
    });
    
    const roleOrder = ['signer', 'in_person_signer', 'approver', 'form_filler', 'witness', 'viewer'];
    const sortedGroups = {};
    roleOrder.forEach(role => {
      if (groups[role]) {
        sortedGroups[role] = groups[role];
      }
    });
    
    Object.keys(groups).forEach(role => {
      if (!sortedGroups[role]) {
        sortedGroups[role] = groups[role];
      }
    });
    
    return sortedGroups;
  }, [recipients]);

  // Filter recipients by search
  const filteredRecipients = useMemo(() => {
    if (!searchTerm) return recipients;
    return recipients.filter(recipient => 
      recipient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      FIELD_ROLES[recipient.role]?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipients, searchTerm]);

  const toggleRoleExpansion = (role) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  return (
    <Paper sx={{ 
      width: 280,
      height: '100%',
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: '1px solid',
      borderColor: '#e0e0e0',
      mr: 2,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      {/* <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid',
        borderColor: '#e0e0e0',
        bgcolor: '#ffffff'
      }}>
        <Typography variant="h6" fontWeight={500} sx={{ fontSize: '1rem', color: '#1a1a1a', mb: 1.5 }}>
          Fields
        </Typography>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Search fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: '#757575' }} />
              </InputAdornment>
            ),
            sx: { 
              borderRadius: 1,
              bgcolor: '#f5f5f5',
              border: '1px solid transparent',
              '&:hover': { 
                bgcolor: '#eeeeee'
              },
              '& .MuiInputBase-input': {
                fontSize: '0.875rem',
                py: 0.75
              }
            }
          }}
        />
      </Box> */}

      {/* Recipient Selection */}
      <Box sx={{ 
        p: 2,
        borderBottom: '1px solid',
        borderColor: '#e0e0e0',
        bgcolor: '#fafafa',
        
      }}>
        <Typography variant="subtitle2" fontWeight={500} sx={{ fontSize: '0.75rem', color: '#757575', mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Assign to
        </Typography>

        {selectedRecipient ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            p: 1,
            bgcolor: '#ffffff',
            borderRadius: 1,
            border: '1px solid',
            borderColor: getRecipientColor(selectedRecipient),
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            
          }}>
            <Avatar sx={{ 
              bgcolor: getRecipientColor(selectedRecipient), 
              width: 36,
  height: 36,
  fontSize: '0.9rem',
              fontWeight: 500
            }}>
              {selectedRecipient.name?.charAt(0) || 'R'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.9125rem' }}>
                {selectedRecipient.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.8rem' }}>
                {selectedRecipient.email}
              </Typography>
            </Box>
            <Chip
              label={FIELD_ROLES[selectedRecipient.role]?.name}
              size="small"
              sx={{ 
                height: 20,
                fontSize: '0.6rem',
                fontWeight: 500,
                bgcolor: `${getRecipientColor(selectedRecipient)}15`,
                color: getRecipientColor(selectedRecipient),
                border: 'none'
              }}
            />
            <IconButton 
              size="small" 
              onClick={() => onSelectRecipient(null)}
              sx={{ p: 0.5 }}
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              bgcolor: '#ffffff',
              borderRadius: 1,
              border: '1px dashed',
              borderColor: '#bdbdbd',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#1976d2',
                bgcolor: '#f5f9ff'
              }
            }}
            onClick={() => document.getElementById('recipient-search')?.focus()}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
              Select recipient
            </Typography>
            <PersonAddIcon sx={{ fontSize: 16, color: '#1976d2' }} />
          </Box>
        )}
      </Box>

      {/* Recipients List */}
      <Box sx={{ 
        height: '40%',
  overflow: 'auto',
        px: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: '#e0e0e0',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        bgcolor: '#ffffff'
      }}>
        {Object.entries(recipientsByRole).map(([role, roleRecipients]) => {
          const roleInfo = FIELD_ROLES[role];
          const filtered = roleRecipients.filter(r => 
            filteredRecipients.some(fr => fr.id === r.id)
          );
          
          if (filtered.length === 0) return null;
          
          const isExpanded = expandedRoles[role] !== false;
          
          return (
            <Box key={role} sx={{ mb: 1 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 0.75,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
                onClick={() => toggleRoleExpansion(role)}
              >
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  bgcolor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#666' }}>
                    {roleInfo?.name.charAt(0)}
                  </Typography>
                </Box>
                <Typography variant="caption" fontWeight={500} sx={{ flex: 1, fontSize: '0.75rem' }}>
                  {roleInfo?.name} ({filtered.length})
                </Typography>
                {isExpanded ? 
                  <ChevronLeftIcon sx={{ transform: 'rotate(-90deg)', fontSize: 14 }} /> : 
                  <ChevronRightIcon sx={{ transform: 'rotate(90deg)', fontSize: 14 }} />
                }
              </Box>
              
              {isExpanded && (
                <Box sx={{ pl: 3 }}>
                  
                   
<Box sx={{
  height: '40%',
  overflow: 'auto',
  // px: 2,
  py: 1,
  borderBottom: '1px solid',
  borderColor: '#e0e0e0',
  bgcolor: '#ffffff'
}}>

{filtered.map((recipient) => {

  const isSelected = selectedRecipientId === recipient.id;
  const color = getRecipientColor(recipient);

  return (
    <Box
      key={recipient.id}
      onClick={() => onSelectRecipient(recipient.id)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1,
        borderRadius: 1,
        cursor: 'pointer',
        bgcolor: isSelected ? `${color}10` : 'transparent',
        transition: '0.2s',
        '&:hover': {
          bgcolor: isSelected ? `${color}20` : '#f5f5f5'
        }
      }}
    >

      <Avatar sx={{
        width: 28,
        height: 28,
        fontSize: '0.75rem',
        bgcolor: color
      }}>
        {recipient.name?.charAt(0)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }} noWrap>
          {recipient.name}
        </Typography>

        <Typography sx={{ fontSize: '0.72rem', color: '#777' }} noWrap>
          {recipient.email}
        </Typography>
      </Box>

      <Chip
        label={FIELD_ROLES[recipient.role]?.name}
        size="small"
        sx={{
          height: 22,
          fontSize: '0.65rem',
          bgcolor: `${color}15`,
          color: color
        }}
      />

    </Box>
  );

})}

</Box>

                    
                
                </Box>
              )}
            </Box>
          );
        })}

        {!selectedRecipient && (
  <Box
    sx={{
      p: 1.5,
      mb: 1,
      bgcolor: '#fff8e1',
      border: '1px solid #ffe082',
      borderRadius: 1,
      fontSize: '12px',
      color: '#8d6e63',
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}
  >
    <InfoIcon sx={{ fontSize: 16 }} />
    Select a recipient first to enable fields
  </Box>
)}
      </Box>

      {/* Field Categories */}
      <Box sx={{ 
        height: '60%',
        flex: 1,
        overflow: 'auto',
        p: 2,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        bgcolor: '#fafafa'
      }}>
        {/* Signature Fields */}
        {availableFields.signature?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#757575',
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Signature Fields
            </Typography>
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1
            }}>
              {availableFields.signature.map((field) => {
                const recipientColor = selectedRecipient ? getRecipientColor(selectedRecipient) : field.color;
                const bgOpacity = selectedRecipient ? 0.08 : 0.03;
                
                return (
                    <Tooltip
  title={!selectedRecipient ? "Please select a recipient first" : ""}
  arrow
>    
             <Card
  key={field.type}
  draggable={!!selectedRecipient}
  onDragStart={
    selectedRecipient
      ? (e) => handleDragStart(e, field.type, field.label, recipientColor)
      : undefined
  }
                    sx={{
                      cursor: selectedRecipient ? 'grab' : 'not-allowed',
                      border: '1px solid',
                      borderColor: selectedRecipient ? recipientColor : '#e0e0e0',
                      borderRadius: 1,
                      transition: 'all 0.2s',
                      bgcolor: selectedRecipient ? `${recipientColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}` : '#ffffff',
                      boxShadow: 'none',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        borderColor: recipientColor,
                        boxShadow: `0 2px 4px ${recipientColor}20`,
                        bgcolor: selectedRecipient ? `${recipientColor}15` : '#f8f8f8'
                      },
                      '&:active': {
                         cursor: selectedRecipient ? 'default' : 'grabbing',
                        transform: 'scale(0.98)'
                      }
                    }}
                  >
                    <Box sx={{ 
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 400,
                          fontSize: '0.8125rem',
                          color: selectedRecipient ? recipientColor : '#1a1a1a'
                        }}
                      >
                        {field.label}
                      </Typography>
                      <DragIndicatorIcon sx={{ 
                        fontSize: 14, 
                        color: selectedRecipient ? recipientColor : '#bdbdbd',
                        opacity: 0.5
                      }} />
                    </Box>
                  </Card>

                  </Tooltip>
 
                );
              })}
            </Box>
          </Box>
        )}

        {/* Form Fields */}
        {availableFields.form?.length > 0 && (
          <Box>
            {/* <Typography 
              variant="subtitle2" 
              sx={{ 
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#757575',
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Form Fields
            </Typography> */}
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1
            }}>
              {availableFields.form.map((field) => {
                const recipientColor = selectedRecipient ? getRecipientColor(selectedRecipient) : field.color;
                const bgOpacity = selectedRecipient ? 0.08 : 0.03;
                
                return (
                    <Tooltip
  title={!selectedRecipient ? "Please select a recipient first" : ""}
  arrow
>
                  <Card
  key={field.type}
  draggable={!!selectedRecipient}
  onDragStart={
    selectedRecipient
      ? (e) => handleDragStart(e, field.type, field.label, recipientColor)
      : undefined
  }
                    sx={{
                      cursor: selectedRecipient ? 'grab' : 'not-allowed',
                      border: '1px solid',
                      borderColor: selectedRecipient ? recipientColor : '#e0e0e0',
                      borderRadius: 1,
                      transition: 'all 0.2s',
                      bgcolor: selectedRecipient ? `${recipientColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}` : '#ffffff',
                      boxShadow: 'none',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        borderColor: recipientColor,
                        boxShadow: `0 2px 4px ${recipientColor}20`,
                        bgcolor: selectedRecipient ? `${recipientColor}15` : '#f8f8f8'
                      },
                      '&:active': {
                        cursor: selectedRecipient ? 'default' : 'grabbing',
                        transform: 'scale(0.98)'
                      }
                    }}
                  >
                    <Box sx={{ 
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 400,
                          fontSize: '0.8125rem',
                          color: selectedRecipient ? recipientColor : '#1a1a1a'
                        }}
                      >
                        {field.label}
                      </Typography>
                      <DragIndicatorIcon sx={{ 
                        fontSize: 14, 
                        color: selectedRecipient ? recipientColor : '#bdbdbd',
                        opacity: 0.5
                      }} />
                    </Box>
                  </Card>

                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        )}

        {/* No fields message */}
        {(!availableFields.signature?.length && !availableFields.form?.length) && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            px: 2,
            color: '#999'
          }}>
            <InfoIcon sx={{ fontSize: 28, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
              No fields available
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              Select a recipient with permissions
            </Typography>
          </Box>
        )}
      </Box>

      {/* Add Recipient Button */}
      <Box sx={{ 
        p: 2,
        borderTop: '1px solid',
        borderColor: '#e0e0e0',
        bgcolor: '#ffffff'
      }}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={onAddRecipientClick}
          sx={{
            borderRadius: 1,
            borderColor: '#1976d2',
            color: '#1976d2',
            fontSize: '0.8125rem',
            py: 0.75,
            '&:hover': {
              borderColor: '#1565C0',
              bgcolor: '#f5f9ff'
            }
          }}
        >
          Add Recipient
        </Button>
      </Box>
    </Paper>
  );
};

export default DocumentLeftBar;