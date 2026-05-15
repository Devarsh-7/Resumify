import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><span className="text-indigo-600 font-bold">Loading...</span></div>;
  }

  return user ? children : <Navigate to="/auth" />;
};

export default PrivateRoute;
