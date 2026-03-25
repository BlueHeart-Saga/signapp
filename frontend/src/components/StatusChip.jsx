import React from "react";

export default function StatusChip({ status }) {
  const STATUS_MAP = {
    active:      { label: "Active",     color: "#28a745" },
    completed:   { label: "Completed",  color: "#007bff" },
    voided:      { label: "Voided",     color: "#dc3545" },
    deleted:     { label: "Deleted",    color: "#6c757d" },
    pending:     { label: "Pending",    color: "#ffc107", textColor: "#222" },
    draft:       { label: "Draft",      color: "#6f42c1" }
  };

  const meta = STATUS_MAP[status] || {
    label: status || "Unknown",
    color: "#999"
  };

  return (
    <span
      style={{
        background: meta.color,
        color: meta.textColor || "#fff",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        display: "inline-block",
        minWidth: "80px",
        textAlign: "center",
        userSelect: "none"
      }}
    >
      {meta.label}
    </span>
  );
}
