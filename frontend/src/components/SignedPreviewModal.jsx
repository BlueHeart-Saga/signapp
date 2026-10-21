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
  Slider,
  Paper,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
import DescriptionIcon from "@mui/icons-material/Description";
import { Document, Page, pdfjs } from "react-pdf";
import {
  fetchPdfBlob,
  getDocumentFiles,
  downloadDocument,
  downloadSubDocument,
} from "../services/DocumentAPI";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

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
  const [scale, setScale] = useState(1.05);
  const [files, setFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [downloadAnchor, setDownloadAnchor] = useState(null);

  const containerRef = useRef(null);
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    if (!open || !documentId) return;

    let cancel = false;
    async function load() {
      setLoading(true);
      setError(null);
      setPdfBlob(null);
      setNumPages(null);
      setActivePage(1);

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

  function onDocumentLoadSuccess({ numPages: count }) {
    setNumPages(count);
  }

  const hasMultipleFiles = files && files.length > 1;

  const scrollToPage = (pageNum) => {
    setActivePage(pageNum);
    const el = document.getElementById(`signed-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(Number((s + 0.15).toFixed(2)), 3.0));
  const handleZoomOut = () => setScale((s) => Math.max(Number((s - 0.15).toFixed(2)), 0.6));

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
          borderRadius: "14px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Top Header */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
          py: 1.5,
          px: 2.5,
          bgcolor: "#ffffff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Tooltip title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}>
            <IconButton
              size="small"
              onClick={() => setSidebarOpen((v) => !v)}
              sx={{ color: sidebarOpen ? "#0f766e" : "#64748b" }}
            >
              <ViewSidebarIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
              {title || documentName || "Signed Document Preview"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: 600 }}>
              ✓ Completed Signatures & Form Fields
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={onClose} size="small" sx={{ color: "#64748b", "&:hover": { color: "#0f172a" } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Main Content Area: Sidebar + PDF Pages */}
      <DialogContent
        sx={{
          p: 0,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#f8fafc",
          flex: 1,
        }}
      >
        {/* ================= LEFT SIDEBAR (PAGES & THUMBNAILS) ================= */}
        {sidebarOpen && numPages && numPages > 0 && (
          <Box
            sx={{
              width: 220,
              minWidth: 220,
              borderRight: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              zIndex: 2,
            }}
          >
            {/* Sidebar Title */}
            <Box sx={{ p: 1.5, borderBottom: "1px solid #f1f5f9", bgcolor: "#f8fafc", display: "flex", alignItems: "center", gap: 1 }}>
              <DescriptionIcon sx={{ fontSize: 18, color: "#0f766e" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f766e" }}>
                Pages ({numPages})
              </Typography>
            </Box>

            {/* Sidebar Pages Scroll List */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {Array.from(new Array(numPages), (_, i) => {
                  const pageNum = i + 1;
                  const isActive = activePage === pageNum;

                  const thumbImgUrl = documentId
                    ? `${API_BASE_URL}/documents/${documentId}/pages/${pageNum}/thumbnail?width=200&height=280&token=${encodeURIComponent(token)}`
                    : null;

                  return (
                    <Box
                      key={`signed-thumb-page-${pageNum}`}
                      onClick={() => scrollToPage(pageNum)}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": { transform: "scale(1.02)" },
                      }}
                    >
                      <Paper
                        elevation={isActive ? 3 : 1}
                        sx={{
                          width: "100%",
                          aspectRatio: "1 / 1.414",
                          bgcolor: "#fff",
                          border: isActive ? "2px solid #0f766e" : "1px solid #cbd5e1",
                          borderRadius: "6px",
                          overflow: "hidden",
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {thumbImgUrl ? (
                          <img
                            src={thumbImgUrl}
                            alt={`Page ${pageNum}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}

                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 4,
                            right: 4,
                            bgcolor: isActive ? "#0f766e" : "rgba(15, 23, 42, 0.75)",
                            color: "#fff",
                            px: 0.8,
                            py: 0.2,
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          {pageNum}
                        </Box>
                      </Paper>
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 0.5,
                          color: isActive ? "#0f766e" : "#64748b",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: "11px",
                        }}
                      >
                        Page {pageNum}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}

        {/* ================= MAIN PDF VIEWER ================= */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* Zoom and Page Info Toolbar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 2,
              py: 1,
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              flexShrink: 0,
            }}
          >
            <IconButton onClick={handleZoomOut} disabled={scale <= 0.6} size="small">
              <ZoomOutIcon />
            </IconButton>

            <Slider
              value={scale}
              min={0.6}
              max={3}
              step={0.1}
              onChange={(_, v) => setScale(v)}
              sx={{
                width: 130,
                color: "#0f766e",
                "& .MuiSlider-thumb": { width: 14, height: 14 },
              }}
            />

            <IconButton onClick={handleZoomIn} disabled={scale >= 3} size="small">
              <ZoomInIcon />
            </IconButton>

            <Typography variant="body2" sx={{ color: "#475569", fontWeight: 600, minWidth: 45 }}>
              {Math.round(scale * 100)}%
            </Typography>

            {numPages && numPages > 0 ? (
              <Typography sx={{ ml: "auto" }} variant="body2" color="text.secondary">
                Page {activePage} of {numPages}
              </Typography>
            ) : null}
          </Box>

          {/* PDF Pages Scroll View */}
          <Box
            ref={containerRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              px: { xs: 1, sm: 3 },
              py: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
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

            {/* PDF Canvas Document */}
            {!loading && !error && pdfBlob && (
              <Document
                file={pdfBlob}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={null}
              >
                {Array.from(new Array(numPages || 0), (_, index) => {
                  const pageNum = index + 1;
                  const pageFile = files?.find((f) => pageNum >= f.start_page && pageNum <= f.end_page);
                  const currentFilename = pageFile?.filename || documentName || title || "Document";

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
                      <Box sx={{ display: "inline-flex", flexDirection: "column", width: "fit-content", maxWidth: "100%" }}>
                        {/* Page Top Label */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            mb: 1,
                            px: 0.5,
                            userSelect: "none",
                            gap: 2,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#475569",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 320,
                            }}
                            title={currentFilename}
                          >
                            📄 {currentFilename}
                          </Typography>

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
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Bottom Actions Toolbar */}
      <DialogActions
        sx={{
          p: 2,
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          bgcolor: "#ffffff",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {numPages || 0} pages total {hasMultipleFiles && `across ${files.length} separated files`}
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
