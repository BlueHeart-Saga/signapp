// components/ContactDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  FaUsers, FaSearch, FaStar, FaTimes, FaUserPlus,
  FaEnvelope, FaBuilding, FaBriefcase, FaPhone, FaDownload,
  FaCheck, FaTrash, FaEdit, FaAddressBook
} from 'react-icons/fa';
import { recipientAPI } from '../services/api';

const ContactDialog = ({ open, onClose, onSelectContact }) => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    if (open) {
      loadContacts();
      loadGroups();
    }
  }, [open, showFavorites, selectedGroup]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const params = {
        favorite_only: showFavorites,
        group: selectedGroup || undefined,
        search: searchTerm || undefined,
        limit: 100
      };
      
      const data = await recipientAPI.getContacts(params);
      setContacts(data.contacts || []);
      setFilteredContacts(data.contacts || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await recipientAPI.getContactGroups();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(value.toLowerCase()) ||
        contact.email.toLowerCase().includes(value.toLowerCase()) ||
        contact.company?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const generateColor = (email) => {
    if (!email) return '#4F46E5';
    const hashCode = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    };
    const hash = hashCode(email.toLowerCase());
    const colors = ['#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED'];
    return colors[Math.abs(hash % colors.length)];
  };

  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog contact-dialog">
        <div className="dialog-header">
          <h3>
            <FaAddressBook /> Select from Contacts
          </h3>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>

        <div className="dialog-body">
          <div className="contact-controls">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <div className="filter-controls">
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`filter-btn ${showFavorites ? 'active' : ''}`}
              >
                <FaStar /> Favorites Only
              </button>
            </div>
          </div>

          {groups.length > 0 && (
            <div className="contact-groups">
              <button
                onClick={() => setSelectedGroup('')}
                className={`group-chip ${!selectedGroup ? 'active' : ''}`}
              >
                All Groups
              </button>
              {groups.map(group => (
                <button
                  key={group.name}
                  onClick={() => setSelectedGroup(group.name)}
                  className={`group-chip ${selectedGroup === group.name ? 'active' : ''}`}
                  style={{ borderLeftColor: group.color }}
                >
                  {group.name} ({group.count})
                </button>
              ))}
            </div>
          )}

          <div className="contacts-list-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading contacts...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="empty-state">
                <FaUsers className="empty-icon" />
                <p>No contacts found</p>
                {searchTerm && <p>Try a different search term</p>}
              </div>
            ) : (
              <div className="contacts-list">
                {filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    className="contact-item"
                    onClick={() => onSelectContact(contact)}
                  >
                    <div 
                      className="contact-avatar"
                      style={{ backgroundColor: generateColor(contact.email) }}
                    >
                      {getInitials(contact.name)}
                    </div>
                    
                    <div className="contact-info">
                      <div className="contact-header">
                        <div className="contact-name">
                          {contact.name}
                          {contact.is_favorite && (
                            <FaStar className="favorite-icon" />
                          )}
                        </div>
                        <div className="contact-email">
                          <FaEnvelope /> {contact.email}
                        </div>
                      </div>
                      
                      <div className="contact-details">
                        {contact.company && (
                          <span className="contact-company">
                            <FaBuilding /> {contact.company}
                          </span>
                        )}
                        {contact.title && (
                          <span className="contact-title">
                            <FaBriefcase /> {contact.title}
                          </span>
                        )}
                      </div>
                      
                      {contact.groups && contact.groups.length > 0 && (
                        <div className="contact-groups">
                          {contact.groups.map(group => (
                            <span key={group} className="group-tag">
                              {group}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button className="select-btn">
                      <FaCheck />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <div className="footer-info">
            {filteredContacts.length} contacts
          </div>
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactDialog;