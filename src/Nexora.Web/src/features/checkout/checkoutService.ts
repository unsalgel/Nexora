import { apiClient, type ApiResponse } from '../../lib/apiClient';
import type { AddressDto } from '../../types/address';
import type { PaymentInitializationResultDto, PaymentStatusDto } from '../../types/payment';

export interface InitializeIyzicoPaymentParams {
  idempotencyKey: string;
  shippingAddress: string;
  expectedTotalAmount?: number;
  couponCode?: string | null;
}

export interface SaveAddressParams {
  title: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  district: string;
  detailedAddress: string;
  postalCode?: string;
  isDefault?: boolean;
}

export const checkoutService = {
  async fetchAddresses(): Promise<AddressDto[]> {
    const res = await apiClient.get<ApiResponse<AddressDto[]>>('/addresses');
    if (res.data?.isSuccess && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async saveAddress(params: SaveAddressParams): Promise<AddressDto | null> {
    const res = await apiClient.post<ApiResponse<AddressDto>>('/addresses', {
      title: params.title.trim() || 'Evim',
      fullName: params.fullName.trim(),
      phoneNumber: params.phoneNumber.trim(),
      city: params.city,
      district: params.district,
      detailedAddress: params.detailedAddress.trim(),
      postalCode: params.postalCode ?? '',
      isDefault: params.isDefault ?? false,
    });
    return res.data?.data ?? null;
  },

  async initializePayment(params: InitializeIyzicoPaymentParams): Promise<PaymentInitializationResultDto> {
    const res = await apiClient.post<ApiResponse<PaymentInitializationResultDto>>('/payments/initialize', {
      shippingAddress: params.shippingAddress,
      idempotencyKey: params.idempotencyKey,
      expectedTotalAmount: params.expectedTotalAmount,
      couponCode: params.couponCode || null,
    });

    if (res.data?.isSuccess && res.data.data) {
      return res.data.data;
    }

    throw new Error(res.data?.message || 'İyzico ödeme oturumu başlatılamadı.');
  },

  async getPaymentStatus(orderNumber: string): Promise<PaymentStatusDto> {
    const res = await apiClient.get<ApiResponse<PaymentStatusDto>>('/payments/status/' + encodeURIComponent(orderNumber));
    if (!res.data?.isSuccess || !res.data.data) throw new Error('Ödeme sonucu alınamadı.');
    return res.data.data;
  },

};
