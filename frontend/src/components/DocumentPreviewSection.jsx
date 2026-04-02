import React, { useState } from "react";
import DocumentViewerModal from "./DocumentViewerModal";
import DocumentThumbnail from "./DocumentThumbnail";
import { viewDocumentUrl } from "../services/DocumentAPI";
import "../style/DocumentPreviewSection.css";

import { FiClock, FiHash, FiUser } from "react-icons/fi";
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlinePaperAirplane,
  HiOutlineDocumentText
} from "react-icons/hi2";

export default function DocumentPreviewSection({ document }) {
  const [viewerOpen, setViewerOpen] = useState(false);

  if (!document?.id) return null;

  /* ================= STATUS CONFIG ================= */
  const statusConfig = {
    draft: {
      label: "Draft",
      color: "#6b7280",
      bg: "#f3f4f6",
      icon: <HiOutlineDocumentText size={28} />
    },
    sent: {
      label: "Sent",
      color: "#2563eb",
      bg: "#eff6ff",
      icon: <HiOutlinePaperAirplane size={28} />
    },
    in_progress: {
      label: "In Progress",
      color: "#f59e0b",
      bg: "#fffbeb",
      icon: <HiOutlineClock size={28} />
    },
    completed: {
      label: "Completed",
      color: "#16a34a",
      bg: "#ecfdf5",
      icon: <HiOutlineCheckCircle size={28} />
    },
    declined: {
      label: "Declined",
      color: "#dc2626",
      bg: "#fef2f2",
      icon: <HiOutlineXCircle size={28} />
    },
    expired: {
      label: "Expired",
      color: "#7c3aed",
      bg: "#f5f3ff",
      icon: <HiOutlineClock size={28} />
    }
  };

  const status = statusConfig[document.status] || statusConfig.draft;

  return (
    <section className="doc-preview-section">
      <div className="doc-preview-header">

        {/* LEFT – DOCUMENT THUMBNAIL */}
        <div className="doc-preview-thumb">
          <DocumentThumbnail
            url={viewDocumentUrl(document.id)}
            thumbnailUrl={document.preview_url}
            size={120}
            onClick={() => setViewerOpen(true)}
          />

          <button
            className="doc-preview-view-btn"
            onClick={() => setViewerOpen(true)}
          >
            View document
          </button>
        </div>

        {/* CENTER – DOCUMENT META */}
        <div className="doc-preview-meta">

          {/* DOCUMENT NAME */}
          <h3 className="doc-preview-title">
            {document.filename}
          </h3>

          {/* OWNER */}
          <div className="doc-preview-owner">
            Owned by{" "}
            <strong>{document.owner_email || "Unknown"}</strong>
          </div>

          {/* DESCRIPTION */}
          <div className="doc-preview-description">
            {document.description || "No description given"}
          </div>

          {/* DETAILS LIST */}
          <div className="doc-preview-details">
            <div className="doc-preview-detail-row">
              Submitted on{" "}
              {new Date(document.uploaded_at).toLocaleString()}
            </div>

            {document.completed_at && (
              <div className="doc-preview-detail-row">
                Completed on{" "}
                {new Date(document.completed_at).toLocaleString()}
              </div>
            )}

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
              color: status.color
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
        />
      )}
    </section>
  );
}
