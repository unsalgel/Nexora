import { useAccessToken } from './lib/session';
import { decodeJwt } from './lib/jwt';
import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './context/ToastContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ChatWidget } from './features/chat';
import { SecurityNoticeBanner } from './components/common/SecurityNoticeBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
  </div>
);



export const App: React.FC = () => {
  const token = useAccessToken();
  const sessionId = token ? decodeJwt(token)?.id || 'guest' : 'guest';
  const queryClient = useMemo(() => new QueryClient({
  defaultOptions: {
    queries: {
      meta: { sessionId },
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
}), [sessionId]);
  return (
    <ErrorBoundary>
      <QueryClientProvider key={sessionId} client={queryClient}>
      <ToastProvider>
        <FavoritesProvider>
          <CartProvider>
            <SettingsProvider>
              <NotificationProvider>
                <Router>
                  <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white font-sans overflow-x-hidden">
                    <Navbar />
                    <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6">
                      <SecurityNoticeBanner />
                      <Suspense fallback={<PageLoadingFallback />}>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/products" element={<ProductsPage />} />
                          <Route path="/products/:id" element={<ProductDetailPage />} />
                          <Route path="/cart" element={<CartPage />} />
                          <Route path="/checkout" element={<CheckoutPage />} />
                          <Route path="/profile" element={<ProfilePage />} />
                          <Route path="/favorites" element={<ProfilePage />} />
                          <Route path="/orders" element={<ProfilePage />} />
                          <Route path="/addresses" element={<ProfilePage />} />
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/register" element={<RegisterPage />} />
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </Suspense>
                    </main>
                    <Footer />
                    <ChatWidget />
                  </div>
                </Router>
              </NotificationProvider>
            </SettingsProvider>
          </CartProvider>
        </FavoritesProvider>
      </ToastProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
