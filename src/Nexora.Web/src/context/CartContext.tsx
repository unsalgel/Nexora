import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../lib/apiClient';
import { useToast } from './ToastContext';
import { useAccessToken } from '../lib/session';
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  productVariantId?: string;
  variantSKU?: string;
  variantAttributeValues?: string[];
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  grandTotal: number;
}
interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isError: boolean;
  isMutating: boolean;
  cartCount: number;
  addToCart: (productId: string, quantity?: number, productVariantId?: string) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
export const CartProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const token = useAccessToken();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(0);
  const { warning, success, error } = useToast();
  const cartQuery = useQuery({
    queryKey: ['cart'], enabled: !!token,
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<Cart>>('/cart', { signal });
      if (!res.data.isSuccess)
        throw new Error(res.data.message);
      return res.data.data;
    }
  });
  const refreshCart = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
    await queryClient.invalidateQueries({ queryKey: ['cart-quote'] });
  }, [queryClient]);
  const mutate = async (request: () => Promise<{
    data: ApiResponse<string>;
  }>, message?: string): Promise<boolean> => {
    if (!token) {
      warning('Sepetinizi düzenlemek için lütfen giriş yapın.');
      return false;
    }
    setPending(value => value + 1);
    try {
      const res = await request();
      if (!res.data.isSuccess)
        throw new Error(res.data.message);
      await refreshCart();
      if (message)
        success(message);
      return true;
    }
    catch (err) {
      error(err instanceof AxiosError ? err.response?.data?.message || 'Sepet güncellenemedi. Lütfen tekrar deneyin.' : 'Sepet güncellenemedi. Lütfen tekrar deneyin.');
      return false;
    }
    finally {
      setPending(value => Math.max(0, value - 1));
    }
  };
  const cart = token ? cartQuery.data || null : null;
  return <CartContext.Provider value={{ cart, isLoading: cartQuery.isFetching, isError: cartQuery.isError, isMutating: pending > 0,
      addToCart: (productId, quantity = 1, productVariantId) => mutate(() => apiClient.post<ApiResponse<string>>('/cart/items', { productId, quantity, productVariantId: productVariantId || null }), 'Ürün sepetinize eklendi.'),
      updateQuantity: (id, quantity) => quantity < 1 ? Promise.resolve(false) : mutate(() => apiClient.put<ApiResponse<string>>(`/cart/items/${id}`, { quantity })),
      removeFromCart: id => mutate(() => apiClient.delete<ApiResponse<string>>(`/cart/items/${id}`), 'Ürün sepetten kaldırıldı.'),
      clearCart: () => mutate(() => apiClient.delete<ApiResponse<string>>('/cart'), 'Sepetiniz temizlendi.'), refreshCart,
      cartCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0
    }}>{children}</CartContext.Provider>;
};
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context)
    throw new Error('useCart, bir CartProvider içerisinde kullanılmalıdır.');
  return context;
};
