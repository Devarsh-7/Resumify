import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { useEffect, lazy, Suspense } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Lazy load route pages
const LandingPage = lazy(() => import('./components/stitch-ui/LandingPage'));
const Dashboard = lazy(() => import('./components/stitch-ui/Dashboard'));
const AuthPage = lazy(() => import('./components/stitch-ui/AuthPage'));
const ResultsPage = lazy(() => import('./components/stitch-ui/ResultsPage'));
const ProfilePage = lazy(() => import('./components/stitch-ui/ProfilePage'));
const MyResumesPage = lazy(() => import('./components/stitch-ui/MyResumesPage'));
const VerifyEmailPage = lazy(() => import('./components/stitch-ui/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./components/stitch-ui/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./components/stitch-ui/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));

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
          <Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-manrope">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Loading Resumify...</p>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/analysis/:id" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/resumes" element={<PrivateRoute><MyResumesPage /></PrivateRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
