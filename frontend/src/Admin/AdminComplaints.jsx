import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Drawer,
  Divider,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  Delete,
  CheckCircle,
  Cancel,
  Search,
} from "@mui/icons-material";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const statusColor = {
  open: "warning",
  investigating: "info",
  resolved: "success",
  rejected: "error",
};

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const fetchComplaints = React.useCallback(async () => {
    setLoading(true);
    const res = await axios.get(`${API_BASE_URL}/e-sign/complaints/admin`, {
      params: { status },
    });
    setComplaints(res.data.items);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const openDrawer = (complaint) => {
    setSelected(complaint);
    setAdminNote(complaint.admin_note || "");
    setDrawerOpen(true);
  };

  const updateStatus = async (newStatus) => {
    await axios.put(`${API_BASE_URL}/${selected.id}/status`, {
      status: newStatus,
    });
    fetchComplaints();
    setDrawerOpen(false);
  };

  const saveNote = async () => {
    await axios.put(`${API_BASE_URL}/${selected.id}/note`, null, {
      params: { note: adminNote },
    });
    fetchComplaints();
  };

  const deleteComplaint = async (id) => {
    if (!window.confirm("Delete this complaint permanently?")) return;
    await axios.delete(`${API_BASE_URL}/${id}`);
    fetchComplaints();
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Abuse & Complaint Management
      </Typography>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <Search />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            size="small"
            displayEmpty
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="investigating">Investigating</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </Box>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <Box p={4} textAlign="center">
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {complaints.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.complaint_type}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.status}
                      color={statusColor[c.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(c.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openDrawer(c)}>
                      <Visibility />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => deleteComplaint(c.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selected && (
          <Box width={420} p={3}>
            <Typography variant="h6" fontWeight={600}>
              Complaint Details
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption">Name</Typography>
            <Typography mb={1}>{selected.name}</Typography>

            <Typography variant="caption">Email</Typography>
            <Typography mb={1}>{selected.email}</Typography>

            <Typography variant="caption">Complaint Type</Typography>
            <Typography mb={1}>{selected.complaint_type}</Typography>

            <Typography variant="caption">Message</Typography>
            <Typography mb={2}>{selected.message}</Typography>

            <TextField
              label="Admin Note"
              multiline
              rows={3}
              fullWidth
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />

            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 1 }}
              onClick={saveNote}
            >
              Save Note
            </Button>

            <Divider sx={{ my: 2 }} />

            <Typography fontWeight={600}>Update Status</Typography>

            <Box display="flex" gap={1} mt={1}>
              <Button
                startIcon={<Search />}
                onClick={() => updateStatus("investigating")}
              >
                Investigate
              </Button>
              <Button
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => updateStatus("resolved")}
              >
                Resolve
              </Button>
              <Button
                color="error"
                startIcon={<Cancel />}
                onClick={() => updateStatus("rejected")}
              >
                Reject
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
