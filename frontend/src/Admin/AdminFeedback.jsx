import React, { useEffect, useState, useCallback } from "react";
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
  Tabs,
  Tab,
  Paper,
  Tooltip
} from "@mui/material";
import {
  Eye,
  Trash2,
  Search,
  Mail,
  Send,
  RefreshCw,
  Clock,
  CheckCircle2,
  Inbox,
  Archive,
  MessageSquare
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const statusConfig = {
  new: { label: "New", color: "error", bg: "#fef2f2" },
  in_progress: { label: "In Progress", color: "warning", bg: "#fffbe6" },
  replied: { label: "Replied", color: "success", bg: "#f0fdf4" },
  archived: { label: "Archived", color: "default", bg: "#f1f5f9" },
};

export default function AdminFeedback() {
  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [statusCounts, setStatusCounts] = useState({ all: 0, new: 0, in_progress: 0, replied: 0, archived: 0 });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/e-sign/contact/admin`, {
        params: { status: statusFilter, page, page_size: 15 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(res.data.items || []);
      setTotalItems(res.data.total || 0);
      if (res.data.counts) setStatusCounts(res.data.counts);
    } catch (err) {
      console.error("Failed loading contact submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const openDrawer = (item) => {
    setSelectedItem(item);
    setReplyMessage("");
    setDrawerOpen(true);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedItem) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/e-sign/contact/admin/${selectedItem.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedItem(prev => ({ ...prev, status: newStatus }));
      fetchSubmissions();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedItem) return;
    setSendingReply(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/e-sign/contact/admin/${selectedItem.id}/reply`,
        { reply_message: replyMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Reply email sent successfully to " + selectedItem.email);
      setReplyMessage("");
      setSelectedItem(prev => ({
        ...prev,
        status: "replied",
        admin_reply: replyMessage.trim(),
        replied_at: new Date().toISOString()
      }));
      fetchSubmissions();
    } catch (err) {
      console.error("Reply error:", err);
      alert("❌ Failed to send email reply. " + (err.response?.data?.detail || err.message));
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete this submission permanently?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/e-sign/contact/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (selectedItem?.id === id) setDrawerOpen(false);
      fetchSubmissions();
    } catch (err) {
      alert("Failed to delete submission");
    }
  };

  return (
    <Box p={3} sx={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0f766e" gutterBottom>
            Feedback & Inquiry Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage, review, and reply to pre-login contact inquiries and user feedback via SMTP.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={16} />}
          onClick={fetchSubmissions}
          sx={{ borderColor: '#0f766e', color: '#0f766e', borderRadius: 2 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap={2} mb={3}>
        <Paper sx={{ p: 2, borderRadius: 3, borderLeft: "4px solid #3b82f6" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL INQUIRIES</Typography>
          <Typography variant="h4" fontWeight={700} color="#1e293b">{statusCounts.all}</Typography>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3, borderLeft: "4px solid #ef4444" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>NEW / UNREAD</Typography>
          <Typography variant="h4" fontWeight={700} color="#ef4444">{statusCounts.new}</Typography>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3, borderLeft: "4px solid #f59e0b" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>IN PROGRESS</Typography>
          <Typography variant="h4" fontWeight={700} color="#f59e0b">{statusCounts.in_progress}</Typography>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3, borderLeft: "4px solid #10b981" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>REPLIED VIA SMTP</Typography>
          <Typography variant="h4" fontWeight={700} color="#10b981">{statusCounts.replied}</Typography>
        </Paper>
      </Box>

      {/* Tabs Filter */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs
          value={statusFilter}
          onChange={(e, val) => { setStatusFilter(val); setPage(1); }}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            px: 2,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "14px" },
            "& .Mui-selected": { color: "#0f766e" },
            "& .MuiTabs-indicator": { backgroundColor: "#0f766e" }
          }}
        >
          <Tab label={`All (${statusCounts.all})`} value="all" />
          <Tab label={`New (${statusCounts.new})`} value="new" />
          <Tab label={`In Progress (${statusCounts.in_progress})`} value="in_progress" />
          <Tab label={`Replied (${statusCounts.replied})`} value="replied" />
          <Tab label={`Archived (${statusCounts.archived})`} value="archived" />
        </Tabs>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <Box p={6} textAlign="center">
            <CircularProgress size={36} sx={{ color: "#0f766e" }} />
          </Box>
        ) : submissions.length === 0 ? (
          <Box p={6} textAlign="center">
            <Inbox size={48} color="#94a3b8" />
            <Typography variant="h6" color="text.secondary" mt={2}>
              No inquiries found in this view
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Submitter</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {submissions.map((item) => {
                const conf = statusConfig[item.status] || statusConfig.new;
                return (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => openDrawer(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: "#0f766e" }}>
                      {item.name}
                    </TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.subject}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={conf.label}
                        color={conf.color}
                        size="small"
                        sx={{ fontWeight: 600, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "13px" }}>
                      {new Date(item.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View & Reply">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); openDrawer(item); }}
                          sx={{ color: "#0f766e" }}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDelete(item.id, e)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
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
        {selectedItem && (
          <Box width={460} p={3.5} display="flex" flexDirection="column" height="100%">
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700} color="#0f766e">
                Inquiry Details
              </Typography>
              <Chip
                label={statusConfig[selectedItem.status]?.label || selectedItem.status}
                color={statusConfig[selectedItem.status]?.color || "default"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Content Details */}
            <Box flex={1} overflow="auto">
              <Typography variant="caption" color="text.secondary">NAME</Typography>
              <Typography fontWeight={600} mb={1.5}>{selectedItem.name}</Typography>

              <Typography variant="caption" color="text.secondary">EMAIL ADDRESS</Typography>
              <Typography fontWeight={600} color="#0f766e" mb={1.5}>
                <a href={`mailto:${selectedItem.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {selectedItem.email}
                </a>
              </Typography>

              <Typography variant="caption" color="text.secondary">SUBJECT</Typography>
              <Typography fontWeight={600} mb={1.5}>{selectedItem.subject}</Typography>

              <Typography variant="caption" color="text.secondary">MESSAGE</Typography>
              <Paper sx={{ p: 2, bg: "#f8fafc", borderRadius: 2, mb: 2, border: "1px solid #e2e8f0" }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line", color: "#334155" }}>
                  {selectedItem.message}
                </Typography>
              </Paper>

              {selectedItem.admin_reply && (
                <>
                  <Typography variant="caption" color="text.secondary">PREVIOUS SMTP REPLY</Typography>
                  <Paper sx={{ p: 2, bg: "#f0fdf4", borderRadius: 2, mb: 2, border: "1px solid #bbf7d0" }}>
                    <Typography variant="body2" color="#065f46" sx={{ whiteSpace: "pre-line" }}>
                      {selectedItem.admin_reply}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Sent on {selectedItem.replied_at ? new Date(selectedItem.replied_at).toLocaleString() : 'N/A'}
                    </Typography>
                  </Paper>
                </>
              )}

              {/* Status Actions */}
              <Typography variant="caption" color="text.secondary">UPDATE STATUS</Typography>
              <Box display="flex" gap={1} mt={1} mb={3}>
                <Button
                  size="small"
                  variant={selectedItem.status === "new" ? "contained" : "outlined"}
                  color="error"
                  onClick={() => handleUpdateStatus("new")}
                >
                  New
                </Button>
                <Button
                  size="small"
                  variant={selectedItem.status === "in_progress" ? "contained" : "outlined"}
                  color="warning"
                  onClick={() => handleUpdateStatus("in_progress")}
                >
                  In Progress
                </Button>
                <Button
                  size="small"
                  variant={selectedItem.status === "archived" ? "contained" : "outlined"}
                  color="inherit"
                  onClick={() => handleUpdateStatus("archived")}
                >
                  Archive
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Reply Form */}
              <Typography fontWeight={700} color="#0f766e" mb={1}>
                Send Email Reply via SMTP
              </Typography>
              <TextField
                placeholder="Type your response email to the user..."
                multiline
                rows={4}
                fullWidth
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                fullWidth
                disabled={sendingReply || !replyMessage.trim()}
                onClick={handleSendReply}
                startIcon={sendingReply ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
                sx={{
                  backgroundColor: "#0f766e",
                  "&:hover": { backgroundColor: "#0d6d66" },
                  py: 1.2,
                  borderRadius: 2
                }}
              >
                {sendingReply ? "Sending Email..." : "Send Email Reply"}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
