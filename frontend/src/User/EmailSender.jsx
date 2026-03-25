// components/EmailSender.js
import React, { useState } from 'react';
import { 
  FaPaperPlane, 
  FaTimes, 
  FaUserPlus, 
  FaEnvelope,
  FaClock,
  FaEdit,
  FaTrash,
  FaExclamationTriangle
} from 'react-icons/fa';
import { sendDocumentForSignature, sendReminder } from '../services/EmailAPI';
import '../style/EmailSender.css';

export default function EmailSender({ document, onSent, existingRecipients = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState(existingRecipients);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    require_signature: true,
    expiration_days: 7
  });

  const addRecipient = () => {
    setRecipients(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      email: '',
      role: 'signer',
      signing_order: prev.length + 1,
      isNew: true
    }]);
  };

  const updateRecipient = (index, field, value) => {
    setRecipients(prev => prev.map((recipient, i) => 
      i === index ? { ...recipient, [field]: value } : recipient
    ));
  };

  const removeRecipient = (index) => {
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (recipients.length === 0) {
      alert('Please add at least one recipient');
      return false;
    }

    for (let recipient of recipients) {
      if (!recipient.name.trim()) {
        alert('Please enter name for all recipients');
        return false;
      }
      if (!recipient.email.trim()) {
        alert('Please enter email for all recipients');
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(recipient.email)) {
        alert(`Please enter a valid email for ${recipient.name}`);
        return false;
      }
    }

    return true;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setSending(true);
    try {
      await sendDocumentForSignature(document.id, {
        recipients: recipients.map(rec => ({
          name: rec.name,
          email: rec.email,
          role: rec.role,
          signing_order: parseInt(rec.signing_order)
        })),
        subject: formData.subject || `Please sign: ${document.filename}`,
        message: formData.message,
        require_signature: formData.require_signature,
        expiration_days: parseInt(formData.expiration_days)
      });

      alert('Document sent successfully!');
      setShowModal(false);
      if (onSent) onSent();
    } catch (error) {
      console.error('Error sending document:', error);
      alert(error.response?.data?.detail || 'Failed to send document');
    } finally {
      setSending(false);
    }
  };

  const sendQuickReminder = async (recipientId) => {
    if (!window.confirm('Send reminder to this recipient?')) return;
    
    try {
      await sendReminder(recipientId);
      alert('Reminder sent successfully!');
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert(error.response?.data?.detail || 'Failed to send reminder');
    }
  };

  return (
    <>
      <button 
        className="btn btn-primary send-document-btn"
        onClick={() => setShowModal(true)}
      >
        <FaPaperPlane className="btn-icon" />
        Send for Signature
      </button>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal email-sender-modal">
            <div className="modal-header">
              <h3>Send Document for Signature</h3>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-content">
              {/* Document Info */}
              <div className="document-info-card">
                <h4>Document: {document.filename}</h4>
                <p>Send this document to recipients for electronic signature</p>
              </div>

              {/* Email Settings */}
              <div className="email-settings">
                <h4>Email Settings</h4>
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder={`Please sign: ${document.filename}`}
                  />
                </div>
                <div className="form-group">
                  <label>Message to Recipients</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Add a personal message to your recipients..."
                    rows="3"
                  />
                </div>
                <div className="settings-row">
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="require_signature"
                        checked={formData.require_signature}
                        onChange={handleInputChange}
                      />
                      Require Signature
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Link Expires In (days)</label>
                    <select
                      name="expiration_days"
                      value={formData.expiration_days}
                      onChange={handleInputChange}
                    >
                      <option value={1}>1 day</option>
                      <option value={3}>3 days</option>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Recipients List */}
              <div className="recipients-section">
                <div className="section-header">
                  <h4>Recipients</h4>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={addRecipient}
                  >
                    <FaUserPlus className="btn-icon" />
                    Add Recipient
                  </button>
                </div>

                {recipients.length === 0 ? (
                  <div className="empty-recipients">
                    <FaEnvelope className="empty-icon" />
                    <p>No recipients added</p>
                    <button 
                      className="btn btn-outline"
                      onClick={addRecipient}
                    >
                      Add First Recipient
                    </button>
                  </div>
                ) : (
                  <div className="recipients-list">
                    {recipients.map((recipient, index) => (
                      <div key={recipient.id} className="recipient-form-row">
                        <div className="recipient-fields">
                          <input
                            type="text"
                            placeholder="Recipient Name"
                            value={recipient.name}
                            onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                            className="name-input"
                          />
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={recipient.email}
                            onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                            className="email-input"
                          />
                          <select
                            value={recipient.role}
                            onChange={(e) => updateRecipient(index, 'role', e.target.value)}
                            className="role-select"
                          >
                            <option value="signer">Signer</option>
                            <option value="viewer">Viewer</option>
                            <option value="approver">Approver</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Order"
                            value={recipient.signing_order}
                            onChange={(e) => updateRecipient(index, 'signing_order', parseInt(e.target.value) || 1)}
                            min="1"
                            className="order-input"
                          />
                        </div>
                        <div className="recipient-actions">
                          {!recipient.isNew && recipient.status === 'pending' && (
                            <button
                              onClick={() => sendQuickReminder(recipient.id)}
                              className="btn btn-warning btn-sm"
                              title="Send Reminder"
                            >
                              <FaClock />
                            </button>
                          )}
                          <button
                            onClick={() => removeRecipient(index)}
                            className="btn btn-danger btn-sm"
                            title="Remove Recipient"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Existing Recipients Status */}
              {existingRecipients.length > 0 && (
                <div className="existing-recipients">
                  <h4>Current Recipients Status</h4>
                  <div className="status-list">
                    {existingRecipients.map(recipient => (
                      <div key={recipient.id} className="status-item">
                        <div className="recipient-info">
                          <span className="name">{recipient.name}</span>
                          <span className="email">{recipient.email}</span>
                          <span className={`status-badge status-${recipient.status}`}>
                            {recipient.status}
                          </span>
                        </div>
                        {recipient.status === 'pending' && (
                          <button
                            onClick={() => sendQuickReminder(recipient.id)}
                            className="btn btn-outline btn-sm"
                          >
                            <FaClock /> Remind
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="btn btn-primary"
                disabled={sending || recipients.length === 0}
              >
                {sending ? (
                  <>
                    <FaPaperPlane className="btn-icon spinning" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="btn-icon" />
                    Send to {recipients.length} Recipient{recipients.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}