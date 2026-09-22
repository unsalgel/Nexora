import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, X, ShoppingBag } from 'lucide-react';

interface AdminNotification {
  id: string;
  type: 'order' | 'stock' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

interface AdminNotificationContextType {
  notifications: AdminNotification[];
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

export const AdminNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const queryClient = useQueryClient();

  const addNotification = useCallback((type: 'order' | 'stock' | 'info', title: string, message: string) => {
    const newNotif: AdminNotification = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotif, ...prev.slice(0, 4)]); // Maksimum 5 toast göster

    // 7 saniye sonra otomatik kaldır
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 7000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) return;

    let isCancelled = false;
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5285/hubs/app', {
        accessTokenFactory: () => localStorage.getItem('adminAccessToken') || '',
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    // Yeni Sipariş Dinleyicisi
    connection.on('ReceiveNewOrder', (payload: {
      orderId: string;
      orderNumber: string;
      totalAmount: number;
      createdAtUtc?: string;
    }) => {
      if (isCancelled) return;

      const formattedTotal = Number(payload.totalAmount || 0).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      addNotification(
        'order',
        'Yeni Sipariş Alındı!',
        `#${payload.orderNumber} numaralı sipariş oluşturuldu. Tutar: ${formattedTotal} TL`
      );

      // Dashboard ve Siparişler listesi cache'ini anlık tazele
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });

    // Kritik Stok Dinleyicisi
    connection.on('LowStockAlert', (payload: {
      productId: string;
      productName: string;
      productVariantId?: string | null;
      variantSku?: string | null;
      remainingStock: number;
    }) => {
      if (isCancelled) return;

      const targetName = payload.variantSku 
        ? `${payload.productName} (${payload.variantSku})` 
        : payload.productName;

      addNotification(
        'stock',
        'Kritik Stok Uyarısı!',
        `'${targetName}' ürününün stoğu ${payload.remainingStock} adede düştü.`
      );

      // Ürünler tablosu cache'ini anlık tazele
      queryClient.invalidateQueries({ queryKey: ['products'] });
    });

    connection.start().catch(() => {});

    return () => {
      isCancelled = true;
      connection.off('ReceiveNewOrder');
      connection.off('LowStockAlert');
      connection.stop().catch(() => {});
    };
  }, [addNotification, queryClient]);

  return (
    <AdminNotificationContext.Provider value={{ notifications, dismissNotification, clearAll }}>
      {children}
      {/* Toast Bildirim Listesi */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-[360px] w-full pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-lg shadow-slate-200/50 transition-all duration-200 animate-in slide-in-from-bottom-2"
          >
            <div className={`p-2 rounded-lg shrink-0 ${
              n.type === 'order' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : n.type === 'stock'
                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                : 'bg-slate-50 text-slate-600 border border-slate-100'
            }`}>
              {n.type === 'order' ? <ShoppingBag className="w-4 h-4" /> : n.type === 'stock' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0 pr-0.5">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[12px] font-semibold text-slate-900 tracking-tight">{n.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {n.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-slate-600 font-normal">{n.message}</p>
            </div>

            <button
              onClick={() => dismissNotification(n.id)}
              className="text-slate-400 hover:text-slate-700 p-1 -mr-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </AdminNotificationContext.Provider>
  );
};

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotifications bir AdminNotificationProvider içinde kullanılmalıdır.');
  }
  return context;
};
