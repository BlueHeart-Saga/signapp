// PrepareSendRecipients.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaUserPlus,
  FaTrash,
  FaUsers,
  FaUser,
  FaEnvelope,
  FaSignature,
  FaUserCheck,
  FaEye,
  FaFileAlt,
  FaUserFriends,
  FaChevronRight,
  FaArrowLeft,
  FaPlus,
  FaCheck,
  FaSearch,
  FaFilePdf,
  FaExpand,
  FaEdit,
  FaInfoCircle,
  FaCog,
  FaCalendarAlt,
  FaClock,
  FaCopy,
  FaTimes,
  FaEllipsisV,
  FaCheckCircle,
  FaExclamationCircle,
  FaInfo,
  FaCloudUploadAlt
} from 'react-icons/fa';
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";
import { CircularProgress } from '@mui/material';
import FilenameDisplay from '../components/FilenameDisplay';
import { FaPen, FaExchangeAlt } from "react-icons/fa";
import { FaGripVertical } from 'react-icons/fa';
import { recipientAPI, RecipientRoles, RoleDescriptions } from '../services/api';
import DocumentViewerModal from '../components/DocumentViewerModal';
import { viewDocumentUrl, addFileToDocument, getDocumentStatus } from '../services/DocumentAPI';
import '../style/PrepareSendRecipients.css';
import DocumentThumbnail from "../components/DocumentThumbnail";
import { FaPaperPlane, FaEnvelopeOpenText } from 'react-icons/fa';
import { contactAPI } from "../services/contactAPI";
import { FaAddressBook } from "react-icons/fa";
import { setPageTitle } from "../utils/pageTitle";
import ConfirmDialog from '../components/ConfirmDialog';
import { useParams } from "react-router-dom";
import api from '../services/api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";
// const token = localStorage.getItem("token");

