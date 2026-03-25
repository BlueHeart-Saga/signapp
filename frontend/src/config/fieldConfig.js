import React from 'react';
import {
  Create as SignatureIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  ShortText as ShortTextIcon,
  CheckBox as CheckBoxIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  ArrowDropDownCircle as ArrowDropDownCircleIcon,
  AttachFile as AttachFileIcon,
  VerifiedUser as VerifiedIcon,
  HowToReg as WitnessIcon,
  LocalOffer as StampIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

// Field type definitions
export const FIELD_TYPES = {
  signature: {
    label: 'Signature',
    icon: <SignatureIcon />,
    color: '#F44336',
    placeholder: 'SIGNATURE',
    defaultWidth: 180,
    defaultHeight: 32,
    backendType: 'signature',
    allowedFor: ['signer', 'in_person_signer']
  },
  initials: {
    label: 'Initials',
    icon: <EditIcon />,
    color: '#2196F3',
    placeholder: 'INITIAL',
    defaultWidth: 70,
    defaultHeight: 32,
    backendType: 'initials',
    allowedFor: ['signer', 'in_person_signer']
  },
  date: {
    label: 'Date',
    icon: <CalendarIcon />,
    color: '#3F51B5',
    placeholder: 'MM/DD/YYYY',
    defaultWidth: 120,
    defaultHeight: 32,
    backendType: 'date',
    allowedFor: [] // Universal
  },
  textbox: {
    label: 'Text Field',
    icon: <ShortTextIcon />,
    color: '#4CAF50',
    placeholder: 'ENTER TEXT...',
    defaultWidth: 160,
    defaultHeight: 32,
    backendType: 'textbox',
    allowedFor: [] // Universal
  },
  checkbox: {
    label: 'Checkbox',
    icon: <CheckBoxIcon />,
    color: '#FF4081',
    placeholder: '□',
    defaultWidth: 24,
    defaultHeight: 24,
    backendType: 'checkbox',
    allowedFor: [] // Universal
  },
  radio: {
    label: 'Radio',
    icon: <RadioButtonCheckedIcon />,
    color: '#9C27B0',
    placeholder: '○',
    defaultWidth: 24,
    defaultHeight: 24,
    backendType: 'radio',
    allowedFor: [] // Universal
  },
  dropdown: {
    label: 'Dropdown',
    icon: <ArrowDropDownCircleIcon />,
    color: '#0097A7',
    placeholder: 'Select...',
    defaultWidth: 160,
    defaultHeight: 32,
    backendType: 'dropdown',
    allowedFor: [] // Universal
  },
  attachment: {
    label: 'File',
    icon: <AttachFileIcon />,
    color: '#795548',
    placeholder: 'ATTACH FILE',
    defaultWidth: 140,
    defaultHeight: 32,
    backendType: 'attachment',
    allowedFor: [] // Universal
  },
  approval: {
    label: 'Approval',
    icon: <CheckIcon />,
    color: '#9C27B0',
    placeholder: 'APPROVE',
    defaultWidth: 120,
    defaultHeight: 32,
    backendType: 'approval',
    allowedFor: ['approver']
  },
  witness_signature: {
    label: 'Witness Signature',
    icon: <WitnessIcon />,
    color: '#FF9800',
    placeholder: 'Witness signature',
    defaultWidth: 180,
    defaultHeight: 32,
    backendType: 'witness_signature',
    allowedFor: ['witness']
  },
  stamp: {
    label: 'Stamp',
    icon: <StampIcon />,
    color: '#D32F2F',
    placeholder: '[STAMP]',
    defaultWidth: 100,
    defaultHeight: 60,
    backendType: 'stamp',
    allowedFor: [] // Backend only
  },
  mail: {
    label: 'Email',
    icon: <EmailIcon />,
    color: '#2196F3',
    placeholder: 'email@example.com',
    defaultWidth: 160,
    defaultHeight: 32,
    backendType: 'mail',
    allowedFor: [] // Universal
  }
};

// Role definitions
export const FIELD_ROLES = {
  signer: {
    id: 'signer',
    name: 'Signer',
    icon: <SignatureIcon />,
    description: 'Must sign the document',
    allowedFields: ['signature', 'initials', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment']
  },
  approver: {
    id: 'approver',
    name: 'Approver',
    icon: <VerifiedIcon />,
    description: 'Approves the document',
    allowedFields: ['approval', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment']
  },
  form_filler: {
    id: 'form_filler',
    name: 'Form Filler',
    icon: <EditIcon />,
    description: 'Can fill form fields',
    allowedFields: ['textbox', 'date', 'checkbox', 'radio', 'dropdown', 'attachment']
  },
  witness: {
    id: 'witness',
    name: 'Witness',
    icon: <WitnessIcon />,
    description: 'Can witness signatures',
    allowedFields: ['witness_signature', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment']
  },
  in_person_signer: {
    id: 'in_person_signer',
    name: 'In-person Signer',
    icon: <PersonIcon />,
    description: 'Signs in person',
    allowedFields: ['signature', 'initials', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment']
  },
  viewer: {
    id: 'viewer',
    name: 'Viewer',
    icon: <PersonIcon />,
    description: 'Can only view',
    allowedFields: []
  }
};

// Role field rules matching backend
export const ROLE_FIELD_RULES = {
  signer: 'ALL',
  in_person_signer: ['signature', 'initials', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment', 'mail'],
  witness: ['witness_signature', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment', 'mail'],
  approver: ['approval', 'date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment', 'mail'],
  form_filler: ['date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment', 'mail'],
  viewer: []
};

// Universal fields available to all roles
export const UNIVERSAL_FIELDS = ['date', 'textbox', 'checkbox', 'radio', 'dropdown', 'attachment', 'mail'];

// Color generation function
export const generateRecipientColor = (email) => {
  if (!email) return '#808080';
  
  const hash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  
  const hashInt = hash(email);
  const hue = hashInt % 360;
  const saturation = 65 + (hashInt % 15);
  const lightness = 85 + (hashInt % 10);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Get recipient color
export const getRecipientColor = (recipient) => {
  if (!recipient) return '#808080';
  
  if (recipient.color) return recipient.color;
  if (recipient.email) return generateRecipientColor(recipient.email);
  if (recipient.name) return generateRecipientColor(recipient.name);
  
  return '#808080';
};

// Validate field assignment
export const validateFieldAssignment = (fieldType, recipientRole) => {
  const rules = ROLE_FIELD_RULES[recipientRole];
  
  if (rules === 'ALL') {
    return true;
  }
  
  if (Array.isArray(rules)) {
    return rules.includes(fieldType);
  }
  
  return false;
};

// Get available field types for role
export const getAvailableFieldTypesForRole = (role) => {
  if (role === 'viewer') return [];
  
  const rules = ROLE_FIELD_RULES[role];
  
  if (rules === 'ALL') {
    return Object.entries(FIELD_TYPES).map(([type, config]) => ({ type, ...config }));
  }
  
  if (Array.isArray(rules)) {
    return rules
      .map(type => ({ type, ...FIELD_TYPES[type] }))
      .filter(Boolean);
  }
  
  return [];
};