import React from 'react';
import {
  Box,
  Tooltip,
  FormControlLabel,
  Switch,
  Typography,
  Chip,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const AutoSaveIndicator = ({
  enabled,
  onToggle,
  status = {},
  onForceSave
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={enabled ? "Auto-save enabled" : "Auto-save disabled"}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              color="success"
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              Auto
            </Typography>
          }
          sx={{ m: 0, mr: 1 }}
        />
      </Tooltip>

      {enabled && (
        <>
          {status.isSaving ? (
            <Tooltip title="Auto-saving...">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={12} />
                <Typography variant="caption" color="text.secondary">
                  Saving...
                </Typography>
              </Box>
            </Tooltip>
          ) : status.lastSaved ? (
            <Tooltip title={`Last saved: ${new Date(status.lastSaved).toLocaleTimeString()}`}>
              <Chip
                label="Saved"
                size="small"
                color="success"
                variant="outlined"
                icon={<CheckCircleIcon fontSize="small" />}
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Tooltip>
          ) : null}

          {status.hasUnsavedChanges && !status.isSaving && (
            <>
              <Tooltip title="Unsaved changes">
                <Chip
                  label="Unsaved"
                  size="small"
                  color="warning"
                  variant="outlined"
                  icon={<ErrorIcon fontSize="small" />}
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              </Tooltip>
              
              <Tooltip title="Save now">
                <IconButton
                  size="small"
                  onClick={onForceSave}
                  disabled={status.isSaving}
                  sx={{ p: 0.5 }}
                >
                  <SaveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default AutoSaveIndicator;
