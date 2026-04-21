// components/BulkRecipientsDialog.jsx
import React, { useState } from 'react';
import {
  FaUsers, FaTimes, FaPlus, FaTrash, FaCopy,
  FaFileImport, FaDownload, FaUpload, FaCheck
} from 'react-icons/fa';

const BulkRecipientsDialog = ({
  open,
  onClose,
  onImport,
  contactGroups,
  availableRoles,
  currentSigningOrder = 1
}) => {
  const [mode, setMode] = useState('manual'); // 'manual', 'template', 'import'
  const [recipients, setRecipients] = useState([]);
  const [template, setTemplate] = useState({
    name_template: 'Recipient {number}',
    email_domain: 'example.com',
    count: 5,
    signing_order_start: currentSigningOrder,
    role: 'signer',
    save_to_contacts: false,
    contact_group: ''
  });
  const [importText, setImportText] = useState('');
  const [errors, setErrors] = useState({});

  const addManualRecipient = () => {
    setRecipients([
      ...recipients,
      {
        id: Date.now(),
        name: '',
        email: '',
        signing_order: recipients.length + currentSigningOrder,
        role: 'signer',
        save_to_contacts: false,
        contact_group: '',
        mark_as_favorite: false
      }
    ]);
  };

  const updateRecipient = (index, field, value) => {
    const newRecipients = [...recipients];
    newRecipients[index] = { ...newRecipients[index], [field]: value };
    
    // Auto-adjust signing order if needed
    if (field === 'signing_order') {
      const order = parseInt(value) || 1;
      if (order < 1) value = 1;
      if (order > 100) value = 100;
    }
    
    newRecipients[index][field] = value;
    setRecipients(newRecipients);
  };

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const generateTemplateRecipients = () => {
    const generated = [];
    for (let i = 0; i < template.count; i++) {
      const number = i + 1;
      generated.push({
        id: `temp-${Date.now()}-${number}`,
        name: template.name_template.replace('{number}', number),
        email: `recipient${number}@${template.email_domain}`,
        signing_order: template.signing_order_start + i,
        role: template.role,
        save_to_contacts: template.save_to_contacts,
        contact_group: template.contact_group,
        mark_as_favorite: false
      });
    }
    setRecipients(generated);
  };

  const parseImportText = () => {
    const lines = importText.trim().split('\n');
    const imported = lines
      .filter(line => line.trim())
      .map((line, index) => {
        const parts = line.split(/[,\t]/).map(p => p.trim());
        return {
          id: `import-${Date.now()}-${index}`,
          name: parts[0] || `Recipient ${index + 1}`,
          email: parts[1] || `recipient${index + 1}@example.com`,
          signing_order: index + currentSigningOrder,
          role: parts[2] || 'signer',
          save_to_contacts: false,
          contact_group: '',
          mark_as_favorite: false
        };
      });
    setRecipients(imported);
  };

  const validateRecipients = () => {
    const validationErrors = [];
    
    recipients.forEach((recipient, index) => {
      if (!recipient.name.trim()) {
        validationErrors.push(`Row ${index + 1}: Name is required`);
      }
      
      if (!recipient.email.trim()) {
        validationErrors.push(`Row ${index + 1}: Email is required`);
      } else if (!/\S+@\S+\.\S+/.test(recipient.email)) {
        validationErrors.push(`Row ${index + 1}: Valid email is required`);
      }
      
      if (recipient.role === 'witness' && !recipient.witness_for) {
        validationErrors.push(`Row ${index + 1}: Witness must specify signer`);
      }
    });
    
    if (validationErrors.length > 0) {
      setErrors({ submit: validationErrors.join('\n') });
      return false;
    }
    
    return true;
  };

  const handleImport = () => {
    if (recipients.length === 0) {
      setErrors({ submit: 'No recipients to import' });
      return;
    }
    
    if (!validateRecipients()) {
      return;
    }
    
    // Prepare data for API
    const recipientsData = recipients.map(recipient => ({
      name: recipient.name.trim(),
      email: recipient.email.trim(),
      signing_order: Number(recipient.signing_order),
      role: recipient.role,
      save_to_contacts: recipient.save_to_contacts,
      contact_group: recipient.contact_group || undefined,
      mark_as_favorite: recipient.mark_as_favorite
    }));
    
    onImport(recipientsData);
  };

  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog bulk-dialog">
        <div className="dialog-header">
          <h3>
            <FaUsers /> Bulk Add Recipients
          </h3>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>

        <div className="dialog-body">
          {/* Mode Selector */}
          <div className="mode-selector">
            <button
              className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
              onClick={() => setMode('manual')}
            >
              <FaPlus /> Manual Entry
            </button>
            <button
              className={`mode-btn ${mode === 'template' ? 'active' : ''}`}
              onClick={() => setMode('template')}
            >
              <FaCopy /> Template
            </button>
            <button
              className={`mode-btn ${mode === 'import' ? 'active' : ''}`}
              onClick={() => setMode('import')}
            >
              <FaFileImport /> Import
            </button>
          </div>

          {/* Content based on mode */}
          <div className="bulk-content">
            {mode === 'manual' && (
              <div className="manual-entry">
                <div className="section-header">
                  <h4>Add Multiple Recipients</h4>
                  <button onClick={addManualRecipient} className="btn btn-outline btn-sm">
                    <FaPlus /> Add Row
                  </button>
                </div>
                
                {recipients.length === 0 ? (
                  <div className="empty-state">
                    <p>No recipients added yet. Click "Add Row" to start.</p>
                  </div>
                ) : (
                  <div className="recipients-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name *</th>
                          <th>Email *</th>
                          <th>Role</th>
                          <th>Order</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipients.map((recipient, index) => (
                          <tr key={recipient.id}>
                            <td>
                              <input
                                type="text"
                                value={recipient.name}
                                onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                                placeholder="Name"
                                className={!recipient.name ? 'error' : ''}
                              />
                            </td>
                            <td>
                              <input
                                type="email"
                                value={recipient.email}
                                onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                                placeholder="Email"
                                className={!recipient.email ? 'error' : ''}
                              />
                            </td>
                            <td>
                              <select
                                value={recipient.role}
                                onChange={(e) => updateRecipient(index, 'role', e.target.value)}
                              >
                                {availableRoles.map(role => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={recipient.signing_order}
                                onChange={(e) => updateRecipient(index, 'signing_order', e.target.value)}
                                min="1"
                                max="100"
                                style={{ width: '60px' }}
                              />
                            </td>
                            <td>
                              <button
                                onClick={() => removeRecipient(index)}
                                className="btn-icon danger"
                                title="Remove"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {mode === 'template' && (
              <div className="template-entry">
                <div className="template-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name Template</label>
                      <input
                        type="text"
                        value={template.name_template}
                        onChange={(e) => setTemplate({...template, name_template: e.target.value})}
                        placeholder="Recipient {number}"
                      />
                      <small>Use {"{number}"} for sequential numbering</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Email Domain</label>
                      <input
                        type="text"
                        value={template.email_domain}
                        onChange={(e) => setTemplate({...template, email_domain: e.target.value})}
                        placeholder="example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Number of Recipients</label>
                      <input
                        type="number"
                        value={template.count}
                        onChange={(e) => setTemplate({...template, count: parseInt(e.target.value) || 1})}
                        min="1"
                        max="100"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Starting Order</label>
                      <input
                        type="number"
                        value={template.signing_order_start}
                        onChange={(e) => setTemplate({...template, signing_order_start: parseInt(e.target.value) || 1})}
                        min="1"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={template.role}
                        onChange={(e) => setTemplate({...template, role: e.target.value})}
                      >
                        {availableRoles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={template.save_to_contacts}
                        onChange={(e) => setTemplate({...template, save_to_contacts: e.target.checked})}
                      />
                      Save to Contacts
                    </label>
                  </div>
                  
                  {template.save_to_contacts && (
                    <div className="form-group">
                      <label>Contact Group</label>
                      <select
                        value={template.contact_group}
                        onChange={(e) => setTemplate({...template, contact_group: e.target.value})}
                      >
                        <option value="">Select a group</option>
                        {contactGroups.map(group => (
                          <option key={group.name} value={group.name}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <button onClick={generateTemplateRecipients} className="btn btn-outline">
                    <FaCopy /> Generate Recipients
                  </button>
                </div>
              </div>
            )}

            {mode === 'import' && (
              <div className="import-entry">
                <div className="import-instructions">
                  <h4>Import from Text</h4>
                  <p>Enter one recipient per line in format: Name, Email, Role (optional)</p>
                  <p>Example:</p>
                  <pre>
                    John Doe, john@example.com, signer{'\n'}
                    Jane Smith, jane@example.com, approver{'\n'}
                    Bob Wilson, bob@example.com
                  </pre>
                </div>
                
                <div className="import-textarea">
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste your recipients here..."
                    rows={10}
                  />
                  <button onClick={parseImportText} className="btn btn-outline">
                    <FaUpload /> Parse Text
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {recipients.length > 0 && (
            <div className="recipients-preview">
              <h4>Preview ({recipients.length} recipients)</h4>
              <div className="preview-list">
                {recipients.slice(0, 5).map(recipient => (
                  <div key={recipient.id} className="preview-item">
                    <span className="preview-name">{recipient.name || 'Unnamed'}</span>
                    <span className="preview-email">{recipient.email || 'No email'}</span>
                    <span className="preview-role">{recipient.role}</span>
                    <span className="preview-order">Order #{recipient.signing_order}</span>
                  </div>
                ))}
                {recipients.length > 5 && (
                  <div className="preview-more">
                    ... and {recipients.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.submit && (
            <div className="error-message">
              {errors.submit.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <div className="footer-stats">
            {recipients.length} recipients ready
          </div>
          <button
            onClick={handleImport}
            className="btn btn-primary"
            disabled={recipients.length === 0}
          >
            <FaUsers /> Add {recipients.length} Recipients
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkRecipientsDialog;
