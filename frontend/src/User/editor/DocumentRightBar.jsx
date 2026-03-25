import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Chip,
  Avatar,
  IconButton,
  Button,
  Divider,
  FormControlLabel,
  Checkbox,
  Slider,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Badge
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  DragIndicator as DragIndicatorIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PersonAdd as PersonAddIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { FIELD_TYPES, FIELD_ROLES, getRecipientColor, validateFieldAssignment, ROLE_FIELD_RULES } from '../../config/fieldConfig';

const FieldPropertiesPanel = ({ 
  field, 
  onChange, 
  onDelete, 
  onDuplicate,
  recipients = [], 
  numPages = 1,
  onSelectRecipient
}) => {
  const [localField, setLocalField] = useState(field || {});
  const [validationError, setValidationError] = useState('');
  const [fieldSettings, setFieldSettings] = useState({
    groupName: field?.group_name || `group_${Date.now()}`,
    dropdownOptions: field?.dropdown_options || [],
    newOption: '',
    placeholder: field?.placeholder || '',
    required: field?.required || false,
    label: field?.label || '',
    emailValidation: field?.email_validation !== false,
    fontSize: field?.font_size || 12,
    checked: field?.checked || false
  });

  useEffect(() => {
    if (field) {
      setLocalField({ ...field });
      validateAssignment(field.recipient_id, field.type);
      
      setFieldSettings({
        groupName: field.group_name || `group_${Date.now()}`,
        dropdownOptions: field.dropdown_options || [],
        newOption: '',
        placeholder: field.placeholder || '',
        required: field.required || false,
        label: field.label || '',
        emailValidation: field.email_validation !== false,
        fontSize: field.font_size || 12,
        checked: field.checked || false
      });
    }
  }, [field]);

  const validateAssignment = (recipientId, fieldType) => {
    if (!recipientId) {
      setValidationError('');
      return true;
    }

    const recipient = recipients.find(r => r.id === recipientId);
    if (!recipient) {
      setValidationError('Recipient not found');
      return false;
    }
    
    const isValid = validateFieldAssignment(fieldType, recipient.role);
    if (!isValid) {
      setValidationError(
        `${FIELD_ROLES[recipient.role]?.name} cannot have ${FIELD_TYPES[fieldType]?.label}`
      );
    } else {
      setValidationError('');
    }
    
    return isValid;
  };

  const handleChange = (key, value) => {
    const updated = { ...localField, [key]: value };
    setLocalField(updated);
    
    if (key === 'recipient_id' || key === 'type') {
      validateAssignment(
        key === 'recipient_id' ? value : updated.recipient_id,
        key === 'type' ? value : updated.type
      );
    }
    
    if (onChange) {
      onChange(field.id, updated);
    }
  };

  const handleSettingChange = (setting, value) => {
    const newSettings = { ...fieldSettings, [setting]: value };
    setFieldSettings(newSettings);
    
    const fieldUpdate = {};
    switch (setting) {
      case 'groupName':
        fieldUpdate.group_name = value;
        break;
      case 'dropdownOptions':
        fieldUpdate.dropdown_options = value;
        break;
      case 'placeholder':
        fieldUpdate.placeholder = value;
        break;
      case 'required':
        fieldUpdate.required = Boolean(value);
        break;
      case 'label':
        fieldUpdate.label = value;
        break;
      case 'emailValidation':
        fieldUpdate.email_validation = Boolean(value);
        break;
      case 'fontSize':
        fieldUpdate.font_size = Number(value);
        break;
      case 'checked':
        fieldUpdate.checked = Boolean(value);
        break;
      default:
        return;
    }
    
    handleChange(Object.keys(fieldUpdate)[0], Object.values(fieldUpdate)[0]);
  };

  const handleAddDropdownOption = () => {
    if (fieldSettings.newOption.trim() === '') return;
    const newOptions = [...fieldSettings.dropdownOptions, fieldSettings.newOption.trim()];
    handleSettingChange('dropdownOptions', newOptions);
    handleSettingChange('newOption', '');
  };

  const handleRemoveDropdownOption = (index) => {
    const newOptions = fieldSettings.dropdownOptions.filter((_, i) => i !== index);
    handleSettingChange('dropdownOptions', newOptions);
  };

  if (!field) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        <EditIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
        <Typography variant="body2">
          Select a field to edit properties
        </Typography>
      </Box>
    );
  }

  const fieldType = FIELD_TYPES[field.type] || FIELD_TYPES.textbox;
  const currentRecipient = recipients.find(r => r.id === localField.recipient_id);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Avatar sx={{ bgcolor: fieldType.color, width: 32, height: 32 }}>
          {fieldType.icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {field.label || fieldType.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fieldType.label}
          </Typography>
        </Box>
      </Box>

      {/* Validation Alert */}
      {validationError && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
          {validationError}
        </Alert>
      )}

      {/* Field Label */}
      <TextField
        fullWidth
        size="small"
        label="Field Label"
        value={fieldSettings.label}
        onChange={(e) => handleSettingChange('label', e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Field-Specific Settings */}
      {(field.type === 'radio' || field.type === 'dropdown' || 
        field.type === 'mail' || field.type === 'checkbox') && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: fieldType.color 
          }}>
            <SettingsIcon fontSize="small" />
            {fieldType.label} Settings
          </Typography>

          {field.type === 'radio' && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Group Name"
                value={fieldSettings.groupName}
                onChange={(e) => handleSettingChange('groupName', e.target.value)}
                helperText="Radio buttons with same group are mutually exclusive"
                sx={{ mb: 1.5 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={fieldSettings.checked}
                    onChange={(e) => handleSettingChange('checked', e.target.checked)}
                  />
                }
                label="Initially checked"
              />
            </Box>
          )}

          {field.type === 'dropdown' && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add option..."
                  value={fieldSettings.newOption}
                  onChange={(e) => handleSettingChange('newOption', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDropdownOption()}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleAddDropdownOption}
                  disabled={!fieldSettings.newOption.trim()}
                >
                  Add
                </Button>
              </Box>

              {fieldSettings.dropdownOptions.length > 0 ? (
                <Paper variant="outlined" sx={{ maxHeight: 150, overflow: 'auto', mb: 1.5 }}>
                  <List dense>
                    {fieldSettings.dropdownOptions.map((option, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton edge="end" size="small" onClick={() => handleRemoveDropdownOption(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <DragIndicatorIcon sx={{ color: 'action.active' }} />
                        </ListItemIcon>
                        <ListItemText primary={option} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ) : (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  Add at least one option
                </Alert>
              )}
            </Box>
          )}

          {field.type === 'mail' && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Placeholder Email"
                value={fieldSettings.placeholder}
                onChange={(e) => handleSettingChange('placeholder', e.target.value)}
                placeholder="example@domain.com"
                sx={{ mb: 1.5 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={fieldSettings.emailValidation}
                    onChange={(e) => handleSettingChange('emailValidation', e.target.checked)}
                  />
                }
                label="Validate email format"
              />
            </Box>
          )}

          {field.type === 'checkbox' && (
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={fieldSettings.checked}
                    onChange={(e) => handleSettingChange('checked', e.target.checked)}
                  />
                }
                label="Initially checked"
              />
            </Box>
          )}

          {(field.type === 'textbox' || field.type === 'date') && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Placeholder"
                value={fieldSettings.placeholder}
                onChange={(e) => handleSettingChange('placeholder', e.target.value)}
                placeholder={field.type === 'date' ? "MM/DD/YYYY" : "Enter text..."}
              />
            </Box>
          )}

          {(field.type === 'textbox' || field.type === 'date' || 
            field.type === 'mail' || field.type === 'dropdown') && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Font Size
              </Typography>
              <Slider
                size="small"
                value={fieldSettings.fontSize}
                onChange={(_, value) => handleSettingChange('fontSize', value)}
                min={8}
                max={24}
                step={1}
                valueLabelDisplay="auto"
              />
            </Box>
          )}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Position & Size */}
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Position & Size
      </Typography>

      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="X"
            value={localField.x || 0}
            onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Y"
            value={localField.y || 0}
            onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Width"
            value={localField.width || fieldType.defaultWidth}
            onChange={(e) => handleChange('width', parseInt(e.target.value) || fieldType.defaultWidth)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Height"
            value={localField.height || fieldType.defaultHeight}
            onChange={(e) => handleChange('height', parseInt(e.target.value) || fieldType.defaultHeight)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            select
            fullWidth
            size="small"
            label="Page"
            value={localField.page || 0}
            onChange={(e) => handleChange('page', parseInt(e.target.value))}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <MenuItem key={i} value={i}>
                Page {i + 1}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Required Field */}
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={fieldSettings.required}
            onChange={(e) => handleSettingChange('required', e.target.checked)}
          />
        }
        label="Required Field"
        sx={{ mb: 2 }}
      />

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(field.id)}
        >
          Delete
        </Button>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => onDuplicate(field.id)}
        >
          Duplicate
        </Button>
      </Box>

      {/* Recipient Info */}
      {currentRecipient && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Assigned to:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ 
              width: 24, 
              height: 24,
              bgcolor: getRecipientColor(currentRecipient),
              fontSize: '0.75rem'
            }}>
              {currentRecipient.name?.charAt(0)}
            </Avatar>
            <Typography variant="body2" noWrap>
              {currentRecipient.name}
            </Typography>
            <Chip
              label={FIELD_ROLES[currentRecipient.role]?.name}
              size="small"
              sx={{ 
                height: 20,
                fontSize: '0.65rem',
                backgroundColor: `${getRecipientColor(currentRecipient)}20`,
                color: getRecipientColor(currentRecipient)
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

const RecipientsPanel = ({ recipients = [], fields = [], onAddRecipientClick, getFieldValidationError }) => {
  const getRecipientStats = (recipientId) => {
    const assignedFields = fields.filter(f => f.recipient_id === recipientId);
    const invalidFields = assignedFields.filter(f => getFieldValidationError(f));
    
    return {
      total: assignedFields.length,
      invalid: invalidFields.length
    };
  };

  if (recipients.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <PersonIcon sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary" gutterBottom>
          No recipients
        </Typography>
        <Button
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={onAddRecipientClick}
        >
          Add Recipient
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Recipients ({recipients.length})
      </Typography>
      
      <List dense>
        {recipients.map((recipient) => {
          const stats = getRecipientStats(recipient.id);
          const recipientColor = getRecipientColor(recipient);
          
          return (
            <Card key={recipient.id} variant="outlined" sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar sx={{ 
                    bgcolor: recipientColor, 
                    width: 28, 
                    height: 28,
                    fontSize: '0.75rem'
                  }}>
                    {recipient.name?.charAt(0) || 'R'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">
                      {recipient.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {recipient.email}
                    </Typography>
                  </Box>
                  <Chip
                    label={FIELD_ROLES[recipient.role]?.name}
                    size="small"
                    sx={{
                      backgroundColor: `${recipientColor}20`,
                      color: recipientColor,
                      height: 20,
                      fontSize: '0.65rem'
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Badge badgeContent={stats.total} color="primary" showZero>
                    <Typography variant="caption" color="text.secondary">
                      Fields
                    </Typography>
                  </Badge>
                  
                  {stats.invalid > 0 && (
                    <Tooltip title={`${stats.invalid} incompatible fields`}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />
                        <Typography variant="caption" color="error">
                          {stats.invalid}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Allowed: {(() => {
                    const rules = ROLE_FIELD_RULES[recipient.role];
                    if (rules === 'ALL') return 'All fields';
                    if (Array.isArray(rules)) {
                      return rules.map(f => FIELD_TYPES[f]?.label).filter(Boolean).join(', ') || 'None';
                    }
                    return 'None';
                  })()}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </List>
    </Box>
  );
};

const DocumentRightBar = ({
  expanded,
  selectedField,
  recipients,
  onFieldChange,
  onFieldDelete,
  onFieldDuplicate,
  numPages,
  selectedRecipientId,
  onSelectRecipient,
  fields,
  onAddRecipientClick
}) => {
  const getFieldValidationError = (field) => {
    if (!field || !field.recipient_id) return false;
    const recipient = recipients.find(r => r.id === field.recipient_id);
    if (!recipient) return true;
    return !validateFieldAssignment(field.type, recipient.role);
  };

  return (
    <Box sx={{ 
      width: expanded ? 360 : 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      overflow: 'hidden',
      transition: 'width 0.3s ease',
      opacity: expanded ? 1 : 0,
      visibility: expanded ? 'visible' : 'hidden'
    }}>
      {/* Properties Panel */}
      <Paper sx={{ 
        flex: 1,
        borderRadius: 2,
        overflow: 'auto',
        '&::-webkit-scrollbar': { display: 'none' }
      }}>
        <FieldPropertiesPanel
          field={selectedField}
          recipients={recipients}
          onChange={onFieldChange}
          onDelete={onFieldDelete}
          onDuplicate={onFieldDuplicate}
          numPages={numPages}
        />
      </Paper>

      {/* Recipients Panel */}
      <Paper sx={{ 
        height: '40%',
        minHeight: 200,
        borderRadius: 2,
        overflow: 'auto',
        '&::-webkit-scrollbar': { display: 'none' }
      }}>
        <RecipientsPanel
          recipients={recipients}
          fields={fields}
          onAddRecipientClick={onAddRecipientClick}
          getFieldValidationError={getFieldValidationError}
        />
      </Paper>
    </Box>
  );
};

export default DocumentRightBar;