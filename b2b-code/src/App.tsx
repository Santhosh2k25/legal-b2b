import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SearchProvider } from './contexts/SearchContext';
import Login from './pages/auth/Login';
import OnboardingSelection from './pages/auth/OnboardingSelection';
import LawyerRegistration from './pages/auth/LawyerRegistration';
import FirmRegistration from './pages/auth/FirmRegistration';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, tokenVerificationAttempted, refreshAuth } = useAuth();
  
  // Attempt to refresh auth if not authenticated and not already loading
  useEffect(() => {
    if (!isAuthenticated && !isLoading && tokenVerificationAttempted) {
      refreshAuth();
    }
  }, [isAuthenticated, isLoading, tokenVerificationAttempted, refreshAuth]);
  
  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Public route that redirects to dashboard if already authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <OnboardingSelection />
              </PublicRoute>
            } />
            <Route path="/register/lawyer" element={
              <PublicRoute>
                <LawyerRegistration />
              </PublicRoute>
            } />
            <Route path="/register/firm" element={
              <PublicRoute>
                <FirmRegistration />
              </PublicRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;
