export interface PaymentInitializationResultDto {
  orderNumber?: string;
  isSuccess: boolean;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  errorMessage?: string;
}

export interface PaymentStatusDto {
  orderNumber: string;
  paymentStatus: 'Pending' | 'Unknown' | 'UnderReview' | 'RequiresAttention' | 'Success' | 'Failed' | 'Refunded';
}

export interface PaymentVerificationResultDto {
  isSuccess: boolean;
  paymentId?: string;
  orderNumber?: string;
  paidAmount: number;
  errorMessage?: string;
}
