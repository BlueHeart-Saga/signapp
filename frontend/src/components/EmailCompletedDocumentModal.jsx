import React, { useState, useEffect } from 'react';
import { X, Send, Mail, CheckCircle, AlertCircle, Copy, User } from 'lucide-react';
import api from '../services/api';
import '../style/EmailCompletedDocumentModal.css';

const EmailCompletedDocumentModal = ({ 
  open, 
  onClose, 
  documentId, 
  documentName,
  documentStatus,
  envelopeId 
}) => {
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentStatus, setSentStatus] = useState(null);
  const [emailHistory, setEmailHistory] = useState([]);

  useEffect(() => {
    if (open && documentId) {
      loadRecipients();
      loadEmailHistory();
      setSubject(`Completed Document: ${documentName || 'Document'}`);
      setMessage(`Hello,\n\nPlease find attached the completed document "${documentName || 'Document'}" with all signatures.\n\nThis document has been fully executed and is ready for your records.\n\nBest regards,\nDocument Team`);
    }
  }, [open, documentId, documentName]);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/${documentId}/recipients`);
      const recipientsList = response.data || [];
      setRecipients(recipientsList);
      // Select all recipients by default
      setSelectedRecipients(recipientsList.map(r => r.id));
    } catch (error) {
      console.error('Error loading recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailHistory = async () => {
    try {
      const response = await api.get(`/documents/${documentId}/email-status`);
      if (response.data.recent_email_logs) {
        setEmailHistory(response.data.recent_email_logs);
      }
    } catch (error) {
      console.error('Error loading email history:', error);
    }
  };

  const handleRecipientToggle = (recipientId) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map(r => r.id));
    }
  };

  const handleSendEmails = async () => {
    if (selectedRecipients.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    try {
      setSending(true);
      setSentStatus(null);

      const payload = {
        recipients: recipients
          .filter(r => selectedRecipients.includes(r.id))
          .map(r => ({
            email: r.email,
            name: r.name || r.email
          })),
        subject: subject,
        body: message,
        document_name: documentName || 'Document',
        include_certificate: true
      };

      const response = await api.post(`/documents/${documentId}/email/completed`, payload);

      if (response.data.success) {
        setSentStatus({
          success: true,
          message: `Successfully sent completed document to ${response.data.sent_count} recipient(s)`,
          failed: response.data.failed_recipients || []
        });
        loadEmailHistory(); // Refresh history
      } else {
        setSentStatus({
          success: false,
          message: response.data.message || 'Failed to send emails'
        });
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      setSentStatus({
        success: false,
        message: error.response?.data?.detail || 'Failed to send emails'
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (!open) return null;

  return (
    <div className="email-modal-overlay">
      <div className="email-modal-container">
        {/* Header */}
        <div className="email-modal-header">
          <div className="email-modal-title-section">
            <div className="email-modal-icon">
              <Mail size={20} />
            </div>
            <div>
              <h2>Send Completed Document</h2>
              <p className="email-modal-subtitle">
                {documentName} • {envelopeId ? `Envelope: ${envelopeId}` : 'No Envelope ID'}
              </p>
            </div>
          </div>
          <button className="email-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Status Banner */}
        {documentStatus !== 'completed' && (
          <div className="email-status-banner warning">
            <AlertCircle size={16} />
            <span>Document is not completed yet. Only completed documents can be sent to recipients.</span>
          </div>
        )}

        {sentStatus && (
          <div className={`email-status-banner ${sentStatus.success ? 'success' : 'error'}`}>
            {sentStatus.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{sentStatus.message}</span>
            {sentStatus.failed?.length > 0 && (
              <small>Failed: {sentStatus.failed.join(', ')}</small>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="email-modal-content">
          {/* Left Column - Recipients */}
          <div className="email-recipients-column">
            <div className="email-section-header">
              <h3>Recipients</h3>
              <button 
                className="email-select-all-btn"
                onClick={handleSelectAll}
                type="button"
              >
                {selectedRecipients.length === recipients.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {loading ? (
              <div className="email-loading">Loading recipients...</div>
            ) : recipients.length === 0 ? (
              <div className="email-empty">No recipients found</div>
            ) : (
              <div className="email-recipients-list">
                {recipients.map(recipient => (
                  <div 
                    key={recipient.id} 
                    className={`email-recipient-item ${selectedRecipients.includes(recipient.id) ? 'selected' : ''}`}
                    onClick={() => handleRecipientToggle(recipient.id)}
                  >
                    <div className="email-recipient-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedRecipients.includes(recipient.id)}
                        onChange={() => {}}
                      />
                    </div>
                    <div className="email-recipient-info">
                      <div className="email-recipient-name">
                        {recipient.name || recipient.email}
                        <span className="email-recipient-role">
                          {recipient.role?.replace('_', ' ') || 'Recipient'}
                        </span>
                      </div>
                      <div className="email-recipient-email">
                        {recipient.email}
                      </div>
                      {recipient.status && (
                        <div className={`email-recipient-status ${recipient.status}`}>
                          {recipient.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Email History */}
            {emailHistory.length > 0 && (
              <div className="email-history-section">
                <h4>Recent Email History</h4>
                <div className="email-history-list">
                  {emailHistory.slice(0, 3).map((log, index) => (
                    <div key={index} className="email-history-item">
                      <div className="email-history-icon">
                        <Mail size={12} />
                      </div>
                      <div className="email-history-content">
                        <div className="email-history-recipient">
                          {log.recipient || log.recipient_email}
                        </div>
                        <div className="email-history-time">
                          {formatDate(log.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Email Content */}
          <div className="email-content-column">
            <div className="email-section-header">
              <h3>Email Content</h3>
            </div>

            <div className="email-input-group">
              <label>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="email-subject-input"
              />
            </div>

            <div className="email-input-group">
              <label>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                className="email-message-textarea"
                rows={8}
              />
            </div>

            <div className="email-attachment-info">
              <div className="email-attachment-header">
                <span>📎 Attachments</span>
                <span className="email-attachment-count">2 files</span>
              </div>
              <ul className="email-attachment-list">
                <li className="email-attachment-item">
                  <div className="email-attachment-icon">📄</div>
                  <div className="email-attachment-details">
                    <div className="email-attachment-name">
                      {documentName || 'document'}_signed.pdf
                    </div>
                    <div className="email-attachment-desc">
                      Completed document with all signatures
                    </div>
                  </div>
                </li>
                <li className="email-attachment-item">
                  <div className="email-attachment-icon">📋</div>
                  <div className="email-attachment-details">
                    <div className="email-attachment-name">
                      certificate_of_completion.pdf
                    </div>
                    <div className="email-attachment-desc">
                      Certificate of completion
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="email-options-section">
              <div className="email-option">
                <input type="checkbox" id="include-certificate" defaultChecked />
                <label htmlFor="include-certificate">Include certificate of completion</label>
              </div>
              <div className="email-option">
                <input type="checkbox" id="send-to-me" />
                <label htmlFor="send-to-me">Send a copy to myself</label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="email-modal-footer">
          <button 
            className="email-cancel-btn"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>
          <div className="email-footer-right">
            <button 
              className="email-test-btn"
              onClick={() => alert('Test email feature coming soon')}
              disabled={sending}
            >
              Send Test Email
            </button>
            <button 
              className="email-send-btn"
              onClick={handleSendEmails}
              disabled={sending || documentStatus !== 'completed'}
            >
              {sending ? (
                <>
                  <div className="email-spinner"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send to {selectedRecipients.length} Recipient(s)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailCompletedDocumentModal;
