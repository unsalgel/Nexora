import type { OrderItemDto } from './orderItem';

export type { OrderItemDto };

export interface OrderDto {
  id: string;
  orderNumber: string;
  userId: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAtUtc: string;
  items: OrderItemDto[];
  trackingNumber?: string | null;
  carrier?: string | null;
  subtotal?: number | null;
  discountAmount?: number | null;
  shippingFee?: number | null;
  couponCode?: string | null;
}
