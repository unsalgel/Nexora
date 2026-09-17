import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import type { NotificationDto } from '../types/notification';
import { useToast } from './ToastContext';

interface NotificationContextType {
  notifications: NotificationDto[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { info } = useToast();

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.get<ApiResponse<PagedResponse<NotificationDto>>>('/notifications', {
        params: { page: 1, pageSize: 50 }
      });

      if (response.data?.isSuccess && response.data.data?.items) {
        setNotifications(response.data.data.items);
      }
    } catch {
      // Sessizce devam et
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let isCancelled = false;
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5285/hubs/app', {
        accessTokenFactory: () => localStorage.getItem('accessToken') || '',
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('OrderStatusChanged', (payload: {
      notificationId?: string;
      orderId: string;
      orderNumber: string;
      title?: string;
      message: string;
      type?: string;
      newStatus: string;
      newStatusText: string;
      createdAtUtc?: string;
    }) => {
      if (isCancelled) return;

      // Anlık sıfır gecikmeli state güncellemesi (HTTP GET çağrısı yapmadan)
      if (payload.notificationId) {
        const newNotification: NotificationDto = {
          id: payload.notificationId,
          userId: '',
          title: payload.title || 'Sipariş Durumu Güncellendi',
          message: payload.message,
          type: payload.type || 'Order',
          isRead: false,
          readAtUtc: null,
          createdAtUtc: payload.createdAtUtc || new Date().toISOString()
        };

        setNotifications(prev => {
          if (prev.some(n => n.id === newNotification.id)) return prev;
          return [newNotification, ...prev];
        });
      }

      info(payload.message || `#${payload.orderNumber} numaralı siparişinizin durumu güncellendi: ${payload.newStatusText}`);
      window.dispatchEvent(new CustomEvent('nexora:order-status-changed', { detail: payload }));
    });

    connection.start().catch(() => {});

    return () => {
      isCancelled = true;
      connection.off('OrderStatusChanged');
      connection.stop().catch(() => {});
    };
  }, [fetchNotifications, info]);

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev =>
        prev.map(item => (item.id === id ? { ...item, isRead: true } : item))
      );
      await apiClient.put<ApiResponse<string>>(`/notifications/${id}/read`);
    } catch {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
      await apiClient.put<ApiResponse<string>>('/notifications/read-all');
    } catch {
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isOpen,
        setIsOpen,
        fetchNotifications,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications, bir NotificationProvider içerisinde kullanılmalıdır.');
  }
  return context;
};
