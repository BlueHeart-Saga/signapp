import React from "react";

export default function StatusChip({ status }) {
  const STATUS_MAP = {
    draft: {
      label: "Draft",
      color: "#f1f5f9",
      textColor: "#475569",
      borderColor: "#e2e8f0"
    },
    sent: {
      label: "Sent",
      color: "#eff6ff",
      textColor: "#2563eb",
      borderColor: "#dbeafe"
    },
    in_progress: {
      label: "In Progress",
      color: "#fffbeb",
      textColor: "#d97706",
      borderColor: "#fef3c7"
    },
    completed: {
      label: "Completed",
      color: "#ecfdf5",
      textColor: "#059669",
      borderColor: "#d1fae5"
    },
    declined: {
      label: "Declined",
      color: "#fef2f2",
      textColor: "#dc2626",
      borderColor: "#fee2e2"
    },
    voided: {
      label: "Voided",
      color: "#f9fafb",
      textColor: "#9ca3af",
      borderColor: "#f3f4f6"
    },
    deleted: {
      label: "Deleted",
      color: "#1f2937",
      textColor: "#ffffff",
      borderColor: "#111827"
    },
    active: {
      label: "Active",
      color: "#f0fdf4",
      textColor: "#16a34a",
      borderColor: "#dcfce7"
    },
    expired: {
      label: "Expired",
      color: "#faf5ff",
      textColor: "#7c3aed",
      borderColor: "#f3e8ff"
    }
  };

  const meta = STATUS_MAP[status?.toLowerCase()] || {
    label: status || "Unknown",
    color: "#f8fafc",
    textColor: "#94a3b8",
    borderColor: "#e2e8f0"
  };

  return (
    <span
      className={`status-chip-pro status-${status?.toLowerCase()}`}
      style={{
        background: meta.color,
        color: meta.textColor,
        border: `1px solid ${meta.borderColor}`,
        padding: "4px 12px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "90px",
        textAlign: "center",
        userSelect: "none"
      }}
    >
      {meta.label}
    </span>
  );
}
