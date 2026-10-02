import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/ui/Toast';
import type { ToastMessage } from '../components/ui/Toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface AdminToastContextType {
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const AdminToastContext = createContext<AdminToastContextType | undefined>(undefined);

export const AdminToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  }, [dismissToast]);

  const success = useCallback((message: string) => showToast('success', message), [showToast]);
  const error = useCallback((message: string) => showToast('error', message), [showToast]);
  const warning = useCallback((message: string) => showToast('warning', message), [showToast]);
  const info = useCallback((message: string) => showToast('info', message), [showToast]);

  return (
    <AdminToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AdminToastContext.Provider>
  );
};

export const useAdminToast = (): AdminToastContextType => {
  const context = useContext(AdminToastContext);
  if (!context) {
    throw new Error('useAdminToast hook AdminToastProvider içerisinde kullanılmalıdır.');
  }
  return context;
};
