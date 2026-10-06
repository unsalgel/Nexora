import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminRoute } from './components/auth/AdminRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminNotificationProvider } from './context/AdminNotificationContext';
import { AdminToastProvider } from './context/AdminToastContext';
import { AdminErrorBoundary } from './components/ui/AdminErrorBoundary';

// Performans optimizasyonu: Admin paneli sayfalarını rota bazında dinamik yükle (Code Splitting)
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const BrandsPage = lazy(() => import('./pages/BrandsPage').then(m => ({ default: m.BrandsPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const CouponsPage = lazy(() => import('./pages/CouponsPage').then(m => ({ default: m.CouponsPage })));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage').then(m => ({ default: m.ReviewsPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminNotFoundPage = lazy(() => import('./pages/AdminNotFoundPage').then(m => ({ default: m.AdminNotFoundPage })));

const AdminLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
  </div>
);

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
    <AdminErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AdminNotificationProvider>
          <AdminToastProvider>
            <Router>
              <Suspense fallback={<AdminLoadingFallback />}>
                <Routes>
                  <Route path="/login" element={<AdminLoginPage />} />
                
                  <Route element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/brands" element={<BrandsPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/coupons" element={<CouponsPage />} />
                      <Route path="/reviews" element={<ReviewsPage />} />
                      <Route path="/users" element={<UsersPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<AdminNotFoundPage />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<AdminNotFoundPage />} />
                </Routes>
              </Suspense>
            </Router>
      </AdminToastProvider>
    </AdminNotificationProvider>
  </QueryClientProvider>
</AdminErrorBoundary>
  );
};

export default App;
