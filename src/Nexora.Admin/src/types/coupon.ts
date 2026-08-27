export interface CouponDto {
  id: string;
  code: string;
  discountType: 'Percentage' | 'FixedAmount' | string;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  totalUsageLimit: number;
  currentUsageCount: number;
  expirationDateUtc: string;
  isActive: boolean;
}

export interface CreateCouponDto {
  code: string;
  discountType: number;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  totalUsageLimit: number;
  expirationDateUtc: string;
}
