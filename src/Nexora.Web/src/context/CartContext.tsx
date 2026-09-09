import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../lib/apiClient';
import { useToast } from './ToastContext';

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
  addToCart: (productId: string, quantity?: number, productVariantId?: string) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { warning, success, info, error: toastError } = useToast();

  const isLoggedIn = () => !!localStorage.getItem('accessToken');

  const refreshCart = async () => {
    if (!isLoggedIn()) {
      setCart(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.get<ApiResponse<Cart>>('/cart');
      if (response.data?.isSuccess) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error('Sepet yüklenirken hata oluştu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId: string, quantity: number = 1, productVariantId?: string): Promise<boolean> => {
    if (!isLoggedIn()) {
      warning('Ürünü sepete eklemek için lütfen önce giriş yapın.');
      return false;
    }

    try {
      const response = await apiClient.post<ApiResponse<string>>('/cart/items', {
        productId,
        quantity,
        productVariantId: productVariantId || null
      });
      if (response.data?.isSuccess) {
        await refreshCart();
        success('Ürün sepetinize eklendi.');
        return true;
      }
      return false;
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      toastError(error.response?.data?.message || 'Sepete eklenirken bir hata oluştu.');
      return false;
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number): Promise<boolean> => {
    if (quantity < 1) return false;
    
    try {
      const response = await apiClient.put<ApiResponse<string>>(`/cart/items/${cartItemId}`, {
        quantity
      });
      if (response.data?.isSuccess) {
        await refreshCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sepet güncellenirken hata oluştu:', error);
      return false;
    }
  };

  const removeFromCart = async (cartItemId: string): Promise<boolean> => {
    try {
      const response = await apiClient.delete<ApiResponse<string>>(`/cart/items/${cartItemId}`);
      if (response.data?.isSuccess) {
        await refreshCart();
        info('Ürün sepetten kaldırıldı.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sepetten silerken hata oluştu:', error);
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    try {
      const response = await apiClient.delete<ApiResponse<string>>('/cart');
      if (response.data?.isSuccess) {
        setCart(null);
        info('Sepetiniz temizlendi.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sepet temizlenirken hata oluştu:', error);
      return false;
    }
  };

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{
      cart,
      isLoading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart, bir CartProvider içerisinde kullanılmalıdır.');
  }
  return context;
};
