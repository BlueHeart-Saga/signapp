import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, List, ListItem,
  ListItemText, CircularProgress, Divider
} from "@mui/material";
import { useParams } from "react-router-dom";
import { recipientAPI } from "../services/RecipientAPI";

export default function RecipientHistory() {
  const { documentId } = useParams();
  const [history, setHistory] = useState(null);

  useEffect(() => {
    recipientAPI.getDocumentHistory(documentId)
      .then(res => setHistory(res.data))
      .catch(err => console.error(err));
  }, [documentId]);

  if (!history) return <CircularProgress sx={{ mt: 10 }} />;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Document History
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2">Recipients</Typography>
        <List>
          {history.signature_history?.map((r, i) => (
            <ListItem key={i}>
              <ListItemText
                primary={r.recipient_email}
                secondary={`Status: ${r.status}`}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2">Activity Log</Typography>
        <List>
          {history.activity_log?.map((a, i) => (
            <ListItem key={i}>
              <ListItemText
                primary={a.action}
                secondary={new Date(a.timestamp).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