function DocumentFilesPanel({ documentId, onPreview }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!documentId) return;

    fetch(`${API_BASE_URL}/documents/${documentId}/files`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(data => {
        const rawFiles = Array.isArray(data) ? data : data.files || [];
        const unique = [];
        const seenOrders = new Set();
        for (const f of rawFiles) {
          const ord = f.order ?? 1;
          if (!seenOrders.has(ord)) {
            seenOrders.add(ord);
            unique.push(f);
          }
        }
        setFiles(unique);
      })
      .catch(console.error);
  }, [documentId]);

  return (
    <div className="zoho-files-panel">
      {Array.isArray(files) && files.map((file) => (
        <DocumentFileBlock
          key={file.id}
          documentId={documentId}
          file={file}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}


function DocumentFileBlock({ documentId, file, onPreview }) {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    fetch(
      `${API_BASE_URL}/documents/${documentId}/files/${file.id}/thumbnails`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
      .then(res => res.json())
      .then(data => setPages(Array.isArray(data.pages) ? data.pages : []));
  }, [file.id, documentId]);

  return (
    <div className="zoho-file-block">
      {/* <div className="zoho-file-header">
        <span className="zoho-file-name">{file.filename}</span>
        <span className="zoho-file-pages">
          Pages {file.start_page}–{file.end_page}
        </span>
      </div> */}

      <div className="zoho-page-thumbs">
        {pages.map(p => (
          <div
            key={p.page_number}
            className="zoho-thumb"
            onClick={() => onPreview(p.page_number)}
          >
            <img
              src={`data:image/png;base64,${p.thumbnail}`}
              alt={`Page ${p.page_number}`}
            />
            <span className="zoho-page-number">{p.page_number}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function ZohoFileCard({
  file,
  documentId,
  provided,
  onReload,
  selectedFiles,
  setSelectedFiles,
  onPreview,
  setConfirmDialog,
  onReplace
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const rawFilename = file?.filename || file?.name || "Document.pdf";
  const [name, setName] = useState(rawFilename.replace(/\.pdf$/i, ""));
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  useEffect(() => {
    setName((file?.filename || file?.name || "Document.pdf").replace(/\.pdf$/i, ""));
  }, [file?.filename, file?.name]);

  const saveRename = async () => {
    if (!name.trim()) return setRenaming(false);

    try {
      await fetch(
        `${API_BASE_URL}/documents/${documentId}/files/${file.id}/rename`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            filename: `${name}.pdf`,
          }),
        }
      );
    } catch (err) {
      console.warn("Rename file error:", err);
    }
    setRenaming(false);
    onReload();
  };

  const deleteFile = () => {
    setConfirmDialog({
      open: true,
      title: "Delete File?",
      message: `Are you sure you want to remove "${rawFilename}"? This action cannot be undone.`,
      danger: true,
      confirmText: "Delete",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, loading: true }));
        try {
          await fetch(
            `${API_BASE_URL}/documents/${documentId}/files/${file.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          onReload();
        } catch (err) {
          console.error("Delete failed", err);
        } finally {
          setConfirmDialog({ open: false });
        }
      }
    });
  };

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const cacheKey = file.updated_at
    ? new Date(file.updated_at).getTime()
    : (file.id || file._id || "v1");
  const thumbUrl = file.thumbnail_url
    ? `${API_BASE_URL}${file.thumbnail_url}?token=${localStorage.getItem("token")}&v=${cacheKey}`
    : `${API_BASE_URL}/documents/${documentId}/files/${file.id}/thumbnail?token=${localStorage.getItem("token")}&v=${cacheKey}`;

  return (
    <div
      className={`zoho-doc-card ${selectedFiles.includes(file.id) ? "selected" : ""}`}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      <div className="zoho-checkbox">
        <input
          type="checkbox"
          checked={selectedFiles.includes(file.id)}
          onChange={(e) => {
            e.stopPropagation();
            setSelectedFiles(prev =>
              prev.includes(file.id)
                ? prev.filter(id => id !== file.id)
                : [...prev, file.id]
            );
          }}
        />
      </div>

      {/* Drag handle */}
      <div className="zoho-drag-icon" {...provided.dragHandleProps}>
        <FaGripVertical />
      </div>

      {/* 3-dot menu */}
      <div className="zoho-doc-menu">
        <button
          className="zoho-menu-trigger"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          aria-label="More actions"
        >
          <FaEllipsisV />
        </button>

        {menuOpen && (
          <div
            className="zoho-menu-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setRenaming(true)}>
              <FaPen className="zoho-menu-icon" />
              Rename
            </button>

            <button
              onClick={() =>
                document.getElementById(`replace-${file.id}`).click()
              }
            >
              <FaExchangeAlt className="zoho-menu-icon" />
              Replace
            </button>

            <button className="danger" onClick={deleteFile}>
              <FaTrash className="zoho-menu-icon" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      <div
        className="zoho-doc-preview"
        onClick={() => onPreview(file.start_page || 1)}
        title="Click to view document"
      >
        {!thumbLoaded && !thumbError && (
          <div className="zoho-doc-thumb-placeholder">
            <CircularProgress size={24} sx={{ color: "#0d9488" }} />
          </div>
        )}

        {thumbError ? (
          <div className="zoho-doc-thumb-fallback">
            <FaFilePdf className="zoho-doc-fallback-icon" />
            <span className="zoho-doc-fallback-badge">
              {file.pages || 1} {(file.pages || 1) === 1 ? "Page" : "Pages"}
            </span>
          </div>
        ) : (
          <img
            src={thumbUrl}
            alt={rawFilename}
            onLoad={() => setThumbLoaded(true)}
            onError={() => setThumbError(true)}
            style={{ display: thumbLoaded ? "block" : "none" }}
          />
        )}
      </div>

      {/* Filename (INLINE RENAME) */}
      <div className="zoho-doc-footer">
        {renaming ? (
          <input
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
          />
        ) : (
          <div onDoubleClick={() => setRenaming(true)} style={{ width: "100%", minWidth: 0 }}>
            <FilenameDisplay
              filename={rawFilename}
              sx={{ fontWeight: 500, fontSize: "13px", color: "#1e293b" }}
            />
          </div>
        )}
      </div>

      {/* Hidden replace input */}
      <input
        id={`replace-${file.id}`}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg"
        hidden
        onChange={(e) => {
          const selectedFile = e.target.files[0];
          if (!selectedFile) return;

          setConfirmDialog({
            open: true,
            title: "Replace Document?",
            message: `Are you sure you want to replace "${rawFilename}" with "${selectedFile.name}"? Existing signature fields on this file will be maintained.`,
            confirmText: "Replace Now",
            danger: false,
            onConfirm: () => {
              setConfirmDialog(prev => ({ ...prev, open: false }));
              onReplace(file.id, selectedFile);
            }
          });
        }}
      />
    </div>
  );
}


export default function PrepareSendRecipients() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [document, setDocument] = useState(location.state?.document || null);
  const [docLoading, setDocLoading] = useState(!location.state?.document);

  const [recipients, setRecipients] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => setCurrentUser(data))
      .catch(console.error);
  }, []);

  const isMeAlreadyAdded = () => {
    if (!currentUser) return false;
    const sameInRecipients = recipients.some(r => r.email.toLowerCase() === currentUser.email.toLowerCase());
    const sameInForms = recipientForms.some(f => f.email.toLowerCase() === currentUser.email.toLowerCase());
    return sameInRecipients || sameInForms;
  };

  const handleAddMe = () => {
    if (!currentUser) return;
    if (isMeAlreadyAdded()) {
      setSnackbar({
        open: true,
        message: "You have already been added as a recipient.",
        severity: "info"
      });
      return;
    }

    setRecipientForms(prev => {
      const emptyIndex = prev.findIndex(f => f.isNew && !f.name && !f.email);
      if (emptyIndex !== -1) {
        const updated = [...prev];
        updated[emptyIndex] = {
          ...updated[emptyIndex],
          name: currentUser.full_name || currentUser.name || "Me",
          email: currentUser.email
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `new-${Date.now()}`,
            name: currentUser.full_name || currentUser.name || "Me",
            email: currentUser.email,
            signing_order: (recipients.length || 0) + prev.length + 1,
            role: RecipientRoles.SIGNER,
            form_fields: [],
            witness_for: '',
            personal_message: '',
            document_info: {
              show_details: true,
              custom_message: '',
              view_instructions: 'Please review the document carefully before signing'
            },
            isNew: true,
            color: '#0f766e'
          }
        ];
      }
    });
  };

  const checkDuplicate = (excludeId, excludeIndex, value, field) => {
    if (!value?.trim()) return false;
    const val = value.trim().toLowerCase();

    // Check against existing recipients list (excluding self by ID)
    const inRecipients = recipients.some(r =>
      r.id !== excludeId && (
        (field === 'email' && r.email.toLowerCase() === val) ||
        (field === 'name' && (r.name || "").toLowerCase() === val)
      )
    );
    if (inRecipients) return true;

    // Check against unsaved form list (excluding self by index)
    const inOtherForms = recipientForms.some((f, i) =>
      i !== excludeIndex && (
        (field === 'email' && (f.email || "").toLowerCase() === val) ||
        (field === 'name' && (f.name || "").toLowerCase() === val)
      )
    );
    return inOtherForms;
  };
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editingRecipientId, setEditingRecipientId] = useState(null);
  const [editingDetailsId, setEditingDetailsId] = useState(null);
  const [activeRecipientId, setActiveRecipientId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activeContactIndex, setActiveContactIndex] = useState(null);


  const [contactSearch, setContactSearch] = useState("");
  const [openMessageIndex, setOpenMessageIndex] = useState(null);

  const [contactOptions, setContactOptions] = useState([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  const [activeInput, setActiveInput] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [processingMsg, setProcessingMsg] = useState(""); // Added status message

  const [mergeFile, setMergeFile] = useState(null);
  const [mergeFiles, setMergeFiles] = useState([]);
  const [mergeDoc, setMergeDoc] = useState(null); // Added missing state
  const [activePage, setActivePage] = useState(null);

  const initialFiles = React.useMemo(() => {
    const locDoc = location.state?.document;
    if (locDoc?.files && Array.isArray(locDoc.files) && locDoc.files.length > 0) {
      return locDoc.files;
    }
    if (locDoc) {
      const name = locDoc.filename || locDoc.title || locDoc.name || "Document.pdf";
      const validFilename = name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
      const docId = locDoc.id || locDoc._id || documentId;
      return [{
        id: docId,
        filename: validFilename,
        pages: locDoc.page_count || 1,
        order: 1,
        start_page: 1,
        end_page: locDoc.page_count || 1,
        page_range: (locDoc.page_count || 1) > 1 ? `Pages 1–${locDoc.page_count || 1}` : "Page 1",
        thumbnail_url: `/documents/${documentId}/files/${docId}/thumbnail`,
        isOptimistic: true
      }];
    }
    return [];
  }, [documentId, location.state]);

  const [files, setFiles] = useState(initialFiles);
  const [filesLoading, setFilesLoading] = useState(initialFiles.length === 0);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mergeConfirmOpen, setMergeConfirmOpen] = useState(false);
  const [mergedFilename, setMergedFilename] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [mergeDragActive, setMergeDragActive] = useState(false);
  const [commonMessage, setCommonMessage] = useState("");
  const [isSavingMessages, setIsSavingMessages] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [newFilename, setNewFilename] = useState(document?.filename || "");
  const [renaming, setRenaming] = useState(false);
  const [mergeOrder, setMergeOrder] = useState([]);

  const [shakingRow, setShakingRow] = useState(null);
  const [expiryDays, setExpiryDays] = useState(document?.expiry_days || 0);
  const [reminderPeriod, setReminderPeriod] = useState(document?.reminder_period || 0);
  const [isCustomExpiry, setIsCustomExpiry] = useState(false);
  const [isCustomReminder, setIsCustomReminder] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleExpiryChange = (val) => {
    const parsed = Math.max(0, parseInt(val) || 0);
    setExpiryDays(parsed);
    // If expiry days is set, clamp reminderPeriod to be strictly less than expiryDays
    if (parsed > 0 && reminderPeriod >= parsed) {
      setReminderPeriod(Math.max(0, parsed - 1));
    }
  };

  const handleReminderChange = (val) => {
    const parsed = Math.max(0, parseInt(val) || 0);
    if (expiryDays > 0 && parsed >= expiryDays) {
      setReminderPeriod(Math.max(0, expiryDays - 1));
    } else {
      setReminderPeriod(parsed);
    }
  };

  const [replaceLoading, setReplaceLoading] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState(0);


  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });


  const editCardRef = useRef(null);
  const [highlightEdit, setHighlightEdit] = useState(false);

  // Form states for inline editing
  const [recipientForms, setRecipientForms] = useState([{
    id: 'new-0',
    name: '',
    email: '',
    signing_order: 1,
    role: RecipientRoles.SIGNER,
    form_fields: [],
    witness_for: '',
    personal_message: '',
    document_info: {
      show_details: true,
      custom_message: '',
      view_instructions: 'Please review the document carefully before signing'
    },
    isNew: true,
    color: '#0f766e' // Default indigo color for new recipient
  }]);

  const [detailsForm, setDetailsForm] = useState({
    personal_message: '',
    document_info: {
      show_details: true,
      custom_message: '',
      view_instructions: 'Please review the document carefully before signing'
    }
  });

  const [signingOrderEnabled, setSigningOrderEnabled] = useState(
    document?.signing_order_enabled || false
  );

  const [errors, setErrors] = useState({});
  const [signers, setSigners] = useState([]);


  useEffect(() => {
    if (!documentId) return;

    if (!document) {
      setDocLoading(true);
    }

    fetch(`${API_BASE_URL}/documents/${documentId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return setDocument(null);

        setDocument({
          ...data,
          id: data.id || data._id   // ⭐ CRITICAL FIX
        });
        setExpiryDays(data.expiry_days || 0);
        setReminderPeriod(data.reminder_period || 0);
        setSigningOrderEnabled(data.signing_order_enabled || false);
        setCommonMessage(data.common_message || "");
      })
      .catch(() => setDocument(null))
      .finally(() => setDocLoading(false));

  }, [documentId]);




  useEffect(() => {
    setPageTitle(
      "Prepare & Send",
      "Add recipients, configure signing order, and send documents securely."
    );
  }, []);

  // Load recipients and roles on mount
  useEffect(() => {
    if (!document?.id) return;

    loadCommonMessage();
    loadRecipients();
    loadRoles();

  }, [document?.id]);   // ⭐ FIXED


  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await contactAPI.getContacts();
        setContacts(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadContacts();
  }, []);

  // Set default expiry/reminder from user settings if document doesn't have them
  useEffect(() => {
    if (currentUser && document) {
      // Use document value if it exists (even if it's 0), otherwise use user default
      const finalExpiry = (document.expiry_days !== null && document.expiry_days !== undefined)
        ? document.expiry_days
        : (currentUser.expiry_days || 0);

      let finalReminder = (document.reminder_period !== null && document.reminder_period !== undefined)
        ? document.reminder_period
        : (currentUser.reminder_days || 0);

      // Clamp reminder to be less than expiry
      if (finalExpiry > 0 && finalReminder >= finalExpiry) {
        finalReminder = Math.max(0, finalExpiry - 1);
      }

      setExpiryDays(finalExpiry);
      setReminderPeriod(finalReminder);

      // Check if they are custom (not in dropdown lists)
      const standardExpiry = [0, 2, 5, 7, 10, 30, 365];
      const standardReminder = [0, 1, 2, 5, 7, 10, 14, 30];

      if (finalExpiry > 0 && !standardExpiry.includes(finalExpiry)) {
        setIsCustomExpiry(true);
      }
      if (finalReminder > 0 && !standardReminder.includes(finalReminder)) {
        setIsCustomReminder(true);
      }
    }
  }, [currentUser, document]);

  useEffect(() => {
    const close = () => setActiveContactIndex(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const fetchDocFiles = React.useCallback(async (targetId) => {
    const docIdToUse = targetId || document?.id || documentId;
    if (!docIdToUse) return;

    try {
      const res = await fetch(`${API_BASE_URL}/documents/${docIdToUse}/files`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        const serverFiles = Array.isArray(data) ? data : data.files || [];
        if (serverFiles.length > 0) {
          // Deduplicate serverFiles by order and ID to prevent duplicate file cards
          const uniqueFiles = [];
          const seenOrders = new Set();
          const seenIds = new Set();
          for (const f of serverFiles) {
            const ord = f.order ?? 1;
            const fid = f.id;
            if (!seenOrders.has(ord) && (!fid || !seenIds.has(fid))) {
              seenOrders.add(ord);
              if (fid) seenIds.add(fid);
              uniqueFiles.push(f);
            }
          }
          setFiles(uniqueFiles.length > 0 ? uniqueFiles : serverFiles);
        } else if (document?.filename || document?.title) {
          const name = document?.filename || document?.title || "Document.pdf";
          setFiles([{
            id: docIdToUse,
            filename: name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`,
            pages: document?.page_count || 1,
            order: 1,
            start_page: 1,
            end_page: document?.page_count || 1,
            page_range: "Page 1",
            thumbnail_url: `/documents/${docIdToUse}/files/${docIdToUse}/thumbnail`
          }]);
        }
      }
    } catch (err) {
      console.error("Failed to load document files:", err);
    } finally {
      setFilesLoading(false);
    }
  }, [document?.id, document?.filename, document?.title, document?.page_count, documentId]);

  useEffect(() => {
    if (documentId) {
      fetchDocFiles(documentId);
    }
  }, [documentId, fetchDocFiles]);




  useEffect(() => {
    if (mergeConfirmOpen) {
      const ordered = selectedFiles
        .map(id => files.find(f => f.id === id))
        .filter(Boolean);
      setMergeOrder(ordered);
    }
  }, [mergeConfirmOpen, selectedFiles, files]);

  useEffect(() => {
    const close = () => {
      setActiveInputIndex(null);
      setContactOptions([]);
    };

    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);


  const searchContacts = async (query, index) => {
    if (!query || query.length < 2) {
      setContactOptions([]);
      return;
    }

    try {
      setContactLoading(true);

      const res = await api.get(`/contacts/search?q=${query}`);
      setContactOptions(res.data || []);
      setActiveInputIndex(index);

    } catch (err) {
      console.error("Contact search failed", err);
    } finally {
      setContactLoading(false);
    }
  };

  const handleEditClick = () => {
    if (!editCardRef.current) return;

    editCardRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    setHighlightEdit(true);

    // Smooth fade-out instead of abrupt removal
    setTimeout(() => setHighlightEdit(false), 1400);
  };



  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (!droppedFiles.length) return;

    // Only allow supported files
    const valid = droppedFiles.filter(f =>
      /\.(pdf|doc|docx|png|jpg|jpeg)$/i.test(f.name)
    );

    if (!valid.length) {
      setSnackbar({
        open: true,
        message: "Unsupported file type",
        severity: "error",
      });
      return;
    }

    // 👉 Option A: open merge dialog with first file
    setMergeFiles(valid);
    setMergeFile(valid[0]);
    setMergeOpen(true);
  };

  const handleMergeDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMergeDragActive(true);
  };

  const handleMergeDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMergeDragActive(false);
  };

  const handleMergeDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMergeDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (!droppedFiles.length) return;

    const valid = droppedFiles.filter(f =>
      /\.(pdf|doc|docx|png|jpg|jpeg)$/i.test(f.name)
    );

    if (valid.length > 0) {
      setMergeFiles(valid);
      setMergeFile(valid[0]);
    } else {
      setSnackbar({
        open: true,
        message: "Unsupported file type",
        severity: "error",
      });
    }
  };

  const handleSearch = async (q) => {
    try {
      const results = await contactAPI.searchContacts(q);
      setContacts(results);
    } catch (err) {
      console.error(err);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    danger: false,
  });

  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  const toggleFavorite = async (contactId) => {
    try {
      const res = await contactAPI.toggleFavorite(contactId);
      console.log(res.favorite);
    } catch (err) {
      console.error(err);
    }
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.favorite === b.favorite) return a.name.localeCompare(b.name);
    return a.favorite ? -1 : 1;
  });

  const roleCounts = recipients.reduce((acc, r) => {
    acc[r.role] = (acc[r.role] || 0) + 1;
    return acc;
  }, {});

  const roleLabels = {
    [RecipientRoles.SIGNER]: "Signer",
    [RecipientRoles.APPROVER]: "Approver",
    [RecipientRoles.VIEWER]: "Viewer",
    [RecipientRoles.FORM_FILLER]: "Form Filler",
    [RecipientRoles.WITNESS]: "Witness",
    [RecipientRoles.IN_PERSON_SIGNER]: "In-person Signer",
  };



  const handleFileDragEnd = async (result) => {
    if (!result.destination) return;
    if (document.status !== "draft") return;

    const items = Array.from(files);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    // optimistic update
    const reordered = items.map((f, i) => ({
      ...f,
      order: i + 1,
    }));

    setFiles(reordered);

    try {
      await fetch(
        `${API_BASE_URL}/documents/${document.id}/files/reorder`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(
            reordered.map(f => ({
              file_id: String(f.id),
              order: Number(f.order),
            }))
          ),
        }
      );
    } catch (err) {
      console.error("File reorder failed", err);
    }
  };

  const reloadFiles = async () => {
    await fetchDocFiles(document?.id || documentId);
  };

  const refreshDocument = async () => {
    if (!document?.id && !documentId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${document?.id || documentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data) {
        setDocument({
          ...data,
          id: data.id || data._id
        });
      }
    } catch (e) { console.warn("Refresh doc err", e); }
  };

  const handleReplaceFile = async (fileId, selectedFile) => {
    try {
      setReplaceLoading(true);
      setReplaceProgress(0);
      setProcessingMsg("Uploading replacement file...");

      const form = new FormData();
      form.append("file", selectedFile);

      // 1. Upload (0-80%)
      await api.put(
        `/documents/${document.id}/files/${fileId}/replace`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (p) => {
            const percent = Math.round((p.loaded * 100) / p.total);
            setReplaceProgress(percent * 0.8);
            if (percent >= 100) setProcessingMsg("Transfer complete! Re-processing pages...");
          }
        }
      );

      // 2. Poll for Status (80-100%)
      let isDone = false;
      let pollCount = 0;
      while (!isDone && pollCount < 120) {
        pollCount++;
        await new Promise(r => setTimeout(r, 1000));
        try {
          const statusRes = await getDocumentStatus(document.id);
          const backendProgress = statusRes.progress || 0;
          const backendMsg = statusRes.processing_status || "Processing replacement...";

          // Map backend 0-100 to 80-100
          const mapped = 80 + (backendProgress * 0.2);
          setReplaceProgress(Math.min(mapped, 99));
          setProcessingMsg(backendMsg);

          if (statusRes.status !== "processing" || backendProgress >= 100) {
            isDone = true;
          }
        } catch (e) {
          console.warn("Replace status poll failed", e);
        }
      }

      setReplaceProgress(100);
      setProcessingMsg("Complete");

      setSnackbar({
        open: true,
        message: "File replaced successfully",
        severity: "success",
      });

      await reloadFiles();
      await refreshDocument();
    } catch (err) {
      console.error("Replace failed:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Replacement failed",
        severity: "error",
      });
    } finally {
      setTimeout(() => {
        setReplaceLoading(false);
        setReplaceProgress(0);
        setProcessingMsg("");
      }, 500);
    }
  };


  function AddFileCard({ onClick }) {
    return (
      <div onClick={onClick} className={`zoho-doc-grid zoho-add-card ${isDragging ? "drag-active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}>
        <FaFilePdf size={42} />
        <div className="zoho-add-text">Drag files here</div>
        <div className="zoho-add-or">or</div>
        <button className="zoho-add-btn">Add document ▾</button>
      </div>
    );
  }


  const loadRecipients = async () => {
    if (!document?.id) return;

    try {
      const data = await recipientAPI.getRecipients(document.id);
      if (Array.isArray(data)) {
        // Colors are already included from backend API
        setRecipients(data);

        // Update new recipient form order
        setRecipientForms(prev => {
          const newForms = [...prev];
          if (newForms.length > 0 && newForms[newForms.length - 1].isNew) {
            newForms[newForms.length - 1].signing_order = data.length + 1;
          }
          return newForms;
        });

        // Extract signers for witness dropdown
        const signerList = data.filter(r =>
          r.role === RecipientRoles.SIGNER || r.role === RecipientRoles.IN_PERSON_SIGNER
        );
        setSigners(signerList);
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const roles = await recipientAPI.getRoles();
      setAvailableRoles(roles);
    } catch (error) {
      console.error('Error loading roles:', error);
      // Fallback to default roles
      setAvailableRoles([
        {
          value: RecipientRoles.SIGNER,
          label: 'Signer',
          description: RoleDescriptions[RecipientRoles.SIGNER]
        },
        {
          value: RecipientRoles.APPROVER,
          label: 'Approver',
          description: RoleDescriptions[RecipientRoles.APPROVER]
        },
        {
          value: RecipientRoles.VIEWER,
          label: 'Viewer',
          description: RoleDescriptions[RecipientRoles.VIEWER]
        },
        {
          value: RecipientRoles.FORM_FILLER,
          label: 'Form Filler',
          description: RoleDescriptions[RecipientRoles.FORM_FILLER]
        },
        {
          value: RecipientRoles.WITNESS,
          label: 'Witness',
          description: RoleDescriptions[RecipientRoles.WITNESS]
        },
        {
          value: RecipientRoles.IN_PERSON_SIGNER,
          label: 'In-person Signer',
          description: RoleDescriptions[RecipientRoles.IN_PERSON_SIGNER]
        }
      ]);
    }
  };


  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    // Draft-only protection
    if (document.status !== "draft") return;

    const items = Array.from(recipients);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    // Recalculate signing_order
    const reordered = items.map((r, index) => ({
      ...r,
      signing_order: index + 1,
    }));

    // Optimistic UI update
    setRecipients(reordered);

    try {
      await recipientAPI.reorderRecipients(
        document.id,
        reordered.map(r => ({
          recipient_id: r.id,
          signing_order: r.signing_order
        }))
      );
    } catch (err) {
      console.error("Reorder failed", err);
      loadRecipients(); // rollback
    }
  };


  const loadCommonMessage = async () => {
    if (!document?.id) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/${document.id}/common-message`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCommonMessage(data.common_message || '');
      }
    } catch (error) {
      console.error('Error loading common message:', error);
    }
  };


  const saveCommonMessage = async () => {
    if (!document?.id) return;

    const token = localStorage.getItem("token"); // 🔑 REQUIRED

    setIsSavingMessages(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/${document.id}/common-message`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // THIS FIXES 401
          },
          body: JSON.stringify({
            common_message: commonMessage
          })
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to save');
      }

      // No need to reset edit mode as it's now persistent
    } catch (error) {
      console.error('Save failed:', error.message);
    } finally {
      setIsSavingMessages(false);
    }
  };


  // Get recipient initials for avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle inline form changes
  const handleInlineFormChange = (index, field, value) => {
    setRecipientForms(prev => {
      const newForms = [...prev];
      newForms[index] = {
        ...newForms[index],
        [field]: value
      };
      return newForms;
    });
  };

  // Add new empty recipient form
  const addNewRecipientForm = () => {
    // No color needed - it will be generated by backend when saved
    setRecipientForms(prev => [
      ...prev,
      {
        id: `new-${prev.length}`,
        name: '',
        email: '',
        signing_order: (recipients.length || 0) + prev.length + 1,
        role: RecipientRoles.SIGNER,
        form_fields: [],
        witness_for: '',
        personal_message: '',
        document_info: {
          show_details: true,
          custom_message: '',
          view_instructions: 'Please review the document carefully before signing'
        },
        isNew: true,
        // No color field here - backend will generate when saved
      }
    ]);
  };

  // Remove recipient form
  const removeRecipientForm = (index) => {
    if (recipientForms[index].isNew && !recipientForms[index].id?.startsWith('existing-')) {
      setRecipientForms(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Save recipient (either new or edit)
  const saveRecipient = async (formData, index) => {
    if (!validateRecipientForm(formData, index)) return;

    if (!document?.id) return;

    setLoading(true);
    try {
      const requestData = {
        recipients: [{
          name: formData.name.trim(),
          email: formData.email.trim(),
          signing_order: Number(formData.signing_order),
          role: formData.role,
          form_fields: formData.form_fields || [],
          witness_for: formData.witness_for || null,
          personal_message: formData.personal_message || "",
          document_info: formData.document_info
        }]
      };

      await recipientAPI.addRecipients(document.id, requestData);

      setRecipientForms(prev => prev.filter((_, i) => i !== index));

      await loadRecipients();

    } catch (error) {
      setErrors({ submit: error.message || 'Failed to add recipient' });
    } finally {
      setLoading(false);
    }
  };


  const updateRecipient = async (formData, index) => {
    if (!validateRecipientForm(formData, index)) return;

    const recipientId = formData.id.replace("existing-", "");

    setLoading(true);
    try {
      await recipientAPI.updateRecipient(recipientId, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        signing_order: Number(formData.signing_order),
        role: formData.role,
        form_fields: formData.form_fields,
        witness_for: formData.witness_for || null,
        personal_message: formData.personal_message
      });

      // cleanup UI
      setEditingRecipientId(null);
      setRecipientForms(prev => prev.filter((_, i) => i !== index));
      addNewRecipientForm();
      await loadRecipients();

    } catch (error) {
      console.error("Update failed:", error);
      setErrors({ submit: "Failed to update recipient" });
    } finally {
      setLoading(false);
    }
  };


  const validateRecipientForm = (formData, index) => {
    const newErrors = {};

    const name = formData.name?.trim();
    const email = formData.email?.trim().toLowerCase();
    const order = Number(formData.signing_order);

    /* ---------- Name ---------- */
    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name is too short";
    }

    /* ---------- Email ---------- */
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email address";
    }

    /* ---------- Signing Order ---------- */
    if (!order || isNaN(order)) {
      newErrors.signing_order = "Invalid signing order";
    } else if (order < 1) {
      newErrors.signing_order = "Signing order must be ≥ 1";
    }

    /* ---------- Duplicate Email ---------- */
    const normalize = v => v.trim().toLowerCase();

    const isDuplicate = recipients.some(r =>
      normalize(r.email) === email &&
      r.id !== formData.id?.replace("existing-", "")
    );

    if (isDuplicate) {
      newErrors.email = "Recipient already added";

      // Trigger shake for this row
      setShakingRow(index);
      setTimeout(() => setShakingRow(null), 400);
    }

    /* ---------- Witness Rules ---------- */
    if (formData.role === RecipientRoles.WITNESS) {
      if (!formData.witness_for) {
        newErrors.witness_for = "Select signer to witness";
      } else {
        const signer = recipients.find(r => r.id === formData.witness_for);
        if (!signer) {
          newErrors.witness_for = "Signer no longer exists";
        } else if (normalize(signer.email) === normalize(formData.email)) {
          newErrors.witness_for = "Cannot witness yourself";
        }
      }
    }

    setErrors(prev => ({
      ...prev,
      [index]: newErrors
    }));

    return Object.keys(newErrors).length === 0;
  };


  const handleEditRecipient = (recipient) => {
    setEditingRecipientId(recipient.id);
    // Add existing recipient as editable form
    setRecipientForms(prev => [{
      id: `existing-${recipient.id}`,
      name: recipient.name,
      email: recipient.email,
      signing_order: recipient.signing_order,
      role: recipient.role,
      form_fields: recipient.form_fields || [],
      witness_for: recipient.witness_for || '',
      personal_message: recipient.personal_message || '',
      document_info: recipient.document_info || {
        show_details: true,
        custom_message: '',
        view_instructions: 'Please review the document carefully before signing'
      },
      isNew: false,
      color: recipient.color
    }, ...prev.filter(f => f.isNew)]);

    // ⭐ Scroll AFTER React renders
    setTimeout(() => {
      if (!editCardRef.current) return;

      editCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setHighlightEdit(true);
      setTimeout(() => setHighlightEdit(false), 1400);

    }, 50);
  };

  const handleEditDetails = (recipient) => {
    setEditingDetailsId(recipient.id);
    setActiveRecipientId(recipient.id);
    setDetailsForm({
      personal_message: recipient.personal_message || '',
      document_info: recipient.document_info || {
        show_details: true,
        custom_message: '',
        view_instructions: 'Please review the document carefully before signing'
      }
    });
  };

  const handleSaveDetails = async (recipientId) => {
    try {
      await recipientAPI.updateRecipientDetails(recipientId, detailsForm);
      setEditingDetailsId(null);
      setActiveRecipientId(null);
      await loadRecipients();
    } catch (error) {
      console.error('Error saving details:', error);
    }
  };

  const handleDeleteRecipient = async (recipientId) => {
    if (!window.confirm('Are you sure you want to delete this recipient?')) return;

    try {
      await recipientAPI.deleteRecipient(recipientId);
      await loadRecipients();
    } catch (error) {
      console.error('Error deleting recipient:', error);
    }
  };

  const confirmDeleteRecipient = (recipientId) => {
    setConfirmDialog({
      open: true,
      title: "Delete recipient?",
      message: "This recipient will be removed and will not receive the document.",
      danger: true,
      onConfirm: async () => {
        try {
          await recipientAPI.deleteRecipient(recipientId);
          await loadRecipients();
        } finally {
          setConfirmDialog({
            open: false,
            title: "",
            message: "",
            onConfirm: null,
            danger: false,
          });

        }
      }
    });
  };


  const getRoleIcon = (role) => {
    const icons = {
      [RecipientRoles.SIGNER]: <FaSignature />,
      [RecipientRoles.APPROVER]: <FaUserCheck />,
      [RecipientRoles.VIEWER]: <FaEye />,
      [RecipientRoles.FORM_FILLER]: <FaFileAlt />,
      [RecipientRoles.WITNESS]: <FaUserFriends />,
      [RecipientRoles.IN_PERSON_SIGNER]: <FaUserCheck />
    };
    return icons[role] || <FaUserPlus />;
  };

  const formatRoleDisplay = (role) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { label: 'Draft', className: 'docusign-status-draft' },
      'sent': { label: 'Sent', className: 'docusign-status-sent' },
      'in_progress': { label: 'In Progress', className: 'docusign-status-in-progress' },
      'completed': { label: 'Completed', className: 'docusign-status-completed' },
      'viewed': { label: 'Viewed', className: 'docusign-status-viewed' },
      'signed': { label: 'Signed', className: 'docusign-status-signed' },
      'approved': { label: 'Approved', className: 'docusign-status-approved' }
    };

    const config = statusConfig[status] || { label: status, className: 'docusign-status-unknown' };
    return <span className={`docusign-status-badge ${config.className}`}>{config.label}</span>;
  };

  // Filter recipients for search
  const filteredRecipients = recipients.filter(recipient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      recipient.name.toLowerCase().includes(searchLower) ||
      recipient.email.toLowerCase().includes(searchLower) ||
      formatRoleDisplay(recipient.role).toLowerCase().includes(searchLower)
    );
  });

  const createEmptyRecipient = () => ({
    id: `new-${Date.now()}`,
    name: '',
    email: '',
    signing_order: recipients.length + 1,
    role: RecipientRoles.SIGNER,
    form_fields: [],
    witness_for: '',
    personal_message: '',
    document_info: {
      show_details: true,
      custom_message: '',
      view_instructions: 'Please review the document carefully before signing'
    },
    isNew: true
  });


  const getFilledRecipients = () => {
    return recipientForms
      .filter(f => f.name?.trim() && f.email?.trim())
      .map(f => ({
        name: f.name.trim(),
        email: f.email.trim(),
        signing_order: Number(f.signing_order) || 1,
        role: f.role,
        form_fields: f.form_fields || [],
        witness_for: f.witness_for || null,
        personal_message: f.personal_message || "",
        document_info: f.document_info
      }));
  };


  const validateAllRecipients = () => {
    let valid = true;
    const nextErrors = {};

    recipientForms.forEach((row, index) => {
      const rowErrors = {};

      const name = row.name?.trim();
      const email = row.email?.trim().toLowerCase();
      const order = Number(row.signing_order);

      // Strict uniqueness check for pending forms
      if (recipientForms.some((r, i) => i !== index && Number(r.signing_order) === order)) {
        rowErrors.signing_order = "Duplicate order";
      }

      // Cross-check with existing recipients (except if we are editing)
      if (recipients.some(r => r.signing_order === order && !row.id.includes(r.id))) {
        // Only error if we're ADDING new ones. If editing, we assume they will be re-ordered.
        if (row.isNew) rowErrors.signing_order = "Order already taken";
      }

      if (!name) rowErrors.name = "Name is required";
      else if (name.length < 2) rowErrors.name = "Name too short";

      if (!email) rowErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        rowErrors.email = "Invalid email";

      const duplicate = recipients.some(r =>
        r.email.toLowerCase() === email
      );

      if (duplicate) rowErrors.email = "Recipient already added";

      if (Object.keys(rowErrors).length) {
        valid = false;
        nextErrors[index] = rowErrors;

        setShakingRow(index);
        setTimeout(() => setShakingRow(null), 400);
      }
    });

    setErrors(nextErrors);
    return valid;
  };

  const hasTypedRecipients = recipientForms.some(
    r => r.name?.trim() && r.email?.trim()
  );


  const saveDocumentSettings = async () => {
    if (!document?.id) return;

    if (expiryDays > 0 && reminderPeriod >= expiryDays) {
      setSnackbar({
        open: true,
        message: `Reminder interval (${reminderPeriod} days) must be less than expiration period (${expiryDays} days).`,
        severity: "warning",
      });
      return;
    }

    setIsSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${document.id}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          expiry_days: expiryDays,
          reminder_period: reminderPeriod,
          signing_order_enabled: signingOrderEnabled, // Added for persistence
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update settings");
      }

      setDocument(prev => ({
        ...prev,
        expiry_days: expiryDays,
        reminder_period: reminderPeriod,
        signing_order_enabled: signingOrderEnabled
      }));
      setIsEditingSettings(false);
      setSnackbar({
        open: true,
        message: "Settings updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Save settings failed", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to update settings",
        severity: "error",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!document?.id) return;

    if (document?.status && document.status !== "draft") {
      setSnackbar({
        open: true,
        message: `Editing is disabled: Document has already been ${document.status}.`,
        severity: "error",
      });
      return;
    }

    const rows = getFilledRecipients();

    if (!files || files.length === 0) {
      setConfirmDialog({
        open: true,
        title: "Document Required",
        message: "You haven't added any documents to send. Please add at least one file to continue with the signing process.",
        confirmText: "Add Document",
        cancelText: "Cancel",
        danger: false,
        onConfirm: () => {
          setConfirmDialog({ open: false });
          setMergeOpen(true);
        }
      });
      return;
    }

    if (!rows.length && recipients.length === 0) {
      setSnackbar({
        open: true,
        message: "Add at least one recipient",
        severity: "warning",
      });
      return;
    }

    if (rows.length && !validateAllRecipients()) return;

    setLoading(true);

    try {
      if (rows.length) {
        await recipientAPI.addRecipients(String(document.id), {
          recipients: rows,
        });
      }

      // Save settings (including signing_order_enabled)
      await saveDocumentSettings();

      // Save common message
      await saveCommonMessage();

      await loadRecipients();


      navigate(`/user/documentbuilder/${document.id}`);

    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Save failed",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };


  if (docLoading) {
    return (
      <div className="ss-content-wrapper">
        <div className="ss-loading-overlay">
          <div className="ss-spinner-container">
            <div className="ss-loading-spinner"></div>
            <div className="ss-loader-text">
              <p>Loading</p>
              <div className="ss-rotating-words">
                <span className="ss-word">Status</span>
                <span className="ss-word">Documents</span>
                <span className="ss-word">Roles</span>
                <span className="ss-word">Features</span>

                <span className="ss-word">Signatures</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="ss-notfound-wrapper">
        <div className="ss-notfound-container">
          <div className="ss-notfound-card">
            <div className="ss-notfound-icon-container">
              <FaExclamationCircle className="ss-notfound-icon" />
            </div>
            <h2 className="ss-notfound-title">Document Not Found</h2>
            <p className="ss-notfound-text">
              We couldn't locate the document you're looking for. It may have been removed, or the link might be incorrect.
            </p>
            <div className="ss-notfound-actions">
              <button
                className="ss-notfound-btn"
                onClick={() => navigate('/user/documents')}
              >
                <FaArrowLeft /> Back to Documents
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="docusign-container">
      {/* Header - DocuSign style */}
      {/* <div className="docusign-header">
        <button 
          onClick={() => navigate('/user/documents')}
          className="docusign-back-btn"
        >
          <FaArrowLeft />
        </button>
        
        <div className="docusign-document-info">
     
          <div className="docusign-document-header">
            <h1>Prepare Document for Sending</h1>
            <button 
              onClick={() => setViewerOpen(true)}
              className="docusign-view-doc-btn"
            >
              <FaExpand /> View Document
            </button>
          </div>
          
          <div className="docusign-document-details">
            <div className="docusign-doc-title">
              <FaFilePdf />
              <FilenameDisplay filename={document?.filename || document?.title || document?.name || files[0]?.filename || "Document"} maxLength={45} />
            </div>
           

            
            <div className="docusign-doc-meta">
              <span className="docusign-doc-status">
                {getStatusBadge(document?.status)}
              </span>
              <span className="docusign-doc-date">
                <FaCalendarAlt /> Uploaded: {formatDate(document?.uploaded_at)}
              </span>
            </div>
          </div>
        </div>
        
      </div>

     <div className="zoho-preview-wrapper">
  <div className="zoho-doc-preview-box">

    <DocumentThumbnail
      url={viewDocumentUrl(document.id)}
      size={120}
      onClick={() => setViewerOpen(true)}
    />

    <div className="zoho-doc-preview-meta">
      <span className="zoho-doc-name">
        <FilenameDisplay filename={document.filename} maxLength={32} />
      </span>
      <span className="zoho-doc-hint">Click to preview document</span>

      {document.status === "draft" && (
        <button
          className="zoho-merge-btn"
          onClick={(e) => {
            e.stopPropagation();
            setMergeOpen(true);
          }}
        >
          <FaPlus /> Add / Merge File
        </button>
      )}

      <button
  className="zoho-merge-btn"
  onClick={() => {
    setNewFilename(
  document.filename.replace(/\.pdf$/i, "")
);

    setRenameOpen(true);
  }}
>
  <FaEdit size={14} />
  <span>Rename</span>
</button>
    </div>

    <button
      className="docusign-view-doc-btn"
      onClick={() => setViewerOpen(true)}
    >
      <FaExpand /> View
    </button>
  </div>
</div> */}

      {/* ===== DocuSign-like Header ===== */}
      {/* <div className="ds-header">
  <button
    className="ds-back-btn"
    onClick={() => navigate("/user/documents")}
  >
    <FaArrowLeft />
  </button>

  <div className="ds-header-content">
    <h1 className="ds-title">Edit document details</h1>
    <p className="ds-subtitle">Prepare document for sending</p>
  </div>
</div> */}

      {/* ===== Add Documents Section ===== */}
      <div className="ds-add-documents">
        {/* <div className="ds-doc-card" onClick={() => setViewerOpen(true)}>
  <div className="ds-doc-preview">
    <DocumentThumbnail
      url={viewDocumentUrl(document.id)}
      size={180}
    />
  </div>

  <div className="ds-doc-footer">
    <span className="ds-doc-name" title={document.filename}>
      {document.filename}
    </span>
  </div>
</div> */}

        {/* ===== Add documents (Zoho style) ===== */}


        {/* Notice if document is not in draft state */}
        {document?.status && document.status !== "draft" && (
          <div style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            padding: "14px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FaExclamationCircle size={20} color="#d97706" />
              <div>
                <strong style={{ display: "block", fontSize: "14px" }}>
                  Document is {document.status.replace("_", " ").toUpperCase()} (Read-Only)
                </strong>
                <span style={{ fontSize: "13px", color: "#b45309" }}>
                  Editing recipients, files, and settings is disabled for documents that are already sent, completed, or expired.
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/user/documents/${document.id}/summary`)}
              style={{
                background: "#d97706",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                whiteSpace: "nowrap"
              }}
            >
              View Document Summary
            </button>
          </div>
        )}

        <div className="zoho-add-documents">
          <h3 className="zoho-section-title">Add documents</h3>

          {filesLoading && files.length === 0 ? (
            <div className="zoho-files-skeleton-container">
              <div className="zoho-skeleton-card">
                <div className="zoho-skeleton-preview">
                  <CircularProgress size={26} sx={{ color: "#0d9488" }} />
                  <span style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>Loading document...</span>
                </div>
                <div className="zoho-skeleton-footer"></div>
              </div>
            </div>
          ) : (!files || files.length === 0) ? (
            <div
              className="zoho-empty-upload-box"
              onClick={() => {
                if (!document?.status || document.status === "draft") {
                  setMergeOpen(true);
                }
              }}
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: "16px",
                padding: "36px 24px",
                textAlign: "center",
                backgroundColor: "#f8fafc",
                cursor: (!document?.status || document.status === "draft") ? "pointer" : "default",
                transition: "all 0.2s ease-in-out",
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px"
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)"
                }}
              >
                <FaCloudUploadAlt />
              </div>
              <div>
                <h4 style={{ margin: 0, color: "#0f172a", fontSize: "16px", fontWeight: 700 }}>
                  No documents added yet
                </h4>
                <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px", maxWidth: "380px" }}>
                  Upload PDF or Word files to include them in this signature request envelope.
                </p>
              </div>
              {(!document?.status || document.status === "draft") && (
                <button
                  type="button"
                  className="ds-add-doc-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMergeOpen(true);
                  }}
                  style={{
                    marginTop: "4px",
                    padding: "10px 22px",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
                  }}
                >
                  <FaPlus fontSize="12px" /> Add Document
                </button>
              )}
            </div>
          ) : (
            <>
              {selectedFiles.length >= 2 && (
                <div className="zoho-merge-bar">
                  <span>{selectedFiles.length} files selected</span>

                  <button
                    className="zoho-merge-action-btn"
                    onClick={() => {
                      setMergedFilename(
                        files.find(f => f.id === selectedFiles[0])?.filename
                          ?.replace(/\.pdf$/i, "") || "Merged Document"
                      );
                      setMergeConfirmOpen(true);
                    }}
                  >
                    Merge
                  </button>

                  <button
                    className="zoho-clear-btn"
                    onClick={() => setSelectedFiles([])}
                  >
                    Clear
                  </button>
                </div>
              )}

              <DragDropContext onDragEnd={handleFileDragEnd}>
                <Droppable droppableId="files" direction="horizontal">
                  {(provided) => (
                    <div
                      className="zoho-doc-grid"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {Array.isArray(files) && files.map((file, index) => (
                        <Draggable
                          key={file.id}
                          draggableId={file.id}
                          index={index}
                          isDragDisabled={document?.status && document.status !== "draft"}
                        >
                          {(provided) => (
                            <ZohoFileCard
                              file={file}
                              documentId={document?.id || documentId}
                              provided={provided}
                              onReload={reloadFiles}
                              selectedFiles={selectedFiles}
                              setSelectedFiles={setSelectedFiles}
                              setConfirmDialog={setConfirmDialog}
                              onReplace={handleReplaceFile}
                              onPreview={(page) => {
                                setActivePage(page);
                                setViewerOpen(true);
                              }}
                            />
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}

                      {(!document?.status || document.status === "draft") && (
                        <AddFileCard onClick={() => setMergeOpen(true)} />
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </>
          )}
        </div>






        {/* <div className="ds-upload-box">
    <FaFilePdf className="ds-upload-icon" />
    <p>Drag files here</p>
    <span>or</span>
    <button className="ds-add-doc-btn"  onClick={(e) => {
            e.stopPropagation();
            setMergeOpen(true);
          }}>
      Add document
    </button>
  </div> */}
      </div>

      {/* ===== Document Name ===== */}
      <div className="ds-form-row ds-form-inline">
        <label>Document Name :</label>

        <div style={{ position: "relative", display: "flex", alignItems: "center", maxWidth: "100%", minWidth: 0 }}>
          {(() => {
            const docDisplayName = (document?.filename || document?.title || document?.name || files[0]?.filename || "Document").replace(/\.pdf$/i, "");
            return (
              <input
                type="text"
                value={docDisplayName}
                readOnly
                title={document?.filename || docDisplayName}
                onClick={() => {
                  setNewFilename(docDisplayName);
                  setRenameOpen(true);
                }}
                style={{ cursor: "pointer", textOverflow: "ellipsis" }}
              />
            );
          })()}
        </div>

        {/* <button
          className="zoho-rename-btn"
          onClick={() => {
            setNewFilename(document.filename.replace(/\.pdf$/i, ""));
            setRenameOpen(true);
          }}
        >
          <FaEdit size={20} />
          <span>Rename</span>
        </button> */}
      </div>

      {/* Signing Order & Add Me row - Moved below Document Name */}
      <div className="ds-signing-order-ctrl-row">
        <div className="ds-signing-order-checkbox-group">
          <label className={`ds-signing-order-label-box ${signingOrderEnabled ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={signingOrderEnabled}
              onChange={async (e) => {
                const enabled = e.target.checked;
                setSigningOrderEnabled(enabled);
                setDocument(prev => prev ? { ...prev, signing_order_enabled: enabled } : prev);
                try {
                  const response = await fetch(`${API_BASE_URL}/documents/${document.id}/settings`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                      signing_order_enabled: enabled
                    })
                  });
                  if (!response.ok) throw new Error("Update failed");
                } catch (err) {
                  setSigningOrderEnabled(!enabled);
                  setDocument(prev => prev ? { ...prev, signing_order_enabled: !enabled } : prev);
                  setSnackbar({
                    open: true,
                    message: "Failed to update signing order",
                    severity: "error"
                  });
                }
              }}
            />
            <span className="ds-checkbox-custom">
              {signingOrderEnabled && <FaCheck className="ds-check-icon" />}
            </span>
            <span className="ds-checkbox-text">Send in order</span>
          </label>

          <button
            className="ds-add-me-btn"
            onClick={handleAddMe}
            disabled={isMeAlreadyAdded()}
            title={isMeAlreadyAdded() ? "Already added" : "Add yourself as a recipient"}
          >
            Add me
          </button>
        </div>

        <div className="ds-signing-order-desc">
          {signingOrderEnabled
            ? "Recipients will sign one-by-one in the specified order."
            : "All recipients can sign at the same time."}
        </div>
      </div>











      {/* Main Content - Centered like DocuSign */}
      <div className="docusign-main-content">
        {/* Recipients Section */}
        <div className="docusign-recipients-section">
          {recipients.length > 0 && (
            <div className="docusign-section-header">
              <h2>
                <FaUsers /> Recipients
                <span className="docusign-recipient-count">{recipients.length} added</span>
              </h2>

              <div className="docusign-controls">
                <div className="docusign-search">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search recipients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Existing Recipients List */}
          {/* Existing Recipients List */}
          {/* {filteredRecipients.length > 0 && (
  <DragDropContext onDragEnd={handleDragEnd}>
    <Droppable droppableId="recipients">
      {(provided) => (
        <div
          className="docusign-recipients-list"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          {filteredRecipients.map((recipient, index) => (
            <Draggable
              key={recipient.id}
              draggableId={recipient.id}
              index={index}
              isDragDisabled={document.status !== "draft"}
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  style={{
                    ...provided.draggableProps.style,
                    borderLeft: `5px solid ${recipient.color || '#0f766e'}`
                  }}
                  className={`docusign-recipient-card ${
                    activeRecipientId === recipient.id ? 'docusign-active' : ''
                  } ${snapshot.isDragging ? 'docusign-dragging' : ''}`}
                  onClick={() => setActiveRecipientId(recipient.id)}
                >

                  <div
  className="docusign-recipient-card-header"
  {...provided.dragHandleProps}
>
  <div
  className="docusign-drag-handle"
  {...provided.dragHandleProps}
  title="Drag to reorder"
>
  <FaGripVertical />
</div>

                    <div className="docusign-recipient-avatar">
                      <div 
                        className="docusign-avatar"
                        style={{ backgroundColor: recipient.color }}
                      >
                        {getInitials(recipient.name)}
                      </div>
                    </div>
                    
                    <div className="docusign-recipient-info">
                      <div className="docusign-recipient-name">
                        {recipient.name}
                        <span className="docusign-recipient-role">
                          {getRoleIcon(recipient.role)}
                          {formatRoleDisplay(recipient.role)}
                        </span>
                      </div>
                      <div className="docusign-recipient-email">
                        <FaEnvelope /> {recipient.email}
                      </div>
                    </div>
                    
                    <div className="docusign-recipient-actions">
                      <span className="docusign-order-badge">
                        Order #{recipient.signing_order}
                      </span>
                      {getStatusBadge(recipient.status)}
                      
                      <div className="docusign-action-buttons">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRecipient(recipient);
                          }}
                          
                          className="docusign-action-btn"
                          title="Edit"
                          disabled={document.status !== 'draft'}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDetails(recipient);
                          }}
                          className="docusign-action-btn"
                          title="Details"
                        >
                          <FaInfo />
                        </button>
                        <button
  onClick={(e) => {
    e.stopPropagation();
    confirmDeleteRecipient(recipient.id);
  }}
  className="docusign-action-btn docusign-delete-btn"
>
  <FaTrash />
</button>

                      </div>
                    </div>
                  </div>
                  
                  {recipient.witness_for && (
                    <div className="docusign-witness-info">
                      <FaUserFriends />
                      Witness for: {signers.find(s => s.id === recipient.witness_for)?.name}
                    </div>
                  )}
                  
                               </div>
              )}
            </Draggable>
          ))}

          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
)} */}


          {/* Existing Recipients – Zoho Input Style */}
          {filteredRecipients.length > 0 && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="recipients">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="zoho-recipient-form-list"
                  >
                    {filteredRecipients.map((recipient, index) => (
                      <Draggable
                        key={recipient.id}
                        draggableId={recipient.id}
                        index={index}
                        isDragDisabled={document.status !== "draft"}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="zoho-recipient-input-row"
                            style={{
                              ...provided.draggableProps.style,
                              borderLeft: `4px solid ${recipient.color}`
                            }}
                          >
                            {/* Drag */}
                            <div
                              className="zoho-drag-handle"
                              {...provided.dragHandleProps}
                            >
                              <FaGripVertical />
                            </div>

                            {/* Avatar */}
                            <div
                              className="zoho-avatar"
                              style={{ backgroundColor: recipient.color }}
                            >
                              {getInitials(recipient.name)}
                            </div>

                            {/* Order */}
                            <input
                              type="number"
                              value={recipient.signing_order}
                              onClick={() => handleEditRecipient(recipient)}
                              readOnly
                              className="zoho-order-input"
                            />

                            {/* Name */}
                            <input
                              value={recipient.name}
                              onClick={() => handleEditRecipient(recipient)}
                              readOnly
                              className={`zoho-input ${checkDuplicate(recipient.id, -1, recipient.name, 'name') ? 'is-duplicate' : ''}`}
                            />

                            {/* Email */}
                            <input
                              value={recipient.email}
                              onClick={() => handleEditRecipient(recipient)}
                              readOnly
                              className={`zoho-input ${checkDuplicate(recipient.id, -1, recipient.email, 'email') ? 'is-duplicate' : ''}`}
                            />

                            {/* Contact icon */}
                            {/* <button className="zoho-contact-btn" disabled>
                    <FaUser />
                  </button> */}

                            {/* Role */}
                            <input
                              value={recipient.role}
                              onClick={() => handleEditRecipient(recipient)}
                              disabled
                              className="zoho-select"
                            >
                              {/* {availableRoles.map(r => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))} */}
                            </input>



                            {/* Actions */}
                            <div className="zoho-row-actions">
                              <button
                                onClick={() => handleEditRecipient(recipient)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => confirmDeleteRecipient(recipient.id)}
                                className="danger"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}


          {/* Add Recipients Section - DocuSign style inline forms */}
          <div className="docusign-add-recipients">
            <h3 className="docusign-add-title">
              <FaUserPlus /> Add Recipients
            </h3>


            {/* Single inline form */}
            <div className="docusign-recipient-forms">
              {recipientForms.map((form, index) => (
                <div
                  ref={!form.isNew ? editCardRef : null}   // ⭐ attach ref ONLY when editing
                  key={form.id}
                  className={`docusign-recipient-form-card docusign-inline-form
      ${highlightEdit && !form.isNew ? "edit-highlight" : ""}
      ${shakingRow === index ? "docusign-shake" : ""}
    `}
                  style={{ borderLeftColor: form.color }}
                >
                  {/* Single row layout */}
                  <div className="docusign-inline-form-row">

                    {/* Avatar */}
                    <div className="docusign-inline-avatar-wrapper">
                      <div
                        className="docusign-inline-avatar"
                        style={{ backgroundColor: form.color || '#0f766e' }}
                        title={form.name || 'New recipient'}
                      >
                        {form.name ? getInitials(form.name) : '?'}
                      </div>
                    </div>


                    {/* Name field */}
                    <div className="docusign-inline-field">
                      <input
                        type="text"
                        value={form.name}
                        onFocus={() => setActiveInput({ index, field: "name" })}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInlineFormChange(index, "name", value);
                          searchContacts(value);          // reuse existing API
                        }}
                        placeholder="Name *"
                        className={`${errors[index]?.name ? 'docusign-input-error' : ''} ${checkDuplicate(null, index, form.name, 'name') ? 'is-duplicate' : ''}`}
                      />
                      {activeInput?.index === index &&
                        activeInput?.field === "name" &&
                        contactOptions.length > 0 && (
                          <div className="contact-autocomplete">
                            {contactOptions.map(contact => (
                              <div
                                key={contact.id}
                                className="contact-option"
                                onClick={() => {
                                  handleInlineFormChange(index, "name", contact.name);
                                  handleInlineFormChange(index, "email", contact.email);
                                  setContactOptions([]);
                                  setActiveInput(null);
                                }}
                              >
                                <div className="contact-name">{contact.name}</div>
                                <div className="contact-email">{contact.email}</div>
                              </div>
                            ))}
                          </div>
                        )}

                      {errors.name && (
                        <div className="docusign-inline-error">{errors.name}</div>
                      )}

                    </div>



                    {/* Email field with contact dropdown */}
                    <div className="docusign-inline-field docusign-email-field">
                      <div className="docusign-email-input-wrapper">
                        <input
                          type="email"
                          value={form.email}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={() => setActiveInput({ index, field: "email" })}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleInlineFormChange(index, "email", value);
                            searchContacts(value);
                          }}
                          placeholder="Email *"
                          className={`${errors[index]?.email ? "docusign-input-error" : ""} ${checkDuplicate(null, index, form.email, 'email') ? 'is-duplicate' : ''}`}
                        />

                        <button
                          type="button"
                          className="docusign-contact-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveContactIndex(activeContactIndex === index ? null : index);
                          }}
                        >
                          <FaAddressBook />
                        </button>



                        {/* Contact dropdown */}
                        {activeContactIndex === index && (
                          <div
                            className="docusign-contact-dropdown"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              placeholder="Search contacts..."
                              value={contactSearch}
                              onChange={(e) => {
                                setContactSearch(e.target.value);
                                handleSearch(e.target.value);
                              }}
                              className="docusign-contact-search"
                            />
                            <div className="docusign-contact-list">
                              {sortedContacts
                                .filter(c =>
                                  c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                                  c.email.toLowerCase().includes(contactSearch.toLowerCase())
                                )
                                .map(contact => (
                                  <div key={contact.id} className="docusign-contact-item">
                                    <div
                                      className="docusign-contact-main"
                                      onClick={() => {
                                        setRecipientForms(prev => {
                                          const updated = [...prev];
                                          updated[index] = {
                                            ...updated[index],
                                            name: contact.name,
                                            email: contact.email
                                          };
                                          return updated;
                                        });
                                        setActiveContactIndex(null);
                                        setContactSearch("");
                                      }}
                                    >
                                      <div className="docusign-contact-avatar">
                                        {contact.name[0]?.toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="docusign-contact-name">
                                          {contact.name}
                                          {contact.favorite && <span className="favorite-star">★</span>}
                                        </div>
                                        <div className="docusign-contact-email">
                                          {contact.email}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      className={`docusign-favorite-btn ${contact.favorite ? "active" : ""}`}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await contactAPI.toggleFavorite(contact.id);
                                        const updated = await contactAPI.getContacts();
                                        setContacts(updated);
                                      }}
                                    >
                                      {contact.favorite ? "★" : "☆"}
                                    </button>
                                  </div>
                                ))}
                              {sortedContacts.length === 0 && (
                                <div className="docusign-contact-empty">No contacts found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {activeInput?.index === index &&
                        activeInput?.field === "email" &&
                        contactOptions.length > 0 && (
                          <div className="contact-autocomplete">
                            {contactOptions.map(contact => (
                              <div
                                key={contact.id}
                                className="contact-option"
                                onClick={() => {
                                  handleInlineFormChange(index, "name", contact.name);
                                  handleInlineFormChange(index, "email", contact.email);
                                  setContactOptions([]);
                                  setActiveInput(null);
                                }}
                              >
                                <div className="contact-name">{contact.name}</div>
                                <div className="contact-email">{contact.email}</div>
                              </div>
                            ))}
                          </div>
                        )}

                      {errors.email && (
                        <div className="docusign-inline-error">{errors.email}</div>
                      )}
                    </div>

                    {/* Role dropdown */}
                    <div className="docusign-inline-field docusign-role-field">
                      <select
                        value={form.role}
                        onChange={(e) => handleInlineFormChange(index, 'role', e.target.value)}
                      >
                        {availableRoles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Order field */}
                    <div className="docusign-inline-field docusign-order-field">
                      <input
                        type="number"
                        value={form.signing_order}
                        readOnly
                        title="Change order by dragging"
                        className="docusign-input-readonly"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="docusign-inline-actions">
                      <div className="docusign-message-toggle">
                        <button
                          type="button"
                          className="docusign-message-toggle-btn"
                          onClick={() =>
                            setOpenMessageIndex(openMessageIndex === index ? null : index)
                          }
                          title="Add personal message"
                        >
                          <FaEnvelopeOpenText className="docusign-message-icon" />
                          {form.personal_message && (
                            <span className="docusign-message-indicator"></span>
                          )}
                        </button>
                      </div>
                      {form.isNew ? (
                        <button
                          onClick={() => saveRecipient(form, index)}
                          className={`docusign-btn docusign-btn-primary docusign-btn-sm ${shakingRow === index ? "docusign-btn-error" : ""
                            }`}
                          disabled={loading || !form.name || !form.email}
                          title="Add recipient"
                        >
                          <FaPlus className="btn-icon" />
                          <span>Save</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => updateRecipient(form, index)}
                            className="docusign-btn docusign-btn-primary docusign-btn-sm"
                            disabled={loading}
                            title="Update recipient"
                          >
                            <FaCheck /> Update
                          </button>
                          <button
                            onClick={() => {
                              setEditingRecipientId(null);
                              setRecipientForms(prev => {
                                const updated = prev.filter((_, i) => i !== index);
                                return updated.length ? updated : [createEmptyRecipient()];
                              });
                              addNewRecipientForm();
                            }}
                            className="docusign-btn docusign-btn-sm"
                            title="Cancel"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}

                      {recipientForms.length > 1 && form.isNew && (
                        <button
                          onClick={() => removeRecipientForm(index)}
                          className="docusign-btn docusign-btn-outline docusign-btn-sm docusign-btn-danger"
                          title="Remove form"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Witness dropdown - appears below when role is Witness */}
                  {form.role === RecipientRoles.WITNESS && (
                    <div className="docusign-witness-row">
                      <div className="docusign-inline-field docusign-full-width">
                        <label>Witness For:</label>
                        <select
                          value={form.witness_for}
                          onChange={(e) => handleInlineFormChange(index, 'witness_for', e.target.value)}
                          className={errors.witness_for ? 'docusign-input-error' : ''}
                        >
                          <option value="">Select a signer</option>
                          {signers.map(signer => (
                            <option key={signer.id} value={signer.id}>
                              {signer.name}
                            </option>
                          ))}
                        </select>
                        {errors.witness_for && (
                          <div className="docusign-inline-error">{errors.witness_for}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Personal message - hidden by default */}
                  <div
                    className={`docusign-message-row ${openMessageIndex === index ? 'docusign-message-open' : ''
                      }`}
                  >
                    <div className="docusign-inline-field docusign-full-width">
                      <div className="docusign-message-header">
                        <span className="docusign-message-label">
                          <FaEnvelope /> Personal Message (Optional)
                        </span>
                        <button
                          type="button"
                          className="docusign-close-message-btn"
                          onClick={() => setOpenMessageIndex(null)}
                          title="Close message"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <textarea
                        value={form.personal_message}
                        onChange={(e) => handleInlineFormChange(index, 'personal_message', e.target.value)}
                        placeholder="Add a personal message for this recipient..."
                        rows="3"
                        className="docusign-message-textarea"
                      />
                      {form.personal_message && (
                        <div className="docusign-message-info">
                          <span className="docusign-message-length">
                            {form.personal_message.length} characters
                          </span>
                          <span className="docusign-message-preview">
                            Preview: {form.personal_message.substring(0, 40)}...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add More button */}
              <div className="docusign-add-more-container">
                <button
                  onClick={addNewRecipientForm}
                  className="docusign-add-more-btn"
                >
                  <FaPlus /> Add Another Recipient
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar for selected recipient details */}
        {activeRecipientId && (
          <div className="docusign-recipient-sidebar">
            <div className="docusign-sidebar-header">
              <h4>Recipient Details</h4>
              <button
                onClick={() => setActiveRecipientId(null)}
                className="docusign-close-btn"
              >
                <FaTimes />
              </button>
            </div>

            <div className="docusign-sidebar-content">
              {(() => {
                const recipient = recipients.find(r => r.id === activeRecipientId);
                if (!recipient) return null;

                return (
                  <>
                    <div className="docusign-sidebar-profile">
                      <div
                        className="docusign-sidebar-avatar"
                        style={{ backgroundColor: recipient.color }}
                      >
                        {getInitials(recipient.name)}
                      </div>
                      <div className="docusign-sidebar-profile-info">
                        <h5>{recipient.name}</h5>
                        <p className="docusign-sidebar-email">
                          <FaEnvelope /> {recipient.email}
                        </p>
                      </div>
                    </div>

                    <div className="docusign-detail-grid">
                      <div className="docusign-detail-item">
                        <span className="docusign-detail-label">Role:</span>
                        <span className="docusign-detail-value">
                          {formatRoleDisplay(recipient.role)}
                        </span>
                      </div>
                      <div className="docusign-detail-item">
                        <span className="docusign-detail-label">Order:</span>
                        <span className="docusign-detail-value">
                          #{recipient.signing_order}
                        </span>
                      </div>
                      <div className="docusign-detail-item">
                        <span className="docusign-detail-label">Status:</span>
                        <span className="docusign-detail-value">
                          {getStatusBadge(recipient.status)}
                        </span>
                      </div>
                      <div className="docusign-detail-item">
                        <span className="docusign-detail-label">Added:</span>
                        <span className="docusign-detail-value">
                          {formatDate(recipient.added_at)}
                        </span>
                      </div>
                    </div>

                    {recipient.personal_message && (
                      <div className="docusign-message-card">
                        <h6><FaInfoCircle /> Personal Message</h6>
                        <p>{recipient.personal_message}</p>
                      </div>
                    )}

                    <div className="docusign-document-info-card">
                      <h6><FaFileAlt /> Document Information</h6>
                      <div className="docusign-info-item">
                        <span className="docusign-info-label">Show Details:</span>
                        <span className="docusign-info-value">
                          {recipient.document_info?.show_details ? 'Yes' : 'No'}
                        </span>
                      </div>

                      {recipient.document_info?.custom_message && (
                        <div className="docusign-info-item">
                          <span className="docusign-info-label">Custom Message:</span>
                          <p className="docusign-info-text">
                            {recipient.document_info.custom_message}
                          </p>
                        </div>
                      )}

                      {recipient.document_info?.view_instructions && (
                        <div className="docusign-info-item">
                          <span className="docusign-info-label">Instructions:</span>
                          <p className="docusign-info-text">
                            {recipient.document_info.view_instructions}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="docusign-sidebar-actions">
                      <button
                        onClick={() => handleEditRecipient(recipient)}
                        className="docusign-btn docusign-btn-outline"
                        disabled={document.status !== 'draft'}

                      >
                        <FaEdit /> Edit Recipient
                      </button>
                      {/* <button
                        onClick={() => handleEditDetails(recipient)}
                        className="docusign-btn docusign-btn-outline"
                      >
                        <FaCog /> Edit Details
                      </button> */}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="docusign-footer">
        {/* More Settings Section (Moved ABOVE Note) */}
        <div className="settings-minimal">
          <div className="settings-minimal-header" onClick={() => setIsEditingSettings(!isEditingSettings)}>
            <span className="settings-minimal-label">More settings</span>
            <span className={`settings-minimal-arrow ${isEditingSettings ? "open" : ""}`}>
              <FaChevronRight />
            </span>
          </div>

          {isEditingSettings && (
            <div className="settings-minimal-content">
              <div className="settings-minimal-field">
                <label>Expiration</label>
                {!isCustomExpiry ? (
                  <select
                    value={expiryDays}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    className="settings-minimal-select"
                  >
                    <option value={0}>Never</option>
                    <option value={2}>2 Days</option>
                    <option value={5}>5 Days</option>
                    <option value={7}>1 Week</option>
                    <option value={10}>10 Days</option>
                    <option value={30}>1 Month</option>
                    <option value={365}>1 Year</option>
                  </select>
                ) : (
                  <div className="settings-minimal-input-container">
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={expiryDays}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      className="settings-minimal-input"
                    />
                    <span className="settings-minimal-unit">days</span>
                  </div>
                )}
                <label className="settings-minimal-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isCustomExpiry}
                    onChange={(e) => setIsCustomExpiry(e.target.checked)}
                  />
                  <span>Set manually</span>
                </label>
              </div>

              <div className="settings-minimal-field">
                <label>Reminder Period</label>
                {!isCustomReminder ? (
                  <select
                    value={reminderPeriod}
                    onChange={(e) => handleReminderChange(e.target.value)}
                    className="settings-minimal-select"
                  >
                    {[
                      { val: 0, label: "No Reminders" },
                      { val: 1, label: "Daily (1 Day)" },
                      { val: 2, label: "2 Days" },
                      { val: 5, label: "5 Days" },
                      { val: 7, label: "Weekly (7 Days)" },
                      { val: 10, label: "10 Days" },
                      { val: 14, label: "Bi-Weekly (14 Days)" },
                      { val: 30, label: "Monthly (30 Days)" }
                    ].map(opt => {
                      const isDisabled = expiryDays > 0 && opt.val >= expiryDays;
                      return (
                        <option
                          key={opt.val}
                          value={opt.val}
                          disabled={isDisabled}
                        >
                          {opt.label}{isDisabled ? ` (Disabled: Expiry is ${expiryDays}d)` : ""}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="settings-minimal-input-container">
                    <input
                      type="number"
                      min="0"
                      max={expiryDays > 0 ? Math.max(0, expiryDays - 1) : 90}
                      value={reminderPeriod}
                      onChange={(e) => handleReminderChange(e.target.value)}
                      className="settings-minimal-input"
                    />
                    <span className="settings-minimal-unit">days</span>
                  </div>
                )}
                <label className="settings-minimal-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isCustomReminder}
                    onChange={(e) => setIsCustomReminder(e.target.checked)}
                  />
                  <span>Set manually</span>
                </label>
                {expiryDays > 0 && (
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    * Max reminder interval: {Math.max(0, expiryDays - 1)} {Math.max(0, expiryDays - 1) === 1 ? 'day' : 'days'} (must be less than expiry period)
                  </span>
                )}
              </div>

              {/* Set signing order removed from here */}

              <div className="settings-minimal-actions">
                <button
                  className="settings-minimal-save"
                  onClick={saveDocumentSettings}
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? "Saving..." : "Apply"}
                </button>
              </div>
            </div>
          )}

          {!isEditingSettings && (expiryDays > 0 || reminderPeriod > 0) && (
            <div className="settings-minimal-summary">
              {expiryDays > 0 && <span className="settings-minimal-status-chip">Expires: {expiryDays}d</span>}
              {reminderPeriod > 0 && <span className="settings-minimal-status-chip">Reminders: {reminderPeriod}d</span>}
            </div>
          )}
        </div>

        {/* Note to all recipients (Moved BELOW Settings) */}
        <div className="zoho-common-message-v2">
          <label className="zoho-common-label-v2">Note to all recipients</label>
          <textarea
            className="zoho-common-textarea-v2"
            value={commonMessage}
            onChange={(e) => setCommonMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
          />
        </div>


        <div className="docusign-summary">
          <div className="docusign-summary-stats">

            <div className="docusign-stat">
              <span className="docusign-stat-label">Total Recipients:</span>
              <span className="docusign-stat-value">{recipients.length}</span>
            </div>

            {Object.entries(roleCounts).map(([role, count]) => {
              if (!count) return null; // ⭐ Hides zero counts

              return (
                <div key={role} className="docusign-stat">
                  <span className="docusign-stat-label">
                    {roleLabels[role] || role}:
                  </span>
                  <span className="docusign-stat-value">{count}</span>
                </div>
              );
            })}
          </div>



          <button
            onClick={handleSaveAndContinue}
            className="docusign-btn docusign-btn-primary docusign-btn-large"
            disabled={(!hasTypedRecipients && recipients.length === 0) || (document?.status && document.status !== "draft")}
            title={document?.status && document.status !== "draft" ? "Editing is disabled for sent, completed, or expired documents" : ""}
          >
            <FaChevronRight /> Save & Continue
            {/* {recipients.length > 0 && (
              <span className="docusign-continue-count">{recipients.length} recipients</span>
            )} */}
          </button>
        </div>
      </div>




      {
        mergeOpen && (
          <div className="za-add-backdrop">
            <div className="za-add-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="za-add-header">
                <div className="za-header-title">
                  <FaPlus className="za-title-icon" />
                  <h3>{mergeDoc ? "Replace Document" : "Add New Document"}</h3>
                </div>
                <button
                  className="za-add-close"
                  onClick={() => {
                    setMergeOpen(false);
                    setMergeFile(null);
                    setMergeFiles([]);
                    setMergeDoc(null);
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="za-add-content">
                {(!mergeFile && mergeFiles.length === 0) ? (
                  <label
                    className={`za-dropzone ${mergeDragActive ? "drag-active" : ""}`}
                    onDragOver={handleMergeDragOver}
                    onDragLeave={handleMergeDragLeave}
                    onDrop={handleMergeDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      multiple
                      onChange={(e) => {
                        const selected = Array.from(e.target.files || []);
                        if (selected.length > 0) {
                          setMergeFiles(selected);
                          setMergeFile(selected[0]);
                        }
                      }}
                      hidden
                    />
                    <div className="za-dropzone-inner">
                      <div className="za-upload-hero">
                        <FaFilePdf className="za-hero-icon" />
                        <div className="za-hero-glow"></div>
                      </div>
                      <span className="za-upload-main">Click or drag document here</span>
                      <p className="za-upload-sub">Supports PDF, Word, and Images (Multi-file support, Max 25MB)</p>
                      <button className="za-upload-btn">Browse Files</button>
                    </div>
                  </label>
                ) : mergeFiles.length > 1 ? (
                  <div className="za-multi-files-selected" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>
                        {mergeFiles.length} files selected
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Total: {(mergeFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                      {mergeFiles.map((f, idx) => (
                        <div key={idx} className="za-file-selected" style={{ padding: "10px 14px", margin: 0 }}>
                          <div className="za-selected-info" style={{ width: "100%" }}>
                            <div className="za-file-icon-box" style={{ width: "32px", height: "32px", fontSize: "15px" }}>
                              <FaFileAlt />
                            </div>
                            <div className="za-file-details" style={{ minWidth: 0, flex: 1 }}>
                              <FilenameDisplay
                                filename={f.name}
                                sx={{ fontWeight: 600, color: "#1e293b", fontSize: "13.5px" }}
                              />
                              <span className="za-filesize">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                            {!mergeLoading && (
                              <button
                                className="za-remove-selection"
                                onClick={() => {
                                  const updated = mergeFiles.filter((_, i) => i !== idx);
                                  setMergeFiles(updated);
                                  setMergeFile(updated[0] || null);
                                }}
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {mergeLoading && (
                      <div className="za-upload-progress-box" style={{ marginTop: "6px" }}>
                        <div className="za-progress-label">
                          <span>{processingMsg || "Processing documents..."}</span>
                          <span>{mergeProgress}%</span>
                        </div>
                        <div className="za-progress-track">
                          <div
                            className="za-progress-fill"
                            style={{ width: `${mergeProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="za-file-selected">
                    <div className="za-selected-info">
                      <div className="za-file-icon-box">
                        <FaFileAlt />
                      </div>
                      <div className="za-file-details" style={{ minWidth: 0, flex: 1 }}>
                        <FilenameDisplay
                          filename={mergeFile?.name || mergeFiles[0]?.name}
                          sx={{ fontWeight: 600, color: "#1e293b", fontSize: "15px" }}
                        />
                        <span className="za-filesize">{(((mergeFile?.size || mergeFiles[0]?.size || 0)) / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button
                        className="za-remove-selection"
                        onClick={() => {
                          setMergeFile(null);
                          setMergeFiles([]);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>

                    {mergeLoading && (
                      <div className="za-upload-progress-box">
                        <div className="za-progress-label">
                          <span>{processingMsg || (mergeProgress < 70 ? "Uploading..." : "Processing...")}</span>
                          <span>{mergeProgress}%</span>
                        </div>
                        <div className="za-progress-track">
                          <div
                            className="za-progress-fill"
                            style={{ width: `${mergeProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="za-add-footer">
                <button
                  className="za-btn-cancel"
                  onClick={() => {
                    setMergeOpen(false);
                    setMergeFile(null);
                    setMergeFiles([]);
                    setMergeDoc(null);
                  }}
                  disabled={mergeLoading}
                >
                  Cancel
                </button>

                <button
                  className="za-btn-primary"
                  disabled={(!mergeFile && mergeFiles.length === 0) || mergeLoading}
                  onClick={async () => {
                    try {
                      setMergeLoading(true);
                      setMergeProgress(0);
                      setProcessingMsg("Initializing...");

                      const docId = documentId;
                      const filesToProcess = mergeFiles.length > 0 ? mergeFiles : (mergeFile ? [mergeFile] : []);

                      if (mergeDoc && filesToProcess.length > 0) {
                        const form = new FormData();
                        form.append("file", filesToProcess[0]);
                        const replaceRes = await fetch(
                          `${API_BASE_URL}/documents/${documentId}/files/${mergeDoc.id}/replace`,
                          {
                            method: "PUT",
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                            body: form,
                          }
                        );
                        if (!replaceRes.ok) {
                          const errData = await replaceRes.json().catch(() => ({}));
                          throw new Error(errData.detail || "Replace failed");
                        }
                      } else {
                        const total = filesToProcess.length;
                        for (let i = 0; i < total; i++) {
                          const currentF = filesToProcess[i];
                          setProcessingMsg(`Uploading file ${i + 1} of ${total}: ${currentF.name}...`);

                          await addFileToDocument(documentId, currentF, (p) => {
                            const overall = Math.round(((i + (p / 100)) / total) * 60);
                            setMergeProgress(overall);
                            if (p >= 50) setProcessingMsg(`Processing file ${i + 1} of ${total} on server...`);
                          });

                          // Wait for backend processing task to finish for each file
                          let attempts = 0;
                          while (attempts < 30) {
                            try {
                              const statusRes = await fetch(`${API_BASE_URL}/documents/${docId}/status`, {
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                              }).then(r => r.json());

                              if (statusRes.progress) {
                                const fileProgress = Math.max(60, statusRes.progress);
                                const mapped = Math.round(((i * 100) + fileProgress) / total);
                                setMergeProgress(mapped);
                                if (statusRes.processing_status) {
                                  setProcessingMsg(`File ${i + 1}/${total}: ${statusRes.processing_status}`);
                                }
                              }
                              if (statusRes.progress >= 100 || statusRes.status === "draft") {
                                break;
                              }
                            } catch (e) {
                              console.warn("Poll err", e);
                            }
                            await new Promise(r => setTimeout(r, 600));
                            attempts++;
                          }
                        }
                      }

                      setMergeProgress(100);
                      setProcessingMsg("Complete!");

                      setSnackbar({
                        open: true,
                        message: mergeDoc
                          ? "File replaced successfully"
                          : (filesToProcess.length > 1
                              ? `Successfully added and merged ${filesToProcess.length} documents`
                              : "File added successfully"),
                        severity: "success",
                      });

                      await reloadFiles();
                      await refreshDocument();
                      setMergeOpen(false);
                      setMergeFile(null);
                      setMergeFiles([]);
                      setMergeDoc(null);

                    } catch (err) {
                      setSnackbar({
                        open: true,
                        message: err.message || "Process failed. Please try again.",
                        severity: "error",
                      });
                    } finally {
                      setMergeLoading(false);
                      setMergeProgress(0);
                      setProcessingMsg("");
                    }
                  }}
                >
                  {mergeLoading ? (
                    <span className="za-loader-wrap">
                      <CircularProgress size={16} color="inherit" />
                      Processing...
                    </span>
                  ) : (
                    <>{mergeDoc ? "Replace Document" : "Add Document"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }


      {
        mergeLoading && !mergeOpen && (
          <div className="document-merge-overlay">
            <div className="document-merge-card">

              {/* Animated status */}
              <img
                src="/images/uploading.gif"
                alt="Merging documents"
                className="document-merge-gif"
              />

              <h3 className="document-merge-title">
                {processingMsg || "Merging documents"}
              </h3>

              <p className="document-merge-subtitle">
                Please wait while we process your files.
              </p>


              {/* Progress */}
              <div className="document-merge-progress-text">
                {mergeProgress}%
              </div>

              <div className="document-merge-progress-bar">
                <div
                  className="document-merge-progress-fill"
                  style={{ width: `${mergeProgress}%` }}
                />
              </div>

              {/* Action */}
              <button
                className="document-merge-cancel-btn"
                onClick={() => setMergeLoading(false)}
              >
                Cancel
              </button>

            </div>
          </div>
        )
      }



      {
        renameOpen && (
          <div className="rename-dialog-backdrop">
            <div className="rename-dialog">
              <h3>Rename Document</h3>

              {/* Filename input (without .pdf) */}
              <div className="rename-input-wrapper">
                <input
                  type="text"
                  value={newFilename}
                  onChange={(e) =>
                    setNewFilename(
                      e.target.value.replace(/\.pdf$/i, "")
                    )
                  }
                  placeholder="Enter document name"
                  autoFocus
                />
                <span className="rename-suffix">.pdf</span>
              </div>

              <div className="rename-dialog-actions">
                <button
                  className="rename-btn-cancel"
                  onClick={() => setRenameOpen(false)}
                  disabled={renaming}
                >
                  Cancel
                </button>

                <button
                  className="rename-btn-primary"
                  disabled={!newFilename.trim() || renaming}
                  onClick={async () => {
                    try {
                      setRenaming(true);

                      const finalFilename = `${newFilename.trim()}.pdf`;

                      await fetch(
                        `${API_BASE_URL}/documents/${document.id}/rename`,
                        {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                          },
                          body: JSON.stringify({
                            filename: finalFilename,
                          }),
                        }
                      );

                      // Update local state safely
                      setDocument(prev => ({
                        ...prev,
                        filename: finalFilename
                      }));


                      setRenameOpen(false);
                    } catch (err) {
                      setSnackbar({
                        open: true,
                        message: "Rename failed. Please try again.",
                        severity: "error",
                      });
                    }
                    finally {
                      setRenaming(false);
                    }
                  }}
                >
                  {renaming ? "Renaming…" : "Rename"}
                </button>
              </div>
            </div>
          </div>
        )
      }


      {
        snackbar.open && (
          <div className={`za-snackbar-wrapper za-snackbar-${snackbar.severity}`}>
            <div className="za-snackbar-content">
              <div className="za-snackbar-icon">
                {snackbar.severity === 'success' && <FaCheckCircle />}
                {snackbar.severity === 'error' && <FaExclamationCircle />}
                {(snackbar.severity === 'info' || snackbar.severity === 'warning') && <FaInfoCircle />}
              </div>
              <span className="za-snackbar-message">{snackbar.message}</span>
              <button
                className="za-snackbar-close"
                onClick={() => setSnackbar({ ...snackbar, open: false })}
              >
                <FaTimes />
              </button>
            </div>
            <div className="za-snackbar-progress"></div>
          </div>
        )
      }



      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        danger={confirmDialog.danger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ open: false })}
      />


      {/* Commented out bottom thumbnails as requested - now moving to editor side panel */}
      {/* 
      <DocumentFilesPanel
        documentId={document.id}
        onPreview={(page) => {
          setActivePage(page);
          setViewerOpen(true);
        }}
      />
      */}




      <DocumentViewerModal
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setActivePage(null);
        }}
        page={activePage}
        documentId={document.id}
        url={viewDocumentUrl(document.id)}
        documentName={document?.filename}
      />


      {
        mergeConfirmOpen && (
          <div className="rename-dialog-backdrop">
            <div className="rename-dialog zoho-merge-dialog">
              <h3>Merge files</h3>

              <p className="merge-hint">
                Drag files to change merge order
              </p>

              {/* Drag reorder list */}
              <DragDropContext
                onDragEnd={(result) => {
                  if (!result.destination) return;

                  const items = Array.from(mergeOrder);
                  const [moved] = items.splice(result.source.index, 1);
                  items.splice(result.destination.index, 0, moved);

                  setMergeOrder(items); // THIS CONTROLS MERGE ORDER
                }}
              >
                <Droppable droppableId="merge-files">
                  {(provided) => (
                    <div
                      className="merge-file-list"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {mergeOrder.map((file, index) => (
                        <Draggable
                          key={file.id}
                          draggableId={String(file.id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`merge-file-row ${snapshot.isDragging ? "dragging" : ""
                                }`}
                            >
                              <span
                                className="merge-drag"
                                {...provided.dragHandleProps}
                              >
                                <FaGripVertical />
                              </span>

                              <img
                                className="merge-thumb"
                                src={`${API_BASE_URL}${file.thumbnail_url}?token=${localStorage.getItem("token")}&v=${file.updated_at ? new Date(file.updated_at).getTime() : (file.id || Date.now())}`}
                                alt=""
                              />

                              <div className="merge-name" style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                                <FilenameDisplay
                                  filename={file.filename}
                                  sx={{ fontSize: "13px", fontWeight: 500 }}
                                />
                              </div>

                              <span className="merge-pages">
                                {file.page_count} pages
                              </span>
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Filename */}
              <div className="rename-input-wrapper">
                <input
                  type="text"
                  value={mergedFilename}
                  onChange={(e) =>
                    setMergedFilename(e.target.value.replace(/\.pdf$/i, ""))
                  }
                  placeholder="Merged file name"
                />
                <span className="rename-suffix">.pdf</span>
              </div>

              {/* Actions */}
              <div className="rename-dialog-actions">
                <button
                  className="rename-btn-cancel"
                  onClick={() => setMergeConfirmOpen(false)}
                >
                  Cancel
                </button>

                <button
                  className="rename-btn-primary"
                  disabled={mergeOrder.length < 2 || mergeLoading}
                  onClick={async () => {
                    try {
                      setMergeLoading(true);
                      setMergeProgress(10);

                      const res = await fetch(
                        `${API_BASE_URL}/documents/${document.id}/files/merge`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                          },
                          body: JSON.stringify({
                            file_ids: mergeOrder.map(f => f.id),
                            merged_filename: `${mergedFilename}.pdf`,
                          }),
                        }
                      );

                      if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.detail || "Merge failed");
                      }

                      setMergeProgress(100);
                      await reloadFiles();
                      await refreshDocument();

                      setSelectedFiles([]);
                      setMergeConfirmOpen(false);
                      setSnackbar({
                        open: true,
                        message: "Files merged successfully",
                        severity: "success",
                      });
                    } catch (err) {
                      setSnackbar({
                        open: true,
                        message: err.message || "Merge failed",
                        severity: "error",
                      });
                    } finally {
                      setMergeLoading(false);
                      setMergeProgress(0);
                    }
                  }}
                >
                  {mergeLoading ? "Merging..." : "Merge"}
                </button>

              </div>
            </div>
          </div>
        )
      }


      {/* Success Dialog */}
      {/* ... Success dialog logic ... */}

      {/* Processing / Replace Dialog */}
      {replaceLoading && (
        <div className="ss-usd-backdrop" style={{ zIndex: 9999 }}>
          <div className="ss-usd-modal" style={{ maxWidth: '400px' }}>
            <div className="ss-usd-head">
              <div className="ss-loading-spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px' }}></div>
              <div className="ss-usd-title">Processing File</div>
              <div className="ss-usd-subtitle">{processingMsg || "Please wait while we update your document..."}</div>
            </div>

            <div className="ss-usd-body" style={{ padding: '20px' }}>
              <div className="zoho-merge-progress" style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  className="zoho-merge-progress-bar"
                  style={{
                    width: `${replaceProgress}%`,
                    height: '100%',
                    background: '#0f766e',
                    transition: 'width 0.4s ease-out'
                  }}
                />
              </div>
              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                {Math.round(replaceProgress)}% Complete
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
