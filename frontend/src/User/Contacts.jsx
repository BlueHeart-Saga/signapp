import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Divider,
  Chip,
  Tooltip,
  Paper
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import showAlert from "../utils/swal";

import {
  Star,
  StarBorder,
  Delete,
  Edit,
  Search,
  Person,
  Email,
  Clear,
  Add,
  Contacts as ContactsIcon,
  CheckCircle,
  PersonAdd
} from "@mui/icons-material";

import { contactsAPI } from "../services/contactsAPI";

const Contacts = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'favorites'

  const [openDialog, setOpenDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    favorite: false
  });

  const [formErrors, setFormErrors] = useState({
    name: "",
    email: ""
  });

  const searchContainerRef = useRef(null);

  useEffect(() => {
    loadContacts();
  }, []);

  // Close search suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const res = await contactsAPI.getContacts();
      setContacts(res || []);
    } catch (err) {
      console.error("Failed to load contacts:", err);
      showAlert.error("Error", "Could not load contacts. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate recipient avatar initials
  const getInitials = (name = "") => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Avatar gradient generator from name
  const getAvatarGradient = (name = "") => {
    const gradients = [
      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      "linear-gradient(135deg, #059669 0%, #047857 100%)",
      "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
      "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
      "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
      "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // Realtime debounced backend search to ensure contacts newly created elsewhere are also found
  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await contactsAPI.searchContacts(search.trim());
        if (res && res.length > 0) {
          setContacts(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const toAdd = res.filter(item => !existingIds.has(item.id));
            if (toAdd.length > 0) {
              return [...prev, ...toAdd];
            }
            return prev;
          });
        }
      } catch (err) {
        // silent catch
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter contacts based on search query and active tab
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        c =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
      // When searching on favorites tab, prioritize starred contacts to the top
      // but keep all matching contacts visible so the user's search is never hidden
      if (activeTab === "favorites") {
        result.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
      }
    } else {
      if (activeTab === "favorites") {
        result = result.filter(c => c.favorite);
      }
    }

    return result;
  }, [contacts, search, activeTab]);

  // Suggestions for the dropdown anchored directly below search input
  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return contacts.filter(
      c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [contacts, search]);

  const handleSelectSuggestion = (contact) => {
    setSearch(contact.name);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearch("");
    setShowSuggestions(false);
  };

  const handleSearchBtnClick = async () => {
    setShowSuggestions(false);
    if (!search.trim()) {
      return loadContacts();
    }
    try {
      setLoading(true);
      const res = await contactsAPI.searchContacts(search.trim());
      if (res && res.length > 0) {
        // Merge or prioritize search results
        const existingIds = new Set(contacts.map(c => c.id));
        const newContacts = [...contacts];
        res.forEach(item => {
          if (!existingIds.has(item.id)) {
            newContacts.push(item);
          }
        });
        setContacts(newContacts);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingContact(null);
    setForm({ name: "", email: "", favorite: false });
    setFormErrors({ name: "", email: "" });
    setOpenDialog(true);
  };

  const handleOpenCreateWithPrefill = (prefillValue) => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(prefillValue.trim());
    setEditingContact(null);
    setForm({
      name: isEmail ? "" : prefillValue.trim(),
      email: isEmail ? prefillValue.trim() : "",
      favorite: false
    });
    setFormErrors({ name: "", email: "" });
    setOpenDialog(true);
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      email: contact.email,
      favorite: contact.favorite || false
    });
    setFormErrors({ name: "", email: "" });
    setOpenDialog(true);
  };

  // Real-time input handlers with instant validation feedback
  const handleNameChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, name: val }));
    const trimmed = val.trim();
    if (!trimmed) {
      setFormErrors(prev => ({ ...prev, name: "" }));
      return;
    }
    const isDup = contacts.some(
      c =>
        c.name &&
        c.name.trim().toLowerCase() === trimmed.toLowerCase() &&
        String(c.id) !== String(editingContact?.id)
    );
    if (isDup) {
      setFormErrors(prev => ({ ...prev, name: "This name already exists" }));
    } else {
      setFormErrors(prev => ({ ...prev, name: "" }));
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, email: val }));
    const trimmed = val.trim();
    if (!trimmed) {
      setFormErrors(prev => ({ ...prev, email: "" }));
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setFormErrors(prev => ({ ...prev, email: "Please enter valid email" }));
      return;
    }
    const isDup = contacts.some(
      c =>
        c.email &&
        c.email.trim().toLowerCase() === trimmed.toLowerCase() &&
        String(c.id) !== String(editingContact?.id)
    );
    if (isDup) {
      setFormErrors(prev => ({ ...prev, email: "This email already exists" }));
    } else {
      setFormErrors(prev => ({ ...prev, email: "" }));
    }
  };

  // Validation function with SweetAlert notifications
  const handleSave = async () => {
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    // 1. Validate empty name
    if (!trimmedName) {
      setFormErrors(prev => ({ ...prev, name: "Name is required" }));
      showAlert.error("Validation Error", "Please enter recipient name");
      return;
    }

    // 2. Validate empty email
    if (!trimmedEmail) {
      setFormErrors(prev => ({ ...prev, email: "Email is required" }));
      showAlert.error("Validation Error", "Please enter valid email");
      return;
    }

    // 3. Validate valid email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormErrors(prev => ({ ...prev, email: "Please enter valid email" }));
      showAlert.error("Validation Error", "Please enter valid email");
      return;
    }

    // 4. Validate duplicate name (case-insensitive, excluding currently edited contact)
    const isDuplicateName = contacts.some(
      c =>
        c.name &&
        c.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        String(c.id) !== String(editingContact?.id)
    );
    if (isDuplicateName) {
      setFormErrors(prev => ({ ...prev, name: "This name already exists" }));
      showAlert.error("Validation Error", "This name already exists");
      return;
    }

    // 5. Validate duplicate email (case-insensitive, excluding currently edited contact)
    const isDuplicateEmail = contacts.some(
      c =>
        c.email &&
        c.email.trim().toLowerCase() === trimmedEmail.toLowerCase() &&
        String(c.id) !== String(editingContact?.id)
    );
    if (isDuplicateEmail) {
      setFormErrors(prev => ({ ...prev, email: "This email already exists" }));
      showAlert.error("Validation Error", "This email already exists");
      return;
    }

    // All client-side validations passed -> proceed to API
    try {
      setSaving(true);
      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        favorite: Boolean(form.favorite)
      };

      if (editingContact) {
        await contactsAPI.updateContact(editingContact.id, payload);
        showAlert.success("Success!", "Contact updated successfully");
      } else {
        await contactsAPI.createContact(payload);
        showAlert.success("Success!", "Contact added successfully");
      }

      setOpenDialog(false);
      setFormErrors({ name: "", email: "" });
      loadContacts();
    } catch (err) {
      console.error("Save contact error:", err);
      const errMsg = showAlert.extractMessage(err, "Failed to save contact");
      const lower = errMsg.toLowerCase();

      if (lower.includes("name already exists")) {
        setFormErrors(prev => ({ ...prev, name: "This name already exists" }));
        showAlert.error("Validation Error", "This name already exists");
      } else if (lower.includes("email already exists")) {
        setFormErrors(prev => ({ ...prev, email: "This email already exists" }));
        showAlert.error("Validation Error", "This email already exists");
      } else if (lower.includes("valid email") || lower.includes("email address") || lower.includes("value is not a valid email")) {
        setFormErrors(prev => ({ ...prev, email: "Please enter valid email" }));
        showAlert.error("Validation Error", "Please enter valid email");
      } else {
        showAlert.error("Validation Error", errMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact) => {
    const confirmRes = await showAlert.confirm(
      "Delete Contact?",
      `Are you sure you want to delete "${contact.name}" (${contact.email})?`,
      "Yes, Delete",
      "Cancel"
    );

    if (!confirmRes.isConfirmed) return;

    try {
      await contactsAPI.deleteContact(contact.id);
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      showAlert.toast("success", "Contact deleted successfully");
    } catch (err) {
      showAlert.error("Delete Failed", showAlert.extractMessage(err, "Failed to delete contact"));
    }
  };

  const toggleFavorite = async (contact) => {
    try {
      const res = await contactsAPI.toggleFavorite(contact.id);
      setContacts(prev =>
        prev.map(c => (c.id === contact.id ? { ...c, favorite: res.favorite } : c))
      );
    } catch (err) {
      showAlert.error("Error", "Could not update favorite status");
    }
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const favoritesCount = contacts.filter(c => c.favorite).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={3.5} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 4px 10px rgba(37,99,235,0.25)"
              }}
            >
              <ContactsIcon fontSize="small" />
            </Box>
            <Typography variant="h4" fontWeight="700" color="#0f172a">
              Contacts
            </Typography>
          </Box>
          <Typography variant="body2" color="#64748b">
            Manage saved recipients and frequently used email addresses for quick document dispatch
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreate}
          sx={{
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2.5,
            px: 2.5,
            py: 1,
            boxShadow: "0 4px 12px rgba(37,99,235,0.28)",
            "&:hover": {
              background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
            }
          }}
        >
          Add Contact
        </Button>
      </Box>

      {/* Tabs & Quick Filters */}
      <Box display="flex" gap={1} mb={2.5}>
        <Chip
          label={`All Contacts (${contacts.length})`}
          onClick={() => setActiveTab("all")}
          variant={activeTab === "all" ? "filled" : "outlined"}
          sx={{
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor: activeTab === "all" ? "#2563eb" : "#ffffff",
            color: activeTab === "all" ? "#ffffff" : "#475569",
            borderColor: activeTab === "all" ? "#2563eb" : "#cbd5e1",
            "&:hover": {
              backgroundColor: activeTab === "all" ? "#1d4ed8" : "#f1f5f9"
            }
          }}
        />
        <Chip
          icon={<Star sx={{ fontSize: 16, color: activeTab === "favorites" ? "#fff !important" : "#f59e0b !important" }} />}
          label={`Favorites (${favoritesCount})`}
          onClick={() => setActiveTab("favorites")}
          variant={activeTab === "favorites" ? "filled" : "outlined"}
          sx={{
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor: activeTab === "favorites" ? "#f59e0b" : "#ffffff",
            color: activeTab === "favorites" ? "#ffffff" : "#475569",
            borderColor: activeTab === "favorites" ? "#f59e0b" : "#cbd5e1",
            "&:hover": {
              backgroundColor: activeTab === "favorites" ? "#d97706" : "#f1f5f9"
            }
          }}
        />
      </Box>

      {/* Toolbar & Search Bar with Autocomplete Dropdown */}
      <Box
        sx={{
          background: "#ffffff",
          p: 2,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          mb: 3
        }}
      >
        <Box display="flex" gap={1.5} alignItems="center">
          {/* Relative container for search input and dropdown */}
          <Box ref={searchContainerRef} sx={{ position: "relative", flex: 1 }}>
            <TextField
              fullWidth
              size="medium"
              placeholder="Search contacts by recipient name or email address..."
              value={search}
              autoComplete="off"
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (search.trim()) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchBtnClick();
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#64748b" }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch} edge="end" title="Clear search">
                      <Clear fontSize="small" sx={{ color: "#94a3b8" }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  backgroundColor: "#f8fafc",
                  "&:hover fieldset": {
                    borderColor: "#94a3b8",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "#ffffff",
                    "& fieldset": {
                      borderColor: "#2563eb",
                    }
                  }
                }
              }}
            />

            {/* Dropdown Suggestions Directly Anchored Below Search Bar */}
            {showSuggestions && search.trim().length > 0 && (
              <Paper
                elevation={8}
                sx={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  zIndex: 1300,
                  borderRadius: 2.5,
                  border: "1px solid #cbd5e1",
                  maxHeight: "360px",
                  overflowY: "auto",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12), 0 4px 10px rgba(15, 23, 42, 0.06)",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <Typography variant="caption" fontWeight="700" color="#475569" textTransform="uppercase" letterSpacing={0.5}>
                    Matching Recipients ({searchSuggestions.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click recipient to select
                  </Typography>
                </Box>

                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map((item) => {
                    const isEmailMatch = item.email && item.email.toLowerCase().includes(search.trim().toLowerCase());
                    const isNameMatch = item.name && item.name.toLowerCase().includes(search.trim().toLowerCase());

                    return (
                      <Box
                        key={item.id}
                        onClick={() => handleSelectSuggestion(item)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          px: 2,
                          py: 1.5,
                          gap: 1.5,
                          cursor: "pointer",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            backgroundColor: "#f0f7ff",
                          },
                          "&:last-child": {
                            borderBottom: "none",
                          }
                        }}
                      >
                        {/* Avatar */}
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: getAvatarGradient(item.name),
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            flexShrink: 0,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.12)"
                          }}
                        >
                          {getInitials(item.name)}
                        </Box>

                        {/* Recipient Name and Email */}
                        <Box flex={1} minWidth={0}>
                          <Box display="flex" alignItems="center" gap={0.75}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="700"
                              color="#0f172a"
                              noWrap
                              sx={{ fontSize: "0.95rem" }}
                            >
                              {item.name}
                            </Typography>
                            {item.favorite && (
                              <Star sx={{ fontSize: 16, color: "#f59e0b" }} />
                            )}
                          </Box>

                          <Typography
                            variant="body2"
                            color="#64748b"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              fontSize: "0.82rem"
                            }}
                            noWrap
                          >
                            <Email sx={{ fontSize: 13, color: "#94a3b8" }} />
                            {item.email}
                          </Typography>
                        </Box>

                        {/* Match Indicator Tag */}
                        <Chip
                          size="small"
                          label={isEmailMatch && !isNameMatch ? "Email Match" : isNameMatch ? "Name Match" : "Match"}
                          sx={{
                            fontSize: "0.72rem",
                            height: 22,
                            fontWeight: 600,
                            backgroundColor: isEmailMatch && !isNameMatch ? "#eff6ff" : "#ecfdf5",
                            color: isEmailMatch && !isNameMatch ? "#1d4ed8" : "#047857",
                            border: "1px solid",
                            borderColor: isEmailMatch && !isNameMatch ? "#bfdbfe" : "#a7f3d0"
                          }}
                        />
                      </Box>
                    );
                  })
                ) : (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body2" color="#64748b" mb={1.5}>
                      No saved recipient matches "<strong>{search}</strong>"
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PersonAdd />}
                      onClick={() => {
                        setShowSuggestions(false);
                        handleOpenCreateWithPrefill(search);
                      }}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        fontWeight: 600
                      }}
                    >
                      Add "{search}" as New Contact
                    </Button>
                  </Box>
                )}
              </Paper>
            )}
          </Box>

          <Button
            variant="outlined"
            onClick={handleSearchBtnClick}
            sx={{
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
              py: 1.2,
              borderColor: "#cbd5e1",
              color: "#334155",
              "&:hover": {
                borderColor: "#94a3b8",
                backgroundColor: "#f8fafc"
              }
            }}
          >
            Search
          </Button>
        </Box>

        {/* Matched Recipient(s) Display Directly Below Search Bar */}
        {search.trim().length > 0 && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: "1px solid #e2e8f0"
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="caption" fontWeight="700" color="#1e293b" textTransform="uppercase" letterSpacing={0.5}>
                  Matched Recipient{filteredContacts.length === 1 ? "" : "s"} ({filteredContacts.length})
                </Typography>
                <Chip
                  size="small"
                  label={`Searching: "${search}"`}
                  sx={{ height: 22, fontSize: "0.74rem", backgroundColor: "#f1f5f9", fontWeight: 600, color: "#475569" }}
                />
              </Box>
              <Button
                size="small"
                onClick={handleClearSearch}
                sx={{ textTransform: "none", fontSize: "0.82rem", color: "#64748b", py: 0.2 }}
              >
                Clear filter
              </Button>
            </Box>

            {filteredContacts.length > 0 ? (
              <Box display="flex" flexWrap="wrap" gap={1.25} pt={0.5}>
                {filteredContacts.map(c => {
                  const isEmailMatch = c.email && c.email.toLowerCase().includes(search.trim().toLowerCase());
                  const isNameMatch = c.name && c.name.toLowerCase().includes(search.trim().toLowerCase());

                  return (
                    <Box
                      key={c.id}
                      onClick={() => {
                        setSearch(c.name);
                        setShowSuggestions(false);
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        px: 2,
                        py: 1,
                        borderRadius: 2.5,
                        backgroundColor: "#f8fafc",
                        border: "1.5px solid #cbd5e1",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          backgroundColor: "#eff6ff",
                          borderColor: "#3b82f6",
                          transform: "translateY(-1px)",
                          boxShadow: "0 4px 12px rgba(37,99,235,0.12)"
                        }
                      }}
                    >
                      {/* Avatar */}
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: getAvatarGradient(c.name),
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {getInitials(c.name)}
                      </Box>

                      {/* Recipient Identity Details */}
                      <Box>
                        <Box display="flex" alignItems="center" gap={0.75}>
                          <Typography variant="body2" fontWeight="700" color="#0f172a" sx={{ fontSize: "0.95rem" }}>
                            {c.name}
                          </Typography>
                          {c.favorite && (
                            <Star sx={{ fontSize: 15, color: "#f59e0b" }} />
                          )}
                          <Chip
                            size="small"
                            label={isEmailMatch && !isNameMatch ? "Email Match" : isNameMatch ? "Name Match" : "Match"}
                            sx={{
                              height: 18,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              backgroundColor: isEmailMatch && !isNameMatch ? "#eff6ff" : "#f0fdf4",
                              color: isEmailMatch && !isNameMatch ? "#1d4ed8" : "#166534"
                            }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          color="#64748b"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.8rem", mt: 0.2 }}
                        >
                          <Email sx={{ fontSize: 13, color: "#94a3b8" }} />
                          {c.email}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2,
                  mt: 0.5,
                  borderRadius: 2.5,
                  backgroundColor: "#fff",
                  border: "1px dashed #cbd5e1"
                }}
              >
                <Typography variant="body2" color="#64748b">
                  No saved recipient found matching "<strong>{search}</strong>"
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  onClick={() => handleOpenCreateWithPrefill(search)}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.82rem", borderRadius: 2 }}
                >
                  Add as New Contact
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Empty States */}
      {filteredContacts.length === 0 && (
        <Card
          sx={{
            borderRadius: 3,
            textAlign: "center",
            py: 7,
            px: 3,
            border: "1px dashed #cbd5e1",
            backgroundColor: "#f8fafc"
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              backgroundColor: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              color: "#64748b"
            }}
          >
            <Search fontSize="medium" />
          </Box>
          <Typography variant="h6" fontWeight="700" color="#1e293b" mb={0.5}>
            {search.trim() ? "No matching contacts found" : activeTab === "favorites" ? "No favorite contacts yet" : "No contacts found"}
          </Typography>
          <Typography variant="body2" color="#64748b" sx={{ maxWidth: 460, mx: "auto", mb: 2.5 }}>
            {search.trim()
              ? `We couldn't find any contact with name or email matching "${search}". You can add this recipient now or clear your search.`
              : activeTab === "favorites"
              ? "Star your frequently contacted recipients to access them quickly here."
              : "Add contacts to quickly auto-populate recipient names and emails when preparing documents."}
          </Typography>
          <Box display="flex" gap={1.5} justifyContent="center">
            {search.trim() && (
              <Button
                variant="outlined"
                onClick={handleClearSearch}
                sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
              >
                Clear Search
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => {
                if (search.trim()) {
                  handleOpenCreateWithPrefill(search);
                } else {
                  handleOpenCreate();
                }
              }}
              sx={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 600
              }}
            >
              {search.trim() ? `Add "${search}" as Contact` : "Add First Contact"}
            </Button>
          </Box>
        </Card>
      )}

      {/* Contact List */}
      <Box display="flex" flexDirection="column" gap={1.75}>
        {filteredContacts.map((contact) => {
          const isEmailMatch = search.trim() && contact.email.toLowerCase().includes(search.trim().toLowerCase());
          const isNameMatch = search.trim() && contact.name.toLowerCase().includes(search.trim().toLowerCase());

          return (
            <Card
              key={contact.id}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
                  borderColor: "#cbd5e1",
                  transform: "translateY(-1px)"
                }
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: "18px 20px !important"
                }}
              >
                {/* Avatar Initial Circle */}
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: getAvatarGradient(contact.name),
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
                  }}
                >
                  {getInitials(contact.name)}
                </Box>

                {/* Identity & Recipient Details */}
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography
                      variant="h6"
                      fontWeight="700"
                      color="#0f172a"
                      sx={{ fontSize: "1.05rem", lineHeight: 1.3 }}
                    >
                      {contact.name}
                    </Typography>

                    {contact.favorite && (
                      <Chip
                        size="small"
                        icon={<Star sx={{ fontSize: "14px !important", color: "#f59e0b !important" }} />}
                        label="Favorite"
                        sx={{
                          height: 22,
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fde68a"
                        }}
                      />
                    )}

                    {/* Show indicator if email matched search query */}
                    {isEmailMatch && !isNameMatch && (
                      <Chip
                        size="small"
                        label="Matched by Email"
                        sx={{
                          height: 22,
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe"
                        }}
                      />
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    color="#64748b"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      mt: 0.5,
                      fontSize: "0.875rem"
                    }}
                  >
                    <Email sx={{ fontSize: 16, color: "#94a3b8" }} />
                    <span>{contact.email}</span>
                  </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

                {/* Actions */}
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Tooltip title={contact.favorite ? "Remove from favorites" : "Mark as favorite"}>
                    <IconButton
                      onClick={() => toggleFavorite(contact)}
                      size="small"
                      sx={{
                        p: 1,
                        "&:hover": { backgroundColor: "#fef3c7" }
                      }}
                    >
                      {contact.favorite ? (
                        <Star sx={{ color: "#f59e0b", fontSize: 22 }} />
                      ) : (
                        <StarBorder sx={{ color: "#94a3b8", fontSize: 22 }} />
                      )}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Edit contact">
                    <IconButton
                      onClick={() => handleEdit(contact)}
                      size="small"
                      sx={{
                        p: 1,
                        color: "#475569",
                        "&:hover": { backgroundColor: "#f1f5f9", color: "#2563eb" }
                      }}
                    >
                      <Edit sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete contact">
                    <IconButton
                      onClick={() => handleDelete(contact)}
                      size="small"
                      sx={{
                        p: 1,
                        color: "#94a3b8",
                        "&:hover": { backgroundColor: "#fee2e2", color: "#dc2626" }
                      }}
                    >
                      <Delete sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Add / Edit Contact Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => !saving && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 1,
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)"
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.25}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {editingContact ? <Edit fontSize="small" /> : <PersonAdd fontSize="small" />}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="700" color="#0f172a">
                {editingContact ? "Edit Contact" : "Add New Contact"}
              </Typography>
              <Typography variant="caption" color="#64748b">
                {editingContact ? "Update recipient details and preferences" : "Save recipient details for quick auto-fill when sending documents"}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: "#f1f5f9", py: 2.5 }}>
          {/* Recipient Name Field */}
          <Box mb={2.5}>
            <Typography variant="caption" fontWeight="600" color="#334155" mb={0.75} display="block">
              Recipient Name *
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g., John Doe"
              value={form.name}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name}
              onChange={handleNameChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person fontSize="small" sx={{ color: formErrors.name ? "#ef4444" : "#64748b" }} />
                  </InputAdornment>
                )
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                }
              }}
            />
          </Box>

          {/* Email Address Field */}
          <Box mb={2}>
            <Typography variant="caption" fontWeight="600" color="#334155" mb={0.75} display="block">
              Email Address *
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g., recipient@example.com"
              type="email"
              value={form.email}
              error={Boolean(formErrors.email)}
              helperText={formErrors.email}
              onChange={handleEmailChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email fontSize="small" sx={{ color: formErrors.email ? "#ef4444" : "#64748b" }} />
                  </InputAdornment>
                )
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                }
              }}
            />
          </Box>

          {/* Favorite Checkbox */}
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              borderRadius: 2.5,
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.favorite}
                  onChange={(e) =>
                    setForm({ ...form, favorite: e.target.checked })
                  }
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="600" color="#1e293b">
                    Mark as favorite recipient
                  </Typography>
                  <Typography variant="caption" color="#64748b">
                    Favorite contacts appear at the top and in quick-select lists
                  </Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#64748b",
              borderRadius: 2
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              boxShadow: "0 4px 10px rgba(37,99,235,0.25)"
            }}
          >
            {saving ? "Saving..." : editingContact ? "Save Changes" : "Add Contact"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Contacts;

