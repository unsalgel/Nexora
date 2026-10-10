import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import { useToast } from './ToastContext';
import { resolveImageUrl } from '../lib/imageUtils';
import { useAccessToken } from '../lib/session';
export interface ProductItem {
  id: string;
  title: string;
  price: number;
  oldPrice: number;
  image: string;
  category?: string;
}
interface FavoriteProductDto {
  productId: string;
  productName: string;
  productPrice: number;
  productMainImageUrl?: string;
}
interface FavoritesContextType {
  favorites: ProductItem[];
  page: number;
  totalPages: number;
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  setPage: (page: number) => void;
  toggleFavorite: (product: ProductItem) => Promise<void>;
  isFavorite: (id: string) => boolean;
  refreshFavorites: () => Promise<void>;
}
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
export const FavoritesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const token = useAccessToken();
  const [page, setPage] = useState(1);
  const pending = useRef(new Set<string>());
  const queryClient = useQueryClient();
  const { warning, success, info, error } = useToast();
  const idsQuery = useQuery({
    queryKey: ['favorite-ids'], enabled: !!token,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<string[]>>('/favorites/ids');
      if (!res.data.isSuccess)
        throw new Error(res.data.message);
      return res.data.data;
    }
  });
  const favoritesQuery = useQuery({
    queryKey: ['favorites', page], enabled: !!token,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<FavoriteProductDto>>>('/favorites', { params: { page, pageSize: 10 } });
      if (!res.data.isSuccess)
        throw new Error(res.data.message);
      const data = res.data.data;
      return data;
    }
  });
  useEffect(() => {
    if (favoritesQuery.data && page > 1 && favoritesQuery.data.totalPages < page)
      setPage(Math.max(1, favoritesQuery.data.totalPages));
  }, [favoritesQuery.data, page]);
  const refreshFavorites = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['favorites'] }), queryClient.invalidateQueries({ queryKey: ['favorite-ids'] })]);
  };
  const isFavorite = (id: string) => !!token && (idsQuery.data || []).includes(id);
  const toggleFavorite = async (product: ProductItem) => {
    if (!token) {
      warning('Favorilere eklemek için lütfen önce giriş yapın.');
      return;
    }
    if (pending.current.has(product.id))
      return;
    if (!idsQuery.data || idsQuery.isError) {
      warning('Favoriler yüklenemedi. Lütfen tekrar deneyin.');
      void refreshFavorites();
      return;
    }
    pending.current.add(product.id);
    const exists = isFavorite(product.id);
    try {
      const res = exists ? await apiClient.delete<ApiResponse<string>>(`/favorites/${product.id}`) : await apiClient.post<ApiResponse<string>>(`/favorites/${product.id}`);
      if (!res.data.isSuccess)
        throw new Error(res.data.message);
      queryClient.setQueryData<string[]>(['favorite-ids'], previous => exists ? previous?.filter(id => id !== product.id) : [...(previous || []), product.id]);
      if (exists)
        info('Ürün favorilerinizden kaldırıldı.');
      else
        success('Ürün favorilerinize eklendi.');
    }
    catch {
      error('Favoriler güncellenemedi. Lütfen tekrar deneyin.');
    }
    finally {
      pending.current.delete(product.id);
      await refreshFavorites();
    }
  };
  const favorites = (favoritesQuery.data?.items || []).map(item => ({ id: item.productId, title: item.productName, price: item.productPrice, oldPrice: 0, image: resolveImageUrl(item.productMainImageUrl) }));
  return <FavoritesContext.Provider value={{ favorites, page, setPage, totalPages: favoritesQuery.data?.totalPages || 0, totalCount: favoritesQuery.data?.totalCount || 0, isLoading: favoritesQuery.isLoading, isError: favoritesQuery.isError || idsQuery.isError, toggleFavorite, isFavorite, refreshFavorites }}>{children}</FavoritesContext.Provider>;
};
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context)
    throw new Error('useFavorites, bir FavoritesProvider içerisinde kullanılmalıdır.');
  return context;
};
