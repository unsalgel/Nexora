import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { decodeAdminJwt } from '../../lib/jwt';

export const AdminRoute: React.FC = () => {
  const token = localStorage.getItem('adminAccessToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const claims = decodeAdminJwt(token);
  const isAdmin = claims?.roles.includes('Admin');

  if (!isAdmin) {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

