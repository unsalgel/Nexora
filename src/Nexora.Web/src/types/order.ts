export interface OrderItemDto {
  id: string;
  productId?: string | null;
  productName: string;
  productVariantId?: string | null;
  variantSKU?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

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
