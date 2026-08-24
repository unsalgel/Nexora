export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productVariantId?: string;
  variantSKU?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

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
}

