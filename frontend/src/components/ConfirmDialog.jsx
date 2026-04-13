import React from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
  loading = false,
  showCancel = true,
}) {
  if (!open) return null;

  const colors = {
    primary: "rgb(46, 125, 50)",
    primaryDark: "rgb(27, 94, 32)",
    danger: "rgb(211, 47, 47)",
    border: "rgba(0,0,0,0.15)",
    backdrop: "rgba(0,0,0,0.35)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: colors.backdrop,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          width: "420px",
          maxWidth: "90%",
          background: "#fff",
          borderRadius: "14px",
          padding: "22px 24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.15s ease-out",
        }}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: "10px",
            fontSize: "18px",
            fontWeight: 600,
            color: danger ? colors.danger : "#111",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: 0,
            marginBottom: "20px",
            fontSize: "14px",
            color: "rgba(0,0,0,0.65)",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          {showCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: danger ? colors.danger : colors.primary,
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
              opacity: loading ? 0.7 : 1,
              transition: "0.15s ease",
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.background = danger
                  ? "rgb(183, 28, 28)"
                  : colors.primaryDark;
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.background = danger
                  ? colors.danger
                  : colors.primary;
              }
            }}
          >
            {loading ? "Please wait…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
