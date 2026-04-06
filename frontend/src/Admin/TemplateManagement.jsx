import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Switch,
  InputAdornment,
  Autocomplete,
  Avatar,
  Tooltip,
  Divider,
  Fade,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  Description as TemplateIcon,
  FileUpload as UploadIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  FilterList as FilterIcon,
  GridView as GridIcon,
  List as ListIcon,
  Close as CloseIcon,
  FilePresent as FileIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000';

const TemplateManagement = () => {
  const { user: currentUser, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [totalTemplates, setTotalTemplates] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Dialogs
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [templateForm, setTemplateForm] = useState({
    title: '',
    description: '',
    category_id: '',
    tags: [],
    is_free: true
  });

  const [uploadFile, setUploadFile] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Statistics
  const [stats, setStats] = useState(null);

  // Available tags for Autocomplete
  const availableTags = [
    'Contract', 'Agreement', 'Legal', 'Business', 'Personal',
    'Employment', 'Financial', 'Form', 'Application', 'Letter',
    'NDA', 'Lease', 'Invoice', 'Policy', 'Proposals'
  ];

  // API Headers
  const getHeaders = useCallback(() => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, [token]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/templates/categories`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch templates
  const fetchTemplates = useCallback(async (targetPage = page) => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: targetPage + 1,
        limit: rowsPerPage,
      });

      if (search) params.append('search', search);
      if (selectedCategory) params.append('category_id', selectedCategory);

      const response = await fetch(`${API_BASE_URL}/admin/templates?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.templates || []);
      setTotalTemplates(data.pagination?.total || 0);

    } catch (err) {
      setError(err.message || 'Failed to fetch templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, selectedCategory, getHeaders]);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/templates/stats/summary`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Create or Update category
  const saveCategory = async () => {
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `${API_BASE_URL}/admin/templates/categories/${editingId}`
        : `${API_BASE_URL}/admin/templates/categories`;

      const response = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(newCategory)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${isEditing ? 'update' : 'create'} category`);
      }

      setSuccess(`Category ${isEditing ? 'updated' : 'created'} successfully`);
      fetchCategories();
      setCategoryDialog(false);
      setNewCategory({ name: '', description: '' });
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete category
  const deleteCategory = async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/templates/categories/${categoryId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete category');
      }

      setSuccess('Category deleted successfully');
      fetchCategories();
      fetchTemplates();
    } catch (err) {
      setError(err.message);
    }
  };

  // Upload or Update template
  const saveTemplate = async () => {
    try {
      const formData = new FormData();
      formData.append('title', templateForm.title);
      formData.append('description', templateForm.description || '');
      formData.append('category_id', templateForm.category_id);
      formData.append('tags', templateForm.tags.join(','));
      formData.append('is_free', templateForm.is_free.toString());

      if (uploadFile) {
        formData.append('file', uploadFile);
      } else if (!isEditing) {
        setError('Please select a file to upload');
        return;
      }

      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `${API_BASE_URL}/admin/templates/${editingId}`
        : `${API_BASE_URL}/admin/templates/upload`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${isEditing ? 'update' : 'upload'} template`);
      }

      setSuccess(`Template ${isEditing ? 'updated' : 'uploaded'} successfully`);
      fetchTemplates();
      setUploadDialog(false);
      resetTemplateForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      title: '',
      description: '',
      category_id: '',
      tags: [],
      is_free: true
    });
    setUploadFile(null);
    setIsEditing(false);
    setEditingId(null);
  };

  // Update template status
  const updateTemplateStatus = async (templateId, isActive) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/templates/${templateId}/status?is_active=${isActive}`, {
        method: 'PUT',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error(`Failed to ${isActive ? 'activate' : 'deactivate'} template`);

      setSuccess(`Template ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchTemplates();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete template
  const deleteTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/templates/${selectedTemplate.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete template');
      }

      setSuccess('Template deleted successfully');
      fetchTemplates();
      setDeleteDialog(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Download template
  const downloadTemplate = async (templateId, filename) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/templates/download/${templateId}?format=original`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to download template');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `template_${templateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Template downloaded successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  // Preview template
  const handlePreview = async (template) => {
    setSelectedTemplate(template);
    setPreviewDialog(true);
    setPreviewLoading(true);
    setPreviewUrl(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/templates/download/${template.id}?format=pdf`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to load preview');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Preview error:', err);
      setError('Could not load file preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['pdf', 'doc', 'docx', 'txt'];
      const fileExt = file.name.split('.').pop().toLowerCase();

      if (!allowedTypes.includes(fileExt)) {
        setError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        setError('File size exceeds 20MB limit');
        return;
      }

      setUploadFile(file);
    }
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setNewCategory({
      name: category.name,
      description: category.description || ''
    });
    setEditingId(category.id);
    setIsEditing(true);
    setCategoryDialog(true);
  };

  // Handle edit template
  const handleEditTemplate = (template) => {
    setTemplateForm({
      title: template.title,
      description: template.description || '',
      category_id: template.category_id,
      tags: template.tags || [],
      is_free: template.is_free !== false
    });
    setEditingId(template.id);
    setIsEditing(true);
    setUploadDialog(true);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setPage(0);
    fetchTemplates(0);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setPage(0);
    fetchTemplates(0);
  };

  // Initialize data
  useEffect(() => {
    fetchCategories();
    fetchTemplates();
    fetchStats();
  }, []);

  // Template Status Chip
  const TemplateStatusChip = ({ template }) => {
    if (!template.is_active) {
      return <Chip label="Inactive" color="error" size="small" variant="filled" />;
    }
    if (!template.is_free) {
      return <Chip label="Premium" color="warning" size="small" variant="filled" />;
    }
    return <Chip label="Active" color="success" size="small" variant="filled" />;
  };

  // Statistics Card Component
  const StatCard = ({ title, value, color, icon }) => (
    <Card elevation={2} sx={{ height: '100%', borderRadius: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" variant="overline" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mt: 1, color }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: 'auto', bgcolor: '#f4f7fa', minHeight: '100vh' }}>
      {/* Premium Header */}
      <Box sx={{ mb: 5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.dark', mb: 1, letterSpacing: '-0.5px' }}>
            Template Studio
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ fontSize: '1.1rem' }}>
            Curate and manage your enterprise document assets
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            size="large"
            startIcon={<UploadIcon />}
            onClick={() => { resetTemplateForm(); setUploadDialog(true); }}
            sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 600, boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)', bgcolor: '#0070f3', '&:hover': { bgcolor: '#0061d1' } }}
          >
            Upload New
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => { fetchTemplates(); fetchCategories(); fetchStats(); }} sx={{ border: '1px solid #e0e0e0', bgcolor: 'white' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Stats Section */}
      <Fade in={true} timeout={800}>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Inventory" value={stats?.summary?.total_templates || 0} color="#1a73e8" icon={<TemplateIcon />} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Active Pool" value={stats?.summary?.active_templates || 0} color="#34a853" icon={<ActiveIcon />} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Free Access" value={stats?.summary?.free_templates || 0} color="#fbbc04" icon={<InfoIcon />} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Categories" value={categories.length} color="#ea4335" icon={<CategoryIcon />} />
          </Grid>
        </Grid>
      </Fade>

      {/* Main Navigation Tabs */}
      <Paper elevation={0} sx={{ mb: 4, borderRadius: 4, overflow: 'hidden', border: '1px solid #eef2f6', bgcolor: 'white' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            bgcolor: '#f8fafd',
            '& .MuiTab-root': { py: 2, fontWeight: 600, fontSize: '1rem', minWidth: 160 },
            '& .Mui-selected': { color: 'primary.main', bgcolor: 'white' },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
          }}
        >
          <Tab label="All Templates" icon={<TemplateIcon />} iconPosition="start" />
          <Tab label="Categories" icon={<CategoryIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        <>
          {/* Filters Bar */}
          <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid #eef2f6', bgcolor: 'white' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Search by title, tags or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                    sx: { borderRadius: 3, bgcolor: '#f8fafd' }
                  }}
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="medium">
                  <InputLabel>All Categories</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="All Categories"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    sx={{ borderRadius: 3, bgcolor: '#f8fafd' }}
                  >
                    <MenuItem value=""><em>Any Category</em></MenuItem>
                    {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, v) => v && setViewMode(v)}
                    size="medium"
                    sx={{ borderRadius: 3, bgcolor: 'white' }}
                  >
                    <ToggleButton value="grid"><GridIcon /></ToggleButton>
                    <ToggleButton value="list"><ListIcon /></ToggleButton>
                  </ToggleButtonGroup>
                  <Button variant="contained" onClick={handleApplyFilters} sx={{ borderRadius: 3, px: 3, boxShadow: 'none' }}>Filter</Button>
                  <Button variant="outlined" onClick={handleClearFilters} sx={{ borderRadius: 3 }}>Clear</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
              <CircularProgress size={60} thickness={4} />
              <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>Synchronizing templates...</Typography>
            </Box>
          ) : templates.length === 0 ? (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <TemplateIcon sx={{ fontSize: 100, color: '#e0e0e0', mb: 3 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>No templates found</Typography>
              <Typography color="textSecondary">Try adjusting your filters or upload a new template</Typography>
            </Box>
          ) : viewMode === 'grid' ? (
            <Grid container spacing={4}>
              {templates.map(template => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                  <Card elevation={0} sx={{
                    height: '100%',
                    borderRadius: 4,
                    border: '1px solid #eef2f6',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      borderColor: 'primary.light',
                      '& .card-actions': { opacity: 1, transform: 'translateY(0)' }
                    }
                  }}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafd', position: 'relative', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <TemplateIcon sx={{ fontSize: 80, color: 'primary.light', opacity: 0.5 }} />
                      <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                        <TemplateStatusChip template={template} />
                      </Box>
                      <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
                        <Chip label={template.category_name} size="small" sx={{ bgcolor: 'white', fontWeight: 600, border: '1px solid #eee' }} />
                      </Box>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, pt: 3, px: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.3, height: 48, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                        {template.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5, height: 40, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                        {template.description || 'Enterprise document template optimized for signatures.'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {template.tags?.slice(0, 3).map(tag => (
                          <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: '#f0f4f8' }} />
                        ))}
                      </Box>
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 2, bgcolor: '#fff' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Preview">
                          <IconButton size="small" onClick={() => handlePreview(template)} sx={{ color: 'primary.main', bgcolor: '#f0f7ff' }}><ViewIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => downloadTemplate(template.id, template.filename)} sx={{ color: 'text.secondary', bgcolor: '#f5f5f5' }}><DownloadIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEditTemplate(template)} sx={{ color: '#008394', bgcolor: '#e0f2f1' }}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={template.is_active}
                          onChange={(e) => updateTemplateStatus(template.id, e.target.checked)}
                          size="small"
                        />
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => { setSelectedTemplate(template); setDeleteDialog(true); }} sx={{ bgcolor: '#fff3f3' }}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #eef2f6', bgcolor: 'white' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafd' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, py: 2.5 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tags</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Metrics</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map(template => (
                    <TableRow key={template.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>{template.title}</Typography>
                        <Typography variant="caption" color="textSecondary">{template.filename} • {formatDate(template.created_at)}</Typography>
                      </TableCell>
                      <TableCell><Chip label={template.category_name} size="small" variant="outlined" sx={{ fontWeight: 600 }} /></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {template.tags?.slice(0, 2).map(t => <Chip key={t} label={t} size="small" sx={{ bgcolor: '#f0f4f8' }} />)}
                        </Box>
                      </TableCell>
                      <TableCell><TemplateStatusChip template={template} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DownloadIcon fontSize="small" color="disabled" />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{template.download_count || 0}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => handlePreview(template)} color="primary"><ViewIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => downloadTemplate(template.id, template.filename)}><DownloadIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleEditTemplate(template)} color="info"><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => { setSelectedTemplate(template); setDeleteDialog(true); }}><DeleteIcon fontSize="small" /></IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              component="div"
              count={totalTemplates}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, p) => { setPage(p); fetchTemplates(p); }}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{ border: '1px solid #eef2f6', borderRadius: 4, bgcolor: 'white', px: 2 }}
              rowsPerPageOptions={[12, 24, 48]}
            />
          </Box>
        </>
      ) : (
        /* Categories Tab */
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Asset Classifications</Typography>
            <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => { setEditingId(null); setIsEditing(false); setNewCategory({ name: '', description: '' }); setCategoryDialog(true); }} sx={{ borderRadius: 3 }}>New Class</Button>
          </Box>
          <Grid container spacing={4}>
            {categories.map(category => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <Card elevation={0} sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid #eef2f6',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'scale(1.02)', boxShadow: '0 12px 30px rgba(0,0,0,0.05)' }
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}><CategoryIcon fontSize="large" /></Avatar>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{category.name}</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>{category.template_count || 0} active templates</Typography>
                      </Box>
                    </Box>
                    <Typography variant="body1" color="textSecondary" sx={{ minHeight: 60 }}>{category.description || 'No description available for this classification.'}</Typography>
                  </CardContent>
                  <Divider />
                  <CardActions sx={{ justifyContent: 'flex-end', px: 3, py: 2 }}>
                    <Button size="medium" onClick={() => handleEditCategory(category)} startIcon={<EditIcon />} sx={{ fontWeight: 600 }}>Edit</Button>
                    <Button size="medium" color="error" startIcon={<DeleteIcon />} onClick={() => { if (window.confirm('Erase this category and unbind all templates?')) deleteCategory(category.id); }} sx={{ fontWeight: 600 }}>Erase</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Upload/Edit Template Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', pb: 1 }}>{isEditing ? 'Curate Asset' : 'New Template Asset'}</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>Configure your enterprise document template for optimized signing workflows.</Typography>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Asset Title"
              value={templateForm.title}
              onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
              required
              InputProps={{ sx: { borderRadius: 3 } }}
            />
            <TextField
              fullWidth
              label="Strategic Description"
              multiline
              rows={3}
              value={templateForm.description}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              InputProps={{ sx: { borderRadius: 3 } }}
            />
            <FormControl fullWidth required>
              <InputLabel>Classification</InputLabel>
              <Select
                value={templateForm.category_id}
                label="Classification"
                onChange={(e) => setTemplateForm({ ...templateForm, category_id: e.target.value })}
                sx={{ borderRadius: 3 }}
              >
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Autocomplete
              multiple
              options={availableTags}
              value={templateForm.tags}
              onChange={(e, v) => setTemplateForm({ ...templateForm, tags: v })}
              renderInput={(params) => <TextField {...params} label="Taxonomy Tags" placeholder="Search or add..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />}
              freeSolo
            />
            <Box sx={{ p: 2, bgcolor: '#f8fafd', borderRadius: 3, border: '1px solid #eef2f6' }}>
              <FormControlLabel
                control={<Switch checked={templateForm.is_free} onChange={(e) => setTemplateForm({ ...templateForm, is_free: e.target.checked })} />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>Freemium Access</Typography>
                    <Typography variant="caption" color="textSecondary">Make this template available to all registered users without subscription</Typography>
                  </Box>
                }
              />
            </Box>
            <Box sx={{ border: '2px dashed #0070f380', p: 4, borderRadius: 4, textAlign: 'center', bgcolor: '#f0f7ff', transition: 'all 0.2s', '&:hover': { borderColor: '#0070f3', bgcolor: '#e1f0ff' } }}>
              <input type="file" id="template-file" style={{ display: 'none' }} onChange={handleFileSelect} />
              <label htmlFor="template-file">
                <Box sx={{ cursor: 'pointer' }}>
                  <UploadIcon sx={{ fontSize: 40, color: '#0070f3', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0070f3', mb: 0.5 }}>{uploadFile ? 'Asset Selected' : 'Drop File Here'}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {uploadFile ? uploadFile.name : isEditing ? 'Maintain existing file or upload new version' : 'PDF, Word, or TXT up to 20MB'}
                  </Typography>
                </Box>
              </label>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 4, gap: 2 }}>
          <Button onClick={() => setUploadDialog(false)} sx={{ fontWeight: 600 }}>Close</Button>
          <Button variant="contained" size="large" onClick={saveTemplate} disabled={!templateForm.title || !templateForm.category_id} sx={{ borderRadius: 3, px: 4, fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)', bgcolor: '#0070f3' }}>
            {isEditing ? 'Synchronize Updates' : 'Execute Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 6, height: '90vh', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, py: 2, px: 3, bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.light' }}><FileIcon /></Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: -0.5 }}>{selectedTemplate?.title}</Typography>
              <Typography variant="caption" color="textSecondary">{selectedTemplate?.category_name} • Internal Asset Preview</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setPreviewDialog(false)} sx={{ bgcolor: '#f5f5f5' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {previewLoading ? (
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <CircularProgress color="inherit" size={50} />
              <Typography sx={{ mt: 2, fontWeight: 500 }}>Decrypting asset preview...</Typography>
            </Box>
          ) : previewUrl ? (
            selectedTemplate?.filename?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
              <Box sx={{ p: 2, height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} />
              </Box>
            ) : (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0`}
                title="Template Preview"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            )
          ) : (
            <Box sx={{ textAlign: 'center', color: 'white', p: 4 }}>
              <InfoIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6">Native preview unavailable</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>This file format requires local processing. Download to view.</Typography>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => downloadTemplate(selectedTemplate.id, selectedTemplate.filename)}>Download Asset</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'white' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" color="textSecondary">Enterprise Asset ID: {selectedTemplate?.id}</Typography>
          </Box>
          <Button onClick={() => setPreviewDialog(false)} sx={{ fontWeight: 600 }}>Dismiss</Button>
          <Button variant="contained" size="large" startIcon={<DownloadIcon />} onClick={() => downloadTemplate(selectedTemplate.id, selectedTemplate.filename)} sx={{ borderRadius: 3, fontWeight: 700 }}>Download Original</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Category Dialog */}
      <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)} PaperProps={{ sx: { borderRadius: 5, width: 450, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.4rem' }}>{isEditing ? 'Modify Classification' : 'New Classification'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>Classify your templates to help users find the right documents faster.</Typography>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Class Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="e.g. Legal Agreements, HR Forms"
              InputProps={{ sx: { borderRadius: 3 } }}
            />
            <TextField
              fullWidth
              label="Strategic Context"
              multiline
              rows={3}
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="Define the scope of this document category..."
              InputProps={{ sx: { borderRadius: 3 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
          <Button onClick={() => setCategoryDialog(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" size="large" onClick={saveCategory} disabled={!newCategory.name} sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>
            {isEditing ? 'Save Changes' : 'Execute Creation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} PaperProps={{ sx: { borderRadius: 5, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Permanent Deletion?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 500 }}>Confirming the removal of <strong>{selectedTemplate?.title}</strong>. This will purge the asset from Azure storage and database mirrors. This cannot be reversed.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
          <Button onClick={() => setDeleteDialog(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" size="large" onClick={deleteTemplate} sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>Purge Asset</Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Messages */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="error" variant="filled" onClose={() => setError('')} sx={{ borderRadius: 3, fontWeight: 600, boxShadow: 6 }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setSuccess('')} sx={{ borderRadius: 3, fontWeight: 600, boxShadow: 6 }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplateManagement;