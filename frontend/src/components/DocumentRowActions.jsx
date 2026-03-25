// src/components/DocumentRowActions.jsx
import React, { useState } from "react";
import StatusChip from "./StatusChip";
import DocumentViewerModal from "./DocumentViewerModal";
import SignedPreviewModal from "./SignedPreviewModal";
import TimelineDrawer from "./TimelineDrawer";
import { voidDocument, restoreDocument, softDeleteDocument, downloadBest } from "../services/DocumentAPI";

export default function DocumentRowActions({ doc, onRefresh }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [signedOpen, setSignedOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const handleView = (id) => { setActiveId(id); setViewerOpen(true); };
  const handleSignedPreview = (id) => { setActiveId(id); setSignedOpen(true); };

  async function handleVoid() {
    if (!window.confirm("Void this document? This will stop further signing.")) return;
    try {
      await voidDocument(doc.id);
      alert("Document voided");
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Void failed");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Move document to trash?")) return;
    try {
      await softDeleteDocument(doc.id);
      alert("Moved to trash");
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  }

  async function handleRestore() {
    try {
      await restoreDocument(doc.id);
      alert("Restored");
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Restore failed");
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <StatusChip status={doc.status} />

      <button className="btn btn-sm" onClick={() => handleView(doc.id)}>View</button>

      <button className="btn btn-sm" onClick={() => downloadBest(doc.id, doc.filename)}>Download</button>

      <button className="btn btn-sm" onClick={() => handleSignedPreview(doc.id)}>Signed Preview</button>

      {doc.status !== "deleted" && (
        <>
          <button className="btn btn-warning btn-sm" onClick={handleVoid}>Void</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
        </>
      )}

      {doc.status === "deleted" && (
        <button className="btn btn-success btn-sm" onClick={handleRestore}>Restore</button>
      )}

      <button className="btn btn-outline btn-sm" onClick={() => { setActiveId(doc.id); setTimelineOpen(true); }}>Timeline</button>

      {/* Modals & Drawer */}
      <DocumentViewerModal open={viewerOpen} onClose={() => setViewerOpen(false)} documentId={activeId} />
      <SignedPreviewModal open={signedOpen} onClose={() => setSignedOpen(false)} documentId={activeId} />
      <TimelineDrawer open={timelineOpen} onClose={() => setTimelineOpen(false)} documentId={activeId} />
    </div>
  );
}
