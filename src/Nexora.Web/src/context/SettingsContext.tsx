import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { apiClient } from '../lib/apiClient';
import { ENV } from '../lib/env';
import type { ApiResponse } from '../lib/apiClient';
import type { CategoryDto, CategoryStatusChangedPayload } from '../types/category';

export interface SiteSettings {
  siteTitle: string;
  contactEmail: string;
  contactPhone: string;
  freeShippingThreshold: number;
  shippingCost: number;
  announcementText: string;
  isAnnouncementActive: boolean;
}

const defaultSettings: SiteSettings = {
  siteTitle: 'Nexora - Alışverişin Yeni Adresi',
  contactEmail: 'destek@nexora.com',
  contactPhone: '0850 123 45 67',
  freeShippingThreshold: 150,
  shippingCost: 29.90,
  announcementText: '150 TL ve Üzeri Alışverişlerde Kargo Ücretsiz!',
  isAnnouncementActive: true
};

interface SettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  refetch: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: false,
  refetch: () => {}
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [liveSettings, setLiveSettings] = useState<SiteSettings | null>(null);

  const { data, isLoading, refetch } = useQuery<ApiResponse<SiteSettings>>({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SiteSettings>>('/settings');
      return res.data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const settings = liveSettings || data?.data || defaultSettings;

  useEffect(() => {
    let connection: HubConnection | null = null;

    try {
      connection = new HubConnectionBuilder()
        .withUrl(ENV.HUBS.APP)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      connection.on('SiteSettingsUpdated', (updatedSettings: SiteSettings) => {
        setLiveSettings(updatedSettings);
        queryClient.setQueryData(['site-settings'], { isSuccess: true, data: updatedSettings });
      });

      connection.on('CategoryStatusChanged', (payload: CategoryStatusChangedPayload) => {
        queryClient.setQueryData<ApiResponse<{ id: string; name: string }[]>>(['navbar-categories'], (old) => {
          if (!old || !old.data) return old;
          if (!payload.isActive) {
            return {
              ...old,
              data: old.data.filter((c) => c.id !== payload.id)
            };
          } else {
            const exists = old.data.some((c) => c.id === payload.id);
            if (!exists) {
              return {
                ...old,
                data: [...old.data, { id: payload.id, name: payload.name }].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
              };
            }
            return {
              ...old,
              data: old.data.map((c) => c.id === payload.id ? { ...c, name: payload.name } : c)
            };
          }
        });

        queryClient.setQueryData<ApiResponse<CategoryDto[]>>(['categories'], (old) => {
          if (!old || !old.data) return old;
          if (!payload.isActive) {
            return {
              ...old,
              data: old.data.filter((c) => c.id !== payload.id)
            };
          } else {
            const exists = old.data.some((c) => c.id === payload.id);
            if (!exists) {
              const newCategory: CategoryDto = {
                id: payload.id,
                name: payload.name,
                description: payload.description || '',
                parentCategoryId: payload.parentCategoryId || null,
                parentCategoryName: null,
                isActive: true,
                subCategories: []
              };
              return {
                ...old,
                data: [...old.data, newCategory].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
              };
            }
            return {
              ...old,
              data: old.data.map((c) => c.id === payload.id ? { ...c, name: payload.name, isActive: true } : c)
            };
          }
        });
      });

      connection.start().catch((err) => {
        console.warn('SignalR connection failed:', err);
      });
    } catch {}

    return () => {
      if (connection) {
        connection.stop().catch(() => {});
      }
    };
  }, [queryClient]);

  useEffect(() => {
    const rawTitle = (settings.siteTitle || 'Nexora - Alışverişin Yeni Adresi').trim() + '   ';
    let currentTitle = rawTitle;

    const interval = setInterval(() => {
      currentTitle = currentTitle.substring(1) + currentTitle.substring(0, 1);
      document.title = currentTitle;
    }, 250);

    return () => clearInterval(interval);
  }, [settings.siteTitle]);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refetch }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
