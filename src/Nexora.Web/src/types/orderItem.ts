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
