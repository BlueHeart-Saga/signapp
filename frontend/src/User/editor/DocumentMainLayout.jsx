import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  AppBar,
  Toolbar,
  CircularProgress,
  Avatar,
  FormControlLabel,
  Switch,
  Fab,
  Badge
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  Verified as VerifiedIcon,
  ArrowForward as ArrowForwardIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Collections as CollectionsIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import DocumentLeftBar from './DocumentLeftBar';
import DocumentWorkArea from './DocumentWorkArea';
import DocumentRightBar from './DocumentRightBar';
import DocumentThumbnails from './DocumentThumbnails';
import AddRecipientDialog from './dialogs/AddRecipientDialog';
import PreviewDialog from './dialogs/PreviewDialog';
import SuccessDialog from './dialogs/SuccessDialog';
import RenameDialog from './dialogs/RenameDialog';
import FinishDialog from './dialogs/FinishDialog';
import AutoSaveIndicator from './dialogs/AutoSaveIndicator';

import { HistoryService } from '../../services/historyService';
import { AutosaveService } from '../../services/autosaveService';
import { setPageTitle } from '../../utils/pageTitle';
import { documentAPI } from '../../services/builder';
import {
  FIELD_TYPES,
  FIELD_ROLES,
  validateFieldAssignment,
  getRecipientColor,
  ROLE_FIELD_RULES
} from '../../config/fieldConfig';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

