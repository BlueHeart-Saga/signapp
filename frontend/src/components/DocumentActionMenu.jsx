import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import "../style/DocumentActionMenu.css";

export default function DocumentActionMenu({ doc, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="action-menu-wrapper" ref={ref}>
      <button className="menu-trigger" onClick={() => setOpen(!open)}>
        <FaEllipsisV />
      </button>

      {open && (
        <div className="menu-dropdown">
          <button onClick={() => onAction("view", doc)}>View</button>
          <button onClick={() => onAction("download", doc)}>Download</button>
          <button onClick={() => onAction("signedPreview", doc)}>Signed Preview</button>
          <button onClick={() => onAction("timeline", doc)}>Timeline</button>

          <hr />

          {doc.status === "active" && (
            <>
              <button onClick={() => onAction("void", doc)}>Void</button>
              <button onClick={() => onAction("delete", doc)}>Delete</button>
            </>
          )}

          {doc.status === "voided" && (
            <>
              <button onClick={() => onAction("cancelVoid", doc)}>Cancel Void</button>
              <button onClick={() => onAction("delete", doc)}>Delete</button>
            </>
          )}

          {doc.status === "deleted" && (
            <>
              <button onClick={() => onAction("restore", doc)}>Restore</button>
              <button onClick={() => onAction("permanentDelete", doc)}>Permanent Delete</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
