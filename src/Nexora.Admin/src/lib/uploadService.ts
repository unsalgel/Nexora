import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';

export interface UploadResult {
  isSuccess: boolean;
  url?: string;
  errorMessage?: string;
}

export const uploadImage = async (file: File): Promise<UploadResult> => {
  if (!file.type.startsWith('image/')) {
    return {
      isSuccess: false,
      errorMessage: 'Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WEBP).'
    };
  }

  const maxSizeBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isSuccess: false,
      errorMessage: "Görsel boyutu 5 MB'dan küçük olmalıdır."
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await apiClient.post<ApiResponse<string>>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (res.data?.isSuccess && res.data.data) {
      return {
        isSuccess: true,
        url: res.data.data
      };
    }

    return {
      isSuccess: false,
      errorMessage: res.data?.message || 'Görsel yüklenemedi.'
    };
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    return {
      isSuccess: false,
      errorMessage: error.response?.data?.message || 'Görsel sunucuya yüklenirken hata oluştu.'
    };
  }
};
