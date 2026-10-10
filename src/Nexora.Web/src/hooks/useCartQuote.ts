import { useQuery } from '@tanstack/react-query';
import { apiClient, type ApiResponse } from '../lib/apiClient';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import type { CartQuote } from '../lib/cartQuote';
export const useCartQuote = (couponCode?: string) => {
  const { cart, isMutating } = useCart();
  const { settings } = useSettings();
  const cartRevision = JSON.stringify(cart?.items.map(item => [item.id, item.quantity, item.unitPrice]));
  return useQuery({
    queryKey: ['cart-quote', cartRevision, couponCode || '', settings.shippingCost, settings.freeShippingThreshold],
    queryFn: async () => {
      const response = await apiClient.post<ApiResponse<CartQuote>>('/cart/quote', { couponCode: couponCode || null });
      if (!response.data.isSuccess)
        throw new Error(response.data.message || 'Sepet tutarı hesaplanamadı.');
      return response.data.data;
    },
    enabled: !!cart?.items.length && !isMutating,
    retry: false,
    staleTime: 0,
  });
};
