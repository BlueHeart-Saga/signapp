import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Card,
  Tooltip,
  Button,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  DragIndicator as DragIndicatorIcon,
  PersonAdd as PersonAddIcon,
  Info as InfoIcon,
  Create as SignatureIcon,
  DriveFileRenameOutline as InitialIcon,
  CalendarToday as DateIcon,
  TextFields as TextIcon,
  Stars as StampIcon,
  Email as EmailIcon,
  ArrowDropDown as DropdownIcon,
  CheckBox as CheckboxIcon,
  RadioButtonChecked as RadioIcon,
  AttachFile as AttachmentIcon,
  Apartment as CompanyIcon,
  Badge as JobTitleIcon,
  AccountCircle as FullNameIcon,
  Image as ImageIcon,
  TaskAlt as ApprovalIcon,
  Group as WitnessIcon
} from '@mui/icons-material';
import { FIELD_TYPES, FIELD_ROLES, getRecipientColor, ROLE_FIELD_RULES } from '../../config/fieldConfig';

// Field icon mapping for Zoho-like look
const FIELD_ICONS = {
  signature: <SignatureIcon sx={{ fontSize: 18 }} />,
  initials: <InitialIcon sx={{ fontSize: 18 }} />,
  date: <DateIcon sx={{ fontSize: 18 }} />,
  textbox: <TextIcon sx={{ fontSize: 18 }} />,
  stamp: <StampIcon sx={{ fontSize: 18 }} />,
  mail: <EmailIcon sx={{ fontSize: 18 }} />,
  company: <CompanyIcon sx={{ fontSize: 18 }} />,
  job_title: <JobTitleIcon sx={{ fontSize: 18 }} />,
  full_name: <FullNameIcon sx={{ fontSize: 18 }} />,
  dropdown: <DropdownIcon sx={{ fontSize: 18 }} />,
  image: <ImageIcon sx={{ fontSize: 18 }} />,
  checkbox: <CheckboxIcon sx={{ fontSize: 18 }} />,
  radio: <RadioIcon sx={{ fontSize: 18 }} />,
  attachment: <AttachmentIcon sx={{ fontSize: 18 }} />,
  approval: <ApprovalIcon sx={{ fontSize: 18 }} />,
  witness_signature: <WitnessIcon sx={{ fontSize: 18 }} />
};

const FIELD_CARDS = [
  { type: 'signature', label: 'Signature', color: '#E74C3C' },
  { type: 'initials', label: 'Initial', color: '#3498DB' },
  { type: 'stamp', label: 'Stamp', color: '#E67E22' },
  // { type: 'image', label: 'Image', color: '#9B59B6' },
  // { type: 'company', label: 'Company', color: '#34495E' },
  // { type: 'full_name', label: 'Full name', color: '#16A085' },
  { type: 'mail', label: 'Email', color: '#1ABC9C' },
  { type: 'approval', label: 'Approval', color: '#2C3E50' },
  { type: 'date', label: 'Date', color: '#F39C12' },
  { type: 'textbox', label: 'Text', color: '#2ECC71' },
  // { type: 'job_title', label: 'Job title', color: '#7F8C8D' },
  { type: 'checkbox', label: 'Checkbox', color: '#d35400' },
  { type: 'dropdown', label: 'Dropdown', color: '#8e44ad' },
  { type: 'radio', label: 'Radio', color: '#27ae60' },
  { type: 'witness_signature', label: 'Witness', color: '#c0392b' },
  { type: 'attachment', label: 'Attachment', color: '#2980b9' }
];

const FIELD_CATEGORIES = {
  signature: { name: 'Signature Fields', fields: ['signature', 'initials', 'stamp', 'witness_signature'] },
  form: { name: 'Form Fields', fields: ['date', 'textbox', 'mail', 'approval', 'company', 'job_title', 'full_name', 'dropdown', 'image', 'checkbox', 'radio', 'attachment'] }
};

