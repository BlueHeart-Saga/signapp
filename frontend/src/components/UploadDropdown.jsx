import React, { useRef, useState } from "react";
import {
  FaUpload,
  FaCloudUploadAlt,
  FaChevronDown,
  FaFileAlt
} from "react-icons/fa";
import AutoAwesome from "@mui/icons-material/AutoAwesome";

export default function UploadDropdown({
  onLocalSelect,
  onCloudSelect,
  onTemplate,
  onAITemplate,
  disabled = false,
  label = "Add document",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  return (
    <div className="upload-dropdown-wrapper" ref={ref}>
      <button
        className="upload-main-btn"
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <FaUpload />
        {label}
        <FaChevronDown />
      </button>

      {open && (
        <div className="upload-dropdown-menu">
          <button
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              onLocalSelect();
            }}
          >
            <FaFileAlt />
            Local file
          </button>

          <button
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              onCloudSelect();
            }}
          >
            <FaCloudUploadAlt />
            Cloud storage
          </button>

          <button
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              onTemplate();
            }}
          >
            <FaFileAlt />
            Use template
          </button>

          <button
            className="dropdown-item ai"
            onClick={() => {
              setOpen(false);
              onAITemplate();
            }}
          >
            <AutoAwesome />
            AI templates
          </button>
        </div>
      )}
    </div>
  );
}
