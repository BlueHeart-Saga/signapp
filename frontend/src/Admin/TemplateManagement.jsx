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
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  Description as TemplateIcon,
  FileUpload as UploadIcon,
  TrendingUp as TrendingIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  FilterList as FilterIcon
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
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTemplates, setTotalTemplates] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Dialogs
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [statsDialog, setStatsDialog] = useState(false);
  
  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    description: '',
    category_id: '',
    tags: [],
    is_free: true
  });
  
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Statistics
  const [stats, setStats] = useState(null);
  
  // Available tags
  const availableTags = [
    'Contract', 'Agreement', 'Legal', 'Business', 'Personal',
    'Employment', 'Financial', 'Form', 'Application', 'Letter'
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
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      setError('Failed to load categories');
    }
  };
  
  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page + 1,
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
  
  // Create new category
  const createCategory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/templates/categories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newCategory)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create category');
      }
      
      setSuccess('Category created successfully');
      fetchCategories();
      setCategoryDialog(false);
      setNewCategory({ name: '', description: '' });
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
  
  // Upload template
  const uploadTemplate = async () => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('title', newTemplate.title);
      formData.append('description', newTemplate.description || '');
      formData.append('category_id', newTemplate.category_id);
      formData.append('tags', newTemplate.tags.join(','));
      formData.append('is_free', newTemplate.is_free.toString());
      formData.append('file', uploadFile);
      
      const response = await fetch(`${API_BASE_URL}/admin/templates/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload template');
      }
      
      const data = await response.json();
      setSuccess('Template uploaded successfully');
      fetchTemplates();
      setUploadDialog(false);
      setNewTemplate({
        title: '',
        description: '',
        category_id: '',
        tags: [],
        is_free: true
      });
      setUploadFile(null);
    } catch (err) {
      setError(err.message);
    }
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
      const response = await fetch(`${API_BASE_URL}/admin/templates/download/${templateId}`, {
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
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      
      setUploadFile(file);
    }
  };
  
  // Handle view template
  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setViewDialog(true);
  };
  
  // Handle delete template
  const handleDeleteTemplate = (template) => {
    setSelectedTemplate(template);
    setDeleteDialog(true);
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    setPage(0);
    fetchTemplates();
  };
  
  // Clear filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setPage(0);
    fetchTemplates();
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchTemplates(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
      return <Chip label="Inactive" color="error" size="small" icon={<InactiveIcon />} />;
    }
    if (!template.is_free) {
      return <Chip label="Premium" color="warning" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" icon={<ActiveIcon />} />;
  };
  
  // Statistics Card Component
  const StatCard = ({ title, value, color }) => (
    <Card>
      <CardContent>
        <Typography color="textSecondary" variant="body2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" sx={{ fontWeight: 600, color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Template Management
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage document templates and categories
        </Typography>
      </Box>
      
      {/* Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Templates" icon={<TemplateIcon />} iconPosition="start" />
          <Tab label="Categories" icon={<CategoryIcon />} iconPosition="start" />
          <Tab label="Statistics" icon={<TrendingIcon />} iconPosition="start" />
        </Tabs>
      </Paper>
      
      {/* Content based on active tab */}
      {activeTab === 0 ? (
        // Templates Tab
        <>
          {/* Statistics Summary */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Templates"
                  value={stats.summary?.total_templates || 0}
                  color="primary.main"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Active Templates"
                  value={stats.summary?.active_templates || 0}
                  color="success.main"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Free Templates"
                  value={stats.summary?.free_templates || 0}
                  color="info.main"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Categories"
                  value={categories.length}
                  color="warning.main"
                />
              </Grid>
            </Grid>
          )}
          
          {/* Action Bar */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Template Management
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => setUploadDialog(true)}
                >
                  Upload Template
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setCategoryDialog(true)}
                >
                  Add Category
                </Button>
              </Stack>
            </Box>
            
            {/* Search and Filters */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    startIcon={<FilterIcon />}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<RefreshIcon />}
                  >
                    Clear
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Templates Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress />
            </Box>
          ) : templates.length === 0 ? (
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
              <TemplateIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Templates Found
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialog(true)}
                sx={{ mt: 2 }}
              >
                Upload Your First Template
              </Button>
            </Paper>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Tags</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Downloads</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templates.map(template => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 500 }}>
                            {template.title}
                          </Typography>
                          {template.description && (
                            <Typography variant="caption" color="textSecondary">
                              {template.description.substring(0, 50)}...
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={template.category_name}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {template.tags.slice(0, 2).map((tag, index) => (
                              <Chip key={index} label={tag} size="small" />
                            ))}
                            {template.tags.length > 2 && (
                              <Chip label={`+${template.tags.length - 2}`} size="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TemplateStatusChip template={template} />
                        </TableCell>
                        <TableCell>
                          <Typography>{template.download_count || 0}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(template.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={() => handleViewTemplate(template)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={() => downloadTemplate(template.id, template.filename)}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={template.is_active ? "Deactivate" : "Activate"}>
                              <IconButton
                                size="small"
                                onClick={() => updateTemplateStatus(template.id, !template.is_active)}
                              >
                                {template.is_active ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteTemplate(template)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <TablePagination
                  component="div"
                  count={totalTemplates}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 25, 50]}
                />
              </Box>
            </>
          )}
        </>
      ) : activeTab === 1 ? (
        // Categories Tab
        <>
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Template Categories
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCategoryDialog(true)}
              >
                Add Category
              </Button>
            </Box>
            
            {categories.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CategoryIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No Categories Found
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCategoryDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Create First Category
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {categories.map(category => (
                  <Grid item xs={12} sm={6} md={4} key={category.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <CategoryIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {category.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {category.template_count || 0} templates
                            </Typography>
                          </Box>
                        </Box>
                        
                        {category.description && (
                          <Typography variant="body2" color="textSecondary" paragraph>
                            {category.description}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => {
                            if (window.confirm(`Delete category "${category.name}"?`)) {
                              deleteCategory(category.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </>
      ) : (
        // Statistics Tab
        <>
          {stats ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 4, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Template Statistics
                  </Typography>
                  
                  {/* Category Distribution */}
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                    Category Distribution
                  </Typography>
                  {stats.category_distribution?.length === 0 ? (
                    <Typography color="textSecondary">No categories with templates</Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {stats.category_distribution?.map(cat => (
                        <Grid item xs={12} sm={6} md={4} key={cat.category_id}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6">{cat.category_name}</Typography>
                              <Typography variant="h4" color="primary">
                                {cat.template_count}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                templates
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                  
                  {/* Popular Templates */}
                  {stats.popular_templates?.length > 0 && (
                    <>
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>
                        Most Downloaded Templates
                      </Typography>
                      <Grid container spacing={2}>
                        {stats.popular_templates?.map(template => (
                          <Grid item xs={12} sm={6} md={4} key={template.id}>
                            <Card>
                              <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                  {template.title}
                                </Typography>
                                <Typography variant="h5" color="primary">
                                  {template.download_count || 0}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  downloads
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress />
            </Box>
          )}
        </>
      )}
      
      {/* Dialogs */}
      {/* Category Dialog */}
      <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Category Name"
              fullWidth
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              required
            />
            
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialog(false)}>Cancel</Button>
          <Button 
            onClick={createCategory} 
            variant="contained" 
            disabled={!newCategory.name}
          >
            Create Category
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Upload Template Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload New Template</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Template Title"
              fullWidth
              required
              value={newTemplate.title}
              onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
            />
            
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            />
            
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={newTemplate.category_id}
                label="Category"
                onChange={(e) => setNewTemplate({ ...newTemplate, category_id: e.target.value })}
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Autocomplete
              multiple
              freeSolo
              options={availableTags}
              value={newTemplate.tags}
              onChange={(event, newValue) => setNewTemplate({ ...newTemplate, tags: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Tags" />
              )}
            />
            
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography>Free Template</Typography>
              <Switch
                checked={newTemplate.is_free}
                onChange={(e) => setNewTemplate({ ...newTemplate, is_free: e.target.checked })}
              />
            </Stack>
            
            {/* File Upload */}
            <Paper
              sx={{
                p: 4,
                border: '2px dashed',
                borderColor: 'primary.main',
                textAlign: 'center',
                bgcolor: 'grey.50',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              
              {uploadFile ? (
                <Box>
                  <AttachFileIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {uploadFile.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatFileSize(uploadFile.size)}
                  </Typography>
                  <Button
                    variant="text"
                    onClick={() => setUploadFile(null)}
                    sx={{ mt: 2 }}
                  >
                    Change File
                  </Button>
                </Box>
              ) : (
                <Box>
                  <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Click to select template file
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button
            onClick={uploadTemplate}
            variant="contained"
            disabled={!newTemplate.title || !newTemplate.category_id || !uploadFile}
          >
            Upload Template
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Template Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Template Details</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">{selectedTemplate.title}</Typography>
                <TemplateStatusChip template={selectedTemplate} />
              </Box>
              
              {selectedTemplate.description && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                  <Typography>{selectedTemplate.description}</Typography>
                </Box>
              )}
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                  <Chip label={selectedTemplate.category_name} />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">File</Typography>
                  <Typography>{selectedTemplate.filename}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatFileSize(selectedTemplate.file_size)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Downloads</Typography>
                  <Typography variant="h5">{selectedTemplate.download_count || 0}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Created</Typography>
                  <Typography>{formatDate(selectedTemplate.created_at)}</Typography>
                </Grid>
              </Grid>
              
              {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Tags</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedTemplate.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => downloadTemplate(selectedTemplate.id, selectedTemplate.filename)}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Template Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will permanently delete the template and its file.
          </Alert>
          <Typography>
            Are you sure you want to delete template <strong>"{selectedTemplate?.title}"</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={deleteTemplate} variant="contained" color="error">
            Delete Template
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplateManagement;