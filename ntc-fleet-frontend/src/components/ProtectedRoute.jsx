import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles, fallback = "/dashboard/unauthorized", children }) => {
  const { user } = useAuth();

  // 1. If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. If allowedRoles are specified, verify if the user's role is in the list
  // 🟢 UPDATED: Only run this check if allowedRoles is provided and has items
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  // 3. If authenticated and authorized, render children or child routes
  return children ? children : <Outlet />;
};

export default ProtectedRoute;