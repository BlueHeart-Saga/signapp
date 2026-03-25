// components/RecipientDetailsEditor.jsx
import React, { useState, useEffect } from 'react';
import {
  FaCog, FaTimes, FaInfoCircle, FaFileAlt,
  FaCheck, FaComment, FaEnvelope
} from 'react-icons/fa';

const RecipientDetailsEditor = ({ open, onClose, recipient, onSave }) => {
  const [formData, setFormData] = useState({
    personal_message: '',
    document_info: {
      show_details: true,
      custom_message: '',
      view_instructions: 'Please review the document carefully before signing'
    }
  });

  useEffect(() => {
    if (recipient) {
      setFormData({
        personal_message: recipient.personal_message || '',
        document_info: recipient.document_info || {
          show_details: true,
          custom_message: '',
          view_instructions: 'Please review the document carefully before signing'
        }
      });
    }
  }, [recipient]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!open || !recipient) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog details-editor">
        <div className="dialog-header">
          <h3>
            <FaCog /> Edit Details for {recipient.name}
          </h3>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-body">
          <div className="form-section">
            <h4>
              <FaEnvelope /> Recipient Information
            </h4>
            
            <div className="recipient-info-summary">
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{recipient.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role:</span>
                <span className="info-value">{recipient.role}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Signing Order:</span>
                <span className="info-value">#{recipient.signing_order}</span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>
              <FaComment /> Personal Message
            </h4>
            <div className="form-group">
              <textarea
                value={formData.personal_message}
                onChange={(e) => handleChange('personal_message', e.target.value)}
                placeholder="Add a personal message for this recipient..."
                rows="3"
              />
              <small>This message will be included in the invitation email</small>
            </div>
          </div>

          <div className="form-section">
            <h4>
              <FaFileAlt /> Document Information
            </h4>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.document_info.show_details}
                  onChange={(e) => handleNestedChange(
                    'document_info',
                    'show_details',
                    e.target.checked
                  )}
                />
                Show document details to recipient
              </label>
            </div>

            {formData.document_info.show_details && (
              <>
                <div className="form-group">
                  <label>Custom Message</label>
                  <textarea
                    value={formData.document_info.custom_message}
                    onChange={(e) => handleNestedChange(
                      'document_info',
                      'custom_message',
                      e.target.value
                    )}
                    placeholder="Add specific instructions about this document..."
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Viewing Instructions</label>
                  <textarea
                    value={formData.document_info.view_instructions}
                    onChange={(e) => handleNestedChange(
                      'document_info',
                      'view_instructions',
                      e.target.value
                    )}
                    placeholder="Instructions for reviewing the document..."
                    rows="2"
                  />
                </div>
              </>
            )}
          </div>
        </form>

        <div className="dialog-footer">
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn btn-primary">
            <FaCheck /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipientDetailsEditor;