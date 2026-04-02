import React, { useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import { fetchPdfBlob } from "../services/DocumentAPI";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

export default function DocumentThumbnail({
  url,
  thumbnailUrl,
  size = 100,
  onClick
}) {
  const [pdfBlob, setPdfBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // If we have a direct thumbnail URL (image), we don't need to fetch the PDF blob
    if (thumbnailUrl && !imageError) {
      setLoading(false);
      return;
    }

    let cancel = false;
    const loadPdf = async () => {
      if (!url) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const blob = await fetchPdfBlob(url);
        if (!cancel) setPdfBlob(blob);
      } catch (err) {
        console.error("Thumbnail load failed", err);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    loadPdf();
    return () => (cancel = true);
  }, [url, thumbnailUrl, imageError]);

  const containerStyle = {
    width: size,
    height: size * 1.414,
    minWidth: size,
    minHeight: size * 1.414,
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    position: "relative",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
    "&:hover": {
      borderColor: "#cbd5e1",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
    }
  };

  return (
    <Box onClick={onClick} sx={containerStyle} className="doc-thumbnail-wrapper">
      {/* Skeleton / Loading UI */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f1f5f9',
            animation: 'skeletonPulse 1.8s infinite ease-in-out',
            '@keyframes skeletonPulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.6 },
            }
          }}
        >
          <CircularProgress size={24} thickness={4} sx={{ color: '#cbd5e1' }} />
        </Box>
      )}

      {/* Image-based Fast Preview */}
      {thumbnailUrl && !imageError && !loading && (
        <img
          src={thumbnailUrl}
          alt="Preview"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImageError(true)}
        />
      )}

      {/* PDF-based Fallback View */}
      {(imageError || !thumbnailUrl) && !loading && pdfBlob && (
        <Box sx={{
          transform: `scale(${size / 170})`,
          transformOrigin: 'center center',
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Document file={pdfBlob} loading={null}>
            <Page
              pageNumber={1}
              width={170}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </Box>
      )}

      {/* No Preview Fallback */}
      {!loading && !pdfBlob && (!thumbnailUrl || imageError) && (
        <Box sx={{ color: '#94a3b8', textAlign: 'center', p: 1 }}>
          <small style={{ fontSize: '10px' }}>Preview unavailable</small>
        </Box>
      )}
    </Box>
  );
}
