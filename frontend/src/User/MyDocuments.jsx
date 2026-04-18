import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
  FaCloudUploadAlt,
  FaFileAlt,
  FaFolder,
  FaFolderOpen,
  FaGoogleDrive,
  FaDropbox,
  FaMicrosoft,
  FaBox,
  FaSearch,
  FaTimes,
  FaArrowLeft,
  FaSync,
  FaPlus,
  FaChevronDown,
  FaFilePdf,
  FaFileImage,
  FaFileWord, FaFilter

} from "react-icons/fa";
import { AiOutlineFileText } from "react-icons/ai";




import { FiUploadCloud } from "react-icons/fi";
import { FiUpload } from "react-icons/fi";

import {
  Dialog, Typography,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

import { Snackbar, Alert } from "@mui/material";
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
  Archive as ArchiveIcon
} from "@mui/icons-material";
import { Button } from "@mui/material";
import { FaEdit } from "react-icons/fa";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import { Summarize as SummarizeIcon } from "@mui/icons-material";


import "../style/MyDocuments.css";
import RecipientManager from "./RecipientSelector"; // Fixed import
import TemplateBrowser from "./TemplateBrowser";
import AITemplateBrowser from './AITemplateBrowser';
import DocumentViewerModal from "../components/DocumentViewerModal";
import SignedPreviewModal from "../components/SignedPreviewModal";
import TimelineDrawer from "../components/TimelineDrawer";
import StatusChip from "../components/StatusChip";
import { voidDocument, restoreDocument, softDeleteDocument, viewDocumentUrl, signedPreviewUrl, permanentDeleteDocument, addFileToDocument, getDocumentsPaged, getDocumentStatus } from "../services/DocumentAPI";
import { setPageTitle } from "../utils/pageTitle";
// import templatesAPI from "../services/api";
import UploadPreviewModal from "../components/UploadPreviewModal";
// import PremiumBannerSlider from "../components/PremiumBannerSlider";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";
const token = localStorage.getItem("token");

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
  const [totalPages, setTotalPages] = useState(1);
  const [mergeDoc, setMergeDoc] = useState(null);
  const [mergeOpen, setMergeOpen] = useState(false);

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
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);



  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    setPageTitle(
      "Document Management",
      "View, manage, and track all your documents in one secure place."
    );
  }, []);

  // Debug environment variables
  useEffect(() => {
    console.log('Environment Variables Check:');
    console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Loaded' : 'Missing');
    console.log('Google Redirect URI:', process.env.REACT_APP_GOOGLE_REDIRECT_URI ? 'Loaded' : 'Missing');
    console.log('Box Client ID:', process.env.REACT_APP_BOX_CLIENT_ID ? 'Loaded' : 'Missing');
    console.log('Box Redirect URI:', process.env.REACT_APP_BOX_REDIRECT_URI ? 'Loaded' : 'Missing');
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close Upload Dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUploadDropdown(false);
      }

      // Close Filter Dropdown
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowAdvancedFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  // Synchronize URL status filter with state
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const statusParam = urlParams.get("status");

    if (statusParam) {
      setFilters(prev => ({
        ...prev,
        status: statusParam === "all" ? "" : statusParam
      }));
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [location.search]);

  // REMOVED DUMMY INTERVAL for mergeProgress - now using real polling logic below



  // Load user's documents
  const loadDocs = async () => {
    setListLoading(true);
    try {
      const res = await getDocumentsPaged(currentPage, pageSize, filters.status);
      setDocuments(res.documents);
      setTotalDocs(res.total);
      setTotalPages(res.total_pages);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [currentPage, pageSize, filters.status]);

  // =============================================
  // UPLOAD HANDLERS
  // =============================================

  const handleLocalUpload = () => {
    fileInputRef.current?.click();
    setShowUploadDropdown(false);
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const isDocx = selectedFile.name.toLowerCase().endsWith('.docx');

    if (isDocx) {
      setFile(selectedFile);
      handleUpload(selectedFile);
    } else {
      setFile(selectedFile);
      setPreviewFile(selectedFile);
      setPreviewOpen(true);
    }
  };


  const filteredDocuments = documents.filter((doc) => {
    const search = filters.search.toLowerCase();

    const matchesSearch =
      !filters.search ||
      doc.filename?.toLowerCase().includes(search) ||
      new Date(doc.uploaded_at)
        .toLocaleDateString()
        .toLowerCase()
        .includes(search);

    const matchesStatus =
      !filters.status || doc.status === filters.status;

    const matchesSource =
      !filters.source ||
      doc.source?.toLowerCase() === filters.source;

    return matchesSearch && matchesStatus && matchesSource;
  });


  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, filters.source]);


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

  const handleUpload = async (uploadFile) => {
    if (!uploadFile) return;

    setLoading(true);
    setUploadProgress(0);
    setProcessingMsg("Uploading document to server...");

    try {
      // 1. Initial Upload (scaled to 0-50% in DocumentAPI)
      const res = await uploadDocument(uploadFile, (percent) => {
        setUploadProgress(percent);
        if (percent >= 50) {
          setProcessingMsg("Transferred! Converting and processing...");
        }
      });

      console.log("UPLOAD RESPONSE (INITIAL):", res);
      const docId = res?.document_id || res?.document?.id;
      if (!docId) throw new Error("Upload API did not return document id");

      // 2. Poll for Background Processing Status (handles 50-100%)
      let isDone = false;
      let pollCount = 0;
      const MAX_POLLS = 120; // 2 minutes max polling

      while (!isDone && pollCount < MAX_POLLS) {
        pollCount++;
        // Wait 1 second between polls
        await new Promise(r => setTimeout(r, 1000));

        try {
          const statusRes = await getDocumentStatus(docId);
          const backendProgress = statusRes.progress || 0;
          const backendMsg = statusRes.processing_status || "Processing...";

          // Map backend progress (20-100) to frontend progress (50-100)
          // Since backend starts at 20% after upload is confirmed
          let mappedProgress = 50;
          if (backendProgress > 20) {
            mappedProgress = 50 + Math.round((backendProgress - 20) * (50 / 80));
          }

          setUploadProgress(Math.min(mappedProgress, 99));
          setProcessingMsg(backendMsg);

          if (statusRes.status !== "processing" || backendProgress >= 100) {
            isDone = true;
          }
        } catch (pollErr) {
          console.error("Status check failed:", pollErr);
          // If status check fails, we might just stop polling and assume it's working
          // or wait for the next iteration
        }
      }

      // 3. Finalization
      setUploadProgress(100);
      setProcessingMsg("Complete");

      // Fetch the final document data
      const finalDocRes = await getDocumentsPaged(1, 10, filters.status);
      const newDoc = finalDocRes.documents.find(d => d.id === docId);

      setUploadedDocument(newDoc || { id: docId });
      setShowSuccessDialog(true);
      setSnackbar({ open: true, message: "Document uploaded successfully", severity: "success" });
      loadDocs();

    } catch (err) {
      console.error("Upload error:", err);
      setSnackbar({ open: true, message: err.message || "Upload failed", severity: "error" });
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setProcessingMsg("");
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

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const isDocx = droppedFile.name.toLowerCase().endsWith('.docx');
      if (isDocx) {
        setFile(droppedFile);
        handleUpload(droppedFile);
      } else {
        setFile(droppedFile);
        setPreviewFile(droppedFile);
        setPreviewOpen(true);
      }
    }
  };

  // =============================================
  // CLOUD PROVIDER HANDLERS
  // =============================================

  const handleCloudProviderSelect = (provider) => {
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
      alert('Google Client ID is not configured. Please check your environment variables.');
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
      alert("Failed to complete Google login: " + (err.response?.data?.detail || err.message));
    }
  };

  const loadGooglePicker = (accessToken) => {
    if (!window.google || !window.google.picker) {
      if (window.gapi) {
        window.gapi.load('picker', {
          callback: () => showGooglePicker(accessToken),
          onerror: () => {
            console.error('Failed to load Google Picker API');
            alert('Failed to load Google Picker. Please try again.');
          }
        });
      } else {
        alert('Google API not loaded. Please check your internet connection and try again.');
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
      alert("Dropbox SDK not loaded. Please check your internet connection.");
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
            alert("File uploaded from Dropbox successfully");
            loadDocs();
          } catch (error) {
            console.error("Dropbox upload error:", error);
            alert("Failed to upload file from Dropbox: " + (error.response?.data?.detail || error.message));
          }
        }
      },
      error: (error) => {
        console.error("Dropbox chooser error:", error);
        alert("Dropbox chooser failed");
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
      alert("OneDrive SDK not loaded. Please check your internet connection.");
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
            alert("File uploaded from OneDrive successfully");
            loadDocs();
          } catch (error) {
            console.error("OneDrive upload error:", error);
            alert("Failed to upload file from OneDrive: " + (error.response?.data?.detail || error.message));
          }
        }
      },
      cancel: () => console.log("OneDrive picker cancelled"),
      error: (e) => {
        console.error("OneDrive picker error:", e);
        alert("OneDrive error: " + e);
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
      alert('Box Client ID is not configured. Please check your environment variables.');
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

      alert("Box connected successfully");
      window.history.replaceState({}, document.title, "/documents");

      setShowBoxPicker(true);
      loadBoxFiles("0", token);

    } catch (err) {
      console.error("Box auth failed:", err);
      alert("Failed to complete Box login: " + (err.response?.data?.detail || err.message));
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
        alert("Box session expired. Please reconnect.");
        authenticateWithBox();
      } else {
        alert("Failed to load files from Box: " + (error.response?.data?.detail || error.message));
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

      alert("File uploaded from Box successfully");
      setShowBoxPicker(false);
      loadDocs();

    } catch (error) {
      console.error("Box upload error:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("box_access_token");
        setBoxToken(null);
        alert("Box session expired. Please reconnect.");
        authenticateWithBox();
      } else {
        alert("Failed to upload file from Box: " + (error.response?.data?.detail || error.message));
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
      if (!template?.templateId) {
        throw new Error("templateId is missing");
      }

      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/documents/from-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          template_id: template.templateId,
          title: `Copy of ${template.name}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Backend error:", data);
        throw new Error(data.detail || "Backend failed");
      }

      console.log("SUCCESS:", data);
      setShowTemplateBrowser(false);
      loadDocs();
    } catch (err) {
      console.error("CREATE FROM TEMPLATE ERROR:", err);
      alert(err.message);
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
      alert("Template ID is required");
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

      if (result.document) {
        // Success
        setSnackbar({
          open: true,
          message: `Document created from "${template.name}" template`,
          severity: "success",
        });

        // Refresh documents
        loadDocs();

        // Close template browser
        setShowTemplateBrowser(false);

        // Optionally navigate to the new document
        if (result.document.id) {
          // navigate to document editor or preview
        }
      } else {
        throw new Error("No document created");
      }

    } catch (err) {
      console.error("Template usage error:", err);
      setSnackbar({
        open: true,
        message: `Failed to use template: ${err.message}`,
        severity: "error",
      });
    } finally {
      setTemplateLoading(false);
    }
  };


  const handleTemplateUse = (template) => {
    console.log('Template selected for use:', template);
    // Load the template into your editor
    // setCurrentTemplate(template);
    // setActiveTab(1); // Switch to visual builder tab
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
        alert("Download failed: " + err.response?.data?.detail);
      }
    }
  };

  const handleDownloadPackage = async (doc) => {
    try {
      setLoading(true);
      await downloadDocument(doc.id, doc.filename, "package");
    } catch (err) {
      console.error("Package download error:", err);
      alert("Failed to download package: " + (err.response?.data?.detail || "Unknown error"));
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
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className="file-icon pdf" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <FaFileImage className="file-icon image" />;
    if (['doc', 'docx'].includes(ext)) return <FaFileWord className="file-icon word" />;
    if (['xls', 'xlsx'].includes(ext)) return <FaFileAlt className="file-icon excel" />;
    if (['ppt', 'pptx'].includes(ext)) return <FaFileAlt className="file-icon ppt" />;

    return <FaFileAlt className="file-icon default" />;
  };




  const templates = [
    { id: 1, name: "Employment Contract", icon: <FaFileAlt />, description: "Standard employment agreement template" },
    { id: 2, name: "NDA Agreement", icon: <FaFileAlt />, description: "Non-disclosure agreement template" },
    { id: 3, name: "Sales Proposal", icon: <FaFileAlt />, description: "Professional sales proposal template" },
    { id: 4, name: "Meeting Minutes", icon: <FaFileAlt />, description: "Formal meeting minutes template" },
  ];








  return (
    <div className="doc-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">My Documents</h1>
        <p className="page-subtitle">Manage all your documents in one place</p>
      </div>

      {/* Modern Upload Section */}
      <div className="upload-section">


        <div
          className={`upload-area ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-icon">
            <FaCloudUploadAlt />
          </div>
          <h2 className="upload-title">Upload Your Documents</h2>
          <p className="upload-subtitle">
            Drag & drop files here or choose from the options below
          </p>

          <div className="upload-button-container" ref={dropdownRef}>
            <button
              className="upload-main-btn"
              onClick={() => setShowUploadDropdown(!showUploadDropdown)}
              disabled={loading}
            >
              <FiUpload className="btn-icon" />
              {loading ? "Uploading..." : "Upload Document"}
              <FaChevronDown className="dropdown-arrow" />
            </button>

            <div className={`upload-dropdown ${showUploadDropdown ? 'show' : ''}`}>
              <button className="dropdown-item" onClick={handleLocalUpload}>
                <FiUploadCloud className="dropdown-icon" />
                <span>Local File</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowUploadDropdown(false);
                  setShowCloudProviders(true);
                }}
              >
                <FaCloudUploadAlt className="dropdown-icon" />
                <span>Cloud Storage</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowUploadDropdown(false);
                  setShowTemplateBrowser(true); // Changed from setShowTemplates
                }}
              >
                <AiOutlineFileText className="dropdown-icon" />
                <span>Use Template</span>
              </button>


              {/* {doc.status === "draft" && (
  <button
    className="dropdown-item"
    onClick={() => {
      setMergeDoc(doc);
      setMergeOpen(true);
    }}
  >
    <FaPlus className="dropdown-icon" />
    <span>Add / Merge File</span>
  </button>
)} */}




              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => setTemplateBrowserOpen(true)}
                className="ai-button"
              >
                Get AI Templates
              </Button>
            </div>
            {loading && (
              <div className="uploading-overlay-root">
                <div className="uploading-card-box">

                  {/* Upload GIF */}
                  <img
                    src="/images/uploading.gif"
                    alt="Uploading"
                    className="uploading-gif-icon"
                  />

                  <h3 className="uploading-title">
                    {processingMsg || "Uploading document…"}
                  </h3>


                  <p className="uploading-filename">
                    {file?.name}
                  </p>

                  <div className="uploading-percent">
                    {uploadProgress}%
                  </div>

                  <div className="uploading-progress-bar">
                    <div
                      className="uploading-progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  <button
                    className="uploading-cancel-btn"
                    onClick={() => {
                      setLoading(false);
                      setUploadProgress(0);
                    }}
                  >
                    Cancel
                  </button>

                </div>
              </div>
            )}



          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </div>

        {/* Cloud Providers Grid */}
        {showCloudProviders && (
          <div className="cloud-providers-section">
            <div className="section-header">
              <h3 className="section-title">Choose Cloud Provider</h3>
              <button
                className="close-section-btn"
                onClick={() => setShowCloudProviders(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="cloud-providers-grid">
              <button className="cloud-provider-btn" onClick={() => handleCloudProviderSelect('google')}>
                <FaGoogleDrive className="cloud-icon" />
                <span>Google Drive</span>
              </button>
              <button className="cloud-provider-btn" onClick={() => handleCloudProviderSelect('dropbox')}>
                <FaDropbox className="cloud-icon" />
                <span>Dropbox</span>
              </button>
              <button className="cloud-provider-btn" onClick={() => handleCloudProviderSelect('onedrive')}>
                <FaMicrosoft className="cloud-icon" />
                <span>OneDrive</span>
              </button>
              <button className="cloud-provider-btn" onClick={() => handleCloudProviderSelect('box')}>
                <FaBox className="cloud-icon" />
                <span>Box</span>
              </button>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        {/* Template Browser Modal */}
        {showTemplateBrowser && (
          <TemplateBrowser
            isOpen={showTemplateBrowser}
            onClose={() => setShowTemplateBrowser(false)}
            onTemplateSelect={handleTemplateSelect}
          />
        )}
      </div>
      <AITemplateBrowser
        open={templateBrowserOpen}
        onClose={() => setTemplateBrowserOpen(false)}
        onTemplateUse={handleTemplateUse}
      />

      {/* Box Picker Modal */}
      {showBoxPicker && (
        <div className="modal-backdrop">
          <div className="modal box-picker-modal">
            <div className="modal-header">
              <h3>Select File from Box</h3>
              <button
                className="close-btn"
                onClick={() => setShowBoxPicker(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-content">
              <div className="box-picker-toolbar">
                <button
                  onClick={handleBoxBack}
                  disabled={boxCurrentFolder === "0"}
                  className="btn btn-outline back-btn"
                >
                  <FaArrowLeft className="btn-icon" />
                  Back
                </button>
                <button
                  onClick={() => loadBoxFiles()}
                  className="btn btn-outline refresh-btn"
                >
                  <FaSync className="btn-icon" />
                  Refresh
                </button>
              </div>

              {boxLoading ? (
                <div className="loading-state">
                  <FaSync className="loading-spinner" />
                  <span>Loading files...</span>
                </div>
              ) : (
                <div className="box-files-list">
                  {boxFiles.length === 0 ? (
                    <div className="empty-state">
                      <FaFolderOpen className="empty-icon" />
                      <span>No files found in this folder</span>
                    </div>
                  ) : (
                    boxFiles.map((item) => (
                      <div
                        key={item.id}
                        className={`box-file-item ${item.type}`}
                        onClick={() => handleBoxFileSelect(item)}
                      >
                        <div className="box-file-icon">
                          {item.type === "folder" ?
                            <FaFolder className="folder-icon" /> :
                            <FaFileAlt className="file-icon" />
                          }
                        </div>
                        <div className="box-file-info">
                          <div className="box-file-name">{item.name}</div>
                          {item.type === "file" && item.size && (
                            <div className="box-file-size">
                              Size: {(item.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          )}
                        </div>
                        {item.type === "folder" && (
                          <div className="box-folder-arrow">
                            <FaChevronDown />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowBoxPicker(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="documents-section">
        <div className="section-header">
          <h3 className="section-title">Your Documents</h3>

          <div className="dt-filter-bar-pro">

            {/* Left: Search */}
            <div className="dt-filter-search">
              <FaSearch className="dt-filter-icon" />
              <input
                type="text"
                placeholder="Search by file name or date…"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

            {/* Right: Filter Button */}
            <div className="dt-filter-actions" ref={filterRef}>
              <button
                className={`dt-filter-btn ${showAdvancedFilters ? 'active' : ''} ${filters.status || filters.source ? 'has-active-filters' : ''}`}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <FaFilter className="dt-filter-btn-icon" />
                <span>Filters</span>
                {(filters.status || filters.source) && (
                  <span className="dt-filter-badge"></span>
                )}
              </button>


              {showAdvancedFilters && (
                <div className="dt-filter-dropdown shadow-lg animate-in fade-in zoom-in duration-200">
                  <div className="dt-filter-dropdown-header">
                    <h4>Advanced Filters</h4>
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className="dt-filter-close-btn"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="dt-filter-group">
                    <label>Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
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
                  </div>

                  <div className="dt-filter-group">
                    <label>Source</label>
                    <select
                      value={filters.source}
                      onChange={(e) =>
                        setFilters({ ...filters, source: e.target.value })
                      }
                    >
                      <option value="">All Sources</option>
                      <option value="local">Local Upload</option>
                      <option value="google">Google Drive</option>
                      <option value="dropbox">Dropbox</option>
                      <option value="onedrive">OneDrive</option>
                      <option value="box">Box</option>
                    </select>
                  </div>

                  <div className="dt-filter-footer">
                    <button
                      className="dt-filter-reset"
                      onClick={() =>
                        setFilters({ search: "", status: "", source: "" })
                      }
                    >
                      Clear All
                    </button>

                    <button
                      className="dt-filter-apply"
                      onClick={() => setShowAdvancedFilters(false)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>


          <span className="doc-count">{filteredDocuments.length} of {totalDocs} documents documents</span>
        </div>


        <div className="safesign-pagination">
          <div className="safesign-pagination-info">
            Showing{" "}
            {totalDocs === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {" – "}
            {Math.min(currentPage * pageSize, totalDocs)} of {totalDocs}
          </div>


          <div className="safesign-pagination-center">
            Rows
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="safesign-pagination-controls">
            <button
              className="safesign-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ← Previous
            </button>

            <span className="safesign-page-current">
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="safesign-page-btn"
              disabled={currentPage >= totalPages || totalDocs === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next →
            </button>
          </div>
        </div>



        {listLoading && !showSuccessDialog ? (
          <div className="ss-content-wrapper-list">
            <div className="ss-loading-overlay">
              <div className="ss-spinner-container">
                <div className="ss-loading-spinner"></div>
                <div className="ss-loader-text">
                  <p>Loading</p>
                  <div className="ss-rotating-words">
                    <span className="ss-word">Status</span>
                    <span className="ss-word">Reports</span>
                    <span className="ss-word">Features</span>
                    <span className="ss-word">Documents</span>
                    <span className="ss-word">Signatures</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-documents">
            <FaFileAlt className="empty-icon" />
            <h4>No documents uploaded yet</h4>
            <p>Start by uploading your first document using the options above</p>
          </div>
        ) : (
          <div className="documents-table-container">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Uploaded On</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (


                  <tr key={doc.id}>
                    <td className="file-cell">
                      {getFileIcon(doc.filename)}
                      <span
                        className="file-name clickable"
                        onClick={() => {
                          setActiveDocId(doc.id);
                          setActiveDocument(doc);
                          setViewerOpen(true);
                        }}
                      >
                        {doc.filename}
                      </span>
                    </td>
                    <td>{new Date(doc.uploaded_at).toLocaleString()}</td>
                    <td>
                      <span className={`source-badge source-${doc.source?.toLowerCase()}`}>
                        {doc.source}
                      </span>
                    </td>
                    <td>
                      <StatusChip status={doc.status} />
                    </td>
                    {/* <td className="action-buttons">
                      <button
  onClick={() => handleDownload(doc)}
  className="btn btn-primary btn-sm"
>
  <FaDownload className="btn-icon" />
  Download
</button>

                      <RecipientManager 
                        document={doc}
                        onUpdate={loadDocs}
                      />
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="btn btn-danger btn-sm"
                      >
                        <FaTrash className="btn-icon" />
                        Delete
                      </button>
                    </td> */}

                    <td className="action-buttons">

                      {/* Prepare & Send Button - Main Action */}
                      {/* {doc.status === "draft" && ( */}
                      <button
                        className="btn btn-primary2"
                        onClick={() => navigate(`/user/prepare-send/${doc.id}`, { state: { document: doc } })}
                        disabled={doc.status !== "draft"}
                      >
                        Prepare & Send
                      </button>
                      {/* )} */}

                      {/* Recipient Manager */}
                      {/* <RecipientManager document={doc} onUpdate={loadDocs} /> */}

                      {/* // In the action-buttons section, add: */}
                      {/* <button
  className="btn btn-primary btn-sm"
  disabled={doc.status !== "draft"}
  onClick={() => handleBuildTemplate(doc)}
>
  <FaEdit className="btn-icon" />
  Build Template
</button> */}


                      {/* Three-dot dropdown menu */}
                      <div
                        className="dropdown"
                        ref={el => {
                          if (el) {
                            // Check space below on hover
                            const checkPosition = () => {
                              const rect = el.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;

                              // If less than 300px below and more space above, open upward
                              if (spaceBelow < 300 && spaceAbove > spaceBelow) {
                                el.classList.add('dropup');
                              } else {
                                el.classList.remove('dropup');
                              }
                            };

                            // Check position on hover
                            el.addEventListener('mouseenter', checkPosition);

                            // Cleanup
                            return () => el.removeEventListener('mouseenter', checkPosition);
                          }
                        }}
                      >
                        <button className="btn btn-sm" title="More actions">
                          <MoreVertIcon />
                        </button>

                        <div className="dropdown-menu">
                          {/* Move Manage Recipients inside dropdown */}

                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setActiveDocId(doc.id);                 // track which doc is being renamed
                              setNewFilename(
                                (doc.filename || "").replace(/\.pdf$/i, "")
                              );
                              setRenameOpen(true);
                            }}

                          >
                            <FaEdit size={14} className="dropdown-icon" />
                            <span>Rename</span>
                          </button>

                          {/* <button 
  className="dropdown-item"
  onClick={() => {
    setSelectedDocument(doc);
    setShowRecipientManager(true);
  }}
>
  <PeopleIcon className="dropdown-icon" />
  <span>Manage Recipients</span>
</button> */}


                          {/* Move Build Template inside dropdown */}

                          {doc.status === "draft" && (
                            <button
                              className="dropdown-item"
                              onClick={() => handleBuildTemplate(doc)}
                              disabled={doc.status !== "draft"}
                            >
                              <EditIcon className="dropdown-icon" />
                              <span>Build Template</span>
                            </button>
                          )
                          }


                          {/* Always visible options */}
                          <button className="dropdown-item" onClick={() => {
                            setActiveDocId(doc.id);
                            setActiveDocument(doc);
                            setViewerOpen(true);
                          }}>
                            <VisibilityIcon className="dropdown-icon" />
                            <span>View Document</span>
                          </button>

                          <button className="dropdown-item" onClick={() => handleDownload(doc)}>
                            <DownloadIcon className="dropdown-icon" />
                            <span>Download</span>
                          </button>

                          <button className="dropdown-item" onClick={() => {
                            setActiveDocId(doc.id);
                            setActiveDocument(doc);
                            setSignedOpen(true);
                          }}>
                            <PreviewIcon className="dropdown-icon" />
                            <span>Signed Preview</span>
                          </button>

                          {doc.status === "completed" && (
                            <button className="dropdown-item" onClick={() => handleDownloadPackage(doc)}>
                              <ArchiveIcon className="dropdown-icon" style={{ fontSize: '14px' }} />
                              <span>Download Package (ZIP)</span>
                            </button>
                          )}

                          <div className="dropdown-divider"></div>

                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setActiveDocId(doc.id);
                              setTimelineOpen(true);
                            }}
                          >
                            <HistoryIcon className="dropdown-icon" />
                            <span>Timeline</span>
                          </button>

                          {/* Conditional options based on status */}
                          {["draft", "sent", "in_progress", "declined", "expired"].includes(doc.status) && (
                            <>
                              <div className="dropdown-divider"></div>

                              <button
                                className="dropdown-item dropdown-item-warning"
                                onClick={() => {
                                  setDocToVoid(doc);
                                  setVoidDialogOpen(true);
                                }}
                              >
                                <CancelIcon className="dropdown-icon" />
                                <span>Void Document</span>
                              </button>


                              <button
                                className="dropdown-item dropdown-item-danger"
                                onClick={() => {
                                  setDocToDelete(doc);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <DeleteIcon className="dropdown-icon" />
                                <span>Delete</span>
                              </button>

                            </>
                          )}

                          {doc.status === "voided" && (
                            <>
                              <div className="dropdown-divider"></div>

                              <button
                                className="dropdown-item dropdown-item-success"
                                onClick={async () => {
                                  await restoreDocument(doc.id);
                                  alert("Void cancelled. Document active.");
                                  loadDocs();
                                }}
                              >
                                <RestoreIcon className="dropdown-icon" />
                                <span>Cancel Void</span>
                              </button>

                              <button
                                className="dropdown-item dropdown-item-danger"
                                onClick={() => {
                                  setDocToDelete(doc);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <DeleteIcon className="dropdown-icon" />
                                <span>Delete</span>
                              </button>

                            </>
                          )}

                          {doc.status === "deleted" && (
                            <>
                              <div className="dropdown-divider"></div>

                              <button
                                className="dropdown-item dropdown-item-success"
                                onClick={async () => {
                                  await restoreDocument(doc.id);
                                  alert("Document restored");
                                  loadDocs();
                                }}
                              >
                                <RestoreIcon className="dropdown-icon" />
                                <span>Restore</span>
                              </button>

                              <button
                                className="dropdown-item dropdown-item-danger"
                                onClick={() => {
                                  setDocToPermanentDelete(doc);
                                  setPermanentDeleteOpen(true);
                                }}
                              >
                                <DeleteForeverIcon className="dropdown-icon" />
                                <span>Permanent Delete</span>
                              </button>

                            </>
                          )}

                          <div className="dropdown-divider"></div>

                          {/* Recipient Manager */}
                          {/* <button 
        className="dropdown-item"
        onClick={() => {
          // You'll need to implement a modal or other way to show RecipientManager
          // For now, let's assume RecipientManager opens in a modal
          setSelectedDocument(doc);
        }}
      >
        <PeopleIcon className="dropdown-icon" />
        <span>Manage Recipients</span>
      </button> */}

                          {/* Build Template */}
                          {/* <button 
        className="dropdown-item dropdown-item-primary"
        onClick={() => handleBuildTemplate(doc)}
      >
        <EditIcon className="dropdown-icon" />
        <span>Build Template</span>
      </button> */}


                          {doc.status === "draft" && (
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setMergeDoc(doc);
                                setMergeOpen(true);
                              }}
                            >
                              <FaPlus className="dropdown-icon" />
                              <span>Add / Merge File</span>
                            </button>
                          )}

                          <button
                            className="dropdown-item"
                            onClick={() => navigate(`/user/document-summary/${doc.id}`)}
                          >
                            <SummarizeIcon className="dropdown-icon" />
                            <span>View Summary</span>
                          </button>



                        </div>
                      </div>

                    </td>


                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


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






      {mergeOpen && (
        <div className="zoho-merge-backdrop">
          <div className="zoho-merge-dialog">

            {/* Header */}
            <div className="zoho-merge-header">
              <h3>Add or merge file</h3>
              <button
                className="zoho-merge-close"
                onClick={() => {
                  setMergeOpen(false);
                  setFile(null);
                }}
              >
                ✕
              </button>
            </div>

            {/* Info */}
            <p className="zoho-merge-info">
              The selected file will be appended to
              <strong> {mergeDoc?.filename}</strong>
            </p>

            {/* Upload */}
            <label className="zoho-merge-upload">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg"
                onChange={(e) => setFile(e.target.files[0])}
              />

              <div className="zoho-upload-box">
                <span className="zoho-upload-title">
                  {file ? file.name : "Choose a file"}
                </span>
                <span className="zoho-upload-hint">
                  PDF, Word, JPG, PNG
                </span>
              </div>
            </label>

            {/* Progress */}
            {mergeLoading && (
              <div className="zoho-merge-progress-wrapper" style={{ marginTop: '1rem' }}>
                <span className="zoho-merge-msg" style={{ fontSize: '13px', color: '#666', marginBottom: '8px', display: 'block' }}>
                  {processingMsg || "Processing file..."}
                </span>
                <div className="zoho-merge-progress">
                  <div
                    className="zoho-merge-progress-bar"
                    style={{ width: `${mergeProgress}%`, transition: 'width 0.4s ease-out' }}
                  />
                </div>
              </div>
            )}


            {/* Actions */}
            <div className="zoho-merge-actions">
              <button
                className="zoho-btn-secondary"
                onClick={() => setMergeOpen(false)}
                disabled={mergeLoading}
              >
                Cancel
              </button>

              <button
                className="zoho-btn-primary"
                disabled={!file || mergeLoading}
                onClick={async () => {
                  if (!file) return;
                  try {
                    setMergeLoading(true);
                    setMergeProgress(0);
                    setProcessingMsg("Uploading file to server...");

                    // 1. Initial Upload (scaled to 0-50%)
                    const res = await addFileToDocument(
                      mergeDoc.id,
                      file,
                      (p) => {
                        setMergeProgress(p);
                        if (p >= 50) setProcessingMsg("Transfer complete! Processing merge...");
                      }
                    );

                    // 2. Poll for Status (50-100%)
                    let isDone = false;
                    let pollCount = 0;
                    while (!isDone && pollCount < 60) {
                      pollCount++;
                      await new Promise(r => setTimeout(r, 1000));
                      try {
                        const statusRes = await getDocumentStatus(mergeDoc.id);
                        const backendProgress = statusRes.progress || 0;
                        const backendMsg = statusRes.processing_status || "Merging...";

                        // Map backend 25-100 to 50-100
                        let mappedProgress = 50;
                        if (backendProgress > 25) {
                          mappedProgress = 50 + Math.round((backendProgress - 25) * (50 / 75));
                        }

                        setMergeProgress(Math.min(mappedProgress, 99));
                        setProcessingMsg(backendMsg);

                        if (statusRes.status !== "processing" || backendProgress >= 100) {
                          isDone = true;
                        }
                      } catch (e) {
                        console.warn("Merge status poll failed", e);
                      }
                    }

                    setMergeProgress(100);
                    setProcessingMsg("Complete");

                    setSnackbar({
                      open: true,
                      message: "File merged successfully",
                      severity: "success",
                    });

                    setMergeOpen(false);
                    setFile(null);
                    loadDocs();
                  } catch (err) {
                    setSnackbar({
                      open: true,
                      message: err.response?.data?.detail || "Merge failed",
                      severity: "error",
                    });
                  } finally {
                    setMergeLoading(false);
                    setMergeProgress(0);
                    setProcessingMsg("");
                  }
                }}
              >
                {mergeLoading ? "Merging…" : "Merge file"}
              </button>

            </div>
          </div>
        </div>
      )}


      {/* Success Dialog after Upload - JSX */}
      {showSuccessDialog && (
        <div className="ss-usd-backdrop">
          <div className="ss-usd-modal">

            <div className="ss-usd-head">
              <img
                src="/images/tick.gif"
                alt="Success"
                className="ss-usd-tick"
              />
              <div className="ss-usd-title">Upload Successful</div>
              <div className="ss-usd-subtitle">Your document is now ready for the next steps.</div>
            </div>

            <div className="ss-usd-body">
              <div className="ss-usd-info-card">
                <div className="ss-usd-row">
                  <span className="ss-usd-label">Document Name</span>
                  <span className="ss-usd-separator">:</span>
                  <span className="ss-usd-value" title={uploadedDocument?.filename}>
                    {uploadedDocument?.filename || 'Untitled'}
                  </span>
                </div>

                <div className="ss-usd-row">
                  <span className="ss-usd-label">File Type</span>
                  <span className="ss-usd-separator">:</span>
                  <span className="ss-usd-value">
                    {uploadedDocument?.mime_type
                      ? (uploadedDocument.mime_type.split('/').pop()?.toUpperCase() ||
                        uploadedDocument.filename?.split('.').pop()?.toUpperCase() ||
                        "FILE")
                      : uploadedDocument?.filename?.split('.').pop()?.toUpperCase() || "FILE"}
                  </span>
                </div>

                <div className="ss-usd-row">
                  <span className="ss-usd-label">File Size</span>
                  <span className="ss-usd-separator">:</span>
                  <span className="ss-usd-value">
                    {uploadedDocument?.size
                      ? uploadedDocument.size > 1024 * 1024
                        ? `${(uploadedDocument.size / 1024 / 1024).toFixed(2)} MB`
                        : `${Math.round(uploadedDocument.size / 1024)} KB`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="ss-usd-footer">
              <button
                className="ss-usd-btn ss-usd-btn-secondary"
                onClick={() => {
                  setShowSuccessDialog(false);
                  setUploadedDocument(null);
                }}
              >
                Close
              </button>

              <button
                className="ss-usd-btn ss-usd-btn-primary"
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
              >
                Continue
              </button>
            </div>

          </div>
        </div>
      )}

      {renameOpen && (
        <div className="rename-dialog-backdrop">
          <div className="rename-dialog">
            <h3>Rename Document</h3>

            <div className="rename-input-wrapper">
              <input
                type="text"
                value={newFilename}
                onChange={(e) =>
                  setNewFilename(
                    (e.target.value || "").replace(/\.pdf$/i, "")
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
              >
                {renaming ? "Renaming…" : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* <PremiumBannerSlider /> */}



      <Dialog
        open={voidDialogOpen}
        onClose={() => !voiding && setVoidDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Void Document?
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            This will immediately stop all signing activity for:
          </Typography>

          <Typography sx={{ mt: 1, fontWeight: 500 }}>
            {docToVoid?.filename}
          </Typography>

          <Typography
            variant="body2"
            sx={{ mt: 2, color: "error.main" }}
          >
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setVoidDialogOpen(false)}
            disabled={voiding}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
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
          >
            {voiding ? "Voiding…" : "Void Document"}
          </Button>
        </DialogActions>
      </Dialog>


      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Move to Trash?
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            This document will be moved to Trash:
          </Typography>

          <Typography sx={{ mt: 1, fontWeight: 500 }}>
            {docToDelete?.filename}
          </Typography>

          <Typography variant="body2" sx={{ mt: 2 }}>
            You can restore it later from Trash.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
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
          >
            {deleting ? "Deleting…" : "Move to Trash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={permanentDeleteOpen}
        onClose={() => !permanentDeleting && setPermanentDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>
          Permanently delete document?
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            You are about to permanently delete:
          </Typography>

          <Typography sx={{ mt: 1, fontWeight: 600 }}>
            {docToPermanentDelete?.filename}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              color: "error.main",
              fontWeight: 500,
            }}
          >
            This action is irreversible.
            <br />
            The document, audit logs, and signing history will be permanently removed.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setPermanentDeleteOpen(false)}
            disabled={permanentDeleting}
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
          >
            {permanentDeleting ? "Deleting…" : "Delete Permanently"}
          </Button>
        </DialogActions>
      </Dialog>



    </div>





  );
}