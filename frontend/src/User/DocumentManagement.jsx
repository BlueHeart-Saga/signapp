// frontend/src/components/DocumentManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  ProgressBar,
  Modal,
  Form,
  Alert,
  Tabs,
  Tab
} from 'react-bootstrap';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [signingStatus, setSigningStatus] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await axios.get('/api/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSigningStatus = async (documentId) => {
    try {
      const response = await axios.get(`/api/recipient/signing-status/${documentId}`);
      setSigningStatus(response.data);
      setShowStatusModal(true);
    } catch (error) {
      console.error('Failed to load signing status:', error);
    }
  };

  const sendReminder = async (recipientId) => {
    try {
      await axios.post(`/api/email/send-reminder/${recipientId}`);
      alert('Reminder sent successfully!');
      if (signingStatus) {
        loadSigningStatus(signingStatus.document.id);
      }
    } catch (error) {
      alert('Failed to send reminder');
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      'pending': 'warning',
      'sent': 'info',
      'signed': 'success',
      'declined': 'danger',
      'expired': 'secondary'
    };
    return variants[status] || 'secondary';
  };

  const getDocumentStatusVariant = (status) => {
    const variants = {
      'pending': 'warning',
      'in_progress': 'info',
      'completed': 'success',
      'expired': 'secondary',
      'cancelled': 'danger'
    };
    return variants[status] || 'secondary';
  };

  if (loading) {
    return <div>Loading documents...</div>;
  }

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <h2>Document Management</h2>
          <p className="text-muted">Manage your documents and track signing progress</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Your Documents</h5>
            </Card.Header>
            <Card.Body>
              {documents.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No documents found</p>
                  <Link to="/upload" className="btn btn-primary">
                    Upload Your First Document
                  </Link>
                </div>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Recipients</th>
                      <th>Status</th>
                      <th>Upload Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <strong>{doc.filename}</strong>
                          <br />
                          <small className="text-muted">
                            {doc.source === 'local' ? 'Local Upload' : 'External Document'}
                          </small>
                        </td>
                        <td>
                          {/* You would fetch recipient count here */}
                          <span className="text-muted">-</span>
                        </td>
                        <td>
                          <Badge bg={getDocumentStatusVariant(doc.signing_status)}>
                            {doc.signing_status || 'Not Sent'}
                          </Badge>
                        </td>
                        <td>
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => loadSigningStatus(doc.id)}
                          >
                            Track Signing
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="ms-1"
                            as={Link}
                            to={`/documents/${doc.id}`}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Signing Status Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Signing Status - {signingStatus?.document.filename}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {signingStatus && (
            <Tabs defaultActiveKey="recipients" className="mb-3">
              <Tab eventKey="recipients" title="Recipients">
                <Row className="mb-4">
                  <Col>
                    <Card>
                      <Card.Body>
                        <h6>Signing Progress</h6>
                        <ProgressBar 
                          now={signingStatus.statistics.completion_percentage} 
                          label={`${Math.round(signingStatus.statistics.completion_percentage)}%`}
                          variant="success"
                        />
                        <div className="mt-2 d-flex justify-content-between">
                          <small>
                            {signingStatus.statistics.signed_recipients} of {signingStatus.statistics.total_recipients} signed
                          </small>
                          <small>
                            {signingStatus.statistics.pending_recipients} pending
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Table responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Sent</th>
                      <th>Signed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signingStatus.recipients.map((recipient) => (
                      <tr key={recipient.id}>
                        <td>{recipient.name}</td>
                        <td>{recipient.email}</td>
                        <td>{recipient.signing_order}</td>
                        <td>
                          <Badge bg={getStatusVariant(recipient.status)}>
                            {recipient.status}
                          </Badge>
                        </td>
                        <td>
                          {recipient.sent_at ? new Date(recipient.sent_at).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          {recipient.signed_at ? new Date(recipient.signed_at).toLocaleString() : '-'}
                        </td>
                        <td>
                          {recipient.status === 'sent' && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => sendReminder(recipient.id)}
                            >
                              Send Reminder
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab>

              <Tab eventKey="activity" title="Activity Log">
                {signingStatus.recent_activity.length === 0 ? (
                  <p className="text-muted">No activity yet</p>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {signingStatus.recent_activity.map((activity, index) => (
                      <div key={index} className="mb-3 pb-3 border-bottom">
                        <div className="d-flex justify-content-between">
                          <strong>{activity.action.replace(/_/g, ' ')}</strong>
                          <small className="text-muted">
                            {new Date(activity.timestamp).toLocaleString()}
                          </small>
                        </div>
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <small className="text-muted">
                            {JSON.stringify(activity.details)}
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DocumentManagement;
