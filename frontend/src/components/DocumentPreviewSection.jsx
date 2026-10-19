import React, { useState } from "react";
import DocumentViewerModal from "./DocumentViewerModal";
import DocumentThumbnail from "./DocumentThumbnail";
import { viewDocumentUrl } from "../services/DocumentAPI";
import FilenameDisplay from "./FilenameDisplay";
import "../style/DocumentPreviewSection.css";

import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlinePaperAirplane,
  HiOutlineDocumentText,
} from "react-icons/hi2";

export default function DocumentPreviewSection({ document }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeViewerPage, setActiveViewerPage] = useState(1);

  if (!document?.id) return null;

  /* ================= STATUS CONFIG ================= */
  const statusConfig = {
    draft: {
      label: "Draft",
      color: "#6b7280",
      bg: "#f3f4f6",
      icon: <HiOutlineDocumentText size={28} />,
    },
    sent: {
      label: "Sent",
      color: "#2563eb",
      bg: "#eff6ff",
      icon: <HiOutlinePaperAirplane size={28} />,
    },
    in_progress: {
      label: "In Progress",
      color: "#f59e0b",
      bg: "#fffbeb",
      icon: <HiOutlineClock size={28} />,
    },
    completed: {
      label: "Completed",
      color: "#16a34a",
      bg: "#ecfdf5",
      icon: <HiOutlineCheckCircle size={28} />,
    },
    declined: {
      label: "Declined",
      color: "#dc2626",
      bg: "#fef2f2",
      icon: <HiOutlineXCircle size={28} />,
    },
    expired: {
      label: "Expired",
      color: "#7c3aed",
      bg: "#f5f3ff",
      icon: <HiOutlineClock size={28} />,
    },
  };

  const status = statusConfig[document.status] || statusConfig.draft;

  const versionKey =
    document.updated_at ||
    document.finalized_at ||
    document.uploaded_at ||
    document.created_at ||
    "";
  const versionTimestamp = versionKey ? new Date(versionKey).getTime() : "";
  const resolvedThumbnailUrl = document.preview_url
    ? `${document.preview_url}${document.preview_url.includes("?") ? "&" : "?"}v=${versionTimestamp || document.id}`
    : null;

  const files = document.files || [];

  const handleOpenViewerAtPage = (pageNum = 1) => {
    setActiveViewerPage(pageNum);
    setViewerOpen(true);
  };

  return (
    <section className="doc-preview-section">
      <div className="doc-preview-header">
        {/* LEFT – MAIN DOCUMENT THUMBNAIL */}
        <div className="doc-preview-thumb">
          <DocumentThumbnail
            url={viewDocumentUrl(document.id)}
            thumbnailUrl={resolvedThumbnailUrl}
            size={120}
            onClick={() => handleOpenViewerAtPage(1)}
          />

          <button
            className="doc-preview-view-btn"
            onClick={() => handleOpenViewerAtPage(1)}
          >
            View document
          </button>
        </div>

        {/* CENTER – DOCUMENT META */}
        <div className="doc-preview-meta">
          {/* DOCUMENT NAME */}
          <h3 className="doc-preview-title">
            <FilenameDisplay
              filename={document.filename}
              sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}
            />
          </h3>

          {/* OWNER */}
          <div className="doc-preview-owner">
            Owned by <strong>{document.owner_email || "Unknown"}</strong>
          </div>

          {/* DESCRIPTION */}
          <div className="doc-preview-description">
            {document.description || "No description given"}
          </div>

          {/* DETAILS LIST */}
          <div className="doc-preview-details">
            <div className="doc-preview-detail-row">
              Submitted on {new Date(document.uploaded_at).toLocaleString()}
            </div>

            {document.completed_at && (
              <div className="doc-preview-detail-row">
                Completed on {new Date(document.completed_at).toLocaleString()}
              </div>
            )}

            <div className="doc-preview-detail-row">
              Total Pages: <strong>{document.page_count || 1}</strong>
            </div>

            <div className="doc-preview-detail-row">
              Status is{" "}
              <span
                className="doc-preview-status-text"
                style={{ color: status.color }}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT – STATUS BADGE */}
        <div className="doc-preview-status-panel">
          <div
            className="doc-preview-status-image"
            style={{
              backgroundColor: status.bg,
              color: status.color,
            }}
          >
            {status.icon}
          </div>

          <div
            className="doc-preview-status-label"
            style={{ color: status.color }}
          >
            {status.label}
          </div>
        </div>
      </div>

      {/* VIEWER MODAL */}
      {viewerOpen && (
        <DocumentViewerModal
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          documentId={document.id}
          url={viewDocumentUrl(document.id)}
          documentName={document.filename}
          page={activeViewerPage}
          files={files}
        />
      )}
    </section>
  );
}
