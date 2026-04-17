import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  CardActions, Chip, Stack, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Alert, Snackbar, CircularProgress, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Switch, InputAdornment, Autocomplete, Avatar,
  Tooltip, Divider, Fade, ToggleButton, ToggleButtonGroup,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as ViewIcon, Download as DownloadIcon,
  Refresh as RefreshIcon, Search as SearchIcon,
  Category as CategoryIcon, Description as TemplateIcon,
  FileUpload as UploadIcon, CheckCircle as ActiveIcon,
  Cancel as InactiveIcon, GridView as GridIcon, List as ListIcon,
  Close as CloseIcon, FilePresent as FileIcon, Info as InfoIcon,
  LocalOffer as TagIcon, Settings as SettingsIcon, CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

// Brand color
const TEAL = '#0f766e';
const TEAL_DARK = '#0c5e57';
const TEAL_LIGHT = '#f0fdfa';
const TEAL_MID = '#ccfbf1';

const TemplateManagement = () => {
  const { user: currentUser, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('list');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [totalTemplates, setTotalTemplates] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState(-1);

  const [categoryDialog, setCategoryDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [templateForm, setTemplateForm] = useState({
    title: '', description: '', category_id: '', tags: [], is_free: true
  });

  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const availableTags = [
    'Contract', 'Agreement', 'Legal', 'Business', 'Personal',
    'Employment', 'Financial', 'Form', 'Application', 'Letter',
    'NDA', 'Lease', 'Invoice', 'Policy', 'Proposals'
  ];

  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try { return format(new Date(d), 'MMM dd, yyyy'); } catch { return d; }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/templates/categories`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e) { console.error(e); }
  };

  const fetchTemplates = useCallback(async (targetPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: targetPage + 1,
        limit: rowsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category_id', selectedCategory);
      const res = await fetch(`${API_BASE_URL}/admin/templates/?${params}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data.templates || []);
      setTotalTemplates(data.pagination?.total || 0);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [page, rowsPerPage, search, selectedCategory, getHeaders, sortBy, sortOrder]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/templates/stats/summary`, { headers: getHeaders() });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const saveCategory = async () => {
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `${API_BASE_URL}/admin/templates/categories/${editingId}`
        : `${API_BASE_URL}/admin/templates/categories`;
      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(newCategory) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      setSuccess(`Category ${isEditing ? 'updated' : 'created'} successfully`);
      fetchCategories();
      setCategoryDialog(false);
      setNewCategory({ name: '', description: '' });
      setIsEditing(false); setEditingId(null);
    } catch (e) { setError(e.message); }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/templates/categories/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      setSuccess('Category deleted');
      fetchCategories(); fetchTemplates();
    } catch (e) { setError(e.message); }
  };

  const saveTemplate = async () => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('title', templateForm.title);
      fd.append('description', templateForm.description || '');
      fd.append('category_id', templateForm.category_id);
      fd.append('tags', templateForm.tags.join(','));
      fd.append('is_free', templateForm.is_free.toString());
      if (uploadFile) fd.append('file', uploadFile);
      else if (!isEditing) { setError('Please select a file'); setUploading(false); return; }

      const url = isEditing
        ? `${API_BASE_URL}/admin/templates/${editingId}`
        : `${API_BASE_URL}/admin/templates/upload`;

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || 'Failed to save template');
      }

      setSuccess(`Template ${isEditing ? 'updated' : 'uploaded'} successfully`);

      // Immediate Refresh
      await Promise.all([
        fetchTemplates(),
        fetchStats()
      ]);

      setUploadDialog(false);
      resetTemplateForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({ title: '', description: '', category_id: '', tags: [], is_free: true });
    setUploadFile(null); setIsEditing(false); setEditingId(null);
  };

  const updateTemplateStatus = async (id, isActive) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/templates/${id}/status?is_active=${isActive}`, { method: 'PUT', headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to update status');
      setSuccess(`Template ${isActive ? 'activated' : 'deactivated'}`);
      fetchTemplates();
    } catch (e) { setError(e.message); }
  };

  const deleteTemplate = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/templates/${selectedTemplate.id}`, { method: 'DELETE', headers: getHeaders() });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      setSuccess('Template deleted'); fetchTemplates(); setDeleteDialog(false);
    } catch (e) { setError(e.message); }
  };

  const downloadTemplate = async (id, filename) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/templates/download/${id}?format=original`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename || `template_${id}.pdf`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      setSuccess('Downloaded successfully');
    } catch (e) { setError(e.message); }
  };

  const handlePreview = async (template) => {
    setSelectedTemplate(template); setPreviewDialog(true);
    setPreviewLoading(true); setPreviewUrl(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/templates/download/${template.id}?format=pdf`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load preview');
      setPreviewUrl(URL.createObjectURL(await res.blob()));
    } catch (e) { setError('Could not load preview'); } finally { setPreviewLoading(false); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) { setError('Unsupported file type'); return; }
    if (file.size > 20 * 1024 * 1024) { setError('File exceeds 20MB'); return; }
    setUploadFile(file);
  };

  const handleEditCategory = (cat) => {
    setNewCategory({ name: cat.name, description: cat.description || '' });
    setEditingId(cat.id); setIsEditing(true); setCategoryDialog(true);
  };

  const handleEditTemplate = (t) => {
    setTemplateForm({ title: t.title, description: t.description || '', category_id: t.category_id, tags: t.tags || [], is_free: t.is_free !== false });
    setEditingId(t.id); setIsEditing(true); setUploadDialog(true);
  };

  const handleApplyFilters = () => { setPage(0); fetchTemplates(0); };
  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSortBy('created_at');
    setSortOrder(-1);
    setPage(0);
    fetchTemplates(0);
  };

  useEffect(() => { fetchCategories(); fetchTemplates(); fetchStats(); }, []);

  // ── Sub components ──────────────────────────────────────────────
  const StatusBadge = ({ template }) => {
    if (!template.is_active) return <Chip label="Inactive" size="small" sx={{ bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 700, border: '1px solid #fecaca', fontSize: 11 }} />;
    if (!template.is_free) return <Chip label="Premium" size="small" sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 700, border: '1px solid #fde68a', fontSize: 11 }} />;
    return <Chip label="Active" size="small" sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700, border: '1px solid #bbf7d0', fontSize: 11 }} />;
  };

  const StatCard = ({ title, value, icon, sub }) => (
    <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 0 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10.5 }}>{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#111827', lineHeight: 1 }}>{value}</Typography>
            {sub && <Typography variant="caption" sx={{ color: '#9ca3af', mt: 0.5, display: 'block' }}>{sub}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: TEAL_MID, color: TEAL, width: 42, height: 42 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f9fafb', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>Template Management</Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>Manage and organize document templates for your users</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => { fetchTemplates(); fetchCategories(); fetchStats(); }}
              sx={{ border: '1px solid #e5e7eb', bgcolor: '#fff', borderRadius: 1.5 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<UploadIcon />}
            onClick={() => { resetTemplateForm(); setUploadDialog(true); }}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_DARK }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, px: 2.5, boxShadow: 'none' }}>
            Upload Template
          </Button>
        </Stack>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Templates" value={stats?.summary?.total_templates || 0} icon={<TemplateIcon fontSize="small" />} sub="All uploaded" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Active" value={stats?.summary?.active_templates || 0} icon={<ActiveIcon fontSize="small" />} sub="Published" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Free Access" value={stats?.summary?.free_templates || 0} icon={<InfoIcon fontSize="small" />} sub="Open to all users" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Categories" value={categories.length} icon={<CategoryIcon fontSize="small" />} sub="Organized groups" />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            px: 2,
            borderBottom: '1px solid #f3f4f6',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: 13.5, minHeight: 48, py: 1.5, color: '#6b7280' },
            '& .Mui-selected': { color: TEAL, fontWeight: 600 },
            '& .MuiTabs-indicator': { bgcolor: TEAL, height: 2.5 }
          }}
        >
          <Tab label="All Templates" icon={<TemplateIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Categories" icon={<CategoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* ═══ TEMPLATES TAB ═══ */}
      {activeTab === 0 ? (
        <>
          {/* Filter Bar */}
          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
              <TextField
                size="small"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                sx={{ flex: 1, maxWidth: 420 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#9ca3af' }} /></InputAdornment>,
                  sx: { borderRadius: 1.5, fontSize: 13.5, bgcolor: '#f9fafb' }
                }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel sx={{ fontSize: 13.5 }}>Category</InputLabel>
                <Select value={selectedCategory} label="Category" onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{ borderRadius: 1.5, fontSize: 13.5, bgcolor: '#f9fafb' }}>
                  <MenuItem value=""><em>All Categories</em></MenuItem>
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel sx={{ fontSize: 13.5 }}>Sort By</InputLabel>
                <Select
                  value={`${sortBy}:${sortOrder}`}
                  label="Sort By"
                  onChange={(e) => {
                    const [field, order] = e.target.value.split(':');
                    setSortBy(field);
                    setSortOrder(parseInt(order));
                  }}
                  sx={{ borderRadius: 1.5, fontSize: 13.5, bgcolor: '#f9fafb' }}
                >
                  <MenuItem value="created_at:-1">Newest First</MenuItem>
                  <MenuItem value="created_at:1">Oldest First</MenuItem>
                  <MenuItem value="title:1">Title (A-Z)</MenuItem>
                  <MenuItem value="title:-1">Title (Z-A)</MenuItem>
                  <MenuItem value="download_count:-1">Most Popular</MenuItem>
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                <Box sx={{ display: 'flex', bgcolor: '#f3f4f6', borderRadius: 1.5, p: '2px', gap: '2px' }}>
                  {[['list', <ListIcon sx={{ fontSize: 16 }} />], ['grid', <GridIcon sx={{ fontSize: 16 }} />]].map(([val, icon]) => (
                    <Box key={val} onClick={() => setViewMode(val)}
                      sx={{
                        px: 1.5, py: 0.75, borderRadius: 1, cursor: 'pointer', display: 'flex', alignItems: 'center',
                        bgcolor: viewMode === val ? '#fff' : 'transparent', color: viewMode === val ? TEAL : '#6b7280',
                        boxShadow: viewMode === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.12s'
                      }}>{icon}</Box>
                  ))}
                </Box>
                <Button variant="contained" size="small" onClick={handleApplyFilters}
                  sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_DARK }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, px: 2, boxShadow: 'none' }}>
                  Apply
                </Button>
                <Button variant="outlined" size="small" onClick={handleClearFilters}
                  sx={{ borderColor: '#e5e7eb', color: '#374151', borderRadius: 1.5, textTransform: 'none', fontWeight: 500, px: 2 }}>
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
              <CircularProgress size={36} sx={{ color: TEAL }} />
              <Typography sx={{ color: '#9ca3af', fontSize: 13 }}>Loading templates...</Typography>
            </Box>
          ) : templates.length === 0 ? (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <TemplateIcon sx={{ fontSize: 72, color: '#d1d5db', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>No templates found</Typography>
              <Typography sx={{ color: '#9ca3af', fontSize: 13 }}>Try adjusting your filters or upload a new template</Typography>
            </Box>
          ) : viewMode === 'list' ? (
            /* LIST VIEW */
            <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    {['Title', 'Category', 'Tags', 'Status', 'Downloads', 'Active', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, py: 1.5, borderBottom: '1px solid #e5e7eb' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map(t => (
                    <TableRow key={t.id} hover sx={{ '&:last-child td': { border: 0 }, borderBottom: '1px solid #f3f4f6' }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: 13.5 }}>{t.title}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#9ca3af', mt: 0.3 }}>{t.filename} · {formatDate(t.created_at)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={t.category_name || '—'} size="small"
                          sx={{ bgcolor: TEAL_LIGHT, color: TEAL, fontWeight: 600, fontSize: 11, border: `1px solid ${TEAL_MID}` }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {t.tags?.slice(0, 2).map(tag => (
                            <Chip key={tag} label={tag} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: 11 }} />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell><StatusBadge template={t} /></TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.download_count || 0}</Typography>
                      </TableCell>
                      <TableCell>
                        <Switch checked={t.is_active} onChange={(e) => updateTemplateStatus(t.id, e.target.checked)} size="small"
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: TEAL }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: TEAL } }} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Preview">
                            <IconButton size="small" onClick={() => handlePreview(t)}
                              sx={{ color: TEAL, bgcolor: TEAL_LIGHT, border: `1px solid ${TEAL_MID}`, borderRadius: 1, '&:hover': { bgcolor: TEAL_MID } }}>
                              <ViewIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton size="small" onClick={() => downloadTemplate(t.id, t.filename)}
                              sx={{ color: '#374151', bgcolor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 1 }}>
                              <DownloadIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditTemplate(t)}
                              sx={{ color: '#374151', bgcolor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 1 }}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => { setSelectedTemplate(t); setDeleteDialog(true); }}
                              sx={{ color: '#dc2626', bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 1 }}>
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          ) : (
            /* GRID VIEW */
            <Grid container spacing={2}>
              {templates.map(t => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={t.id}>
                  <Card elevation={0} sx={{
                    border: '1px solid #e5e7eb', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column',
                    transition: 'all 0.15s', '&:hover': { borderColor: TEAL, boxShadow: `0 4px 14px rgba(15,118,110,0.1)` }
                  }}>
                    <Box sx={{ p: 2, bgcolor: TEAL_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, position: 'relative' }}>
                      <TemplateIcon sx={{ fontSize: 48, color: TEAL, opacity: 0.4 }} />
                      <Box sx={{ position: 'absolute', top: 10, right: 10 }}><StatusBadge template={t} /></Box>
                      <Box sx={{ position: 'absolute', top: 10, left: 10 }}>
                        <Chip label={t.category_name} size="small" sx={{ bgcolor: '#fff', fontWeight: 600, fontSize: 11, border: '1px solid #e5e7eb' }} />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 2, flexGrow: 1 }}>
                      <Typography sx={{
                        fontWeight: 700, fontSize: 13.5, color: '#111827', mb: 0.5,
                        overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, lineClamp: 2
                      }}>
                        {t.title}
                      </Typography>
                      <Typography sx={{
                        fontSize: 12, color: '#9ca3af', mb: 1.5,
                        overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, lineClamp: 2
                      }}>
                        {t.description || 'No description available.'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {t.tags?.slice(0, 3).map(tag => (
                          <Chip key={tag} label={tag} size="small" sx={{ bgcolor: '#f3f4f6', fontSize: 10.5 }} />
                        ))}
                      </Box>
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ px: 1.5, py: 1.25, bgcolor: '#fafafa', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Preview">
                          <IconButton size="small" onClick={() => handlePreview(t)} sx={{ color: TEAL, bgcolor: TEAL_LIGHT }}><ViewIcon sx={{ fontSize: 14 }} /></IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => downloadTemplate(t.id, t.filename)} sx={{ color: '#374151', bgcolor: '#f3f4f6' }}><DownloadIcon sx={{ fontSize: 14 }} /></IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEditTemplate(t)} sx={{ color: '#374151', bgcolor: '#f3f4f6' }}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Switch checked={t.is_active} onChange={(e) => updateTemplateStatus(t.id, e.target.checked)} size="small"
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: TEAL }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: TEAL } }} />
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => { setSelectedTemplate(t); setDeleteDialog(true); }} sx={{ color: '#dc2626', bgcolor: '#fef2f2' }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              component="div"
              count={totalTemplates}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, p) => { setPage(p); fetchTemplates(p); }}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{ border: '1px solid #e5e7eb', borderRadius: 2, bgcolor: '#fff', px: 1 }}
              rowsPerPageOptions={[12, 24, 48]}
            />
          </Box>
        </>
      ) : (
        /* ═══ CATEGORIES TAB — full-width list ═══ */
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </Typography>
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => { setEditingId(null); setIsEditing(false); setNewCategory({ name: '', description: '' }); setCategoryDialog(true); }}
              sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_DARK }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, px: 2.5, boxShadow: 'none' }}>
              New Category
            </Button>
          </Box>

          {categories.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <CategoryIcon sx={{ fontSize: 60, color: '#d1d5db', mb: 2 }} />
              <Typography sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>No categories yet</Typography>
              <Typography sx={{ color: '#9ca3af', fontSize: 13 }}>Create your first category to organize templates</Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {categories.map(cat => (
                <Paper key={cat.id} elevation={0}
                  sx={{
                    border: '1px solid #e5e7eb', borderRadius: 2, bgcolor: '#fff', transition: 'all 0.15s',
                    '&:hover': { borderColor: TEAL, boxShadow: `0 2px 10px rgba(15,118,110,0.08)` }
                  }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 2, gap: 2.5 }}>
                    {/* Icon */}
                    <Avatar sx={{ bgcolor: TEAL_LIGHT, color: TEAL, width: 44, height: 44, flexShrink: 0 }}>
                      <CategoryIcon fontSize="small" />
                    </Avatar>

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.25 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14.5, color: '#111827' }}>{cat.name}</Typography>
                        <Chip label={`${cat.template_count || 0} templates`} size="small"
                          sx={{ bgcolor: TEAL_LIGHT, color: TEAL, fontWeight: 600, fontSize: 11, border: `1px solid ${TEAL_MID}`, height: 22 }} />
                      </Box>
                      <Typography sx={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cat.description || 'No description provided.'}
                      </Typography>
                    </Box>

                    {/* Created */}
                    {cat.created_at && (
                      <Typography sx={{ fontSize: 12, color: '#9ca3af', flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                        Created {formatDate(cat.created_at)}
                      </Typography>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
                      <Button size="small" startIcon={<EditIcon sx={{ fontSize: 13 }} />}
                        onClick={() => handleEditCategory(cat)}
                        sx={{
                          color: TEAL, bgcolor: TEAL_LIGHT, border: `1px solid ${TEAL_MID}`, borderRadius: 1.5,
                          textTransform: 'none', fontWeight: 600, fontSize: 12, px: 1.5, '&:hover': { bgcolor: TEAL_MID }
                        }}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<DeleteIcon sx={{ fontSize: 13 }} />}
                        onClick={() => { if (window.confirm('Delete this category? Templates will be unlinked.')) deleteCategory(cat.id); }}
                        sx={{
                          color: '#dc2626', bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 1.5,
                          textTransform: 'none', fontWeight: 600, fontSize: 12, px: 1.5, '&:hover': { bgcolor: '#fee2e2' }
                        }}>
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* ═══ Dialogs ═══ */}

      {/* Upload / Edit Template */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2, m: 2 } }}>
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', pb: 2, px: 3, pt: 2.5,
          borderBottom: '1px solid #f1f5f9'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: TEAL_LIGHT, color: TEAL, width: 40, height: 40 }}>
              {isEditing ? <EditIcon size="small" /> : <UploadIcon size="small" />}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
              {isEditing ? 'Edit Existing Template' : 'Upload New Template'}
            </Typography>
          </Box>
          <IconButton onClick={() => setUploadDialog(false)} size="small" sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }} className="no-scrollbar">
          <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {/* <Typography variant="caption" sx={{ color: TEAL, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
              General Information
            </Typography> */}
            <Stack spacing={2.5}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.8, color: '#334155', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Template Title <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                </Typography>
                <TextField
                  fullWidth
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                  error={templateForm.title.length > 0 && templateForm.title.length < 3}
                  helperText={
                    templateForm.title.length > 0 && templateForm.title.length < 3
                      ? "Title must be at least 3 characters"
                      : `${templateForm.title.length}/200 characters`
                  }
                  InputProps={{ sx: { borderRadius: 1.5, fontSize: 13.5, bgcolor: '#fcfcfc' } }}
                  size="small"
                  placeholder="e.g. Standard Employment Contract"
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.8, color: '#334155' }}>
                  Description (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  helperText={`${(templateForm.description || '').length}/500 characters`}
                  InputProps={{ sx: { borderRadius: 1.5, fontSize: 13.5, bgcolor: '#fcfcfc' } }}
                  size="small"
                  placeholder="Briefly describe the purpose of this template..."
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.8, color: '#334155', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Category <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={templateForm.category_id}
                      onChange={(e) => setTemplateForm({ ...templateForm, category_id: e.target.value })}
                      sx={{ borderRadius: 1.5, fontSize: 13.5, bgcolor: '#fcfcfc' }}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) return <Box sx={{ color: '#94a3b8' }}>Select a category</Box>;
                        const cat = categories.find(c => c.id === selected);
                        return cat ? cat.name : selected;
                      }}
                    >
                      {categories.map(c => <MenuItem key={c.id} value={c.id} sx={{ fontSize: 13.5 }}>{c.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.8, color: '#334155' }}>
                    Tags
                  </Typography>
                  <Autocomplete
                    multiple
                    options={availableTags}
                    value={templateForm.tags}
                    onChange={(e, v) => setTemplateForm({ ...templateForm, tags: v })}
                    freeSolo
                    fullWidth
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Add keywords (e.g. Legal, HR)..."
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          sx: { borderRadius: 1.5, fontSize: 13.5, bgcolor: '#fcfcfc' }
                        }}
                      />
                    )}
                  />
                </Box>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

          <Box sx={{ px: 3, pb: 3 }}>
            <Typography variant="caption" sx={{ color: TEAL, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
              Access & File
            </Typography>
            <Stack spacing={2}>
              <Box sx={{
                p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: TEAL_MID, color: TEAL, width: 32, height: 32 }}><SettingsIcon sx={{ fontSize: 16 }} /></Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#1e293b' }}>Free Access</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Allow users without a subscription to use this</Typography>
                  </Box>
                </Box>
                <Switch checked={templateForm.is_free} onChange={(e) => setTemplateForm({ ...templateForm, is_free: e.target.checked })}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: TEAL }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: TEAL } }} />
              </Box>

              <Box sx={{
                border: `2px dashed ${TEAL}40`, p: 3, borderRadius: 2, textAlign: 'center',
                bgcolor: uploadFile ? TEAL_LIGHT : '#f9fafb',
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { bgcolor: TEAL_LIGHT, borderColor: TEAL, transform: 'translateY(-2px)' }
              }}>
                <input type="file" id="template-file" style={{ display: 'none' }} onChange={handleFileSelect} />
                <label htmlFor="template-file" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {uploadFile ? (
                      <CheckCircleIcon sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
                    ) : (
                      <UploadIcon sx={{ fontSize: 40, color: TEAL, mb: 1, opacity: 0.7 }} />
                    )}
                    <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>
                      {uploadFile ? uploadFile.name : 'Choose template file'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5 }}>
                      {isEditing && !uploadFile
                        ? 'Keep current file or select a new one'
                        : 'PDF, DOCX, or TXT · Max 20MB'
                      }
                    </Typography>
                    {uploadFile && (
                      <Chip
                        label={`${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`}
                        size="small"
                        sx={{ mt: 1.5, height: 20, fontSize: 10, fontWeight: 700, bgcolor: TEAL_MID, color: TEAL }}
                      />
                    )}
                  </Box>
                </label>
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setUploadDialog(false)}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
            disabled={uploading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveTemplate}
            disabled={!templateForm.title || templateForm.title.length < 3 || !templateForm.category_id || uploading}
            sx={{
              bgcolor: TEAL, '&:hover': { bgcolor: TEAL_DARK },
              borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 4,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }}>
            {uploading ? <CircularProgress size={22} color="inherit" /> : (isEditing ? 'Save Changes' : 'Upload Template')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} fullWidth maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 2, height: '90vh', overflow: 'hidden', m: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2.5, borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: TEAL_LIGHT, color: TEAL, width: 36, height: 36 }}><FileIcon fontSize="small" /></Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.2 }}>{selectedTemplate?.title}</Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>{selectedTemplate?.category_name}</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setPreviewDialog(false)} sx={{ bgcolor: '#f3f4f6', borderRadius: 1 }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: '#1f2937', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {previewLoading ? (
            <Box sx={{ textAlign: 'center', color: '#d1d5db' }}>
              <CircularProgress sx={{ color: TEAL }} size={40} />
              <Typography sx={{ mt: 2, fontSize: 13 }}>Loading preview...</Typography>
            </Box>
          ) : previewUrl ? (
            selectedTemplate?.filename?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
              <Box sx={{ p: 2, height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </Box>
            ) : (
              <iframe src={`${previewUrl}#toolbar=0&navpanes=0`} title="Preview" width="100%" height="100%" style={{ border: 'none' }} />
            )
          ) : (
            <Box sx={{ textAlign: 'center', color: '#d1d5db', p: 4 }}>
              <InfoIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography sx={{ fontWeight: 600 }}>Preview unavailable</Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>Download the file to view it locally.</Typography>
              <Button variant="outlined" startIcon={<DownloadIcon />}
                onClick={() => downloadTemplate(selectedTemplate.id, selectedTemplate.filename)}
                sx={{ color: '#e5e7eb', borderColor: '#6b7280', textTransform: 'none' }}>Download</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f3f4f6', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#9ca3af', flex: 1 }}>ID: {selectedTemplate?.id}</Typography>
          <Button onClick={() => setPreviewDialog(false)} sx={{ textTransform: 'none', color: '#374151' }}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}
            onClick={() => downloadTemplate(selectedTemplate.id, selectedTemplate.filename)}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_DARK }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}>
            Download Original
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Category Dialog */}
      <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2, m: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 15, pb: 1, borderBottom: '1px solid #f3f4f6' }}>
          {isEditing ? 'Edit Category' : 'New Category'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField fullWidth label="Category Name" value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="e.g. Legal Agreements" InputProps={{ sx: { borderRadius: 1.5, fontSize: 13.5 } }} size="small" />
            <TextField fullWidth label="Description" multiline rows={3} value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="Describe what types of templates belong here..."
              InputProps={{ sx: { borderRadius: 1.5, fontSize: 13.5 } }} size="small" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #f3f4f6' }}>
          <Button onClick={() => setCategoryDialog(false)} sx={{ textTransform: 'none', color: '#374151' }}>Cancel</Button>
          <Button variant="contained" onClick={saveCategory} disabled={!newCategory.name}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_DARK }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, px: 3, boxShadow: 'none' }}>
            {isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2, m: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626', fontSize: 15, pb: 1, borderBottom: '1px solid #f3f4f6' }}>Delete Template?</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: 13.5, color: '#374151' }}>
            You are about to permanently delete <strong>{selectedTemplate?.title}</strong>. This will remove the file from storage and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #f3f4f6' }}>
          <Button onClick={() => setDeleteDialog(false)} sx={{ textTransform: 'none', color: '#374151' }}>Cancel</Button>
          <Button variant="contained" onClick={deleteTemplate}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, px: 3, boxShadow: 'none' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback */}
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ fontWeight: 500, borderRadius: 2 }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ fontWeight: 500, borderRadius: 2 }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplateManagement;