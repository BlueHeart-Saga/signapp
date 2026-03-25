import React, { useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import { fetchPdfBlob } from "../services/DocumentAPI";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

export default function DocumentThumbnail({
  url,
  size = 100,
  onClick
}) {
  const [pdfBlob, setPdfBlob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;

    const loadPdf = async () => {
      try {
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
  }, [url]);

  return (
    <Box
      onClick={onClick}
      sx={{
        width: "100%",
        height: "100%",
        borderRadius: 1,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {loading && <CircularProgress size={18} />}

      {!loading && pdfBlob && (
        <Document file={pdfBlob} loading={null}>
          <Page
            pageNumber={1}
            width={170} 
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
          
        </Document>
      )}
      
    </Box>
  );
}
