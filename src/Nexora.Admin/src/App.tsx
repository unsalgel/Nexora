import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLoginPage } from './pages/AdminLoginPage';
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

const TempDashboard: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-black text-white">Nexora Admin Dashboard</h1>
    <p className="text-xs text-slate-400">Yönetim paneli altyapısı başarıyla ayağa kalktı. Şimdi modülleri bağlıyoruz.</p>
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
          
          {/* Admin Korumalı Rotalar */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<TempDashboard />} />
              <Route path="/products" element={<div className="text-white font-bold">Ürün Yönetimi Hazırlanıyor...</div>} />
              <Route path="/categories" element={<div className="text-white font-bold">Kategori Yönetimi Hazırlanıyor...</div>} />
              <Route path="/brands" element={<div className="text-white font-bold">Marka Yönetimi Hazırlanıyor...</div>} />
              <Route path="/orders" element={<div className="text-white font-bold">Sipariş Yönetimi Hazırlanıyor...</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
