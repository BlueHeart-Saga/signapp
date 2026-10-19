import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from "@mui/material";

import RestoreIcon from "@mui/icons-material/Restore";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import BlockIcon from "@mui/icons-material/Block";

import {
  getDocumentsPaged,
  restoreDocument,
  permanentDeleteDocument,
} from "../services/DocumentAPI";
import FilenameDisplay from "./FilenameDisplay";

export default function DeletedDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDeletedDocs = async () => {
    setLoading(true);
    try {
      const res = await getDocumentsPaged(1, 50, "deleted");
      setDocuments(res.documents || []);
    } catch (err) {
      console.error("Failed to load deleted documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedDocs();
  }, []);

  const handleRestore = async (docId) => {
    await restoreDocument(docId);
    loadDeletedDocs();
  };

  const handlePermanentDelete = async (docId) => {
    if (!window.confirm("This will permanently delete the document. Continue?")) return;
    await permanentDeleteDocument(docId);
    loadDeletedDocs();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Trash
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Documents in trash can be restored or permanently deleted.
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : documents.length === 0 ? (
        <Typography color="text.secondary">
          No deleted documents found.
        </Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document</TableCell>
              <TableCell>Envelope ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell sx={{ maxWidth: { xs: 160, sm: 260, md: 380 }, minWidth: 0 }}>
                  <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                    <FilenameDisplay
                      filename={doc.filename}
                      sx={{ fontWeight: 500, color: '#1e293b' }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                      Deleted at: {doc.deleted_at || "—"}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  {doc.envelope_id ? (
                    <Chip size="small" label={doc.envelope_id} />
                  ) : (
                    "—"
                  )}
                </TableCell>

                <TableCell>
                  <Chip
                    label={doc.status}
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                </TableCell>

                <TableCell align="right">
                  {/* Restore */}
                  <Tooltip title="Restore">
                    <IconButton
                      color="primary"
                      onClick={() => handleRestore(doc.id)}
                    >
                      <RestoreIcon />
                    </IconButton>
                  </Tooltip>

                  {/* Permanent Delete */}
                  <Tooltip title="Delete Permanently">
                    <IconButton
                      color="error"
                      onClick={() => handlePermanentDelete(doc.id)}
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
