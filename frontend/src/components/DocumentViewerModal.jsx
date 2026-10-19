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
  Slider,
  CircularProgress,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Document, Page, pdfjs } from "react-pdf";
import {
  fetchPdfBlob,
  getDocumentFiles,
  downloadDocument,
  downloadSubDocument,
} from "../services/DocumentAPI";

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

export default function DocumentViewerModal({
  open,
  onClose,
  documentId,
  documentName,
  title = "Document Preview",
  url,
  page = null,
  files: initialFiles = null,
}) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.05);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Multi-file state
  const [files, setFiles] = useState(initialFiles || []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState(page || 1);
  const [downloadAnchor, setDownloadAnchor] = useState(null);

  const containerRef = useRef(null);
  const token = localStorage.getItem("token") || "";

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
          console.error("Failed to load PDF:", err);
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

  /* ===============================
     FETCH FILES FOR MULTI-FILE ENVELOPE
     =============================== */
  useEffect(() => {
    if (!open) return;

    if (initialFiles && initialFiles.length > 0) {
      setFiles(initialFiles);
      return;
    }

    if (documentId) {
      getDocumentFiles(documentId)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setFiles(data);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch document files:", err);
        });
    }
  }, [open, documentId, initialFiles]);

  /* ===============================
     INITIAL PAGE AUTO-SCROLL
     =============================== */
  useEffect(() => {
    if (!open || !numPages) return;

    const targetPage = page ? Number(page) : 1;
    if (targetPage > 0 && targetPage <= numPages) {
      setActivePage(targetPage);
      const timer = setTimeout(() => {
        scrollToPage(targetPage);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [open, numPages, page]);

  const scrollToPage = (pageNum) => {
    const el = document.getElementById(`modal-doc-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActivePage(pageNum);
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.6));

  const hasMultipleFiles = files && files.length > 1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
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
      {/* ================= HEADER ================= */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e2e8f0",
          py: 1.5,
          px: 2.5,
          backgroundColor: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Tooltip title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}>
            <IconButton
              size="small"
              onClick={() => setSidebarOpen((prev) => !prev)}
              sx={{ color: sidebarOpen ? "#0f766e" : "#64748b" }}
            >
              <ViewSidebarIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: { xs: 240, sm: 450, md: 700 },
              }}
            >
              {documentName || title || "Document Preview"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={onClose} size="small" sx={{ color: "#64748b" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ================= CONTENT AREA ================= */}
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          backgroundColor: "#f8fafc",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ================= LEFT SIDEBAR (PAGE THUMBNAILS) ================= */}
        {sidebarOpen && (
          <Box
            sx={{
              width: { xs: 160, sm: 200 },
              minWidth: { xs: 160, sm: 200 },
              backgroundColor: "#ffffff",
              borderRight: "1px solid #e2e8f0",
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
                      key={`thumb-page-${pageNum}`}
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

            {numPages > 0 && (
              <Typography sx={{ ml: "auto" }} variant="body2" color="text.secondary">
                Page {activePage} of {numPages}
              </Typography>
            )}
          </Box>

          {/* PDF Pages Scroll View */}
          <Box
            ref={containerRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              px: { xs: 1, sm: 3 },
              py: 3,
            }}
          >
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
                <Typography color="text.secondary">Loading document...</Typography>
              </Box>
            )}

            {error && !loading && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Typography color="error">{error}</Typography>
              </Box>
            )}

            {!loading && !error && pdfUrl && (
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages: count }) => setNumPages(count)}
                loading={null}
              >
                {Array.from(new Array(numPages), (_, i) => {
                  const pageNum = i + 1;
                  const pageFile = files?.find((f) => pageNum >= f.start_page && pageNum <= f.end_page);
                  const currentFilename = pageFile?.filename || documentName || title || "Document";

                  return (
                    <Box
                      key={`page-wrapper-${pageNum}`}
                      id={`modal-doc-page-${pageNum}`}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        mb: 5,
                        scrollMarginTop: "90px",
                      }}
                    >
                      <Box sx={{ display: "inline-flex", flexDirection: "column", width: "fit-content", maxWidth: "100%" }}>
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
                              color: "#64748b",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              minWidth: 0,
                            }}
                            title={currentFilename}
                          >
                            {currentFilename}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#64748b",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            Page {pageNum} of {numPages}
                          </Typography>
                        </Box>

                        {/* Actual PDF Page Canvas */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            backgroundColor: "#fff",
                            borderRadius: "4px",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
                            overflow: "hidden",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <Page
                            pageNumber={pageNum}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
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

      {/* ================= FOOTER ================= */}
      <DialogActions
        sx={{
          borderTop: "1px solid #e2e8f0",
          px: 2.5,
          py: 1.5,
          backgroundColor: "#fff",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {numPages} {numPages === 1 ? "page" : "pages"}
            {hasMultipleFiles && ` in ${files.length} separated files`}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button onClick={onClose} sx={{ color: "#64748b" }}>
            Close
          </Button>

          {/* Download Options (Split / Dropdown) */}
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            endIcon={hasMultipleFiles ? <ArrowDropDownIcon /> : null}
            onClick={(e) => {
              if (hasMultipleFiles) {
                setDownloadAnchor(e.currentTarget);
              } else if (pdfUrl) {
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = `${title || documentName || "document"}.pdf`;
                a.click();
              }
            }}
            sx={{
              backgroundColor: "#0f766e",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { backgroundColor: "#115e59" },
            }}
          >
            Download {hasMultipleFiles ? "Options" : "PDF"}
          </Button>

          {/* Download Menu for Multi-file Envelopes */}
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
                  if (pdfUrl) {
                    const a = document.createElement("a");
                    a.href = pdfUrl;
                    a.download = `${title || documentName || "envelope"}_combined.pdf`;
                    a.click();
                  }
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#0f172a" }}>
                    📄 Download Combined PDF
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
                    ZIP file with all individual documents separated
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
                Individual Files ({files.length}):
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
        </Box>
      </DialogActions>
    </Dialog>
  );
}
