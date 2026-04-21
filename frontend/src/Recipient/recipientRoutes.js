import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Access from '../pages/recipient/Access';
import Dashboard from '../pages/recipient/Dashboard';
import DocumentDetails from '../pages/recipient/DocumentDetails';
import History from '../pages/recipient/History';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('recipientToken');
  if (!token) {
    return <Navigate to="/recipient/access" replace />;
  }
  return children;
};

const RecipientRoutes = () => {
  return (
    <Routes>
      <Route path="access" element={<Access />} />
      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="documents/:id"
        element={
          <ProtectedRoute>
            <DocumentDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/recipient/access" replace />} />
    </Routes>
  );
};

export default RecipientRoutes;
