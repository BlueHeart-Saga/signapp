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
  FaInfo
} from 'react-icons/fa';
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";
import { CircularProgress } from '@mui/material';
import { FaPen, FaExchangeAlt } from "react-icons/fa";
import { FaGripVertical } from 'react-icons/fa';
import { recipientAPI, RecipientRoles, RoleDescriptions } from '../services/api';
import DocumentViewerModal from '../components/DocumentViewerModal';
import { viewDocumentUrl, addFileToDocument } from '../services/DocumentAPI';
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
        setFiles(Array.isArray(data) ? data : data.files || []);
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
      `/documents/${documentId}/files/${file.id}/thumbnails`,
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
  setConfirmDialog
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(
    file.filename.replace(/\.pdf$/i, "")
  );

  const saveRename = async () => {
    if (!name.trim()) return setRenaming(false);

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
    setRenaming(false);
    onReload();
  };

  const deleteFile = () => {
    setConfirmDialog({
      open: true,
      title: "Delete File?",
      message: `Are you sure you want to remove "${file.filename}"? This action cannot be undone.`,
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


  return (
    <div
      className="zoho-doc-card"
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
      >

        <img
          src={`${API_BASE_URL}${file.thumbnail_url}?token=${localStorage.getItem("token")}`}
          alt={file.filename}
        />
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
          <span onDoubleClick={() => setRenaming(true)}>
            {file.filename.replace(/\.pdf$/i, "")}
          </span>
        )}
      </div>

      {/* Hidden replace input */}
      <input
        id={`replace-${file.id}`}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg"
        hidden
        onChange={async (e) => {
          const form = new FormData();
          form.append("file", e.target.files[0]);

          await fetch(
            `${API_BASE_URL}/documents/${documentId}/files/${file.id}/replace`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: form,
            }
          );
          onReload();
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
            color: '#0d9488'
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
  const [mergeDoc, setMergeDoc] = useState(null); // Added missing state
  const [activePage, setActivePage] = useState(null);

  const [files, setFiles] = useState([]);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mergeConfirmOpen, setMergeConfirmOpen] = useState(false);
  const [mergedFilename, setMergedFilename] = useState("");
  const [isDragging, setIsDragging] = useState(false);
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
    color: '#0d9488' // Default indigo color for new recipient
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

      const finalReminder = (document.reminder_period !== null && document.reminder_period !== undefined)
        ? document.reminder_period
        : (currentUser.reminder_days || 0);

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

  useEffect(() => {
    if (!document?.id) return;

    fetch(`${API_BASE_URL}/documents/${document.id}/files`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(data => {
        setFiles(Array.isArray(data) ? data : data.files || []);
      })
      .catch(console.error);

  }, [document?.id]);      // ⭐ FIXED




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
    setMergeFile(valid[0]);
    setMergeOpen(true);

    // 👉 Option B (direct upload instead)
    // await addFileToDocument(document.id, valid[0], setMergeProgress);
    // reloadFiles();
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
    const res = await fetch(
      `${API_BASE_URL}/documents/${document.id}/files`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    const data = await res.json();
    setFiles(Array.isArray(data) ? data : data.files || []);
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
    setIsSavingSettings(true);
    try {
      await fetch(`${API_BASE_URL}/documents/${document.id}/settings`, {
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
      setIsEditingSettings(false);
    } catch (error) {
      console.error("Save settings failed", error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!document?.id) return;

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

      // Automatically save common message and settings
      await saveCommonMessage();

      // Save settings
      await saveDocumentSettings();

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
              <span>{document.filename}</span>
            </div>
           

            
            <div className="docusign-doc-meta">
              <span className="docusign-doc-status">
                {getStatusBadge(document.status)}
              </span>
              <span className="docusign-doc-date">
                <FaCalendarAlt /> Uploaded: {formatDate(document.uploaded_at)}
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
      <span className="zoho-doc-name">{document.filename}</span>
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


        <div className="zoho-add-documents">
          <h3 className="zoho-section-title">Add documents</h3>

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
                      isDragDisabled={document.status !== "draft"}
                    >
                      {(provided) => (
                        <ZohoFileCard
                          file={file}
                          documentId={document.id}
                          provided={provided}
                          onReload={reloadFiles}
                          selectedFiles={selectedFiles}
                          setSelectedFiles={setSelectedFiles}
                          setConfirmDialog={setConfirmDialog}
                          onPreview={(page) => {
                            setActivePage(page);
                            setViewerOpen(true);
                          }}
                        />


                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}

                  {document.status === "draft" && (
                    <AddFileCard onClick={() => setMergeOpen(true)} />
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
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

        <input
          type="text"
          value={document.filename.replace(/\.pdf$/i, "")}
          readOnly
          onClick={() => {
            setNewFilename(document.filename.replace(/\.pdf$/i, ""));
            setRenameOpen(true);
          }}
        />

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
                    borderLeft: `5px solid ${recipient.color || '#0d9488'}`
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
                        style={{ backgroundColor: form.color || '#0d9488' }}
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
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
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
                      onChange={(e) => setExpiryDays(Math.max(0, parseInt(e.target.value) || 0))}
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
                    onChange={(e) => setReminderPeriod(Number(e.target.value))}
                    className="settings-minimal-select"
                  >
                    <option value={0}>No Reminders</option>
                    <option value={1}>Daily</option>
                    <option value={2}>2 Days</option>
                    <option value={5}>5 Days</option>
                    <option value={7}>Weekly</option>
                    <option value={10}>10 Days</option>
                    <option value={14}>Bi-Weekly</option>
                    <option value={30}>Monthly</option>
                  </select>
                ) : (
                  <div className="settings-minimal-input-container">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={reminderPeriod}
                      onChange={(e) => setReminderPeriod(Math.max(0, parseInt(e.target.value) || 0))}
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
            disabled={!hasTypedRecipients && recipients.length === 0}
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
                    setMergeDoc(null);
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="za-add-content">
                {!mergeFile ? (
                  <label className="za-dropzone">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg"
                      onChange={(e) => setMergeFile(e.target.files[0])}
                      hidden
                    />
                    <div className="za-dropzone-inner">
                      <div className="za-upload-hero">
                        <FaFilePdf className="za-hero-icon" />
                        <div className="za-hero-glow"></div>
                      </div>
                      <span className="za-upload-main">Click or drag document here</span>
                      <p className="za-upload-sub">Supports PDF, Word, and Images (Max 20MB)</p>
                      <button className="za-upload-btn">Browse Files</button>
                    </div>
                  </label>
                ) : (
                  <div className="za-file-selected">
                    <div className="za-selected-info">
                      <div className="za-file-icon-box">
                        <FaFileAlt />
                      </div>
                      <div className="za-file-details">
                        <span className="za-filename">{mergeFile.name}</span>
                        <span className="za-filesize">{(mergeFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button className="za-remove-selection" onClick={() => setMergeFile(null)}>
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
                    setMergeDoc(null);
                  }}
                  disabled={mergeLoading}
                >
                  Cancel
                </button>

                <button
                  className="za-btn-primary"
                  disabled={!mergeFile || mergeLoading}
                  onClick={async () => {
                    try {
                      setMergeLoading(true);
                      setMergeProgress(0);
                      setProcessingMsg("Initializing...");

                      const docId = documentId;
                      const startPoll = () => {
                        const interval = setInterval(async () => {
                          try {
                            const statusRes = await fetch(`${API_BASE_URL}/documents/${docId}/status`, {
                              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                            }).then(r => r.json());

                            if (statusRes.progress > 70) {
                              setMergeProgress(statusRes.progress);
                              if (statusRes.processing_status) setProcessingMsg(statusRes.processing_status);
                            }
                            if (statusRes.progress >= 100) clearInterval(interval);
                          } catch (e) { console.warn("Poll err", e); }
                        }, 1000);
                        return interval;
                      };

                      const pollId = startPoll();

                      if (mergeDoc) {
                        const form = new FormData();
                        form.append("file", mergeFile);
                        await fetch(
                          `${API_BASE_URL}/documents/${documentId}/files/${mergeDoc.id}/replace`,
                          {
                            method: "PUT",
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                            body: form,
                          }
                        );
                      } else {
                        await addFileToDocument(documentId, mergeFile, (p) => {
                          setMergeProgress(Math.round(p));
                          if (p >= 60) setProcessingMsg("Server Processing...");
                        });
                      }

                      clearInterval(pollId);
                      setMergeProgress(100);
                      setProcessingMsg("Complete!");

                      setSnackbar({
                        open: true,
                        message: mergeDoc ? "File replaced successfully" : "File added successfully",
                        severity: "success",
                      });

                      await reloadFiles();
                      setMergeOpen(false);
                      setMergeFile(null);
                      setMergeDoc(null);

                    } catch (err) {
                      setSnackbar({
                        open: true,
                        message: "Process failed. Please try again.",
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
                                src={`${API_BASE_URL}${file.thumbnail_url}?token=${localStorage.getItem("token")}`}
                                alt=""
                              />

                              <span className="merge-name">
                                {file.filename}
                              </span>

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

                      await fetch(
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

                      setMergeProgress(100);
                      await reloadFiles();

                      setSelectedFiles([]);
                      setMergeConfirmOpen(false);
                    } catch {
                      setSnackbar({
                        open: true,
                        message: "Merge failed",
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


    </div >
  );
}
