import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { APIProvider } from './context/APIContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import MedicalAnalyzer from './pages/MedicalAnalyzer';
import LegalAnalyzer from './pages/LegalAnalyzer';
import Comparison from './pages/Comparison';

// Private route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-bold">Verifying session...</p>
      </div>
    );
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

// Auth route wrapper (redirects to home if already logged in)
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Auth Route */}
        <Route 
          path="/login" 
          element={
            <AuthRoute>
              <AuthPage />
            </AuthRoute>
          } 
        />

        {/* Private Routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/medical" 
          element={
            <PrivateRoute>
              <Navigate to="/?tab=medical" replace />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/medical/:id" 
          element={
            <PrivateRoute>
              <MedicalAnalyzer />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/legal" 
          element={
            <PrivateRoute>
              <Navigate to="/?tab=legal" replace />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/legal/:id" 
          element={
            <PrivateRoute>
              <LegalAnalyzer />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/compare" 
          element={
            <PrivateRoute>
              <Comparison />
            </PrivateRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <APIProvider>
        <AppContent />
      </APIProvider>
    </AuthProvider>
  );
}
