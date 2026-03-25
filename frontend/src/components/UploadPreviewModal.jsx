import { Document, Page } from "react-pdf";
import { Modal, Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";

export default function UploadPreviewModal({ open, file, onClose, onUpload }) {
  const [imageUrl, setImageUrl] = useState(null);

  const isPdf = file?.type === "application/pdf";
  const isImage = file?.type?.startsWith("image/");

  // Create / cleanup image preview URL
  useEffect(() => {
    if (isImage && file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  if (!file) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={styles.modal}>
        {/* Header */}
        <Typography variant="h6" sx={styles.header}>
          Preview Document
        </Typography>

        {/* Preview Area */}
        <Box sx={styles.previewArea}>
          {isPdf && (
            <Document file={file} loading="Loading preview...">
              <Page
                pageNumber={1}
                width={Math.min(window.innerWidth * 0.8, 600)}
              />
            </Document>
          )}

          {isImage && imageUrl && (
            <Box sx={styles.imageWrapper}>
              <img
                src={imageUrl}
                alt="Preview"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            </Box>
          )}

          {!isPdf && !isImage && (
            <Typography variant="body2" color="text.secondary">
              Preview not available for this file type.
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box sx={styles.actions}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={onUpload}
            fullWidth
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
      sm: "80%",
      md: "65%",
      lg: "50%",
    },
    maxHeight: "90vh",
    bgcolor: "#fff",
    borderRadius: 2,
    boxShadow: 24,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  header: {
    px: 3,
    py: 2,
    borderBottom: "1px solid #e0e0e0",
    fontWeight: 600,
  },

  previewArea: {
    flex: 1,
    p: 2,
    overflow: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    bgcolor: "#fafafa",
  },

  imageWrapper: {
    maxWidth: "100%",
    maxHeight: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 2,
    p: 2,
    borderTop: "1px solid #e0e0e0",
  },
};
