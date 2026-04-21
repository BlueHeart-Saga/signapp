import React, { useState, useEffect } from 'react';
import { 
  FaUserPlus, 
  FaTimes, 
  FaTrash, 
  FaUsers,
  FaEnvelope,
  FaSearch,
  FaPaperPlane,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEdit,
  FaUserCheck,
  FaEye,
  FaFileAlt,
  FaSignature,
  FaUserFriends,
  FaPlus,
  FaDownload
} from 'react-icons/fa';
import { recipientAPI, RecipientRoles, RoleDescriptions } from '../services/api';
import '../style/RecipientSelector.css';

export default function RecipientManager({ document, onUpdate, defaultTab = 'manage' }) {

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [recipients, setRecipients] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('signing_order');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    email: '',
    signing_order: 1,
    role: RecipientRoles.SIGNER,
    form_fields: [],
    witness_for: ''
  });

  const [bulkForm, setBulkForm] = useState({
    name_template: 'Recipient {number}',
    email_domain: 'example.com',
    count: 1,
    signing_order_start: 1,
    role: RecipientRoles.SIGNER
  });

  const [emailForm, setEmailForm] = useState({
    message: 'Please review and take appropriate action on this document'
  });

  // Load recipients and roles when modal opens
  useEffect(() => {
    if (showModal && document?.id) {
      loadRecipients();
      loadRoles();
    }
  }, [showModal, document?.id]);

  useEffect(() => {
  setShowModal(true);
}, []);



  const loadRecipients = async () => {
    if (!document?.id) {
      setError('No document selected');
      return;
    }

    try {
      setError('');
      const data = await recipientAPI.getRecipients(document.id);
      
      if (Array.isArray(data)) {
        setRecipients(data);
        setRecipientForm(prev => ({
          ...prev,
          signing_order: data.length + 1
        }));
        setBulkForm(prev => ({
          ...prev,
          signing_order_start: data.length + 1
        }));
      } else {
        setError('Invalid response from server');
        setRecipients([]);
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setRecipients([]);
    }
  };

  const loadRoles = async () => {
    try {
      const roles = await recipientAPI.getRoles();
      setAvailableRoles(roles);
    } catch (error) {
      console.error('Error loading roles:', error);
      // Fallback to default roles if API fails
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

  const getErrorMessage = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      
      if (error.response.status === 422) {
        if (Array.isArray(data.detail)) {
          return data.detail.map(err => 
            `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`
          ).join(', ');
        } else if (data.detail) {
          return data.detail;
        }
      }
      
      if (typeof data === 'string') return data;
      if (data.detail) return data.detail;
      if (data.message) return data.message;
      if (Array.isArray(data)) {
        return data.map(err => err.msg || err.message).join(', ');
      }
    }
    return error.message || 'An unexpected error occurred';
  };

  // Utility function to safely get role string
  const getRoleString = (role) => {
    if (typeof role === 'string') return role;
    if (role && typeof role === 'object' && role.value) return role.value;
    return RecipientRoles.SIGNER;
  };

  // Utility function to format role for display
  const formatRoleDisplay = (role) => {
    const roleStr = getRoleString(role);
    return roleStr.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Recipient Management Functions
  const handleRecipientInputChange = (e) => {
    const { name, value, type } = e.target;
    setRecipientForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 1 : value
    }));
  };

  const handleBulkInputChange = (e) => {
    const { name, value, type } = e.target;
    setBulkForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 1 : value
    }));
  };

  const validateRecipientForm = () => {
    if (!recipientForm.name.trim()) {
      setError('Please enter recipient name');
      return false;
    }
    if (!recipientForm.email.trim()) {
      setError('Please enter recipient email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(recipientForm.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (recipientForm.role === RecipientRoles.WITNESS && !recipientForm.witness_for) {
      setError('Please select a signer to witness for Witness role');
      return false;
    }
    setError('');
    return true;
  };

  const handleAddRecipient = async (e) => {
    e.preventDefault();
    
    if (!document?.id) {
      setError('No document selected');
      return;
    }

    if (!validateRecipientForm()) return;

    setLoading(true);
    try {
      setError('');
      
      const requestData = {
        recipients: [{
          name: recipientForm.name.trim(),
          email: recipientForm.email.trim(),
          signing_order: recipientForm.signing_order,
          role: recipientForm.role,
          form_fields: recipientForm.form_fields,
          witness_for: recipientForm.witness_for || undefined
        }]
      };
      
      const response = await recipientAPI.addRecipients(document.id, requestData);
      
      if (response && Array.isArray(response.recipients)) {
        setSuccess('Recipient added successfully!');
        resetRecipientForm();
        await loadRecipients();
        if (onUpdate) onUpdate();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error adding recipient:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBulkRecipients = async (e) => {
    e.preventDefault();
    
    if (!document?.id) {
      setError('No document selected');
      return;
    }

    if (bulkForm.count < 1 || bulkForm.count > 1000) {
      setError('Count must be between 1 and 1000');
      return;
    }

    setLoading(true);
    try {
      setError('');
      const response = await recipientAPI.addBulkRecipients(document.id, bulkForm);
      
      if (response && Array.isArray(response.recipients)) {
        setSuccess(`Successfully added ${response.recipients.length} recipients!`);
        await loadRecipients();
        if (onUpdate) onUpdate();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error adding bulk recipients:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetRecipientForm = () => {
    setRecipientForm({
      name: '',
      email: '',
      signing_order: recipients.length + 1,
      role: RecipientRoles.SIGNER,
      form_fields: [],
      witness_for: ''
    });
    setError('');
  };

  const handleDeleteRecipient = async (recipientId) => {
    if (!window.confirm('Are you sure you want to delete this recipient?')) return;
    
    try {
      setError('');
      await recipientAPI.deleteRecipient(recipientId);
      setSuccess('Recipient deleted successfully!');
      await loadRecipients();
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting recipient:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    }
  };

  // Email Sending Functions
  const handleEmailInputChange = (e) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendInvites = async () => {
    if (!document?.id) {
      setError('No document selected');
      return;
    }

    if (recipients.length === 0) {
      setError('Please add recipients first');
      setActiveTab('manage');
      return;
    }

    const pendingRecipients = getPendingRecipients();
    if (pendingRecipients.length === 0) {
      setError('All recipients have completed their required actions');
      return;
    }

    setSending(true);
    try {
      setError('');
      await recipientAPI.sendSigningInvites(document.id, {
        recipient_ids: pendingRecipients.map(r => r.id),
        message: emailForm.message
      });

      setSuccess(`Invitations sent to ${pendingRecipients.length} recipients!`);
      await loadRecipients();
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error sending invitations:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleSendReminder = async (recipientId) => {
    if (!window.confirm('Send reminder to this recipient?')) return;
    
    try {
      setError('');
      await recipientAPI.sendReminder(recipientId);
      setSuccess('Reminder sent successfully!');
      await loadRecipients();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error sending reminder:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    }
  };

  // Utility Functions
  const getRoleIcon = (role) => {
    const roleStr = getRoleString(role);
    const icons = {
      [RecipientRoles.SIGNER]: <FaSignature />,
      [RecipientRoles.APPROVER]: <FaUserCheck />,
      [RecipientRoles.VIEWER]: <FaEye />,
      [RecipientRoles.FORM_FILLER]: <FaFileAlt />,
      [RecipientRoles.WITNESS]: <FaUserFriends />,
      [RecipientRoles.IN_PERSON_SIGNER]: <FaUserCheck />
    };
    return icons[roleStr] || <FaUserPlus />;
  };

  const getStatusBadgeClass = (recipient) => {
    const role = getRoleString(recipient.role);
    const status = recipient.status || 'pending';
    
    if (status === 'signed' || 
        (role === RecipientRoles.APPROVER && recipient.approved_at) ||
        (role === RecipientRoles.FORM_FILLER && recipient.form_completed_at) ||
        (role === RecipientRoles.WITNESS && recipient.witnessed_at)) {
      return 'status-completed';
    }
    
    const statusClasses = {
      pending: 'status-pending',
      sent: 'status-sent',
      invited: 'status-invited',
      delivered: 'status-delivered',
      viewed: 'status-viewed'
    };
    return statusClasses[status] || 'status-pending';
  };

  const getStatusText = (recipient) => {
    const role = getRoleString(recipient.role);
    const status = recipient.status || 'pending';
    
    if (role === RecipientRoles.SIGNER && recipient.signed_at) return 'signed';
    if (role === RecipientRoles.APPROVER && recipient.approved_at) return 'approved';
    if (role === RecipientRoles.FORM_FILLER && recipient.form_completed_at) return 'completed';
    if (role === RecipientRoles.WITNESS && recipient.witnessed_at) return 'witnessed';
    
    return status;
  };

  const getPendingRecipients = () => {
    return recipients.filter(recipient => {
      const role = getRoleString(recipient.role);
      
      switch (role) {
        case RecipientRoles.SIGNER:
          return !recipient.signed_at;
        case RecipientRoles.APPROVER:
          return !recipient.approved_at;
        case RecipientRoles.FORM_FILLER:
          return !recipient.form_completed_at;
        case RecipientRoles.WITNESS:
          return !recipient.witnessed_at;
        case RecipientRoles.VIEWER:
          return false; // Viewers don't have actions
        case RecipientRoles.IN_PERSON_SIGNER:
          return !recipient.signed_at;
        default:
          return true;
      }
    });
  };

  const getCompletedRecipients = () => {
    return recipients.filter(recipient => {
      const role = getRoleString(recipient.role);
      
      switch (role) {
        case RecipientRoles.SIGNER:
          return !!recipient.signed_at;
        case RecipientRoles.APPROVER:
          return !!recipient.approved_at;
        case RecipientRoles.FORM_FILLER:
          return !!recipient.form_completed_at;
        case RecipientRoles.WITNESS:
          return !!recipient.witnessed_at;
        case RecipientRoles.VIEWER:
          return true; // Viewers are always "completed"
        case RecipientRoles.IN_PERSON_SIGNER:
          return !!recipient.signed_at;
        default:
          return false;
      }
    });
  };

  // Filter and sort recipients
  const filteredRecipients = recipients
    .filter(recipient => {
      const name = recipient.name || '';
      const email = recipient.email || '';
      const role = formatRoleDisplay(recipient.role);
      
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             email.toLowerCase().includes(searchTerm.toLowerCase()) ||
             role.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'role':
          return formatRoleDisplay(a.role).localeCompare(formatRoleDisplay(b.role));
        case 'status':
          return getStatusText(a).localeCompare(getStatusText(b));
        case 'signing_order':
        default:
          return (a.signing_order || 0) - (b.signing_order || 0);
      }
    });

  const pendingRecipients = getPendingRecipients();
  const completedRecipients = getCompletedRecipients();
  const signers = recipients.filter(r => getRoleString(r.role) === RecipientRoles.SIGNER);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  

  return (
    <>
      

        <div className="modal-backdrop">
          <div className="modal recipient-manager-modal">
            <div className="modal-header">
              <h3>
                <FaUsers className="header-icon" />
                Manage Recipients - {document?.filename || 'Unknown Document'}
              </h3>
              <button 
                className="close-btn"
                onClick={() => {
  setShowModal(false);
  resetRecipientForm();
  setError('');
  setSuccess('');
  onUpdate && onUpdate();   // notify parent to unmount
}}

              >
                <FaTimes />
              </button>
            </div>

            {error && (
              <div className="error-banner">
                <FaExclamationTriangle />
                <span>{error}</span>
                <button onClick={() => setError('')} className="error-close">
                  <FaTimes />
                </button>
              </div>
            )}

            {success && (
              <div className="success-banner">
                <FaCheckCircle />
                <span>{success}</span>
                <button onClick={() => setSuccess('')} className="success-close">
                  <FaTimes />
                </button>
              </div>
            )}

            <div className="modal-tabs">
              <button 
                className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
                onClick={() => setActiveTab('manage')}
              >
                <FaUserPlus className="tab-icon" />
                Add Recipients
              </button>
              <button 
                className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                <FaUsers className="tab-icon" />
                All Recipients ({recipients.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
                onClick={() => setActiveTab('send')}
              >
                <FaPaperPlane className="tab-icon" />
                Send Invites ({pendingRecipients.length})
              </button>
            </div>

            <div className="modal-content">
              {activeTab === 'manage' && (
                <div className="tab-content">
                  <div className="add-recipient-section">
                    <div className="section-tabs">
                      <button className="section-tab active">Single Recipient</button>
                      <button className="section-tab">Bulk Add</button>
                    </div>

                    <div className="recipient-form-container">
                      <h4>Add Single Recipient</h4>
                      <form onSubmit={handleAddRecipient} className="recipient-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Name *</label>
                            <input
                              type="text"
                              name="name"
                              value={recipientForm.name}
                              onChange={handleRecipientInputChange}
                              placeholder="Enter recipient name"
                              required
                              disabled={loading}
                            />
                          </div>
                          <div className="form-group">
                            <label>Email *</label>
                            <input
                              type="email"
                              name="email"
                              value={recipientForm.email}
                              onChange={handleRecipientInputChange}
                              placeholder="Enter recipient email"
                              required
                              disabled={loading}
                            />
                          </div>
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label>Role *</label>
                            <select
                              name="role"
                              value={recipientForm.role}
                              onChange={handleRecipientInputChange}
                              required
                              disabled={loading}
                            >
                              {availableRoles.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                            <div className="role-description">
                              {RoleDescriptions[recipientForm.role]}
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Signing Order</label>
                            <input
                              type="number"
                              name="signing_order"
                              value={recipientForm.signing_order}
                              onChange={handleRecipientInputChange}
                              min="1"
                              max="100"
                              disabled={loading}
                            />
                            <small>Lower numbers act first</small>
                          </div>
                        </div>

                        {recipientForm.role === RecipientRoles.WITNESS && (
                          <div className="form-row">
                            <div className="form-group">
                              <label>Witness For *</label>
                              <select
                                name="witness_for"
                                value={recipientForm.witness_for}
                                onChange={handleRecipientInputChange}
                                required
                                disabled={loading}
                              >
                                <option value="">Select a signer</option>
                                {signers.map(signer => (
                                  <option key={signer.id} value={signer.id}>
                                    {signer.name} ({signer.email})
                                  </option>
                                ))}
                              </select>
                              <small>Select the signer you are witnessing</small>
                            </div>
                          </div>
                        )}

                        {recipientForm.role === RecipientRoles.FORM_FILLER && (
                          <div className="form-row">
                            <div className="form-group full-width">
                              <label>Form Fields (Optional)</label>
                              <input
                                type="text"
                                name="form_fields"
                                value={recipientForm.form_fields.join(', ')}
                                onChange={(e) => setRecipientForm(prev => ({
                                  ...prev,
                                  form_fields: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                                }))}
                                placeholder="Enter field names separated by commas"
                                disabled={loading}
                              />
                              <small>e.g., name, address, phone number</small>
                            </div>
                          </div>
                        )}

                        <div className="form-actions">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !document?.id}
                          >
                            {loading ? 'Adding...' : 'Add Recipient'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'list' && (
                <div className="tab-content">
                  <div className="recipients-list-section">
                    <div className="section-header">
                      <h4>All Recipients</h4>
                      <div className="list-controls">
                        <div className="search-box">
                          <FaSearch className="search-icon" />
                          <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading}
                          />
                        </div>
                        <select 
                          value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value)}
                          className="sort-select"
                          disabled={loading}
                        >
                          <option value="signing_order">Signing Order</option>
                          <option value="name">Name</option>
                          <option value="email">Email</option>
                          <option value="role">Role</option>
                          <option value="status">Status</option>
                        </select>
                      </div>
                    </div>

                    <div className="summary-cards">
                      <div className="summary-card total">
                        <div className="card-icon">
                          <FaUsers />
                        </div>
                        <div className="card-content">
                          <div className="card-value">{recipients.length}</div>
                          <div className="card-label">Total Recipients</div>
                        </div>
                      </div>
                      <div className="summary-card pending">
                        <div className="card-icon">
                          <FaClock />
                        </div>
                        <div className="card-content">
                          <div className="card-value">{pendingRecipients.length}</div>
                          <div className="card-label">Pending</div>
                        </div>
                      </div>
                      <div className="summary-card completed">
                        <div className="card-icon">
                          <FaCheckCircle />
                        </div>
                        <div className="card-content">
                          <div className="card-value">{completedRecipients.length}</div>
                          <div className="card-label">Completed</div>
                        </div>
                      </div>
                    </div>

                    {filteredRecipients.length === 0 ? (
                      <div className="empty-state">
                        <FaUsers className="empty-icon" />
                        <p>No recipients found</p>
                        <small>Add recipients to start the document process</small>
                      </div>
                    ) : (
                      <div className="recipients-list">
                        {filteredRecipients.map(recipient => (
                          <div key={recipient.id} className="recipient-item">
                            <div className="recipient-avatar">
                              {getRoleIcon(recipient.role)}
                            </div>
                            <div className="recipient-info">
                              <div className="recipient-main">
                                <div className="recipient-name">{recipient.name}</div>
                                <div className="recipient-email">
                                  <FaEnvelope className="email-icon" />
                                  {recipient.email}
                                </div>
                                <div className="recipient-role">
                                  <span className="role-badge">
                                    {getRoleIcon(recipient.role)}
                                    {formatRoleDisplay(recipient.role)}
                                  </span>
                                </div>
                              </div>
                              <div className="recipient-meta">
                                <div className="meta-item">
                                  <span className="meta-label">Status:</span>
                                  <span className={`status-badge ${getStatusBadgeClass(recipient)}`}>
                                    {getStatusText(recipient)}
                                  </span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-label">Order:</span>
                                  <span className="order-badge">{recipient.signing_order}</span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-label">Added:</span>
                                  <span className="date">{formatDate(recipient.added_at)}</span>
                                </div>
                                {recipient.signed_at && (
                                  <div className="meta-item">
                                    <span className="meta-label">Signed:</span>
                                    <span className="date">{formatDate(recipient.signed_at)}</span>
                                  </div>
                                )}
                                {recipient.approved_at && (
                                  <div className="meta-item">
                                    <span className="meta-label">Approved:</span>
                                    <span className="date">{formatDate(recipient.approved_at)}</span>
                                  </div>
                                )}
                                {recipient.witness_for && (
                                  <div className="meta-item">
                                    <span className="meta-label">Witness For:</span>
                                    <span className="witness-for">
                                      {recipients.find(r => r.id === recipient.witness_for)?.name || 'Unknown'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="recipient-actions">
                              <button
                                onClick={() => handleSendReminder(recipient.id)}
                                className="btn btn-warning btn-sm"
                                title="Send Reminder"
                                disabled={getStatusText(recipient) === 'completed' || loading}
                              >
                                <FaClock />
                              </button>
                              <button
                                onClick={() => handleDeleteRecipient(recipient.id)}
                                className="btn btn-danger btn-sm"
                                title="Delete recipient"
                                disabled={getStatusText(recipient) === 'completed' || loading}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'send' && (
                <div className="tab-content">
                  <div className="email-settings">
                    <h4>Send Action Requests</h4>
                    
                    <div className="form-group">
                      <label>Custom Message to Recipients</label>
                      <textarea
                        name="message"
                        value={emailForm.message}
                        onChange={handleEmailInputChange}
                        placeholder="Add a personal message explaining what action is required..."
                        rows="4"
                        disabled={sending}
                      />
                    </div>

                    <div className="email-info">
                      <FaExclamationTriangle className="info-icon" />
                      <div className="info-text">
                        <strong>How it works:</strong>
                        <p>Recipients will receive a role-based email with an OTP and a secure link. Each role has specific instructions and actions.</p>
                      </div>
                    </div>
                  </div>

                  <div className="recipients-summary">
                    <h4>Recipients to Notify</h4>

                    {recipients.length === 0 ? (
                      <div className="empty-state">
                        <FaUsers className="empty-icon" />
                        <p>No recipients added</p>
                        <button 
                          className="btn btn-outline"
                          onClick={() => setActiveTab('manage')}
                        >
                          Add Recipients First
                        </button>
                      </div>
                    ) : (
                      <div className="send-recipients-list">
                        {recipients.map(recipient => (
                          <div key={recipient.id} className="send-recipient-item">
                            <div className="recipient-avatar">
                              {getRoleIcon(recipient.role)}
                            </div>
                            <div className="recipient-details">
                              <div className="name-email">
                                <div className="name">{recipient.name}</div>
                                <div className="email">{recipient.email}</div>
                                <div className="role">
                                  {formatRoleDisplay(recipient.role)}
                                </div>
                              </div>
                              <div className="recipient-status">
                                <span className={`status ${getStatusBadgeClass(recipient)}`}>
                                  {getStatusText(recipient)}
                                </span>
                                <span className="order">Order: {recipient.signing_order}</span>
                              </div>
                            </div>
                            <div className="recipient-actions">
                              {getStatusText(recipient) !== 'completed' && (
                                <button
                                  onClick={() => handleSendReminder(recipient.id)}
                                  className="btn btn-warning btn-sm"
                                  title="Send Reminder"
                                  disabled={sending}
                                >
                                  <FaClock />
                                  Remind
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="send-action-section">
                    <button
                      onClick={handleSendInvites}
                      className="btn btn-primary send-btn"
                      disabled={sending || pendingRecipients.length === 0 || !document?.id}
                    >
                      {sending ? (
                        <>
                          <FaPaperPlane className="btn-icon spinning" />
                          Sending Requests...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="btn-icon" />
                          Send Action Requests to {pendingRecipients.length} Recipient{pendingRecipients.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </button>
                    
                    {pendingRecipients.length > 0 && (
                      <div className="send-info">
                        <p>
                          <strong>Note:</strong> Each recipient will receive a role-specific email 
                          with a unique OTP that they'll need to complete their assigned action.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="footer-stats">
                <span>Total: {recipients.length}</span>
                <span>Pending: {pendingRecipients.length}</span>
                <span>Completed: {completedRecipients.length}</span>
              </div>
              <button
                onClick={() => {
  setShowModal(false);
  resetRecipientForm();
  setError('');
  setSuccess('');
  onUpdate && onUpdate();   // notify parent to unmount
}}

                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>

    </>
  );
}
