import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminRoute } from './components/auth/AdminRoute';
import { AdminLayout } from './components/layout/AdminLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
          
          {/* Admin Korumalı Rotalar */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/products" element={<div className="text-slate-900 font-bold">Ürün Yönetimi Hazırlanıyor...</div>} />
              <Route path="/categories" element={<div className="text-slate-900 font-bold">Kategori Yönetimi Hazırlanıyor...</div>} />
              <Route path="/brands" element={<div className="text-slate-900 font-bold">Marka Yönetimi Hazırlanıyor...</div>} />
              <Route path="/orders" element={<div className="text-slate-900 font-bold">Sipariş Yönetimi Hazırlanıyor...</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
