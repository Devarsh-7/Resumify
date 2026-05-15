import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './components/stitch-ui/LandingPage';
import Dashboard from './components/stitch-ui/Dashboard';
import AuthPage from './components/stitch-ui/AuthPage';
import ResultsPage from './components/stitch-ui/ResultsPage';
import ProfilePage from './components/stitch-ui/ProfilePage';
import MyResumesPage from './components/stitch-ui/MyResumesPage';
import VerifyEmailPage from './components/stitch-ui/VerifyEmailPage';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import NotFoundPage from './components/NotFoundPage';

function App() {
  useEffect(() => {
    // Initialize dark mode on app load
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "555370562989-ao28bdk917fo1o2vlmihm4kngqtdg3u9.apps.googleusercontent.com"}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/analysis/:id" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/resumes" element={<PrivateRoute><MyResumesPage /></PrivateRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
