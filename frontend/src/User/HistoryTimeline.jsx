// components/HistoryTimeline.jsx
import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, IconButton, Paper } from '@mui/material';
import { Undo as UndoIcon, Redo as RedoIcon, History as HistoryIcon, Save as SaveIcon } from '@mui/icons-material';

const HistoryTimeline = ({ historyService, onUndo, onRedo, currentVersion, maxHistory = 10 }) => {
  const history = historyService?.getHistoryInfo?.() || {};
  const recentHistory = historyService?.past?.slice(-maxHistory) || [];

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        History Timeline
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <IconButton 
          size="small" 
          onClick={onUndo}
          disabled={!history.canUndo}
          title="Undo (Ctrl+Z)"
        >
          <UndoIcon fontSize="small" />
        </IconButton>
        
        <IconButton 
          size="small" 
          onClick={onRedo}
          disabled={!history.canRedo}
          title="Redo (Ctrl+Y)"
        >
          <RedoIcon fontSize="small" />
        </IconButton>
        
        <Typography variant="caption" sx={{ alignSelf: 'center', ml: 'auto' }}>
          Version {currentVersion}
        </Typography>
      </Box>
      
      <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
        {recentHistory.reverse().map((state, index) => (
          <ListItem 
            key={index} 
            sx={{ 
              py: 0.5,
              backgroundColor: index === 0 ? 'action.hover' : 'transparent'
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {index === 0 ? (
                <SaveIcon fontSize="small" color="primary" />
              ) : (
                <HistoryIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={`Version ${currentVersion - recentHistory.length + index + 1}`}
              secondary={`${state.length} fields • ${new Date().toLocaleTimeString()}`}
            />
          </ListItem>
        ))}
        
        {recentHistory.length === 0 && (
          <ListItem>
            <ListItemText
              primary="No history yet"
              secondary="Start editing to see history"
            />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};
