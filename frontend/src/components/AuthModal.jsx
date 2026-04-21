// frontend/src/components/AuthModal.jsx
import React, { useState } from "react";
import { Modal, Tab, Tabs, Alert } from "react-bootstrap";
import Login from "./Login";
import Register from "./Register";

export default function AuthModal({ show, onHide, onSuccess }) {
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState("");

  const handleAuthSuccess = () => {
    setError("");
    onSuccess();
    onHide();
  };

  const handleAuthError = (errorMsg) => {
    setError(errorMsg);
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Authentication Required</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        <Tabs
          activeKey={activeTab}
          onSelect={(tab) => setActiveTab(tab)}
          className="mb-3"
        >
          <Tab eventKey="login" title="Login">
            <Login 
              onLogin={handleAuthSuccess}
              onError={handleAuthError}
              compact={true}
            />
          </Tab>
          <Tab eventKey="register" title="Register">
            <Register 
              onRegister={handleAuthSuccess}
              onError={handleAuthError}
              compact={true}
            />
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
}
