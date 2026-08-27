export interface CouponValidationResultDto {
  isValid: boolean;
  couponCode: string;
  discountType: 'Percentage' | 'FixedAmount' | string;
  discountValue: number;
  calculatedDiscountAmount: number;
  originalTotalAmount: number;
  finalTotalAmount: number;
  message: string;
}
