import type { OrderItemDto } from './orderItem';

export type { OrderItemDto };

export interface AdminOrderDto {
  id: string;
  orderNumber: string;
  userId: string;
  customerFullName: string;
  customerEmail: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAtUtc: string;
  totalItemCount: number;
  items: OrderItemDto[];
  trackingNumber?: string | null;
  carrier?: string | null;
}
