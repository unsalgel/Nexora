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