const DocumentLeftBar = ({
  onAddField,
  recipients = [],
  selectedRecipientId,
  onSelectRecipient,
  onAddRecipientClick,
  zoomLevel = 1.0
}) => {
  const handleDragStart = (e, fieldType, fieldLabel, fieldColor) => {
    e.dataTransfer.setData('text/plain', fieldType);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: fieldType,
      label: fieldLabel,
      color: fieldColor,
      source: 'field-library'
    }));
    e.dataTransfer.effectAllowed = 'copy';

    const getDisplayText = (type, label) => {
      switch (type) {
        case 'signature': return 'SIGNATURE';
        case 'initials': return 'INI';
        case 'date': return 'DATE';
        case 'textbox': return 'TEXT';
        case 'checkbox': return '✓';
        case 'radio': return '○';
        case 'dropdown': return '▼';
        default: return label.toUpperCase();
      }
    };

    const displayText = getDisplayText(fieldType, fieldLabel);
    const fieldTypeData = FIELD_TYPES[fieldType] || FIELD_TYPES.textbox;
    const baseWidth = fieldTypeData.defaultWidth || 160;
    const baseHeight = fieldTypeData.defaultHeight || 32;

    // Create a high-fidelity drag preview container
    const dragPreview = document.createElement('div');
    dragPreview.id = 'drag-preview';

    // We need more height to accommodate the label
    const combinedHeight = (baseHeight + 25) * zoomLevel;

    dragPreview.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      width: ${baseWidth * zoomLevel}px;
      height: ${combinedHeight}px;
      pointer-events: none;
      z-index: -1000;
      display: flex;
      flex-direction: column;
      font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    `;

    const bgColor = fieldColor.startsWith('hsl')
      ? fieldColor.replace('hsl', 'hsla').replace(')', ', 0.12)')
      : (fieldColor.startsWith('#') ? fieldColor + '12' : 'rgba(13, 148, 136, 0.12)');

    dragPreview.innerHTML = `
      <div style="
        font-size: ${10 * zoomLevel}px;
        font-weight: 800;
        color: ${fieldColor};
        text-transform: uppercase;
        margin-bottom: ${4 * zoomLevel}px;
        letter-spacing: ${0.5 * zoomLevel}px;
        padding-left: ${2 * zoomLevel}px;
      ">
        ${(selectedRecipient?.name || 'RECIPIENT').toUpperCase()}
      </div>
      <div style="
        flex: 1;
        background: ${bgColor};
        border: ${1.8 * zoomLevel}px solid ${fieldColor};
        border-radius: ${8 * zoomLevel}px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #344054;
        font-size: ${Math.min(11 * zoomLevel, (baseWidth * zoomLevel) / 6)}px;
        font-weight: 800;
        box-shadow: 0 8px 24px -6px rgba(0,0,0,0.15);
      ">
        ${displayText}
      </div>
    `;

    document.body.appendChild(dragPreview);

    // Position drag image relative to mouse cursor
    // Offset the Y to center the field box part on the cursor
    e.dataTransfer.setDragImage(dragPreview, (baseWidth * zoomLevel) / 2, (combinedHeight) / 1.5);

    setTimeout(() => {
      if (document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview);
      }
    }, 0);
  };

  const getAvailableFieldsForRole = (role) => {
    if (role === 'viewer') return [];
    const rules = ROLE_FIELD_RULES[role];
    if (rules === 'ALL') return FIELD_CARDS;
    if (Array.isArray(rules)) return FIELD_CARDS.filter(card => rules.includes(card.type));
    return [];
  };

  const selectedRecipient = useMemo(() => recipients.find(r => r.id === selectedRecipientId), [recipients, selectedRecipientId]);

  const availableFieldsList = useMemo(() => {
    if (!selectedRecipient) return FIELD_CARDS;
    return getAvailableFieldsForRole(selectedRecipient.role);
  }, [selectedRecipient]);

  return (
    <Paper sx={{
      width: 300,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#ffffff',
      borderRight: '1px solid #e0e0e0',
      boxShadow: 'none'
    }}>
      {/* Recipients Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} color="#444">
          Recipients
        </Typography>
      </Box>

      {/* Recipients Content */}
      <Box sx={{
        height: '40%',
        minHeight: 220,
        maxHeight: 260,
        overflowY: 'auto',
        borderBottom: '1px solid #f1f5f9',
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: '10px' },
        '&:hover::-webkit-scrollbar-thumb': { background: '#cbd5e1' }
      }}>
        {[...recipients].sort((a, b) => (a.signing_order || 0) - (b.signing_order || 0)).map((recipient) => {
          const isSelected = selectedRecipientId === recipient.id;
          const recipientColor = getRecipientColor(recipient);
          const roleName = FIELD_ROLES[recipient.role]?.name || recipient.role;

          return (
            <Box
              key={recipient.id}
              onClick={() => onSelectRecipient(recipient.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                bgcolor: isSelected ? '#f0fdfa' : 'transparent',
                borderLeft: isSelected ? '4px solid #0d9488' : '4px solid transparent',
                '&:hover': {
                  bgcolor: isSelected ? '#f0fdfa' : '#f9f9f9'
                }
              }}
            >
              <Avatar sx={{
                width: 36,
                height: 36,
                fontSize: '0.875rem',
                fontWeight: 600,
                bgcolor: recipientColor,
                color: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {recipient.name?.charAt(0).toUpperCase() || '?'}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#333' }} noWrap>
                    {recipient.name || "Unnamed"}
                  </Typography>
                  <Box sx={{
                    px: 0.8,
                    py: 0.2,
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    bgcolor: `${recipientColor}15`,
                    color: recipientColor,
                    border: `1px solid ${recipientColor}30`,
                    whiteSpace: 'nowrap'
                  }}>
                    {roleName}
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: '#666' }} noWrap>
                  {recipient.email || "No email"}
                </Typography>
              </Box>
            </Box>
          );
        })}

        <Box sx={{ p: 1.5 }}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={onAddRecipientClick}
            sx={{
              color: '#0d9488',
              borderColor: '#0d9488',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: '6px',
              py: 0.8,
              '&:hover': {
                bgcolor: '#f0fdfa',
                borderColor: '#0b7e74'
              }
            }}
          >
            Add Recipient
          </Button>
        </Box>
      </Box>

      {/* Divider with label */}
      <Box sx={{ py: 1.5, px: 2, textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
        <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: '0.65rem' }}>
          Standard fields
        </Typography>
      </Box>

      {/* Fields Grid */}
      <Box sx={{
        flex: 1,
        minHeight: 300,
        overflowY: 'auto',
        px: 2,
        py: 2,
        bgcolor: '#ffffff',
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: '10px' },
        '&:hover::-webkit-scrollbar-thumb': { background: '#cbd5e1' }
      }}>
        {!selectedRecipient && (
          <Box sx={{
            p: 1.5,
            bgcolor: '#fffef0',
            border: '1px solid #ffe082',
            borderRadius: '8px',
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            boxShadow: '0 2px 4px rgba(255, 224, 130, 0.2)'
          }}>
            <InfoIcon sx={{ fontSize: 18, color: '#f57c00' }} />
            <Typography variant="caption" color="#e65100" fontWeight={500}>
              Select a recipient to enable fields
            </Typography>
          </Box>
        )}

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1
        }}>
          {availableFieldsList.map((field) => {
            const recipientColor = selectedRecipient ? getRecipientColor(selectedRecipient) : '#cbd5e1';
            const canDrag = !!selectedRecipient;

            return (
              <Tooltip
                key={field.type}
                title={!canDrag ? "Select a recipient first" : ""}
                placement="right"
                arrow
              >
                <Box
                  draggable={canDrag}
                  onDragStart={(e) => canDrag && handleDragStart(e, field.type, field.label, recipientColor)}
                  sx={{
                    display: 'flex',
                    alignItems: 'stretch',
                    height: 38,
                    bgcolor: '#ffffff',
                    border: '1px solid',
                    borderColor: canDrag ? '#e2e8f0' : '#f1f5f9',
                    borderRadius: '6px',
                    cursor: canDrag ? 'grab' : 'not-allowed',
                    overflow: 'hidden',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: canDrag ? 1 : 0.5,
                    boxShadow: canDrag ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                    '&:hover': canDrag ? {
                      borderColor: recipientColor,
                      boxShadow: `0 4px 10px ${recipientColor}15`,
                      transform: 'translateY(-1px)'
                    } : {},
                    '&:active': { cursor: canDrag ? 'grabbing' : 'not-allowed' }
                  }}
                >
                  {/* Drag Handle Indicator */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 0.5,
                    color: '#94a3b8',
                    borderRight: '1px solid #f1f5f9'
                  }}>
                    <DragIndicatorIcon sx={{ fontSize: 13 }} />
                  </Box>

                  {/* Field Label */}
                  <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    px: 0.75,
                    minWidth: 0
                  }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#334155',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {field.label}
                    </Typography>
                  </Box>

                  {/* Icon Box */}
                  <Box sx={{
                    width: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: canDrag ? recipientColor : '#f1f5f9',
                    color: '#ffffff',
                    boxShadow: 'inset 0 0 8px rgba(0,0,0,0.05)'
                  }}>
                    {/* Size icons down slightly to fit */}
                    {React.cloneElement(FIELD_ICONS[field.type] || <SignatureIcon />, { sx: { fontSize: 15 } })}
                  </Box>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};

export default DocumentLeftBar;
