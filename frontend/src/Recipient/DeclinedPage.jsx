import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Stack
} from "@mui/material";
import {
  CancelOutlined as DeclinedIcon,
  DownloadOutlined as DownloadIcon
} from "@mui/icons-material";
import { useParams } from "react-router-dom";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const DeclinedPage = () => {
  const { recipientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/signing/recipient/${recipientId}`)
      .then(res => res.json())
      .then(data => {
        setInfo(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load document status.");
        setLoading(false);
      });
  }, [recipientId]);

  const handleDownloadOriginal = () => {
    window.open(
      `${API_BASE_URL}/signing/recipient/${recipientId}/download/original`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const { recipient, document, signing_info } = info;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2
      }}
    >
      <Paper
        elevation={2}
        sx={{
          maxWidth: 520,
          width: "100%",
          p: 4,
          textAlign: "center",
          borderRadius: 3
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2
          }}
        >
          <DeclinedIcon fontSize="large" />
        </Box>

        {/* Title */}
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
          Document Declined
        </Typography>

        <Typography sx={{ color: "#6b7280", mt: 1 }}>
          This document was declined and can no longer be signed.
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Details */}
        <Box sx={{ textAlign: "left" }}>
          <Typography sx={{ fontSize: 14, color: "#374151" }}>
            <strong>Document:</strong> {document?.filename}
          </Typography>

          <Typography sx={{ fontSize: 14, color: "#374151", mt: 1 }}>
            <strong>Recipient:</strong> {recipient?.name} ({recipient?.email})
          </Typography>

          {recipient?.decline_reason && (
            <Typography sx={{ fontSize: 14, color: "#dc2626", mt: 1 }}>
              <strong>Reason:</strong> {recipient.decline_reason}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Actions */}
        <Stack spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadOriginal}
            sx={{ textTransform: "none" }}
          >
            Download Original Document
          </Button>
        </Stack>

        {/* Footer */}
        <Typography
          sx={{
            mt: 4,
            fontSize: 12,
            color: "#9ca3af"
          }}
        >
          This action was recorded for audit purposes.
        </Typography>
      </Paper>
    </Box>
  );
};

export default DeclinedPage;
