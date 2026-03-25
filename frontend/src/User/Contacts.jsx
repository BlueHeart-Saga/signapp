import React, { useEffect, useState } from "react";
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
  Divider
} from "@mui/material";

import {
  Star,
  StarBorder,
  Delete,
  Edit,
  Search,
  Person,
  Email
} from "@mui/icons-material";

import { contactsAPI } from "../services/contactsAPI";

const Contacts = () => {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    favorite: false
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const res = await contactsAPI.getContacts();
      setContacts(res || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return loadContacts();
    const res = await contactsAPI.searchContacts(search);
    setContacts(res || []);
  };

  const handleOpenCreate = () => {
    setEditingContact(null);
    setForm({ name: "", email: "", favorite: false });
    setOpenDialog(true);
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setForm(contact);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;

    if (editingContact) {
      await contactsAPI.updateContact(editingContact.id, form);
    } else {
      await contactsAPI.createContact(form);
    }

    setOpenDialog(false);
    loadContacts();
  };

  const handleDelete = async (id) => {
    await contactsAPI.deleteContact(id);
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const toggleFavorite = async (contact) => {
    const res = await contactsAPI.toggleFavorite(contact.id);
    setContacts(prev =>
      prev.map(c => (c.id === contact.id ? { ...c, favorite: res.favorite } : c))
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="700">
          Contacts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage saved recipients and frequently used email addresses
        </Typography>
      </Box>

      {/* Toolbar */}
      <Box
        display="flex"
        gap={2}
        mb={4}
        sx={{
          background: "#f8fafc",
          p: 2,
          borderRadius: 3,
          border: "1px solid #e2e8f0"
        }}
      >
        <TextField
          fullWidth
          placeholder="Search contacts by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            )
          }}
        />

        <Button variant="outlined" onClick={handleSearch}>
          Search
        </Button>

        <Button variant="contained" onClick={handleOpenCreate}>
          Add Contact
        </Button>
      </Box>

      {/* Empty State */}
      {contacts.length === 0 && (
        <Card sx={{ borderRadius: 3, textAlign: "center", py: 6 }}>
          <Typography fontWeight="600">No contacts found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Add contacts to quickly assign recipients when sending documents
          </Typography>
        </Card>
      )}

      {/* Contact List */}
      <Box display="flex" flexDirection="column" gap={2}>
        {contacts.map(contact => (
          <Card
            key={contact.id}
            sx={{
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              transition: "0.2s",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
              }
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2
              }}
            >
              {/* Identity */}
              <Box flex={1}>
                <Typography fontWeight="600">
                  {contact.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <Email fontSize="inherit" />
                  {contact.email}
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem />

              {/* Actions */}
              <Box display="flex">
                <IconButton onClick={() => toggleFavorite(contact)}>
                  {contact.favorite ? (
                    <Star color="warning" />
                  ) : (
                    <StarBorder />
                  )}
                </IconButton>

                <IconButton onClick={() => handleEdit(contact)}>
                  <Edit />
                </IconButton>

                <IconButton onClick={() => handleDelete(contact.id)}>
                  <Delete />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>
          {editingContact ? "Edit Contact" : "Add Contact"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            margin="dense"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="Email"
            margin="dense"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.favorite}
                onChange={(e) =>
                  setForm({ ...form, favorite: e.target.checked })
                }
              />
            }
            label="Mark as favorite"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Contacts;