const DocumentMainLayout = () => {
  const navigate = useNavigate();
  const { documentId } = useParams();

  // ==================== STATE MANAGEMENT ====================
  const [document, setDocument] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);

  // UI State
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [showGrid, setShowGrid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState(1);

  // Sidebar state
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false);
  const [thumbnailsVisible, setThumbnailsVisible] = useState(false);

  // Dialog states
  const [addRecipientDialogOpen, setAddRecipientDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Auto-save and history
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false
  });

  const [historyService] = useState(() => new HistoryService(100));
  const [undoRedoInfo, setUndoRedoInfo] = useState({ canUndo: false, canRedo: false });
  const [autosaveService, setAutosaveService] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [newDocumentName, setNewDocumentName] = useState('');

  // ==================== UTILITY FUNCTIONS ====================
  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const updateUndoRedoInfo = useCallback(() => {
    setUndoRedoInfo(historyService.getHistoryInfo());
  }, [historyService]);

  const commitFieldChange = useCallback((newFields) => {
    historyService.push(newFields);
    setFields(newFields);
    updateUndoRedoInfo();
    setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
  }, [historyService, updateUndoRedoInfo]);

  // ==================== DATA FETCHING ====================
  useEffect(() => {
    setPageTitle("Edit Document", "Edit and prepare your document for signing using SafeSign's builder.");
  }, []);

  useEffect(() => {
    const fetchDocumentData = async () => {
      try {
        setLoading(true);

        if (!documentId) {
          throw new Error('No document ID provided');
        }

        const [docData, recipientsData, fieldsData] = await Promise.all([
          documentAPI.getDocument(documentId),
          documentAPI.getRecipients(documentId),
          documentAPI.getFields(documentId)
        ]);

        setDocument(docData);
        setNumPages(docData.page_count || 1);
        setRecipients(recipientsData);

        const fieldsWithRecipientInfo = fieldsData.map(field => {
          const recipient = recipientsData.find(r => r.id === field.recipient_id);
          return {
            id: field.id || uuidv4(),
            name: `field_${field.type}_${field.id}`,
            type: field.type,
            label: field.label || field.type.charAt(0).toUpperCase() + field.type.slice(1),
            x: field.x || 50,
            y: field.y || 50,
            width: field.width || FIELD_TYPES[field.type]?.defaultWidth || 100,
            height: field.height || FIELD_TYPES[field.type]?.defaultHeight || 40,
            page: field.page || 0,
            required: field.required || false,
            recipient_id: field.recipient_id,
            assignedRecipient: recipient,
            placeholder: field.placeholder || FIELD_TYPES[field.type]?.placeholder || '',
            ...(field.type === 'dropdown' && { dropdown_options: field.dropdown_options || ['Option 1', 'Option 2', 'Option 3'] }),
            ...(field.type === 'radio' && { group_name: field.group_name || `group_${Date.now()}` }),
            ...(field.type === 'mail' && { email_validation: field.email_validation !== false })
          };
        });

        setFields(fieldsWithRecipientInfo);
        historyService.push(fieldsWithRecipientInfo);
        updateUndoRedoInfo();

        // Set document name for rename dialog
        const displayName = docData.filename?.replace(/\.pdf$/i, '') || 'Untitled';
        setNewDocumentName(displayName);

      } catch (error) {
        console.error('Error fetching document data:', error);
        showSnackbar(`Failed to load document: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [documentId, historyService, updateUndoRedoInfo, showSnackbar]);

  // ==================== AUTO-SAVE SETUP ====================
  useEffect(() => {
    const service = new AutosaveService(
      documentId,
      async (fieldsToSave) => {
        if (!autoSaveEnabled) return fieldsToSave;

        const payload = fieldsToSave.map(field => ({
          id: field.isNew ? undefined : field.id,
          page: field.page ?? 0,
          x: field.x ?? 0,
          y: field.y ?? 0,
          width: field.width ?? FIELD_TYPES[field.type]?.defaultWidth ?? 100,
          height: field.height ?? FIELD_TYPES[field.type]?.defaultHeight ?? 40,
          type: field.type,
          recipient_id: field.recipient_id ?? null,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required ?? false,
          ...(field.type === 'dropdown' && { dropdown_options: field.dropdown_options }),
          ...(field.type === 'radio' && { group_name: field.group_name }),
          ...(field.type === 'mail' && { email_validation: field.email_validation })
        }));

        await documentAPI.saveFields(documentId, payload);
        return fieldsToSave.map(f => ({ ...f, isNew: false }));
      },
      {
        debounceTime: 5000,
        maxRetries: 3,
        enabled: autoSaveEnabled,
        silent: true
      }
    );

    setAutosaveService(service);

    const handleAutosaveSuccess = () => {
      setAutoSaveStatus(prev => ({
        ...prev,
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false
      }));
    };

    const handleAutosaveRetry = () => {
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));
    };

    const handleAutosaveFailed = () => {
      setAutoSaveStatus(prev => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: true
      }));
      showSnackbar('Auto-save failed. Please save manually.', 'error');
    };

    window.addEventListener('autosave:success', handleAutosaveSuccess);
    window.addEventListener('autosave:retry', handleAutosaveRetry);
    window.addEventListener('autosave:failed', handleAutosaveFailed);

    return () => {
      window.removeEventListener('autosave:success', handleAutosaveSuccess);
      window.removeEventListener('autosave:retry', handleAutosaveRetry);
      window.removeEventListener('autosave:failed', handleAutosaveFailed);
      service.cancel();
    };
  }, [documentId, autoSaveEnabled, showSnackbar]);


  const handleFieldDelete = useCallback((fieldId) => {
    const newFields = fields.filter(field => field.id !== fieldId);
    commitFieldChange(newFields);

    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [fields, selectedFieldId, commitFieldChange]);


  // ==================== SAVE OPERATIONS ====================
  // In DocumentMainLayout.js - Update handleSaveFields function

  const handleSaveFields = async () => {
    if (document?.status === 'sent') {
      showSnackbar('Fields are locked after sending the document', 'warning');
      return;
    }

    if (!documentId || saving) return;

    try {
      setSaving(true);
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));

      // First, verify document is still in draft state
      const docCheck = await documentAPI.getDocument(documentId);
      if (docCheck.status !== 'draft') {
        showSnackbar('Cannot save fields - document is no longer in draft state', 'error');
        return;
      }

      const PDF_PAGE_WIDTH = 612;
      const PDF_PAGE_HEIGHT = 792;
      const CANVAS_WIDTH = 794;
      const CANVAS_HEIGHT = 1123;

      const scaleX = PDF_PAGE_WIDTH / CANVAS_WIDTH;
      const scaleY = PDF_PAGE_HEIGHT / CANVAS_HEIGHT;

      // Validate each field before sending
      const validatedPayload = fields.map(field => {
        const backendPage = Math.max(0, Math.min(field.page ?? 0, numPages - 1));

        // Ensure recipient_id is valid
        if (!field.recipient_id) {
          throw new Error(`Field "${field.label || field.type}" has no recipient assigned`);
        }

        const recipient = recipients.find(r => r.id === field.recipient_id);
        if (!recipient) {
          throw new Error(`Recipient not found for field "${field.label || field.type}"`);
        }

        const normalizedX = field.x ?? 50;
        const normalizedY = field.y ?? 50;
        const normalizedWidth = field.width ?? 100;
        const normalizedHeight = field.height ?? 40;

        const pdfX = normalizedX * scaleX;
        const pdfY = normalizedY * scaleY + backendPage * PDF_PAGE_HEIGHT;
        const pdfWidth = normalizedWidth * scaleX;
        const pdfHeight = normalizedHeight * scaleY;

        const basePayload = {
          id: field.isNew ? undefined : field.id,
          page: backendPage,
          x: normalizedX,
          y: normalizedY,
          width: normalizedWidth,
          height: normalizedHeight,
          pdf_x: pdfX,
          pdf_y: pdfY,
          pdf_width: pdfWidth,
          pdf_height: pdfHeight,
          page_width: PDF_PAGE_WIDTH,
          page_height: PDF_PAGE_HEIGHT,
          canvas_width: CANVAS_WIDTH,
          canvas_height: CANVAS_HEIGHT,
          type: field.type,
          recipient_id: field.recipient_id,
          required: Boolean(field.required),
          label: field.label ?? '',
          placeholder: field.placeholder ?? ''
        };

        // Add field-specific properties
        if (field.type === 'dropdown') {
          basePayload.dropdown_options = field.dropdown_options || ['Option 1', 'Option 2', 'Option 3'];
        }
        if (field.type === 'radio') {
          basePayload.group_name = field.group_name || `group_${Date.now()}`;
        }
        if (field.type === 'mail') {
          basePayload.email_validation = field.email_validation !== false;
        }
        if (field.type === 'checkbox') {
          basePayload.checked = Boolean(field.checked);
        }

        return basePayload;
      });

      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(validatedPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 403) {
          throw new Error('Permission denied. The document may have been sent or you may not have access.');
        } else if (response.status === 400) {
          throw new Error(errorData.detail || 'Invalid field data');
        } else {
          throw new Error(errorData.detail || 'Failed to save fields');
        }
      }

      const result = await response.json();

      const updatedFields = fields.map(field => {
        const matched = result.fields?.find(sf =>
          sf.page === (field.page ?? 0) &&
          sf.type === field.type &&
          Math.abs(sf.x - (field.x ?? 0)) < 20 &&
          Math.abs(sf.y - (field.y ?? 0)) < 20
        );

        return {
          ...field,
          isNew: false,
          id: matched?.id ?? field.id
        };
      });

      setFields(updatedFields);
      historyService.push(updatedFields);
      updateUndoRedoInfo();

      setAutoSaveStatus({
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false
      });

      showSnackbar(`Saved ${result.count} fields successfully`, 'success');

    } catch (err) {
      console.error('Error saving fields:', err);
      showSnackbar(err.message || 'Failed to save fields', 'error');

      // Refresh document status to check if it was sent
      try {
        const updatedDoc = await documentAPI.getDocument(documentId);
        setDocument(updatedDoc);
        if (updatedDoc.status === 'sent') {
          showSnackbar('Document has been sent. Fields cannot be edited.', 'warning');
        }
      } catch (refreshError) {
        console.error('Error refreshing document:', refreshError);
      }

      throw err;
    } finally {
      setSaving(false);
    }
  };




  // Auto-save when fields change
  // Update auto-save effect

  useEffect(() => {
    if (!autosaveService || fields.length === 0 || !autoSaveEnabled) return;

    // Don't auto-save if document is sent
    if (document?.status === 'sent') {
      if (autoSaveEnabled) {
        setAutoSaveEnabled(false);
        showSnackbar('Auto-save disabled because document is sent', 'info');
      }
      return;
    }

    const hasChanges = autosaveService.hasUnsavedChanges(fields);

    if (hasChanges) {
      setAutoSaveStatus(prev => ({
        ...prev,
        hasUnsavedChanges: true,
        isSaving: true
      }));
      autosaveService.scheduleSave(fields);
    }
  }, [fields, autosaveService, autoSaveEnabled, document?.status, showSnackbar]);



  // ==================== FIELD OPERATIONS ====================
  // Update handleAddField function

  const handleAddField = useCallback((fieldType, x, y, page = currentPage) => {
    // Check if document is editable
    if (document?.status === 'sent') {
      showSnackbar('Cannot add fields to a sent document', 'warning');
      return;
    }

    const fieldConfig = FIELD_TYPES[fieldType];
    const targetPage = Math.max(0, Math.min(page, numPages - 1));

    // Check if there are any recipients at all
    if (recipients.length === 0) {
      showSnackbar('Please add at least one recipient before adding fields', 'warning');
      setAddRecipientDialogOpen(true);
      return;
    }

    // Find compatible recipient
    let selectedRecipient = null;

    if (selectedRecipientId) {
      const recipient = recipients.find(r => r.id === selectedRecipientId);
      if (recipient && validateFieldAssignment(fieldType, recipient.role)) {
        selectedRecipient = recipient;
      } else if (selectedRecipientId) {
        showSnackbar(`Selected recipient cannot have ${fieldType} fields`, 'warning');
      }
    }

    if (!selectedRecipient) {
      selectedRecipient = recipients.find(recipient =>
        validateFieldAssignment(fieldType, recipient.role)
      );

      if (!selectedRecipient) {
        showSnackbar(`No compatible recipient found for ${fieldType} fields`, 'warning');
        return;
      }
    }

    // Rest of the function remains the same...
    const newField = {
      id: uuidv4(),
      name: `${fieldType}_${fields.length + 1}`,
      type: fieldType,
      label: `${fieldConfig.label} ${fields.length + 1}`,
      placeholder: fieldConfig.placeholder,
      x: Math.max(20, Math.min(x, 794 - (fieldConfig.defaultWidth || 100) - 20)),
      y: Math.max(20, Math.min(y, 1123 - (fieldConfig.defaultHeight || 40) - 20)),
      width: fieldConfig.defaultWidth || 100,
      height: fieldConfig.defaultHeight || 40,
      page: targetPage,
      required: false,
      recipient_id: selectedRecipient.id,
      assignedRecipient: selectedRecipient,
      isNew: true,
      ...(fieldType === 'dropdown' && { dropdown_options: ['Option 1', 'Option 2', 'Option 3'] }),
      ...(fieldType === 'radio' && { group_name: `group_${Date.now()}` }),
      ...(fieldType === 'mail' && { placeholder: 'email@example.com', email_validation: true })
    };

    const newFields = [...fields, newField];
    commitFieldChange(newFields);
    setSelectedFieldId(newField.id);

    if (fieldType === 'radio' || fieldType === 'dropdown') {
      setRightSidebarExpanded(true);
    }

    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
    }

    showSnackbar(`Added ${fieldConfig.label} field for ${selectedRecipient.name}`, 'success');
  }, [recipients, fields, currentPage, commitFieldChange, selectedRecipientId, numPages, document?.status, showSnackbar]);

  const handleFieldChange = useCallback((fieldId, updates) => {
    const updatedRecipient = updates.recipient_id ?
      recipients.find(r => r.id === updates.recipient_id) :
      undefined;

    const newFields = fields.map(field =>
      field.id === fieldId ? {
        ...field,
        ...updates,
        assignedRecipient: updatedRecipient || field.assignedRecipient
      } : field
    );

    commitFieldChange(newFields);
  }, [fields, recipients, commitFieldChange]);



  const handleFieldDragEnd = useCallback((fieldId, newX, newY) => {
    const newFields = fields.map(field => {
      if (field.id === fieldId) {
        const constrainedX = Math.max(0, Math.min(newX, 794 - field.width));
        const constrainedY = Math.max(0, Math.min(newY, 1123 - field.height));

        return {
          ...field,
          x: Math.round(constrainedX),
          y: Math.round(constrainedY)
        };
      }
      return field;
    });
    commitFieldChange(newFields);
  }, [fields, commitFieldChange]);

  const handleFieldTransform = useCallback((fieldId, updates) => {
    const newFields = fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    commitFieldChange(newFields);
  }, [fields, commitFieldChange]);

  const handleDuplicateField = useCallback((fieldId) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) return;

    const newField = {
      ...fieldToDuplicate,
      id: uuidv4(),
      isNew: true,
      x: fieldToDuplicate.x + 20,
      y: fieldToDuplicate.y + 20,
      label: `${fieldToDuplicate.label} (Copy)`
    };

    const newFields = [...fields, newField];
    commitFieldChange(newFields);
    setSelectedFieldId(newField.id);
  }, [fields, commitFieldChange]);

  const handleSelectRecipient = useCallback((recipientId) => {
    setSelectedRecipientId(recipientId);

    if (selectedFieldId) {
      const selectedField = fields.find(f => f.id === selectedFieldId);
      if (selectedField) {
        const recipient = recipients.find(r => r.id === recipientId);
        if (recipient && validateFieldAssignment(selectedField.type, recipient.role)) {
          handleFieldChange(selectedFieldId, { recipient_id: recipientId });
        } else if (!recipientId) {
          handleFieldChange(selectedFieldId, { recipient_id: null });
        }
      }
    }
  }, [selectedFieldId, fields, recipients, handleFieldChange]);

  // ==================== UNDO/REDO ====================
  const undo = useCallback(() => {
    if (!historyService.canUndo()) return;
    const previousState = historyService.undo();
    setFields(previousState);
    updateUndoRedoInfo();

    if (selectedFieldId && !previousState.find(f => f.id === selectedFieldId)) {
      setSelectedFieldId(null);
    }
    showSnackbar('Undo successful', 'info');
  }, [historyService, selectedFieldId, updateUndoRedoInfo, showSnackbar]);

  const redo = useCallback(() => {
    if (!historyService.canRedo()) return;
    const nextState = historyService.redo();
    setFields(nextState);
    updateUndoRedoInfo();
    showSnackbar('Redo successful', 'info');
  }, [historyService, updateUndoRedoInfo, showSnackbar]);



  const handleForceSave = async () => {
    if (!autosaveService || fields.length === 0) return;
    try {
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));
      await autosaveService.forceSave(fields);
      showSnackbar('Saved successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to save. Please try manual save.', 'error');
    }
  };

  const handleToggleAutoSave = (enabled) => {
    setAutoSaveEnabled(enabled);
    showSnackbar(enabled ? 'Auto-save enabled' : 'Auto-save disabled', 'info');
    if (enabled && autoSaveStatus.hasUnsavedChanges) {
      handleForceSave();
    }
  };

  // ==================== RECIPIENT OPERATIONS ====================
  const handleAddRecipient = async (recipientData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipients/${documentId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipients: [recipientData] })
      });

      if (!response.ok) {
        throw new Error('Failed to add recipient');
      }

      const result = await response.json();

      const backendRecipient = result.recipients?.[0];
      const newRecipient = {
        ...recipientData,
        ...backendRecipient,
        id: backendRecipient?.id || result.id || Date.now().toString(),
        added_at: new Date().toISOString()
      };

      setRecipients(prev => [...prev, newRecipient]);
      showSnackbar('Recipient added successfully!', 'success');

      return newRecipient;

    } catch (error) {
      console.error('Error adding recipient:', error);
      throw error;
    }
  };

  // ==================== SEND OPERATIONS ====================
  const handleFinishAndSend = async () => {
    if (!documentId) {
      showSnackbar('No document selected', 'error');
      return;
    }

    const invalidFields = fields.filter(field => {
      if (!field.recipient_id) return true;
      const recipient = recipients.find(r => r.id === field.recipient_id);
      if (!recipient) return true;
      return !validateFieldAssignment(field.type, recipient.role);
    });

    if (invalidFields.length > 0) {
      showSnackbar(`Cannot send: ${invalidFields.length} field(s) need attention`, 'error');
      setFinishDialogOpen(true);
      return;
    }

    setFinishDialogOpen(true);
  };

  const sendInvites = async () => {
    try {
      setSaving(true);

      await handleSaveFields();

      const recipientIds = recipients.map(r => r.id);

      if (recipientIds.length === 0) {
        showSnackbar('Please add recipients first', 'warning');
        return;
      }

      await documentAPI.sendInvites(documentId, {
        recipient_ids: recipientIds,
        message: "Please review and sign the document"
      });

      showSnackbar('Invites sent successfully!', 'success');
      setFinishDialogOpen(false);

      setTimeout(() => {
        setSuccessDialogOpen(true);
      }, 500);

    } catch (error) {
      console.error('Error sending invites:', error);
      showSnackbar(`Failed to send invites: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ==================== VALIDATION ====================
  const getFieldValidationError = useCallback((field) => {
    if (!field || !field.recipient_id) return false;
    const recipient = recipients.find(r => r.id === field.recipient_id);
    if (!recipient) return true;
    return !validateFieldAssignment(field.type, recipient.role);
  }, [recipients]);

  const invalidFields = useMemo(() => fields.filter(getFieldValidationError), [fields, getFieldValidationError]);
  const unassignedFields = useMemo(() => fields.filter(f => !f.recipient_id), [fields]);
  const selectedField = useMemo(() => fields.find(f => f.id === selectedFieldId), [fields, selectedFieldId]);

  // ==================== NAVIGATION ====================
  const handleNavigateWithCheck = useCallback((path) => {
    if (autoSaveStatus.hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedChangesDialog(true);
    } else {
      navigate(path);
    }
  }, [autoSaveStatus.hasUnsavedChanges, navigate]);

  const handleForceSaveAndNavigate = async () => {
    try {
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));
      await autosaveService.forceSave(fields);
      navigate(pendingNavigation);
    } catch (error) {
      showSnackbar('Failed to save. Please try again.', 'error');
    } finally {
      setShowUnsavedChangesDialog(false);
      setPendingNavigation(null);
    }
  };

  // ==================== RENAME ====================
  const handleRenameDocument = async () => {
    if (!newDocumentName.trim() || !documentId) {
      showSnackbar('Please enter a valid document name', 'error');
      return;
    }

    try {
      setSaving(true);

      const filename = newDocumentName.trim().endsWith('.pdf')
        ? newDocumentName.trim()
        : `${newDocumentName.trim()}.pdf`;

      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ filename })
      });

      if (!response.ok) {
        throw new Error('Failed to rename document');
      }

      setDocument(prev => prev ? { ...prev, filename } : null);
      setRenameDialogOpen(false);
      showSnackbar('Document renamed successfully!', 'success');

    } catch (error) {
      console.error('Error renaming document:', error);
      showSnackbar('Failed to rename document', 'error');
    } finally {
      setSaving(false);
    }
  };


  // ==================== KEYBOARD SHORTCUTS ====================
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Save: Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFields();
        return;
      }

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete: Delete or Backspace with selected field
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFieldId) {
        e.preventDefault();
        handleFieldDelete(selectedFieldId);
        return;
      }

      // Page navigation with Ctrl + Arrow
      if (e.ctrlKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            setCurrentPage(prev => Math.max(0, prev - 1));
            break;
          case 'ArrowRight':
            e.preventDefault();
            setCurrentPage(prev => Math.min(numPages - 1, prev + 1));
            break;
          case 'Home':
            e.preventDefault();
            setCurrentPage(0);
            break;
          case 'End':
            e.preventDefault();
            setCurrentPage(numPages - 1);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, numPages, handleSaveFields, handleFieldDelete, undo, redo]);


  useEffect(() => {
    const handleCanvasDrop = (e) => {
      console.log('Canvas drop received in main layout:', e.detail);
      const { fieldType, x, y, page } = e.detail;
      handleAddField(fieldType, x, y, page);
    };

    window.addEventListener('canvasDrop', handleCanvasDrop);

    return () => {
      window.removeEventListener('canvasDrop', handleCanvasDrop);
    };
  }, [handleAddField]);

  // ==================== RENDER ====================
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!document) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Document not found. Please select a document first.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/user/documents')}
          startIcon={<ArrowBackIcon />}
        >
          Back to Documents
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="inherit" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => handleNavigateWithCheck('/user/documents')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" noWrap>
                {document.filename || 'Untitled Document'}
              </Typography>

              <IconButton
                size="small"
                onClick={() => setRenameDialogOpen(true)}
                sx={{
                  ml: 0.5,
                  color: '#0d9488',
                  '&:hover': {
                    backgroundColor: 'rgba(13, 148, 136, 0.04)'
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>

              {autoSaveStatus.isSaving && <CircularProgress size={16} sx={{ ml: 1, color: '#0d9488' }} />}

              {autoSaveStatus.lastSaved && !autoSaveStatus.isSaving && (
                <Tooltip title={`Last saved: ${new Date(autoSaveStatus.lastSaved).toLocaleTimeString()}`}>
                  <Chip
                    label="Saved"
                    size="small"
                    variant="outlined"
                    icon={<CheckCircleIcon fontSize="small" />}
                    sx={{
                      color: '#0d9488',
                      borderColor: '#0d9488',
                      '& .MuiChip-icon': { color: '#0d9488' }
                    }}
                  />
                </Tooltip>
              )}

              {autoSaveStatus.hasUnsavedChanges && (
                <Chip
                  label="Unsaved"
                  size="small"
                  color="warning"
                  variant="outlined"
                  icon={<ErrorIcon fontSize="small" />}
                />
              )}
            </Box>

            <Typography variant="caption" color="text.secondary">
              Role-Based Field Assignment • {recipients.length} Recipients
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoSaveIndicator
              enabled={autoSaveEnabled}
              onToggle={handleToggleAutoSave}
              status={autoSaveStatus}
              onForceSave={handleForceSave}
            />

            <Tooltip title="Undo (Ctrl+Z)">
              <IconButton
                size="small"
                onClick={undo}
                disabled={!undoRedoInfo.canUndo}
                sx={{
                  '&:hover': {
                    color: '#0d9488'
                  }
                }}
              >
                <UndoIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Redo (Ctrl+Y)">
              <IconButton
                size="small"
                onClick={redo}
                disabled={!undoRedoInfo.canRedo}
                sx={{
                  '&:hover': {
                    color: '#0d9488'
                  }
                }}
              >
                <RedoIcon />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Chip
              label={`${fields.length} fields`}
              size="small"
              variant="outlined"
              color={invalidFields.length > 0 ? "error" : "default"}
              sx={invalidFields.length === 0 ? {
                '&.MuiChip-outlined': {
                  borderColor: '#0d9488',
                  color: '#0d9488'
                }
              } : {}}
            />

            {invalidFields.length > 0 && (
              <Chip
                label={`${invalidFields.length} invalid`}
                size="small"
                color="error"
                variant="filled"
              />
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => setPreviewDialogOpen(true)}
              sx={{
                color: '#0d9488',
                borderColor: '#0d9488',
                '&:hover': {
                  borderColor: '#0f766e',
                  backgroundColor: 'rgba(13, 148, 136, 0.04)'
                }
              }}
            >
              Preview
            </Button>

            <Tooltip title={document?.status === 'sent' ? "Fields cannot be edited after sending" : ""}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSaveFields}
                disabled={saving || invalidFields.length > 0 || document?.status === 'sent'}
                sx={{
                  color: '#0d9488',
                  borderColor: '#0d9488',
                  '&:hover': {
                    borderColor: '#0f766e',
                    backgroundColor: 'rgba(13, 148, 136, 0.04)'
                  },
                  '&.Mui-disabled': {
                    borderColor: 'rgba(13, 148, 136, 0.3)',
                    color: 'rgba(13, 148, 136, 0.3)'
                  }
                }}
              >
                {saving ? 'Saving...' : document?.status === 'sent' ? 'Locked' : 'Save'}
              </Button>
            </Tooltip>

            <Button
              variant="contained"
              size="small"
              startIcon={<SendIcon />}
              onClick={handleFinishAndSend}
              disabled={saving || invalidFields.length > 0 || document?.status === 'sent'}
              color={invalidFields.length > 0 ? "warning" : "primary"}
              sx={invalidFields.length === 0 ? {
                bgcolor: '#0d9488',
                '&:hover': {
                  bgcolor: '#0f766e'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(13, 148, 136, 0.3)'
                }
              } : {}}
            >
              Finish & Send
            </Button>

            <Divider orientation="vertical" flexItem />

            <Tooltip title={thumbnailsVisible ? "Hide Thumbnails" : "Show Page Thumbnails"}>
              <IconButton
                size="small"
                onClick={() => setThumbnailsVisible(!thumbnailsVisible)}
                sx={{
                  color: thumbnailsVisible ? '#0d9488' : 'inherit',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(13, 148, 136, 0.08)',
                    color: '#0d9488'
                  }
                }}
              >
                <CollectionsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content - Three Column Layout */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', p: 2, position: 'relative' }}>
        {/* Left Sidebar */}
        <DocumentLeftBar
          onAddField={handleAddField}
          recipients={recipients}
          selectedRecipientId={selectedRecipientId}
          onSelectRecipient={handleSelectRecipient}
          onAddRecipientClick={() => setAddRecipientDialogOpen(true)}
          zoomLevel={zoomLevel}
        />

        {/* Center Work Area */}
        <DocumentWorkArea
          documentId={documentId}
          documentName={document.filename}
          fields={fields}
          recipients={recipients}
          selectedFieldId={selectedFieldId}
          onSelectField={setSelectedFieldId}
          onFieldDragEnd={handleFieldDragEnd}
          onFieldTransform={handleFieldTransform}
          onFieldClick={setSelectedFieldId}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(prev => !prev)}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          numPages={numPages}
          getFieldValidationError={getFieldValidationError}
          invalidFields={invalidFields}
          unassignedFields={unassignedFields}
        />

        {/* Document Thumbnails Sidebar (Toggleable, Zoho-style) */}
        {thumbnailsVisible && (
          <Box sx={{
            height: '100%',
            transition: 'all 0.3s ease',
            zIndex: 10,
            animation: 'slideInRight 0.3s ease'
          }}>
            <DocumentThumbnails
              documentId={documentId}
              numPages={numPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              fields={fields}
            />
          </Box>
        )}

        {/* Right Sidebar Toggle */}
        <Box sx={{
          position: 'absolute',
          right: rightSidebarExpanded ? 360 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          transition: 'right 0.3s ease'
        }}>
          <IconButton
            onClick={() => setRightSidebarExpanded(!rightSidebarExpanded)}
            sx={{
              backgroundColor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRight: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              boxShadow: 2,
              '&:hover': { backgroundColor: 'grey.100' }
            }}
          >
            {rightSidebarExpanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>

        {/* Right Sidebar */}
        <DocumentRightBar
          expanded={rightSidebarExpanded}
          selectedField={selectedField}
          recipients={recipients}
          onFieldChange={handleFieldChange}
          onFieldDelete={handleFieldDelete}
          onFieldDuplicate={handleDuplicateField}
          numPages={numPages}
          selectedRecipientId={selectedRecipientId}
          onSelectRecipient={handleSelectRecipient}
          fields={fields}
          onAddRecipientClick={() => setAddRecipientDialogOpen(true)}
        />
      </Box>

      {/* Floating Add Recipient Button */}
      {/* <Fab
        color="primary"
        size="medium"
        onClick={() => setAddRecipientDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          boxShadow: 3,
          '&:hover': { transform: 'scale(1.05)', boxShadow: 6 }
        }}
      >
        <PersonAddIcon />
      </Fab> */}

      {/* Dialogs */}
      <AddRecipientDialog
        open={addRecipientDialogOpen}
        onClose={() => setAddRecipientDialogOpen(false)}
        onAddRecipient={handleAddRecipient}
        existingRecipients={recipients}
        documentId={documentId}
        disabled={saving || invalidFields.length > 0 || document?.status === 'sent'}
      />

      <PreviewDialog
        open={previewDialogOpen}
        documentName={document.filename}
        onClose={() => setPreviewDialogOpen(false)}
        documentId={documentId}
      />

      <FinishDialog
        open={finishDialogOpen}
        onClose={() => setFinishDialogOpen(false)}
        onConfirm={sendInvites}
        fields={fields}
        recipients={recipients}
        invalidFields={invalidFields}
        unassignedFields={unassignedFields}
        saving={saving}
        document={document}
        onRenameClick={() => {
          setFinishDialogOpen(false);
          setTimeout(() => setRenameDialogOpen(true), 300);
        }}
        getFieldValidationError={getFieldValidationError}
        getRecipientColor={getRecipientColor}
        FIELD_ROLES={FIELD_ROLES}
      />

      <SuccessDialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        onNavigateToDashboard={() => navigate('/user/dashboard')}
        onNavigateToDocuments={() => navigate('/user/documents')}
        documentName={document?.filename}
        recipientCount={recipients.length}
      />

      <RenameDialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        documentName={newDocumentName}
        onDocumentNameChange={setNewDocumentName}
        onRename={handleRenameDocument}
        renaming={saving}
      />

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedChangesDialog} onClose={() => setShowUnsavedChangesDialog(false)}>
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have unsaved changes that will be lost if you leave this page.
          </Alert>
          <Typography variant="body2">
            Do you want to save your changes before leaving?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowUnsavedChangesDialog(false);
            setPendingNavigation(null);
          }}>
            Cancel
          </Button>
          <Button onClick={() => {
            setShowUnsavedChangesDialog(false);
            navigate(pendingNavigation);
          }} color="warning">
            Leave Without Saving
          </Button>
          <Button
            onClick={handleForceSaveAndNavigate}
            variant="contained"
            disabled={autoSaveStatus.isSaving}
          >
            {autoSaveStatus.isSaving ? 'Saving...' : 'Save & Leave'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentMainLayout;