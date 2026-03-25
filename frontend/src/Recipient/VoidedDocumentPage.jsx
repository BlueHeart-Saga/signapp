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
  Block as VoidedIcon,
  VisibilityOutlined as ViewIcon
} from "@mui/icons-material";
import { useParams } from "react-router-dom";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const VoidedDocumentPage = () => {
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

  const handleViewVoided = () => {
    window.open(
      `${API_BASE_URL}/signing/recipient/${recipientId}/view-voided`,
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
          maxWidth: 540,
          width: "100%",
          p: 4,
          borderRadius: 3,
          textAlign: "center"
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "#fef2f2",
            color: "#b91c1c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2
          }}
        >
          <VoidedIcon fontSize="large" />
        </Box>

        {/* Title */}
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
          Document Voided
        </Typography>

        <Typography sx={{ color: "#6b7280", mt: 1 }}>
          This document has been voided and can no longer be signed.
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Info */}
        <Box sx={{ textAlign: "left" }}>
          <Typography sx={{ fontSize: 14, color: "#374151" }}>
            <strong>Document:</strong> {document?.filename}
          </Typography>

          <Typography sx={{ fontSize: 14, color: "#374151", mt: 1 }}>
            <strong>Recipient:</strong> {recipient?.name} ({recipient?.email})
          </Typography>

          {signing_info?.voided_at && (
            <Typography sx={{ fontSize: 14, color: "#374151", mt: 1 }}>
              <strong>Voided At:</strong>{" "}
              {new Date(signing_info.voided_at).toLocaleString()}
            </Typography>
          )}

          {signing_info?.void_reason && (
            <Typography sx={{ fontSize: 14, color: "#b91c1c", mt: 1 }}>
              <strong>Reason:</strong> {signing_info.void_reason}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Actions */}
        <Stack spacing={1.5}>
          <Button
            variant="contained"
            startIcon={<ViewIcon />}
            onClick={handleViewVoided}
            sx={{
              textTransform: "none",
              bgcolor: "#111827",
              "&:hover": { bgcolor: "#000" }
            }}
          >
            View Voided Document
          </Button>
        </Stack>

        <Typography
          sx={{
            mt: 4,
            fontSize: 12,
            color: "#9ca3af"
          }}
        >
          This document is read-only. No actions can be performed.
        </Typography>
      </Paper>
    </Box>
  );
};

export default VoidedDocumentPage;
