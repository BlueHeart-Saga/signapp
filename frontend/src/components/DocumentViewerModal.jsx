import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
  Slider,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Document, Page, pdfjs } from "react-pdf";
import { fetchPdfBlob } from "../services/DocumentAPI";

// PDF.js worker (REQUIRED)
pdfjs.GlobalWorkerOptions.workerSrc = 
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function DocumentViewerModal({
  open,
  onClose,
  documentId,
  documentName,
  title = "Document Preview",
  url,
}) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ===============================
     LOAD PDF SAFELY
     =============================== */
  useEffect(() => {
    if (!open || !url) return;

    let cancelled = false;
    let objectUrl = null;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setPdfUrl(null);
      setNumPages(0);

      try {
        const blob = await fetchPdfBlob(url);
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Failed to load document");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, url]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.6));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: "90vh" } }}
    >
      {/* ================= HEADER ================= */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Typography fontWeight={600}>{title}</Typography>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ================= CONTENT ================= */}
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Loading */}
        {loading && (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography color="text.secondary">
              Loading document…
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && !loading && (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {/* ================= PDF SCROLL VIEW ================= */}
        {!loading && !error && pdfUrl && (
          <>
            {/* Toolbar */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 2,
                py: 1,
                backgroundColor: "#fff",
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <IconButton onClick={handleZoomOut} disabled={scale <= 0.6}>
                <ZoomOutIcon />
              </IconButton>

              <Slider
                value={scale}
                min={0.6}
                max={3}
                step={0.1}
                onChange={(_, v) => setScale(v)}
                sx={{ width: 150 }}
              />

              <IconButton onClick={handleZoomIn} disabled={scale >= 3}>
                <ZoomInIcon />
              </IconButton>

              <Typography variant="body2" color="text.secondary">
                {Math.round(scale * 100)}%
              </Typography>

              {numPages > 0 && (
                <Typography
                  sx={{ ml: "auto" }}
                  variant="body2"
                  color="text.secondary"
                >
                  {numPages} pages
                </Typography>
              )}
            </Box>

            {/* Scroll Pages */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                px: 2,
                py: 3,
              }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={null}
              >
               {Array.from(new Array(numPages), (_, i) => (
  <Box
    key={`page-wrapper-${i + 1}`}
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      mb: 4,
    }}
  >

    {/* Header ABOVE page */}
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
        gap: 4,
        mb: 1,
        fontSize: "0.8rem",
        color: "#555",
      }}
    >
      <Typography variant="caption" fontWeight={600}>
        {documentName || 'Document'}
      </Typography>

      <Typography variant="caption">
        Page {i + 1}
      </Typography>
    </Box>

    {/* Actual PDF Page */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderRadius: 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow: "hidden",
      }}
    >
      <Page
        pageNumber={i + 1}
        scale={scale}
        renderTextLayer
        renderAnnotationLayer
      />
    </Box>

  </Box>
))}
              </Document>
            </Box>
          </>
        )}
      </DialogContent>

      {/* ================= FOOTER ================= */}
      <DialogActions sx={{ borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose}>Close</Button>

        <Button
          variant="contained"
          onClick={() => {
            if (!pdfUrl) return;
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = `${title}.pdf`;
            a.click();
          }}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
}
