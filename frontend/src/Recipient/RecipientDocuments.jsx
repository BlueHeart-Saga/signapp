import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, List, ListItem,
  ListItemText, Chip, CircularProgress, Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { recipientAPI } from "../services/RecipientAPI";

export default function RecipientDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    recipientAPI.getMyDocuments()
      .then(res => setDocuments(res.data.documents || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress sx={{ mt: 10 }} />;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        My Documents
      </Typography>

      <Paper>
        <List>
          {documents.map(doc => (
            <ListItem
              key={doc.id}
              secondaryAction={
                <Button onClick={() => navigate(`/recipient/history/${doc.id}`)}>
                  History
                </Button>
              }
            >
              <ListItemText
                primary={doc.name || "Untitled Document"}
                secondary={`Status: ${doc.status}`}
              />
              <Chip
                label={doc.signature_status || "pending"}
                color={
                  doc.signature_status === "completed"
                    ? "success"
                    : "warning"
                }
                size="small"
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
