import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const ProtectedRoute = ({ children }) => {
  const { token } = useAppStore();
  const location = useLocation();

  if (!token) {
    // Redirect to login if there is no token
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
