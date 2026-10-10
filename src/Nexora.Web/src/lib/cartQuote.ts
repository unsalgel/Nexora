import type { CartItem } from '../context/CartContext';

export interface CartQuoteItem {
  cartItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartQuote {
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string | null;
  items?: CartQuoteItem[] | null;
}

export const getQuotedCartItems = (items: CartItem[], quote?: CartQuote): CartItem[] => {
  if (!quote?.items) return items;
  const prices = new Map(quote.items.map(item => [item.cartItemId, item]));
  return items.map(item => {
    const currentPrice = prices.get(item.id);
    return currentPrice ? { ...item, unitPrice: currentPrice.unitPrice, totalPrice: currentPrice.totalPrice } : item;
  });
};
