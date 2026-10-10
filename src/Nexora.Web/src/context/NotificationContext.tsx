import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { apiClient } from '../lib/apiClient';
import { useAccessToken, clearSession } from '../lib/session';
import { ENV } from '../lib/env';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import type { NotificationDto } from '../types/notification';
import { useToast } from './ToastContext';
import { startHubConnection } from '../lib/startHubConnection';
interface NotificationContextType {
  notifications: NotificationDto[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const token = useAccessToken();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { info, error } = useToast();
  const listQuery = useInfiniteQuery({
    queryKey: ['notifications'], enabled: !!token, initialPageParam: 1, refetchInterval: 60000,
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.get<ApiResponse<PagedResponse<NotificationDto>>>('/notifications', { params: { page: pageParam, pageSize: 20 } });
      if (!res.data.isSuccess)
        throw new Error(res.data.message);
      return res.data.data;
    },
    getNextPageParam: (last, pages) => pages.length < last.totalPages ? pages.length + 1 : undefined
  });
  const countQuery = useQuery({
    queryKey: ['notification-unread-count'], enabled: !!token, refetchInterval: 60000,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<number>>('/notifications/unread-count');
      if (!res.data.isSuccess)
        throw new Error(res.data.message);
      return res.data.data;
    }
  });
  const fetchNotifications = useCallback(async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['notifications'] }), queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] })]);
  }, [queryClient]);
  useEffect(() => {
    if (!token)
      return;
    const connection = new HubConnectionBuilder().withUrl(ENV.HUBS.APP, {
      accessTokenFactory: () => localStorage.getItem('accessToken') || '',
      transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents
    }).withAutomaticReconnect().configureLogging(LogLevel.Warning).build();
    const onOrder = (payload: {
      message?: string;
      orderNumber?: string;
    }) => {
      void fetchNotifications();
      info(payload.message || `#${payload.orderNumber || ''} numaralı siparişiniz güncellendi.`);
      void queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    };
    connection.on('OrderStatusChanged', onOrder);
    connection.on('OrderCreated', onOrder);
    connection.on('AccountFrozen', () => { clearSession(); window.location.assign('/login?reason=frozen'); });
    connection.on('SessionRevoked', () => { clearSession(); window.location.assign('/login'); });
    connection.onreconnected(() => { void fetchNotifications(); void queryClient.invalidateQueries({ queryKey: ['my-orders'] }); });
    const stop = startHubConnection(connection);
    return stop;
  }, [token, queryClient, fetchNotifications, info]);
  const markAsRead = async (id: string) => {
    try {
      const res = await apiClient.put<ApiResponse<string>>(`/notifications/${id}/read`);
      if (!res.data.isSuccess)
        throw new Error(res.data.message);
    }
    catch {
      error('Bildirim okundu olarak işaretlenemedi.');
    }
    finally {
      await fetchNotifications();
    }
  };
  const markAllAsRead = async () => {
    try {
      const res = await apiClient.put<ApiResponse<string>>('/notifications/read-all');
      if (!res.data.isSuccess)
        throw new Error(res.data.message);
    }
    catch {
      error('Bildirimler güncellenemedi.');
    }
    finally {
      await fetchNotifications();
    }
  };
  const notifications = Array.from(new Map((listQuery.data?.pages.flatMap(page => page.items) || []).map(item => [item.id, item])).values());
  return <NotificationContext.Provider value={{ notifications, unreadCount: countQuery.data || 0, isLoading: listQuery.isFetching, isError: listQuery.isError || countQuery.isError, hasMore: !!listQuery.hasNextPage, loadMore: async () => { await listQuery.fetchNextPage(); }, isOpen, setIsOpen, fetchNotifications, markAsRead, markAllAsRead }}>{children}</NotificationContext.Provider>;
};
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error('useNotifications, bir NotificationProvider içerisinde kullanılmalıdır.');
  return context;
};
