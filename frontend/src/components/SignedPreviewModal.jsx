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
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Document, Page, pdfjs } from "react-pdf";
import { fetchPdfBlob } from "../services/DocumentAPI";

pdfjs.GlobalWorkerOptions.workerSrc = 
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function SignedPreviewModal({
  open,
  onClose,
  documentId,
  documentName,
  title = "Signed Document Preview",
  url,
}) {
  const [numPages, setNumPages] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (!open || !documentId) return;

    let cancel = false;
    async function load() {
      setLoading(true);
      setError(null);
      setPdfBlob(null);
      setNumPages(null);

      try {
        const blob = await fetchPdfBlob(url);
        if (cancel) return;
        setPdfBlob(blob);
      } catch (err) {
        if (!cancel) {
          setError(err);
          console.error("Failed to load signed PDF:", err);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();

    return () => {
      cancel = true;
    };
  }, [open, documentId, url]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: "90vh",
          maxHeight: "90vh",
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        pr: 2,
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
            disabled={scale <= 0.5}
          >
            -
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {Math.round(scale * 100)}%
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setScale(s => Math.min(s + 0.2, 3.0))}
            disabled={scale >= 3.0}
          >
            +
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        p: 0, 
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5'
      }}>
        {/* Loading State */}
        {loading && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 2
          }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading signed document...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 2,
            p: 3
          }}>
            <Typography color="error" variant="h6">
              No signed version available
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              This document hasn't been signed yet, or the signed version is not ready.
            </Typography>
          </Box>
        )}

        {/* PDF Viewer */}
        {!loading && !error && pdfBlob && (
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <Document
              file={pdfBlob}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={null}
            >
             {Array.from({ length: numPages || 0 }, (_, index) => (
  <Box
    key={`page_wrapper_${index + 1}`}
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      mb: 4
    }}
  >

    {/* Header ABOVE page */}
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        
        gap: 6,
        mb: 1,
        fontSize: "0.8rem",
        color: "#555"
      }}
    >
      <Typography variant="caption" fontWeight={600}>
        {documentName || "Signed Document"}
      </Typography>

      <Typography variant="caption">
        Page {index + 1} / {numPages}
      </Typography>
    </Box>

    {/* Actual PDF Page */}
    <Box
      sx={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        backgroundColor: "white",
        borderRadius: 1,
        overflow: "hidden"
      }}
    >
      <Page
        pageNumber={index + 1}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        canvasBackground="white"
      />
    </Box>

  </Box>
))}
            </Document>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {pdfBlob && (
          <Button 
            variant="contained" 
            onClick={() => {
              const url = URL.createObjectURL(pdfBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `signed-${title || 'document'}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            Download Signed
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}