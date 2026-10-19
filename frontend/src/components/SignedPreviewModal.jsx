import React, { useEffect, useState, useRef } from "react";
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
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Document, Page, pdfjs } from "react-pdf";
import {
  fetchPdfBlob,
  getDocumentFiles,
  downloadDocument,
  downloadSubDocument,
} from "../services/DocumentAPI";

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
  const [files, setFiles] = useState([]);
  const [downloadAnchor, setDownloadAnchor] = useState(null);

  const containerRef = useRef(null);

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

  // Load envelope sub-files
  useEffect(() => {
    if (!open || !documentId) return;

    getDocumentFiles(documentId)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFiles(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch envelope files for signed preview:", err);
      });
  }, [open, documentId]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const hasMultipleFiles = files && files.length > 1;

  const scrollToPage = (pageNum) => {
    const el = document.getElementById(`signed-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: "92vh",
          maxHeight: "92vh",
          borderRadius: "12px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
          py: 1.5,
          px: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
              {title || documentName || "Signed Document Preview"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => setScale((s) => Math.max(s - 0.15, 0.5))}
            disabled={scale <= 0.5}
          >
            -
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40, textAlign: "center" }}>
            {Math.round(scale * 100)}%
          </Typography>
          <IconButton
            size="small"
            onClick={() => setScale((s) => Math.min(s + 0.15, 3.0))}
            disabled={scale >= 3.0}
          >
            +
          </IconButton>
          <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f8fafc",
        }}
      >
        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 2,
            }}
          >
            <CircularProgress sx={{ color: "#0f766e" }} />
            <Typography variant="body2" color="text.secondary">
              Loading signed document...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 2,
              p: 3,
            }}
          >
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
          <Box
            ref={containerRef}
            sx={{
              flex: 1,
              overflow: "auto",
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Document file={pdfBlob} onLoadSuccess={onDocumentLoadSuccess} loading={null}>
              {Array.from({ length: numPages || 0 }, (_, index) => {
                const pageNum = index + 1;

                return (
                  <Box
                    key={`signed_page_wrapper_${pageNum}`}
                    id={`signed-page-${pageNum}`}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      mb: 5,
                      scrollMarginTop: "80px",
                    }}
                  >
                    <Box sx={{ width: "fit-content" }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mb: 1,
                          userSelect: "none",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          Page {pageNum} of {numPages}
                        </Typography>
                      </Box>

                      {/* Actual PDF Page Container */}
                      <Box
                        sx={{
                          backgroundColor: "white",
                          borderRadius: "4px",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
                          overflow: "hidden",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <Page
                          pageNumber={pageNum}
                          scale={scale}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          canvasBackground="white"
                        />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Document>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {numPages || 0} pages total {hasMultipleFiles && ` across ${files.length} separated files`}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button onClick={onClose} color="inherit">
            Close
          </Button>

          {pdfBlob && (
            <>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                endIcon={hasMultipleFiles ? <ArrowDropDownIcon /> : null}
                onClick={(e) => {
                  if (hasMultipleFiles) {
                    setDownloadAnchor(e.currentTarget);
                  } else {
                    const downloadUrl = URL.createObjectURL(pdfBlob);
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = `signed-${title || documentName || "document"}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(downloadUrl);
                  }
                }}
                sx={{
                  backgroundColor: "#0f766e",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#115e59" },
                }}
              >
                Download Signed {hasMultipleFiles ? "Options" : ""}
              </Button>

              {hasMultipleFiles && (
                <Menu
                  anchorEl={downloadAnchor}
                  open={Boolean(downloadAnchor)}
                  onClose={() => setDownloadAnchor(null)}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  PaperProps={{
                    sx: { width: 320, borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setDownloadAnchor(null);
                      const downloadUrl = URL.createObjectURL(pdfBlob);
                      const a = document.createElement("a");
                      a.href = downloadUrl;
                      a.download = `signed-${title || documentName || "envelope"}_combined.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(downloadUrl);
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: "#0f172a" }}>
                        📄 Download Combined Signed PDF
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        All {numPages} pages merged as single document
                      </Typography>
                    </Box>
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      setDownloadAnchor(null);
                      if (documentId) {
                        downloadDocument(documentId, documentName || "envelope", "package");
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: "#0f172a" }}>
                        📦 Download Package (ZIP)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ZIP file containing all separated signed documents
                      </Typography>
                    </Box>
                  </MenuItem>

                  <Divider sx={{ my: 1 }} />

                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 0.5,
                      display: "block",
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "10px",
                    }}
                  >
                    Individual Signed Files ({files.length}):
                  </Typography>

                  {files.map((file, idx) => (
                    <MenuItem
                      key={file.id || idx}
                      onClick={() => {
                        setDownloadAnchor(null);
                        if (documentId && file.id) {
                          downloadSubDocument(documentId, file.id, file.filename);
                        }
                      }}
                      sx={{ py: 1 }}
                    >
                      <Box sx={{ minWidth: 0, width: "100%" }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            color: "#334155",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={file.filename}
                        >
                          ⬇️ {file.filename}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {file.page_range} ({file.pages} {file.pages === 1 ? "page" : "pages"})
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
              )}
            </>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
