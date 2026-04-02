import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import { useParams } from 'react-router-dom';
import API_BASE_URL from '../config/api';
// import documentAPI from '../services/documentAPI';
import CloseIcon from "@mui/icons-material/Close";

const documentAPI = {
  getOwnerPreviewUrl: (id) =>
    `${API_BASE_URL}/documents/${id}/owner-preview?token=${localStorage.getItem('token')}`,
};

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const OwnerPreview = () => {
  const { documentId } = useParams();
  const [reloadKey, setReloadKey] = useState(Date.now());
  const [numPages, setNumPages] = useState(1);
  const [docInfo, setDocInfo] = useState(null);

  useEffect(() => {
    // Fetch document info to get filename
    fetch(`${API_BASE_URL}/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => setDocInfo(data))
      .catch(err => console.error("Error fetching doc info:", err));
  }, [documentId]);

  // 🔁 Auto refresh every 5 seconds
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setReloadKey(Date.now());
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#f1f5f9',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 4,
        pb: 10
      }}
    >
      <Document
        key={reloadKey}
        file={{
          url: `${API_BASE_URL}/documents/${documentId}/owner-preview`,
          httpHeaders: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => console.error("PDF LOAD ERROR:", err)}
        loading={<CircularProgress sx={{ mt: 10 }} />}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Box
            key={`page_wrapper_${index + 1}`}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 8,
              width: '100%'
            }}
          >
            <Box sx={{ width: 'fit-content' }}>
              {/* Professional Header - Aligned to Page Width */}
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                  px: 0.5,
                  color: "#64748b",
                  userSelect: 'none'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase'
                  }}
                >
                  {docInfo?.filename || 'Owner Preview'}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 500
                  }}
                >
                  Page {index + 1} of {numPages}
                </Typography>
              </Box>

              {/* Actual PDF Page Container */}
              <Box
                sx={{
                  backgroundColor: "white",
                  borderRadius: "4px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0"
                }}
              >
                <Page
                  pageNumber={index + 1}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Box>
            </Box>
          </Box>
        ))}
      </Document>

      {/* Watermark hint */}
      <Typography
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          opacity: 0.5,
          fontSize: 12
        }}
      >
        Auto-refreshing preview
      </Typography>
    </Box>
  );
};

export default OwnerPreview;
