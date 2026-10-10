import { useAccessToken, clearSession } from '../../lib/session';
import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { decodeAdminJwt } from '../../lib/jwt';

export const AdminRoute: React.FC = () => {
  const token = useAccessToken();

  const claims = token ? decodeAdminJwt(token) : null;
  const isAdmin = !!claims?.roles.includes('Admin');
  useEffect(() => { if (token && !isAdmin) clearSession(); }, [token, isAdmin]);
  if (!token) {
    return <Navigate to="/login" replace />;
  }


  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

