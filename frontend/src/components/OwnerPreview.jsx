import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import { useParams } from 'react-router-dom';
import  API_BASE_URL  from '../config/api';
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
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        pt: 4
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
  loading={<CircularProgress />}
>



        {Array.from(new Array(numPages), (el, index) => (
  <Page
    key={`page_${index + 1}`}
    pageNumber={index + 1}
    renderTextLayer={false}
    renderAnnotationLayer={false}
  />
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
