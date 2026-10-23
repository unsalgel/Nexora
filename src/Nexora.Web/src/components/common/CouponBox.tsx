import React, { useState } from 'react';
import { Ticket, Check, X, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { apiClient } from '../../lib/apiClient';
import type { ApiResponse } from '../../lib/apiClient';
import type { CouponValidationResultDto } from '../../types/coupon';
import { useToast } from '../../context/ToastContext';

export interface CouponBoxProps {
  appliedCoupon: CouponValidationResultDto | null;
  cartSubtotal: number;
  discountAmount?: number;
  onCouponApplied: (coupon: CouponValidationResultDto) => void;
  onCouponRemoved: () => void;
  disabled?: boolean;
}

export const CouponBox: React.FC<CouponBoxProps> = ({
  appliedCoupon,
  cartSubtotal,
  discountAmount,
  onCouponApplied,
  onCouponRemoved,
  disabled = false,
}) => {
  const { showToast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim();
    if (!cleanCode) {
      showToast('Lütfen bir kupon kodu giriniz.', 'warning');
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const response = await apiClient.post<ApiResponse<CouponValidationResultDto>>('/coupons/validate', {
        code: cleanCode,
        cartTotalAmount: cartSubtotal,
      });

      if (response.data?.isSuccess && response.data.data) {
        onCouponApplied(response.data.data);
        setCouponCode('');
        showToast(response.data.message || 'Kupon başarıyla uygulandı!', 'success');
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiResponse<unknown>>;
      const errorMessage = axiosError.response?.data?.message || 'Kupon doğrulanırken bir hata oluştu.';
      showToast(errorMessage, 'error');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode('');
    showToast('Kupon kaldırıldı.', 'info');
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <Ticket className="w-4 h-4 text-orange-500" />
        <span>İndirim Kuponu</span>
      </h3>

      {appliedCoupon ? (
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase">{appliedCoupon.couponCode}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Uygulandı</span>
              </div>
              {discountAmount != null && discountAmount > 0 && (
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  -{discountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL İndirim
                </p>
              )}
            </div>
          </div>

          <button
            aria-label="Kuponu Kaldır"
            type="button"
            onClick={handleRemoveCoupon}
            disabled={disabled}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Kuponu Kaldır"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <input
            type="text"
            aria-label="İndirim kuponu kodu"
            placeholder="Kupon Kodu (Örn: NEXORA100)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={disabled || isApplyingCoupon}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500 uppercase disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || isApplyingCoupon || !couponCode.trim()}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
          >
            {isApplyingCoupon && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Uygula</span>
          </button>
        </form>
      )}
    </div>
  );
};
