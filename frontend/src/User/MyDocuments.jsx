import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import showAlert from "../utils/swal";

import {
  uploadDocument,
  // getDocuments,
  downloadDocument,
  uploadFromCloud,
  exchangeBoxToken,
  uploadFromBox,
  exchangeGoogleToken,
  getBoxFiles,
  getBoxFolderInfo
} from "../services/DocumentAPI";
import {
  FaFileAlt,
  FaFolder,
  FaFolderOpen,
  FaGoogleDrive,
  FaDropbox,
  FaMicrosoft,
  FaBox,
  FaTimes,
  FaArrowLeft,
  FaSync,
  FaChevronDown,
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaPlus,
  FaTrash
} from "react-icons/fa";
import { AiOutlineFileText } from "react-icons/ai";




import { FiUploadCloud } from "react-icons/fi";
import { FiUpload } from "react-icons/fi";

import {
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Button,
  Box,
  IconButton,
  CircularProgress,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Popover,
  Paper,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  Skeleton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
// Add these imports with your other icon imports
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  History as HistoryIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  WarningAmber as WarningAmberIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Send as SendIcon,
  Computer as ComputerIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarTodayIcon,
  DateRange as DateRangeIcon,
  Event as EventIcon,
  InsertDriveFileOutlined as InsertDriveFileOutlinedIcon,
  SwapVert as SwapVertIcon,
  SortByAlpha as SortByAlphaIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  AccessTime as AccessTimeIcon,
  Check as CheckIcon
} from "@mui/icons-material";
import { FaEdit } from "react-icons/fa";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import { Summarize as SummarizeIcon } from "@mui/icons-material";
import RecipientManager from "./RecipientSelector"; // Fixed import
import TemplateBrowser from "./TemplateBrowser";
import AITemplateBrowser from './AITemplateBrowser';
import DocumentViewerModal from "../components/DocumentViewerModal";
import SignedPreviewModal from "../components/SignedPreviewModal";
import TimelineDrawer from "../components/TimelineDrawer";
import StatusChip from "../components/StatusChip";
import { voidDocument, restoreDocument, softDeleteDocument, viewDocumentUrl, signedPreviewUrl, permanentDeleteDocument, addFileToDocument, getDocumentsPaged, getDocumentStatus, touchDocument } from "../services/DocumentAPI";
import { setPageTitle } from "../utils/pageTitle";
// import templatesAPI from "../services/api";
import UploadPreviewModal from "../components/UploadPreviewModal";
import FilenameDisplay from "../components/FilenameDisplay";
import { useAuth } from "../context/AuthContext";
// import PremiumBannerSlider from "../components/PremiumBannerSlider";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";
const token = localStorage.getItem("token");

const getSourceBadgeClasses = (source) => {
  const s = String(source || "").toLowerCase();
  if (s.includes("google")) return "bg-purple-50 text-purple-700";
  if (s.includes("dropbox")) return "bg-sky-50 text-sky-700";
  if (s.includes("onedrive")) return "bg-emerald-50 text-emerald-700";
  if (s.includes("box")) return "bg-amber-50 text-amber-700";
  if (s.includes("local")) return "bg-[#e0f2fe] text-[#0284c7]";
  return "bg-slate-100 text-slate-700";
};

