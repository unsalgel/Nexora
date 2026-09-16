import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../lib/apiClient';

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
