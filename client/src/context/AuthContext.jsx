import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token and get user info
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
        })
        .catch(err => {
          console.error("Token invalid:", err);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
  };

  const signup = async (name, email, password) => {
    // Signup no longer returns a token — user must verify email first
    const res = await api.post('/auth/signup', { name, email, password });
    // Don't set token or user — they need to verify first
    return res.data;
  };

  const verifyEmail = async (email, code) => {
    const res = await api.post('/auth/verify-email', { email, code });
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const googleLogin = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const requestPasswordReset = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (email, code, newPassword) => {
    const res = await api.post('/auth/reset-password', { email, code, newPassword });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, verifyEmail, googleLogin, requestPasswordReset, resetPassword, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