export default function MyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);
  const [loading, setLoading] = useState(false); // For uploads
  const [listLoading, setListLoading] = useState(false); // For document list fetching
  const [templateLoading, setTemplateLoading] = useState(false);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [showCloudProviders, setShowCloudProviders] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [templateBrowserOpen, setTemplateBrowserOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null); // Track selected document for recipient management
  const [showRecipientManager, setShowRecipientManager] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [signedOpen, setSignedOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingMsg, setProcessingMsg] = useState(""); // Added status message

  const navigate = useNavigate();
  const location = useLocation();


  const [renameOpen, setRenameOpen] = useState(false);
  const [newFilename, setNewFilename] = useState(document?.filename || "");
  const [renaming, setRenaming] = useState(false);

  const [totalDocs, setTotalDocs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [mergeDoc, setMergeDoc] = useState(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeFiles, setMergeFiles] = useState([]);
  const [mergeDragOver, setMergeDragOver] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);


  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState(null);


  // Google Picker State
  const [googleAccessToken, setGoogleAccessToken] = useState(null);

  // Box Picker State
  const [boxToken, setBoxToken] = useState(localStorage.getItem("box_access_token"));
  const [showBoxPicker, setShowBoxPicker] = useState(false);
  const [boxFiles, setBoxFiles] = useState([]);
  const [boxLoading, setBoxLoading] = useState(false);
  const [boxCurrentFolder, setBoxCurrentFolder] = useState("0");

  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [docToVoid, setDocToVoid] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const [permanentDeleteOpen, setPermanentDeleteOpen] = useState(false);
  const [permanentDeleting, setPermanentDeleting] = useState(false);
  const [docToPermanentDelete, setDocToPermanentDelete] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    source: "",
    startDate: "",
    endDate: "",
    sortBy: "last_used", // "name" | "last_used" | "uploaded_at" | "size"
    sortOrder: "desc",   // "asc" | "desc"
  });

  const getSortLabelShort = (sortBy, sortOrder) => {
    if (sortBy === "name") return sortOrder === "asc" ? "Name (A-Z)" : "Name (Z-A)";
    if (sortBy === "uploaded_at") return sortOrder === "asc" ? "Uploaded (Oldest)" : "Uploaded (Newest)";
    if (sortBy === "size") return sortOrder === "asc" ? "Size (Smallest)" : "Size (Largest)";
    return sortOrder === "asc" ? "Last Used (Oldest)" : "Last Used";
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return null;
    const num = Number(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleTouchDoc = useCallback((docId) => {
    if (!docId) return;
    const nowIso = new Date().toISOString();
    setDocuments((prevDocs) => {
      const target = prevDocs.find((d) => d.id === docId);
      if (!target) return prevDocs;
      const updated = {
        ...target,
        updated_at: nowIso,
        last_accessed_at: nowIso,
      };
      return [updated, ...prevDocs.filter((d) => d.id !== docId)];
    });
    touchDocument(docId);
  }, []);

  const { user, subscription, logout } = useAuth();
  const [planRestrictionOpen, setPlanRestrictionOpen] = useState(false);

  // MUI Menu & Popover Anchors
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [actionMenuDoc, setActionMenuDoc] = useState(null);
  const [uploadAnchorEl, setUploadAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [orderAnchorEl, setOrderAnchorEl] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setPageTitle(
      "Document Management",
      "View, manage, and track all your documents in one secure place."
    );
  }, []);

  // Handle OAuth callbacks
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code) {
      if (state === "google_auth") {
        handleGoogleAuthCallback(code);
      } else {
        handleBoxAuthCallback(code);
      }
    }
  }, []);

  // Synchronize URL status and search filters with state
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const statusParam = urlParams.get("status");
    const searchParam = urlParams.get("search");

    setFilters(prev => ({
      ...prev,
      status: statusParam ? (statusParam === "all" ? "" : statusParam) : prev.status,
      search: searchParam !== null ? searchParam : prev.search
    }));
    if (statusParam || searchParam) {
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [location.search]);

  // Load user's documents
  const loadDocs = async () => {
    setListLoading(true);
    try {
      const res = await getDocumentsPaged(currentPage, pageSize, filters.status, {
        search: filters.search,
        startDate: filters.startDate,
        endDate: filters.endDate,
        source: filters.source,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setDocuments(res.documents || []);
      setTotalDocs(res.total || 0);
      setTotalPages(res.total_pages || 0);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocs();
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, filters.status, filters.startDate, filters.endDate, filters.source, filters.search, filters.sortBy, filters.sortOrder]);

  // =============================================
  // UPLOAD HANDLERS
  // =============================================

  const handleLocalUpload = () => {
    if (user?.role !== "admin" && !user?.has_active_subscription) {
      setPlanRestrictionOpen(true);
      return;
    }
    fileInputRef.current?.click();
    setShowUploadDropdown(false);
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (event.target) event.target.value = "";
    if (!selectedFiles.length) return;

    if (selectedFiles.length === 1) {
      const selectedFile = selectedFiles[0];
      if (selectedFile.size > 25 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: `"${selectedFile.name}" exceeds the maximum allowed 25 MB size.`,
          severity: "error",
        });
        return;
      }
      const isDocx = selectedFile.name.toLowerCase().endsWith('.docx');
      if (isDocx) {
        setFile(selectedFile);
        handleUpload(selectedFile);
      } else {
        setFile(selectedFile);
        setPreviewFile(selectedFile);
        setPreviewOpen(true);
      }
    } else {
      handleBatchUpload(selectedFiles);
    }
  };


  const filteredDocuments = React.useMemo(() => {
    let list = [...documents];

    // Client-side instant search & date matching
    if (filters.search) {
      const s = filters.search.toLowerCase().trim();
      list = list.filter((doc) => {
        if (doc.filename?.toLowerCase().includes(s)) return true;
        if (doc.title?.toLowerCase().includes(s)) return true;
        if (doc.envelope_id?.toLowerCase().includes(s)) return true;
        if (doc.owner_email?.toLowerCase().includes(s)) return true;
        if (doc.status?.toLowerCase().includes(s)) return true;

        // Date search across formatted representations
        const datesToCheck = [
          doc.last_accessed_at ? new Date(doc.last_accessed_at) : null,
          doc.updated_at ? new Date(doc.updated_at) : null,
          doc.uploaded_at ? new Date(doc.uploaded_at) : null,
        ].filter(Boolean);

        for (const d of datesToCheck) {
          if (isNaN(d.getTime())) continue;
          const localeStr = d.toLocaleDateString().toLowerCase();
          const isoStr = d.toISOString().toLowerCase();
          const fullStr = d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).toLowerCase();
          const monthLong = d.toLocaleDateString(undefined, { month: "long" }).toLowerCase();
          const yearStr = d.getFullYear().toString();

          if (
            localeStr.includes(s) ||
            isoStr.includes(s) ||
            fullStr.includes(s) ||
            monthLong.includes(s) ||
            yearStr.includes(s)
          ) {
            return true;
          }
        }
        return false;
      });
    }

    if (filters.status && filters.status !== "all") {
      list = list.filter((doc) => doc.status === filters.status);
    }

    if (filters.source && filters.source !== "all") {
      list = list.filter((doc) => doc.source?.toLowerCase() === filters.source.toLowerCase());
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      list = list.filter((doc) => {
        const d = new Date(doc.updated_at || doc.uploaded_at || 0);
        return !isNaN(d.getTime()) && d >= start;
      });
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((doc) => {
        const d = new Date(doc.updated_at || doc.uploaded_at || 0);
        return !isNaN(d.getTime()) && d <= end;
      });
    }

    // Dynamic Sorting based on filters.sortBy and filters.sortOrder
    list.sort((a, b) => {
      const orderMul = filters.sortOrder === "asc" ? 1 : -1;

      if (filters.sortBy === "name") {
        const nameA = (a.filename || a.title || "").toLowerCase();
        const nameB = (b.filename || b.title || "").toLowerCase();
        return nameA.localeCompare(nameB) * orderMul;
      }

      if (filters.sortBy === "uploaded_at") {
        const tA = new Date(a.uploaded_at || 0).getTime();
        const tB = new Date(b.uploaded_at || 0).getTime();
        return (tA - tB) * orderMul;
      }

      if (filters.sortBy === "size") {
        const sA = Number(a.size || 0);
        const sB = Number(b.size || 0);
        return (sA - sB) * orderMul;
      }

      // Default: "last_used" / "updated_at"
      const tA = new Date(a.last_accessed_at || a.updated_at || a.uploaded_at || 0).getTime();
      const tB = new Date(b.last_accessed_at || b.updated_at || b.uploaded_at || 0).getTime();
      return (tA - tB) * orderMul;
    });

    return list;
  }, [documents, filters]);


  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, filters.source, filters.startDate, filters.endDate, filters.sortBy, filters.sortOrder]);


  // const handleUpload = async (uploadFile = file) => {
  //   if (!uploadFile) return;

  //   setLoading(true);
  //   try {
  //     await uploadDocument(uploadFile);
  //     alert("File uploaded successfully");
  //     setFile(null);
  //     loadDocs();
  //   } catch (err) {
  //     console.error(err);
  //     alert(err.response?.data?.detail || "Upload failed");
  //   } finally {
  //     setLoading(false);
  //     setShowUploadDropdown(false);
  //   }
  // };

  const uploadAbortControllerRef = useRef(null);

  const cancelUpload = useCallback(() => {
    if (uploadAbortControllerRef.current) {
      try {
        uploadAbortControllerRef.current.abort();
      } catch (e) {
        console.warn("Abort error:", e);
      }
      uploadAbortControllerRef.current = null;
    }
    setLoading(false);
    setUploadProgress(0);
    setProcessingMsg("");
    setBatchFiles([]);
    setBatchCurrentIndex(0);
    setSnackbar({ open: true, message: "Upload cancelled by user", severity: "info" });
  }, []);

  const handleBatchUpload = async (filesToUpload) => {
    if (!filesToUpload || !filesToUpload.length) return;

    if (filesToUpload.length === 1) {
      handleUpload(filesToUpload[0]);
      return;
    }

    for (const f of filesToUpload) {
      if (f.size > 25 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: `"${f.name}" exceeds the maximum allowed 25 MB size.`,
          severity: "error",
        });
        return;
      }
    }

    const controller = new AbortController();
    uploadAbortControllerRef.current = controller;

    setLoading(true);
    setBatchFiles(filesToUpload);
    setBatchCurrentIndex(0);
    const totalFiles = filesToUpload.length;
    let createdDocId = null;

    try {
      // 1. Upload initial file to create the single document / envelope
      const firstFile = filesToUpload[0];
      setFile(firstFile);
      setUploadProgress(1);
      setProcessingMsg(`Uploading primary document (1 of ${totalFiles}): ${firstFile.name}...`);

      const res = await uploadDocument(
        firstFile,
        (percent) => {
          if (controller.signal.aborted) return;
          const mapped = Math.min(85, Math.max(1, Math.round((percent / totalFiles) * 0.85)));
          setUploadProgress(mapped);
          setProcessingMsg(`Uploading document 1 of ${totalFiles} (${percent}%): ${firstFile.name}`);
        },
        controller.signal
      );

      if (controller.signal.aborted) return;

      createdDocId = res?.document_id || res?.document?.id;
      if (!createdDocId) throw new Error("Upload did not return document ID");

      // Wait for primary file initial processing on backend
      setUploadProgress(Math.round(85 / totalFiles));
      setProcessingMsg(`Processing primary document (1 of ${totalFiles})...`);

      let isDone = false;
      let pollCount = 0;
      const MAX_POLLS = 100;

      while (!isDone && pollCount < MAX_POLLS) {
        if (controller.signal.aborted) break;
        pollCount++;
        await new Promise((r) => setTimeout(r, 600));
        if (controller.signal.aborted) break;

        try {
          const statusRes = await getDocumentStatus(createdDocId);
          if (controller.signal.aborted) break;

          const backendProgress = statusRes.progress || 0;
          const backendMsg = statusRes.processing_status || "Processing...";
          const stepSpan = Math.round(100 / totalFiles);
          const mappedProgress = Math.min(stepSpan, Math.round((backendProgress / 100) * stepSpan));
          setUploadProgress(Math.max(1, mappedProgress));
          setProcessingMsg(`Document 1 of ${totalFiles}: ${backendMsg}`);

          if (statusRes.status !== "processing" || backendProgress >= 100) {
            isDone = true;
          }
        } catch (pollErr) {
          console.error("Primary file status poll err:", pollErr);
          if (pollCount > 4) isDone = true;
        }
      }

      if (controller.signal.aborted) return;

      // 2. Add remaining files to this single document (ref: PrepareSendRecipients add document module)
      for (let i = 1; i < totalFiles; i++) {
        if (controller.signal.aborted) break;

        const currentFile = filesToUpload[i];
        setBatchCurrentIndex(i);
        setFile(currentFile);
        const fileStepBase = Math.round((i / totalFiles) * 90);
        const fileStepSpan = Math.round((1 / totalFiles) * 90);

        setUploadProgress(fileStepBase);
        setProcessingMsg(`Adding document ${i + 1} of ${totalFiles}: ${currentFile.name}...`);

        await addFileToDocument(
          createdDocId,
          currentFile,
          (percent) => {
            if (controller.signal.aborted) return;
            const mapped = fileStepBase + Math.round((percent / 100) * (fileStepSpan * 0.7));
            setUploadProgress(Math.min(95, mapped));
            setProcessingMsg(`Uploading document ${i + 1} of ${totalFiles} (${percent}%): ${currentFile.name}`);
          },
          controller.signal
        );

        if (controller.signal.aborted) break;

        // Poll for backend to finish processing and merging this added file
        let addDone = false;
        let addPollCount = 0;
        while (!addDone && addPollCount < MAX_POLLS) {
          if (controller.signal.aborted) break;
          addPollCount++;
          await new Promise((r) => setTimeout(r, 600));
          if (controller.signal.aborted) break;

          try {
            const statusRes = await getDocumentStatus(createdDocId);
            if (controller.signal.aborted) break;

            const backendProgress = statusRes.progress || 0;
            const backendMsg = statusRes.processing_status || "Merging file...";
            const mapped = fileStepBase + Math.round((backendProgress / 100) * fileStepSpan);
            setUploadProgress(Math.min(95, Math.max(fileStepBase, mapped)));
            setProcessingMsg(`Document ${i + 1} of ${totalFiles}: ${backendMsg}`);

            if (statusRes.status !== "processing" || backendProgress >= 100) {
              addDone = true;
            }
          } catch (pollErr) {
            console.error("Add file status poll err:", pollErr);
            if (addPollCount > 4) addDone = true;
          }
        }
      }

      if (controller.signal.aborted) return;

      // 3. Finalization - All files successfully added to the single document!
      setUploadProgress(100);
      setProcessingMsg(`Complete! Created envelope with ${totalFiles} documents.`);

      // Fetch the final document info
      const finalDocRes = await getDocumentsPaged(1, 10, filters.status);
      const newDoc = finalDocRes.documents?.find(d => d.id === createdDocId);

      setUploadedDocument(newDoc || { id: createdDocId, filename: filesToUpload[0].name });
      setShowSuccessDialog(true);
      setSnackbar({
        open: true,
        message: `Successfully created document with ${totalFiles} files!`,
        severity: "success",
      });
      loadDocs();
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError" || controller.signal.aborted) {
        console.log("Upload aborted by user.");
        return;
      }
      console.error("Multi-file document creation error:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || err.message || "Failed to create document from files",
        severity: "error",
      });
      loadDocs();
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setUploadProgress(0);
        setProcessingMsg("");
        setBatchFiles([]);
        setBatchCurrentIndex(0);
        uploadAbortControllerRef.current = null;
      }
    }
  };

  const handleUpload = async (uploadFile) => {
    if (!uploadFile) return;

    if (uploadFile.size > 25 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: `"${uploadFile.name}" exceeds the maximum allowed 25 MB size.`,
        severity: "error",
      });
      return;
    }

    // Create fresh AbortController for this upload session
    const controller = new AbortController();
    uploadAbortControllerRef.current = controller;

    setLoading(true);
    setUploadProgress(1);
    setProcessingMsg("Transferring document to server... 1%");

    try {
      // 1. Initial Upload with real byte progress (1% to 85%)
      const res = await uploadDocument(
        uploadFile,
        (percent) => {
          if (controller.signal.aborted) return;
          const mapped = Math.min(85, Math.max(1, Math.round(percent * 0.85)));
          setUploadProgress(mapped);
          setProcessingMsg(`Transferring document to server... ${percent}%`);
        },
        controller.signal
      );

      if (controller.signal.aborted) return;

      console.log("UPLOAD RESPONSE (INITIAL):", res);
      const docId = res?.document_id || res?.document?.id;
      if (!docId) throw new Error("Upload API did not return document id");

      // 2. Poll for Background Processing Status (85% to 99%)
      setUploadProgress(85);
      setProcessingMsg("Transferred! Converting and processing document...");

      let isDone = false;
      let pollCount = 0;
      const MAX_POLLS = 120; // 2 minutes max polling

      while (!isDone && pollCount < MAX_POLLS) {
        if (controller.signal.aborted) return;

        pollCount++;
        await new Promise(r => setTimeout(r, 600));

        if (controller.signal.aborted) return;

        try {
          const statusRes = await getDocumentStatus(docId);
          if (controller.signal.aborted) return;

          const backendProgress = statusRes.progress || 0;
          const backendMsg = statusRes.processing_status || "Processing...";

          // Map backend progress (0-100) to frontend display range (85-99%)
          const mappedProgress = Math.min(99, 85 + Math.round((backendProgress / 100) * 14));

          setUploadProgress(mappedProgress);
          setProcessingMsg(backendMsg);

          if (statusRes.status !== "processing" || backendProgress >= 100) {
            isDone = true;
          }
        } catch (pollErr) {
          console.error("Status check error:", pollErr);
          if (pollCount > 5) isDone = true;
        }
      }

      if (controller.signal.aborted) return;

      // 3. Finalization (100%)
      setUploadProgress(100);
      setProcessingMsg("Complete!");

      // Fetch the final document data
      const finalDocRes = await getDocumentsPaged(1, 10, filters.status);
      const newDoc = finalDocRes.documents.find(d => d.id === docId);

      setUploadedDocument(newDoc || { id: docId });
      setShowSuccessDialog(true);
      setSnackbar({ open: true, message: "Document uploaded successfully", severity: "success" });
      loadDocs();

    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError" || controller.signal.aborted) {
        console.log("Upload request aborted by user.");
        return;
      }
      console.error("Upload error:", err);
      setSnackbar({ open: true, message: err.response?.data?.detail || err.message || "Upload failed", severity: "error" });
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setUploadProgress(0);
        setProcessingMsg("");
        uploadAbortControllerRef.current = null;
      }
    }
  };



  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | info | warning
  });





  // const totalPages = Math.ceil(documents.length / pageSize);

  // const paginatedDocs = documents.slice(
  //   (currentPage - 1) * pageSize,
  //   currentPage * pageSize
  // );




  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    if (user?.role !== "admin" && !user?.has_active_subscription) {
      setPlanRestrictionOpen(true);
      return;
    }

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (!droppedFiles.length) return;

    if (droppedFiles.length === 1) {
      const droppedFile = droppedFiles[0];
      if (droppedFile.size > 25 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: `"${droppedFile.name}" exceeds the maximum allowed 25 MB size.`,
          severity: "error",
        });
        return;
      }
      const isDocx = droppedFile.name.toLowerCase().endsWith('.docx');
      if (isDocx) {
        setFile(droppedFile);
        handleUpload(droppedFile);
      } else {
        setFile(droppedFile);
        setPreviewFile(droppedFile);
        setPreviewOpen(true);
      }
    } else {
      handleBatchUpload(droppedFiles);
    }
  };

  // =============================================
  // CLOUD PROVIDER HANDLERS
  // =============================================

  const handleCloudProviderSelect = (provider) => {
    if (user?.role !== "admin" && !user?.has_active_subscription) {
      setPlanRestrictionOpen(true);
      return;
    }
    setShowCloudProviders(false);

    switch (provider) {
      case 'google':
        handleGooglePicker();
        break;
      case 'dropbox':
        handleDropboxChooser();
        break;
      case 'onedrive':
        handleOneDrivePicker();
        break;
      case 'box':
        handleBoxPicker();
        break;
      default:
        break;
    }
  };

  // =============================================
  // GOOGLE DRIVE IMPLEMENTATION
  // =============================================

  const handleGooglePicker = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/documents`;

    if (!clientId) {
      showAlert.error('Configuration Needed', 'Google Client ID is not configured. Please contact your system administrator.');
      return;
    }

    const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.readonly');
    const state = "google_auth";

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&access_type=offline` +
      `&prompt=consent`;

    console.log('Redirecting to Google Auth...');
    window.location.href = authUrl;
  };

  const handleGoogleAuthCallback = async (code) => {
    try {
      console.log('Exchanging Google code for token...');
      const res = await exchangeGoogleToken(code);

      if (!res.access_token) {
        throw new Error("No access token received from Google");
      }

      const token = res.access_token;
      setGoogleAccessToken(token);
      localStorage.setItem("google_access_token", token);

      window.history.replaceState({}, document.title, "/documents");
      loadGooglePicker(token);

    } catch (err) {
      console.error("Google auth failed:", err);
      showAlert.error("Google Sign-In Unsuccessful", showAlert.extractMessage(err, "We were unable to complete authentication with Google Drive. Please try logging in again."));
    }
  };

  const loadGooglePicker = (accessToken) => {
    if (!window.google || !window.google.picker) {
      if (window.gapi) {
        window.gapi.load('picker', {
          callback: () => showGooglePicker(accessToken),
          onerror: () => {
            console.error('Failed to load Google Picker API');
            showAlert.error('Google Drive Connection Issue', 'We were unable to initialize the Google Drive selector. Please refresh the page and try again.');
          }
        });
      } else {
        showAlert.error('Connection Error', 'Google API libraries are currently unreachable. Please check your internet connection and try again.');
      }
    } else {
      showGooglePicker(accessToken);
    }
  };

  const showGooglePicker = (accessToken) => {
    try {
      const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
      view.setMimeTypes('application/pdf,image/png,image/jpeg,image/jpg');

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(process.env.REACT_APP_GOOGLE_API_KEY)
        .setCallback(async (data) => {
          if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
            const doc = data[window.google.picker.Response.DOCUMENTS][0];
            const fileMeta = {
              id: doc[window.google.picker.Document.ID],
              name: doc[window.google.picker.Document.NAME],
              mimeType: doc[window.google.picker.Document.MIME_TYPE],
              size: doc[window.google.picker.Document.SIZE_BYTES]
            };

            try {
              await uploadFromCloud("google", fileMeta, {
                accessToken: accessToken,
                downloadFile: true
              });
              setSnackbar({
                open: true,
                message: "File uploaded from Google Drive successfully",
                severity: "success",
              });

              loadDocs();
            } catch (error) {
              console.error("Google Drive upload error:", error);
              setSnackbar({
                open: true,
                message: "Failed to upload file from Google Drive",
                severity: "error",
              });

            }
          }
        })
        .build();

      picker.setVisible(true);
    } catch (error) {
      console.error("Google Picker error:", error);
      alert("Failed to open Google Picker. Please try again.");
    }
  };

  // =============================================
  // DROPBOX IMPLEMENTATION
  // =============================================

  const handleDropboxChooser = () => {
    if (!window.Dropbox) {
      showAlert.error("SDK Not Ready", "Dropbox SDK is currently loading or unavailable. Please check your internet connection.");
      return;
    }

    const options = {
      success: async (files) => {
        if (files && files.length > 0) {
          try {
            const file = files[0];
            console.log("Dropbox file selected:", file);

            const fileMeta = {
              id: file.id || file.link,
              name: file.name,
              link: file.link,
              bytes: file.bytes
            };

            await uploadFromCloud("dropbox", fileMeta);
            showAlert.success("Upload Successful", `"${file.name}" has been imported from Dropbox successfully.`);
            loadDocs();
          } catch (error) {
            console.error("Dropbox upload error:", error);
            showAlert.error("Upload Failed", showAlert.extractMessage(error, "Failed to import your file from Dropbox. Please try again."));
          }
        }
      },
      error: (error) => {
        console.error("Dropbox chooser error:", error);
        showAlert.error("Dropbox Chooser Error", "Unable to select file from Dropbox. Please try again.");
      },
      linkType: "preview",
      multiselect: false,
      extensions: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
    };

    window.Dropbox.choose(options);
  };

  // =============================================
  // ONEDRIVE IMPLEMENTATION
  // =============================================

  const handleOneDrivePicker = () => {
    if (!window.OneDrive) {
      showAlert.error("SDK Not Ready", "OneDrive SDK is currently unavailable. Please verify your internet connection.");
      return;
    }

    const odOptions = {
      clientId: process.env.REACT_APP_ONEDRIVE_CLIENT_ID,
      action: "download",

      multiSelect: false,
      advanced: {
        filter: ".pdf,.docx,.png,.jpg,.jpeg",
        redirectUri: window.location.origin
      },
      success: async (files) => {
        if (files && files.value && files.value.length > 0) {
          try {
            const file = files.value[0];
            const fileMeta = {
              id: file.id,
              name: file.name,
              downloadUrl: file['@microsoft.graph.downloadUrl'],
              size: file.size
            };

            await uploadFromCloud("onedrive", fileMeta);
            showAlert.success("Upload Successful", `"${file.name}" was imported from OneDrive successfully.`);
            loadDocs();
          } catch (error) {
            console.error("OneDrive upload error:", error);
            showAlert.error("OneDrive Import Error", showAlert.extractMessage(error, "We encountered an issue importing your document from OneDrive."));
          }
        }
      },
      cancel: () => console.log("OneDrive picker cancelled"),
      error: (e) => {
        console.error("OneDrive picker error:", e);
        showAlert.error("OneDrive Selector Issue", "An error occurred while connecting to Microsoft OneDrive. Please try again.");
      },
    };
    window.OneDrive.open(odOptions);
  };

  // =============================================
  // BOX IMPLEMENTATION
  // =============================================

  const handleBoxPicker = () => {
    console.log('Box Token Status:', boxToken ? 'Token exists' : 'No token');

    if (!boxToken) {
      authenticateWithBox();
      return;
    }
    setShowBoxPicker(true);
    loadBoxFiles();
  };

  const authenticateWithBox = () => {
    const clientId = process.env.REACT_APP_BOX_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_BOX_REDIRECT_URI || `${window.location.origin}/documents`;

    if (!clientId) {
      showAlert.error('Configuration Required', 'Box Client ID is not configured. Please check system settings.');
      return;
    }

    const authUrl = `https://account.box.com/api/oauth2/authorize?` +
      `response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=box_auth`;

    console.log('Redirecting to Box Auth...');
    window.location.href = authUrl;
  };

  const handleBoxAuthCallback = async (code) => {
    try {
      console.log('Exchanging Box code for token...');
      const res = await exchangeBoxToken(code);

      if (!res.access_token) {
        throw new Error("No access token received from Box");
      }

      const token = res.access_token;
      localStorage.setItem("box_access_token", token);
      setBoxToken(token);

      showAlert.toast('success', 'Box connected successfully!');
      window.history.replaceState({}, document.title, "/documents");

      setShowBoxPicker(true);
      loadBoxFiles("0", token);

    } catch (err) {
      console.error("Box auth failed:", err);
      showAlert.error("Box Connection Failed", showAlert.extractMessage(err, "Could not complete Box authentication. Please try connecting again."));
    }
  };

  const loadBoxFiles = async (folderId = "0", token = boxToken) => {
    if (!token) {
      console.error('No Box token available');
      return;
    }

    setBoxLoading(true);
    try {
      console.log('Loading Box files for folder:', folderId);

      const response = await getBoxFiles(folderId, token);
      console.log('Box files loaded:', response.files);

      setBoxFiles(response.files || []);
      setBoxCurrentFolder(folderId);

    } catch (error) {
      console.error("Error loading Box files:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("box_access_token");
        setBoxToken(null);
        showAlert.warning("Session Expired", "Your Box authorization has expired. Please reconnect your account.");
        authenticateWithBox();
      } else {
        showAlert.error("Box Error", showAlert.extractMessage(error, "Unable to fetch files from Box. Please check your network connection."));
      }
    } finally {
      setBoxLoading(false);
    }
  };

  const handleBoxBack = async () => {
    if (boxCurrentFolder === "0") return;

    try {
      const response = await getBoxFolderInfo(boxCurrentFolder, boxToken);

      if (response.parent) {
        loadBoxFiles(response.parent.id);
      } else {
        loadBoxFiles("0");
      }
    } catch (error) {
      console.error("Error navigating back:", error);
      loadBoxFiles("0");
    }
  };

  const handleBoxFileSelect = async (file) => {
    if (file.type !== "file") {
      loadBoxFiles(file.id);
      return;
    }

    try {
      setBoxLoading(true);
      console.log('Uploading Box file:', file);

      await uploadFromBox(
        {
          id: file.id,
          name: file.name,
          size: file.size
        },
        boxToken
      );

      showAlert.success("Import Complete", `"${file.name}" was imported from Box successfully.`);
      setShowBoxPicker(false);
      loadDocs();

    } catch (error) {
      console.error("Box upload error:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("box_access_token");
        setBoxToken(null);
        showAlert.warning("Session Expired", "Your Box authorization session expired. Please reconnect.");
        authenticateWithBox();
      } else {
        showAlert.error("Import Failed", showAlert.extractMessage(error, "Failed to upload document from Box. Please try again."));
      }
    } finally {
      setBoxLoading(false);
    }
  };

  // =============================================
  // TEMPLATE HANDLERS
  // =============================================

  const handleTemplateSelect = async (template) => {
    try {
      const templateId = template?.id || template?.templateId;
      if (!templateId) {
        throw new Error("templateId is missing");
      }

      setLoading(true);
      const title = template.name || template.title || "Template";

      const res = await fetch(`${API_BASE_URL}/documents/from-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          template_id: templateId,
          title: `Copy of ${title}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Backend error:", data);
        throw new Error(data.detail || "Backend failed");
      }

      setShowTemplateBrowser(false);

      const newDocId = data.document_id || data.id;
      if (newDocId) {
        navigate(`/user/prepare-send/${newDocId}`, {
          state: {
            document: {
              id: newDocId,
              filename: `${title}.pdf`,
              title: title,
              page_count: 1,
              source: "template"
            },
            fromTemplate: true,
            templateName: title
          }
        });
      } else {
        loadDocs();
      }
    } catch (err) {
      console.error("CREATE FROM TEMPLATE ERROR:", err);
      alert(err.message || "Failed to create document from template");
    } finally {
      setLoading(false);
    }
  };

  // Alternative approach: Direct download and upload template
  const handleTemplateDownloadAndUpload = async (template) => {
    if (!template || !template.id) {
      setSnackbar({
        open: true,
        message: "Invalid template data",
        severity: "error",
      });
      return;
    }

    setTemplateLoading(true);

    try {
      // Step 1: Download template file
      const downloadResponse = await fetch(
        `${API_BASE_URL}/admin/templates/user/download/${template.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!downloadResponse.ok) {
        throw new Error(`Failed to download template: ${downloadResponse.status}`);
      }

      // Get the file blob
      const blob = await downloadResponse.blob();

      // Step 2: Create a file from blob
      const templateFile = new File(
        [blob],
        `${template.name || 'template'}.pdf`,
        { type: blob.type || 'application/pdf' }
      );

      // Step 3: Upload as a new document
      setFile(templateFile);
      setPreviewFile(templateFile);
      setPreviewOpen(true);

      // Close template browser
      setShowTemplateBrowser(false);

    } catch (err) {
      console.error("Template download error:", err);
      setSnackbar({
        open: true,
        message: `Failed to process template: ${err.message}`,
        severity: "error",
      });
    } finally {
      setTemplateLoading(false);
    }
  };

  // Simple template usage - direct API call
  const useTemplateSimple = async (template) => {
    if (!template || !template.id) {
      showAlert.warning("Template Required", "Please select a valid template to proceed.");
      return;
    }

    setTemplateLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/from-template`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: template.id,
          title: `Copy of ${template.name || 'Template'}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const newDocId = result.document_id || result.document?.id || result.document?._id;
      if (newDocId) {
        setShowTemplateBrowser(false);
        navigate(`/user/prepare-send/${newDocId}`, {
          state: {
            document: result.document || {
              id: newDocId,
              filename: `${template.name || 'Template'}.pdf`,
              title: template.name || 'Template',
              page_count: 1,
              source: "template"
            },
            fromTemplate: true,
            templateName: template.name
          }
        });
      } else {
        showAlert.success("Document Created", `A new document copy was created from "${template.name}" successfully.`);
        loadDocs();
        setShowTemplateBrowser(false);
      }

    } catch (err) {
      console.error("Template usage error:", err);
      showAlert.error("Template Copy Failed", showAlert.extractMessage(err, "Could not generate a document copy from this template. Please try again."));
    } finally {
      setTemplateLoading(false);
    }
  };


  const handleTemplateUse = (template) => {
    console.log('Template selected for use:', template);
  };

  const handleDownload = async (doc) => {
    try {
      // Try downloading final signed PDF first
      await downloadDocument(doc.id, doc.filename, "signed"); // type="signed"
    } catch (err) {
      if (err.response?.status === 400) {
        // Final PDF not ready → fallback to original
        await downloadDocument(doc.id, doc.filename, "original");
      } else {
        showAlert.error("Download Error", showAlert.extractMessage(err, "We were unable to download this document. Please try again."));
      }
    }
  };

  const handleDownloadPackage = async (doc) => {
    try {
      setLoading(true);
      await downloadDocument(doc.id, doc.filename, "package");
    } catch (err) {
      console.error("Package download error:", err);
      showAlert.error("Package Download Error", showAlert.extractMessage(err, "Failed to download the complete audit & document package. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleBuildTemplate = (document) => {
    navigate(`/user/documentbuilder/${document.id}`);
  };


  // const handleBuildTemplate = (document) => {
  //   // Save document to localStorage for the builder page
  //   localStorage.setItem('selectedDocument', JSON.stringify(document));

  //   // Navigate to the builder page
  //   navigate('/user/documentbuilder', { 
  //     state: { document } 
  //   });
  // };


  // =============================================
  // DOCUMENT MANAGEMENT
  // =============================================

  // const handleDelete = async (id) => {
  //   if (!window.confirm("Are you sure you want to delete this document?")) return;
  //   try {
  //     await deleteDocument(id);
  //     loadDocs();
  //     alert("Document deleted successfully");
  //   } catch (error) {
  //     console.error("Delete error:", error);
  //     alert("Failed to delete document: " + (error.response?.data?.detail || error.message));
  //   }
  // };

  const getFileIcon = (filename) => {
    const ext = filename ? filename.split('.').pop()?.toLowerCase() : "";
    if (ext === 'pdf') {
      return (
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            bgcolor: "#FEF2F2",
            color: "#EF4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1px solid #FEE2E2",
          }}
        >
          <FaFilePdf size={18} />
        </Box>
      );
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return (
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            bgcolor: "#ECFDF5",
            color: "#10B981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1px solid #D1FAE5",
          }}
        >
          <FaFileImage size={18} />
        </Box>
      );
    }
    if (['doc', 'docx'].includes(ext)) {
      return (
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            bgcolor: "#EFF6FF",
            color: "#2563EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1px solid #DBEAFE",
          }}
        >
          <FaFileWord size={18} />
        </Box>
      );
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return (
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            bgcolor: "#F0FDF4",
            color: "#16A34A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1px solid #DCFCE7",
          }}
        >
          <FaFileAlt size={18} />
        </Box>
      );
    }
    return (
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: "10px",
          bgcolor: "#F8FAFC",
          color: "#64748B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: "1px solid #E2E8F0",
        }}
      >
        <FaFileAlt size={18} />
      </Box>
    );
  };

  const renderSourceBadge = (source) => {
    const s = String(source || "").toLowerCase();
    let icon = <ComputerIcon sx={{ fontSize: 13, color: "#0284C7" }} />;
    let label = "Local";
    let bg = "#F0F9FF";
    let color = "#0284C7";
    let border = "#BAE6FD";

    if (s.includes("google")) {
      icon = <FaGoogleDrive size={12} style={{ color: "#4285F4" }} />;
      label = "Google Drive";
      bg = "#EFF6FF";
      color = "#1D4ED8";
      border = "#DBEAFE";
    } else if (s.includes("dropbox")) {
      icon = <FaDropbox size={12} style={{ color: "#0061FF" }} />;
      label = "Dropbox";
      bg = "#F0F9FF";
      color = "#0369A1";
      border = "#E0F2FE";
    } else if (s.includes("onedrive") || s.includes("microsoft")) {
      icon = <FaMicrosoft size={12} style={{ color: "#0078D4" }} />;
      label = "OneDrive";
      bg = "#EFF6FF";
      color = "#2563EB";
      border = "#DBEAFE";
    } else if (s.includes("box")) {
      icon = <FaBox size={12} style={{ color: "#0061D5" }} />;
      label = "Box";
      bg = "#FEF3C7";
      color = "#B45309";
      border = "#FDE68A";
    } else if (s.includes("template")) {
      icon = <AutoAwesome sx={{ fontSize: 13, color: "#7C3AED" }} />;
      label = "Template";
      bg = "#F5F3FF";
      color = "#6D28D9";
      border = "#DDD6FE";
    }

    return (
      <Chip
        size="small"
        icon={icon}
        label={label}
        sx={{
          bgcolor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontWeight: 600,
          fontSize: "11.5px",
          height: 24,
          "& .MuiChip-label": { px: 0.8 },
          "& .MuiChip-icon": { ml: "6px", mr: "-2px" },
        }}
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return { date: "—", time: "" };
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return { date: dateString, time: "" };
      return {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
        time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      return { date: dateString, time: "" };
    }
  };

  const templates = [
    { id: 1, name: "Employment Contract", icon: <FaFileAlt />, description: "Standard employment agreement template" },
    { id: 2, name: "NDA Agreement", icon: <FaFileAlt />, description: "Non-disclosure agreement template" },
    { id: 3, name: "Sales Proposal", icon: <FaFileAlt />, description: "Professional sales proposal template" },
    { id: 4, name: "Meeting Minutes", icon: <FaFileAlt />, description: "Formal meeting minutes template" },
  ];

  return (
    <Box sx={{ maxWidth: 1140, mx: "auto", px: { xs: 2.5, sm: 4, md: 6, lg: 8 }, py: { xs: 2.5, sm: 4 } }}>
      {/* Keyframe animations and dropdown behaviors */}
      <style>{`
        @keyframes ss-tri-spinner {
          100% { transform: rotate(1turn); }
        }
        @keyframes ss-cycle-words {
          0%, 12% { transform: translateY(0); }
          16%, 28% { transform: translateY(-44px); }
          32%, 44% { transform: translateY(-88px); }
          48%, 60% { transform: translateY(-132px); }
          64%, 76% { transform: translateY(-176px); }
          80%, 92% { transform: translateY(-220px); }
          100% { transform: translateY(0); }
        }
        .ss-loading-spinner {
          width: 56px;
          height: 56px;
          display: grid;
          border: 4px solid transparent;
          border-radius: 50%;
          border-right-color: #0f766e;
          animation: ss-tri-spinner 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .ss-loading-spinner::before,
        .ss-loading-spinner::after {
          content: "";
          grid-area: 1/1;
          margin: 2px;
          border: inherit;
          border-radius: 50%;
          animation: ss-tri-spinner 2s infinite;
        }
        .ss-loading-spinner::after {
          margin: 8px;
          animation-duration: 3s;
        }
      `}</style>

      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            width: "100%",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: "#0F172A",
                  letterSpacing: "-0.02em",
                  fontSize: { xs: "1.5rem", sm: "1.75rem" },
                }}
              >
                My Documents
              </Typography>
            </Box>
            <Typography sx={{ color: "#64748B", fontSize: { xs: "0.875rem", sm: "0.95rem" } }}>
              Upload, manage, sign, and track all your contracts and documents in one place
            </Typography>
          </Box>

          {/* Refresh Button at Right Corner */}
          <Box sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}>
            <Tooltip title="Reload documents list">
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon sx={{ fontSize: 17, animation: listLoading ? "spin 1s linear infinite" : "none" }} />}
                onClick={loadDocs}
                disabled={listLoading}
                sx={{
                  borderRadius: "10px",
                  borderColor: "#E2E8F0",
                  color: "#475569",
                  bgcolor: "#FFFFFF",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  px: 2,
                  py: 0.85,
                  "&:hover": { borderColor: "#0F766E", bgcolor: "#F0FDFA", color: "#0F766E" },
                }}
              >
                Refresh
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Modern Compact Upload Hero Section */}
      <Paper
        elevation={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          mb: 3,
          py: { xs: 2.5, sm: 3 },
          px: { xs: 2.5, sm: 4 },
          borderRadius: "16px",
          border: "1.5px dashed",
          borderColor: dragOver ? "#0F766E" : "#CBD5E1",
          background: dragOver
            ? "radial-gradient(circle at 50% 50%, #ECFDF5 0%, #F0FDFA 100%)"
            : "radial-gradient(circle at 50% 0%, #F8FAFC 0%, #FFFFFF 100%)",
          boxShadow: dragOver
            ? "0 10px 25px -10px rgba(15, 118, 110, 0.25)"
            : "0 1px 2px rgba(0, 0, 0, 0.02)",
          textAlign: "center",
          position: "relative",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            borderColor: "#0F766E",
          },
        }}
      >
        {/* Compact Icon Badge */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "14px",
            bgcolor: dragOver ? "#0F766E" : "#F0FDFA",
            color: dragOver ? "#FFFFFF" : "#0F766E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 1.5,
            border: "1px solid",
            borderColor: dragOver ? "#0F766E" : "#CCFBF1",
            boxShadow: dragOver
              ? "0 8px 18px rgba(15, 118, 110, 0.3)"
              : "0 2px 8px rgba(15, 118, 110, 0.08)",
            transition: "all 0.2s ease",
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 24 }} />
        </Box>

        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 700,
            color: "#0F172A",
            letterSpacing: "-0.01em",
            fontSize: { xs: "1.1rem", sm: "1.2rem" },
            mb: 0.5,
          }}
        >
          Upload Your Documents
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#64748B",
            fontSize: "0.85rem",
            maxWidth: 480,
            mx: "auto",
            mb: 2,
          }}
        >
          Drag & drop files here or choose from the options below
        </Typography>

        {/* Single Centered Dropdown Button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 1.5,
          }}
        >
          <Button
            variant="contained"
            startIcon={<FiUpload size={16} />}
            endIcon={
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: "18px",
                  transition: "transform 0.2s",
                  transform: uploadAnchorEl ? "rotate(180deg)" : "none",
                }}
              />
            }
            onClick={(e) => setUploadAnchorEl(e.currentTarget)}
            disabled={loading}
            sx={{
              bgcolor: "#0F766E",
              color: "#FFFFFF",
              "&:hover": { bgcolor: "#115E59" },
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "13.5px",
              px: 3,
              py: 1,
              boxShadow: "0 2px 8px rgba(15, 118, 110, 0.25)",
            }}
          >
            {loading ? "Uploading..." : "Upload Document"}
          </Button>
        </Box>

        {/* Supported Formats */}
        <Typography
          variant="caption"
          sx={{
            color: "#94A3B8",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            fontSize: "11.5px",
            fontWeight: 500,
          }}
        >
          <span>Supports PDF, DOC, DOCX, PNG, JPG</span>
          <span>•</span>
          <span>Max 25 MB</span>
        </Typography>

        {/* Upload Options Menu */}
        <Menu
          anchorEl={uploadAnchorEl}
          open={Boolean(uploadAnchorEl)}
          onClose={() => setUploadAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          PaperProps={{
            elevation: 4,
            sx: {
              borderRadius: "14px",
              minWidth: 220,
              mt: 1,
              border: "1px solid #E2E8F0",
              p: 0.75,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <MenuItem
            onClick={() => {
              setUploadAnchorEl(null);
              handleLocalUpload();
            }}
            sx={{
              py: 1.25,
              gap: 1.5,
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: 600,
              color: "#334155",
              "&:hover": { bgcolor: "#F0FDFA", color: "#0F766E" },
            }}
          >
            <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
              <FiUploadCloud size={17} />
            </ListItemIcon>
            <ListItemText
              primary="Upload from Computer"
              primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => {
              setUploadAnchorEl(null);
              setShowCloudProviders(true);
            }}
            sx={{
              py: 1.25,
              gap: 1.5,
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: 600,
              color: "#334155",
              "&:hover": { bgcolor: "#F0FDFA", color: "#0F766E" },
            }}
          >
            <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
              <CloudUploadIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary="Cloud Storage"
              primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => {
              setUploadAnchorEl(null);
              if (user?.role !== "admin" && !user?.has_active_subscription) {
                setPlanRestrictionOpen(true);
              } else {
                setShowTemplateBrowser(true);
              }
            }}
            sx={{
              py: 1.25,
              gap: 1.5,
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: 600,
              color: "#334155",
              "&:hover": { bgcolor: "#F0FDFA", color: "#0F766E" },
            }}
          >
            <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
              <AiOutlineFileText size={17} />
            </ListItemIcon>
            <ListItemText
              primary="Start from Template"
              primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }}
            />
          </MenuItem>

          <Divider sx={{ my: 0.75 }} />

          <Box sx={{ p: 0.5 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AutoAwesome sx={{ fontSize: 16 }} />}
              onClick={() => {
                setUploadAnchorEl(null);
                setTemplateBrowserOpen(true);
              }}
              sx={{
                py: 0.9,
                px: 1.5,
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "9px",
                background: "linear-gradient(90deg, #0F766E, #0284C7)",
                color: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(15, 118, 110, 0.25)",
                "&:hover": {
                  background: "linear-gradient(90deg, #115E59, #0369A1)",
                },
              }}
            >
              Generate AI Template
            </Button>
          </Box>
        </Menu>

        {/* Uploading progress dialog */}
        <Dialog
          open={loading}
          PaperProps={{
            sx: {
              borderRadius: "20px",
              p: 3.5,
              width: "100%",
              maxWidth: "380px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15)",
            },
          }}
        >
          <img
            src="/images/uploading.gif"
            alt="Uploading"
            className="w-16 h-16 object-contain mb-3"
          />
          {batchFiles.length > 1 && (
            <Box
              sx={{
                mb: 1.5,
                px: 1.5,
                py: 0.5,
                bgcolor: "#F0FDFA",
                border: "1px solid #CCFBF1",
                borderRadius: "20px",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Typography variant="caption" sx={{ color: "#0F766E", fontWeight: 700 }}>
                Combining {batchFiles.length} files into 1 document
              </Typography>
            </Box>
          )}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#0F172A",
              fontSize: "1.05rem",
              mb: 0.5,
            }}
          >
            {processingMsg || "Uploading document…"}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#64748B",
              display: "block",
              mb: 2,
              maxWidth: 280,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={file?.name}
          >
            {batchFiles.length > 1 ? `File ${batchCurrentIndex + 1} of ${batchFiles.length}: ${file?.name}` : file?.name}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, color: "#0F766E", mb: 1.5 }}
          >
            {uploadProgress}%
          </Typography>
          <Box sx={{ width: "100%", mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "#F1F5F9",
                "& .MuiLinearProgress-bar": {
                  background: "linear-gradient(90deg, #34D399, #0F766E)",
                  borderRadius: 4,
                },
              }}
            />
          </Box>
          <Button
            variant="outlined"
            onClick={cancelUpload}
            fullWidth
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#64748B",
              borderColor: "#CBD5E1",
              borderRadius: "10px",
              py: 1,
              "&:hover": { bgcolor: "#F8FAFC", borderColor: "#94A3B8" },
            }}
          >
            Cancel Upload
          </Button>
        </Dialog>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: "none" }}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          multiple
        />
      </Paper>

      {/* Cloud Providers Selection Card */}
      {showCloudProviders && (
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: "18px",
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, pb: 1.5, borderBottom: "1px solid #F1F5F9" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1E293B", fontSize: "1.05rem" }}>
                Import from Cloud Storage
              </Typography>
             
            </Box>
            <IconButton
              size="small"
              onClick={() => setShowCloudProviders(false)}
              sx={{ color: "#94A3B8", "&:hover": { color: "#1E293B", bgcolor: "#F1F5F9" } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
            {[
              { id: "google", name: "Google Drive", desc: "Docs, PDFs & Sheets", icon: <FaGoogleDrive size={24} /> },
              { id: "dropbox", name: "Dropbox", desc: "Files from Dropbox folder", icon: <FaDropbox size={24} /> },
              { id: "onedrive", name: "OneDrive", desc: "Microsoft 365 & Word", icon: <FaMicrosoft size={24} /> },
              { id: "box", name: "Box", desc: "Enterprise cloud storage", icon: <FaBox size={24} /> },
            ].map((prov) => (
              <Box
                key={prov.id}
                component="button"
                type="button"
                onClick={() => handleCloudProviderSelect(prov.id)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  p: 2.75,
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: "#0F766E",
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 20px -4px rgba(15, 118, 110, 0.15)",
                    bgcolor: "#F0FDFA",
                    "& .cloud-icon-badge": {
                      bgcolor: "#0F766E",
                      color: "#FFFFFF",
                      borderColor: "#0F766E",
                    },
                    "& .cloud-title": {
                      color: "#0F766E",
                    },
                  },
                }}
              >
                <Box
                  className="cloud-icon-badge"
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    bgcolor: "#F0FDFA",
                    color: "#0F766E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1.5,
                    border: "1px solid #CCFBF1",
                    transition: "all 0.2s ease",
                  }}
                >
                  {prov.icon}
                </Box>
                <Typography className="cloud-title" sx={{ fontWeight: 700, fontSize: "14px", color: "#1E293B", mb: 0.5, transition: "color 0.2s ease" }}>
                  {prov.name}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#64748B" }}>
                  {prov.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Template Browser Modal */}
      {showTemplateBrowser && (
        <TemplateBrowser
          isOpen={showTemplateBrowser}
          onClose={() => setShowTemplateBrowser(false)}
          onTemplateSelect={handleTemplateSelect}
        />
      )}

      {/* AI Template Browser Modal */}
      <AITemplateBrowser
        open={templateBrowserOpen}
        onClose={() => setTemplateBrowserOpen(false)}
        onTemplateUse={handleTemplateUse}
      />

      {/* Box Picker Modal */}
      {showBoxPicker && (
        <Dialog
          open={showBoxPicker}
          onClose={() => setShowBoxPicker(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2.5, borderBottom: "1px solid #E2E8F0" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "1.125rem" }}>
              Select File from Box
            </Typography>
            <IconButton size="small" onClick={() => setShowBoxPicker(false)} sx={{ color: "#64748B" }}>
              <FaTimes size={16} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 2.5, minHeight: 300, maxHeight: 420 }}>
            <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleBoxBack}
                disabled={boxCurrentFolder === "0"}
                startIcon={<FaArrowLeft size={12} />}
                sx={{ borderRadius: "6px", textTransform: "none", color: "#475569", borderColor: "#CBD5E0" }}
              >
                Back
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => loadBoxFiles()}
                startIcon={<FaSync size={12} />}
                sx={{ borderRadius: "6px", textTransform: "none", color: "#475569", borderColor: "#CBD5E0" }}
              >
                Refresh
              </Button>
            </Box>

            {boxLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, py: 6, color: "#64748B" }}>
                <CircularProgress size={20} color="inherit" />
                <Typography variant="body2">Loading files...</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {boxFiles.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, color: "#94A3B8", gap: 1.5 }}>
                    <FaFolderOpen size={32} />
                    <Typography variant="body2">No files found in this folder</Typography>
                  </Box>
                ) : (
                  boxFiles.map((item) => (
                    <Box
                      key={item.id}
                      onClick={() => handleBoxFileSelect(item)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        "&:hover": { borderColor: "#38BDF8", bgcolor: "#F8FAFC" },
                      }}
                    >
                      <Box sx={{ color: item.type === "folder" ? "#F59E0B" : "#38BDF8", fontSize: 20 }}>
                        {item.type === "folder" ? <FaFolder /> : <FaFileAlt />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.name}
                        </Typography>
                        {item.type === "file" && item.size && (
                          <Typography variant="caption" sx={{ color: "#64748B" }}>
                            Size: {(item.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        )}
                      </Box>
                      {item.type === "folder" && (
                        <FaChevronDown size={12} color="#94A3B8" />
                      )}
                    </Box>
                  ))
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2, borderTop: "1px solid #E2E8F0" }}>
            <Button variant="outlined" onClick={() => setShowBoxPicker(false)} sx={{ textTransform: "none", color: "#475569", borderColor: "#CBD5E0", borderRadius: "8px" }}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Modern Documents Vault Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "18px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          bgcolor: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Top Toolbar */}
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          {/* Card Title & Stats */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#0F172A",
                fontSize: { xs: "1.1rem", sm: "1.2rem" },
                letterSpacing: "-0.01em",
              }}
            >
              Your Documents
            </Typography>
            <Chip
              label={`${totalDocs} ${totalDocs === 1 ? "document" : "documents"}`}
              size="small"
              sx={{
                bgcolor: "#F0FDFA",
                color: "#0F766E",
                fontWeight: 700,
                borderRadius: "8px",
                border: "1px solid #CCFBF1",
                fontSize: "12px",
                height: 24,
              }}
            />
          </Box>

          {/* Controls: Search & Filter */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: { xs: "100%", md: "auto" } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
              {/* Search Input */}
              <TextField
                size="small"
                placeholder="Search name, date (e.g. 2026, Oct, 10/20), envelope ID…"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#94A3B8", fontSize: 19 }} />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setFilters({ ...filters, search: "" })}>
                        <ClearIcon sx={{ fontSize: 16, color: "#94A3B8" }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  width: { xs: "100%", sm: 300 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    bgcolor: "#FFFFFF",
                    fontSize: "13.5px",
                    "& fieldset": { borderColor: "#E2E8F0" },
                    "&:hover fieldset": { borderColor: "#CBD5E1" },
                    "&.Mui-focused fieldset": { borderColor: "#0F766E", borderWidth: "1.5px" },
                  },
                }}
              />

              {/* Filter Popover Trigger */}
              <Button
                variant={Boolean(filterAnchorEl) || filters.status || filters.source || filters.startDate || filters.endDate ? "contained" : "outlined"}
                size="small"
                startIcon={<FilterListIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => setFilterAnchorEl(filterAnchorEl ? null : e.currentTarget)}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  px: 2,
                  py: 0.85,
                  whiteSpace: "nowrap",
                  ...(Boolean(filterAnchorEl) || filters.status || filters.source || filters.startDate || filters.endDate
                    ? {
                        bgcolor: "#0F766E",
                        color: "#FFFFFF",
                        "&:hover": { bgcolor: "#115E59" },
                      }
                    : {
                        borderColor: "#E2E8F0",
                        color: "#475569",
                        bgcolor: "#FFFFFF",
                        "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
                      }),
                }}
              >
                Filters
                {(filters.status || filters.source || filters.startDate || filters.endDate) && (
                  <Box
                    component="span"
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: "#FFFFFF",
                      ml: 1,
                    }}
                  />
                )}
              </Button>

              {/* Order / Sort Menu Trigger */}
              <Button
                variant={filters.sortBy !== "last_used" || filters.sortOrder !== "desc" ? "contained" : "outlined"}
                size="small"
                startIcon={<SwapVertIcon sx={{ fontSize: 18 }} />}
                endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
                onClick={(e) => setOrderAnchorEl(orderAnchorEl ? null : e.currentTarget)}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  px: 1.75,
                  py: 0.85,
                  whiteSpace: "nowrap",
                  ...(filters.sortBy !== "last_used" || filters.sortOrder !== "desc"
                    ? {
                        bgcolor: "#0F766E",
                        color: "#FFFFFF",
                        "&:hover": { bgcolor: "#115E59" },
                      }
                    : {
                        borderColor: "#E2E8F0",
                        color: "#475569",
                        bgcolor: "#FFFFFF",
                        "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
                      }),
                }}
              >
                Order: {getSortLabelShort(filters.sortBy, filters.sortOrder)}
              </Button>

              {/* Order Menu Popover */}
              <Menu
                anchorEl={orderAnchorEl}
                open={Boolean(orderAnchorEl)}
                onClose={() => setOrderAnchorEl(null)}
                PaperProps={{
                  elevation: 4,
                  sx: {
                    borderRadius: "14px",
                    minWidth: 250,
                    py: 1,
                    mt: 0.5,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <Typography sx={{ px: 2, py: 0.75, fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Document Order
                </Typography>

                <MenuItem
                  selected={filters.sortBy === "name" && filters.sortOrder === "asc"}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sortBy: "name", sortOrder: "asc" }));
                    setOrderAnchorEl(null);
                  }}
                  sx={{ fontSize: "13px", py: 1 }}
                >
                  <ListItemIcon>
                    <SortByAlphaIcon fontSize="small" sx={{ color: filters.sortBy === "name" && filters.sortOrder === "asc" ? "#0F766E" : "inherit" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Name: A to Z"
                    secondary="Alphabetical order"
                    primaryTypographyProps={{ fontSize: "13px", fontWeight: filters.sortBy === "name" && filters.sortOrder === "asc" ? 700 : 500 }}
                    secondaryTypographyProps={{ fontSize: "11px" }}
                  />
                  {filters.sortBy === "name" && filters.sortOrder === "asc" && <CheckIcon sx={{ fontSize: 16, color: "#0F766E" }} />}
                </MenuItem>

                <MenuItem
                  selected={filters.sortBy === "name" && filters.sortOrder === "desc"}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sortBy: "name", sortOrder: "desc" }));
                    setOrderAnchorEl(null);
                  }}
                  sx={{ fontSize: "13px", py: 1 }}
                >
                  <ListItemIcon>
                    <SortByAlphaIcon fontSize="small" sx={{ color: filters.sortBy === "name" && filters.sortOrder === "desc" ? "#0F766E" : "inherit", transform: "scaleY(-1)" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Name: Z to A"
                    secondary="Reverse alphabetical"
                    primaryTypographyProps={{ fontSize: "13px", fontWeight: filters.sortBy === "name" && filters.sortOrder === "desc" ? 700 : 500 }}
                    secondaryTypographyProps={{ fontSize: "11px" }}
                  />
                  {filters.sortBy === "name" && filters.sortOrder === "desc" && <CheckIcon sx={{ fontSize: 16, color: "#0F766E" }} />}
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                <MenuItem
                  selected={filters.sortBy === "last_used" && filters.sortOrder === "desc"}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sortBy: "last_used", sortOrder: "desc" }));
                    setOrderAnchorEl(null);
                  }}
                  sx={{ fontSize: "13px", py: 1 }}
                >
                  <ListItemIcon>
                    <AccessTimeIcon fontSize="small" sx={{ color: filters.sortBy === "last_used" && filters.sortOrder === "desc" ? "#0F766E" : "inherit" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Used: Newest first"
                    secondary="Recently active / updated"
                    primaryTypographyProps={{ fontSize: "13px", fontWeight: filters.sortBy === "last_used" && filters.sortOrder === "desc" ? 700 : 500 }}
                    secondaryTypographyProps={{ fontSize: "11px" }}
                  />
                  {filters.sortBy === "last_used" && filters.sortOrder === "desc" && <CheckIcon sx={{ fontSize: 16, color: "#0F766E" }} />}
                </MenuItem>

                <MenuItem
                  selected={filters.sortBy === "last_used" && filters.sortOrder === "asc"}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sortBy: "last_used", sortOrder: "asc" }));
                    setOrderAnchorEl(null);
                  }}
                  sx={{ fontSize: "13px", py: 1 }}
                >
                  <ListItemIcon>
                    <AccessTimeIcon fontSize="small" sx={{ color: filters.sortBy === "last_used" && filters.sortOrder === "asc" ? "#0F766E" : "inherit" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Used: Oldest first"
                    secondary="Least recently active"
                    primaryTypographyProps={{ fontSize: "13px", fontWeight: filters.sortBy === "last_used" && filters.sortOrder === "asc" ? 700 : 500 }}
                    secondaryTypographyProps={{ fontSize: "11px" }}
                  />
                  {filters.sortBy === "last_used" && filters.sortOrder === "asc" && <CheckIcon sx={{ fontSize: 16, color: "#0F766E" }} />}
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                <MenuItem
                  selected={filters.sortBy === "uploaded_at" && filters.sortOrder === "desc"}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sortBy: "uploaded_at", sortOrder: "desc" }));
                    setOrderAnchorEl(null);
                  }}
                  sx={{ fontSize: "13px", py: 1 }}
                >
                  <ListItemIcon>
                    <CalendarTodayIcon fontSize="small" sx={{ color: filters.sortBy === "uploaded_at" && filters.sortOrder === "desc" ? "#0F766E" : "inherit" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Uploaded Time: Newest first"
                    secondary="Recently uploaded files"
                    primaryTypographyProps={{ fontSize: "13px", fontWeight: filters.sortBy === "uploaded_at" && filters.sortOrder === "desc" ? 700 : 500 }}
                    secondaryTypographyProps={{ fontSize: "11px" }}
                  />
                  {filters.sortBy === "uploaded_at" && filters.sortOrder === "desc" && <CheckIcon sx={{ fontSize: 16, color: "#0F766E" }} />}
                </MenuItem>

                <MenuItem
                  selected={filters.sortBy === "uploaded_at" && filters.sortOrder === "asc"}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sortBy: "uploaded_at", sortOrder: "asc" }));
                    setOrderAnchorEl(null);
                  }}
                  sx={{ fontSize: "13px", py: 1 }}
                >
                  <ListItemIcon>
                    <CalendarTodayIcon fontSize="small" sx={{ color: filters.sortBy === "uploaded_at" && filters.sortOrder === "asc" ? "#0F766E" : "inherit" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Uploaded Time: Oldest first"
                    secondary="Oldest upload date"
                    primaryTypographyProps={{ fontSize: "13px", fontWeight: filters.sortBy === "uploaded_at" && filters.sortOrder === "asc" ? 700 : 500 }}
                    secondaryTypographyProps={{ fontSize: "11px" }}
                  />
                  {filters.sortBy === "uploaded_at" && filters.sortOrder === "asc" && <CheckIcon sx={{ fontSize: 16, color: "#0F766E" }} />}
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                <MenuItem
                  selected={filters.sortBy === "size" && filters.sortOrder === "desc"}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sortBy: "size", sortOrder: "desc" }));
                    setOrderAnchorEl(null);
                  }}
                  sx={{ fontSize: "13px", py: 1 }}
                >
                  <ListItemIcon>
                    <InsertDriveFileOutlinedIcon fontSize="small" sx={{ color: filters.sortBy === "size" && filters.sortOrder === "desc" ? "#0F766E" : "inherit" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="File Size: Largest first"
                    secondary="Highest file byte size"
                    primaryTypographyProps={{ fontSize: "13px", fontWeight: filters.sortBy === "size" && filters.sortOrder === "desc" ? 700 : 500 }}
                    secondaryTypographyProps={{ fontSize: "11px" }}
                  />
                  {filters.sortBy === "size" && filters.sortOrder === "desc" && <CheckIcon sx={{ fontSize: 16, color: "#0F766E" }} />}
                </MenuItem>

                <MenuItem
                  selected={filters.sortBy === "size" && filters.sortOrder === "asc"}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sortBy: "size", sortOrder: "asc" }));
                    setOrderAnchorEl(null);
                  }}
                  sx={{ fontSize: "13px", py: 1 }}
                >
                  <ListItemIcon>
                    <InsertDriveFileOutlinedIcon fontSize="small" sx={{ color: filters.sortBy === "size" && filters.sortOrder === "asc" ? "#0F766E" : "inherit" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="File Size: Smallest first"
                    secondary="Lowest file byte size"
                    primaryTypographyProps={{ fontSize: "13px", fontWeight: filters.sortBy === "size" && filters.sortOrder === "asc" ? 700 : 500 }}
                    secondaryTypographyProps={{ fontSize: "11px" }}
                  />
                  {filters.sortBy === "size" && filters.sortOrder === "asc" && <CheckIcon sx={{ fontSize: 16, color: "#0F766E" }} />}
                </MenuItem>
              </Menu>

              {/* Filter Popover Content */}
              <Popover
                open={Boolean(filterAnchorEl)}
                anchorEl={filterAnchorEl}
                onClose={() => setFilterAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  elevation: 4,
                  sx: {
                    borderRadius: "16px",
                    width: 330,
                    p: 2.5,
                    mt: 1,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 1.5, borderBottom: "1px solid #F1F5F9" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "14px", color: "#1E293B" }}>
                    Filter Documents
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setFilterAnchorEl(null)}
                    sx={{ color: "#94A3B8", "&:hover": { color: "#1E293B" } }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2.5 }}>
                  {/* Order / Sort Option inside Filter */}
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                      <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Order / Sort By
                      </Typography>
                      {(filters.sortBy !== "last_used" || filters.sortOrder !== "desc") && (
                        <Typography
                          onClick={() => setFilters(prev => ({ ...prev, sortBy: "last_used", sortOrder: "desc" }))}
                          sx={{ fontSize: "11px", fontWeight: 600, color: "#0F766E", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                        >
                          Reset Order
                        </Typography>
                      )}
                    </Box>

                    <select
                      value={`${filters.sortBy || "last_used"}_${filters.sortOrder || "desc"}`}
                      onChange={(e) => {
                        const [sb, so] = e.target.value.split("_");
                        setFilters(prev => ({ ...prev, sortBy: sb, sortOrder: so }));
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                        fontSize: "13px",
                        color: "#334155",
                        outline: "none",
                        fontWeight: 500,
                      }}
                    >
                      <option value="last_used_desc">Last Used: Newest first (Recently Active)</option>
                      <option value="last_used_asc">Last Used: Oldest first</option>
                      <option value="name_asc">Name: A to Z (Alphabetical)</option>
                      <option value="name_desc">Name: Z to A (Reverse Alphabetical)</option>
                      <option value="uploaded_at_desc">Uploaded Time: Newest first</option>
                      <option value="uploaded_at_asc">Uploaded Time: Oldest first</option>
                      <option value="size_desc">File Size: Largest first</option>
                      <option value="size_asc">File Size: Smallest first</option>
                    </select>

                    {/* Quick Sort Chips */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                      {[
                        { label: "A-Z", sb: "name", so: "asc" },
                        { label: "Z-A", sb: "name", so: "desc" },
                        { label: "Last Used", sb: "last_used", so: "desc" },
                        { label: "Uploaded Time", sb: "uploaded_at", so: "desc" },
                        { label: "File Size", sb: "size", so: "desc" },
                      ].map((preset, idx) => {
                        const isSelected = filters.sortBy === preset.sb && filters.sortOrder === preset.so;
                        return (
                          <Chip
                            key={idx}
                            label={preset.label}
                            size="small"
                            onClick={() => setFilters(prev => ({ ...prev, sortBy: preset.sb, sortOrder: preset.so }))}
                            sx={{
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              bgcolor: isSelected ? "#0F766E" : "#F1F5F9",
                              color: isSelected ? "#FFFFFF" : "#475569",
                              "&:hover": {
                                bgcolor: isSelected ? "#115E59" : "#E2E8F0",
                                color: isSelected ? "#FFFFFF" : "#0F766E",
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Status Filter */}
                  <Box>
                    <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B", mb: 0.75, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Status
                    </Typography>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                        fontSize: "13px",
                        color: "#334155",
                        outline: "none",
                        fontWeight: 500,
                      }}
                    >
                      <option value="">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="declined">Declined</option>
                      <option value="voided">Voided</option>
                      <option value="expired">Expired</option>
                    </select>
                  </Box>

                  {/* Source Filter */}
                  <Box>
                    <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B", mb: 0.75, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Source
                    </Typography>
                    <select
                      value={filters.source}
                      onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                        fontSize: "13px",
                        color: "#334155",
                        outline: "none",
                        fontWeight: 500,
                      }}
                    >
                      <option value="">All Sources</option>
                      <option value="local">Local Upload</option>
                      <option value="google">Google Drive</option>
                      <option value="dropbox">Dropbox</option>
                      <option value="onedrive">OneDrive</option>
                      <option value="box">Box</option>
                    </select>
                  </Box>

                  {/* Date Range Picker */}
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                      <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Date Range
                      </Typography>
                      {(filters.startDate || filters.endDate) && (
                        <Typography
                          onClick={() => setFilters(prev => ({ ...prev, startDate: "", endDate: "" }))}
                          sx={{ fontSize: "11px", fontWeight: 600, color: "#0F766E", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                        >
                          Clear Date
                        </Typography>
                      )}
                    </Box>

                    {/* Quick Date Presets */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.25 }}>
                      {[
                        { label: "Today", days: 0 },
                        { label: "Last 7 Days", days: 7 },
                        { label: "Last 30 Days", days: 30 },
                        { label: "This Month", month: true },
                      ].map((preset, idx) => {
                        const handlePreset = () => {
                          const today = new Date();
                          const endStr = today.toISOString().split("T")[0];
                          let startStr = "";
                          if (preset.days === 0) {
                            startStr = endStr;
                          } else if (preset.days) {
                            const past = new Date();
                            past.setDate(past.getDate() - preset.days);
                            startStr = past.toISOString().split("T")[0];
                          } else if (preset.month) {
                            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                            startStr = firstDay.toISOString().split("T")[0];
                          }
                          setFilters(prev => ({ ...prev, startDate: startStr, endDate: endStr }));
                        };

                        return (
                          <Chip
                            key={idx}
                            label={preset.label}
                            size="small"
                            onClick={handlePreset}
                            sx={{
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              bgcolor: "#F1F5F9",
                              color: "#475569",
                              "&:hover": { bgcolor: "#E2E8F0", color: "#0F766E" },
                            }}
                          />
                        );
                      })}
                    </Box>

                    {/* From & To Date Inputs */}
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: "11px", color: "#64748B", mb: 0.4, fontWeight: 500 }}>
                          From Date
                        </Typography>
                        <input
                          type="date"
                          value={filters.startDate || ""}
                          onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: "8px",
                            border: "1px solid #E2E8F0",
                            backgroundColor: "#F8FAFC",
                            fontSize: "12px",
                            color: "#334155",
                            outline: "none",
                            fontWeight: 500,
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: "11px", color: "#64748B", mb: 0.4, fontWeight: 500 }}>
                          To Date
                        </Typography>
                        <input
                          type="date"
                          value={filters.endDate || ""}
                          onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: "8px",
                            border: "1px solid #E2E8F0",
                            backgroundColor: "#F8FAFC",
                            fontSize: "12px",
                            color: "#334155",
                            outline: "none",
                            fontWeight: 500,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
                  <Button
                    size="small"
                    onClick={() => setFilters({ search: "", status: "", source: "", startDate: "", endDate: "", sortBy: "last_used", sortOrder: "desc" })}
                    sx={{
                      textTransform: "none",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#64748B",
                      "&:hover": { color: "#0F172A", bgcolor: "transparent" },
                    }}
                  >
                    Clear All
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setFilterAnchorEl(null)}
                    sx={{
                      textTransform: "none",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      borderRadius: "8px",
                      bgcolor: "#0F766E",
                      "&:hover": { bgcolor: "#115E59" },
                      px: 2,
                      py: 0.6,
                    }}
                  >
                    Apply Filters
                  </Button>
                </Box>
              </Popover>
            </Box>

            {/* Active Filter Badges */}
            {(filters.status || filters.source || filters.startDate || filters.endDate || filters.sortBy !== "last_used" || filters.sortOrder !== "desc") && (
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                <Typography sx={{ fontSize: "11.5px", fontWeight: 600, color: "#64748B" }}>
                  Active:
                </Typography>
                {(filters.sortBy !== "last_used" || filters.sortOrder !== "desc") && (
                  <Chip
                    icon={<SwapVertIcon sx={{ fontSize: "14px !important", color: "#0F766E !important" }} />}
                    label={`Order: ${getSortLabelShort(filters.sortBy, filters.sortOrder)}`}
                    size="small"
                    onDelete={() => setFilters(prev => ({ ...prev, sortBy: "last_used", sortOrder: "desc" }))}
                    sx={{ bgcolor: "#CCFBF1", color: "#0F766E", fontWeight: 600, fontSize: "11px", height: "22px" }}
                  />
                )}
                {filters.status && (
                  <Chip
                    label={`Status: ${filters.status}`}
                    size="small"
                    onDelete={() => setFilters(prev => ({ ...prev, status: "" }))}
                    sx={{ bgcolor: "#E0F2FE", color: "#0369A1", fontWeight: 600, fontSize: "11px", height: "22px" }}
                  />
                )}
                {filters.source && (
                  <Chip
                    label={`Source: ${filters.source}`}
                    size="small"
                    onDelete={() => setFilters(prev => ({ ...prev, source: "" }))}
                    sx={{ bgcolor: "#F3E8FF", color: "#7E22CE", fontWeight: 600, fontSize: "11px", height: "22px" }}
                  />
                )}
                {(filters.startDate || filters.endDate) && (
                  <Chip
                    label={`Date: ${filters.startDate || "Start"} → ${filters.endDate || "Present"}`}
                    size="small"
                    onDelete={() => setFilters(prev => ({ ...prev, startDate: "", endDate: "" }))}
                    sx={{ bgcolor: "#CCFBF1", color: "#0F766E", fontWeight: 600, fontSize: "11px", height: "22px" }}
                  />
                )}
                <Button
                  size="small"
                  onClick={() => setFilters(prev => ({ ...prev, status: "", source: "", startDate: "", endDate: "", sortBy: "last_used", sortOrder: "desc" }))}
                  sx={{ textTransform: "none", fontSize: "11px", color: "#94A3B8", p: 0, minWidth: 0, "&:hover": { color: "#EF4444" } }}
                >
                  Clear filters
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {/* Status Filter Tabs */}
        <Box sx={{ px: { xs: 2, sm: 2.5 }, borderBottom: "1px solid #F1F5F9" }}>
          <Tabs
            value={filters.status || "all"}
            onChange={(e, val) => {
              setFilters((prev) => ({ ...prev, status: val === "all" ? "" : val }));
              setCurrentPage(1);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 46,
              "& .MuiTabs-indicator": {
                backgroundColor: "#0F766E",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "13px",
                minHeight: 46,
                py: 1,
                px: 2,
                color: "#64748B",
                "&.Mui-selected": {
                  color: "#0F766E",
                  fontWeight: 700,
                },
              },
            }}
          >
            <Tab value="all" label="All Documents" />
            <Tab value="draft" label="Drafts" />
            <Tab value="in_progress" label="In Progress" />
            <Tab value="completed" label="Completed" />
            <Tab value="sent" label="Sent" />
            <Tab value="voided" label="Voided" />
          </Tabs>
        </Box>

        {/* Table Content / Loading / Empty States */}
        {listLoading && !showSuccessDialog ? (
          <Box sx={{ py: 4, px: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2.5, py: 1.5, borderBottom: "1px solid #F1F5F9" }}>
                <Skeleton variant="text" width={24} height={20} />
                <Skeleton variant="rounded" width={38} height={38} sx={{ borderRadius: "10px" }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="45%" height={24} />
                  <Skeleton variant="text" width="20%" height={16} />
                </Box>
                <Skeleton variant="text" width={110} height={20} />
                <Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: "12px" }} />
                <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: "12px" }} />
                <Skeleton variant="rounded" width={120} height={32} sx={{ borderRadius: "8px" }} />
              </Box>
            ))}
          </Box>
        ) : filteredDocuments.length === 0 ? (
          <Box sx={{ py: 8, px: 3, textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "16px",
                bgcolor: "#F8FAFC",
                color: "#94A3B8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
                border: "1px solid #E2E8F0",
              }}
            >
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: "#1E293B", fontSize: "16px", mb: 0.5 }}>
              {filters.search || filters.status || filters.source
                ? "No matching documents found"
                : "No documents uploaded yet"}
            </Typography>
            <Typography sx={{ color: "#64748B", fontSize: "13.5px", maxWidth: 420, mx: "auto", mb: 2.5 }}>
              {filters.search || filters.status || filters.source
                ? "Try clearing or adjusting your search terms and filters."
                : "Start by uploading your first document or creating one from a template above."}
            </Typography>
            {filters.search || filters.status || filters.source ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFilters({ search: "", status: "", source: "" })}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#0F766E",
                  color: "#0F766E",
                  "&:hover": { bgcolor: "#F0FDFA", borderColor: "#0F766E" },
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<FiUpload />}
                onClick={handleLocalUpload}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: "#0F766E",
                  color: "#FFFFFF",
                  "&:hover": { bgcolor: "#115E59" },
                }}
              >
                Upload Document
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  <TableCell sx={{ py: 1.75, px: 2.5, width: 60, fontSize: "11.5px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #E2E8F0" }}>
                    S.No
                  </TableCell>
                  <TableCell
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        sortBy: "name",
                        sortOrder: prev.sortBy === "name" && prev.sortOrder === "asc" ? "desc" : "asc"
                      }));
                    }}
                    sx={{
                      py: 1.75,
                      px: 3,
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: filters.sortBy === "name" ? "#0F766E" : "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderBottom: "1px solid #E2E8F0",
                      cursor: "pointer",
                      userSelect: "none",
                      "&:hover": { color: "#0F766E" },
                    }}
                  >
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                      <span>Document Name</span>
                      {filters.sortBy === "name" ? (
                        filters.sortOrder === "asc" ? (
                          <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                        ) : (
                          <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                        )
                      ) : (
                        <SortByAlphaIcon sx={{ fontSize: 14, opacity: 0.4 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    onClick={() => {
                      setFilters(prev => {
                        if (prev.sortBy === "last_used") {
                          return { ...prev, sortOrder: prev.sortOrder === "desc" ? "asc" : "desc" };
                        }
                        return { ...prev, sortBy: "last_used", sortOrder: "desc" };
                      });
                    }}
                    sx={{
                      py: 1.75,
                      px: 2.5,
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: filters.sortBy === "last_used" || filters.sortBy === "uploaded_at" ? "#0F766E" : "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderBottom: "1px solid #E2E8F0",
                      cursor: "pointer",
                      userSelect: "none",
                      "&:hover": { color: "#0F766E" },
                    }}
                  >
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                      <span>Last Active / Uploaded</span>
                      {filters.sortBy === "last_used" || filters.sortBy === "uploaded_at" ? (
                        filters.sortOrder === "asc" ? (
                          <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                        ) : (
                          <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                        )
                      ) : (
                        <SwapVertIcon sx={{ fontSize: 14, opacity: 0.4 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.75, px: 2.5, fontSize: "11.5px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #E2E8F0" }}>
                    Source
                  </TableCell>
                  <TableCell sx={{ py: 1.75, px: 2.5, fontSize: "11.5px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #E2E8F0" }}>
                    Status
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.75, px: 3, fontSize: "11.5px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #E2E8F0" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map((doc, index) => {
                  const formatted = formatDate(doc.uploaded_at);
                  const isDraft = doc.status === "draft";
                  const serialNumber = (currentPage - 1) * pageSize + index + 1;

                  return (
                    <TableRow
                      key={doc.id}
                      hover
                      sx={{
                        "&:hover": { bgcolor: "#F8FAFC" },
                        "& td": { borderBottom: "1px solid #F1F5F9" },
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* S.No */}
                      <TableCell sx={{ py: 2, px: 2.5, width: 60, whiteSpace: "nowrap" }}>
                        <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#64748B" }}>
                          {serialNumber}
                        </Typography>
                      </TableCell>
                      {/* Document Name */}
                      <TableCell sx={{ py: 2, px: 3, maxWidth: { xs: 150, sm: 220, md: 320, lg: 420 }, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.75,
                            minWidth: 0,
                            width: "100%",
                          }}
                        >
                          {getFileIcon(doc.filename)}

                          <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                            <FilenameDisplay
                              filename={doc.filename}
                              middleTruncate={true}
                              tooltipPlacement="top-start"
                              onClick={() => {
                                handleTouchDoc(doc.id);
                                setActiveDocId(doc.id);
                                setActiveDocument(doc);
                                setViewerOpen(true);
                              }}
                              sx={{
                                fontFamily: '"Inter", sans-serif',
                                fontWeight: 600,
                                color: "#0F172A",
                                fontSize: "14px",
                                lineHeight: 1.5,
                                cursor: "pointer",
                                transition: "color 0.15s ease",
                                "&:hover": {
                                  color: "#0F766E",
                                  textDecoration: "underline",
                                },
                              }}
                            />

                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: "#94A3B8",
                                fontWeight: 500,
                                mt: 0.3,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                              }}
                            >
                              <span style={{ textTransform: "uppercase" }}>
                                {doc.filename
                                  ? doc.filename.split(".").pop()
                                  : "DOCUMENT"}
                              </span>
                              {formatFileSize(doc.size) && (
                                <>
                                  <span style={{ opacity: 0.5 }}>•</span>
                                  <span style={{ textTransform: "none" }}>{formatFileSize(doc.size)}</span>
                                </>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Last Active / Uploaded */}
                      <TableCell sx={{ py: 2, px: 2.5, whiteSpace: "nowrap" }}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                            {doc.updated_at ? formatDate(doc.updated_at).date : formatted.date}
                          </Typography>
                          <Typography sx={{ fontSize: "11px", color: "#94A3B8" }}>
                            {doc.updated_at && doc.updated_at !== doc.uploaded_at
                              ? `Active ${formatDate(doc.updated_at).time}`
                              : `Uploaded ${formatted.time}`}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Source */}
                      <TableCell sx={{ py: 2, px: 2.5, whiteSpace: "nowrap" }}>
                        {renderSourceBadge(doc.source)}
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 2, px: 2.5, whiteSpace: "nowrap" }}>
                        <StatusChip status={doc.status} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ py: 2, px: 3, whiteSpace: "nowrap" }}>
                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                          {isDraft ? (
                            <Button
                              variant="contained"
                              size="small"
                              endIcon={<SendIcon sx={{ fontSize: 13 }} />}
                              onClick={() => {
                                handleTouchDoc(doc.id);
                                navigate(`/user/prepare-send/${doc.id}`, { state: { document: doc } });
                              }}
                              sx={{
                                bgcolor: "#0F766E",
                                color: "#FFFFFF",
                                "&:hover": { bgcolor: "#115E59" },
                                borderRadius: "8px",
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "12px",
                                px: 1.75,
                                py: 0.65,
                                boxShadow: "0 2px 6px rgba(15, 118, 110, 0.2)",
                              }}
                            >
                              Prepare & Send
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              endIcon={<VisibilityIcon sx={{ fontSize: 13 }} />}
                              onClick={() => {
                                handleTouchDoc(doc.id);
                                setActiveDocId(doc.id);
                                setActiveDocument(doc);
                                setViewerOpen(true);
                              }}
                              sx={{
                                borderColor: "#E2E8F0",
                                color: "#475569",
                                bgcolor: "#FFFFFF",
                                "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC", color: "#0F766E" },
                                borderRadius: "8px",
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "12px",
                                px: 1.5,
                                py: 0.65,
                              }}
                            >
                              View
                            </Button>
                          )}

                          {/* Action Menu Trigger */}
                          <Tooltip title="More actions">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTouchDoc(doc.id);
                                setActionMenuAnchorEl(e.currentTarget);
                                setActionMenuDoc(doc);
                              }}
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "8px",
                                border: "1px solid #E2E8F0",
                                color: "#64748B",
                                bgcolor: "#FFFFFF",
                                "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A", borderColor: "#CBD5E1" },
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Integrated Pagination Footer */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.75,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            borderTop: "1px solid #F1F5F9",
            bgcolor: "#FAFAFA",
          }}
        >
          {/* Item Count Display */}
          <Typography sx={{ fontSize: "12.5px", color: "#64748B", fontWeight: 500, textAlign: { xs: "center", sm: "left" } }}>
            {totalDocs === 0
              ? "Showing 0 documents"
              : `Showing ${(currentPage - 1) * pageSize + 1} – ${Math.min(currentPage * pageSize, totalDocs)} of ${totalDocs} documents`}
          </Typography>

          {/* Rows & Page Controls */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "space-between", sm: "flex-end" }, gap: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "12.5px", color: "#64748B", fontWeight: 500 }}>
                Rows:
              </Typography>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<NavigateBeforeIcon sx={{ fontSize: 16 }} />}
                disabled={currentPage <= 1 || totalDocs === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "12px",
                  borderColor: "#E2E8F0",
                  color: "#475569",
                  bgcolor: "#FFFFFF",
                  py: 0.5,
                  px: 1.5,
                  "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
                  "&.Mui-disabled": { opacity: 0.4 },
                }}
              >
                Previous
              </Button>

              <Chip
                label={`Page ${totalDocs === 0 || totalPages === 0 ? 0 : currentPage} of ${totalPages || 0}`}
                size="small"
                sx={{
                  bgcolor: "#F0FDFA",
                  color: "#0F766E",
                  fontWeight: 700,
                  fontSize: "12px",
                  height: 28,
                  border: "1px solid #CCFBF1",
                }}
              />

              <Button
                variant="outlined"
                size="small"
                endIcon={<NavigateNextIcon sx={{ fontSize: 16 }} />}
                disabled={currentPage >= totalPages || totalDocs === 0}
                onClick={() => setCurrentPage(currentPage + 1)}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "12px",
                  borderColor: "#E2E8F0",
                  color: "#475569",
                  bgcolor: "#FFFFFF",
                  py: 0.5,
                  px: 1.5,
                  "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
                  "&.Mui-disabled": { opacity: 0.4 },
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Shared MUI Action Menu */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={() => {
          setActionMenuAnchorEl(null);
          setActionMenuDoc(null);
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: "14px",
            minWidth: 220,
            py: 0.5,
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        {actionMenuDoc && (
          <>
            <MenuItem
              onClick={() => {
                const doc = actionMenuDoc;
                setActionMenuAnchorEl(null);
                setActiveDocId(doc.id);
                setNewFilename((doc.filename || "").replace(/\.pdf$/i, ""));
                setRenameOpen(true);
              }}
              sx={{
                fontSize: "13px",
                py: 1,
                gap: 1.5,
                color: "#334155",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f766e" },
              }}
            >
              <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
                <FaEdit size={14} className="text-slate-400" />
              </ListItemIcon>
              <ListItemText
                primary="Rename"
                primaryTypographyProps={{ fontSize: "13px", fontWeight: 500 }}
              />
            </MenuItem>

            {actionMenuDoc.status === "draft" && (
              <MenuItem
                onClick={() => {
                  const doc = actionMenuDoc;
                  setActionMenuAnchorEl(null);
                  handleBuildTemplate(doc);
                }}
                sx={{
                  fontSize: "13px",
                  py: 1,
                  gap: 1.5,
                  color: "#334155",
                  "&:hover": { bgcolor: "#f8fafc", color: "#0f766e" },
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
                  <EditIcon fontSize="small" className="text-slate-400" />
                </ListItemIcon>
                <ListItemText
                  primary="Build Template"
                  primaryTypographyProps={{ fontSize: "13px", fontWeight: 500 }}
                />
              </MenuItem>
            )}

            <MenuItem
              onClick={() => {
                const doc = actionMenuDoc;
                setActionMenuAnchorEl(null);
                setActiveDocId(doc.id);
                setActiveDocument(doc);
                setViewerOpen(true);
              }}
              sx={{
                fontSize: "13px",
                py: 1,
                gap: 1.5,
                color: "#334155",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f766e" },
              }}
            >
              <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
                <VisibilityIcon fontSize="small" className="text-slate-400" />
              </ListItemIcon>
              <ListItemText
                primary="View Document"
                primaryTypographyProps={{ fontSize: "13px", fontWeight: 500 }}
              />
            </MenuItem>

            <MenuItem
              onClick={() => {
                const doc = actionMenuDoc;
                setActionMenuAnchorEl(null);
                handleDownload(doc);
              }}
              sx={{
                fontSize: "13px",
                py: 1,
                gap: 1.5,
                color: "#334155",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f766e" },
              }}
            >
              <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
                <DownloadIcon fontSize="small" className="text-slate-400" />
              </ListItemIcon>
              <ListItemText
                primary="Download"
                primaryTypographyProps={{ fontSize: "13px", fontWeight: 500 }}
              />
            </MenuItem>

            <MenuItem
              onClick={() => {
                const doc = actionMenuDoc;
                setActionMenuAnchorEl(null);
                setActiveDocId(doc.id);
                setActiveDocument(doc);
                setSignedOpen(true);
              }}
              sx={{
                fontSize: "13px",
                py: 1,
                gap: 1.5,
                color: "#334155",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f766e" },
              }}
            >
              <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
                <PreviewIcon fontSize="small" className="text-slate-400" />
              </ListItemIcon>
              <ListItemText
                primary="Signed Preview"
                primaryTypographyProps={{ fontSize: "13px", fontWeight: 500 }}
              />
            </MenuItem>

            {actionMenuDoc.status === "completed" && (
              <MenuItem
                onClick={() => {
                  const doc = actionMenuDoc;
                  setActionMenuAnchorEl(null);
                  handleDownloadPackage(doc);
                }}
                sx={{
                  fontSize: "13px",
                  py: 1,
                  gap: 1.5,
                  color: "#334155",
                  "&:hover": { bgcolor: "#f8fafc", color: "#0f766e" },
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
                  <ArchiveIcon fontSize="small" className="text-slate-400" />
                </ListItemIcon>
                <ListItemText
                  primary="Download Package (ZIP)"
                  primaryTypographyProps={{ fontSize: "13px", fontWeight: 500 }}
                />
              </MenuItem>
            )}

            <Divider sx={{ my: 0.5 }} />

            <MenuItem
              onClick={() => {
                const doc = actionMenuDoc;
                setActionMenuAnchorEl(null);
                setActiveDocId(doc.id);
                setTimelineOpen(true);
              }}
              sx={{
                fontSize: "13px",
                py: 1,
                gap: 1.5,
                color: "#334155",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f766e" },
              }}
            >
              <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
                <HistoryIcon fontSize="small" className="text-slate-400" />
              </ListItemIcon>
              <ListItemText
                primary="Timeline"
                primaryTypographyProps={{ fontSize: "13px", fontWeight: 500 }}
              />
            </MenuItem>

            {["draft", "sent", "in_progress", "declined", "expired"].includes(
              actionMenuDoc.status
            ) && (
              <>
                <Divider sx={{ my: 0.5 }} />

                <MenuItem
                  onClick={() => {
                    const doc = actionMenuDoc;
                    setActionMenuAnchorEl(null);
                    setDocToVoid(doc);
                    setVoidDialogOpen(true);
                  }}
                  sx={{
                    fontSize: "13px",
                    py: 1,
                    gap: 1.5,
                    color: "#d97706",
                    "&:hover": { bgcolor: "#fffbeb" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "auto", color: "#d97706" }}>
                    <CancelIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Void Document"
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "inherit",
                    }}
                  />
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    const doc = actionMenuDoc;
                    setActionMenuAnchorEl(null);
                    setDocToDelete(doc);
                    setDeleteDialogOpen(true);
                  }}
                  sx={{
                    fontSize: "13px",
                    py: 1,
                    gap: 1.5,
                    color: "#dc2626",
                    "&:hover": { bgcolor: "#fef2f2" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "auto", color: "#dc2626" }}>
                    <DeleteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Delete"
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "inherit",
                    }}
                  />
                </MenuItem>
              </>
            )}

            {actionMenuDoc.status === "voided" && (
              <>
                <Divider sx={{ my: 0.5 }} />

                <MenuItem
                  onClick={async () => {
                    const doc = actionMenuDoc;
                    setActionMenuAnchorEl(null);
                    try {
                      await restoreDocument(doc.id);
                      showAlert.success(
                        "Document Reactivated",
                        "The void action was cancelled. The document is now active again."
                      );
                      loadDocs();
                    } catch (e) {
                      showAlert.error(
                        "Action Failed",
                        showAlert.extractMessage(
                          e,
                          "Unable to cancel document void status."
                        )
                      );
                    }
                  }}
                  sx={{
                    fontSize: "13px",
                    py: 1,
                    gap: 1.5,
                    color: "#059669",
                    "&:hover": { bgcolor: "#ecfdf5" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "auto", color: "#059669" }}>
                    <RestoreIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cancel Void"
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "inherit",
                    }}
                  />
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    const doc = actionMenuDoc;
                    setActionMenuAnchorEl(null);
                    setDocToDelete(doc);
                    setDeleteDialogOpen(true);
                  }}
                  sx={{
                    fontSize: "13px",
                    py: 1,
                    gap: 1.5,
                    color: "#dc2626",
                    "&:hover": { bgcolor: "#fef2f2" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "auto", color: "#dc2626" }}>
                    <DeleteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Delete"
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "inherit",
                    }}
                  />
                </MenuItem>
              </>
            )}

            {actionMenuDoc.status === "deleted" && (
              <>
                <Divider sx={{ my: 0.5 }} />

                <MenuItem
                  onClick={async () => {
                    const doc = actionMenuDoc;
                    setActionMenuAnchorEl(null);
                    try {
                      await restoreDocument(doc.id);
                      showAlert.success(
                        "Document Restored",
                        `"${doc.filename}" has been restored to your active documents.`
                      );
                      loadDocs();
                    } catch (e) {
                      showAlert.error(
                        "Restore Failed",
                        showAlert.extractMessage(
                          e,
                          "Failed to restore document."
                        )
                      );
                    }
                  }}
                  sx={{
                    fontSize: "13px",
                    py: 1,
                    gap: 1.5,
                    color: "#059669",
                    "&:hover": { bgcolor: "#ecfdf5" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "auto", color: "#059669" }}>
                    <RestoreIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Restore"
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "inherit",
                    }}
                  />
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    const doc = actionMenuDoc;
                    setActionMenuAnchorEl(null);
                    setDocToPermanentDelete(doc);
                    setPermanentDeleteOpen(true);
                  }}
                  sx={{
                    fontSize: "13px",
                    py: 1,
                    gap: 1.5,
                    color: "#dc2626",
                    "&:hover": { bgcolor: "#fef2f2" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "auto", color: "#dc2626" }}>
                    <DeleteForeverIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Permanent Delete"
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "inherit",
                    }}
                  />
                </MenuItem>
              </>
            )}

            <Divider sx={{ my: 0.5 }} />

            {actionMenuDoc.status === "draft" && (
              <MenuItem
                onClick={() => {
                  const doc = actionMenuDoc;
                  setActionMenuAnchorEl(null);
                  setMergeDoc(doc);
                  setMergeFiles([]);
                  setFile(null);
                  setMergeOpen(true);
                }}
                sx={{
                  fontSize: "13px",
                  py: 1,
                  gap: 1.5,
                  color: "#334155",
                  "&:hover": { bgcolor: "#f8fafc", color: "#0f766e" },
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
                  <FaPlus size={14} className="text-slate-400" />
                </ListItemIcon>
                <ListItemText
                  primary="Add / Merge File"
                  primaryTypographyProps={{ fontSize: "13px", fontWeight: 500 }}
                />
              </MenuItem>
            )}

            <MenuItem
              onClick={() => {
                const doc = actionMenuDoc;
                setActionMenuAnchorEl(null);
                navigate(`/user/document-summary/${doc.id}`);
              }}
              sx={{
                fontSize: "13px",
                py: 1,
                gap: 1.5,
                color: "#334155",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f766e" },
              }}
            >
              <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
                <SummarizeIcon fontSize="small" className="text-slate-400" />
              </ListItemIcon>
              <ListItemText
                primary="View Summary"
                primaryTypographyProps={{ fontSize: "13px", fontWeight: 500 }}
              />
            </MenuItem>
          </>
        )}
      </Menu>


      {/* Place modals/drawer once per parent component (not inside map) */}

      {showRecipientManager && selectedDocument && (
        <RecipientManager
          document={selectedDocument}
          onUpdate={() => {
            loadDocs();
            setShowRecipientManager(false);
          }}
        />
      )}






      <DocumentViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        documentId={activeDocId}
        url={viewDocumentUrl(activeDocId)}
        documentName={activeDocument?.filename}

      />

      <SignedPreviewModal
        open={signedOpen}
        onClose={() => setSignedOpen(false)}
        documentId={activeDocId}
        url={signedPreviewUrl(activeDocId)}
        documentName={activeDocument?.filename}
      />


      <TimelineDrawer open={timelineOpen} onClose={() => setTimelineOpen(false)} documentId={activeDocId} />


      <UploadPreviewModal
        open={previewOpen}
        file={previewFile}
        onClose={() => {
          setPreviewOpen(false);
          setFile(null);
        }}
        onUpload={() => {
          setPreviewOpen(false);
          handleUpload(previewFile);
        }}
        onPrepareAndSend={() => {
          setPreviewOpen(false);
          handleUpload(previewFile);
          // The success dialog will show after upload
        }}
      />


      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>






      {/* Add or merge file dialog (multi-file support matching PrepareSendRecipients add document module) */}
      <Dialog
        open={Boolean(mergeOpen)}
        onClose={() => {
          if (!mergeLoading) {
            setMergeOpen(false);
            setFile(null);
            setMergeFiles([]);
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "18px", p: 1, maxWidth: { xs: "95vw", sm: 520 } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.15rem", color: "#1e293b", pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Add Documents to Envelope</span>
          <IconButton
            size="small"
            disabled={mergeLoading}
            onClick={() => {
              setMergeOpen(false);
              setFile(null);
              setMergeFiles([]);
            }}
            sx={{ color: "#64748b" }}
          >
            <FaTimes size={16} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: "#f1f5f9" }}>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2, display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 0.5, minWidth: 0 }}>
            <span>Files will be added to:</span>
            <FilenameDisplay filename={mergeDoc?.filename} sx={{ fontWeight: 600, color: "#1e293b" }} />
          </Typography>

          {/* Multi-file dropzone / selector */}
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setMergeDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setMergeDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setMergeDragOver(false);
              const dropped = Array.from(e.dataTransfer.files || []);
              if (dropped.length) {
                setMergeFiles(prev => [...prev, ...dropped]);
                setFile(dropped[0]);
              }
            }}
            sx={{
              border: "2px dashed",
              borderColor: mergeDragOver ? "#0f766e" : "#cbd5e1",
              bgcolor: mergeDragOver ? "#f0fdfa" : "#f8fafc",
              borderRadius: "14px",
              p: 2.5,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
            }}
            onClick={() => document.getElementById("merge-multi-file-input")?.click()}
          >
            <input
              id="merge-multi-file-input"
              type="file"
              className="hidden"
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length > 0) {
                  setMergeFiles(prev => [...prev, ...selected]);
                  setFile(selected[0]);
                }
                e.target.value = "";
              }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: "#e0f2fe",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20
                }}
              >
                <FiUploadCloud />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                Click or drag documents here
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Supports PDF, Word, and Images (Multi-file support, Max 25MB each)
              </Typography>
            </Box>
          </Box>

          {/* List of selected files */}
          {mergeFiles.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  {mergeFiles.length} file{mergeFiles.length > 1 ? "s" : ""} selected
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Total: {(mergeFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>

              <Box sx={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1, pr: 0.5 }}>
                {mergeFiles.map((f, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.25,
                      bgcolor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: f.name.toLowerCase().endsWith(".pdf") ? "#fee2e2" : "#f1f5f9",
                        color: f.name.toLowerCase().endsWith(".pdf") ? "#dc2626" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {f.name.toLowerCase().endsWith(".pdf") ? <FaFilePdf /> : <FaFileAlt />}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <FilenameDisplay
                        filename={f.name}
                        sx={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", display: "block" }}
                      />
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {(f.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    {!mergeLoading && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = mergeFiles.filter((_, i) => i !== idx);
                          setMergeFiles(updated);
                          setFile(updated[0] || null);
                        }}
                        sx={{ color: "#94a3b8", "&:hover": { color: "#ef4444" } }}
                        title="Remove file"
                      >
                        <FaTrash size={13} />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {mergeLoading && (
            <Box sx={{ mt: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: 600 }}>
                  {processingMsg || "Processing documents..."}
                </Typography>
                <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: 700 }}>
                  {mergeProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={mergeProgress}
                sx={{
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: "#e2e8f0",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, #34d399, #0f766e)",
                    borderRadius: 3.5,
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setMergeOpen(false);
              setFile(null);
              setMergeFiles([]);
            }}
            disabled={mergeLoading}
            sx={{ textTransform: "none", borderRadius: "8px", color: "#475569", borderColor: "#cbd5e1" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={mergeFiles.length === 0 || mergeLoading}
            onClick={async () => {
              if (!mergeDoc || mergeFiles.length === 0) return;
              try {
                setMergeLoading(true);
                setMergeProgress(0);
                const total = mergeFiles.length;

                for (let i = 0; i < total; i++) {
                  const currentF = mergeFiles[i];
                  setProcessingMsg(`Uploading file ${i + 1} of ${total}: ${currentF.name}...`);

                  await addFileToDocument(
                    mergeDoc.id,
                    currentF,
                    (p) => {
                      const overall = Math.round(((i + (p / 100)) / total) * 60);
                      setMergeProgress(overall);
                      if (p >= 50) setProcessingMsg(`Processing file ${i + 1} of ${total} on server...`);
                    }
                  );

                  // Poll backend processing for this file
                  let attempts = 0;
                  while (attempts < 40) {
                    try {
                      const statusRes = await getDocumentStatus(mergeDoc.id);
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

                setMergeProgress(100);
                setProcessingMsg("Complete!");

                setSnackbar({
                  open: true,
                  message: total > 1
                    ? `Successfully added ${total} documents to envelope!`
                    : "File added successfully to envelope!",
                  severity: "success",
                });

                setMergeOpen(false);
                setFile(null);
                setMergeFiles([]);
                loadDocs();
              } catch (err) {
                setSnackbar({
                  open: true,
                  message: err.response?.data?.detail || err.message || "Failed to add files",
                  severity: "error",
                });
              } finally {
                setMergeLoading(false);
                setMergeProgress(0);
                setProcessingMsg("");
              }
            }}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              bgcolor: "#0f766e",
              fontWeight: 600,
              "&:hover": { bgcolor: "#115e59" }
            }}
          >
            {mergeFiles.length > 1 ? `Add ${mergeFiles.length} Documents` : "Add Document"}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Success Dialog after Upload */}
      <Dialog
        open={Boolean(showSuccessDialog)}
        onClose={() => {
          setShowSuccessDialog(false);
          setUploadedDocument(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: { xs: "92vw", sm: 480 },
            width: "100%",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <div className="p-8 pb-4 text-center">
            <img
              src="/images/tick.gif"
              alt="Success"
              className="w-24 h-24 mx-auto mb-3 block object-contain"
            />
            <div className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">
              Upload Successful
            </div>
            <div className="text-slate-500 text-sm leading-relaxed">
              Your document is ready for adding fields and recipients.
            </div>
          </div>

          <div className="px-7 pb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
              <div className="flex items-center py-2 text-sm border-b border-slate-200/70">
                <span className="text-slate-500 font-medium min-w-[120px] shrink-0">Document Name</span>
                <span className="text-slate-400 mr-2 font-medium">:</span>
                <div className="flex-1 min-w-0">
                  <FilenameDisplay
                    filename={uploadedDocument?.filename || 'Untitled'}
                    sx={{ fontWeight: 600, color: '#0f172a' }}
                  />
                </div>
              </div>

              <div className="flex items-center py-2 text-sm border-b border-slate-200/70">
                <span className="text-slate-500 font-medium min-w-[120px] shrink-0">File Type</span>
                <span className="text-slate-400 mr-2 font-medium">:</span>
                <span className="text-slate-900 font-semibold flex-1">
                  {uploadedDocument?.mime_type
                    ? (uploadedDocument.mime_type.split('/').pop()?.toUpperCase() ||
                      uploadedDocument.filename?.split('.').pop()?.toUpperCase() ||
                      "FILE")
                    : uploadedDocument?.filename?.split('.').pop()?.toUpperCase() || "FILE"}
                </span>
              </div>

              <div className="flex items-center py-2 text-sm">
                <span className="text-slate-500 font-medium min-w-[120px] shrink-0">File Size</span>
                <span className="text-slate-400 mr-2 font-medium">:</span>
                <span className="text-slate-900 font-semibold flex-1">
                  {uploadedDocument?.size
                    ? uploadedDocument.size > 1024 * 1024
                      ? `${(uploadedDocument.size / 1024 / 1024).toFixed(2)} MB`
                      : `${Math.round(uploadedDocument.size / 1024)} KB`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{ p: "16px 28px", bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowSuccessDialog(false);
              setUploadedDocument(null);
            }}
            sx={{
              height: 42,
              px: 2.5,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              color: "#475569",
              borderColor: "#cbd5e1",
              bgcolor: "white",
              "&:hover": { bgcolor: "#f1f5f9", borderColor: "#94a3b8" }
            }}
          >
            Close
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              navigate(`/user/prepare-send/${uploadedDocument.id}`, {
                state: {
                  document: uploadedDocument,
                  fromUpload: true,
                },
              });
              setShowSuccessDialog(false);
              setUploadedDocument(null);
            }}
            sx={{
              height: 42,
              px: 2.5,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#0f766e",
              color: "white",
              boxShadow: "0 4px 12px rgba(13, 148, 136, 0.2)",
              "&:hover": {
                bgcolor: "#115e59",
                boxShadow: "0 6px 16px rgba(13, 148, 136, 0.3)"
              }
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>


      {/* Rename Document Dialog */}
      <Dialog
        open={Boolean(renameOpen)}
        onClose={() => !renaming && setRenameOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.15rem", color: "#1e293b", pb: 1 }}>
          Rename Document
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: "#f1f5f9" }}>
          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:border-[#0f766e] focus-within:ring-1 focus-within:ring-[#0f766e] transition-all my-2 w-full min-w-0">
            <input
              type="text"
              value={newFilename}
              maxLength={60}
              onChange={(e) =>
                setNewFilename(
                  (e.target.value || "").replace(/\.pdf$/i, "").slice(0, 60)
                )
              }
              placeholder="Enter document name"
              autoFocus
              className="flex-1 min-w-0 px-3 py-2 text-sm text-slate-800 outline-none border-none bg-transparent"
            />
            <span className="bg-slate-100 text-slate-500 font-medium px-3 py-2 text-sm border-l border-slate-200 select-none shrink-0">
              .pdf
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 mt-1 px-1">
            <span className="truncate max-w-[220px]" title={newFilename ? `${newFilename}.pdf` : ""}>
              {newFilename.length > 35 ? `${newFilename.slice(0, 32)}...` : newFilename}
            </span>
            <span className={newFilename.length >= 60 ? "text-amber-600 font-semibold" : ""}>
              {newFilename.length}/60
            </span>
          </div>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setRenameOpen(false)}
            disabled={renaming}
            sx={{ textTransform: "none", borderRadius: "8px", color: "#475569", borderColor: "#cbd5e1" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={!newFilename.trim() || renaming}
            onClick={async () => {
              try {
                setRenaming(true);

                const finalFilename = `${newFilename.trim()}.pdf`;

                await fetch(
                  `${API_BASE_URL}/documents/${activeDocId}/rename`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      filename: finalFilename,
                    }),
                  }
                );

                // Update UI immediately
                setDocuments(prev =>
                  prev.map(d =>
                    d.id === activeDocId
                      ? { ...d, filename: finalFilename }
                      : d
                  )
                );

                setRenameOpen(false);
              } catch (err) {
                alert("Rename failed");
              } finally {
                setRenaming(false);
              }
            }}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              backgroundColor: "#0f766e",
              "&:hover": { backgroundColor: "#115e59" }
            }}
          >
            {renaming ? "Renaming…" : "Rename"}
          </Button>
        </DialogActions>
      </Dialog>


      {/* <PremiumBannerSlider /> */}



      {/* Void Document Dialog with MUI */}
      <Dialog
        open={voidDialogOpen}
        onClose={() => !voiding && setVoidDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "18px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.15rem", color: "#1e293b", pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <WarningAmberIcon fontSize="small" />
          </Box>
          <span>Void Document?</span>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: "#f1f5f9" }}>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 1.5 }}>
            This will immediately stop all signing activity and void the document:
          </Typography>

          <Box sx={{ p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", mb: 2, minWidth: 0, overflow: "hidden" }}>
            <FilenameDisplay
              filename={docToVoid?.filename}
              sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}
            />
          </Box>

          <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 500, display: "block" }}>
            Warning: This action marks the document voided and recipients will no longer be able to sign.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setVoidDialogOpen(false)}
            disabled={voiding}
            sx={{ textTransform: "none", borderRadius: "8px", color: "#475569", borderColor: "#cbd5e1" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={voiding}
            onClick={async () => {
              try {
                setVoiding(true);
                await voidDocument(docToVoid.id);

                setSnackbar({
                  open: true,
                  message: "Document voided successfully",
                  severity: "success",
                });

                setVoidDialogOpen(false);
                setDocToVoid(null);
                loadDocs();
              } catch (err) {
                setSnackbar({
                  open: true,
                  message: err.response?.data?.detail || "Failed to void document",
                  severity: "error",
                });
              } finally {
                setVoiding(false);
              }
            }}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              bgcolor: "#d97706",
              "&:hover": { bgcolor: "#b45309" }
            }}
          >
            {voiding ? "Voiding…" : "Void Document"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete / Move to Trash Dialog with MUI */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "18px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.15rem", color: "#1e293b", pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DeleteIcon fontSize="small" />
          </Box>
          <span>Move to Trash?</span>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: "#f1f5f9" }}>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 1.5 }}>
            This document will be moved to Trash:
          </Typography>

          <Box sx={{ p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", mb: 2, minWidth: 0, overflow: "hidden" }}>
            <FilenameDisplay
              filename={docToDelete?.filename}
              sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}
            />
          </Box>

          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
            You can restore it later from Trash or permanently remove it.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ textTransform: "none", borderRadius: "8px", color: "#475569", borderColor: "#cbd5e1" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={async () => {
              try {
                setDeleting(true);
                await softDeleteDocument(docToDelete.id);

                setSnackbar({
                  open: true,
                  message: "Document moved to trash",
                  severity: "success",
                });

                setDeleteDialogOpen(false);
                setDocToDelete(null);
                loadDocs();
              } catch (err) {
                setSnackbar({
                  open: true,
                  message: err.response?.data?.detail || "Delete failed",
                  severity: "error",
                });
              } finally {
                setDeleting(false);
              }
            }}
            sx={{ textTransform: "none", borderRadius: "8px" }}
          >
            {deleting ? "Deleting…" : "Move to Trash"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permanent Delete Dialog with MUI */}
      <Dialog
        open={permanentDeleteOpen}
        onClose={() => !permanentDeleting && setPermanentDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "18px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.15rem", color: "#dc2626", pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DeleteForeverIcon fontSize="small" />
          </Box>
          <span>Delete Permanently?</span>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: "#f1f5f9" }}>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 1.5 }}>
            You are about to permanently delete this document:
          </Typography>

          <Box sx={{ p: 1.5, bgcolor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", mb: 2, minWidth: 0, overflow: "hidden" }}>
            <FilenameDisplay
              filename={docToPermanentDelete?.filename}
              sx={{ fontWeight: 600, color: "#991b1b", fontSize: "0.9rem" }}
            />
          </Box>

          <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 500, display: "block" }}>
            This action cannot be undone. The document, audit logs, and signatures will be erased forever.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setPermanentDeleteOpen(false)}
            disabled={permanentDeleting}
            sx={{ textTransform: "none", borderRadius: "8px", color: "#475569", borderColor: "#cbd5e1" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={permanentDeleting}
            onClick={async () => {
              try {
                setPermanentDeleting(true);
                await permanentDeleteDocument(docToPermanentDelete.id);

                setSnackbar({
                  open: true,
                  message: "Document permanently deleted",
                  severity: "success",
                });

                setPermanentDeleteOpen(false);
                setDocToPermanentDelete(null);
                loadDocs();
              } catch (err) {
                setSnackbar({
                  open: true,
                  message:
                    err.response?.data?.detail ||
                    "Failed to permanently delete document",
                  severity: "error",
                });
              } finally {
                setPermanentDeleting(false);
              }
            }}
            sx={{ textTransform: "none", borderRadius: "8px" }}
          >
            {permanentDeleting ? "Deleting…" : "Delete Permanently"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Plan Restriction Dialog with MUI */}
      <Dialog
        open={planRestrictionOpen}
        onClose={() => setPlanRestrictionOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "18px",
            p: 1,
            maxWidth: "450px"
          }
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 700, fontSize: "1.25rem", color: "#1e293b", pb: 1 }}>
          Subscription Required
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.6 }}>
            You need an active subscription plan to upload and process documents. Please upgrade your plan to continue.
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8", fontStyle: "italic" }}>
            If you believe this is an error, please try logging out and logging back in to refresh your session.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 1.5, p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              logout();
              localStorage.removeItem("token");
              navigate("/login");
            }}
            sx={{ borderRadius: "8px", textTransform: "none", borderColor: "#cbd5e1", color: "#475569" }}
          >
            Logout & Login
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setPlanRestrictionOpen(false);
              navigate("/user/subscription");
            }}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              bgcolor: "#0f766e",
              "&:hover": { bgcolor: "#115e59" },
              boxShadow: "0 4px 6px -1px rgba(15, 118, 110, 0.2)"
            }}
          >
            Upgrade Plan
          </Button>
        </DialogActions>
      </Dialog>



    </Box>





  );
}
