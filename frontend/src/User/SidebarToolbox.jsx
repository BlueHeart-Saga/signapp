// src/User/DocumentBuilder.jsx
import React, { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Rnd } from "react-rnd";
import SidebarToolbox from "./SidebarToolbox";
import SignatureModal from "./SignatureModal";
import { saveTemplate } from "../services/TemplateAPI";
import "../style/documentBuilder.css";

// ✅ Set up correct worker for react-pdf v9+
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentBuilder = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfURL, setPdfURL] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const workspaceRef = useRef();

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfURL) URL.revokeObjectURL(pdfURL);
    };
  }, [pdfURL]);

  // --- Handle PDF Upload ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }
    if (pdfURL) URL.revokeObjectURL(pdfURL);

    const blobURL = URL.createObjectURL(file);
    setPdfFile(file);
    setPdfURL(blobURL);
    setFields([]);
    setSelectedField(null);
    setCurrentPage(1);
  };

  // --- Add draggable field ---
  const handleAddField = (type) => {
    if (type === "signature") {
      setShowSignaturePad(true);
      return;
    }

    const newField = {
      id: Date.now(),
      type,
      x: 100,
      y: 100,
      width: type === "text" ? 200 : 150,
      height: type === "text" ? 80 : 40,
      page: currentPage,
      value: "",
      fontSize: 16,
      color: "#000000",
      backgroundColor: "#ffffff",
      border: "1px dashed #007bff",
      placeholder: type === "text" ? "Enter text here..." : "Input field",
    };
    setFields((prev) => [...prev, newField]);
    setSelectedField(newField.id);
  };

  // --- Update field ---
  const updateField = (id, updates) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  // --- Delete field ---
  const handleDeleteField = () => {
    if (selectedField) {
      setFields((prev) => prev.filter((f) => f.id !== selectedField));
      setSelectedField(null);
    }
  };

  // --- Save template ---
  const handleSaveTemplate = async () => {
    if (!pdfFile) return alert("Upload a PDF first!");
    try {
      const data = {
        name: pdfFile.name,
        fields,
        uploadedAt: new Date(),
      };
      await saveTemplate(data);
      alert(" Template saved successfully!");
    } catch (err) {
      console.error("❌ Save Template Error:", err);
      alert("Error saving template.");
    }
  };

  // --- Zoom controls ---
  const handleZoom = (delta) => setZoom((z) => Math.min(3, Math.max(0.5, z + delta)));
  const handleZoomTo = (v) => setZoom(Math.min(3, Math.max(0.5, v)));

  // --- Handle signature save ---
  const handleSignatureSave = (sig) => {
    const sigField = {
      id: Date.now(),
      type: "signature",
      value: sig,
      x: 120,
      y: 150,
      width: 200,
      height: 80,
      page: currentPage,
    };
    setFields((prev) => [...prev, sigField]);
    setSelectedField(sigField.id);
    setShowSignaturePad(false);
  };

  const selectedFieldData = fields.find((f) => f.id === selectedField);

  return (
    <div className="document-builder-container">
      <SidebarToolbox onAdd={handleAddField} />

      <div className="document-editor">
        {/* Toolbar */}
        <div className="editor-toolbar">
          <label className="file-upload-btn">
            📁 Upload PDF
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>

          <div className="toolbar-section">
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            <button onClick={() => handleZoom(-0.2)}>−</button>
            <button onClick={() => handleZoomTo(1)}>100%</button>
            <button onClick={() => handleZoom(0.2)}>+</button>
          </div>

          <div className="toolbar-section">
            <span>Page:</span>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              disabled={numPages === 0}
            >
              {Array.from({ length: numPages }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          {selectedField && (
            <button className="delete-btn" onClick={handleDeleteField}>
              🗑️ Delete Field
            </button>
          )}

          <button onClick={handleSaveTemplate} className="save-btn">
            💾 Save Template
          </button>
        </div>

        {/* PDF Canvas */}
        <div className="document-canvas" ref={workspaceRef}>
          {pdfURL ? (
            <div className="pdf-wrapper">
              <Document
                file={pdfURL}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<div className="pdf-loading">Loading PDF...</div>}
              >
                <div
                  className="page-container"
                  style={{
                    position: "relative",
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                >
                  <Page
                    pageNumber={currentPage}
                    width={800}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />

                  {/* Overlay fields on top of PDF canvas */}
                  <div className="canvas-overlay">
                    {fields
                      .filter((f) => f.page === currentPage)
                      .map((field) => (
                        <Rnd
                          key={field.id}
                          size={{ width: field.width, height: field.height }}
                          position={{ x: field.x, y: field.y }}
                          onDragStop={(e, d) => updateField(field.id, { x: d.x, y: d.y })}
                          onResizeStop={(e, dir, ref, delta, pos) =>
                            updateField(field.id, {
                              width: parseInt(ref.style.width),
                              height: parseInt(ref.style.height),
                              ...pos,
                            })
                          }
                          bounds="parent"
                          onClick={() => setSelectedField(field.id)}
                          className={`field-item ${selectedField === field.id ? "selected" : ""}`}
                          style={{
                            fontSize: field.fontSize,
                            color: field.color,
                            backgroundColor: field.backgroundColor,
                            border: field.border,
                          }}
                        >
                          {field.type === "text" && (
                            <textarea
                              value={field.value}
                              placeholder={field.placeholder}
                              onChange={(e) =>
                                updateField(field.id, { value: e.target.value })
                              }
                              style={{
                                fontSize: field.fontSize,
                                color: field.color,
                                backgroundColor: field.backgroundColor,
                                width: "100%",
                                height: "100%",
                                border: "none",
                                outline: "none",
                                resize: "none",
                              }}
                            />
                          )}

                          {field.type === "input" && (
                            <input
                              type="text"
                              placeholder={field.placeholder}
                              value={field.value}
                              onChange={(e) =>
                                updateField(field.id, { value: e.target.value })
                              }
                              style={{
                                width: "100%",
                                height: "100%",
                                border: "1px solid #ccc",
                                padding: "5px",
                                fontSize: field.fontSize,
                              }}
                            />
                          )}

                          {field.type === "date" && (
                            <input
                              type="date"
                              value={field.value}
                              onChange={(e) =>
                                updateField(field.id, { value: e.target.value })
                              }
                              style={{
                                width: "100%",
                                height: "100%",
                                border: "1px solid #ccc",
                                padding: "5px",
                              }}
                            />
                          )}

                          {field.type === "signature" && (
                            <img
                              src={field.value}
                              alt="Signature"
                              style={{ width: "100%", height: "100%" }}
                            />
                          )}
                        </Rnd>
                      ))}
                  </div>
                </div>
              </Document>
            </div>
          ) : (
            <div className="upload-placeholder">
              <h3>📄 PDF Template Builder</h3>
              <p>Upload a PDF to start designing your template</p>
              <label className="upload-btn">
                Choose PDF File
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignaturePad && (
        <SignatureModal
          onClose={() => setShowSignaturePad(false)}
          onSave={handleSignatureSave}
        />
      )}
    </div>
  );
};

export default DocumentBuilder;
