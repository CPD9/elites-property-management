import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import AdminDashboard from './components/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import PaymentCallback from './components/PaymentCallback';
import ProtectedRoute from './components/ProtectedRoute';
import React from 'react';
import TenantDashboard from './components/TenantDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tenant" 
              element={
                <ProtectedRoute role="tenant">
                  <TenantDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tenant-dashboard" 
              element={
                <ProtectedRoute role="tenant">
                  <TenantDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment/callback" 
              element={
                <ProtectedRoute role="tenant">
                  <PaymentCallback />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;