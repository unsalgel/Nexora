import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import { AxiosError } from 'axios';
import type { ApiResponse, PagedResponse } from '../lib/apiClient';
import { useToast } from './ToastContext';
import { resolveImageUrl } from '../lib/imageUtils';

export interface ProductItem {
  id: string;
  title: string;
  price: number;
  oldPrice: number;
  image: string;
  category?: string;
}

interface FavoriteProductDto {
  id: string;
  productId: string;
  productName: string;
  productSKU: string;
  productPrice: number;
  productMainImageUrl?: string;
  addedAtUtc: string;
}

interface FavoritesContextType {
  favorites: ProductItem[];
  toggleFavorite: (product: ProductItem) => Promise<void>;
  isFavorite: (id: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<ProductItem[]>([]);
  const { warning, success, info } = useToast();

  const isLoggedIn = () => !!localStorage.getItem('accessToken');

  const refreshFavorites = async () => {
    if (!isLoggedIn()) {
      setFavorites([]);
      return;
    }

    try {
      const response = await apiClient.get<ApiResponse<PagedResponse<FavoriteProductDto>>>('/favorites', {
        params: { page: 1, pageSize: 100 }
      });

      if (response.data?.isSuccess && response.data.data?.items) {
        const items = response.data.data.items.map(fav => ({
          id: fav.productId,
          title: fav.productName,
          price: fav.productPrice,
          oldPrice: fav.productPrice * 1.25,
          image: resolveImageUrl(fav.productMainImageUrl)
        }));
        setFavorites(items);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, []);

  const toggleFavorite = async (product: ProductItem) => {
    if (!isLoggedIn()) {
      warning('Favorilere eklemek için lütfen önce giriş yapın.');
      return;
    }

    const exists = favorites.some(item => item.id === product.id);

    try {
      if (exists) {
        const response = await apiClient.delete<ApiResponse<string>>(`/favorites/${product.id}`);
        if (response.data?.isSuccess) {
          setFavorites(prev => prev.filter(item => item.id !== product.id));
          info('Ürün favorilerinizden kaldırıldı.');
        }
      } else {
        const response = await apiClient.post<ApiResponse<string>>(`/favorites/${product.id}`);
        if (response.data?.isSuccess) {
          setFavorites(prev => [...prev, product]);
          success('Ürün favorilerinize eklendi.');
        }
      }
    } catch (err: unknown) {
      const error = err as AxiosError;
      if (error.response?.status === 409) {
        if (!exists) {
          setFavorites(prev => [...prev, product]);
        }
      } else {
        console.error(error);
      }
    }
  };

  const isFavorite = (id: string) => {
    return favorites.some(item => item.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites, bir FavoritesProvider içerisinde kullanılmalıdır.');
  }
  return context;
};
