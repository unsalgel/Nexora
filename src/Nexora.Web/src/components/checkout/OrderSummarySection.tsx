import React from 'react';
import { Tag } from 'lucide-react';
import { SafeImage } from '../common/SafeImage';
import { CouponBox } from '../common/CouponBox';
import type { CartItem } from '../../context/CartContext';
import type { CouponValidationResultDto } from '../../types/coupon';

interface OrderSummarySectionProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  payableTotal: number;
  couponCode?: string | null;
  appliedCoupon?: CouponValidationResultDto | null;
  onCouponApplied?: (coupon: CouponValidationResultDto) => void;
  onCouponRemoved?: () => void;
}

export const OrderSummarySection: React.FC<OrderSummarySectionProps> = ({
  cartItems,
  subtotal,
  shippingFee,
  discountAmount,
  payableTotal,
  couponCode,
  appliedCoupon,
  onCouponApplied,
  onCouponRemoved,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
        Sipariş Özeti ({cartItems.length} Ürün)
      </h3>

      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1">
        {cartItems.map((item) => (
          <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                <SafeImage
                  src={item.productImageUrl}
                  alt={item.productName}
                  className="max-h-full object-contain"
                />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 line-clamp-1 max-w-[140px]">{item.productName}</h4>
                <span className="text-[11px] text-slate-400 font-medium">{item.quantity} Adet</span>
              </div>
            </div>
            <span className="font-bold text-slate-900 shrink-0">
              {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
            </span>
          </div>
        ))}
      </div>

      {onCouponApplied && onCouponRemoved && (
        <div className="pt-3 border-t border-slate-100">
          <CouponBox
            appliedCoupon={appliedCoupon || null}
            cartSubtotal={subtotal}
            discountAmount={discountAmount}
            onCouponApplied={onCouponApplied}
            onCouponRemoved={onCouponRemoved}
          />
        </div>
      )}

      <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
        <div className="flex justify-between text-slate-500 font-medium">
          <span>Ara Toplam</span>
          <span>{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
        </div>
        <div className="flex justify-between text-slate-500 font-medium">
          <span>Kargo</span>
          <span className={shippingFee === 0 ? 'text-emerald-600 font-bold' : ''}>
            {shippingFee === 0 ? 'BEDAVA' : `${shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`}
          </span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600 font-semibold items-center">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Kupon İndirimi ({couponCode})
            </span>
            <span>-{discountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
          </div>
        )}
        <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-100">
          <span>Toplam Tutar</span>
          <span className="text-orange-600 font-black">
            {payableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
          </span>
        </div>
      </div>
    </div>
  );
};
