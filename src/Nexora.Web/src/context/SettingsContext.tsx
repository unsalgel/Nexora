import { startHubConnection } from '../lib/startHubConnection';
import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { apiClient } from '../lib/apiClient';
import { ENV } from '../lib/env';
import type { ApiResponse } from '../lib/apiClient';
import type { CategoryDto, CategoryStatusChangedPayload } from '../types/category';
import type { BrandDto, BrandStatusChangedPayload } from '../types/brand';

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
  freeShippingThreshold: 500,
  shippingCost: 29.90,
  announcementText: '',
  isAnnouncementActive: false
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

  const { data, isLoading, refetch } = useQuery<ApiResponse<SiteSettings>>({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SiteSettings>>('/settings');
      return res.data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const settings = data?.data || defaultSettings;

  useEffect(() => {
    let connection: HubConnection | null = null;
    let stop: (() => void) | undefined;

    try {
      connection = new HubConnectionBuilder()
        .withUrl(ENV.HUBS.APP)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      connection.on('SiteSettingsUpdated', (updatedSettings: SiteSettings) => {
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

      connection.on('BrandStatusChanged', (payload: BrandStatusChangedPayload) => {
        queryClient.setQueryData<ApiResponse<BrandDto[]>>(['brands'], (old) => {
          if (!old || !old.data) return old;
          if (!payload.isActive) {
            return {
              ...old,
              data: old.data.filter((b) => b.id !== payload.id)
            };
          } else {
            const exists = old.data.some((b) => b.id === payload.id);
            if (!exists) {
              const newBrand: BrandDto = {
                id: payload.id,
                name: payload.name,
                logoUrl: payload.logoUrl,
                isActive: true
              };
              return {
                ...old,
                data: [...old.data, newBrand].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
              };
            }
            return {
              ...old,
              data: old.data.map((b) => b.id === payload.id ? { ...b, name: payload.name, logoUrl: payload.logoUrl, isActive: true } : b)
            };
          }
        });
        void queryClient.invalidateQueries({ queryKey: ['brands'] });
        void queryClient.invalidateQueries({ queryKey: ['products'] });
      });

      connection.onreconnected(() => {
        void queryClient.invalidateQueries({ queryKey: ['site-settings'] });
        void queryClient.invalidateQueries({ queryKey: ['categories'] });
        void queryClient.invalidateQueries({ queryKey: ['navbar-categories'] });
        void queryClient.invalidateQueries({ queryKey: ['brands'] });
      });
      stop = startHubConnection(connection);
    } catch {}

    return () => {
      stop?.();
    };
  }, [queryClient]);

  useEffect(() => {
    const rawTitle = (settings.siteTitle || 'Nexora - Alışverişin Yeni Adresi').trim() + '   ';
    document.title = rawTitle.trim();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
