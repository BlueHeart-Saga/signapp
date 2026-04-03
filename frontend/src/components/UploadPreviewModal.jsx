import { Document, Page, pdfjs } from "react-pdf";
import { Modal, Box, Button, Typography, CircularProgress } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { renderAsync } from "docx-preview";

// PDF.js worker (REQUIRED)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function UploadPreviewModal({ open, file, onClose, onUpload }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [renderingDocx, setRenderingDocx] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const docxRef = useRef(null);

  const isPdf = file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith(".pdf");
  const isImage = file?.type?.startsWith("image/");
  const isDocx = file?.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file?.name?.toLowerCase().endsWith(".docx");

  // Handle URL creation and cleanup
  useEffect(() => {
    setNumPages(null);
    setImageUrl(null);
    setPdfUrl(null);
    setPreviewError(null);

    if (!open || !file) return;

    if (isImage) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    if (isPdf) {
      try {
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (err) {
        setPreviewError("Failed to create PDF preview link");
      }
    }
  }, [file, isImage, isPdf, open]);

  // Handle DOCX rendering
  useEffect(() => {
    if (open && isDocx && file && docxRef.current) {
      setRenderingDocx(true);
      setPreviewError(null);

      if (docxRef.current) {
        docxRef.current.innerHTML = "";
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setTimeout(async () => {
          if (!docxRef.current) {
            setRenderingDocx(false);
            return;
          }

          try {
            const arrayBuffer = e.target.result;
            await renderAsync(arrayBuffer, docxRef.current, null, {
              className: "docx-preview",
              inWrapper: true,
              useBase64URL: true,
              useOutline: false,
              debug: false,
            });
          } catch (err) {
            console.error("DOCX rendering error:", err);
            setPreviewError("Could not render Word document preview.");
          } finally {
            setRenderingDocx(false);
          }
        }, 200);
      };

      reader.onerror = () => {
        setPreviewError("Failed to read the file.");
        setRenderingDocx(false);
      };

      reader.readAsArrayBuffer(file);
    }
  }, [open, isDocx, file]);

  if (!file) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={styles.modal}>
        {/* Header */}
        <Typography variant="h6" sx={styles.header}>
          Preview: {file.name}
        </Typography>

        {/* Preview Area */}
        <Box sx={styles.previewArea}>
          {previewError && (
            <Box sx={{ textAlign: 'center', p: 4, color: 'error.main' }}>
              <Typography variant="body1" fontWeight={500}>{previewError}</Typography>
              <Typography variant="caption" color="text.secondary">You can still proceed with the upload.</Typography>
            </Box>
          )}

          {isPdf && pdfUrl && !previewError && (
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", py: 2 }}>
              <Document
                file={pdfUrl}
                loading={
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 2 }}>Loading PDF Pages...</Typography>
                  </Box>
                }
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={(err) => {
                  console.error("PDF Load Error:", err);
                  setPreviewError("Unable to load PDF for preview.");
                }}
              >
                {numPages === 0 && <Typography sx={{ py: 4 }}>No pages found in this PDF.</Typography>}
                {Array.from(new Array(numPages || 0), (_, index) => (
                  <Box key={`page_${index + 1}`} sx={styles.pdfPageBox}>
                    <Page
                      pageNumber={index + 1}
                      width={Math.min(window.innerWidth * 0.8, 550)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, color: "#64748b", fontWeight: 600 }}
                    >
                      Page {index + 1} of {numPages}
                    </Typography>
                  </Box>
                ))}
              </Document>
            </Box>
          )}

          {isDocx && !previewError && (
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", py: 2 }}>
              {renderingDocx && (
                <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={40} thickness={4} sx={{ color: "#0d9488" }} />
                  <Typography variant="body1" sx={{ color: "#475569", fontWeight: 500 }}>
                    Preparing Word preview...
                  </Typography>
                </Box>
              )}
              <div
                ref={docxRef}
                className="docx-preview-wrapper"
                style={{
                  width: "100%",
                  maxWidth: "800px",
                  backgroundColor: "#fff",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  borderRadius: "8px",
                  padding: "20px",
                  minHeight: "500px",
                  display: (renderingDocx || previewError) ? "none" : "block"
                }}
              />
            </Box>
          )}

          {isImage && imageUrl && (
            <Box sx={styles.imageWrapper}>
              <img
                src={imageUrl}
                alt="Preview"
                style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: "4px" }}
              />
            </Box>
          )}

          {!isPdf && !isImage && !isDocx && (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Preview not available for this file type ({file.name}).
              </Typography>
            </Box>
          )}
        </Box>

        {/* Actions */}
        <Box sx={styles.actions}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            fullWidth
            sx={{ borderRadius: "8px", textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={onUpload}
            fullWidth
            sx={{ borderRadius: "8px", textTransform: 'none', fontWeight: 600, bgcolor: "#0d9488" }}
          >
            Upload
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

const styles = {
  modal: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: {
      xs: "92%",
      sm: "85%",
      md: "70%",
      lg: "60%",
    },
    maxHeight: "90vh",
    bgcolor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  header: {
    px: 4,
    py: 2.5,
    borderBottom: "1px solid #f1f5f9",
    fontWeight: 700,
    fontSize: "1.25rem",
    color: "#1e293b",
  },

  previewArea: {
    flex: 1,
    p: 3,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    bgcolor: "#f8fafc",
    minHeight: "450px",
  },

  pdfPageBox: {
    mb: 4,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    p: 1,
    backgroundColor: "#fff",
    borderRadius: "4px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
  },

  imageWrapper: {
    maxWidth: "100%",
    maxHeight: "75vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    p: 1,
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 2.5,
    p: 3,
    bgcolor: "#fff",
    borderTop: "1px solid #f1f5f9",
  },
};
